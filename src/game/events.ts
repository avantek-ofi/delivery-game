import settings from '../data/events.json'
import type { DeliveryEvent, MarketEvent } from './types'

export type MarketEventTemplate = Omit<NonNullable<MarketEvent>, 'endsAt'> & { duration: number }
export type DeliveryEventTemplate = NonNullable<DeliveryEvent> & { timeMultiplier: number; riskMultiplier: number }

export const pickMarketEvent = (): MarketEventTemplate => settings.market[Math.floor(Math.random() * settings.market.length)] as MarketEventTemplate
export const pickDeliveryEvent = (): DeliveryEventTemplate | null => Math.random() < settings.deliveryEventChance ? settings.delivery[Math.floor(Math.random() * settings.delivery.length)] as DeliveryEventTemplate : null
