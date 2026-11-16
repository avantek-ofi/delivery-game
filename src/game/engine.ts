import { BARRIOS, START_BARRIOS, barrioById, distance } from './barrios'
import { PRODUCTS, RUBROS, TIERS, productById, rubroById } from './catalog'
import { BIOS, CAMPAIGNS, CLOSE_MIN, COURIER_EMOJI, CUSTOMER_NAMES, DAY_EVENTS, FIRST_NAMES, GOALS, INCIDENTS, LAST_NAMES, LATE_CLOSE_MIN, LEVELS, LOANS, OPEN_MIN, ORDER_NOTES, RESEARCH, STORY, VEHICLES, vehicleById } from './content'
import type { Channel, Courier, DayEvent, DayStats, Effect, GameState, LogEntry, Order, OrderKind, OrderLine, PriceTier, Product, RubroId, Stop } from './types'

// ---------- utilidades ----------
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const randInt = (a: number, b: number) => Math.floor(rand(a, b + 1))
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)]
const weighted = <T,>(list: T[], weight: (item: T) => number): T | null => {
  const total = list.reduce((sum, item) => sum + Math.max(0, weight(item)), 0)
  if (total <= 0) return null
  let roll = Math.random() * total
  for (const item of list) { roll -= Math.max(0, weight(item)); if (roll <= 0) return item }
  return list[list.length - 1]
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
let uid = 0
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(uid++).toString(36)}`
export const money = (value: number) => `${value < 0 ? '-' : ''}$${Math.round(Math.abs(value)).toLocaleString('es-AR')}`

export const MIN_PER_UNIT = 1.5
export const SPEED_RATE = [0, 4, 9, 18] // minutos de juego por segundo real
export const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
export const weekday = (day: number) => WEEKDAYS[(day - 1) % 7]
export const clock = (minute: number) => `${String(Math.floor(minute / 60) % 24).padStart(2, '0')}:${String(Math.floor(minute % 60)).padStart(2, '0')}`

export const now = (s: GameState) => s.day * 1440 + s.minute
export const level = (s: GameState) => LEVELS[s.level]
export const basePos = (s: GameState) => barrioById(s.baseBarrioId)
const startPerk = (s: GameState) => START_BARRIOS.find(item => item.id === s.baseBarrioId)
export const storageCap = (s: GameState) => Math.round(level(s).storage * (s.baseBarrioId === 'barracas' ? 1.4 : 1))
export const storageUsed = (s: GameState, includeIncoming = true) => {
  const stock = Object.entries(s.stock).reduce((sum, [id, qty]) => sum + qty * productById(id).vol, 0)
  return includeIncoming ? stock + s.purchases.reduce((sum, item) => sum + item.qty * productById(item.productId).vol, 0) : stock
}
export const closeMinute = (s: GameState) => s.research.includes('nocturno') ? LATE_CLOSE_MIN : CLOSE_MIN
export const coverage = (s: GameState) => BARRIOS.filter(b => distance(b, basePos(s)) <= level(s).radius)
export const inCoverage = (s: GameState, barrioId: string) => distance(barrioById(barrioId), basePos(s)) <= level(s).radius

const activeMods = (s: GameState) => s.modifiers.filter(m => m.until > now(s))
export const dayMultipliers = (s: GameState) => {
  const ev = s.today
  const mods = activeMods(s)
  return {
    demand: (ev?.demand ?? 1) * mods.filter(m => m.demand && !m.zone).reduce((p, m) => p * (m.demand ?? 1), 1),
    speed: (ev?.speed ?? 1) * mods.reduce((p, m) => p * (m.speed ?? 1), 1),
    risk: (ev?.risk ?? 1) * mods.reduce((p, m) => p * (m.risk ?? 1), 1),
    tips: (ev?.tips ?? 1) * mods.reduce((p, m) => p * (m.tips ?? 1), 1),
    cost: mods.reduce((p, m) => p * (m.cost ?? 1), 1),
    zone: (zone: string) => mods.filter(m => m.zone === zone).reduce((p, m) => p * (m.demand ?? 1), 1),
    rubro: (rubro: RubroId) => ev?.rubros?.[rubro] ?? 1,
  }
}

export const tierOf = (s: GameState, rubro: RubroId): PriceTier => s.tiers[rubro] ?? 'justo'
export const unitPrice = (s: GameState, product: Product) => Math.round(product.price * s.priceIndex * TIERS[tierOf(s, product.rubro)].price * (s.research.includes('franquicia') ? 1.1 : 1) / 50) * 50
export type Source = 'once' | 'import' | 'rush'
export const unitCost = (s: GameState, product: Product, source: Source) => {
  let cost = product.cost * s.priceIndex * dayMultipliers(s).cost
  if (s.baseBarrioId === 'balvanera') cost *= .92
  if (s.story.flags.includes('mara-exclusiva') && source !== 'import') cost *= .9
  if (source === 'rush') cost *= 1.5
  if (source === 'import') cost *= .65 * (s.dollar / 1000)
  return Math.round(cost / 10) * 10
}

export const orderVolume = (order: Order) => order.lines.reduce((sum, line) => sum + productById(line.productId).vol * line.qty, 0)
export const orderBulky = (order: Order) => order.lines.some(line => productById(line.productId).bulky)
export const missingFor = (s: GameState, order: Order, reserved: Record<string, number> = {}) =>
  order.lines.map(line => ({ ...line, qty: Math.max(0, line.qty - Math.max(0, (s.stock[line.productId] ?? 0) - (reserved[line.productId] ?? 0))) })).filter(line => line.qty > 0)
export const rushCost = (s: GameState, order: Order) => missingFor(s, order).reduce((sum, line) => sum + unitCost(s, productById(line.productId), 'rush') * line.qty, 0)

export const courierSpeed = (s: GameState, c: Courier) => vehicleById(c.vehicleId).speed * (.8 + c.speed * .1) * dayMultipliers(s).speed * (s.research.includes('ruteo') ? 1.15 : 1)
export const courierAvailable = (s: GameState, c: Courier) => !c.trip && c.energy >= 12 && !(c.injuredUntilDay && c.injuredUntilDay >= s.day)

export const repValue = (s: GameState) => {
  const base = s.ratings.length ? s.ratings.reduce((a, b) => a + b, 0) / s.ratings.length : 3.5
  return clamp(base + s.repBonus, 0, 5)
}

// ---------- log ----------
const log = (s: GameState, tone: LogEntry['tone'], text: string, sound?: LogEntry['sound']): GameState => {
  const entry: LogEntry = { id: s.logSeq + 1, at: now(s), tone, text, sound }
  return { ...s, logSeq: s.logSeq + 1, log: [...s.log.slice(-79), entry] }
}

// ---------- creación ----------
const emptyStats = (s: Pick<GameState, 'day' | 'fans' | 'rep'>): DayStats => ({ day: s.day, revenue: 0, cogs: 0, expenses: 0, fees: 0, delivered: 0, failed: 0, lost: 0, ratings: [], fansStart: s.fans, repStart: s.rep, tips: 0, detail: {} })

export const makeCourier = (priceIndex: number, quality = 0): Courier => {
  const speed = clamp(randInt(1, 3) + (Math.random() < .3 + quality * .15 ? 1 : 0) + (quality > 1 && Math.random() < .4 ? 1 : 0), 1, 5)
  const care = clamp(randInt(1, 3) + (Math.random() < .3 + quality * .15 ? 1 : 0) + (quality > 1 && Math.random() < .4 ? 1 : 0), 1, 5)
  const salary = Math.round((15000 + (speed + care) * 3600 + rand(-2000, 3000)) / 500) * 500
  return { id: newId('c'), name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`, emoji: pick(COURIER_EMOJI), bio: pick(BIOS), speed, care, salary: Math.round(salary * Math.sqrt(priceIndex)), vehicleId: 'bici', energy: 100, xp: 0, trips: 0, trip: null }
}

