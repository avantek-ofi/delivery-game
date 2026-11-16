import { barrioById } from '../game/barrios'
import { productById } from '../game/catalog'
import { courierAvailable, missingFor, now, orderBulky, orderVolume, planRoute, rushCost, vehicleStats } from '../game/engine'
import type { Channel, Courier, GameState, Order } from '../game/types'
import { Bar, money } from '../ui/common'
import { PixelIcon } from '../ui/PixelIcon'

const CHANNEL: Record<Channel, { label: string; emoji: string }> = {
  whatsapp: { label: 'WhatsApp', emoji: '💬' }, instagram: { label: 'Instagram', emoji: '📸' }, chango: { label: 'Mercado Chango', emoji: '🛒' }, app: { label: 'App propia', emoji: '📲' },
}
const KIND: Record<Order['kind'], string> = { normal: '', urgente: 'URGENTE', mayorista: 'MAYORISTA', vip: 'VIP' }

export function OrderCard({ s, order, selected, onToggle, onRush, onReject, first }: { s: GameState; order: Order; selected: boolean; onToggle: () => void; onRush: () => void; onReject: () => void; first?: boolean }) {
  const t = now(s)
  const left = Math.max(0, order.expiresAt - t)
  const missing = missingFor(s, order)
  const rush = missing.length ? rushCost(s, order) : 0
  const barrio = barrioById(order.barrioId)
  return <article className={`order ${selected ? 'sel' : ''} order--${order.kind} ${left < 15 ? 'hurry' : ''}`} data-tut={first ? 'first-order' : undefined} onClick={onToggle}>
    <header>
      <span className="check">{selected ? '✔' : ''}</span>
      <div className="who"><b>{order.customer}</b><small>{CHANNEL[order.channel].emoji} {barrio.name}{barrio.kind === 'partido' ? ' · conurbano' : ''}</small></div>
      {KIND[order.kind] && <em className={`kind kind--${order.kind}`}>{KIND[order.kind]}</em>}
      <strong className="price">{money(order.total)}</strong>
    </header>
    <ul className="lines">{order.lines.map(line => { const p = productById(line.productId); const short = missing.find(m => m.productId === line.productId); return <li key={line.productId} className={short ? 'short' : ''}><PixelIcon emoji={p.emoji} size={22} res={16} /><span>{line.qty}× {p.name}</span>{p.bulky && <i title="Bulto grande: necesita utilitario">🚐</i>}{p.fragile && <i title="Frágil">🥚</i>}{short && <i className="short-tag">faltan {short.qty}</i>}</li> })}</ul>
    {order.note && <p className="note">“{order.note}”</p>}
    <footer>
      <Bar value={left} max={order.expiresAt - order.createdAt} tone={left < 15 ? 'red' : left < 35 ? 'gold' : 'green'} label={`${Math.ceil(left)} min de paciencia`} />
      <span className="vol" title="Carga que ocupa">📦{orderVolume(order)}</span>
      {missing.length > 0 && <button className="btn btn--red tiny" onClick={event => { event.stopPropagation(); onRush() }} title="Comprás lo que falta en Once al instante, 50% más caro">Corrida a Once {money(rush)}</button>}
      <button className="btn btn--ghost tiny" onClick={event => { event.stopPropagation(); onReject() }} title="Rechazar pedido">✕</button>
    </footer>
  </article>
}

