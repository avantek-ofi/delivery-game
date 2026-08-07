import { useEffect, useState } from 'react'

type Settings = { contrast: boolean; reduceMotion: boolean; audio: boolean }
const KEY = 'delivery-game:accessibility-v1'
const read = (): Settings => { try { return { contrast: false, reduceMotion: false, audio: true, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return { contrast: false, reduceMotion: false, audio: true } } }

export function AccessibilityControls() {
  const [open, setOpen] = useState(false); const [settings, setSettings] = useState<Settings>(read)
  useEffect(() => { document.documentElement.dataset.contrast = settings.contrast ? 'high' : 'normal'; document.documentElement.dataset.motion = settings.reduceMotion ? 'reduced' : 'normal'; localStorage.setItem(KEY, JSON.stringify(settings)); localStorage.setItem('delivery-game:audio', settings.audio ? 'on' : 'off') }, [settings])
  return <aside className="accessibility-controls"><button aria-expanded={open} onClick={() => setOpen(value => !value)}>A11Y</button>{open && <div><strong>Opciones</strong><label><input type="checkbox" checked={settings.contrast} onChange={() => setSettings(value => ({ ...value, contrast: !value.contrast }))} /> Alto contraste</label><label><input type="checkbox" checked={settings.reduceMotion} onChange={() => setSettings(value => ({ ...value, reduceMotion: !value.reduceMotion }))} /> Reducir movimiento</label><label><input type="checkbox" checked={settings.audio} onChange={() => setSettings(value => ({ ...value, audio: !value.audio }))} /> Sonidos</label></div>}</aside>
}
