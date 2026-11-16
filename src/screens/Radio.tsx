import { useEffect, useRef, useState } from 'react'

const files = import.meta.glob('../assets/audio/*.mp3', { eager: true, import: 'default', query: '?url' }) as Record<string, string>
const tracks = Object.entries(files).sort(([a], [b]) => a.localeCompare(b)).map(([path, src]) => ({ src, title: path.split('/').pop()!.replace(/\.mp3$/i, '') }))

export function Radio() {
  const audio = useRef<HTMLAudioElement>(null)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(.4)
  useEffect(() => { if (audio.current) audio.current.volume = volume }, [volume])
  useEffect(() => { if (playing) audio.current?.play().catch(() => setPlaying(false)) }, [index]) // eslint-disable-line react-hooks/exhaustive-deps
  const track = tracks[index]
  if (!track) return null
  const skip = (dir: number) => setIndex(i => (i + dir + tracks.length) % tracks.length)
  const toggle = () => { if (!audio.current) return; if (playing) audio.current.pause(); else audio.current.play().catch(() => undefined) }
  return <div className={`radio ${playing ? 'on' : ''}`}>
    <audio ref={audio} src={track.src} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => skip(1)} />
    <span className="radio-dial">FM 88.{index + 3}</span>
    <button onClick={() => skip(-1)} aria-label="Anterior">⏮</button>
    <button onClick={toggle} aria-label={playing ? 'Pausar' : 'Reproducir'}>{playing ? '⏸' : '▶'}</button>
    <button onClick={() => skip(1)} aria-label="Siguiente">⏭</button>
    <span className="radio-title" title={track.title}>{track.title}</span>
    <input type="range" min={0} max={1} step={.05} value={volume} onChange={e => setVolume(Number(e.target.value))} aria-label="Volumen" />
  </div>
}
