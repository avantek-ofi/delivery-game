import type React from 'react'
import type { GameState } from '../game/types'
import { getBusinessRank, getObjectives, type Goal } from '../progression/objectives'

export function GoalsDesk({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const goals = getObjectives(game)
  const rank = getBusinessRank(game)
  const claim = (goal: Goal) => setGame(current => {
    if (!current || !goal.complete || current.progression.claimedGoals.includes(goal.id)) return current
    return { ...current, capital: current.capital + (goal.reward.capital ?? 0), reputation: current.reputation + (goal.reward.reputation ?? 0), energy: Math.min(100, current.energy + (goal.reward.energy ?? 0)), progression: { ...current.progression, claimedGoals: [...current.progression.claimedGoals, goal.id] } }
  })
  const claimed = game.progression.claimedGoals.length
  return <div className="modal-backdrop"><section className="supplier-window goals-desk"><header><div><small>CUADERNO DE CRECIMIENTO</small><h2>Objetivos</h2></div><button onClick={onClose}>X</button></header><section className="rank-banner"><div><small>NIVEL DE NEGOCIO</small><strong>{rank.name}</strong><span>Rango {rank.level}/4 · {claimed}/{goals.length} hitos cobrados</span></div><div className="rank-bars">{[1,2,3,4].map(level => <i className={level <= rank.level ? 'active' : ''} key={level}></i>)}</div></section><section className="goal-grid">{goals.map(goal => { const paid = game.progression.claimedGoals.includes(goal.id); const reward = [goal.reward.capital && `$${goal.reward.capital.toLocaleString('es-AR')}`, goal.reward.reputation && `+${goal.reward.reputation} rep`, goal.reward.energy && `+${goal.reward.energy} energia`].filter(Boolean).join(' · '); return <article className={`${goal.complete ? 'complete' : ''} ${paid ? 'claimed' : ''}`} key={goal.id}><b>{paid ? '✓' : goal.complete ? '!' : '○'}</b><div><strong>{goal.title}</strong><span>{goal.description}</span><small>{goal.progress}</small></div><button disabled={!goal.complete || paid} onClick={() => claim(goal)}>{paid ? 'COBRADO' : goal.complete ? `COBRAR ${reward}` : 'EN CURSO'}</button></article> })}</section></section></div>
}