const pickDayEvent = (day: number, avoid?: string): DayEvent => {
  if (day <= 2) return DAY_EVENTS[0]
  const pool = DAY_EVENTS.filter(e => e.id !== avoid)
  return Math.random() < .3 ? pick(pool.filter(e => e.tone === 'neutral' && !e.demand)) ?? DAY_EVENTS[0] : pick(pool)
}

export type NewGameOptions = { playerName: string; storeName: string; baseBarrioId: string; rubro: RubroId }
export const newGame = (opt: NewGameOptions): GameState => {
  const player: Courier = { id: 'player', name: opt.playerName, emoji: '🧑‍🦱', bio: 'Vos. 23 años, una bici y ganas de que salga.', speed: 3, care: 3, salary: 0, vehicleId: 'bici', energy: 100, xp: 0, trips: 0, trip: null, isPlayer: true }
  const base: GameState = {
    version: 2, seed: Math.random(), playerName: opt.playerName, storeName: opt.storeName, baseBarrioId: opt.baseBarrioId,
    day: 1, minute: OPEN_MIN, phase: 'night', speed: 0, capital: 200000, priceIndex: 1, dollar: 1000, rep: 3.5, repBonus: 0, ratings: [],
    fans: opt.baseBarrioId === 'flores' ? 35 : 12, ideas: 0, level: 0, rubros: [opt.rubro], channels: ['whatsapp'], research: [], tiers: {},
    stock: {}, purchases: [], autoRestock: {}, orders: [], couriers: [player], vehicles: [], candidates: [], modifiers: [],
    today: null, tomorrow: DAY_EVENTS[0],
    story: { seen: [], flags: [], relations: {} }, pendingStory: null, pendingIncident: null, goalsClaimed: [], loans: [], loanTaken: [],
    log: [], logSeq: 0, nextOrderAt: 0, stats: emptyStats({ day: 1, fans: 12, rep: 3.5 }), history: [],
    lifetime: { delivered: 0, failed: 0, revenue: 0, profit: 0, bestDay: 0, maxFans: 12, perfect: 0 }, debtDays: 0, autoDispatch: true, won: false,
  }
  base.candidates = [makeCourier(1), makeCourier(1), makeCourier(1, 1)]
  // stock inicial de regalo para el primer día: unas unidades del rubro elegido
  const starter = PRODUCTS.filter(p => p.rubro === opt.rubro).slice(0, 3)
  starter.forEach(p => { base.stock[p.id] = p.vol > 1 ? 3 : 5 })
  return log(base, 'info', `Abriste "${opt.storeName}" en ${barrioById(opt.baseBarrioId).name}. Franco te regaló unas cajas para arrancar.`)
}

// ---------- demanda ----------
const channelWeight: Record<Channel, number> = { whatsapp: 1, instagram: .35, chango: .6, app: .6 }
export const demandPerMinute = (s: GameState) => {
  const fansFactor = 1 + Math.sqrt(Math.max(0, s.fans)) / 6
  const repFactor = .45 + repValue(s) * .19
  const channels = s.channels.reduce((sum, ch) => sum + channelWeight[ch], 0)
  const tierFactor = s.rubros.reduce((sum, r) => sum + TIERS[tierOf(s, r)].demand, 0) / s.rubros.length
  const rubroBreadth = 1 + (s.rubros.length - 1) * .12
  const sunday = weekday(s.day) === 'Domingo' ? .75 : 1
  return (1 / 62) * fansFactor * repFactor * channels * tierFactor * rubroBreadth * level(s).demand * dayMultipliers(s).demand * sunday
}

const generateOrder = (s: GameState): Order | null => {
  const t = now(s)
  const mult = dayMultipliers(s)
  const zone = weighted(coverage(s), b => b.demand * mult.zone(b.zone))
  if (!zone) return null
  const products = PRODUCTS.filter(p => s.rubros.includes(p.rubro))
  const productWeight = (p: Product) => p.pop * mult.rubro(p.rubro) * TIERS[tierOf(s, p.rubro)].demand * ((s.stock[p.id] ?? 0) > 0 ? 2.6 : 1) * (p.price * s.priceIndex > 200000 ? zone.wealth - .5 : 1)
  const main = weighted(products, productWeight)
  if (!main) return null
  let kind: OrderKind = 'normal'
  const roll = Math.random()
  if (s.research.includes('vip') && zone.wealth >= 1.2 && roll < .14) kind = 'vip'
  else if (s.research.includes('mayoristas') && roll < .22 && main.price < 25000) kind = 'mayorista'
  else if (roll < .38 && roll > .24) kind = 'urgente'
  const lines: OrderLine[] = []
  if (kind === 'mayorista') lines.push({ productId: main.id, qty: randInt(6, 14) })
  else {
    const q = Math.random()
    lines.push({ productId: main.id, qty: q < .72 ? 1 : q < .95 ? 2 : 3 })
    if (Math.random() < .22) {
      const extra = weighted(products.filter(p => p.rubro === main.rubro && p.id !== main.id), productWeight)
      if (extra) lines.push({ productId: extra.id, qty: 1 })
    }
  }
  const kindPrice = kind === 'vip' ? 1.35 : kind === 'urgente' ? 1.2 : kind === 'mayorista' ? .85 : 1
  const total = Math.round(lines.reduce((sum, line) => sum + unitPrice(s, productById(line.productId)) * line.qty, 0) * kindPrice / 50) * 50
  const channel = weighted(s.channels, ch => channelWeight[ch]) ?? 'whatsapp'
  const patienceBase = kind === 'urgente' ? rand(50, 75) : kind === 'mayorista' ? rand(150, 220) : rand(90, 150)
  const patience = patienceBase * (s.research.includes('whatsapp') ? 1.4 : 1)
  const promise = kind === 'urgente' || kind === 'vip' ? 60 : kind === 'mayorista' ? 180 : 110
  const customer = kind === 'mayorista' ? pick(['Kiosco El Turco', 'Almacén Don Pepe', 'Maxikiosco 24hs', 'Despensa La Esquina', 'Autoservicio Lin', 'Kiosco del club']) : kind === 'vip' ? pick(['Arq. Belén Ocampo', 'Dr. Martín Alvear', 'Lic. Sofía Lynch', 'Ing. Tomás Anchorena']) : pick(CUSTOMER_NAMES)
  return {
    id: newId('o'), customer, barrioId: zone.id, lines, total, channel, kind, createdAt: t, expiresAt: t + patience, promiseAt: t + patience + promise,
    note: kind === 'mayorista' ? 'Pedido para reventa. Necesitan factura.' : kind === 'vip' ? 'Cliente VIP: puntualidad absoluta.' : kind === 'urgente' ? '¡Lo necesito YA, por favor!' : Math.random() < .55 ? pick(ORDER_NOTES) : '',
    status: 'waiting',
  }
}