export function CourierCard({ s, courier, selected, onSend, onFocus, onBlur }: { s: GameState; courier: Courier; selected: string[]; onSend: () => void; onFocus: () => void; onBlur: () => void }) {
  const vehicle = vehicleStats(courier.vehicle)
  const available = courierAvailable(s, courier)
  const plan = selected.length && available ? planRoute(s, courier.id, selected) : null
  const t = now(s)
  const trip = courier.trip
  const eta = trip ? Math.max(0, Math.round(trip.stops[trip.stops.length - 1].at - t)) : 0
  const delivering = trip ? trip.stops.slice(trip.done).filter(st => st.orderId).length : 0
  const status = trip ? (delivering ? `Repartiendo · ${delivering} pendiente${delivering > 1 ? 's' : ''}` : 'Volviendo a la base') : courier.injuredUntilDay && courier.injuredUntilDay >= s.day ? 'Lesionado' : courier.energy < 12 ? 'Fundido: mañana sigue' : 'Libre en la base'
  return <article className={`courier ${trip ? 'busy' : available ? 'free' : 'tired'}`} data-tut={courier.isPlayer ? 'player-card' : undefined} onMouseEnter={onFocus} onMouseLeave={onBlur}>
    <div className="avatar"><PixelIcon emoji={courier.emoji} size={34} res={18} /><span className="veh"><PixelIcon emoji={vehicle.emoji} size={20} res={14} /></span></div>
    <div className="info">
      <b>{courier.isPlayer ? `${courier.name} (vos)` : courier.name}</b>
      <small>{status}{trip ? ` · vuelve en ${eta}′` : ''}</small>
      <Bar value={courier.energy} max={100} tone={courier.energy < 30 ? 'red' : 'celeste'} label={`Energía ${Math.round(courier.energy)}`} />
    </div>
    <div className="send">
      {plan ? <button className="btn btn--gold" disabled={!plan.ok} onClick={onSend} title={plan.reason}>{plan.ok ? `Enviar · ${plan.minutes}′` : 'No puede'}</button> : <span className="cap" title="Capacidad de carga">📦 {vehicle.cap}{vehicle.bulky ? ' 🚐' : ''}</span>}
      {plan && (plan.ok ? <small className="cuadras">{plan.cuadras} cuadras</small> : <small className="reason">{plan.reason}</small>)}
    </div>
  </article>
}

export function Operations({ s, selected, onToggle, onClear, onSend, onRush, onReject, onFocus }: { s: GameState; selected: string[]; onToggle: (id: string) => void; onClear: () => void; onSend: (courierId: string) => void; onRush: (id: string) => void; onReject: (id: string) => void; onFocus: (id: string | null) => void }) {
  const waiting = s.orders.filter(o => o.status === 'waiting').sort((a, b) => a.expiresAt - b.expiresAt)
  const selOrders = selected.map(id => s.orders.find(o => o.id === id)).filter((o): o is Order => Boolean(o))
  const volume = selOrders.reduce((sum, o) => sum + orderVolume(o), 0)
  const total = selOrders.reduce((sum, o) => sum + o.total, 0)
  return <aside className="ops">
    <section className="ops-calls">
      <header className="ops-head"><h3>📞 Pedidos entrantes <em>{waiting.length}</em></h3>{s.research.includes('autodespacho') && <span className="auto-chip">🤖 bot activo</span>}</header>
      <div className="call-list">
        {waiting.length === 0 && <div className="empty">{s.phase === 'day' ? 'El celular está tranquilo… por ahora. ☕' : s.phase === 'closing' ? 'Persiana baja. Esperando a los cadetes.' : 'Noche en Buenos Aires.'}</div>}
        {waiting.map((order, i) => <OrderCard first={i === 0} key={order.id} s={s} order={order} selected={selected.includes(order.id)} onToggle={() => onToggle(order.id)} onRush={() => onRush(order.id)} onReject={() => onReject(order.id)} />)}
      </div>
    </section>
    <section className={`dispatch-bar ${selected.length ? 'on' : ''}`}>
      {selected.length ? <><b>{selected.length} pedido{selected.length > 1 ? 's' : ''} · {money(total)}</b><span>📦 carga {volume}{selOrders.some(orderBulky) ? ' · 🚐 bulto' : ''}</span><button className="btn btn--ghost tiny" onClick={onClear}>Limpiar</button></> : <span>Tocá pedidos (en la lista o en el mapa) para armar un viaje y elegí quién sale.</span>}
    </section>
    <section className="ops-crew">
      <header className="ops-head"><h3>🚲 Tu equipo <em>{s.couriers.filter(c => !c.trip).length}/{s.couriers.length}</em></h3></header>
      <div className="crew-list">{s.couriers.map(c => <CourierCard key={c.id} s={s} courier={c} selected={selected} onSend={() => onSend(c.id)} onFocus={() => onFocus(c.id)} onBlur={() => onFocus(null)} />)}</div>
    </section>
  </aside>
}
