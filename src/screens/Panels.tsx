import { useState } from 'react'
import { coverage as coverageOf } from '../game/engine'
import { RUBROS, TIERS, productsOf, rubroById } from '../game/catalog'
import { CAMPAIGNS, GOALS, LEVELS, LOANS, RANKS, RESEARCH, STORY, VEHICLES, rankOf, vehicleById } from '../game/content'
import * as E from '../game/engine'
import type { GameState, PriceTier, RubroId } from '../game/types'
import { Bar, Modal, Stars, Tabs, fmt, money } from '../ui/common'
import { PixelIcon } from '../ui/PixelIcon'

export type PanelId = 'stock' | 'team' | 'dev' | 'ads' | 'base' | 'money' | 'goals'
type Act = (fn: (s: GameState) => GameState) => void
type P = { s: GameState; act: Act }

export const PANELS: { id: PanelId; label: string; emoji: string; key: string }[] = [
  { id: 'stock', label: 'Depósito', emoji: '📦', key: '1' },
  { id: 'team', label: 'Equipo', emoji: '🧑‍🤝‍🧑', key: '2' },
  { id: 'dev', label: 'Desarrollo', emoji: '💡', key: '3' },
  { id: 'ads', label: 'Publicidad', emoji: '📣', key: '4' },
  { id: 'base', label: 'Local', emoji: '🏪', key: '5' },
  { id: 'money', label: 'Plata', emoji: '💰', key: '6' },
  { id: 'goals', label: 'Desafíos', emoji: '🏆', key: '7' },
]

export function PanelModal({ id, s, act, onClose }: P & { id: PanelId; onClose: () => void }) {
  const meta = PANELS.find(p => p.id === id)!
  return <Modal title={<><PixelIcon emoji={meta.emoji} size={28} /> {meta.label}</>} kicker={s.phase === 'day' ? 'El juego está en pausa mientras gestionás' : `Noche del ${E.weekday(s.day)} ${s.day}`} onClose={onClose} wide>
    {id === 'stock' && <StockPanel s={s} act={act} />}
    {id === 'team' && <TeamPanel s={s} act={act} />}
    {id === 'dev' && <DevPanel s={s} act={act} />}
    {id === 'ads' && <AdsPanel s={s} act={act} />}
    {id === 'base' && <BasePanel s={s} act={act} />}
    {id === 'money' && <MoneyPanel s={s} act={act} />}
    {id === 'goals' && <GoalsPanel s={s} act={act} />}
  </Modal>
}

