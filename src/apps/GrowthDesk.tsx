import { useState } from 'react'
import type React from 'react'
import { findVehicle, vehicles } from '../game/economy'
import type { GameState } from '../game/types'
import { getVehicleUnlock } from '../progression/objectives'

type Research = { id: string; title: string; text: string; cost: number; ready: (game: GameState) => boolean }
const research: Research[] = [
  { id: 'negotiation', title: 'Habilidad: negociar', text: 'Habilita ofertas de compradores y contraofertas.', cost: 18000, ready: game => game.progression.totalListings >= 1 },
  { id: 'catalog', title: 'Catálogo ampliado', text: 'ImportaYa abre más productos del rubro.', cost: 24000, ready: game => game.progression.totalImported >= 4 },
  { id: 'suppliers', title: 'Red de importadores', text: 'Acceso a Mayorista Central y Trend Lab.', cost: 32000, ready: game => game.progression.totalDelivered >= 2 },
  { id: 'premium', title: 'Línea premium', text: 'Aparecen productos de mayor costo, margen y precio sugerido.', cost: 50000, ready: game => game.progression.totalDelivered >= 3 },
]
const business = [
  { id: 'salesBot' as const, title: 'Bot de ventas', text: 'Aumenta compras directas.', base: 85000 },
  { id: 'autoPacking' as const, title: 'Mesa automática', text: 'Prepara pedidos más rápido.', base: 120000 },
  { id: 'marketing' as const, title: 'Publicidad', text: 'Atrae más clientes y oportunidades.', base: 70000 },
]

export function GrowthDesk({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const [tab, setTab] = useState<'research' | 'business' | 'fleet'>('research')
  const money = (value: number) => '$' + value.toLocaleString('es-AR')
  const buyResearch = (item: Research) => setGame(current => {
    if (!current || current.onboarding.research.includes(item.id) || !item.ready(current) || current.capital < item.cost) return current
    return { ...current, capital: current.capital - item.cost, onboarding: { ...current.onboarding, research: [...current.onboarding.research, item.id] } }
  })
  const buyBusiness = (id: keyof GameState['automation'], base: number) => setGame(current => {
    if (!current) return null
    const level = current.automation[id]; const cost = Math.round(base * (1 + level * .8))
    if (level >= 3 || current.capital < cost) return current
    return { ...current, capital: current.capital - cost, automation: { ...current.automation, [id]: level + 1 } }
  })
  const storageCost = Math.round(15000 * Math.pow(1.5, game.facility.storage))
  const buyStorage = () => setGame(current => !current || current.facility.storage >= 5 || current.capital < storageCost ? current : ({ ...current, capital: current.capital - storageCost, facility: { ...current.facility, storage: current.facility.storage + 1 } }))
  const buyVehicle = (id: string) => setGame(current => {
    if (!current) return null
    const vehicle = findVehicle(id); const unlock = getVehicleUnlock(current, id)
    if (!unlock.unlocked) return current
    if (current.ownedVehicles.includes(id)) return { ...current, activeVehicleId: id }
    if (current.capital < vehicle.price) return current
    return { ...current, capital: current.capital - vehicle.price, ownedVehicles: [...current.ownedVehicles, id], activeVehicleId: id }
  })
  const storageCapacity = 10 + game.facility.storage * 10 + game.facility.level * 20
  return <div className="modal-backdrop"><section className="supplier-window growth-desk"><header><div><small>DESARROLLO DEL NEGOCIO</small><h2>Investigar y mejorar</h2></div><button onClick={onClose}>X</button></header><div className="growth-tabs"><button className={tab === 'research' ? 'active' : ''} onClick={() => setTab('research')}>INVESTIGACIÓN</button><button className={tab === 'business' ? 'active' : ''} onClick={() => setTab('business')}>NEGOCIO</button><button className={tab === 'fleet' ? 'active' : ''} onClick={() => setTab('fleet')}>FLOTA</button></div><p className="growth-copy">{tab === 'research' ? 'Convertí experiencia en nuevas herramientas.' : tab === 'business' ? 'Capacidad y automatización. Las estanterías llegan hasta 60 paquetes; después, el galpón amplía la escala.' : 'Comprá o seleccioná vehículos desbloqueados sin salir de Desarrollo.'}</p><section className="growth-grid">{tab === 'research' ? research.map(item => { const owned = game.onboarding.research.includes(item.id); const ready = item.ready(game); return <article className={!ready && !owned ? 'locked' : ''} key={item.id}><small>{owned ? 'INVESTIGADO' : ready ? 'DISPONIBLE' : 'REQUISITO PENDIENTE'}</small><h3>{item.title}</h3><p>{item.text}</p><strong>{money(item.cost)}</strong><button disabled={owned || !ready || game.capital < item.cost} onClick={() => buyResearch(item)}>{owned ? 'COMPLETADO' : ready ? 'INVESTIGAR' : 'BLOQUEADO'}</button></article> }) : tab === 'business' ? <><article><small>DEPÓSITO NIVEL {game.facility.storage}/5</small><h3>Estanterías modulares</h3><p>Capacidad actual: {storageCapacity} paquetes. Cada nivel suma 10; el precio sube 50%.</p><strong>{money(storageCost)}</strong><button disabled={game.facility.storage >= 5 || game.capital < storageCost} onClick={buyStorage}>{game.facility.storage >= 5 ? 'DEPÓSITO AL MÁXIMO' : 'AMPLIAR DEPÓSITO'}</button></article>{business.map(item => { const level = game.automation[item.id]; const cost = Math.round(item.base * (1 + level * .8)); return <article key={item.id}><small>NIVEL {level}/3</small><h3>{item.title}</h3><p>{item.text}</p><strong>{money(cost)}</strong><button disabled={level >= 3 || game.capital < cost} onClick={() => buyBusiness(item.id, item.base)}>{level >= 3 ? 'MÁXIMO' : 'MEJORAR'}</button></article> })}</> : vehicles.filter(vehicle => vehicle.id !== 'mensajero').map(vehicle => { const unlock = getVehicleUnlock(game, vehicle.id); const owned = game.ownedVehicles.includes(vehicle.id); const active = game.activeVehicleId === vehicle.id; return <article className={!unlock.unlocked ? 'locked' : ''} key={vehicle.id}><small>{active ? 'ACTIVO' : owned ? 'EN FLOTA' : unlock.unlocked ? 'DISPONIBLE' : 'BLOQUEADO'}</small><h3>{vehicle.name}</h3><p>{vehicle.capacity} paquetes - velocidad x{vehicle.speed}. {unlock.unlocked ? money(vehicle.price) : unlock.requirement}</p><strong>{money(vehicle.price)}</strong><button disabled={!unlock.unlocked || (!owned && game.capital < vehicle.price)} onClick={() => buyVehicle(vehicle.id)}>{active ? 'ACTIVO' : owned ? 'USAR VEHÍCULO' : 'COMPRAR'}</button></article> })}</section><footer>Capital disponible: <strong>{money(game.capital)}</strong></footer></section></div>
}
