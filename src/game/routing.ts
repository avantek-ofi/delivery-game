// Ruteo por cuadras sobre la grilla generada en geo.ts.
// Cada celda son ~300 m (3 cuadras). Se mueve solo en cruz, como por la cuadrícula porteña,
// y las celdas de avenida cuestan menos: los cadetes prefieren ir por Rivadavia o Libertador.
import { GEO } from './geo'

const { cols, rows, cell } = GEO
const area = new Int16Array(cols * rows)
const fast = new Uint8Array(cols * rows)
const areaIndex = new Map(GEO.areas.map((a, i) => [a.id, i]))
const areaCells: number[][] = GEO.areas.map(() => [])
for (let r = 0; r < rows; r++) {
  const line = GEO.mask[r]
  const fl = GEO.fast[r]
  for (let c = 0; c < cols; c++) {
    const ch = line.charCodeAt(c)
    const idx = r * cols + c
    area[idx] = ch === 46 ? -1 : ch - 192
    fast[idx] = fl.charCodeAt(c) === 49 ? 1 : 0
    if (area[idx] >= 0) areaCells[area[idx]].push(idx)
  }
}

export const CUADRAS_PER_CELL = 3
export const AVENUE_COST = .55

const cellCenter = (idx: number): [number, number] => [((idx % cols) + .5) * cell, (Math.floor(idx / cols) + .5) * cell]

export const cellAt = (x: number, y: number) => {
  const c0 = Math.max(0, Math.min(cols - 1, Math.floor(x / cell)))
  const r0 = Math.max(0, Math.min(rows - 1, Math.floor(y / cell)))
  if (area[r0 * cols + c0] >= 0) return r0 * cols + c0
  for (let rad = 1; rad < 12; rad++) {
    for (let dr = -rad; dr <= rad; dr++) for (let dc = -rad; dc <= rad; dc++) {
      const r = r0 + dr, c = c0 + dc
      if (r >= 0 && r < rows && c >= 0 && c < cols && area[r * cols + c] >= 0) return r * cols + c
    }
  }
  return r0 * cols + c0
}

// Punto al azar dentro de un barrio (para ubicar la casa del cliente).
export const randomPointIn = (areaId: string): { x: number; y: number } => {
  const list = areaCells[areaIndex.get(areaId) ?? 0]
  const idx = list[Math.floor(Math.random() * list.length)]
  const [x, y] = cellCenter(idx)
  return { x: x + (Math.random() - .5) * cell * .6, y: y + (Math.random() - .5) * cell * .6 }
}
export const areaAt = (x: number, y: number) => GEO.areas[area[cellAt(x, y)]]?.id

// ---- A* con heap binario ----
class Heap {
  items: number[] = []
  prio: number[] = []
  push(item: number, p: number) {
    const a = this.items, q = this.prio
    a.push(item); q.push(p)
    let i = a.length - 1
    while (i > 0) {
      const parent = (i - 1) >> 1
      if (q[parent] <= q[i]) break
      ;[a[parent], a[i]] = [a[i], a[parent]]; [q[parent], q[i]] = [q[i], q[parent]]
      i = parent
    }
  }
  pop() {
    const a = this.items, q = this.prio
    const top = a[0]
    const lastI = a.pop()!, lastP = q.pop()!
    if (a.length) {
      a[0] = lastI; q[0] = lastP
      let i = 0
      for (;;) {
        const l = i * 2 + 1, r = l + 1
        let m = i
        if (l < a.length && q[l] < q[m]) m = l
        if (r < a.length && q[r] < q[m]) m = r
        if (m === i) break
        ;[a[m], a[i]] = [a[i], a[m]]; [q[m], q[i]] = [q[i], q[m]]
        i = m
      }
    }
    return top
  }
  get size() { return this.items.length }
}

export type Path = { pts: [number, number][]; cuadras: number; cost: number; avenue: number }
const cache = new Map<string, Path>()
const gScore = new Float32Array(cols * rows)
const came = new Int32Array(cols * rows)
const stamp = new Int32Array(cols * rows)
let run = 0

const search = (from: number, to: number): Path => {
  run++
  const heap = new Heap()
  const tr = Math.floor(to / cols), tc = to % cols
  const h = (idx: number) => (Math.abs(Math.floor(idx / cols) - tr) + Math.abs((idx % cols) - tc)) * AVENUE_COST
  stamp[from] = run; gScore[from] = 0; came[from] = -1
  heap.push(from, h(from))
  let found = false
  while (heap.size) {
    const cur = heap.pop()
    if (cur === to) { found = true; break }
    const r = Math.floor(cur / cols), c = cur % cols
    const neighbors = [r > 0 ? cur - cols : -1, r < rows - 1 ? cur + cols : -1, c > 0 ? cur - 1 : -1, c < cols - 1 ? cur + 1 : -1]
    for (const n of neighbors) {
      if (n < 0 || area[n] < 0) continue
      const g = gScore[cur] + (fast[n] && fast[cur] ? AVENUE_COST : 1)
      if (stamp[n] !== run || g < gScore[n]) {
        stamp[n] = run; gScore[n] = g; came[n] = cur
        heap.push(n, g + h(n))
      }
    }
  }
  const cells: number[] = []
  if (found) { for (let cur = to; cur !== -1; cur = came[cur]) cells.push(cur) } else cells.push(to, from)
  cells.reverse()
  // nos quedamos con las esquinas (cambios de dirección)
  const pts: [number, number][] = []
  let avenue = 0
  cells.forEach((idx, i) => {
    if (fast[idx]) avenue++
    if (i === 0 || i === cells.length - 1) { pts.push(cellCenter(idx)); return }
    const prev = cells[i - 1], next = cells[i + 1]
    if (idx - prev !== next - idx) pts.push(cellCenter(idx))
  })
  return { pts, cuadras: Math.max(1, (cells.length - 1) * CUADRAS_PER_CELL), cost: found ? gScore[to] : cells.length * 2, avenue }
}

export const route = (a: { x: number; y: number }, b: { x: number; y: number }): Path => {
  const from = cellAt(a.x, a.y), to = cellAt(b.x, b.y)
  const lo = Math.min(from, to), hi = Math.max(from, to)
  const key = `${lo}-${hi}`
  let path = cache.get(key)
  if (!path) {
    path = search(lo, hi)
    if (cache.size > 6000) cache.clear()
    cache.set(key, path)
  }
  const pts = from <= to ? path.pts : [...path.pts].reverse()
  // conectamos el punto exacto de origen y destino
  return { ...path, pts: [[a.x, a.y], ...pts, [b.x, b.y]] }
}

export const polylineLength = (pts: [number, number][]) => pts.reduce((sum, p, i) => i ? sum + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0, 0)
export const pointAlong = (pts: [number, number][], k: number) => {
  const total = polylineLength(pts)
  let target = total * Math.max(0, Math.min(1, k))
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
    if (target <= seg || i === pts.length - 1) {
      const f = seg ? Math.min(1, target / seg) : 1
      return { x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, y: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f, heading: pts[i][0] >= pts[i - 1][0] ? 1 : -1 }
    }
    target -= seg
  }
  const last = pts[pts.length - 1]
  return { x: last[0], y: last[1], heading: 1 }
}
