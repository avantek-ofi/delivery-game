import { useEffect, useRef, useState } from 'react'
import { CONTACTS, LOANS, rushHour } from '../game/content'
import * as E from '../game/engine'
import type { GameState } from '../game/types'
import { Stars, fmt, money } from '../ui/common'
import { PixelIcon } from '../ui/PixelIcon'

type Act = (fn: (s: GameState) => GameState) => void
type App = 'home' | 'chats' | 'chat' | 'bank' | 'weather' | 'stats' | 'manual'

// Consejos de Franco según lo que está pasando en la partida.
export const advice = (s: GameState): string => {
  const waiting = s.orders.filter(o => o.status === 'waiting')
  const missing = waiting.filter(o => E.missingFor(s, o).length > 0).length
  const stockUnits = Object.values(s.stock).reduce((a, b) => a + b, 0)
  const fixed = Object.values(E.dailyExpenses(s)).reduce((a, b) => a + b, 0)
  const lostRatio = s.stats.lost / Math.max(1, s.stats.lost + s.stats.delivered)
  const tired = s.couriers.filter(c => c.energy < 25).length
  if (s.capital < 0) return `Estás en rojo (${money(s.capital)}). Primero que nada: no gastes en mejoras. Vendé lo que tengas, y si hace falta pedí un préstamo en el Banco. Tres días seguidos así y quebrás.`
  if (stockUnits < 8 && s.purchases.length === 0) return 'Tenés el depósito vacío. Sin mercadería no vendés: andá a Depósito y tocá "Surtido recomendado". Compra lo que más sale, solo.'
  if (missing >= 2) return `Hay ${missing} pedidos esperando cosas que no tenés. Reponé en Depósito (el surtido recomendado prioriza lo que más se pide) o hacé una corrida a Once si el margen lo banca.`
  if (s.capital < fixed * 2) return `Ojo con la caja: tus gastos fijos son ${money(fixed)} por día y tenés ${money(s.capital)}. Priorizá entregar y reponer stock antes de invertir.`
  if (lostRatio > .35 && s.couriers.length < E.level(s).couriers && s.capital > fixed * 4) return 'Se te están cayendo muchos pedidos porque no das abasto. Contratá a alguien en Flota: un cadete que hace 6 viajes paga su sueldo de sobra.'
  if (lostRatio > .35 && s.couriers.length >= E.level(s).couriers) return 'No das abasto y no te entra más gente. Hora de mudarte a un local más grande, o meté motos para que cada viaje rinda más.'
  if (tired) return `${tired} de tu equipo están fundidos. La cocina y vestuario del local les hace recuperar energía entre viajes.`
  if (s.level === 0 && s.capital > E.upgradePrice(s)) return '¡Ya te alcanza para un local a la calle! Más depósito, más gente, más barrios y ventas de mostrador. Andá a Local.'
  if (s.ideas >= 10 && s.research.length < 3) return `Tenés ${Math.floor(s.ideas)} ideas guardadas. Gastalas en Desarrollo: Instagram y WhatsApp Business rinden muchísimo al principio.`
  if (s.rubros.length < 3 && s.ideas >= 12) return 'Abrí otro rubro en Desarrollo: más rubros, más pedidos. El almacén vende un montón aunque deja poco por unidad.'
  if (Object.keys(s.facility).length === 0 && s.capital > 200000) return 'Las estanterías son la mejora más barata para que te entre más stock. Y la mesa de embalaje te sube las reseñas.'
  if (s.streak >= 3) return `Vas con una racha de ${s.streak} entregas perfectas. Cuidala: las propinas suben mientras dure.`
  return 'Vas bien. Fijate el pronóstico de mañana antes de comprar y mandá viajes juntando pedidos del mismo barrio: ahorrás cuadras.'
}

