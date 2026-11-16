export type RubroId = 'celus' | 'mate' | 'ropa' | 'futbol' | 'bazar' | 'almacen' | 'gamer' | 'mascotas' | 'belleza' | 'ferreteria' | 'electro' | 'libreria'
export type PriceTier = 'barato' | 'justo' | 'caro'
export type Channel = 'whatsapp' | 'instagram' | 'chango' | 'app'
export type Speed = 0 | 1 | 2 | 3
export type Phase = 'day' | 'closing' | 'summary' | 'night' | 'gameover'

export type Product = {
  id: string
  rubro: RubroId
  name: string
  emoji: string
  price: number // precio de mercado a índice 1
  cost: number // costo mayorista a índice 1
  vol: number // espacio que ocupa (1 a 6)
  pop: number // popularidad base
  fragile?: boolean
  bulky?: boolean // necesita utilitario
}

export type Barrio = { id: string; name: string; zone: 'Norte' | 'Centro' | 'Oeste' | 'Sur'; x: number; y: number; wealth: number; risk: number; demand: number }

export type OrderKind = 'normal' | 'urgente' | 'mayorista' | 'vip'
export type OrderLine = { productId: string; qty: number }
export type Order = {
  id: string
  customer: string
  barrioId: string
  lines: OrderLine[]
  total: number
  channel: Channel
  kind: OrderKind
  createdAt: number // minuto absoluto
  expiresAt: number
  promiseAt: number // hora límite de entrega prometida
  note: string
  status: 'waiting' | 'route' | 'delivered' | 'failed' | 'cancelled'
  cogs?: number
  courierId?: string
  rating?: number
}

export type Stop = { x: number; y: number; orderId: string | null; at: number }
export type Trip = { startedAt: number; from: { x: number; y: number }; stops: Stop[]; incident: TripIncident | null; done: number; ratingMod: number }
export type TripIncident = { id: string; at: number; fired: boolean }

export type Courier = {
  id: string
  name: string
  emoji: string
  bio: string
  speed: number // 1..5
  care: number // 1..5
  salary: number // por día, a índice 1
  vehicleId: string
  energy: number // 0..100
  xp: number
  trips: number
  trip: Trip | null
  isPlayer?: boolean
  injuredUntilDay?: number
}

export type Vehicle = { id: string; name: string; emoji: string; price: number; cap: number; speed: number; upkeep: number; risk: number; bulky: boolean; minLevel: number; desc: string }

export type Purchase = { id: string; productId: string; qty: number; arrivesAt: number; source: 'once' | 'import' }

export type Modifier = { id: string; label: string; until: number; demand?: number; rubro?: RubroId; zone?: Barrio['zone']; speed?: number; risk?: number; cost?: number; tips?: number }

export type DayEvent = { id: string; title: string; text: string; emoji: string; tone: 'good' | 'bad' | 'neutral'; demand?: number; rubros?: Partial<Record<RubroId, number>>; speed?: number; risk?: number; cost?: number; dollar?: number; tips?: number }

export type Effect = { capital?: number; rep?: number; fans?: number; ideas?: number; energy?: number; flag?: string; modifier?: Omit<Modifier, 'until' | 'id'> & { days: number }; relation?: [string, number]; dollar?: number; stock?: OrderLine[] }
export type Choice = { label: string; detail: string; effect: Effect; result: string; cost?: number }
export type StoryCard = { id: string; who: string; emoji: string; title: string; text: string; choices: Choice[] }

export type LogEntry = { id: number; at: number; tone: 'good' | 'bad' | 'info' | 'cash' | 'call'; text: string; sound?: 'ring' | 'cash' | 'bad' | 'good' | 'level' }

export type DayStats = { day: number; revenue: number; cogs: number; expenses: number; fees: number; delivered: number; failed: number; lost: number; ratings: number[]; fansStart: number; repStart: number; tips: number; detail: Record<string, number> }

export type Loan = { id: string; name: string; perDay: number; daysLeft: number }

export type GameState = {
  version: 2
  seed: number
  playerName: string
  storeName: string
  baseBarrioId: string
  day: number
  minute: number // minuto del día (0..1440)
  phase: Phase
  speed: Speed
  capital: number
  priceIndex: number
  dollar: number
  rep: number // 0..5
  repBonus: number
  ratings: number[] // últimas calificaciones
  fans: number
  ideas: number
  level: number // nivel del local 0..4
  rubros: RubroId[]
  channels: Channel[]
  research: string[]
  tiers: Partial<Record<RubroId, PriceTier>>
  stock: Record<string, number>
  purchases: Purchase[]
  autoRestock: Record<string, number>
  orders: Order[]
  couriers: Courier[]
  vehicles: string[] // vehículos sin asignar (garage)
  candidates: Courier[]
  modifiers: Modifier[]
  today: DayEvent | null
  tomorrow: DayEvent | null
  story: { seen: string[]; flags: string[]; relations: Record<string, number> }
  pendingStory: StoryCard | null
  pendingIncident: { courierId: string; incidentId: string } | null
  goalsClaimed: string[]
  loans: Loan[]
  loanTaken: string[]
  log: LogEntry[]
  logSeq: number
  nextOrderAt: number
  stats: DayStats
  history: DayStats[]
  lifetime: { delivered: number; failed: number; revenue: number; profit: number; bestDay: number; maxFans: number; perfect: number }
  debtDays: number
  autoDispatch: boolean
  won: boolean
}
