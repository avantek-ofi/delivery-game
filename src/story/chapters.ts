import type { GameState, MarketEvent, StoryCharacterId } from '../game/types'

export type StoryEffect = { capital?: number; reputation?: number; energy?: number; routeRiskBonus?: number; market?: Omit<NonNullable<MarketEvent>, 'endsAt'> }
export type StoryChoice = { id: string; label: string; description: string; effect: StoryEffect; relation?: { id: StoryCharacterId; amount: number } }
export type StoryChapter = { id: string; character: StoryCharacterId; name: string; role: string; district: string; title: string; body: string; trigger: (game: GameState) => boolean; choices: StoryChoice[] }

export const characters: Record<StoryCharacterId, { name: string; role: string; tone: string }> = {
  mara: { name: 'Mara Jerez', role: 'Proveedor de confianza', tone: 'gold' },
  tadeo: { name: 'Tadeo Rivas', role: 'Vendedor del barrio', tone: 'blue' },
  lucia: { name: 'Lucía Acosta', role: 'Referente vecinal', tone: 'mint' },
  esteban: { name: 'Esteban Lobo', role: 'Competencia logística', tone: 'red' },
}

export const storyChapters: StoryChapter[] = [
  {
    id: 'mara-first-import', character: 'mara', name: 'Mara Jerez', role: 'Proveedor de confianza', district: 'Once',
    title: 'La primera caja no llega sola',
    body: 'Mara te llama al ver tu primer pedido. Puede reservarte mercadería mejor embalada o liquidarte sobrantes de bodega.',
    trigger: game => game.progression.totalImported > 0,
    choices: [
      { id: 'quality', label: 'Reservar lote cuidado', description: 'Pagás embalaje prioritario y ganás credibilidad.', effect: { capital: -3500, reputation: 1 }, relation: { id: 'mara', amount: 2 } },
      { id: 'liquidation', label: 'Tomar la liquidación', description: 'Entrás con efectivo, pero la relación empieza fría.', effect: { capital: 6500, reputation: -1 }, relation: { id: 'mara', amount: -1 } },
    ],
  },
  {
    id: 'tadeo-shop-window', character: 'tadeo', name: 'Tadeo Rivas', role: 'Vendedor del barrio', district: 'Caballito',
    title: 'La vidriera también habla',
    body: 'Tadeo vio tus publicaciones. Propone recomendarte en la feria barrial o competir por precio en las mismas plataformas.',
    trigger: game => game.progression.totalListings >= 2,
    choices: [
      { id: 'fair', label: 'Apostar por la feria', description: 'Financiás un puesto chico. Sube la reputación y la demanda temporal.', effect: { capital: -8000, reputation: 2, market: { id: 'feria-barrial', label: 'Feria recomendada', description: 'El barrio comparte tu vidriera y llegan más consultas.', multiplier: 1.16, tone: 'positive' } }, relation: { id: 'tadeo', amount: 2 } },
      { id: 'price-war', label: 'Competir por precio', description: 'Cobrás un aporte de Tadeo por una campaña conjunta, a cambio de confianza.', effect: { capital: 9000, reputation: -1 }, relation: { id: 'tadeo', amount: -2 } },
    ],
  },
  {
    id: 'lucia-routes', character: 'lucia', name: 'Lucía Acosta', role: 'Referente vecinal', district: 'Parque Patricios',
    title: 'Las calles tienen memoria',
    body: 'Después de varias entregas, Lucía ofrece presentarte a vecinos que conocen atajos. También te pide prioridad para pedidos urgentes.',
    trigger: game => game.progression.totalDelivered >= 3,
    choices: [
      { id: 'neighbors', label: 'Escuchar a los vecinos', description: 'Ganás energía y reducís el riesgo de futuras rutas.', effect: { energy: 25, reputation: 1, routeRiskBonus: -0.08 }, relation: { id: 'lucia', amount: 2 } },
      { id: 'express', label: 'Ofrecer servicio urgente', description: 'Una propina inmediata a cambio de una reputación más exigente.', effect: { capital: 11000, reputation: -1 }, relation: { id: 'lucia', amount: -1 } },
    ],
  },
  {
    id: 'esteban-scale', character: 'esteban', name: 'Esteban Lobo', role: 'Competencia logística', district: 'Centro',
    title: 'El tamaño cambia las reglas',
    body: 'Con tu base en marcha, Esteban propone compartir una red de repartos. También podés mantenerte independiente y cuidar tu marca.',
    trigger: game => game.facility.level >= 1 && game.progression.totalDelivered >= 6,
    choices: [
      { id: 'network', label: 'Probar la red', description: 'Pagás integración, pero el mercado se activa durante el día.', effect: { capital: -14000, market: { id: 'red-logistica', label: 'Red de repartos', description: 'Una alianza mueve pedidos entre barrios.', multiplier: 1.2, tone: 'positive' } }, relation: { id: 'esteban', amount: 1 } },
      { id: 'independent', label: 'Defender independencia', description: 'Mantenés control y ganás reputación por servicio propio.', effect: { reputation: 2, energy: 12 }, relation: { id: 'esteban', amount: -1 } },
    ],
  },
]

export const hasStoryDecision = (game: GameState, chapterId: string) => game.story.decisions.some(decision => decision.chapterId === chapterId)
export const getStoryChapters = (game: GameState) => storyChapters.map(chapter => ({ ...chapter, resolved: hasStoryDecision(game, chapter.id), available: chapter.trigger(game) && !hasStoryDecision(game, chapter.id) }))
export const getStoryNews = (game: GameState) => {
  const ready = getStoryChapters(game).find(chapter => chapter.available)
  const market = game.marketEvent ? game.marketEvent.label + ': ' + game.marketEvent.description : 'Mercado estable: publicá para generar movimiento.'
  return [
    { title: 'Mercado', text: market },
    ready ? { title: 'Barrio', text: ready.name + ' te espera en ' + ready.district + '.' } : { title: 'Barrio', text: 'No hay decisiones pendientes por ahora.' },
  ]
}
