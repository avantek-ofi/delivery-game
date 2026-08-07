import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../game/types'

type WidgetLayout = { x: number; y: number; compact: boolean; hidden: boolean; locked: boolean }
const KEY = 'delivery-game:widget-radio-v1'
const read = (): WidgetLayout => { try { return { x: 0, y: 0, compact: false, hidden: false, locked: false, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return { x: 0, y: 0, compact: false, hidden: false, locked: false } } }

export function DesktopWidgets({ game }: { game: GameState }) {
  const [layout, setLayout] = useState<WidgetLayout>(read)
  const drag = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(layout)), [layout])
  const move = (event: React.PointerEvent<HTMLElement>) => {
    if (!drag.current || layout.locked) return
    setLayout(value => ({ ...value, x: value.x + event.clientX - drag.current!.x, y: value.y + event.clientY - drag.current!.y }))
    drag.current = { x: event.clientX, y: event.clientY }
  }
  if (layout.hidden) return <button className="widget-restore" onClick={() => setLayout(value => ({ ...value, hidden: false }))}>RADIO</button>
  return <section className={`desktop-widgets ${layout.compact ? 'compact' : ''}`} style={{ transform: `translate(${layout.x}px, ${layout.y}px)` }} onPointerMove={move} onPointerUp={() => drag.current = null}>
    <header onPointerDown={event => { if (layout.locked) return; drag.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId) }}><b>RADIO BARRIO</b><span><button title="Minimizar" onClick={() => setLayout(value => ({ ...value, compact: !value.compact }))}>_</button><button title="Bloquear posición" onClick={() => setLayout(value => ({ ...value, locked: !value.locked }))}>{layout.locked ? 'L' : 'o'}</button><button title="Ocultar" onClick={() => setLayout(value => ({ ...value, hidden: true }))}>×</button></span></header>
    <p>USD: <strong>${game.dollarRate.toLocaleString('es-AR')}</strong></p><p>Mercado: demanda estable</p><p>Noticias: sin cortes reportados</p><hr />
    <div><b>${game.capital.toLocaleString('es-AR')}</b><b>★ {game.reputation.toFixed(1)}</b><b>Pedidos {game.orders.filter(order => order.status !== 'delivered').length}</b></div>
  </section>
}
