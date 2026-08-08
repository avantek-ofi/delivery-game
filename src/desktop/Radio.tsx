import { useEffect, useRef, useState } from 'react'

const files = import.meta.glob('../assets/audio/**/*.mp3', { eager: true, import: 'default', query: '?url' }) as Record<string, string>
const tracks = Object.entries(files).sort(([left], [right]) => left.localeCompare(right)).map(([path, src]) => ({ src, title: path.split('/').pop()!.replace(/\.mp3$/i, '').replace(/[-_]+/g, ' ') }))

export function Radio() {
  const audio = useRef<HTMLAudioElement>(null)
  const [trackIndex, setTrackIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(.55)
  const track = tracks[trackIndex]
  useEffect(() => { if (audio.current) audio.current.volume = volume }, [volume])
  useEffect(() => { if (playing && audio.current) audio.current.play().catch(() => setPlaying(false)) }, [trackIndex, playing])
  if (!track) return null
  const changeTrack = (direction: number) => setTrackIndex(current => (current + direction + tracks.length) % tracks.length)
  const toggle = () => { if (!audio.current) return; if (playing) audio.current.pause(); else audio.current.play().catch(() => undefined) }
  return <section className="radio-player" aria-label="Radio Barrio"><audio ref={audio} src={track.src} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => changeTrack(1)} /><span className="radio-signal">RADIO BARRIO</span><strong title={track.title}>{track.title}</strong><div className="radio-controls"><button aria-label="Tema anterior" title="Tema anterior" onClick={() => changeTrack(-1)}>◀◀</button><button aria-label={playing ? 'Pausar' : 'Reproducir'} title={playing ? 'Pausar' : 'Reproducir'} onClick={toggle}>{playing ? 'Ⅱ' : '▶'}</button><button aria-label="Tema siguiente" title="Tema siguiente" onClick={() => changeTrack(1)}>▶▶</button><label aria-label="Volumen">VOL <input type="range" min="0" max="1" step="0.05" value={volume} onChange={event => setVolume(Number(event.target.value))} /></label></div></section>
}