// ---------- despacho ----------
// Punto exacto del pedido en el mapa: el barrio más un desvío fijo para que no se pisen los pines.
export const orderPoint = (order: Order) => {
  const b = barrioById(order.barrioId)
  const h = [...order.id].reduce((sum, ch, i) => sum + ch.charCodeAt(0) * (i + 3), 0)
  return { x: b.x + ((h % 9) - 4) * .55, y: b.y + ((Math.floor(h / 9) % 9) - 4) * .8 }
}
export const courierPos = (s: GameState, c: Courier) => {
  const trip = c.trip
  const base = basePos(s)
  if (!trip) return { x: base.x, y: base.y, heading: 1 }
  const t = now(s)
  let prev = { x: trip.from.x, y: trip.from.y, at: trip.startedAt }
  for (const stop of trip.stops) {
    if (stop.at > t) {
      const k = clamp((t - prev.at) / Math.max(1, stop.at - prev.at), 0, 1)
      return { x: prev.x + (stop.x - prev.x) * k, y: prev.y + (stop.y - prev.y) * k, heading: stop.x >= prev.x ? 1 : -1 }
    }
    prev = stop
  }
  return { x: base.x, y: base.y, heading: 1 }
}
export type DispatchCheck = { ok: boolean; reason?: string; volume: number; cap: number; minutes: number; route: Stop[] }
export const planRoute = (s: GameState, courierId: string, orderIds: string[]): DispatchCheck => {
  const courier = s.couriers.find(c => c.id === courierId)
  const orders = orderIds.map(id => s.orders.find(o => o.id === id)).filter((o): o is Order => Boolean(o))
  const fail = (reason: string): DispatchCheck => ({ ok: false, reason, volume: 0, cap: 0, minutes: 0, route: [] })
  if (!courier) return fail('Cadete inexistente')
  if (!orders.length) return fail('Elegí al menos un pedido')
  const vehicle = vehicleById(courier.vehicleId)
  const volume = orders.reduce((sum, o) => sum + orderVolume(o), 0)
  const result = (reason?: string) => ({ ok: !reason, reason, volume, cap: vehicle.cap, minutes: 0, route: [] as Stop[] })
  if (courier.trip) return result(`${courier.name.split(' ')[0]} está en la calle`)
  if (courier.injuredUntilDay && courier.injuredUntilDay >= s.day) return result(`${courier.name.split(' ')[0]} está lesionado`)
  if (courier.energy < 12) return result(`${courier.name.split(' ')[0]} está fundido`)
  if (orders.some(o => o.status !== 'waiting')) return result('Algún pedido ya no está disponible')
  if (volume > vehicle.cap) return result(`No entra: ${volume}/${vehicle.cap} de carga`)
  if (!vehicle.bulky && orders.some(orderBulky)) return result('Hay bultos grandes: necesitás un utilitario')
  const reserved: Record<string, number> = {}
  for (const order of orders) {
    if (missingFor(s, order, reserved).length) return result(`Falta stock para ${order.customer}`)
    order.lines.forEach(line => { reserved[line.productId] = (reserved[line.productId] ?? 0) + line.qty })
  }
  // ruteo por vecino más cercano
  const base = basePos(s)
  const speed = courierSpeed(s, courier)
  let pos: { x: number; y: number } = base
  let t = now(s)
  const remaining = [...orders]
  const route: Stop[] = []
  while (remaining.length) {
    remaining.sort((a, b) => distance(pos, barrioById(a.barrioId)) - distance(pos, barrioById(b.barrioId)))
    const next = remaining.shift()!
    const point = orderPoint(next)
    t += Math.max(4, distance(pos, point) * MIN_PER_UNIT / speed) + 4
    route.push({ ...point, orderId: next.id, at: t })
    pos = point
  }
  t += Math.max(3, distance(pos, base) * MIN_PER_UNIT / speed)
  route.push({ x: base.x, y: base.y, orderId: null, at: t })
  return { ok: true, volume, cap: vehicle.cap, minutes: Math.round(t - now(s)), route }
}

export const dispatch = (s: GameState, courierId: string, orderIds: string[]): GameState => {
  const plan = planRoute(s, courierId, orderIds)
  if (!plan.ok) return log(s, 'bad', plan.reason ?? 'No se pudo despachar', 'bad')
  const courier = s.couriers.find(c => c.id === courierId)!
  const vehicle = vehicleById(courier.vehicleId)
  const stock = { ...s.stock }
  const mult = dayMultipliers(s)
  let orders = s.orders
  orderIds.forEach(id => {
    const order = orders.find(o => o.id === id)!
    const cogs = order.lines.reduce((sum, line) => sum + unitCost(s, productById(line.productId), 'once') * line.qty, 0)
    order.lines.forEach(line => { stock[line.productId] = (stock[line.productId] ?? 0) - line.qty; if (stock[line.productId] <= 0) delete stock[line.productId] })
    orders = orders.map(o => o.id === id ? { ...o, status: 'route' as const, cogs, courierId } : o)
  })
  // ¿incidente?
  const maxRisk = Math.max(...orderIds.map(id => barrioById(orders.find(o => o.id === id)!.barrioId).risk))
  const chance = clamp((.05 + maxRisk * .2) * vehicle.risk * mult.risk * (1.2 - courier.care * .08) * (orderIds.length > 1 ? 1.15 : 1), .02, .5)
  let incident = null
  if (s.lifetime.delivered >= 3 && Math.random() < chance) {
    const def = weighted(INCIDENTS, d => d.id === 'robo' ? maxRisk * 1.6 * (s.day < 3 ? 0 : 1) : d.id === 'choque' ? (vehicle.id === 'moto' ? 1.2 : .5) : 1)!
    const firstStop = plan.route[0].at
    incident = { id: def.id, at: now(s) + rand(4, Math.max(6, firstStop - now(s) - 2)), fired: false }
  }
  const energyCost = (6 + plan.minutes / 8) * (s.research.includes('capacitacion') ? .7 : 1) * (courier.isPlayer ? 1 : .85)
  const couriers = s.couriers.map(c => c.id === courierId ? { ...c, energy: Math.max(0, c.energy - energyCost), trip: { startedAt: now(s), from: { x: basePos(s).x, y: basePos(s).y }, stops: plan.route, incident, done: 0, ratingMod: 0 } } : c)
  return log({ ...s, stock, orders, couriers }, 'info', `${courier.name.split(' ')[0]} salió ${vehicle.emoji} con ${orderIds.length} pedido${orderIds.length > 1 ? 's' : ''}. Vuelve en ~${plan.minutes} min.`)
}

