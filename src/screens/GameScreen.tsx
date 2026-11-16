import { useCallback, useEffect, useRef, useState } from 'react'
import { LEVELS, NEWS_TICKER, RANKS, rankOf } from '../game/content'
import * as E from '../game/engine'
import { clearGame, saveGame } from '../game/save'
import type { GameState, Speed } from '../game/types'
import { Stars, fmt, money } from '../ui/common'
import { PixelIcon } from '../ui/PixelIcon'
import { isMuted, play, setMuted } from '../ui/sound'
import { CityMap } from './CityMap'
import { GameOver, IncidentModal, NightPanel, StoryModal, SummaryModal, Victory } from './Modals'
import { Operations } from './Operations'
import { PANELS, PanelModal, type PanelId } from './Panels'
import { Radio } from './Radio'

type Hint = { id: string; when: (s: GameState) => boolean; text: string; pause?: boolean }
const HINTS: Hint[] = [
  { id: 'start', when: s => s.phase === 'night' && s.today === null, text: 'Che, soy Franco. Te dejé unas cajas en el depósito para arrancar. Mirá el pronóstico de mañana: te dice qué se va a vender. Si querés, comprá algo más en Depósito y después abrí el negocio.' },
  { id: 'first-order', when: s => s.phase === 'day' && s.lifetime.delivered === 0 && s.orders.some(o => o.status === 'waiting'), text: '¡Sonó el celu! Tocá el pedido (en la lista o en el pin del mapa) y después "Enviar" en tu tarjeta de abajo. Si te entran en la bici, podés juntar varios pedidos en un mismo viaje. Te pausé el juego para que lo leas tranqui.', pause: true },
  { id: 'missing', when: s => s.phase === 'day' && s.orders.some(o => o.status === 'waiting' && E.missingFor(s, o).length > 0), text: 'Ese pedido con "!" rojo no tiene stock. Podés hacer una corrida a Once (sale 50% más caro) o rechazarlo. De noche comprá en Depósito para que no te pase.', pause: true },
  { id: 'first-delivery', when: s => s.lifetime.delivered >= 1, text: '¡Primera entrega! Cada pedido te deja plata, fans e ideas 💡. Las ideas se invierten en Desarrollo para abrir rubros nuevos y mejorar el negocio.' },
  { id: 'speed', when: s => s.lifetime.delivered >= 3 && s.phase === 'day', text: 'Tip: barra espaciadora pausa, las teclas 1 a 7 abren los paneles y con ▶▶ acelerás cuando esté tranquilo. Ojo con la energía: si te fundís, no salís más hasta mañana.' },
  { id: 'night', when: s => s.phase === 'night' && s.today !== null, text: 'Cerraste el día. La noche es para planificar: reponé mercadería, contratá gente, investigá y lanzá publicidad. Fijate el pronóstico: si mañana hay clásico, comprá camisetas.' },
  { id: 'hire', when: s => s.day >= 2 && s.couriers.length === 1 && s.capital > 250000, text: 'Estás perdiendo pedidos porque no das abasto. En Equipo podés contratar un cadete: cobra por día, pero cada viaje suyo es plata que hoy se te escapa.' },
  { id: 'local', when: s => s.level === 0 && s.capital > E.upgradePrice(s) * .75, text: 'Ya casi te alcanza para un local a la calle. Más depósito, más gente, más barrios y la gente que pasa por la vereda también compra. Miralo en Local.' },
  { id: 'debt', when: s => s.capital < 0, text: 'Estás en rojo. Si cerrás tres días seguidos en negativo, quebrás. En Local tenés préstamos; y no gastes en lo que no te da plata ya.' },
]

const fmtClock = (s: GameState) => E.clock(s.minute)

