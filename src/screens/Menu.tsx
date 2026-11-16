import { useState } from 'react'
import menuBg from '../assets/rebusque-filete-menu.png'
import nightBg from '../assets/buenos-aires-night.png'
import { BARRIOS, START_BARRIOS, barrioById } from '../game/barrios'
import { RUBROS, productsOf } from '../game/catalog'
import type { NewGameOptions } from '../game/engine'
import type { RubroId } from '../game/types'
import { Filete } from '../ui/common'
import { PixelIcon } from '../ui/PixelIcon'
import { play } from '../ui/sound'

export function MainMenu({ canLoad, onNew, onLoad }: { canLoad: boolean; onNew: () => void; onLoad: () => void }) {
  const [credits, setCredits] = useState(false)
  return <main className="menu" style={{ backgroundImage: `url(${menuBg})` }}>
    <section className="menu-card">
      <small className="menu-kicker">Buenos Aires · 2026</small>
      <h1 className="logo">Rebusque</h1>
      <p className="menu-tag">Un tycoon de reparto porteño. Empezás con una bici y una pieza en lo de tu vieja. Terminás siendo el rey de la logística de CABA… o volviendo a pedirle plata a tu abuela.</p>
      <div className="menu-actions">
        <button className="btn btn--gold big" onClick={() => { play('click'); onNew() }}>Nueva partida</button>
        <button className="btn big" disabled={!canLoad} onClick={() => { play('click'); onLoad() }}>{canLoad ? 'Continuar' : 'Sin partida guardada'}</button>
        <button className="btn btn--ghost" onClick={() => setCredits(true)}>Créditos</button>
      </div>
    </section>
    {credits && <div className="modal-backdrop" onClick={() => setCredits(false)}>
      <Filete className="modal credits"><h2 className="logo small">Rebusque</h2><p>Idea, planificación y desarrollo original: <b>Tec. Franco M. Cortinez</b> · Avantek.</p><p>Música: <i>Tangorockeando</i>, <i>Tarde de Plaza</i> y <i>Folklore Pixelado</i>.</p><p>Hecho en Buenos Aires, con mate y sin dormir.</p><button className="btn btn--gold" onClick={() => setCredits(false)}>Volver</button></Filete>
    </div>}
  </main>
}

const INTRO = [
  { kicker: 'Caballito · 23:40', title: 'Otra vez sin laburo.', text: 'Te echaron del call center el viernes. "Reestructuración", dijeron. Tenés 23 años, una bici playera, $200.000 ahorrados en una lata y una pieza en lo de tu vieja.' },
  { kicker: 'La misma noche · 01:15', title: 'Franco tiene una idea.', text: '"Boludo, todo el mundo compra por el celu. Comprá mercadería en Once, publicala y llevala vos en bici. Yo arranqué así." Franco tiene un local en Almagro y nunca te mintió. Bueno, casi nunca.' },
  { kicker: 'Lunes · 08:30', title: 'Rebusque arranca hoy.', text: 'El celular va a sonar. Vas a atender pedidos, salir a la calle, esquivar piquetes, lidiar con porteros y aprender a vender. Si sale bien, en unos meses vas a tener cadetes, un galpón y tu nombre en un cartel fileteado.' },
]

export function Intro({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const slide = INTRO[step]
  const next = () => { play('click'); if (step < INTRO.length - 1) setStep(step + 1); else onDone() }
  return <main className="intro" style={{ backgroundImage: `url(${nightBg})` }} onClick={next}>
    <Filete className="intro-card" key={step}>
      <small className="kicker">{slide.kicker}</small>
      <h1>{slide.title}</h1>
      <p>{slide.text}</p>
      <footer><span className="dots">{INTRO.map((_, i) => <i key={i} className={i === step ? 'on' : ''} />)}</span><button className="btn btn--gold" onClick={event => { event.stopPropagation(); next() }}>{step < INTRO.length - 1 ? 'Seguir ›' : 'Armar mi negocio ›'}</button></footer>
    </Filete>
    <button className="skip" onClick={event => { event.stopPropagation(); onDone() }}>Saltear intro</button>
  </main>
}

const STARTER_RUBROS: RubroId[] = ['celus', 'mate', 'ropa']
export function Setup({ onStart, onBack }: { onStart: (opt: NewGameOptions) => void; onBack: () => void }) {
  const [playerName, setPlayerName] = useState('Nahuel')
  const [storeName, setStoreName] = useState('')
  const [baseBarrioId, setBase] = useState('caballito')
  const [rubro, setRubro] = useState<RubroId>('celus')
  const [tutorial, setTutorial] = useState(true)
  const ready = playerName.trim() && storeName.trim()
  return <main className="setup" style={{ backgroundImage: `url(${nightBg})` }}>
    <Filete className="setup-card">
      <header><small className="kicker">Inscripción en AFIP · monotributo categoría A</small><h1>Tu emprendimiento</h1></header>
      <div className="setup-grid">
        <label className="field"><span>Tu nombre</span><input maxLength={16} value={playerName} onChange={e => setPlayerName(e.target.value)} /></label>
        <label className="field"><span>Nombre de la tienda</span><input autoFocus maxLength={24} value={storeName} placeholder="Ej: El Rebusque de Nahue" onChange={e => setStoreName(e.target.value)} />
          <span className="suggest">{['Todo Llega', 'La Esquina Envíos', 'Che Pibe Store', 'Al Toque', 'Pedí Tranqui'].map(n => <button key={n} onClick={() => setStoreName(n)}>{n}</button>)}</span>
        </label>
      </div>
      <h3 className="section-title">¿Dónde arrancás?</h3>
      <div className="choice-grid">
        {START_BARRIOS.map(item => <button key={item.id} className={`choice ${baseBarrioId === item.id ? 'on' : ''}`} onClick={() => { play('click'); setBase(item.id) }}>
          <b>{barrioById(item.id).name}</b>
          <small>{item.perk}</small>
          <em>Alquiler {item.rentMult < 1 ? 'barato' : item.rentMult > 1.2 ? 'caro' : 'normal'} · zona {barrioById(item.id).zone}</em>
        </button>)}
      </div>
      <h3 className="section-title">¿Qué vendés primero?</h3>
      <div className="choice-grid three">
        {STARTER_RUBROS.map(id => { const r = RUBROS.find(x => x.id === id)!; return <button key={id} className={`choice ${rubro === id ? 'on' : ''}`} style={{ ['--accent' as string]: r.color }} onClick={() => { play('click'); setRubro(id) }}>
          <span className="choice-icons">{productsOf(id).slice(0, 4).map(p => <PixelIcon key={p.id} emoji={p.emoji} size={30} />)}</span>
          <b>{r.name}</b><small>{r.pitch}</small>
        </button> })}
      </div>
      <footer className="setup-foot">
        <button className="btn btn--ghost" onClick={onBack}>‹ Volver</button>
        <label className="tut-check"><input type="checkbox" checked={tutorial} onChange={e => setTutorial(e.target.checked)} /> Tutorial guiado (recomendado)</label>
        <span className="hint">{BARRIOS.filter(b => b.kind === 'barrio').length} barrios de CABA + conurbano · 12 rubros · 60 productos</span>
        <button className="btn btn--gold big" disabled={!ready} onClick={() => { play('level'); onStart({ playerName: playerName.trim(), storeName: storeName.trim(), baseBarrioId, rubro, tutorial }) }}>Abrir el negocio</button>
      </footer>
    </Filete>
  </main>
}
