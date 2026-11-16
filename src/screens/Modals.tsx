import { INCIDENTS, LEVELS, RANKS, rankOf } from '../game/content'
import * as E from '../game/engine'
import type { GameState } from '../game/types'
import { Filete, Modal, Stars, fmt, money } from '../ui/common'
import { PixelIcon } from '../ui/PixelIcon'
import type { PanelId } from './Panels'

type Act = (fn: (s: GameState) => GameState) => void

export function IncidentModal({ s, act }: { s: GameState; act: Act }) {
  const pending = s.pendingIncident!
  const def = INCIDENTS.find(d => d.id === pending.incidentId)!
  const courier = s.couriers.find(c => c.id === pending.courierId)!
  return <div className="modal-backdrop alarm">
    <Filete className="modal incident" tone="red">
      <div className="siren">● EMERGENCIA EN RUTA ●</div>
      <div className="incident-head"><PixelIcon emoji={def.emoji} size={64} /><div><small className="kicker">{courier.name} reporta por radio</small><h2>{def.title}</h2><p>{def.text}</p></div></div>
      <div className="choices">{def.choices!.map((choice, i) => <button key={i} className="choice-btn" disabled={Boolean(choice.cost && choice.cost > s.capital)} onClick={() => act(x => E.resolveIncident(x, i))}><b>{choice.label}</b><small>{choice.detail}</small></button>)}</div>
    </Filete>
  </div>
}

export function StoryModal({ s, act }: { s: GameState; act: Act }) {
  const card = s.pendingStory!
  return <div className="modal-backdrop">
    <Filete className="modal story" tone="cream">
      <div className="story-portrait"><PixelIcon emoji={card.emoji} size={96} res={22} /><small>{card.who}</small></div>
      <div className="story-body"><small className="kicker">Te escriben de noche</small><h2>{card.title}</h2><p>{card.text}</p>
        <div className="choices">{card.choices.map((choice, i) => <button key={i} className="choice-btn" disabled={Boolean(choice.cost && choice.cost > s.capital)} onClick={() => act(x => E.resolveStory(x, i))}><b>{choice.label}</b><small>{choice.detail}</small></button>)}</div>
      </div>
    </Filete>
  </div>
}

export function SummaryModal({ s, act }: { s: GameState; act: Act }) {
  const st = s.stats
  const profit = st.revenue - st.fees - st.cogs - st.expenses
  const avg = st.ratings.length ? st.ratings.reduce((a, b) => a + b, 0) / st.ratings.length : 0
  const fansDelta = s.fans - st.fansStart
  const verdict = profit > 300000 ? '¡Día espectacular! Franco no lo puede creer.' : profit > 50000 ? 'Buen día. Así se construye un negocio.' : profit >= 0 ? 'Día flojo, pero se cubrieron los gastos.' : 'Día en rojo. Mañana hay que remontarla.'
  return <div className="modal-backdrop">
    <div className="ticket">
      <header><b>{s.storeName.toUpperCase()}</b><small>{E.weekday(s.day)} {s.day} · CIERRE DE CAJA</small><small>{'-'.repeat(32)}</small></header>
      <ul>
        <li><span>Entregas</span><b>{st.delivered}</b></li>
        <li><span>Perdidos / cancelados</span><b>{st.failed + st.lost}</b></li>
        <li><span>Calificación del día</span><b>{st.ratings.length ? <Stars value={avg} size={12} /> : '—'}</b></li>
        <li className="sep" />
        <li><span>Ventas</span><b>{money(st.revenue - st.tips)}</b></li>
        {st.tips > 0 && <li><span>Propinas</span><b>{money(st.tips)}</b></li>}
        {st.fees > 0 && <li><span>Comisión Mercado Chango</span><b>-{money(st.fees)}</b></li>}
        <li><span>Costo de mercadería</span><b>-{money(st.cogs)}</b></li>
        {Object.entries(st.detail).filter(([, v]) => v).map(([k, v]) => <li key={k}><span>{k}</span><b>-{money(v)}</b></li>)}
        <li className="sep" />
        <li className={`total ${profit < 0 ? 'neg' : ''}`}><span>RESULTADO</span><b>{money(profit)}</b></li>
        <li><span>Caja</span><b>{money(s.capital)}</b></li>
        <li><span>Fans</span><b>{fmt(s.fans)} ({fansDelta >= 0 ? '+' : ''}{fansDelta})</b></li>
      </ul>
      <p className="verdict">{verdict}</p>
      {s.debtDays > 0 && <p className="warn">⚠️ Caja en negativo ({s.debtDays}/3 días). ¡Conseguí plata o quebrás!</p>}
      <footer><small>GRACIAS POR SU COMPRA · VUELVA PRONTOS</small><button className="btn btn--gold" onClick={() => act(E.goToNight)}>Ir a la noche ›</button></footer>
    </div>
  </div>
}

