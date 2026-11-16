import { useState } from 'react'
import { newGame } from './game/engine'
import { hasSave, loadGame, saveGame } from './game/save'
import type { GameState } from './game/types'
import { GameScreen } from './screens/GameScreen'
import { Intro, MainMenu, Setup } from './screens/Menu'

type Screen = { id: 'menu' } | { id: 'intro' } | { id: 'setup' } | { id: 'game'; state: GameState }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ id: 'menu' })
  const [canLoad, setCanLoad] = useState(hasSave)
  if (screen.id === 'intro') return <Intro onDone={() => setScreen({ id: 'setup' })} />
  if (screen.id === 'setup') return <Setup onBack={() => setScreen({ id: 'menu' })} onStart={opt => { const state = newGame(opt); saveGame(state); setScreen({ id: 'game', state }) }} />
  if (screen.id === 'game') return <GameScreen key={screen.state.seed} initial={screen.state} onExit={() => { setCanLoad(hasSave()); setScreen({ id: 'menu' }) }} />
  return <MainMenu canLoad={canLoad} onNew={() => setScreen({ id: 'intro' })} onLoad={() => { const state = loadGame(); if (state) setScreen({ id: 'game', state }) }} />
}