export function GameScreen({ initial, onExit }: { initial: GameState; onExit: () => void }) {
  const [s, setS] = useState<GameState>(initial)
  const [panel, setPanel] = useState<PanelId | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [focus, setFocus] = useState<string | null>(null)
  const [toasts, setToasts] = useState<{ id: number; text: string; tone: string }[]>([])
  const [muted, setMute] = useState(isMuted())
  const [menu, setMenu] = useState(false)
  const resume = useRef<Speed>(1)
  const lastLog = useRef(initial.logSeq)
  const act = useCallback((fn: (g: GameState) => GameState) => setS(prev => fn(prev)), [])

  // loop principal
  useEffect(() => {
    if (s.speed === 0) return
    let frame = 0
    let last = performance.now()
    const loop = (t: number) => {
      const dt = Math.min(.25, (t - last) / 1000)
      last = t
      setS(prev => E.tick(prev, dt * E.SPEED_RATE[prev.speed]))
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [s.speed])

  // guardado automático
  const latest = useRef(s)
  latest.current = s
  useEffect(() => { const id = window.setInterval(() => saveGame(latest.current), 4000); return () => window.clearInterval(id) }, [])
  useEffect(() => { saveGame(s) }, [s.phase, s.day]) // eslint-disable-line react-hooks/exhaustive-deps

  // sonidos y toasts a partir del log
  useEffect(() => {
    const fresh = s.log.filter(entry => entry.id > lastLog.current)
    lastLog.current = s.logSeq
    if (!fresh.length) return
    const withSound = [...fresh].reverse().find(entry => entry.sound)
    if (withSound?.sound) play(withSound.sound)
    const important = fresh.filter(entry => entry.sound === 'level' || entry.tone === 'good' || (entry.tone === 'bad' && entry.sound === 'bad' && !/^[⌛★]/.test(entry.text)))
    if (important.length) {
      setToasts(prev => [...prev, ...important.map(entry => ({ id: entry.id, text: entry.text, tone: entry.tone }))].slice(-4))
      important.forEach(entry => window.setTimeout(() => setToasts(prev => prev.filter(x => x.id !== entry.id)), 5200))
    }
  }, [s.logSeq]) // eslint-disable-line react-hooks/exhaustive-deps

  // limpiar selección de pedidos que ya no esperan
  useEffect(() => {
    setSelected(prev => { const next = prev.filter(id => s.orders.some(o => o.id === id && o.status === 'waiting')); return next.length === prev.length ? prev : next })
  }, [s.orders])

  const panelRef = useRef(panel)
  panelRef.current = panel
  const openPanel = useCallback((id: PanelId | null) => {
    play('click')
    const current = panelRef.current
    if (id && !current) {
      resume.current = latest.current.speed
      if (latest.current.speed > 0) setS(prev => ({ ...prev, speed: 0 }))
    }
    if (!id && current) setS(prev => (prev.phase === 'day' || prev.phase === 'closing') && !prev.pendingIncident ? { ...prev, speed: resume.current } : prev)
    setPanel(id)
  }, [])

  const setSpeed = (speed: Speed) => { play('click'); act(prev => (prev.phase === 'day' || prev.phase === 'closing') && !prev.pendingIncident ? { ...prev, speed } : prev) }

  // teclado
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.tagName === 'INPUT') return
      if (event.key === 'Escape') { openPanel(null); setSelected([]); setMenu(false); return }
      if (event.key === ' ') { event.preventDefault(); act(prev => (prev.phase === 'day' || prev.phase === 'closing') && !prev.pendingIncident ? { ...prev, speed: prev.speed === 0 ? (resume.current || 1) : 0 } : prev); return }
      const p = PANELS.find(x => x.key === event.key)
      if (p && !latest.current.pendingIncident && latest.current.phase !== 'summary') openPanel(panel === p.id ? null : p.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panel, openPanel, act])

  const toggleOrder = (id: string) => { play('click'); setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]) }
  const send = (courierId: string) => { act(prev => E.dispatch(prev, courierId, selected)); setSelected([]) }

  const hint = HINTS.find(h => !s.story.flags.includes(`hint:${h.id}`) && h.when(s))
  const dismissHint = (h: Hint) => { play('click'); act(prev => ({ ...prev, speed: h.pause && prev.phase === 'day' && !prev.pendingIncident && prev.speed === 0 ? 1 : prev.speed, story: { ...prev.story, flags: [...prev.story.flags, `hint:${h.id}`] } })) }
  useEffect(() => { if (hint?.pause && s.speed > 0 && !panel) act(prev => ({ ...prev, speed: 0 })) }, [hint?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const goals = E.pendingGoals(s)
  const lvl = LEVELS[s.level]
  const dayProfit = s.stats.revenue - s.stats.fees - s.stats.cogs
  const closeAt = E.closeMinute(s)
  const dayPct = Math.max(0, Math.min(100, ((s.minute - 540) / (closeAt - 540)) * 100))
  const ticker = [s.today ? `${s.today.emoji} HOY: ${s.today.title.toUpperCase()} — ${s.today.text}` : '', s.tomorrow ? `MAÑANA: ${s.tomorrow.title}` : '', `DÓLAR $${fmt(s.dollar)}`, ...NEWS_TICKER.slice((s.day * 3) % NEWS_TICKER.length).concat(NEWS_TICKER).slice(0, 6)].filter(Boolean)

  return <div className={`game phase-${s.phase}`}>
    <header className="topbar">
      <div className="brand"><span className="logo small">Rebusque</span><small>{s.storeName} · {lvl.emoji} {lvl.name}</small></div>
      <div className="clock-box">
        <small>{E.weekday(s.day)} {s.day}</small>
        <b className="clock">{s.phase === 'night' || s.phase === 'summary' ? '🌙' : fmtClock(s)}</b>
        <span className="daybar"><i style={{ width: `${dayPct}%` }} /></span>
      </div>
      <div className="speed">
        {([0, 1, 2, 3] as Speed[]).map(sp => <button key={sp} className={s.speed === sp ? 'on' : ''} disabled={s.phase !== 'day' && s.phase !== 'closing'} onClick={() => setSpeed(sp)} title={['Pausa (espacio)', 'Normal', 'Rápido', 'Muy rápido'][sp]}>{['❚❚', '▶', '▶▶', '▶▶▶'][sp]}</button>)}
      </div>
      <div className="chips">
        <span className={`chip cash ${s.capital < 0 ? 'neg' : ''}`} title="Caja"><PixelIcon emoji="💵" size={20} /> {money(s.capital)}{s.phase === 'day' && <small className={dayProfit >= 0 ? 'pos' : 'neg'}>{dayProfit >= 0 ? '+' : ''}{money(dayProfit)} hoy</small>}</span>
        <span className="chip" title="Reputación (promedio de calificaciones)"><Stars value={s.rep} /> <small>{s.rep.toFixed(1)}</small></span>
        <span className="chip" title="Fans: traen pedidos"><PixelIcon emoji="❤️" size={18} /> {fmt(s.fans)}</span>
        <span className="chip" title="Ideas para Desarrollo"><PixelIcon emoji="💡" size={18} /> {Math.floor(s.ideas)}</span>
        <span className="chip" title="Depósito usado"><PixelIcon emoji="📦" size={18} /> {fmt(E.storageUsed(s, false))}/{fmt(E.storageCap(s))}</span>
      </div>
      <div className="top-actions">
        <button className="icon-btn" title={muted ? 'Activar sonido' : 'Silenciar'} onClick={() => { setMuted(!muted); setMute(!muted) }}>{muted ? '🔇' : '🔊'}</button>
        <button className="icon-btn" title="Menú" onClick={() => setMenu(true)}>☰</button>
      </div>
    </header>

    <main className="hud">
      <section className="map-pane">
        <CityMap s={s} selected={selected} onToggle={toggleOrder} focusCourier={focus} />
        <div className="feed">{s.log.slice(-6).map(entry => <p key={entry.id} className={`feed-${entry.tone}`}><time>{E.clock(entry.at % 1440)}</time> {entry.text}</p>)}</div>
        {s.phase === 'day' && s.today && <div className="today-chip"><PixelIcon emoji={s.today.emoji} size={20} /> <b>{s.today.title}</b><small>{RANKS[rankOf(s)]}</small></div>}
        {s.phase === 'night' && !s.pendingStory && !panel && <NightPanel s={s} act={act} open={openPanel} />}
      </section>
      <Operations s={s} selected={selected} onToggle={toggleOrder} onClear={() => setSelected([])} onSend={send} onRush={id => act(prev => E.rushBuy(prev, id))} onReject={id => act(prev => E.rejectOrder(prev, id))} onFocus={setFocus} />
    </main>

    <footer className="dock">
      <nav className="dock-buttons">{PANELS.map(p => <button key={p.id} className={panel === p.id ? 'on' : ''} onClick={() => openPanel(panel === p.id ? null : p.id)} title={`${p.label} (${p.key})`}>
        <PixelIcon emoji={p.emoji} size={26} /><span>{p.label}</span>{p.id === 'goals' && goals > 0 && <em className="badge">{goals}</em>}
      </button>)}</nav>
      <div className="ticker"><span className="ticker-tag">RADIO BARRIO</span><div className="ticker-track"><p>{ticker.join('   ✦   ')}</p></div></div>
      <Radio />
    </footer>

    {hint && !panel && !s.pendingStory && !s.pendingIncident && s.phase !== 'summary' && <aside className="hint-bubble">
      <PixelIcon emoji="🧔" size={42} />
      <div><b>Franco <small>WhatsApp</small></b><p>{hint.text}</p><button className="btn tiny btn--gold" onClick={() => dismissHint(hint)}>Dale, gracias</button></div>
    </aside>}

    <div className="toasts">{toasts.map(t => <div key={t.id} className={`toast toast--${t.tone}`}>{t.text}</div>)}</div>

    {panel && <PanelModal id={panel} s={s} act={act} onClose={() => openPanel(null)} />}
    {s.pendingIncident && <IncidentModal s={s} act={act} />}
    {s.phase === 'summary' && <SummaryModal s={s} act={act} />}
    {s.pendingStory && s.phase === 'night' && <StoryModal s={s} act={act} />}
    {s.phase === 'gameover' && <GameOver s={s} onRestart={() => { clearGame(); onExit() }} />}
    {s.won && !s.story.flags.includes('victoria') && <Victory s={s} onClose={() => act(prev => ({ ...prev, story: { ...prev.story, flags: [...prev.story.flags, 'victoria'] } }))} />}
    {menu && <div className="modal-backdrop" onClick={() => setMenu(false)}>
      <div className="pause-menu" onClick={e => e.stopPropagation()}>
        <h2 className="logo small">Rebusque</h2>
        <button className="btn" onClick={() => { saveGame(s); setMenu(false) }}>💾 Guardar</button>
        <button className="btn" onClick={() => { saveGame(s); onExit() }}>🚪 Guardar y salir al menú</button>
        <button className="btn btn--ghost" onClick={() => setMenu(false)}>Volver al juego</button>
      </div>
    </div>}
  </div>
}
