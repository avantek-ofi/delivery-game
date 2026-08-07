import type React from 'react'
import type { GameState } from '../game/types'
import { characters, getStoryChapters, getStoryNews, hasStoryDecision, type StoryChapter, type StoryChoice } from '../story/chapters'

export function NeighborhoodDesk({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const chapters = getStoryChapters(game)
  const news = getStoryNews(game)
  const choose = (chapter: StoryChapter, choice: StoryChoice) => setGame(current => {
    if (!current || hasStoryDecision(current, chapter.id)) return current
    const relation = { ...current.story.relationships }
    if (choice.relation) relation[choice.relation.id] += choice.relation.amount
    const event = choice.effect.market ? { ...choice.effect.market, endsAt: current.gameMinutes + 480 } : current.marketEvent
    return {
      ...current,
      capital: Math.max(0, current.capital + (choice.effect.capital ?? 0)),
      reputation: Math.max(0, current.reputation + (choice.effect.reputation ?? 0)),
      energy: Math.min(100, current.energy + (choice.effect.energy ?? 0)),
      marketEvent: event,
      story: {
        decisions: [...current.story.decisions, { chapterId: chapter.id, choiceId: choice.id, createdAt: current.gameMinutes }],
        relationships: relation,
        routeRiskBonus: Math.max(-.25, Math.min(.2, current.story.routeRiskBonus + (choice.effect.routeRiskBonus ?? 0))),
      },
    }
  })

  return <div className="modal-backdrop">
    <section className="supplier-window neighborhood-desk">
      <header><div><small>RED BARRIAL · HISTORIAS Y RELACIONES</small><h2>El barrio</h2></div><button onClick={onClose}>X</button></header>
      <section className="neighborhood-news">
        {news.map(item => <article key={item.title}><small>{item.title.toUpperCase()}</small><strong>{item.text}</strong></article>)}
      </section>
      <section className="relationship-row">
        {Object.entries(characters).map(([id, person]) => <article className={person.tone} key={id}><b>{person.name.split(' ').map(part => part[0]).join('')}</b><div><strong>{person.name}</strong><small>{person.role}</small></div><span>{game.story.relationships[id as keyof typeof game.story.relationships] > 0 ? '+' : ''}{game.story.relationships[id as keyof typeof game.story.relationships]}</span></article>)}
      </section>
      <section className="chapter-list">
        {chapters.map(chapter => {
          const decision = game.story.decisions.find(item => item.chapterId === chapter.id)
          const selected = decision ? chapter.choices.find(choice => choice.id === decision.choiceId) : null
          return <article className={chapter.available ? 'ready' : chapter.resolved ? 'resolved' : 'locked'} key={chapter.id}>
            <header><div><small>{chapter.district.toUpperCase()} · {chapter.role.toUpperCase()}</small><h3>{chapter.title}</h3></div><b>{chapter.available ? 'NUEVO' : chapter.resolved ? '✓' : '◌'}</b></header>
            <p>{chapter.body}</p>
            {chapter.available ? <div className="story-choices">{chapter.choices.map(choice => <button key={choice.id} onClick={() => choose(chapter, choice)}><strong>{choice.label}</strong><span>{choice.description}</span></button>)}</div> : chapter.resolved ? <p className="story-result">Decisión tomada: <strong>{selected?.label}</strong></p> : <p className="story-result">Todavía no está disponible. Seguí creciendo para abrir esta historia.</p>}
          </article>
        })}
      </section>
      <p className="story-footer">Tus decisiones se guardan y cambian dinero, reputación, energía, eventos de demanda y el riesgo de reparto.</p>
    </section>
  </div>
}