// ---------- Depósito ----------
function StockPanel({ s, act }: P) {
  const [rubro, setRubro] = useState<RubroId>(s.rubros[0])
  const [qty, setQty] = useState(5)
  const used = E.storageUsed(s)
  const cap = E.storageCap(s)
  const canImport = s.research.includes('import')
  const tier = E.tierOf(s, rubro)
  const r = rubroById(rubro)
  return <div className="stock-panel">
    <div className="panel-top">
      <div className="storage"><b>Depósito</b><Bar value={used} max={cap} tone={used / cap > .9 ? 'red' : 'gold'} label={`${fmt(used)} / ${fmt(cap)} de espacio (incluye lo que viene en camino)`} /></div>
      <div className="qty-pick"><span>Comprar de a</span>{[1, 5, 10, 25, 50].map(n => <button key={n} className={qty === n ? 'on' : ''} onClick={() => setQty(n)}>{n}</button>)}</div>
    </div>
    <Tabs tabs={s.rubros.map(id => ({ id, label: <><PixelIcon emoji={rubroById(id).emoji} size={18} /> {rubroById(id).name}</> }))} value={rubro} onChange={setRubro} />
    <div className="tier-row" style={{ ['--accent' as string]: r.color }}>
      <span>Política de precios del rubro:</span>
      {(Object.keys(TIERS) as PriceTier[]).map(k => <button key={k} className={tier === k ? 'on' : ''} onClick={() => act(x => E.setTier(x, rubro, k))}><b>{TIERS[k].label}</b><small>{k === 'barato' ? '-12% precio · +35% pedidos · clientes felices' : k === 'caro' ? '+18% precio · -32% pedidos · más exigentes' : 'precio de mercado'}</small></button>)}
    </div>
    <table className="stock-table">
      <thead><tr><th>Producto</th><th>Stock</th><th>Venta</th><th>Costo Once</th><th>Margen</th><th /><th>{canImport ? 'Importar (3 días)' : ''}</th>{s.research.includes('restock') && <th>Mínimo auto</th>}<th /></tr></thead>
      <tbody>{productsOf(rubro).map(p => {
        const price = E.unitPrice(s, p)
        const cost = E.unitCost(s, p, 'once')
        const imp = E.unitCost(s, p, 'import')
        const incoming = s.purchases.filter(x => x.productId === p.id).reduce((a, b) => a + b.qty, 0)
        const have = s.stock[p.id] ?? 0
        return <tr key={p.id}>
          <td className="prod"><PixelIcon emoji={p.emoji} size={30} /><div><b>{p.name}</b><small>espacio {p.vol}{p.fragile ? ' · frágil' : ''}{p.bulky ? ' · bulto (utilitario)' : ''}</small></div></td>
          <td><b className={have ? '' : 'zero'}>{have}</b>{incoming > 0 && <small className="incoming"> +{incoming} en camino</small>}</td>
          <td>{money(price)}</td>
          <td>{money(cost)}</td>
          <td className={price - cost > 0 ? 'pos' : 'neg'}>{Math.round((1 - cost / price) * 100)}%</td>
          <td><button className="btn tiny" onClick={() => act(x => E.buyStock(x, p.id, qty, 'once'))}>+{qty} · {money(cost * qty)}</button></td>
          <td>{canImport && <button className="btn tiny btn--celeste" onClick={() => act(x => E.buyStock(x, p.id, qty * 2, 'import'))}>+{qty * 2} · {money(imp * qty * 2)}</button>}</td>
          {s.research.includes('restock') && <td><input className="mini-input" type="number" min={0} max={999} value={s.autoRestock[p.id] ?? 0} onChange={e => act(x => E.setRestock(x, p.id, Number(e.target.value)))} /></td>}
          <td>{have > 0 && <button className="btn btn--ghost tiny" title="Vender a un revendedor al 50% del costo" onClick={() => act(x => E.liquidate(x, p.id, qty))}>Liquidar</button>}</td>
        </tr>
      })}</tbody>
    </table>
    <p className="help">Compras de día llegan en 2 horas; de noche, a primera hora. Los pedidos piden más lo que tenés en stock. Si falta algo, siempre podés hacer una <b>corrida a Once</b> (50% más caro).</p>
  </div>
}