export function NightPanel({ s, act, open }: { s: GameState; act: Act; open: (id: PanelId) => void }) {
  const first = s.today === null
  const tomorrow = s.tomorrow
  const stockUnits = Object.values(s.stock).reduce((a, b) => a + b, 0)
  const incoming = s.purchases.reduce((a, b) => a + b.qty, 0)
  return <div className="night-wrap">
    <Filete className="night">
      <small className="kicker">{first ? 'Domingo a la noche · antes de arrancar' : `${E.weekday(s.day)} ${s.day} · noche`}</small>
      <h2>{first ? 'Mañana abrís el negocio' : 'La ciudad duerme. Vos no.'}</h2>
      {tomorrow && <div className={`forecast forecast--${tomorrow.tone}`}><PixelIcon emoji={tomorrow.emoji} size={48} /><div><small>Pronóstico para mañana</small><b>{tomorrow.title}</b><p>{tomorrow.text}</p></div></div>}
      <div className="night-stats">
        <span><PixelIcon emoji="📦" size={22} /> {stockUnits} en stock{incoming ? ` · ${incoming} en camino` : ''}</span>
        <span><PixelIcon emoji="🧑‍🤝‍🧑" size={22} /> {s.couriers.length} en el equipo</span>
        <span><PixelIcon emoji="💡" size={22} /> {Math.floor(s.ideas)} ideas</span>
      </div>
      <div className="night-actions">
        <button className="btn" onClick={() => open('stock')}>📦 Comprar mercadería</button>
        <button className="btn" onClick={() => open('team')}>🧑‍🤝‍🧑 Equipo</button>
        <button className="btn" onClick={() => open('dev')}>💡 Desarrollo</button>
        <button className="btn" onClick={() => open('ads')}>📣 Publicidad</button>
      </div>
      {stockUnits + incoming === 0 && <p className="warn">⚠️ No tenés mercadería. Comprá algo antes de abrir o vas a vivir haciendo corridas a Once.</p>}
      <button className="btn btn--gold big" onClick={() => act(E.startDay)}>☀️ Abrir el {E.weekday(first ? s.day : s.day + 1)} {first ? s.day : s.day + 1}</button>
    </Filete>
  </div>
}

export function GameOver({ s, onRestart }: { s: GameState; onRestart: () => void }) {
  return <Modal title="Bajaste la persiana para siempre" kicker="Quiebra" tone="red">
    <div className="end">
      <PixelIcon emoji="🥀" size={80} />
      <p>Tres días seguidos en rojo. Los proveedores no te fían más, los cadetes se fueron con Lobo Envíos y tu vieja ya puso la pieza en alquiler.</p>
      <p>Pero llegaste a <b>{LEVELS[s.level].name}</b>, entregaste <b>{fmt(s.lifetime.delivered)}</b> pedidos y llegaste a <b>{fmt(s.lifetime.maxFans)}</b> fans en {s.day} días. El rebusque sigue.</p>
      <button className="btn btn--gold big" onClick={onRestart}>Volver a empezar</button>
    </div>
  </Modal>
}

export function Victory({ s, onClose }: { s: GameState; onClose: () => void }) {
  return <Modal title="¡Leyenda de CABA!" kicker={RANKS[rankOf(s)]} onClose={onClose}>
    <div className="end">
      <PixelIcon emoji="🏆" size={80} />
      <p>El Hub Rebusque ilumina la ciudad. {fmt(s.fans)} personas siguen tu marca, y el pibe que salió en bici desde la pieza de su vieja ahora da charlas en la UBA.</p>
      <p>{fmt(s.lifetime.delivered)} entregas · {money(s.lifetime.revenue)} facturados · {s.day} días.</p>
      <button className="btn btn--gold big" onClick={onClose}>Seguir jugando</button>
    </div>
  </Modal>
}
