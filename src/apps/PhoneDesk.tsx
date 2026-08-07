import type React from 'react'
import type { DesktopTheme, GameState } from '../game/types'
import { getBusinessRank, getUnlockFeed } from '../progression/objectives'

export function PhoneDesk({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const rank = getBusinessRank(game)
  const feed = getUnlockFeed(game)
  const themes: Array<{ id: DesktopTheme; label: string }> = [
    { id: 'night', label: 'Noche' },
    { id: 'sunset', label: 'Atardecer' },
    { id: 'mint', label: 'Menta' },
  ]

  return <div className="modal-backdrop">
    <section className="phone-desk">
      <header><span>CELULAR DE GESTIÓN</span><button onClick={onClose}>X</button></header>
      <div className="app-body">
        <section className="phone-shell">
          <div className="phone-screen">
            <div className="phone-status"><span>◉ 09:41</span><span>5G ▰</span></div>
            <div className="phone-title"><div><span>{game.storeName.toUpperCase()}</span><br /><strong>Mi negocio</strong></div><span>⌁</span></div>
            <div className="phone-rank"><small>RANGO {rank.level}</small><b>{rank.name}</b></div>
            <div className="phone-notifications">
              {feed.map(item => <div className="phone-alert" key={item.id}>
                <span>{item.unlocked ? '✓' : '○'} {item.id.replace('-', ' ')}</span>
                <small>{item.unlocked ? 'Disponible en Flota' : item.requirement}</small>
              </div>)}
            </div>
            <p className="phone-message">{game.marketEvent ? game.marketEvent.label + ': ' + game.marketEvent.description : 'Las ventas y entregas abren nuevos vehículos y formas de crecer.'}</p>
            <div className="phone-themes">
              {themes.map(theme => <button className={game.desktopTheme === theme.id ? 'active' : ''} key={theme.id} onClick={() => setGame(current => current && { ...current, desktopTheme: theme.id })}>{theme.label}</button>)}
            </div>
          </div>
        </section>
      </div>
    </section>
  </div>
}