// ---------- Equipo ----------
function Stat({ label, value }: { label: string; value: number }) {
  return <span className="stat"><small>{label}</small><i>{[1, 2, 3, 4, 5].map(n => <b key={n} className={n <= value ? 'on' : ''} />)}</i></span>
}
function TeamPanel({ s, act }: P) {
  const lvl = E.level(s)
  return <div className="team-panel">
    <h3 className="section-title">Tu gente <em>{s.couriers.length}/{lvl.couriers} lugares</em></h3>
    <div className="people">{s.couriers.map(c => <article key={c.id} className="person">
      <PixelIcon emoji={c.emoji} size={48} />
      <div className="person-info"><b>{c.name}{c.isPlayer ? ' (vos)' : ''}</b><small>{c.bio}</small>
        <div className="stats"><Stat label="Velocidad" value={c.speed} /><Stat label="Cuidado" value={c.care} /></div>
        <small>{c.trips} viajes · {c.isPlayer ? 'sin sueldo (vivís del negocio)' : `sueldo ${money(c.salary)}/día`}</small>
      </div>
      <div className="person-veh"><PixelIcon emoji={vehicleById(c.vehicleId).emoji} size={36} /><small>{vehicleById(c.vehicleId).name}</small>
        {s.vehicles.length > 0 && !c.trip && <select value="" onChange={e => e.target.value && act(x => E.assignVehicle(x, c.id, e.target.value))}><option value="">Cambiar vehículo…</option>{[...new Set(s.vehicles)].map(v => <option key={v} value={v}>{vehicleById(v).name}</option>)}</select>}
        {!c.isPlayer && !c.trip && <button className="btn btn--ghost tiny" onClick={() => { if (window.confirm(`¿Despedir a ${c.name}?`)) act(x => E.fire(x, c.id)) }}>Despedir</button>}
      </div>
    </article>)}</div>
    <h3 className="section-title">Buscando laburo <em>se renuevan cada noche</em></h3>
    <div className="people candidates">{s.candidates.map(c => <article key={c.id} className="person">
      <PixelIcon emoji={c.emoji} size={48} />
      <div className="person-info"><b>{c.name}</b><small>{c.bio}</small><div className="stats"><Stat label="Velocidad" value={c.speed} /><Stat label="Cuidado" value={c.care} /></div></div>
      <div className="person-veh"><b>{money(c.salary)}</b><small>por día</small><button className="btn btn--gold tiny" disabled={s.couriers.length >= lvl.couriers} onClick={() => act(x => E.hire(x, c.id))}>Contratar</button></div>
    </article>)}</div>
    <h3 className="section-title">Concesionaria <em>garage: {s.vehicles.length ? s.vehicles.map(v => vehicleById(v).emoji).join(' ') : 'vacío'}</em></h3>
    <div className="cards">{VEHICLES.map(v => { const price = Math.round(v.price * s.priceIndex); const locked = s.level < v.minLevel; return <article key={v.id} className={`card ${locked ? 'locked' : ''}`}>
      <PixelIcon emoji={v.emoji} size={52} />
      <b>{v.name}</b><small>{v.desc}</small>
      <ul className="specs"><li>Carga <b>{v.cap}</b></li><li>Velocidad <b>×{v.speed}</b></li><li>Mant. <b>{money(v.upkeep * s.priceIndex)}/día</b></li>{v.bulky && <li>Lleva bultos</li>}</ul>
      {locked ? <em className="lock">🔒 Necesitás {LEVELS[v.minLevel].name}</em> : <button className="btn tiny" disabled={price > s.capital} onClick={() => act(x => E.buyVehicle(x, v.id))}>Comprar {money(price)}</button>}
    </article> })}</div>
  </div>
}

// ---------- Desarrollo ----------
function DevPanel({ s, act }: P) {
  const ideas = Math.floor(s.ideas)
  return <div className="dev-panel">
    <div className="ideas-banner"><PixelIcon emoji="💡" size={40} /><div><b>{ideas} ideas</b><small>Ganás ideas con cada entrega (más con 5★ y pedidos especiales). Las invertís en abrir rubros y desarrollar el negocio.</small></div></div>
    <h3 className="section-title">Rubros <em>{s.rubros.length}/{RUBROS.length}</em></h3>
    <div className="cards">{RUBROS.map(r => {
      const owned = s.rubros.includes(r.id)
      const cost = Math.round(r.cost * s.priceIndex)
      const locked = s.level < r.minLevel
      return <article key={r.id} className={`card rubro ${owned ? 'owned' : ''} ${locked ? 'locked' : ''}`} style={{ ['--accent' as string]: r.color }}>
        <span className="subte-badge">{r.name[0]}</span>
        <div className="icons">{productsOf(r.id).slice(0, 3).map(p => <PixelIcon key={p.id} emoji={p.emoji} size={30} />)}</div>
        <b>{r.name}</b><small>{r.pitch}</small>
        {owned ? <em className="done">✔ Abierto</em> : locked ? <em className="lock">🔒 {LEVELS[r.minLevel].name}</em> : <button className="btn tiny" disabled={ideas < r.ideas || s.capital < cost} onClick={() => act(x => E.research(x, `rubro:${r.id}`))}>{r.ideas} 💡 · {money(cost)}</button>}
      </article>
    })}</div>
    <h3 className="section-title">Mejoras del negocio <em>{s.research.length}/{RESEARCH.length}</em></h3>
    <div className="cards">{RESEARCH.map(r => {
      const owned = s.research.includes(r.id)
      const cost = Math.round(r.cost * s.priceIndex)
      const locked = s.level < r.minLevel || (r.requires && !s.research.includes(r.requires))
      return <article key={r.id} className={`card ${owned ? 'owned' : ''} ${locked ? 'locked' : ''}`}>
        <PixelIcon emoji={r.emoji} size={44} />
        <b>{r.name}</b><small>{r.desc}</small>
        {owned ? <em className="done">✔ Hecho</em> : locked ? <em className="lock">🔒 {s.level < r.minLevel ? LEVELS[r.minLevel].name : `Requiere ${RESEARCH.find(x => x.id === r.requires)?.name}`}</em> : <button className="btn tiny" disabled={ideas < r.ideas || s.capital < cost} onClick={() => act(x => E.research(x, r.id))}>{r.ideas} 💡 · {cost ? money(cost) : 'gratis'}</button>}
        {owned && r.id === 'autodespacho' && <label className="toggle"><input type="checkbox" checked={s.autoDispatch} onChange={e => act(x => ({ ...x, autoDispatch: e.target.checked }))} /> Bot encendido</label>}
      </article>
    })}</div>
  </div>
}

