import { useEffect, useRef } from 'react'

const toneFor = (message: string) => /insuficiente|asalto|error|perdiste/i.test(message) ? 'danger' : /llegó|entrega|cobraste|confirmada/i.test(message) ? 'success' : /correo|oferta|cliente|evento/i.test(message) ? 'info' : 'neutral'

function playFeedback(tone: string) {
  if (localStorage.getItem('delivery-game:audio') === 'off') return
  try {
    const context = new AudioContext(); const oscillator = context.createOscillator(); const gain = context.createGain()
    oscillator.type = tone === 'danger' ? 'square' : 'triangle'; oscillator.frequency.value = tone === 'danger' ? 180 : tone === 'success' ? 660 : 440
    gain.gain.setValueAtTime(.045, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .16)
    oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .17)
  } catch { /* Audio can be unavailable until a user gesture; visual feedback remains. */ }
}

export function NotificationSystem({ message }: { message: string }) {
  const previous = useRef('')
  useEffect(() => { if (message && message !== previous.current) playFeedback(toneFor(message)); previous.current = message }, [message])
  return message ? <div className={`pixel-notification pixel-notification--${toneFor(message)}`} role="status" aria-live="polite"><i>!</i><span>{message}</span></div> : null
}