export const rushBuy = (s: GameState, orderId: string): GameState => {
  const order = s.orders.find(o => o.id === orderId)
  if (!order) return s
  const missing = missingFor(s, order)
  const cost = rushCost(s, order)
  if (!missing.length) return s
  if (cost > s.capital) return log(s, 'bad', 'No te alcanza la plata para ir a Once.', 'bad')
  const stock = { ...s.stock }
  missing.forEach(line => { stock[line.productId] = (stock[line.productId] ?? 0) + line.qty })
  const premium = cost - missing.reduce((sum, line) => sum + unitCost(s, productById(line.productId), 'once') * line.qty, 0)
  const stats = { ...s.stats, detail: { ...s.stats.detail, 'Sobrecosto de urgencia': (s.stats.detail['Sobrecosto de urgencia'] ?? 0) + premium } }
  // la corrida a Once cuesta tiempo: el pedido queda con un poco menos de paciencia
  const orders = s.orders.map(o => o.id === orderId ? { ...o, expiresAt: o.expiresAt + 10 } : o)
  return log({ ...s, capital: s.capital - cost, stock, stats, orders }, 'cash', `Corrida a Once: compraste lo que faltaba por ${money(cost)} (50% más caro).`, 'cash')
}

export const rejectOrder = (s: GameState, orderId: string): GameState => {
  const order = s.orders.find(o => o.id === orderId)
  if (!order || order.status !== 'waiting') return s
  return log({ ...s, fans: Math.max(0, s.fans - 1), orders: s.orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' as const } : o), stats: { ...s.stats, lost: s.stats.lost + 1 } }, 'info', `Rechazaste el pedido de ${order.customer}. "Bueno, le compro a otro", contestó.`)
}

// ---------- entregas ----------
const deliver = (s: GameState, courier: Courier, orderId: string, ratingMod: number): GameState => {
  const order = s.orders.find(o => o.id === orderId)
  if (!order || order.status !== 'route') return s
  const t = now(s)
  const barrio = barrioById(order.barrioId)
  const late = Math.max(0, t - order.promiseAt)
  const fragile = order.lines.some(l => productById(l.productId).fragile)
  let rating = 4.6 + rand(-.6, .5) - Math.ceil(late / 25) * .9 + (s.research.includes('packaging') ? .4 : 0) + (courier.care - 3) * .15 + TIERS[tierOf(s, productById(order.lines[0].productId).rubro)].rep * 4 + ratingMod
  if (fragile && Math.random() < .25 - courier.care * .04) rating -= 1.5
  if (order.kind === 'vip' && late > 0) rating -= 1
  rating = clamp(Math.round(rating), 1, 5)
  const mult = dayMultipliers(s)
  const tip = rating >= 4 ? Math.round(order.total * rand(0, .07) * barrio.wealth * mult.tips * (s.research.includes('qr') ? 1.6 : 1) * (order.kind === 'vip' ? 2.5 : 1) / 100) * 100 : 0
  const fee = order.channel === 'chango' ? Math.round(order.total * .13) : 0
  const income = order.total + tip - fee
  const ratings = [...s.ratings, rating].slice(-40)
  const fanDelta = rating >= 5 ? (Math.random() < .7 ? 2 : 1) + (s.research.includes('franquicia') ? 1 : 0) : rating >= 4 ? (Math.random() < .5 ? 1 : 0) : rating <= 2 ? -2 : 0
  const stats: DayStats = { ...s.stats, revenue: s.stats.revenue + order.total + tip, tips: s.stats.tips + tip, fees: s.stats.fees + fee, cogs: s.stats.cogs + (order.cogs ?? 0), delivered: s.stats.delivered + 1, ratings: [...s.stats.ratings, rating] }
  const couriers = s.couriers.map(c => {
    if (c.id !== courier.id) return c
    const xp = c.xp + 1
    let upgraded = { ...c, xp }
    if (xp % 18 === 0 && (c.speed < 5 || c.care < 5)) upgraded = c.speed <= c.care && c.speed < 5 ? { ...upgraded, speed: c.speed + 1 } : { ...upgraded, care: Math.min(5, c.care + 1) }
    return upgraded
  })
  const leveled = couriers.find(c => c.id === courier.id)!
  let next: GameState = {
    ...s, capital: s.capital + income, ratings, fans: Math.max(0, s.fans + fanDelta), ideas: s.ideas + .3 + (rating >= 5 ? .2 : 0) + (order.kind !== 'normal' ? .2 : 0), stats, couriers,
    orders: s.orders.map(o => o.id === orderId ? { ...o, status: 'delivered' as const, rating } : o),
    lifetime: { ...s.lifetime, delivered: s.lifetime.delivered + 1, revenue: s.lifetime.revenue + order.total + tip, perfect: s.lifetime.perfect + (rating === 5 ? 1 : 0) },
  }
  next = { ...next, rep: repValue(next) }
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
  next = log(next, rating >= 4 ? 'cash' : 'bad', `${stars} ${order.customer} (${barrio.name}) +${money(income)}${tip ? ` · propina ${money(tip)}` : ''}${late ? ` · llegó ${Math.round(late)} min tarde` : ''}`, rating >= 4 ? 'cash' : 'bad')
  if (leveled.speed + leveled.care > courier.speed + courier.care) next = log(next, 'good', `${courier.name.split(' ')[0]} agarró calle: ahora es más ${leveled.speed > courier.speed ? 'rápido' : 'cuidadoso'}.`, 'level')
  return next
}

const failOrder = (s: GameState, orderId: string, why: string): GameState => {
  const order = s.orders.find(o => o.id === orderId)
  if (!order) return s
  const insured = s.research.includes('seguro') ? Math.round(order.total * .7) : 0
  let next: GameState = { ...s, capital: s.capital + insured, ratings: [...s.ratings, 2].slice(-40), fans: Math.max(0, s.fans - 3), orders: s.orders.map(o => o.id === orderId ? { ...o, status: 'failed' as const } : o), stats: { ...s.stats, failed: s.stats.failed + 1, cogs: s.stats.cogs + (order.cogs ?? 0), revenue: s.stats.revenue + insured }, lifetime: { ...s.lifetime, failed: s.lifetime.failed + 1 } }
  next = { ...next, rep: repValue(next) }
  return log(next, 'bad', `${why} Pedido de ${order.customer} perdido.${insured ? ` El seguro cubrió ${money(insured)}.` : ''}`, 'bad')
}

const shiftTrip = (s: GameState, courierId: string, delay: number): GameState => ({
  ...s, couriers: s.couriers.map(c => c.id === courierId && c.trip ? { ...c, trip: { ...c.trip, stops: c.trip.stops.map((stop, i) => i >= c.trip!.done ? { ...stop, at: Math.max(now(s) + 1, stop.at + delay) } : stop) } } : c),
})

const fireIncident = (s: GameState, courier: Courier): GameState => {
  const trip = courier.trip!
  const def = INCIDENTS.find(d => d.id === trip.incident!.id)!
  let next: GameState = { ...s, couriers: s.couriers.map(c => c.id === courier.id ? { ...c, trip: { ...c.trip!, incident: { ...c.trip!.incident!, fired: true } } } : c) }
  const who = courier.name.split(' ')[0]
  if (def.choices) return log({ ...next, pendingIncident: { courierId: courier.id, incidentId: def.id }, speed: 0 }, 'bad', `${def.emoji} ${who}: ${def.title}. Necesita que decidas.`, 'ring')
  if (def.delay) next = shiftTrip(next, courier.id, def.delay * (.8 + Math.random() * .4))
  if (def.damage) {
    const cost = Math.round(def.damage * s.priceIndex)
    next = { ...next, capital: next.capital - cost, stats: { ...next.stats, detail: { ...next.stats.detail, 'Reparaciones': (next.stats.detail['Reparaciones'] ?? 0) + cost } } }
  }
  if (def.injury) next = { ...next, couriers: next.couriers.map(c => c.id === courier.id ? { ...c, energy: Math.max(0, c.energy - 30) } : c) }
  next = log(next, 'bad', `${def.emoji} ${who}: ${def.title}. ${def.text}${def.damage ? ` (-${money(def.damage * s.priceIndex)})` : ''}`, 'bad')
  if (def.lose) {
    const stop = trip.stops.slice(trip.done).find(st => st.orderId)
    if (stop?.orderId) {
      next = failOrder(next, stop.orderId, 'Robo en la calle.')
      next = { ...next, couriers: next.couriers.map(c => c.id === courier.id ? { ...c, energy: Math.max(0, c.energy - 20), trip: c.trip ? { ...c.trip, stops: c.trip.stops.map(st => st.orderId === stop.orderId ? { ...st, orderId: null } : st) } : null } : c) }
    }
  }
  return next
}

export const resolveIncident = (s: GameState, choiceIndex: number): GameState => {
  if (!s.pendingIncident) return s
  const def = INCIDENTS.find(d => d.id === s.pendingIncident!.incidentId)!
  const choice = def.choices![choiceIndex]
  const courierId = s.pendingIncident.courierId
  let next: GameState = applyEffect({ ...s, pendingIncident: null, speed: 1 }, choice.effect)
  if (choice.delay) next = shiftTrip(next, courierId, choice.delay)
  if (choice.rating) next = { ...next, couriers: next.couriers.map(c => c.id === courierId && c.trip ? { ...c, trip: { ...c.trip, ratingMod: c.trip.ratingMod + choice.rating! } } : c) }
  // el atajo puede salir mal
  if (def.id === 'desvio' && choiceIndex === 0 && Math.random() < .18) {
    const courier = next.couriers.find(c => c.id === courierId)
    const stop = courier?.trip?.stops.slice(courier.trip.done).find(st => st.orderId)
    if (stop?.orderId) return failOrder(log(next, 'bad', 'En la cortada había dos tipos esperando...', 'bad'), stop.orderId, 'Te robaron en el atajo.')
  }
  return log(next, 'info', `${def.emoji} ${choice.result}`)
}

const advanceCourier = (s: GameState, courierId: string): GameState => {
  let next = s
  for (let guard = 0; guard < 20; guard++) {
    const courier = next.couriers.find(c => c.id === courierId)!
    const trip = courier.trip
    if (!trip) return next
    if (trip.incident && !trip.incident.fired && trip.incident.at <= now(next)) {
      next = fireIncident(next, courier)
      if (next.pendingIncident) return next
      continue
    }
    const stop = trip.stops[trip.done]
    if (!stop || stop.at > now(next)) return next
    if (stop.orderId) next = deliver(next, courier, stop.orderId, trip.ratingMod)
    const isLast = trip.done >= trip.stops.length - 1
    next = { ...next, couriers: next.couriers.map(c => c.id === courierId ? (isLast ? { ...c, trip: null, trips: c.trips + 1 } : { ...c, trip: { ...c.trip!, done: c.trip!.done + 1 } }) : c) }
  }
  return next
}

// Despacho automático: asigna lo más viejo a los cadetes libres.
const autoDispatch = (s: GameState): GameState => {
  let next = s
  for (const courier of next.couriers) {
    if (courier.isPlayer) continue
    const fresh = next.couriers.find(c => c.id === courier.id)!
    if (!courierAvailable(next, fresh)) continue
    const vehicle = vehicleById(fresh.vehicleId)
    const waiting = next.orders.filter(o => o.status === 'waiting').sort((a, b) => a.expiresAt - b.expiresAt)
    const chosen: string[] = []
    let volume = 0
    const reserved: Record<string, number> = {}
    for (const order of waiting) {
      if (chosen.length >= 3) break
      const v = orderVolume(order)
      if (volume + v > vehicle.cap || (!vehicle.bulky && orderBulky(order)) || missingFor(next, order, reserved).length) continue
      if (chosen.length && distance(barrioById(order.barrioId), barrioById(next.orders.find(o => o.id === chosen[0])!.barrioId)) > 18) continue
      chosen.push(order.id); volume += v
      order.lines.forEach(line => { reserved[line.productId] = (reserved[line.productId] ?? 0) + line.qty })
    }
    if (chosen.length) next = dispatch(next, fresh.id, chosen)
  }
  return next
}

// ---------- tick ----------
export const tick = (s: GameState, dt: number): GameState => {
  if ((s.phase !== 'day' && s.phase !== 'closing') || s.pendingIncident) return s
  let next = s
  let remaining = dt
  while (remaining > 0) {
    const step = Math.min(1.5, remaining)
    remaining -= step
    next = { ...next, minute: next.minute + step }
    const t = now(next)
    // llegada de compras
    const arrived = next.purchases.filter(p => p.arrivesAt <= t)
    if (arrived.length) {
      const stock = { ...next.stock }
      arrived.forEach(p => { stock[p.productId] = (stock[p.productId] ?? 0) + p.qty })
      next = log({ ...next, stock, purchases: next.purchases.filter(p => p.arrivesAt > t) }, 'good', `📦 Llegó mercadería: ${arrived.map(p => `${p.qty}× ${productById(p.productId).name}`).join(', ')}.`, 'good')
    }
    // nuevos pedidos
    const waiting = next.orders.filter(o => o.status === 'waiting').length
    if (next.phase === 'day' && t >= next.nextOrderAt) {
      const order = waiting < level(next).maxCalls ? generateOrder(next) : null
      const gap = -Math.log(1 - Math.random()) / demandPerMinute(next)
      next = { ...next, nextOrderAt: t + clamp(gap, 2, 240) }
      if (order) next = log({ ...next, orders: [...next.orders, order] }, 'call', `📞 ${order.customer} (${barrioById(order.barrioId).name}) pide ${order.lines.map(l => `${l.qty}× ${productById(l.productId).name}`).join(' + ')}`, 'ring')
      else if (waiting >= level(next).maxCalls) next = { ...next, stats: { ...next.stats, lost: next.stats.lost + 1 } }
    }
    // pedidos que se cansan de esperar
    const expired = next.orders.filter(o => o.status === 'waiting' && o.expiresAt <= t)
    expired.forEach(o => {
      next = { ...next, orders: next.orders.map(x => x.id === o.id ? { ...x, status: 'cancelled' as const } : x), ratings: [...next.ratings, 2].slice(-40), fans: Math.max(0, next.fans - 1), stats: { ...next.stats, lost: next.stats.lost + 1 } }
      next = log({ ...next, rep: repValue(next) }, 'bad', `⌛ ${o.customer} se cansó de esperar y canceló.`, 'bad')
    })
    // cadetes
    for (const c of next.couriers) {
      if (c.trip) next = advanceCourier(next, c.id)
      if (next.pendingIncident) return next
    }
    if (next.autoDispatch && next.research.includes('autodespacho')) next = autoDispatch(next)
    // cierre
    if (next.phase === 'day' && next.minute >= closeMinute(next)) {
      const left = next.orders.filter(o => o.status === 'waiting')
      next = { ...next, phase: 'closing', orders: next.orders.map(o => o.status === 'waiting' ? { ...o, status: 'cancelled' as const } : o), stats: { ...next.stats, lost: next.stats.lost + left.length } }
      next = log(next, 'info', `🔒 Bajaste la persiana. ${left.length ? `${left.length} pedido(s) quedaron sin atender.` : 'No quedó nadie esperando.'} Esperando que vuelvan los cadetes.`)
    }
    if (next.phase === 'closing' && next.couriers.every(c => !c.trip)) return endDay(next)
    if (next.minute >= 24 * 60 - 2) return endDay(next)
  }
  return next
}

// ---------- fin de día / noche ----------
export const dailyExpenses = (s: GameState) => {
  const rent = Math.round(level(s).rent * s.priceIndex * (startPerk(s)?.rentMult ?? 1))
  const salaries = s.couriers.reduce((sum, c) => sum + c.salary, 0)
  const upkeep = Math.round([...s.couriers.map(c => c.vehicleId), ...s.vehicles].reduce((sum, v) => sum + vehicleById(v).upkeep, 0) * s.priceIndex)
  const services = Math.round(2500 * (s.level + 1) ** 1.6 * s.priceIndex)
  const loans = s.loans.reduce((sum, l) => sum + l.perDay, 0)
  return { Alquiler: rent, Sueldos: salaries, 'Mantenimiento de vehículos': upkeep, 'Luz, internet y celular': services, 'Cuotas de préstamos': loans }
}

const endDay = (s: GameState): GameState => {
  const expenses = dailyExpenses(s)
  const total = Object.values(expenses).reduce((a, b) => a + b, 0)
  const detail = { ...s.stats.detail }
  Object.entries(expenses).forEach(([k, v]) => { if (v) detail[k] = (detail[k] ?? 0) + v })
  const extra = Object.entries(s.stats.detail).reduce((sum, [, v]) => sum + v, 0)
  const stats: DayStats = { ...s.stats, expenses: total + extra, detail }
  const profit = stats.revenue - stats.fees - stats.cogs - stats.expenses
  const loans = s.loans.map(l => ({ ...l, daysLeft: l.daysLeft - 1 })).filter(l => l.daysLeft > 0)
  const capital = s.capital - total
  return {
    ...s, phase: 'summary', speed: 0, capital, loans, stats, history: [...s.history, stats].slice(-30),
    lifetime: { ...s.lifetime, profit: s.lifetime.profit + profit, bestDay: Math.max(s.lifetime.bestDay, stats.revenue), maxFans: Math.max(s.lifetime.maxFans, s.fans) },
    debtDays: capital < 0 ? s.debtDays + 1 : 0,
  }
}

export const goToNight = (s: GameState): GameState => {
  if (s.debtDays >= 3) return { ...s, phase: 'gameover' }
  let next: GameState = { ...s, phase: 'night', orders: s.orders.filter(o => o.status === 'waiting' || o.status === 'route') }
  // inflación semanal
  if (s.day % 7 === 0) {
    const inflation = rand(.015, .04)
    next = log({ ...next, priceIndex: next.priceIndex * (1 + inflation) }, 'info', `📊 INDEC: la inflación de la semana fue ${(inflation * 100).toFixed(1)}%. Se remarcaron precios, costos y sueldos.`, 'bad')
    next = { ...next, couriers: next.couriers.map(c => c.isPlayer ? c : { ...c, salary: Math.round(c.salary * (1 + inflation) / 100) * 100 }) }
  }
  // dólar
  const dollarMove = (next.tomorrow?.dollar ?? 1) * rand(.985, 1.025)
  next = { ...next, dollar: Math.round(next.dollar * dollarMove) }
  // descanso
  next = { ...next, couriers: next.couriers.map(c => ({ ...c, energy: 100 })) }
  // candidatos nuevos
  next = { ...next, candidates: [makeCourier(next.priceIndex, next.level), makeCourier(next.priceIndex, next.level), makeCourier(next.priceIndex, Math.min(2, next.level + 1))] }
  // reposición automática
  if (next.research.includes('restock')) {
    const bought: string[] = []
    for (const [productId, min] of Object.entries(next.autoRestock)) {
      const have = (next.stock[productId] ?? 0) + next.purchases.filter(p => p.productId === productId).reduce((a, b) => a + b.qty, 0)
      const need = min - have
      if (need <= 0 || !next.rubros.includes(productById(productId).rubro)) continue
      const product = productById(productId)
      const space = Math.floor((storageCap(next) - storageUsed(next)) / product.vol)
      const qty = Math.min(need, space, Math.floor(next.capital / unitCost(next, product, 'once')))
      if (qty <= 0) continue
      const before = next
      next = buyStock(next, productId, qty, 'once', true)
      if (next !== before) bought.push(`${qty}× ${product.name}`)
    }
    if (bought.length) next = log(next, 'info', `♻️ Reposición automática: ${bought.join(', ')}.`)
  }
  // carta de historia
  const available = STORY.filter(card => !next.story.seen.includes(card.id) && card.when(next))
  if (available.length && (Math.random() < .65 || s.day <= 3)) {
    const card = pick(available)
    next = { ...next, pendingStory: { id: card.id, who: card.who, emoji: card.emoji, title: card.title, text: card.text, choices: card.choices }, story: { ...next.story, seen: [...next.story.seen, card.id] } }
  }
  if (!next.won && next.level >= 4 && next.fans >= 10000) next = { ...next, won: true }
  return next
}

export const startDay = (s: GameState): GameState => {
  const day = s.phase === 'night' && s.today === null ? s.day : s.day + 1
  const today = s.tomorrow ?? DAY_EVENTS[0]
  let next: GameState = { ...s, day, minute: OPEN_MIN, phase: 'day', speed: 1, today, tomorrow: pickDayEvent(day + 1, today.id), modifiers: s.modifiers.filter(m => m.until > day * 1440 + OPEN_MIN) }
  next = { ...next, stats: emptyStats(next), nextOrderAt: now(next) + 3, purchases: next.purchases.map(p => p.arrivesAt < now(next) ? { ...p, arrivesAt: now(next) } : p) }
  return log(next, 'info', `☀️ ${weekday(day)} ${day}: ${today.emoji} ${today.title}. ¡A laburar!`, 'level')
}

// ---------- efectos ----------
export const applyEffect = (s: GameState, e: Effect): GameState => {
  let next: GameState = { ...s }
  if (e.capital) next.capital += e.capital
  if (e.fans) next.fans = Math.max(0, next.fans + e.fans)
  if (e.ideas) next.ideas += e.ideas
  if (e.rep) next.repBonus = clamp(next.repBonus + e.rep, -1, 1)
  if (e.energy) next.couriers = next.couriers.map(c => c.isPlayer ? { ...c, energy: clamp(c.energy + e.energy!, 0, 100) } : c)
  if (e.dollar) next.dollar = Math.round(next.dollar * e.dollar)
  if (e.flag) next.story = { ...next.story, flags: [...next.story.flags, e.flag] }
  if (e.relation) next.story = { ...next.story, relations: { ...next.story.relations, [e.relation[0]]: (next.story.relations[e.relation[0]] ?? 0) + e.relation[1] } }
  if (e.modifier) {
    const { days, ...mod } = e.modifier
    next.modifiers = [...next.modifiers, { ...mod, id: newId('m'), until: (next.day + days) * 1440 + 1439 }]
  }
  next.rep = repValue(next)
  return next
}

export const resolveStory = (s: GameState, index: number): GameState => {
  const card = s.pendingStory
  if (!card) return s
  const choice = card.choices[index]
  if (choice.cost && choice.cost > s.capital) return log(s, 'bad', 'No te alcanza la plata para eso.', 'bad')
  let next = applyEffect({ ...s, pendingStory: null }, choice.effect)
  const flag = choice.effect.flag
  if (flag === 'lote-mara') {
    const pool = PRODUCTS.filter(p => next.rubros.includes(p.rubro) && !p.bulky)
    const stock = { ...next.stock }
    for (let i = 0; i < 20; i++) { const p = pick(pool); stock[p.id] = (stock[p.id] ?? 0) + 1 }
    next = { ...next, stock }
  }
  if (flag === 'vendido') next = { ...next, fans: Math.floor(next.fans / 2) }
  if (flag === 'kangoo-lobo') next = { ...next, vehicles: [...next.vehicles, 'kangoo'] }
  if (flag === 'aumento') {
    const target = next.couriers.filter(c => !c.isPlayer).sort((a, b) => b.salary - a.salary)[0]
    if (target) next = { ...next, couriers: next.couriers.map(c => c.id === target.id ? { ...c, salary: Math.round(c.salary * 1.2), speed: Math.min(5, c.speed + 1) } : c) }
  }
  if (flag === 'renuncia') {
    const target = next.couriers.filter(c => !c.isPlayer).sort((a, b) => b.salary - a.salary)[0]
    if (target) next = { ...next, couriers: next.couriers.filter(c => c.id !== target.id), vehicles: target.vehicleId === 'bici' ? next.vehicles : [...next.vehicles, target.vehicleId] }
  }
  return log(next, 'info', `${card.emoji} ${choice.result}`)
}

// ---------- gestión ----------
export const buyStock = (s: GameState, productId: string, qty: number, source: 'once' | 'import', silent = false): GameState => {
  const product = productById(productId)
  if (qty <= 0) return s
  const cost = unitCost(s, product, source) * qty
  if (cost > s.capital) return silent ? s : log(s, 'bad', 'No te alcanza la caja para esa compra.', 'bad')
  if (storageUsed(s) + product.vol * qty > storageCap(s)) return silent ? s : log(s, 'bad', 'No hay lugar en el depósito. Agrandá el local o liquidá stock.', 'bad')
  const t = now(s)
  const nextOpen = (s.phase === 'night' && s.today === null ? s.day : s.day + 1) * 1440 + OPEN_MIN
  const arrivesAt = source === 'import' ? nextOpen + 2 * 1440 : s.phase === 'day' ? t + 120 : nextOpen
  const next: GameState = { ...s, capital: s.capital - cost, purchases: [...s.purchases, { id: newId('p'), productId, qty, arrivesAt, source }] }
  if (silent) return next
  return log(next, 'cash', `🛒 Compraste ${qty}× ${product.name} por ${money(cost)}. ${source === 'import' ? 'Llega en 3 días.' : s.phase === 'day' ? 'Llega en 2 horas.' : 'Llega a primera hora.'}`, 'cash')
}

export const liquidate = (s: GameState, productId: string, qty: number): GameState => {
  const have = s.stock[productId] ?? 0
  const amount = Math.min(have, qty)
  if (amount <= 0) return s
  const product = productById(productId)
  const value = Math.round(unitCost(s, product, 'once') * .5) * amount
  const stock = { ...s.stock, [productId]: have - amount }
  if (stock[productId] <= 0) delete stock[productId]
  return log({ ...s, stock, capital: s.capital + value }, 'cash', `Liquidaste ${amount}× ${product.name} a un revendedor por ${money(value)}.`, 'cash')
}

export const setTier = (s: GameState, rubro: RubroId, tier: PriceTier): GameState => ({ ...s, tiers: { ...s.tiers, [rubro]: tier } })
export const setRestock = (s: GameState, productId: string, min: number): GameState => {
  const autoRestock = { ...s.autoRestock }
  if (min <= 0) delete autoRestock[productId]
  else autoRestock[productId] = min
  return { ...s, autoRestock }
}

export const research = (s: GameState, id: string): GameState => {
  if (id.startsWith('rubro:')) {
    const rubro = rubroById(id.slice(6) as RubroId)
    const cost = Math.round(rubro.cost * s.priceIndex)
    if (s.rubros.includes(rubro.id) || s.ideas < rubro.ideas || s.capital < cost || s.level < rubro.minLevel) return s
    return log({ ...s, rubros: [...s.rubros, rubro.id], ideas: s.ideas - rubro.ideas, capital: s.capital - cost }, 'good', `${rubro.emoji} Nuevo rubro: ${rubro.name}. Ya podés comprar y vender.`, 'level')
  }
  const r = RESEARCH.find(item => item.id === id)
  if (!r) return s
  const cost = Math.round(r.cost * s.priceIndex)
  if (s.research.includes(id) || s.ideas < r.ideas || s.capital < cost || s.level < r.minLevel || (r.requires && !s.research.includes(r.requires))) return s
  let next: GameState = { ...s, research: [...s.research, id], ideas: s.ideas - r.ideas, capital: s.capital - cost }
  if (id === 'instagram') next.channels = [...next.channels, 'instagram']
  if (id === 'chango') next.channels = [...next.channels, 'chango']
  if (id === 'app') next.channels = [...next.channels, 'app']
  return log(next, 'good', `${r.emoji} Desarrollaste: ${r.name}. ${r.desc}`, 'level')
}

export const runCampaign = (s: GameState, id: string): GameState => {
  const camp = CAMPAIGNS.find(item => item.id === id)
  if (!camp) return s
  const cost = Math.round(camp.cost * s.priceIndex)
  if (cost > s.capital || s.level < camp.minLevel || (camp.once && s.story.flags.includes(`camp-${id}`)) || (camp.requires && !s.research.includes(camp.requires))) return s
  if (s.modifiers.some(m => m.id.startsWith(`camp-${id}`) && m.until > now(s))) return log(s, 'bad', 'Esa campaña ya está corriendo.', 'bad')
  const start = s.phase === 'day' || s.phase === 'closing' ? s.day : s.phase === 'night' && s.today === null ? s.day : s.day + 1
  const until = camp.days > 1000 ? Number.MAX_SAFE_INTEGER : (start + camp.days - 1) * 1440 + 1439
  const next: GameState = { ...s, capital: s.capital - cost, fans: s.fans + camp.fans, modifiers: [...s.modifiers, { id: `camp-${id}-${s.day}`, label: camp.name, until, demand: camp.demand, zone: camp.zone }], story: camp.once ? { ...s.story, flags: [...s.story.flags, `camp-${id}`] } : s.story, stats: { ...s.stats, detail: { ...s.stats.detail, Publicidad: (s.stats.detail.Publicidad ?? 0) + cost } } }
  return log(next, 'good', `${camp.emoji} Lanzaste "${camp.name}". +${camp.fans} fans.`, 'level')
}

export const hire = (s: GameState, candidateId: string): GameState => {
  const candidate = s.candidates.find(c => c.id === candidateId)
  if (!candidate || s.couriers.length >= level(s).couriers) return log(s, 'bad', 'No tenés lugar para más gente. Agrandá el local.', 'bad')
  return log({ ...s, couriers: [...s.couriers, candidate], candidates: s.candidates.filter(c => c.id !== candidateId) }, 'good', `🤝 Contrataste a ${candidate.name}. Viene con su bici.`, 'level')
}
export const fire = (s: GameState, courierId: string): GameState => {
  const c = s.couriers.find(x => x.id === courierId)
  if (!c || c.isPlayer || c.trip) return s
  return log({ ...s, couriers: s.couriers.filter(x => x.id !== courierId), vehicles: c.vehicleId === 'bici' ? s.vehicles : [...s.vehicles, c.vehicleId] }, 'info', `Despediste a ${c.name}. Se llevó su bici.`)
}
export const buyVehicle = (s: GameState, vehicleId: string): GameState => {
  const v = vehicleById(vehicleId)
  const price = Math.round(v.price * s.priceIndex)
  if (price > s.capital || s.level < v.minLevel) return s
  return log({ ...s, capital: s.capital - price, vehicles: [...s.vehicles, vehicleId] }, 'cash', `${v.emoji} Compraste ${v.name}. Asignalo a alguien del equipo.`, 'cash')
}
export const assignVehicle = (s: GameState, courierId: string, vehicleId: string): GameState => {
  const c = s.couriers.find(x => x.id === courierId)
  const idx = s.vehicles.indexOf(vehicleId)
  if (!c || c.trip || idx < 0) return s
  const vehicles = [...s.vehicles]
  vehicles.splice(idx, 1)
  if (c.vehicleId !== 'bici') vehicles.push(c.vehicleId)
  return log({ ...s, vehicles, couriers: s.couriers.map(x => x.id === courierId ? { ...x, vehicleId } : x) }, 'info', `${c.name.split(' ')[0]} ahora maneja ${vehicleById(vehicleId).name}.`)
}

export const upgradePrice = (s: GameState) => {
  const target = LEVELS[s.level + 1]
  if (!target) return 0
  return Math.round(target.price * s.priceIndex * (s.level + 1 === 2 && s.story.flags.includes('descuento-galpon') ? .75 : 1))
}
export const upgradeLevel = (s: GameState): GameState => {
  const target = LEVELS[s.level + 1]
  const price = upgradePrice(s)
  if (!target || price > s.capital) return s
  return log({ ...s, level: s.level + 1, capital: s.capital - price, fans: s.fans + 30 * (s.level + 1) }, 'good', `${target.emoji} ¡Nueva etapa: ${target.name}! ${target.desc}`, 'level')
}

export const takeLoan = (s: GameState, id: string): GameState => {
  const loan = LOANS.find(l => l.id === id)
  if (!loan || (loan.once && s.loanTaken.includes(id)) || (loan.minLevel && s.level < loan.minLevel) || s.loans.some(l => l.id === id)) return s
  return log({ ...s, capital: s.capital + loan.amount, loans: [...s.loans, { id, name: loan.name, perDay: loan.perDay, daysLeft: loan.days }], loanTaken: [...s.loanTaken, id] }, 'cash', `${loan.emoji} ${loan.name}: +${money(loan.amount)}. Cuota diaria ${money(loan.perDay)}.`, 'cash')
}

export const claimGoal = (s: GameState, id: string): GameState => {
  const goal = GOALS.find(g => g.id === id)
  if (!goal || s.goalsClaimed.includes(id) || !goal.check(s)) return s
  return log(applyEffect({ ...s, goalsClaimed: [...s.goalsClaimed, id] }, goal.reward), 'good', `🏆 Desafío cumplido: ${goal.title}. Premio: ${goal.rewardText}.`, 'level')
}

export const pendingGoals = (s: GameState) => GOALS.filter(g => !s.goalsClaimed.includes(g.id) && g.check(s)).length
export const RUBRO_LIST = RUBROS
export const VEHICLE_LIST = VEHICLES
