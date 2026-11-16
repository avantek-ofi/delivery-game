import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BARRIOS, ZONE_COLORS, barrioById } from '../game/barrios'
import { productById } from '../game/catalog'
import { GEO } from '../game/geo'
import { basePos, courierPos, inCoverage, missingFor, now, planRoute, vehicleStats } from '../game/engine'
import type { GameState } from '../game/types'
import { pixelSrc } from '../ui/PixelIcon'

type VB = { x: number; y: number; w: number; h: number }
const clampVB = (vb: VB): VB => {
  const w = Math.max(25, Math.min(GEO.w * 1.1, vb.w))
  const h = vb.h * (w / vb.w)
  return { w, h, x: Math.max(-w * .3, Math.min(GEO.w - w * .7, vb.x)), y: Math.max(-h * .3, Math.min(GEO.h - h * .7, vb.y)) }
}

// Capa estática: barrios, calles y avenidas. Solo se redibuja si cambia la cobertura o el zoom.
const MapBase = memo(function MapBase({ covered, baseId, k, showLabels }: { covered: string; baseId: string; k: number; showLabels: boolean }) {
  const set = new Set(covered.split(','))
  return <g>
    <defs>
      <pattern id="streets" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M1 0V1H0" fill="none" stroke="rgba(190,210,255,.22)" strokeWidth=".09" /></pattern>
      <pattern id="streets3" width="3" height="3" patternUnits="userSpaceOnUse"><path d="M3 0V3H0" fill="none" stroke="rgba(180,200,255,.18)" strokeWidth=".14" /></pattern>
      <pattern id="locked" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V4" stroke="rgba(0,0,0,.35)" strokeWidth="1.4" /></pattern>
    </defs>
    {GEO.areas.map(a => {
      const b = barrioById(a.id)
      const on = set.has(a.id)
      return <g key={a.id} className={`area ${on ? 'on' : 'off'} ${a.kind}`}>
        <path d={a.path} fill={on ? ZONE_COLORS[b.zone] : '#2a2f4a'} fillOpacity={on ? (a.id === baseId ? .5 : .26) : .55} />
        <path d={a.path} fill={k < .5 ? 'url(#streets)' : 'url(#streets3)'} />
        {!on && <path d={a.path} fill="url(#locked)" />}
        <path d={a.path} fill="none" stroke={a.kind === 'partido' ? 'rgba(255,255,255,.35)' : 'rgba(255,235,190,.55)'} strokeWidth={a.kind === 'partido' ? 1.4 : .9} vectorEffect="non-scaling-stroke" strokeDasharray={a.kind === 'partido' ? '6 4' : undefined} />
        <title>{`${a.name}${a.kind === 'partido' ? ' (conurbano)' : ''} · ${on ? 'en tu zona' : 'fuera de cobertura'} · nivel ${b.wealth >= 1.25 ? '$$$' : b.wealth >= 1 ? '$$' : '$'} · riesgo ${b.risk >= .55 ? 'alto' : b.risk >= .35 ? 'medio' : 'bajo'}`}</title>
      </g>
    })}
    {GEO.avenues.map(av => <polyline key={av.name} points={av.pts.map(p => p.join(',')).join(' ')} className="avenue" vectorEffect="non-scaling-stroke"><title>{av.name}</title></polyline>)}
    {showLabels && GEO.areas.map(a => {
      const on = set.has(a.id)
      const size = (a.kind === 'partido' ? 13 : 10.5) * k
      return <text key={a.id} x={a.cx} y={a.cy} className={`area-label ${on ? '' : 'off'} ${a.kind}`} fontSize={size} strokeWidth={size * .28}>{a.kind === 'partido' ? a.name.toUpperCase() : a.name}</text>
    })}
  </g>
})

