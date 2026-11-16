// Efectos chiptune sintetizados con WebAudio: sin archivos extra.
let ctx: AudioContext | null = null
let muted = (() => { try { return localStorage.getItem('rebusque:mute') === '1' } catch { return false } })()

export const isMuted = () => muted
export const setMuted = (value: boolean) => { muted = value; try { localStorage.setItem('rebusque:mute', value ? '1' : '0') } catch { /* sin storage */ } }

const tone = (freq: number, start: number, dur: number, type: OscillatorType = 'square', gain = .05) => {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(gain, ctx.currentTime + start)
  g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + start + dur)
  osc.connect(g).connect(ctx.destination)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + dur + .02)
}

export type Sfx = 'ring' | 'cash' | 'bad' | 'good' | 'level' | 'click'
export const play = (sfx: Sfx) => {
  if (muted) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch { return }
  switch (sfx) {
    case 'ring': tone(880, 0, .08); tone(660, .09, .08); tone(880, .18, .08); tone(660, .27, .1); break
    case 'cash': tone(1320, 0, .06, 'square', .04); tone(1760, .06, .18, 'square', .04); break
    case 'bad': tone(180, 0, .18, 'sawtooth', .05); tone(140, .16, .25, 'sawtooth', .05); break
    case 'good': tone(523, 0, .08, 'triangle', .07); tone(659, .08, .08, 'triangle', .07); tone(784, .16, .14, 'triangle', .07); break
    case 'level': [523, 659, 784, 1046].forEach((f, i) => tone(f, i * .09, .16, 'square', .045)); break
    case 'click': tone(1200, 0, .025, 'square', .025); break
  }
}
