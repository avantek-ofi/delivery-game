import type { GameState } from '../game/types'
import { formatGameTime } from '../game/time'

export function Taskbar({ game, setSpeed }: { game: GameState; setSpeed: (speed: 0|1|2|4) => void }) {
  const time = formatGameTime(game.gameMinutes)
  return <footer className="pixel-taskbar"><button>INICIO</button><span>CAPITAL ${game.capital.toLocaleString('es-AR')}</span><span>REP ★ {game.reputation.toFixed(1)}</span><span>PEDIDOS {game.orders.filter(order => order.status !== 'delivered').length}</span><span className="taskbar-time">DIA {time.day} · {time.clock}</span><div>{([0,1,2,4] as const).map(speed => <button className={game.speed === speed ? 'active' : ''} onClick={() => setSpeed(speed)} key={speed}>{speed ? `×${speed}` : 'PAUSA'}</button>)}</div></footer>
}
