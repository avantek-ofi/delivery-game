// Simulación headless: un bot juega N días para revisar el balance de la economía.
// Uso: npx tsx scripts/sim.ts [días] [barrio] [rubro]
import { PRODUCTS, RUBROS } from '../src/game/catalog'
import { LEVELS, RESEARCH, VEHICLES, CAMPAIGNS, FACILITY } from '../src/game/content'
import { REGIONS } from '../src/game/barrios'
import * as E from '../src/game/engine'
import type { GameState, RubroId } from '../src/game/types'

const days = Number(process.argv[2] ?? 40)
let s: GameState = E.newGame({ playerName: 'Bot', storeName: 'Sim', baseBarrioId: process.argv[3] ?? 'caballito', rubro: (process.argv[4] ?? 'celus') as RubroId, tutorial: false })

const night = () => {
  if (s.pendingStory) s = E.resolveStory(s, s.pendingStory.choices[0].cost && s.pendingStory.choices[0].cost > s.capital * .5 ? 1 : 0)
  for (const g of ['primer','diez','cien-fans','equipo','local','rubros','cinco-estrellas','cien','millon','moto','galpon','mil-fans','dia-record','flota','quinientos','centro','diez-mil','hub']) s = E.claimGoal(s, g)
  // compras: llenar el depósito proporcional a popularidad
  const products = PRODUCTS.filter(p => s.rubros.includes(p.rubro) && (!p.bulky || s.level >= 2))
  const budget = s.capital * .7
  let spent = 0
  const cap = E.storageCap(s)
  for (const p of products.sort((a, b) => b.pop - a.pop)) {
    const target = Math.round(cap * .9 / products.length / p.vol * p.pop)
    const have = (s.stock[p.id] ?? 0)
    const qty = Math.max(0, target - have)
    const cost = E.unitCost(s, p, 'once') * qty
    if (qty && spent + cost < budget) { const before = s.capital; s = E.buyStock(s, p.id, qty, 'once', true); spent += before - s.capital }
  }
  const reserve = Object.values(E.dailyExpenses(s)).reduce((x, y) => x + y, 0) * 2
  s = { ...s, capital: s.capital - reserve }
  if (E.upgradePrice(s) && s.capital > E.upgradePrice(s) * 1.4) s = E.upgradeLevel(s)
  for (const r of RUBROS) if (s.rubros.length < 2 + s.level * 2 && s.ideas > r.ideas + 2 && s.capital > r.cost * 3) s = E.research(s, 'rubro:' + r.id)
  for (const r of RESEARCH) if (s.capital > r.cost * 3) s = E.research(s, r.id)
  const lostRatio = s.stats.lost / Math.max(1, s.stats.delivered + s.stats.lost)
  if (lostRatio > .25 && s.capital > 160000 * s.couriers.length * s.priceIndex && s.couriers.length < LEVELS[s.level].couriers) s = E.hire(s, s.candidates[0].id)
  for (const v of [...VEHICLES].reverse()) if (v.id !== 'bici' && s.level >= v.minLevel && s.capital > v.price * 4 && s.couriers.some(c => c.vehicle.model === 'bici' && !c.isPlayer)) { s = E.buyVehicle(s, v.id); const c = s.couriers.find(c => c.vehicle.model === 'bici' && !c.isPlayer)!; s = E.assignVehicle(s, c.id, s.garage.at(-1)!.uid) }
  for (const f of FACILITY) { const p = E.facilityPrice(s, f.id); if (p !== null && s.capital > p * 4) s = E.buyFacility(s, f.id) }
  for (const r of s.rubros) { const q = E.qualityPrice(s, r); if (q && s.capital > q.price * 5 && s.ideas > q.ideas + 5) s = E.upgradeQuality(s, r) }
  for (const r of REGIONS) if (s.level >= 3 && s.capital > E.regionPrice(s, r.id) * 1.5) s = E.openRegion(s, r.id)
  for (const camp of CAMPAIGNS) if (camp.days < 100 && s.capital > camp.cost * 6 && s.level >= camp.minLevel && Math.random() < .3) s = E.runCampaign(s, camp.id)

  s = { ...s, capital: s.capital + reserve }
}

const day = () => {
  while (s.phase === 'day' || s.phase === 'closing') {
    if (s.pendingIncident) s = E.resolveIncident(s, 0)
    for (const c of s.couriers) {
      const fresh = s.couriers.find(x => x.id === c.id)!
      if (!E.courierAvailable(s, fresh)) continue
      const waiting = s.orders.filter(o => o.status === 'waiting' && E.missingFor(s, o).length === 0).sort((a, b) => a.expiresAt - b.expiresAt)
      const chosen: string[] = []
      for (const o of waiting) { if (chosen.length >= 3) break; if (E.planRoute(s, c.id, [...chosen, o.id]).ok) chosen.push(o.id) }
      if (chosen.length) s = E.dispatch(s, c.id, chosen)
    }
    s = E.tick(s, 1.5)
  }
}

console.log('día  caja        ingresos  ganancia  entr perd  rep  fans  nivel equipo rubros idx')
night(); s = E.startDay(s)
for (let i = 0; i < days; i++) {
  day()
  const st = s.stats
  const profit = st.revenue - st.fees - st.cogs - st.expenses
  console.log(`${String(s.day).padStart(3)} ${E.money(s.capital).padStart(12)} ${E.money(st.revenue).padStart(10)} ${E.money(profit).padStart(9)} ${String(st.delivered).padStart(4)} ${String(st.lost + st.failed).padStart(4)}  ${s.rep.toFixed(1)} ${String(s.fans).padStart(5)}  ${s.level}     ${s.couriers.length}      ${s.rubros.length}   ${s.priceIndex.toFixed(2)} cuadras ${st.cuadras} mostr ${st.walkIn} reg ${s.regions.length}`)
  if (process.env.DBG) { const stockU = Object.values(s.stock).reduce((a,b)=>a+b,0); console.log('   stock', stockU, 'used', E.storageUsed(s), '/', E.storageCap(s), 'energy', s.couriers.map(c=>Math.round(c.energy)).join(','), 'veh', s.couriers.map(c=>c.vehicle.model).join(','), 'facility', JSON.stringify(s.facility), 'expenses', s.stats.expenses) }
  s = E.goToNight(s)
  if (s.phase === 'gameover') { console.log('GAME OVER'); break }
  night(); s = E.startDay(s)
}
console.log('research:', s.research.join(','))
