import settings from '../data/events.json'
import type { DeliveryEvent, MarketEvent } from './types'

export type MarketEventTemplate = Omit<NonNullable<MarketEvent>, 'endsAt'> & { duration: number }
export type DeliveryEventTemplate = NonNullable<DeliveryEvent> & { timeMultiplier: number; riskMultiplier: number }

let lastMarketEventId = ''

export const pickMarketEvent = (): MarketEventTemplate => {
  const choices = settings.market.filter(event => event.id !== lastMarketEventId)
  const pool = choices.length ? choices : settings.market
  const event = pool[Math.floor(Math.random() * pool.length)] as MarketEventTemplate
  lastMarketEventId = event.id
  return event
}
export const pickDeliveryEvent = (): DeliveryEventTemplate | null => Math.random() < settings.deliveryEventChance ? settings.delivery[Math.floor(Math.random() * settings.delivery.length)] as DeliveryEventTemplate : null
