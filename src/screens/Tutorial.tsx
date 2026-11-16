import { useEffect, useState } from 'react'
import type { GameState } from '../game/types'
import { PixelIcon } from '../ui/PixelIcon'

export type TutCtx = { selected: number; phoneOpen: boolean }
type Step = { target: string; title: string; text: string; next?: string; done?: (s: GameState, ctx: TutCtx) => boolean; pause?: boolean }

export const STEPS: Step[] = [
  { target: '.map911', title: 'Este es tu mapa', text: 'Los barrios reales de Buenos Aires. Los coloreados son tu zona: ahí llegás. Los rayados todavía no. Cada cuadrito es una cuadra y las líneas amarillas son avenidas, más rápidas. Podés hacer zoom con la ruedita y arrastrar.', next: 'Dale' },
  { target: '.forecast', title: 'El pronóstico manda', text: 'Cada noche ves qué va a pasar mañana: lluvia, clásico, paro, Hot Sale… Comprá mercadería pensando en eso.', next: 'Entendido' },
  { target: '[data-tut=night-restock]', title: 'Comprá mercadería', text: 'Sin stock no hay ventas. Tocá "Surtido recomendado": compra solo lo que más se vende, sin pasarse de presupuesto. Llega a primera hora.', done: s => s.purchases.length > 0, next: 'Ya tengo suficiente' },
  { target: '[data-tut=open-day]', title: 'Abrí el negocio', text: 'Cuando estés listo, abrí. El reloj empieza a correr: el día va de 9 a 21.', done: s => s.phase === 'day' },
  { target: '.ops-calls', title: 'Los pedidos entran como llamados', text: 'Acá van a caer los pedidos, como en una central de emergencias. Esperá el primero…', done: s => s.orders.some(o => o.status === 'waiting') },
  { target: '[data-tut=first-order]', title: 'Seleccioná el pedido', text: 'Tocalo (o tocá su pin en el mapa). El anillo de color es la paciencia del cliente. Te pausé el juego para que lo veas tranquilo.', done: (_, ctx) => ctx.selected > 0, pause: true },
  { target: '[data-tut=player-card]', title: 'Mirá la ruta y mandalo', text: 'En el mapa aparece la ruta en celeste, por las calles, con el tiempo de ida y vuelta y las cuadras. Si te convence, tocá "Enviar".', done: s => s.couriers.some(c => c.trip), pause: true },
  { target: '.map911', title: '¡Ahí va!', text: 'Tu bici avanza cuadra por cuadra. Más cuadras, más tiempo. Si en la calle pasa algo (un robo, un portero, un piquete), te llama como una emergencia y decidís vos.', next: 'Genial' },
  { target: '.speed', title: 'Controlá el tiempo', text: 'Pausá o acelerá con estos botones (o la barra espaciadora). Acelerá cuando esté tranquilo; pausá cuando lluevan pedidos.', next: 'Ok' },
  { target: '.dock-buttons', title: 'La gestión', text: 'Depósito, Flota, Desarrollo, Publicidad, Local, Plata y Desafíos. Abrirlos pausa el juego. Cada uno tiene un botón "?" que explica cómo funciona.', next: 'Ok' },
  { target: '[data-tut=phone]', title: 'Tu celu', text: 'WhatsApp con Franco, tu vieja y los clientes, el banco, el clima, las estadísticas y el manual. Si te trabás, pedile un consejo a Franco: mira tu negocio y te dice qué hacer.', next: '¡A laburar!' },
]

export function Tutorial({ s, ctx, step, onNext, onSkip }: { s: GameState; ctx: TutCtx; step: number; onNext: () => void; onSkip: () => void }) {
  const def = STEPS[step]
  const [rect, setRect] = useState<DOMRect | null>(null)
  useEffect(() => {
    const measure = () => { const el = document.querySelector(def.target); setRect(el ? el.getBoundingClientRect() : null) }
    measure()
    const id = window.setInterval(measure, 250)
    return () => window.clearInterval(id)
  }, [def.target])
  useEffect(() => { if (def.done?.(s, ctx)) onNext() }) // eslint-disable-line react-hooks/exhaustive-deps
  if (!def) return null
  const pad = 6
  const box = rect ? { left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 } : null
  // la burbuja se ubica al costado con más espacio
  const vw = window.innerWidth, vh = window.innerHeight
  let bubble: React.CSSProperties = { left: vw / 2 - 180, top: vh / 2 - 90 }
  if (box) {
    const right = vw - (box.left + box.width), left = box.left, below = vh - (box.top + box.height)
    if (box.width > vw * .5 && box.height > vh * .5) bubble = { left: box.left + 24, top: box.top + 24 }
    else if (right > 380) bubble = { left: box.left + box.width + 14, top: Math.max(10, Math.min(vh - 240, box.top)) }
    else if (left > 380) bubble = { left: box.left - 374, top: Math.max(10, Math.min(vh - 240, box.top)) }
    else if (below > 220) bubble = { left: Math.max(10, Math.min(vw - 370, box.left)), top: box.top + box.height + 12 }
    else bubble = { left: Math.max(10, Math.min(vw - 370, box.left)), top: Math.max(10, box.top - 230) }
  }
  return <div className="tut">
    {box && <div className="tut-spot" style={box} />}
    <div className="tut-bubble" style={bubble}>
      <header><PixelIcon emoji="🧔" size={34} /><div><small>Tutorial · {step + 1}/{STEPS.length}</small><b>{def.title}</b></div></header>
      <p>{def.text}</p>
      <footer>
        <button className="btn btn--ghost tiny" onClick={onSkip}>Saltear tutorial</button>
        {def.next ? <button className="btn btn--gold tiny" onClick={onNext}>{def.next}</button> : <em>Hacelo para seguir ↴</em>}
      </footer>
    </div>
  </div>
}
