import type { GameState } from '../game/types'

export type GoalReward = { capital?: number; reputation?: number; energy?: number }
export type Goal = { id: string; title: string; description: string; reward: GoalReward; complete: boolean; progress: string }

const recurringCustomers = (game: GameState) => {
  const visits = new Map<string, number>()
  game.customerNotes.forEach(note => visits.set(note.buyerName, (visits.get(note.buyerName) ?? 0) + 1))
  return [...visits.values()].filter(value => value > 1).length
}

export const getBusinessRank = (game: GameState) => {
  if (game.facility.level >= 3 && game.ownedVehicles.length >= 3) return { level: 4, name: 'Operador logistico' }
  if (game.facility.level >= 2 || game.ownedVehicles.length >= 2) return { level: 3, name: 'Centro de despacho' }
  if (game.facility.level >= 1 || game.orderStats.completed >= 3) return { level: 2, name: 'Microempresa barrial' }
  return { level: 1, name: 'Tienda emergente' }
}

export const getVehicleUnlock = (game: GameState, vehicleId: string) => {
  const rank = getBusinessRank(game).level
  const delivered = game.progression.totalDelivered
  const rules: Record<string, { unlocked: boolean; requirement: string }> = {
    bici: { unlocked: true, requirement: 'Disponible desde el inicio.' },
    'bici-pro': { unlocked: delivered >= 2 || rank >= 2, requirement: 'Completa 2 entregas o llega a rango 2.' },
    moto: { unlocked: delivered >= 5 && rank >= 2, requirement: 'Completa 5 entregas y alcanza rango 2.' },
    auto: { unlocked: delivered >= 10 && rank >= 3, requirement: 'Completa 10 entregas y alcanza rango 3.' },
    camioneta: { unlocked: delivered >= 20 && rank >= 4, requirement: 'Completa 20 entregas y alcanza rango 4.' }
  }
  return rules[vehicleId] ?? { unlocked: false, requirement: 'Aumenta tu nivel de negocio.' }
}

export const getUnlockFeed = (game: GameState) => {
  const vehicles = ['bici-pro', 'moto', 'auto', 'camioneta'].map(id => ({ id, ...getVehicleUnlock(game, id) }))
  return vehicles
}

export const getObjectives = (game: GameState): Goal[] => [
  { id: 'first-import', title: 'Primera caja', description: 'Importa mercaderia para poblar tu base.', reward: { capital: 12000 }, complete: game.progression.totalImported > 0, progress: `${game.progression.totalImported} unidades importadas` },
  { id: 'first-listing', title: 'Salir a vender', description: 'Publica tu primer producto.', reward: { reputation: 1 }, complete: game.progression.totalListings > 0, progress: `${game.progression.totalListings} publicaciones creadas` },
  { id: 'first-delivery', title: 'Primera entrega', description: 'Completa una entrega en CABA.', reward: { capital: 18000, reputation: 1 }, complete: game.progression.totalDelivered > 0, progress: `${game.progression.totalDelivered} entregas completadas` },
  { id: 'five-listings', title: 'Vidriera activa', description: 'Crea cinco publicaciones a lo largo de la partida.', reward: { capital: 30000 }, complete: game.progression.totalListings >= 5, progress: `${Math.min(5, game.progression.totalListings)}/5 publicaciones` },
  { id: 'base-upgrade', title: 'Base en marcha', description: 'Mejora la base al menos una vez.', reward: { energy: 30 }, complete: game.facility.level >= 1, progress: `Base nivel ${game.facility.level}/1` },
  { id: 'recurring', title: 'Cliente recurrente', description: 'Logra que un cliente vuelva a comprarte.', reward: { reputation: 2 }, complete: recurringCustomers(game) > 0, progress: `${recurringCustomers(game)} cliente(s) recurrentes` },
  { id: 'fleet', title: 'Flota propia', description: 'Compra un segundo vehiculo.', reward: { capital: 50000 }, complete: game.ownedVehicles.length >= 2, progress: `${game.ownedVehicles.length}/2 vehiculos` },
  { id: 'dispatcher', title: 'Despachante', description: 'Completa cinco entregas.', reward: { capital: 70000, reputation: 2 }, complete: game.progression.totalDelivered >= 5, progress: `${Math.min(5, game.progression.totalDelivered)}/5 entregas` }
]