const MANUAL: { title: string; text: string }[] = [
  { title: '📞 Pedidos', text: 'Entran como llamados, con un anillo que marca la paciencia del cliente. Tocalos (en la lista o en el mapa) para armar un viaje. Si se vence el anillo, el cliente cancela y te baja la reputación.' },
  { title: '🗺️ Rutas y cuadras', text: 'Cada viaje va por las calles reales de la ciudad, cuadra por cuadra. Las avenidas (líneas amarillas) son más rápidas. Al seleccionar pedidos, el mapa te muestra la ruta y el tiempo de ida y vuelta antes de enviar.' },
  { title: '🛵 Flota', text: 'Cada vehículo tiene carga, velocidad y riesgo. Juntá pedidos cercanos en un mismo viaje si entran. Los bultos grandes (🚐) necesitan utilitario. Mejorá los vehículos con canasto, puesta a punto, candado o ploteo.' },
  { title: '⚡ Energía', text: 'Cada viaje cansa. Con menos de 12 de energía nadie sale hasta mañana. La cocina y vestuario del local los recupera entre viajes.' },
  { title: '⭐ Reputación y racha', text: 'Las calificaciones dependen de llegar a tiempo, del cuidado del cadete, del embalaje y de la calidad del producto. Varias entregas perfectas seguidas arman una racha que sube las propinas.' },
  { title: '📦 Stock', text: 'Comprá de noche (llega a la mañana) o de día (llega en 2 horas). Si falta algo, la corrida a Once lo trae ya, pero 50% más caro. El surtido recomendado compra solo según popularidad y pronóstico.' },
  { title: '🕐 Hora pico', text: 'Al mediodía (12 a 14:30) y a la salida del laburo (18 a 20:30) entran muchos más pedidos. Tené gente libre para esas horas.' },
  { title: '🏪 Crecer', text: 'Mudate para llegar a más barrios y tener más gente. Mejorá el local, abrí rubros, subí la calidad, hacé publicidad. Desde el Centro logístico podés abrir el conurbano.' },
  { title: '💸 Plata', text: 'Cada noche se pagan alquiler, sueldos, mantenimiento y servicios. Tres días seguidos con la caja en rojo y quebrás. Hay inflación semanal: los precios se remarcan solos.' },
]