// ---------- Publicidad ----------
function AdsPanel({ s, act }: P) {
  const t = E.now(s)
  const active = s.modifiers.filter(m => m.until > t)
  return <div className="ads-panel">
    <div className="fans-banner"><PixelIcon emoji="📣" size={40} /><div><b>{fmt(s.fans)} fans</b><small>Los fans traen pedidos. Se ganan con entregas de 4-5★, campañas e historias. Se pierden con cancelaciones y malas reseñas.</small></div><div className="rate"><small>Pedidos estimados por hora</small><b>{(E.demandPerMinute(s) * 60).toFixed(1)}</b></div></div>
    {active.length > 0 && <div className="active-mods">{active.map(m => <span key={m.id} className={`mod ${(m.demand ?? 1) >= 1 ? 'up' : 'down'}`}>{m.label}{m.demand ? ` · ${m.demand >= 1 ? '+' : ''}${Math.round((m.demand - 1) * 100)}%` : ''}{m.zone ? ` (${m.zone})` : ''}{m.until < Number.MAX_SAFE_INTEGER ? ` · hasta el día ${Math.floor(m.until / 1440)}` : ' · permanente'}</span>)}</div>}
    <div className="cards">{CAMPAIGNS.map(c => {
      const cost = Math.round(c.cost * s.priceIndex)
      const used = c.once && s.story.flags.includes(`camp-${c.id}`)
      const running = s.modifiers.some(m => m.id.startsWith(`camp-${c.id}`) && m.until > t)
      const locked = s.level < c.minLevel || (c.requires && !s.research.includes(c.requires))
      return <article key={c.id} className={`card ${used ? 'owned' : ''} ${locked ? 'locked' : ''}`}>
        <PixelIcon emoji={c.emoji} size={44} />
        <b>{c.name}</b><small>{c.desc}</small>
        <ul className="specs"><li>Pedidos <b>+{Math.round((c.demand - 1) * 100)}%</b>{c.zone ? ` en zona ${c.zone}` : ''}</li><li>Fans <b>+{c.fans}</b></li><li>{c.days > 100 ? 'Permanente' : `${c.days} día${c.days > 1 ? 's' : ''}`}</li></ul>
        {used ? <em className="done">✔ Pintado</em> : running ? <em className="done">▶ En curso</em> : locked ? <em className="lock">🔒 {s.level < c.minLevel ? LEVELS[c.minLevel].name : 'Requiere Instagram'}</em> : <button className="btn tiny" disabled={cost > s.capital} onClick={() => act(x => E.runCampaign(x, c.id))}>Lanzar · {money(cost)}</button>}
      </article>
    })}</div>
  </div>
}

