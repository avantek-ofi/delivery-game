import type { ReactNode } from 'react'

export function DesktopWindow({ title, icon, children, onClose }: { title: string; icon: string; children: ReactNode; onClose: () => void }) {
  return <div className="modal-backdrop pixel-modal"><section className="desktop-window"><header><span>{icon} {title}</span><div><button aria-label="Minimizar">_</button><button aria-label="Cerrar" onClick={onClose}>×</button></div></header>{children}</section></div>
}
