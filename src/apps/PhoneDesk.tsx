import { useState } from 'react'
import type React from 'react'
import { findVehicle } from '../game/economy'
import type { DesktopTheme, GameState } from '../game/types'
import { getBusinessRank, getUnlockFeed } from '../progression/objectives'

type PhoneTab = 'home' | 'garage' | 'style' | 'lab'

export function PhoneDesk({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const [tab, setTab] = useState<PhoneTab>('home')
  const rank = getBusinessRank(game)
  const feed = getUnlockFeed(game).slice(0, 3)
  const themes: Array<{ id: DesktopTheme; label: string; color: string }> = [
    { id: 'night', label: 'Noche', color: '#34477c' },
    { id: 'sunset', label: 'Sol', color: '#c65a45' },
    { id: 'mint', label: 'Menta', color: '#2a877a' },
  ]
  const ownedVehicles = game.ownedVehicles.map(findVehicle)
  const activeVehicle = findVehicle(game.activeVehicleId)
  const selectVehicle = (id: string) => setGame(current => current && ({ ...current, activeVehicleId: id }))

  return <div className="modal-backdrop">
    <section className="phone-desk pixel-phone-desk">
      <header><span>TERMINAL DE BOLSILLO</span><button onClick={onClose}>X</button></header>
      <div className="app-body">
        <section className="phone-shell pixel-phone-shell">
          <div className="phone-speaker"></div>
          <div className="phone-screen pixel-phone-screen">
            <div className="phone-status"><span>RED BARRIAL</span><span>BAT 100%</span></div>
            <div className="phone-title"><div><span>{game.storeName.toUpperCase()}</span><br /><strong>REBUSQUE OS</strong></div><b>R{rank.level}</b></div>
            <nav className="phone-tabs">
              <button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>INICIO</button>
              <button className={tab === 'garage' ? 'active' : ''} onClick={() => setTab('garage')}>GARAGE</button>
              <button className={tab === 'style' ? 'active' : ''} onClick={() => setTab('style')}>ESTILO</button>
              <button className={tab === 'lab' ? 'active' : ''} onClick={() => setTab('lab')}>LAB</button>
            </nav>
            {tab === 'home' && <section className="phone-page">
              <div className="phone-rank"><small>RANGO ACTUAL</small><b>{rank.name}</b></div>
              <p className="phone-message">{game.marketEvent ? game.marketEvent.label + ': ' + game.marketEvent.description : 'Tu central movil concentra el estado del negocio y futuras herramientas.'}</p>
              <div className="phone-notifications">{feed.map(item => <div className="phone-alert" key={item.id}><span>{item.unlocked ? 'OK' : '...' } {item.id.replace('-', ' ')}</span><small>{item.unlocked ? 'Disponible' : item.requirement}</small></div>)}</div>
            </section>}
            {tab === 'garage' && <section className="phone-page">
              <p className="phone-message">Elegí el vehículo predeterminado para la próxima ruta. Las compras se hacen desde Desarrollo.</p>
              <div className="phone-garage">{ownedVehicles.map(vehicle => <button key={vehicle.id} className={vehicle.id === activeVehicle.id ? 'active' : ''} onClick={() => selectVehicle(vehicle.id)}><b>{vehicle.name}</b><span>{vehicle.capacity} paquetes · x{vehicle.speed}</span><small>{vehicle.id === activeVehicle.id ? 'SELECCIONADO' : 'USAR EN DESPACHO'}</small></button>)}</div>
            </section>}
            {tab === 'style' && <section className="phone-page">
              <p className="phone-message">Personalizá la central. Las apariencias no cambian el balance ni la reputación.</p>
              <div className="phone-themes">{themes.map(theme => <button className={game.desktopTheme === theme.id ? 'active' : ''} key={theme.id} style={{ '--theme-color': theme.color } as React.CSSProperties} onClick={() => setGame(current => current && ({ ...current, desktopTheme: theme.id }))}><i></i>{theme.label}</button>)}</div>
              <div className="phone-preview"><span>ESCRITORIO</span><b>{game.storeName}</b><small>Tema {themes.find(item => item.id === game.desktopTheme)?.label}</small></div>
            </section>}
            {tab === 'lab' && <section className="phone-page phone-lab">
              <small>PROXIMAMENTE</small><h3>Laboratorio barrial</h3>
              <p>Minijuegos, misiones de reparto, personalizacion de flota y herramientas especiales se desbloquearan desde aca.</p>
              <div><span>MINIJUEGOS</span><b>EN DESARROLLO</b></div><div><span>VINILOS DE FLOTA</span><b>EN DESARROLLO</b></div>
            </section>}
          </div>
        </section>
      </div>
    </section>
  </div>
}