export function CityMap({ s, selected, onToggle, focusCourier, preview }: { s: GameState; selected: string[]; onToggle: (id: string) => void; focusCourier: string | null; preview: string | null }) {
  const wrap = useRef<HTMLDivElement>(null)
  const [px, setPx] = useState({ w: 800, h: 600 })
  const base = basePos(s)
  const [vb, setVb] = useState<VB>(() => ({ x: base.x - 70, y: base.y - 55, w: 140, h: 110 }))
  const drag = useRef<{ x: number; y: number; vb: VB; moved: boolean } | null>(null)

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const update = () => {
      const r = el.getBoundingClientRect()
      setPx({ w: r.width, h: r.height })
      setVb(v => clampVB({ ...v, h: v.w * (r.height / Math.max(1, r.width)) }))
    }
    update()
    const obs = new ResizeObserver(update)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const zoomAt = useCallback((factor: number, cx?: number, cy?: number) => {
    setVb(v => {
      const fx = cx ?? .5, fy = cy ?? .5
      const w = v.w * factor, h = v.h * factor
      return clampVB({ x: v.x + (v.w - w) * fx, y: v.y + (v.h - h) * fy, w, h })
    })
  }, [])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const r = el.getBoundingClientRect()
      zoomAt(event.deltaY > 0 ? 1.15 : 1 / 1.15, (event.clientX - r.left) / r.width, (event.clientY - r.top) / r.height)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  // al subir de nivel o abrir regiones, encuadrar la nueva cobertura
  const coveredIds = useMemo(() => BARRIOS.filter(b => inCoverage(s, b.id)).map(b => b.id).join(','), [s.level, s.regions.length, s.baseBarrioId]) // eslint-disable-line react-hooks/exhaustive-deps
  const fit = useCallback(() => {
    const ids = new Set(coveredIds.split(','))
    const pts = BARRIOS.filter(b => ids.has(b.id))
    const minX = Math.min(...pts.map(p => p.x)) - 18, maxX = Math.max(...pts.map(p => p.x)) + 18
    const minY = Math.min(...pts.map(p => p.y)) - 18, maxY = Math.max(...pts.map(p => p.y)) + 18
    const aspect = px.h / Math.max(1, px.w)
    let w = maxX - minX, h = maxY - minY
    if (h / w > aspect) w = h / aspect; else h = w * aspect
    setVb(clampVB({ x: (minX + maxX) / 2 - w / 2, y: (minY + maxY) / 2 - h / 2, w, h }))
  }, [coveredIds, px.w, px.h])
  useEffect(() => { fit() }, [coveredIds]) // eslint-disable-line react-hooks/exhaustive-deps

  const k = vb.w / Math.max(1, px.w) // unidades de mapa por píxel
  const t = now(s)
  const waiting = s.orders.filter(o => o.status === 'waiting')
  const plan = preview && selected.length ? planRoute(s, preview, selected) : null
  const hour = s.minute / 60
  const night = s.phase === 'night' || s.phase === 'summary' || hour >= 20 || hour < 8
  const weather = s.today?.id === 'lluvia' ? 'rain' : ''

  const onDown = (event: React.PointerEvent) => { drag.current = { x: event.clientX, y: event.clientY, vb, moved: false } }
  const onMove = (event: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = event.clientX - d.x, dy = event.clientY - d.y
    if (!d.moved && Math.hypot(dx, dy) < 5) return
    d.moved = true
    ;(event.currentTarget as Element).setPointerCapture?.(event.pointerId)
    setVb(clampVB({ ...d.vb, x: d.vb.x - dx * k, y: d.vb.y - dy * k }))
  }
  const onUp = () => { drag.current = null }
  const tap = (fn: () => void) => (event: React.MouseEvent) => { event.stopPropagation(); if (!drag.current?.moved) fn() }

  return <div className={`map911 ${night ? 'is-night' : ''} ${weather}`} ref={wrap}>
    <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} role="img" aria-label="Mapa de la Ciudad de Buenos Aires y el conurbano">
      <rect x={-200} y={-200} width={GEO.w + 400} height={GEO.h + 400} className="water" />
      <MapBase covered={coveredIds} baseId={s.baseBarrioId} k={k} showLabels />
      {/* rutas en curso */}
      {s.couriers.filter(c => c.trip).map(c => {
        const trip = c.trip!
        const pos = courierPos(s, c)
        const current = trip.stops[trip.done]
        const rest = trip.stops.slice(trip.done + 1)
        const nowLeft = current ? current.path.slice(Math.max(0, closestIndex(current.path, pos))) : []
        const pts = [[pos.x, pos.y], ...nowLeft, ...rest.flatMap(st => st.path)]
        return <polyline key={c.id} points={pts.map(p => p.join(',')).join(' ')} className={`route ${focusCourier === c.id ? 'focus' : ''}`} vectorEffect="non-scaling-stroke" />
      })}
      {/* vista previa del viaje antes de enviar */}
      {plan?.route.length ? <g className={`preview ${plan.ok ? '' : 'bad'}`}>
        <polyline points={plan.route.flatMap(st => st.path).map(p => p.join(',')).join(' ')} vectorEffect="non-scaling-stroke" />
        {plan.route.filter(st => st.orderId).map((st, i) => <g key={i} transform={`translate(${st.x},${st.y}) scale(${k})`}><circle r={10} className="stop-badge" /><text y={4} textAnchor="middle" className="stop-num">{i + 1}</text></g>)}
      </g> : null}
      {/* base */}
      <g transform={`translate(${base.x},${base.y}) scale(${k})`} className="base">
        <circle r={20} className="base-glow" />
        <image href={pixelSrc(['🛏️', '🏪', '🏭', '🏢', '🏙️'][s.level], 18)} x={-17} y={-22} width={34} height={34} />
        <text y={24} textAnchor="middle" className="base-name">{s.storeName}</text>
      </g>
      {/* pedidos */}
      {waiting.map(o => {
        const left = Math.max(0, (o.expiresAt - t) / (o.expiresAt - o.createdAt))
        const missing = missingFor(s, o).length > 0
        const sel = selected.includes(o.id)
        const C = 2 * Math.PI * 15
        return <g key={o.id} transform={`translate(${o.x},${o.y}) scale(${k * (sel ? 1.18 : 1)})`} className={`pin pin--${o.kind} ${sel ? 'sel' : ''} ${missing ? 'missing' : ''} ${left < .3 ? 'hurry' : ''}`} onClick={tap(() => onToggle(o.id))}>
          <circle r={15} className="pin-bg" />
          <circle r={15} className="pin-timer" strokeDasharray={`${C * left} ${C}`} transform="rotate(-90)" />
          <image href={pixelSrc(productById(o.lines[0].productId).emoji, 16)} x={-10} y={-10} width={20} height={20} />
          {missing && <g transform="translate(12,-12)"><circle r={6.5} className="flag" /><text y={3.5} textAnchor="middle" className="flag-t">!</text></g>}
          {sel && <circle r={21} className="pin-sel" />}
          <title>{`${o.customer} (${barrioById(o.barrioId).name}): ${o.lines.map(l => `${l.qty}× ${productById(l.productId).name}`).join(', ')}`}</title>
        </g>
      })}
      {/* cadetes */}
      {s.couriers.filter(c => c.trip).map(c => {
        const pos = courierPos(s, c)
        const alert = s.pendingIncident?.courierId === c.id
        return <g key={c.id} transform={`translate(${pos.x},${pos.y}) scale(${k})`} className={`unit ${focusCourier === c.id ? 'focus' : ''} ${alert ? 'alert' : ''}`}>
          <circle r={13} className="unit-bg" />
          <g transform={`scale(${pos.heading > 0 ? -1 : 1},1)`}><image href={pixelSrc(vehicleStats(c.vehicle).emoji, 16)} x={-11} y={-11} width={22} height={22} /></g>
          <text y={-17} textAnchor="middle" className="unit-name">{c.name.split(' ')[0]}</text>
        </g>
      })}
    </svg>
    {plan && <div className={`eta-chip ${plan.ok ? '' : 'bad'}`}>{plan.ok ? <>⏱ <b>{plan.minutes}′</b> ida y vuelta · {plan.cuadras} cuadras · {plan.route.length - 1} parada{plan.route.length > 2 ? 's' : ''}</> : <>✖ {plan.reason}</>}</div>}
    <div className="map-ctrl">
      <button onClick={() => zoomAt(1 / 1.3)} aria-label="Acercar">＋</button>
      <button onClick={() => zoomAt(1.3)} aria-label="Alejar">－</button>
      <button onClick={fit} aria-label="Encuadrar mi zona" title="Encuadrar mi zona">◎</button>
    </div>
    {weather === 'rain' && <div className="rain" />}
    <div className="map-legend"><span><i className="leg-av" /> avenida (más rápida)</span><span><i className="leg-lock" /> fuera de cobertura</span><span>1 cuadrito = 1 cuadra</span></div>
  </div>
}

const closestIndex = (pts: [number, number][], p: { x: number; y: number }) => {
  let best = 0, bestD = Infinity
  pts.forEach((q, i) => { const d = Math.hypot(q[0] - p.x, q[1] - p.y); if (d < bestD) { bestD = d; best = i } })
  // arrancamos desde el próximo vértice para no dibujar hacia atrás
  return Math.min(pts.length - 1, best + 1)
}
