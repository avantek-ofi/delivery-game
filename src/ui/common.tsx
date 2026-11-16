import type { ReactNode } from 'react'
import { money } from '../game/engine'

export { money }

export const fmt = (n: number) => Math.round(n).toLocaleString('es-AR')

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const full = Math.round(value * 2) / 2
  return <span className="stars" style={{ fontSize: size }} aria-label={`${value.toFixed(1)} estrellas`}>
    {[1, 2, 3, 4, 5].map(i => <span key={i} className={full >= i ? 'on' : full >= i - .5 ? 'half' : 'off'}>★</span>)}
  </span>
}

export function Bar({ value, max, tone = 'gold', label }: { value: number; max: number; tone?: 'gold' | 'green' | 'red' | 'celeste' | 'rose'; label?: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
  return <div className={`bar bar--${tone}`} title={label}><i style={{ width: `${pct}%` }} />{label && <span>{label}</span>}</div>
}

export function Filete({ children, className = '', tone = 'navy' }: { children: ReactNode; className?: string; tone?: 'navy' | 'cream' | 'red' }) {
  return <div className={`filete filete--${tone} ${className}`}>
    <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
    {children}
  </div>
}

export function Modal({ title, onClose, children, wide, tone, kicker }: { title: ReactNode; onClose?: () => void; children: ReactNode; wide?: boolean; tone?: 'navy' | 'cream' | 'red'; kicker?: string }) {
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && onClose) onClose() }}>
    <Filete className={`modal ${wide ? 'modal--wide' : ''}`} tone={tone}>
      <header className="modal-head">
        <div>{kicker && <small className="kicker">{kicker}</small>}<h2>{title}</h2></div>
        {onClose && <button className="x" onClick={onClose} aria-label="Cerrar">✕</button>}
      </header>
      <div className="modal-body">{children}</div>
    </Filete>
  </div>
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: ReactNode }[]; value: T; onChange: (id: T) => void }) {
  return <nav className="tabs">{tabs.map(tab => <button key={tab.id} className={tab.id === value ? 'on' : ''} onClick={() => onChange(tab.id)}>{tab.label}</button>)}</nav>
}
