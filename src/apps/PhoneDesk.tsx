import { useState } from 'react'
import type React from 'react'
import { findVehicle } from '../game/economy'
import { cityZones, findZone } from '../game/map'
import type { BrandStyle, DesktopTheme, GameState } from '../game/types'
import { getBusinessRank, getUnlockFeed } from '../progression/objectives'

type PhoneTab = 'home' | 'garage' | 'style' | 'lab'
const defaultBrand: BrandStyle = { logo: 'R', primary: '#d85a50', accent: '#f3c667', baseStyle: 'clasica', vehicleStyle: 'clasico', outfitStyle: 'repartidor', packageStyle: 'kraft' }

export function PhoneDesk({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const [tab, setTab] = useState<PhoneTab>('home')
  const rank = getBusinessRank(game)
  const feed = getUnlockFeed(game).slice(0, 3)
  const brand = game.brand ?? defaultBrand
  const themes: Array<{ id: DesktopTheme; label: string; color: string }> = [{ id: 'night', label: 'Noche', color: '#34477c' }, { id: 'sunset', label: 'Sol', color: '#c65a45' }, { id: 'mint', label: 'Menta', color: '#2a877a' }]
  const ownedVehicles = game.ownedVehicles.map(findVehicle)
  const activeVehicle = findVehicle(game.activeVehicleId)
  const trophies = new Set(game.orders.filter(order => order.status === 'delivered').map(order => order.zoneId))
  const updateBrand = (change: Partial<BrandStyle>) => setGame(current => current && ({ ...current, brand: { ...(current.brand ?? defaultBrand), ...change } }))
  const selectVehicle = (id: string) => setGame(current => current && ({ ...current, activeVehicleId: id }))
  const cosmetics: Array<{ key: 'baseStyle' | 'vehicleStyle' | 'outfitStyle' | 'packageStyle'; title: string; options: Array<[string, string]> }> = [
    { key: 'baseStyle', title: 'BASE', options: [['clasica', 'Clasica'], ['neon', 'Neon'], ['taller', 'Taller']] },
    { key: 'vehicleStyle', title: 'FLOTA', options: [['clasico', 'Clasico'], ['racing', 'Racing'], ['neon', 'Neon']] },
    { key: 'outfitStyle', title: 'INDUMENTARIA', options: [['repartidor', 'Repartidor'], ['urbano', 'Urbano'], ['premium', 'Premium']] },
    { key: 'packageStyle', title: 'EMPAQUES', options: [['kraft', 'Kraft'], ['color', 'Color'], ['premium', 'Premium']] },
  ]

  return <div className="modal-backdrop"><section className="phone-desk pixel-phone-desk"><header><span>TERMINAL DE BOLSILLO</span><button onClick={onClose}>X</button></header><div className="app-body"><section className="phone-shell pixel-phone-shell"><div className="phone-speaker"></div><div className="phone-screen pixel-phone-screen">
    <div className="phone-status"><span>RED BARRIAL</span><span>BAT 100%</span></div>
    <div className="phone-title"><div><span>{game.storeName.toUpperCase()}</span><br /><strong>REBUSQUE OS</strong></div><b>R{rank.level}</b></div>
    <nav className="phone-tabs"><button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>INICIO</button><button className={tab === 'garage' ? 'active' : ''} onClick={() => setTab('garage')}>GARAGE</button><button className={tab === 'style' ? 'active' : ''} onClick={() => setTab('style')}>MARCA</button><button className={tab === 'lab' ? 'active' : ''} onClick={() => setTab('lab')}>VITRINA</button></nav>
    {tab === 'home' && <section className="phone-page"><div className="phone-rank"><small>RANGO ACTUAL</small><b>{rank.name}</b><span>SEDE: {findZone(game.baseZoneId ?? cityZones[0].id).name}</span></div><p className="phone-message">{game.marketEvent ? game.marketEvent.label + ': ' + game.marketEvent.description : 'Tu central movil concentra la identidad y el crecimiento del negocio.'}</p><div className="phone-notifications">{feed.map(item => <div className="phone-alert" key={item.id}><span>{item.unlocked ? 'OK' : '...' } {item.id.replace('-', ' ')}</span><small>{item.unlocked ? 'Disponible' : item.requirement}</small></div>)}</div></section>}
    {tab === 'garage' && <section className="phone-page"><p className="phone-message">Elegí el vehículo predeterminado para la próxima ruta. Las compras se hacen desde Desarrollo.</p><div className="phone-garage">{ownedVehicles.map(vehicle => <button key={vehicle.id} className={vehicle.id === activeVehicle.id ? 'active' : ''} onClick={() => selectVehicle(vehicle.id)}><b>{vehicle.name}</b><span>{vehicle.capacity} paquetes · x{vehicle.speed}</span><small>{vehicle.id === activeVehicle.id ? 'SELECCIONADO' : 'USAR EN DESPACHO'}</small></button>)}</div></section>}
    {tab === 'style' && <section className="phone-page brand-editor"><p className="phone-message">Tu identidad se ve en el escritorio y aplica estilos a base, flota y empaques.</p><div className="brand-logo-row"><small>LOGO</small>{['R', 'B', '★', 'X', '◈'].map(logo => <button key={logo} className={brand.logo === logo ? 'active' : ''} onClick={() => updateBrand({ logo })}>{logo}</button>)}</div><div className="brand-color-row"><small>PALETA</small>{[['#d85a50', '#f3c667'], ['#356da6', '#8fd7d2'], ['#6d4b96', '#ef91bd'], ['#3b8a65', '#d5e178']].map(([primary, accent]) => <button key={primary} className={brand.primary === primary ? 'active' : ''} style={{ '--brand-primary': primary, '--brand-accent': accent } as React.CSSProperties} onClick={() => updateBrand({ primary, accent })}><i></i></button>)}</div><div className="cosmetic-grid">{cosmetics.map(group => <div key={group.key}><small>{group.title}</small><section>{group.options.map(([id, label]) => <button key={id} className={brand[group.key] === id ? 'active' : ''} onClick={() => updateBrand({ [group.key]: id } as Partial<BrandStyle>)}>{label}</button>)}</section></div>)}</div></section>}
    {tab === 'lab' && <section className="phone-page trophy-case"><small>VITRINA BARRIAL</small><h3>{trophies.size} / {cityZones.length} barrios conquistados</h3><p>Completá una entrega en cada barrio para sumar su insignia a la colección.</p><div>{cityZones.map(zone => <article className={trophies.has(zone.id) ? 'earned' : ''} key={zone.id}><i style={{ background: zone.color }}>{trophies.has(zone.id) ? '★' : '?'}</i><span>{zone.name}<small>{trophies.has(zone.id) ? 'Entrega completada' : 'Pendiente'}</small></span></article>)}</div></section>}
  </div></section></div></section></div>
}
