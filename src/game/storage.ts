import type { GameState } from './types'
import { balance } from './balance'

const KEY = 'delivery-game:save-v1'

export const loadGame = (): GameState | null => {
  try {
    const value = localStorage.getItem(KEY)
    if (!value) return null
    const saved = JSON.parse(value) as Partial<GameState>
    if (!saved.storeName || !saved.category) return null
    const listings = (saved.listings ?? []) as Array<Partial<GameState['listings'][number]>>
    const offers = (saved.offers ?? []) as Array<Partial<GameState['offers'][number]>>
    const orders = (saved.orders ?? []) as Array<Partial<GameState['orders'][number]>>
    const activeDelivery = saved.activeDelivery as Partial<NonNullable<GameState['activeDelivery']>> | null
    const activeDeliveries = (saved.activeDeliveries ?? (activeDelivery ? [activeDelivery] : [])) as Array<Partial<NonNullable<GameState['activeDelivery']>>>
    return {
      ...saved,
      capital: saved.capital ?? balance.initialCapital,
      dollarRate: saved.dollarRate ?? balance.initialDollarRate,
      shipments: saved.shipments ?? [],
      inventory: saved.inventory ?? {},
      listings: listings.map(listing => ({ quantity: listing.quantity ?? 1, platformId: listing.platformId ?? 'mercado-chango', productId: listing.productId ?? '', price: listing.price ?? 0 })),
      offers: offers.map(offer => ({ id: offer.id ?? '', productId: offer.productId ?? '', platformId: offer.platformId ?? 'mercado-chango', quantity: offer.quantity ?? 1, amount: offer.amount ?? 0, expiresAt: offer.expiresAt ?? 0, zoneId: offer.zoneId ?? 'caballito', status: offer.status ?? 'expired', buyerName: offer.buyerName, buyerBudget: offer.buyerBudget, buyerPatience: offer.buyerPatience, buyerPreference: offer.buyerPreference })),
      orders: orders.map(order => ({ id: order.id ?? '', offerId: order.offerId ?? '', productId: order.productId ?? '', platformId: order.platformId ?? 'mercado-chango', quantity: order.quantity ?? 1, amount: order.amount ?? 0, zoneId: order.zoneId ?? 'caballito', dueAt: order.dueAt ?? 0, status: order.status ?? 'delivered', readyAt: order.readyAt, completedAt: order.completedAt, buyerName: order.buyerName })),
      orderStats: saved.orderStats ?? { completed: 0, revenue: 0, incidents: 0 },
      customerNotes: saved.customerNotes ?? [],
      progression: saved.progression ?? { totalImported: 0, totalListings: 0, totalDelivered: saved.orderStats?.completed ?? 0, claimedGoals: [] },
      story: saved.story ?? { decisions: [], relationships: { mara: 0, tadeo: 0, lucia: 0, esteban: 0 }, routeRiskBonus: 0 },
      onboarding: saved.onboarding ?? { phase: 'done', tutorialStep: 0, unlockedApps: ['supplier', 'inventory', 'listings', 'offers', 'orders', 'map', 'upgrades', 'vehicles', 'facility', 'finance', 'customers', 'goals', 'phone', 'neighborhood'], mails: [], research: ['negotiation', 'catalog', 'marketing'] },
      tutorialEnabled: saved.tutorialEnabled ?? false,
      desktopTheme: saved.desktopTheme ?? 'night',
      lastOfferAt: saved.lastOfferAt ?? saved.gameMinutes ?? 0,
      activeDelivery: null,
      activeDeliveries: activeDeliveries.map(delivery => ({ vehicleId: delivery.vehicleId ?? saved.activeVehicleId ?? 'bici', orderIds: delivery.orderIds ?? [], route: delivery.route ?? [], startsAt: delivery.startsAt ?? saved.gameMinutes ?? 0, endsAt: delivery.endsAt ?? saved.gameMinutes ?? 0, incident: delivery.incident ?? 'none', event: delivery.event ?? null })),
      reputation: saved.reputation ?? 0,
      energy: saved.energy ?? 100,
      bicycleAvailable: saved.bicycleAvailable ?? true,
      marketEvent: saved.marketEvent ?? null,
      lastMarketEventAt: saved.lastMarketEventAt ?? saved.gameMinutes ?? 0,
      automation: saved.automation ?? { salesBot: 0, autoPacking: 0, marketing: 0 },
      facility: saved.facility ?? { level: 0, storage: 0, packing: 0, dispatch: 0 },
      ownedVehicles: saved.ownedVehicles ?? ['bici'],
      activeVehicleId: saved.activeVehicleId ?? 'bici',
    } as GameState
  } catch { return null }
}

export const saveGame = (game: GameState) => localStorage.setItem(KEY, JSON.stringify(game))
export const clearGame = () => localStorage.removeItem(KEY)