// ---------- Local ----------
function BasePanel({ s, act }: P) {
  const lvl = E.level(s)
  const next = LEVELS[s.level + 1]
  const price = E.upgradePrice(s)
  const cov = coverageOf(s)
  return <div className="base-panel">
    <div className="levels">{LEVELS.map((l, i) => <div key={l.name} className={`lvl ${i === s.level ? 'now' : i < s.level ? 'past' : ''}`}><PixelIcon emoji={l.emoji} size={i === s.level ? 64 : 40} /><b>{l.name}</b></div>)}</div>
    <div className="base-cols">
      <article className="base-card">
        <small className="kicker">Hoy</small><h3>{lvl.emoji} {lvl.name}</h3><p>{lvl.desc}</p>
        <ul className="specs"><li>Depósito <b>{fmt(E.storageCap(s))}</b></li><li>Equipo máx. <b>{lvl.couriers}</b></li><li>Cobertura <b>{cov.length} barrios</b></li><li>Pedidos simultáneos <b>{lvl.maxCalls}</b></li><li>Alquiler <b>{money(E.dailyExpenses(s).Alquiler)}/día</b></li></ul>
      </article>
      {next ? <article className="base-card next">
        <small className="kicker">Próximo salto</small><h3>{next.emoji} {next.name}</h3><p>{next.desc}</p>
        <ul className="specs"><li>Depósito <b>{fmt(Math.round(next.storage * (s.baseBarrioId === 'barracas' ? 1.4 : 1)))}</b></li><li>Equipo máx. <b>{next.couriers}</b></li><li>Pedidos <b>+{Math.round((next.demand / lvl.demand - 1) * 100)}%</b></li><li>Alquiler <b>{money(next.rent * s.priceIndex)}/día</b></li></ul>
        <button className="btn btn--gold big" disabled={price > s.capital} onClick={() => act(E.upgradeLevel)}>Mudarse · {money(price)}</button>
        {price > s.capital && <small className="hint">Te faltan {money(price - s.capital)}</small>}
      </article> : <article className="base-card next"><h3>🏆 Llegaste a la cima</h3><p>No hay local más grande en CABA. Ahora: 10.000 fans para ser leyenda.</p></article>}
    </div>
    <h3 className="section-title">Financiamiento</h3>
    <div className="cards">{LOANS.map(l => {
      const active = s.loans.find(x => x.id === l.id)
      const disabled = Boolean(active) || (l.once && s.loanTaken.includes(l.id)) || Boolean(l.minLevel && s.level < l.minLevel)
      return <article key={l.id} className={`card ${disabled ? 'locked' : ''}`}><PixelIcon emoji={l.emoji} size={40} /><b>{l.name}</b><small>{l.desc}</small><ul className="specs"><li>Recibís <b>{money(l.amount)}</b></li></ul>
        {active ? <em className="lock">Pagando · quedan {active.daysLeft} cuotas</em> : <button className="btn tiny" disabled={disabled} onClick={() => act(x => E.takeLoan(x, l.id))}>Pedir</button>}</article>
    })}</div>
  </div>
}

