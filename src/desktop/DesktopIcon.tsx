export function DesktopIcon({ icon, label, alert, onClick }: { icon: string; label: string; alert?: number; onClick: () => void }) {
  return <button className={`desktop-icon ${alert ? 'has-alert' : ''}`} onClick={onClick}><i>{icon}</i><span>{label}</span>{alert ? <b>{alert}</b> : null}</button>
}