export function Phone({ s, act, onClose, onTutorial }: { s: GameState; act: Act; onClose: () => void; onTutorial: () => void }) {
  const [app, setApp] = useState<App>('home')
  const [chat, setChat] = useState('franco')
  const bottom = useRef<HTMLDivElement>(null)
  const unread = E.unreadMessages(s)
  const messages = s.inbox.filter(m => m.chat === chat)
  useEffect(() => { if (app === 'chat') { act(x => E.markRead(x, chat)); bottom.current?.scrollIntoView() } }, [app, chat, messages.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const t = E.now(s)
  const rush = rushHour(s.minute)
  const st = s.stats
  const openChat = (id: string) => { setChat(id); setApp('chat') }
  const chats = Object.keys(CONTACTS).map(id => ({ id, ...CONTACTS[id], last: [...s.inbox].reverse().find(m => m.chat === id), unread: s.inbox.filter(m => m.chat === id && !m.read).length })).sort((a, b) => (b.last?.id ?? 0) - (a.last?.id ?? 0))
  const title: Record<App, string> = { home: '', chats: 'WhatsApp', chat: CONTACTS[chat]?.name ?? '', bank: 'Banco Porteño', weather: 'Clima BA', stats: 'Rebusque Biz', manual: 'Manual' }
  return <div className="phone-wrap" onClick={onClose}>
    <div className="phone" onClick={e => e.stopPropagation()}>
      <div className="phone-notch" />
      <div className="phone-status"><span>{E.clock(s.minute)}</span><span>📶 🔋{Math.round(s.couriers[0]?.energy ?? 100)}%</span></div>
      {app !== 'home' && <header className="phone-head"><button onClick={() => setApp(app === 'chat' ? 'chats' : 'home')}>‹</button><b>{title[app]}</b></header>}
      <div className="phone-screen">
        {app === 'home' && <div className="phone-home">
          <div className="widget"><small>{E.weekday(s.day)} {s.day}</small><b>{s.today ? `${s.today.emoji} ${s.today.title}` : '🌙 Noche'}</b>{rush.label && s.phase === 'day' && <em>{rush.label}</em>}</div>
          <div className="apps">
            <button onClick={() => setApp('chats')}><span className="app-icon wa">💬{unread > 0 && <i>{unread}</i>}</span>WhatsApp</button>
            <button onClick={() => setApp('bank')}><span className="app-icon bank">🏦</span>Banco</button>
            <button onClick={() => setApp('weather')}><span className="app-icon wx">⛅</span>Clima</button>
            <button onClick={() => setApp('stats')}><span className="app-icon biz">📊</span>Rebusque Biz</button>
            <button onClick={() => setApp('manual')}><span className="app-icon man">📘</span>Manual</button>
            <button onClick={() => { setChat('franco'); act(x => E.msg(E.msg(x, 'franco', '¿Qué hago, Franco?', true), 'franco', advice(x))); setApp('chat') }}><span className="app-icon tip">🧔</span>Consejo</button>
          </div>
        </div>}
        {app === 'chats' && <ul className="chat-list">{chats.map(c => <li key={c.id} onClick={() => openChat(c.id)}>
          <PixelIcon emoji={c.emoji} size={36} />
          <div><b>{c.name}</b><small>{c.last ? c.last.text : c.status}</small></div>
          {c.unread > 0 && <i>{c.unread}</i>}
        </li>)}</ul>}
        {app === 'chat' && <div className="chat">
          {messages.length === 0 && <p className="chat-empty">Sin mensajes todavía.</p>}
          {messages.map(m => <p key={m.id} className={`bubble ${m.mine ? 'mine' : ''}`}>{m.text}<time>{E.clock(m.at % 1440)} · día {Math.floor(m.at / 1440)}</time></p>)}
          <div ref={bottom} />
          {chat === 'franco' && <button className="btn btn--gold tiny ask" onClick={() => act(x => E.msg(E.msg(x, 'franco', '¿Qué hago, Franco?', true), 'franco', advice(x)))}>Pedir consejo</button>}
        </div>}
        {app === 'bank' && <div className="bank">
          <small>Saldo en cuenta</small><b className={s.capital < 0 ? 'neg' : ''}>{money(s.capital)}</b>
          <ul className="ledger">{Object.entries(E.dailyExpenses(s)).map(([k, v]) => <li key={k}><span>{k}</span><b>{money(v)}</b></li>)}</ul>
          <h4>Préstamos</h4>
          {LOANS.map(l => { const active = s.loans.find(x => x.id === l.id); const disabled = Boolean(active) || (l.once && s.loanTaken.includes(l.id)) || Boolean(l.minLevel && s.level < l.minLevel); return <div key={l.id} className="loan"><span>{l.emoji} {l.name}<small>{money(l.amount)} · {l.days} cuotas de {money(l.perDay)}</small></span>{active ? <em>{active.daysLeft} cuotas</em> : <button className="btn tiny" disabled={disabled} onClick={() => act(x => E.takeLoan(x, l.id))}>Pedir</button>}</div> })}
          {s.debtDays > 0 && <p className="warn">Cuenta en descubierto {s.debtDays}/3 días.</p>}
        </div>}
        {app === 'weather' && <div className="weather">
          {s.today && <div className="wx-card"><small>Hoy</small><PixelIcon emoji={s.today.emoji} size={48} /><b>{s.today.title}</b><p>{s.today.text}</p></div>}
          {s.tomorrow && <div className="wx-card"><small>Mañana</small><PixelIcon emoji={s.tomorrow.emoji} size={48} /><b>{s.tomorrow.title}</b><p>{s.tomorrow.text}</p></div>}
          <h4>Horas pico</h4><p>🍝 12:00 a 14:30 almuerzo · 🚇 18:00 a 20:30 salida del laburo</p>
          <p>💵 Dólar ${fmt(s.dollar)} · Inflación acumulada {((s.priceIndex - 1) * 100).toFixed(1)}%</p>
        </div>}
        {app === 'stats' && <div className="biz">
          <div className="biz-grid">
            <div><small>Entregas hoy</small><b>{st.delivered}</b></div>
            <div><small>Perdidos hoy</small><b>{st.lost + st.failed}</b></div>
            <div><small>Facturado hoy</small><b>{money(st.revenue)}</b></div>
            <div><small>Mostrador</small><b>{st.walkIn}</b></div>
            <div><small>Racha 🔥</small><b>{s.streak}</b></div>
            <div><small>Cuadras hoy</small><b>{fmt(st.cuadras)}</b></div>
            <div><small>Pedidos/hora</small><b>{(E.demandPerMinute(s) * 60).toFixed(1)}</b></div>
            <div><small>En la calle</small><b>{s.couriers.filter(c => c.trip).length}/{s.couriers.length}</b></div>
          </div>
          <p>Reputación <Stars value={s.rep} /> · {fmt(s.fans)} fans</p>
          <p className="help">Récords: mejor día {money(s.lifetime.bestDay)} · mejor racha {s.lifetime.bestStreak} · {fmt(s.lifetime.cuadras)} cuadras en total.</p>
          <p className="help">Pedidos en espera: {s.orders.filter(o => o.status === 'waiting').length} · próximos a vencer: {s.orders.filter(o => o.status === 'waiting' && o.expiresAt - t < 20).length}</p>
        </div>}
        {app === 'manual' && <div className="manual">
          {MANUAL.map(m => <details key={m.title}><summary>{m.title}</summary><p>{m.text}</p></details>)}
          <button className="btn btn--gold" onClick={onTutorial}>🎓 Repetir el tutorial</button>
          <p className="help">Atajos: espacio pausa · 1 a 7 paneles · C celular · Esc cierra.</p>
        </div>}
      </div>
      <button className="phone-home-btn" onClick={() => setApp('home')} aria-label="Inicio" />
    </div>
  </div>
}