// ---------- Plata ----------
function MoneyPanel({ s }: P) {
  const expenses = E.dailyExpenses(s)
  const days = s.history.slice(-14)
  const max = Math.max(1, ...days.map(d => d.revenue))
  const totalFixed = Object.values(expenses).reduce((a, b) => a + b, 0)
  return <div className="money-panel">
    <div className="kpis">
      <div><small>Caja</small><b className={s.capital < 0 ? 'neg' : ''}>{money(s.capital)}</b></div>
      <div><small>Facturación histórica</small><b>{money(s.lifetime.revenue)}</b></div>
      <div><small>Ganancia histórica</small><b className={s.lifetime.profit < 0 ? 'neg' : 'pos'}>{money(s.lifetime.profit)}</b></div>
      <div><small>Mejor día</small><b>{money(s.lifetime.bestDay)}</b></div>
      <div><small>Dólar</small><b>${fmt(s.dollar)}</b></div>
      <div><small>Inflación acumulada</small><b>{((s.priceIndex - 1) * 100).toFixed(1)}%</b></div>
    </div>
    <div className="money-cols">
      <section>
        <h3 className="section-title">Últimos días</h3>
        {days.length ? <div className="chart">{days.map(d => { const profit = d.revenue - d.fees - d.cogs - d.expenses; return <div key={d.day} className="col" title={`Día ${d.day}: facturaste ${money(d.revenue)}, ganancia ${money(profit)}`}>
          <i className="rev" style={{ height: `${(d.revenue / max) * 100}%` }} /><i className={profit >= 0 ? 'profit' : 'loss'} style={{ height: `${(Math.abs(profit) / max) * 100}%` }} /><small>{d.day}</small>
        </div> })}</div> : <p className="help">Todavía no cerraste ningún día.</p>}
        <p className="legend"><i className="rev" /> facturación <i className="profit" /> ganancia <i className="loss" /> pérdida</p>
      </section>
      <section>
        <h3 className="section-title">Gastos fijos por día</h3>
        <ul className="ledger">{Object.entries(expenses).map(([k, v]) => <li key={k}><span>{k}</span><b>{money(v)}</b></li>)}<li className="total"><span>Total</span><b>{money(totalFixed)}</b></li></ul>
        {s.loans.length > 0 && <><h3 className="section-title">Préstamos</h3><ul className="ledger">{s.loans.map(l => <li key={l.id}><span>{l.name} · {l.daysLeft} cuotas</span><b>{money(l.perDay)}</b></li>)}</ul></>}
        {s.debtDays > 0 && <p className="warn">⚠️ Llevás {s.debtDays} día(s) en rojo. Con 3 días seguidos en negativo, el negocio quiebra.</p>}
      </section>
    </div>
  </div>
}

// ---------- Desafíos ----------
function GoalsPanel({ s, act }: P) {
  const rank = rankOf(s)
  return <div className="goals-panel">
    <div className="ranks">{RANKS.map((r, i) => <span key={r} className={i === rank ? 'now' : i < rank ? 'past' : ''}>{r}</span>)}</div>
    <div className="goal-list">{GOALS.map(g => {
      const [a, b] = g.progress(s)
      const claimed = s.goalsClaimed.includes(g.id)
      const done = a >= b
      return <article key={g.id} className={`goal ${claimed ? 'claimed' : done ? 'ready' : ''}`}>
        <PixelIcon emoji={claimed ? '🏆' : done ? '🎁' : '🎯'} size={34} />
        <div><b>{g.title}</b><small>{g.desc}</small><Bar value={Math.min(a, b)} max={b} tone={done ? 'green' : 'gold'} label={b > 1000 ? `${fmt(Math.min(a, b))} / ${fmt(b)}` : `${Math.min(a, b)} / ${b}`} /></div>
        {claimed ? <em className="done">Cobrado</em> : <button className="btn btn--gold tiny" disabled={!done} onClick={() => act(x => E.claimGoal(x, g.id))}>{g.rewardText}</button>}
      </article>
    })}</div>
    <h3 className="section-title">Gente del barrio</h3>
    <div className="relations">{Object.entries(s.story.relations).length ? Object.entries(s.story.relations).map(([who, v]) => <span key={who} className={v >= 0 ? 'up' : 'down'}>{who[0].toUpperCase() + who.slice(1)} {v >= 0 ? '♥'.repeat(Math.min(5, v)) || '·' : '✖'.repeat(Math.min(5, -v))}</span>) : <small>Todavía nadie te conoce. Las historias aparecen de noche.</small>}</div>
    <p className="help">Historias vividas: {s.story.seen.length}/{STORY.length} · Entregas perfectas: {s.lifetime.perfect} · Reputación <Stars value={s.rep} /></p>
  </div>
}
