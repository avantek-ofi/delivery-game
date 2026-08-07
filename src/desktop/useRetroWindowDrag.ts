import { useEffect } from 'react'

type WindowLayout = Record<string, { x: number; y: number; z: number; minimized: boolean; width?: number; height?: number }>
const KEY = 'delivery-game:desktop-windows-v1'

const read = (): WindowLayout => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as WindowLayout } catch { return {} } }
const idFor = (window: HTMLElement) => window.dataset.windowId ?? `${window.className}:${window.querySelector('h2')?.textContent ?? window.querySelector('header')?.textContent ?? 'window'}`.replace(/\s+/g, '-').slice(0, 80)

export function useRetroWindowDrag() {
  useEffect(() => {
    let active: HTMLElement | null = null
    let previous = { x: 0, y: 0 }
    let layout = read()
    let depth = Math.max(40, ...Object.values(layout).map(item => item.z ?? 0))
    const apply = (window: HTMLElement) => {
      const id = idFor(window); window.dataset.windowId = id
      const saved = layout[id]; if (!saved) return
      window.dataset.windowX = String(saved.x); window.dataset.windowY = String(saved.y)
      window.style.transform = `translate(${saved.x}px, ${saved.y}px)`; window.style.zIndex = String(saved.z)
      if (saved.width) window.style.width = `${saved.width}px`; if (saved.height) window.style.height = `${saved.height}px`
      window.classList.toggle('window-minimized', saved.minimized)
    }
    const persist = (window: HTMLElement) => {
      const id = idFor(window); const x = Number(window.dataset.windowX ?? 0); const y = Number(window.dataset.windowY ?? 0)
      layout[id] = { x, y, z: Number(window.style.zIndex || ++depth), minimized: window.classList.contains('window-minimized'), width: window.offsetWidth, height: window.offsetHeight }
      localStorage.setItem(KEY, JSON.stringify(layout))
    }
    const initialize = () => document.querySelectorAll<HTMLElement>('.supplier-window, .desktop-window').forEach(apply)
    initialize()
    const observer = new MutationObserver(initialize); observer.observe(document.body, { childList: true, subtree: true })
    const move = (event: PointerEvent) => {
      if (!active) return
      const x = Number(active.dataset.windowX ?? 0) + event.clientX - previous.x
      const y = Number(active.dataset.windowY ?? 0) + event.clientY - previous.y
      active.dataset.windowX = String(x); active.dataset.windowY = String(y); active.style.transform = `translate(${x}px, ${y}px)`; previous = { x: event.clientX, y: event.clientY }
    }
    const up = () => { if (active) persist(active); active = null }
    const down = (event: PointerEvent) => {
      const target = event.target as HTMLElement; const header = target.closest('.supplier-window > header, .desktop-window > header') as HTMLElement | null
      if (!header || target.closest('button')) return
      active = header.parentElement as HTMLElement; active.style.zIndex = String(++depth); previous = { x: event.clientX, y: event.clientY }; header.setPointerCapture(event.pointerId)
    }
    const toggle = (event: MouseEvent) => {
      const target = event.target as HTMLElement; const header = target.closest('.supplier-window > header, .desktop-window > header') as HTMLElement | null
      if (!header || target.closest('button')) return
      const window = header.parentElement as HTMLElement; window.classList.toggle('window-minimized'); persist(window)
    }
    window.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('dblclick', toggle)
    return () => { observer.disconnect(); window.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('dblclick', toggle) }
  }, [])
}
