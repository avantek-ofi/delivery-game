import { useState } from 'react'
import type React from 'react'
import type { GameState } from '../game/types'

type Research = { id: string; title: string; text: string; cost: number; ready: (game: GameState) => boolean }
const research: Research[] = [
  { id: 'negotiation', title: 'Habilidad: negociar', text: 'Habilita ofertas de compradores y contraofertas.', cost: 18000, ready: game => game.progression.totalListings >= 1 },
  { id: 'catalog', title: 'Catálogo ampliado', text: 'ImportaYa abre más productos del rubro.', cost: 24000, ready: game => game.progression.totalImported >= 4 },
  { id: 'suppliers', title: 'Red de importadores', text: 'Acceso a Mayorista Central y Trend Lab.', cost: 32000, ready: game => game.progression.totalDelivered >= 2 },
]
const business = [
  { id: 'salesBot' as const, title: 'Bot de ventas', text: 'Aumenta compras directas.', base: 85000 },
  { id: 'autoPacking' as const, title: 'Mesa automática', text: 'Prepara pedidos más rápido.', base: 120000 },
  { id: 'marketing' as const, title: 'Publicidad', text: 'Atrae más clientes y oportunidades.', base: 70000 },
]

export function GrowthDesk({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const [tab, setTab] = useState<'research' | 'business'>('research')
  const buyResearch = (item: Research) => setGame(current => {
    if (!current || current.onboarding.research.includes(item.id) || !item.ready(current) || current.capital < item.cost) return current
    return { ...current, capital: current.capital - item.cost, onboarding: { ...current.onboarding, research: [...current.onboarding.research, item.id] } }
  })
  const buyBusiness = (id: keyof GameState['automation'], base: number) => setGame(current => {
    if (!current) return null
    const level = current.automation[id]
    const cost = Math.round(base * (1 + level * .8))
    if (level >= 3 || current.capital < cost) return current
    return { ...current, capital: current.capital - cost, automation: { ...current.automation, [id]: level + 1 } }
  })
  return <div className="modal-backdrop"><section className="supplier-window growth-desk"><header><div><small>DESARROLLO DEL NEGOCIO</small><h2>Investigar y mejorar</h2></div><button onClick={onClose}>X</button></header><div className="growth-tabs"><button className={tab === 'research' ? 'active' : ''} onClick={() => setTab('research')}>INVESTIGACIÓN</button><button className={tab === 'business' ? 'active' : ''} onClick={() => setTab('business')}>MEJORAS</button></div><p className="growth-copy">{tab === 'research' ? 'Convertí experiencia en nuevas herramientas. Franco te manda un correo cuando una investigación habilita una aplicación.' : 'Invertí en automatización cuando tu operación ya tenga caja para sostenerla.'}</p><section className="growth-grid">{tab === 'research' ? research.map(item => { const owned = game.onboarding.research.includes(item.id); const ready = item.ready(game); return <article className={!ready && !owned ? 'locked' : ''} key={item.id}><small>{owned ? 'INVESTIGADO' : ready ? 'DISPONIBLE' : 'REQUISITO PENDIENTE'}</small><h3>{item.title}</h3><p>{item.text}</p><strong>$${item.cost.toLocaleString('es-AR')}</strong><button disabled={owned || !ready || game.capital < item.cost} onClick={() => buyResearch(item)}>{owned ? 'COMPLETADO' : ready ? 'INVESTIGAR' : 'BLOQUEADO'}</button></article> }) : business.map(item => { const level = game.automation[item.id]; const cost = Math.round(item.base * (1 + level * .8)); return <article key={item.id}><small>NIVEL {level}/3</small><h3>{item.title}</h3><p>{item.text}</p><strong>$${cost.toLocaleString('es-AR')}</strong><button disabled={level >= 3 || game.capital < cost} onClick={() => buyBusiness(item.id, item.base)}>{level >= 3 ? 'MÁXIMO' : 'MEJORAR'}</button></article> })}</section><footer>Capital disponible: <strong>$${game.capital.toLocaleString('es-AR')}</strong></footer></section></div>
}
