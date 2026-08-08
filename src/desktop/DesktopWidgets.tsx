import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../game/types'
import { getStoryNews } from '../story/chapters'

type WidgetLayout = { x: number; y: number; compact: boolean; hidden: boolean; locked: boolean }
const KEY = 'delivery-game:widget-radio-v1'
const read = (): WidgetLayout => { try { return { x: 0, y: 0, compact: false, hidden: false, locked: false, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return { x: 0, y: 0, compact: false, hidden: false, locked: false } } }

export function DesktopWidgets({ game, onOpenGrowth }: { game: GameState; onOpenGrowth?: () => void }) {
  const [layout, setLayout] = useState<WidgetLayout>(read)
  const news = getStoryNews(game)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const money = '$' + game.dollarRate.toLocaleString('es-AR')
  const capital = '$' + game.capital.toLocaleString('es-AR')
  const recenter = () => setLayout(value => ({ ...value, x: 0, y: 0, hidden: false }))
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(layout)), [layout])
  const move = (event: React.PointerEvent<HTMLElement>) => {
    if (!drag.current || layout.locked) return
    const rect = event.currentTarget.getBoundingClientRect()
    const dx = event.clientX - drag.current.x
    const dy = event.clientY - drag.current.y
    const boundedX = Math.max(-rect.left + 8, Math.min(window.innerWidth - rect.right - 8, dx))
    const boundedY = Math.max(-rect.top + 34, Math.min(window.innerHeight - rect.bottom - 58, dy))
    setLayout(value => ({ ...value, x: value.x + boundedX, y: value.y + boundedY }))
    drag.current = { x: event.clientX, y: event.clientY }
  }
  return <><button className="widget-recenter" onClick={recenter}>REUBICAR RADIO</button>{layout.hidden ? <button className="widget-restore" onClick={() => setLayout(value => ({ ...value, hidden: false }))}>RADIO</button> : <section className={'desktop-widgets ' + (layout.compact ? 'compact' : '')} style={{ transform: 'translate(' + layout.x + 'px, ' + layout.y + 'px)' }} onPointerMove={move} onPointerUp={() => drag.current = null}><header onPointerDown={event => { if (layout.locked) return; drag.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId) }}><b>RADIO BARRIO</b><span><button title="Minimizar" onClick={() => setLayout(value => ({ ...value, compact: !value.compact }))}>_</button><button title="Bloquear posición" onClick={() => setLayout(value => ({ ...value, locked: !value.locked }))}>{layout.locked ? 'L' : 'o'}</button><button title="Ocultar" onClick={() => setLayout(value => ({ ...value, hidden: true }))}>X</button></span></header><p>USD: <strong>{money}</strong></p><p>Mercado: {news[0].text}</p><p>Noticias: {news[1].text}</p><hr /><div><b>{capital}</b><b>REP {game.reputation.toFixed(1)}</b><b>Pedidos {game.orders.filter(order => order.status !== 'delivered').length}</b></div><section className="widget-research-list"><b>DESARROLLO</b><span>{game.onboarding.unlockedApps.includes('upgrades') ? 'Hay investigación disponible.' : 'Completá tu primera importación para empezar.'}</span><button className="widget-growth" disabled={!game.onboarding.unlockedApps.includes('upgrades')} onClick={onOpenGrowth}>{game.onboarding.unlockedApps.includes('upgrades') ? 'ABRIR DESARROLLO' : 'BLOQUEADO'}</button></section></section>}</>
}
