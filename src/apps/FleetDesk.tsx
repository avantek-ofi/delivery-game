import type React from 'react'
import { findVehicle, vehicles } from '../game/economy'
import type { GameState } from '../game/types'
import { getVehicleUnlock } from '../progression/objectives'

export function FleetDesk({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const buyOrSelect = (id: string) => setGame(current => {
    if (!current) return null
    const vehicle = findVehicle(id)
    const unlock = getVehicleUnlock(current, id)
    if (!unlock.unlocked) return current
    if (current.ownedVehicles.includes(id)) return { ...current, activeVehicleId: id }
    if (current.capital < vehicle.price) return current
    return { ...current, capital: current.capital - vehicle.price, ownedVehicles: [...current.ownedVehicles, id], activeVehicleId: id }
  })

  const totalOwned = game.ownedVehicles.filter(id => id !== 'mensajero').length
  return <div className="modal-backdrop">
    <section className="supplier-window fleet-desk">
      <header><div><small>FLOTA Y DESBLOQUEOS</small><h2>Vehículos</h2></div><button onClick={onClose}>X</button></header>
      <p className="fleet-copy">Cada vehículo se habilita con resultados. El activo define capacidad y velocidad de tu próxima ruta.</p>
      <section className="fleet-summary">
        <div><span>FLOTA PROPIA</span><strong>${totalOwned} vehículo${totalOwned === 1 ? '' : 's'} operativo${totalOwned === 1 ? '' : 's'}</strong></div>
        <div><span>CAPITAL DISPONIBLE</span><strong>$${game.capital.toLocaleString('es-AR')}</strong></div>
      </section>
      <section className="fleet-grid">
        {vehicles.filter(vehicle => vehicle.id !== 'mensajero').map(vehicle => {
          const unlock = getVehicleUnlock(game, vehicle.id)
          const owned = game.ownedVehicles.includes(vehicle.id)
          const active = game.activeVehicleId === vehicle.id
          const classes = ['fleet-card', !unlock.unlocked ? 'locked' : '', owned ? 'owned' : ''].filter(Boolean).join(' ')
          return <article className={classes} key={vehicle.id}>
            <header><strong>{vehicle.name}</strong><span>{!unlock.unlocked ? 'BLOQUEADO' : active ? 'ACTIVO' : owned ? 'EN FLOTA' : 'DISPONIBLE'}</span></header>
            <dl>
              <div><dt>Capacidad</dt><dd>{vehicle.capacity} pedidos</dd></div>
              <div><dt>Velocidad</dt><dd>x{vehicle.speed}</dd></div>
              <div><dt>Mantenimiento</dt><dd>$${vehicle.maintenance.toLocaleString('es-AR')}</dd></div>
              <div><dt>Precio</dt><dd>$${vehicle.price.toLocaleString('es-AR')}</dd></div>
            </dl>
            <p className="lock-reason">{unlock.unlocked ? owned ? 'Listo para asignar a despacho.' : 'Desbloqueado: podés comprarlo.' : unlock.requirement}</p>
            <button disabled={!unlock.unlocked || (!owned && game.capital < vehicle.price)} onClick={() => buyOrSelect(vehicle.id)}>{!unlock.unlocked ? 'REQUISITO' : active ? 'ACTIVO' : owned ? 'USAR EN DESPACHO' : 'COMPRAR $' + vehicle.price.toLocaleString('es-AR')}</button>
          </article>
        })}
      </section>
      <p className="fleet-hint">Completá ventas y entregas para abrir la moto, el auto y la camioneta. Los pedidos grandes necesitan vehículos con más capacidad.</p>
    </section>
  </div>
}
