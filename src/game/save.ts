import type { GameState } from './types'

const KEY = 'rebusque:save-v2'

export const loadGame = (): GameState | null => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as GameState
    if (data.version !== 2 || !data.storeName) return null
    // al cargar siempre arrancamos pausados y sin incidentes colgados de un frame
    return { ...data, speed: 0 }
  } catch { return null }
}

export const saveGame = (game: GameState) => { try { localStorage.setItem(KEY, JSON.stringify(game)) } catch { /* storage lleno o bloqueado */ } }
export const clearGame = () => { try { localStorage.removeItem(KEY) } catch { /* nada */ } }
export const hasSave = () => { try { return Boolean(localStorage.getItem(KEY)) } catch { return false } }
