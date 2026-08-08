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
export type Offer = { id: string; productId: string; platformId: string; quantity: number; amount: number; expiresAt: number; zoneId: string; status: 'pending' | 'accepted' | 'rejected' | 'expired'; buyerName?: string; buyerBudget?: number; buyerPatience?: number; buyerPreference?: string }
export type Order = { id: string; offerId: string; productId: string; platformId: string; quantity: number; amount: number; zoneId: string; dueAt: number; status: 'to_prepare' | 'preparing' | 'ready' | 'delivering' | 'delivered'; readyAt?: number; completedAt?: number; buyerName?: string }
export type OrderStats = { completed: number; revenue: number; incidents: number }
export type CustomerNote = { id: string; buyerName: string; kind: 'review' | 'complaint' | 'recommendation'; rating: number; text: string; createdAt: number; read?: boolean }
export type ProgressionState = { totalImported: number; totalListings: number; totalDelivered: number; claimedGoals: string[] }
export type DesktopTheme = 'night' | 'sunset' | 'mint'
export type BrandStyle = { logo: string; primary: string; accent: string; baseStyle: 'clasica' | 'neon' | 'taller'; vehicleStyle: 'clasico' | 'racing' | 'neon'; outfitStyle: 'repartidor' | 'urbano' | 'premium'; packageStyle: 'kraft' | 'color' | 'premium' }
export type StoryCharacterId = 'mara' | 'tadeo' | 'lucia' | 'esteban'
export type StoryDecision = { chapterId: string; choiceId: string; createdAt: number }
export type StoryState = { decisions: StoryDecision[]; relationships: Record<StoryCharacterId, number>; routeRiskBonus: number }
export type DesktopApp = 'supplier' | 'inventory' | 'listings' | 'offers' | 'orders' | 'map' | 'upgrades' | 'vehicles' | 'facility' | 'finance' | 'customers' | 'goals' | 'phone' | 'neighborhood'
export type MailMessage = { id: string; sender: string; subject: string; body: string[]; read: boolean; createdAt: number; required?: boolean }
export type OnboardingState = { phase: 'flow' | 'tour' | 'first-mail' | 'done'; tutorialStep: number; unlockedApps: DesktopApp[]; mails: MailMessage[]; research: string[] }
export type DeliveryIncident = 'none' | 'goods' | 'bike' | 'all'
export type MarketEvent = { id: string; label: string; description: string; multiplier: number; endsAt: number; tone: 'positive' | 'negative'; dollarDelta?: number; platformId?: string; category?: Category; severity?: 'leve' | 'serio' | 'critico' } | null
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
  customerNotes: CustomerNote[]
  progression: ProgressionState
  story: StoryState
  onboarding: OnboardingState
  tutorialEnabled: boolean
  desktopTheme: DesktopTheme
  baseZoneId?: string
  brand?: BrandStyle
  lastOfferAt: number
  activeDelivery: ActiveDelivery | null
  activeDeliveries: ActiveDelivery[]
  reputation: number
  energy: number
  bicycleAvailable: boolean
  marketEvent: MarketEvent
  lastMarketEventAt: number
  lastRentAt?: number
  automation: AutomationState
  facility: FacilityState
  ownedVehicles: string[]
  activeVehicleId: string
}
