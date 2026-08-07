export type Category = 'Tecnología' | 'Ropa' | 'Hogar' | 'Mascotas' | 'Deportes' | 'Belleza' | 'Juguetes' | 'Papelería' | 'Cocina' | 'Accesorios'
export type AutomationState = { salesBot: number; autoPacking: number; marketing: number }
export type FacilityState = { level: 0 | 1 | 2 | 3; storage: number; packing: number; dispatch: number }

export type Shipment = {
  id: string
  productId: string
  quantity: number
  arrivesAt: number
  received: boolean
}

export type Listing = { productId: string; price: number; quantity: number; platformId: string }
export type Offer = { id: string; productId: string; platformId: string; quantity: number; amount: number; expiresAt: number; zoneId: string; status: 'pending' | 'accepted' | 'rejected' | 'expired' }
export type Order = { id: string; offerId: string; productId: string; platformId: string; quantity: number; amount: number; zoneId: string; dueAt: number; status: 'to_prepare' | 'preparing' | 'ready' | 'delivering' | 'delivered'; readyAt?: number; completedAt?: number }
export type OrderStats = { completed: number; revenue: number; incidents: number }
export type DeliveryIncident = 'none' | 'goods' | 'bike' | 'all'
export type MarketEvent = { id: string; label: string; description: string; multiplier: number; endsAt: number; tone: 'positive' | 'negative' } | null
export type DeliveryEvent = { id: string; label: string; description: string; tone: 'positive' | 'warning' } | null
export type ActiveDelivery = { vehicleId?: string; orderIds: string[]; route: string[]; startsAt: number; endsAt: number; incident: DeliveryIncident; event: DeliveryEvent }

export type GameState = {
  storeName: string
  category: Category
  gameMinutes: number
  speed: 0 | 1 | 2 | 4
  createdAt: string
  capital: number
  dollarRate: number
  shipments: Shipment[]
  inventory: Record<string, number>
  listings: Listing[]
  offers: Offer[]
  orders: Order[]
  orderStats: OrderStats
  lastOfferAt: number
  activeDelivery: ActiveDelivery | null
  activeDeliveries: ActiveDelivery[]
  reputation: number
  energy: number
  bicycleAvailable: boolean
  marketEvent: MarketEvent
  lastMarketEventAt: number
  automation: AutomationState
  facility: FacilityState
  ownedVehicles: string[]
  activeVehicleId: string
}
