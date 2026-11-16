import { useEffect, useRef, useState } from 'react'
import mapImg from '../assets/caba-arcade-map.png'
import { BARRIOS, ZONE_COLORS } from '../game/barrios'
import { productById } from '../game/catalog'
import { vehicleById } from '../game/content'
import { basePos, courierPos, inCoverage, level, missingFor, now, orderPoint } from '../game/engine'
import type { GameState } from '../game/types'
import { PixelIcon } from '../ui/PixelIcon'

const ASPECT = 1672 / 941

function useFit() {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 800, h: 450 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      const w = Math.min(width, height * ASPECT)
      setSize({ w, h: w / ASPECT })
    }
    update()
    const obs = new ResizeObserver(update)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, size }
}

export function CityMap({ s, selected, onToggle, focusCourier }: { s: GameState; selected: string[]; onToggle: (id: string) => void; focusCourier: string | null }) {
  const { ref, size } = useFit()
  const t = now(s)
  const base = basePos(s)
  const radius = level(s).radius
  const hour = s.minute / 60
  const dusk = s.phase === 'night' || s.phase === 'summary' ? .62 : hour >= 19 ? Math.min(.55, (hour - 19) * .22) : hour < 10 ? Math.max(0, (10 - hour) * .2) : 0
  const waiting = s.orders.filter(o => o.status === 'waiting')
  const routes = s.couriers.filter(c => c.trip)
  const weather = s.today?.id === 'lluvia' ? 'rain' : s.today?.id === 'frio' ? 'cold' : s.today?.id === 'calor' ? 'heat' : ''
  return <div className="map-fit" ref={ref}>
    <div className={`map ${weather}`} style={{ width: size.w, height: size.h }}>
      <img src={mapImg} alt="Mapa de CABA" draggable={false} />
      <div className="map-tint" style={{ opacity: dusk }} />
      {weather === 'rain' && <div className="rain" />}
      <div className="coverage" style={{ left: `${base.x}%`, top: `${base.y}%`, width: `${radius * 2}%`, height: `${radius * 2 * ASPECT}%` }} />
      <svg className="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        {routes.map(c => {
          const pos = courierPos(s, c)
          const rest = c.trip!.stops.slice(c.trip!.done)
          const pts = [pos, ...rest].map(p => `${p.x},${p.y}`).join(' ')
          return <polyline key={c.id} points={pts} className={`route-line ${focusCourier === c.id ? 'focus' : ''}`} vectorEffect="non-scaling-stroke" />
        })}
        {selected.map(id => { const o = s.orders.find(x => x.id === id); if (!o) return null; const p = orderPoint(o); return <line key={id} x1={base.x} y1={base.y} x2={p.x} y2={p.y} className="select-line" vectorEffect="non-scaling-stroke" /> })}
      </svg>
      {BARRIOS.map(b => {
        const covered = inCoverage(s, b.id)
        return <span key={b.id} className={`barrio-label ${covered ? '' : 'off'}`} style={{ left: `${b.x}%`, top: `${b.y}%`, ['--zone' as string]: ZONE_COLORS[b.zone] }}>{b.name}</span>
      })}
      <div className="base-marker" style={{ left: `${base.x}%`, top: `${base.y}%` }} title={s.storeName}>
        <PixelIcon emoji={['🛏️', '🏪', '🏭', '🏢', '🏙️'][s.level]} size={34} res={18} />
        <span>{s.storeName}</span>
      </div>
      {waiting.map(o => {
        const p = orderPoint(o)
        const left = Math.max(0, (o.expiresAt - t) / (o.expiresAt - o.createdAt))
        const missing = missingFor(s, o).length > 0
        const isSel = selected.includes(o.id)
        return <button key={o.id} className={`pin pin--${o.kind} ${isSel ? 'sel' : ''} ${missing ? 'missing' : ''} ${left < .3 ? 'hurry' : ''}`} style={{ left: `${p.x}%`, top: `${p.y}%`, ['--left' as string]: `${left * 360}deg` }} onClick={() => onToggle(o.id)} title={`${o.customer}: ${o.lines.map(l => `${l.qty}× ${productById(l.productId).name}`).join(', ')}`}>
          <span className="pin-ring" />
          <PixelIcon emoji={productById(o.lines[0].productId).emoji} size={22} res={16} />
          {missing && <b className="pin-flag">!</b>}
        </button>
      })}
      {s.couriers.filter(c => c.trip).map(c => {
        const pos = courierPos(s, c)
        return <div key={c.id} className={`courier-dot ${focusCourier === c.id ? 'focus' : ''} ${c.trip?.incident?.fired && s.pendingIncident?.courierId === c.id ? 'alert' : ''}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
          <span style={{ transform: `scaleX(${pos.heading > 0 ? -1 : 1})` }}><PixelIcon emoji={vehicleById(c.vehicleId).emoji} size={26} res={16} /></span>
          <small>{c.name.split(' ')[0]}</small>
        </div>
      })}
      {s.today && s.phase === 'day' && <div className="map-weather"><PixelIcon emoji={s.today.emoji} size={22} res={16} /> {s.today.title}</div>}
    </div>
  </div>
}
