export function DesktopIcon({ icon, label, alert, highlighted, disabled, onClick }: { icon: string; label: string; alert?: number; highlighted?: boolean; disabled?: boolean; onClick: () => void }) {
  return <button disabled={disabled} className={'desktop-icon ' + (alert ? 'has-alert ' : '') + (highlighted ? 'tutorial-focus' : '')} onClick={onClick}><i>{icon}</i><span>{label}</span>{alert ? <b>{alert}</b> : null}</button>
}
