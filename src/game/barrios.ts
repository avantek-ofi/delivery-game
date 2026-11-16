import { GEO } from './geo'
import type { Barrio } from './types'

type Meta = { zone: Barrio['zone']; wealth: number; risk?: number }
// Datos de juego por barrio: zona, nivel socioeconómico (propinas, ticket) y riesgo en la calle.
const META: Record<string, Meta> = {
  'puerto-madero': { zone: 'Centro', wealth: 1.55, risk: .15 }, recoleta: { zone: 'Norte', wealth: 1.4 }, palermo: { zone: 'Norte', wealth: 1.35 },
  belgrano: { zone: 'Norte', wealth: 1.35 }, nunez: { zone: 'Norte', wealth: 1.25 }, colegiales: { zone: 'Norte', wealth: 1.2 }, coghlan: { zone: 'Norte', wealth: 1.15 },
  'villa-urquiza': { zone: 'Norte', wealth: 1.15 }, saavedra: { zone: 'Norte', wealth: 1.05 }, 'villa-ortuzar': { zone: 'Norte', wealth: 1.05 }, agronomia: { zone: 'Norte', wealth: 1 },
  'parque-chas': { zone: 'Norte', wealth: 1 }, 'villa-pueyrredon': { zone: 'Norte', wealth: 1 }, chacarita: { zone: 'Norte', wealth: 1, risk: .35 },
  retiro: { zone: 'Centro', wealth: 1.15, risk: .5 }, 'san-nicolas': { zone: 'Centro', wealth: 1.05, risk: .45 }, monserrat: { zone: 'Centro', wealth: .95, risk: .45 },
  'san-telmo': { zone: 'Centro', wealth: 1.05, risk: .4 }, balvanera: { zone: 'Centro', wealth: .9, risk: .5 }, 'san-cristobal': { zone: 'Centro', wealth: .9, risk: .45 }, almagro: { zone: 'Centro', wealth: 1 },
  caballito: { zone: 'Oeste', wealth: 1.1 }, 'villa-crespo': { zone: 'Oeste', wealth: 1.05 }, paternal: { zone: 'Oeste', wealth: .95 }, 'villa-gral-mitre': { zone: 'Oeste', wealth: .95 },
  flores: { zone: 'Oeste', wealth: 1, risk: .4 }, floresta: { zone: 'Oeste', wealth: .95 }, 'villa-santa-rita': { zone: 'Oeste', wealth: .95 }, 'villa-del-parque': { zone: 'Oeste', wealth: 1.05 },
  'villa-devoto': { zone: 'Oeste', wealth: 1.15 }, 'villa-real': { zone: 'Oeste', wealth: .95 }, versalles: { zone: 'Oeste', wealth: 1 }, 'monte-castro': { zone: 'Oeste', wealth: 1 },
  'villa-luro': { zone: 'Oeste', wealth: .95 }, 'velez-sarsfield': { zone: 'Oeste', wealth: .95 }, liniers: { zone: 'Oeste', wealth: .9, risk: .45 }, mataderos: { zone: 'Oeste', wealth: .9, risk: .5 },
  'parque-avellaneda': { zone: 'Oeste', wealth: .85, risk: .5 }, 'parque-chacabuco': { zone: 'Oeste', wealth: 1 },
  boedo: { zone: 'Sur', wealth: .95 }, 'nueva-pompeya': { zone: 'Sur', wealth: .8, risk: .6 }, 'parque-patricios': { zone: 'Sur', wealth: .9, risk: .5 }, barracas: { zone: 'Sur', wealth: .9, risk: .55 },
  'la-boca': { zone: 'Sur', wealth: .8, risk: .65 }, constitucion: { zone: 'Sur', wealth: .8, risk: .7 }, 'villa-soldati': { zone: 'Sur', wealth: .75, risk: .7 }, 'villa-lugano': { zone: 'Sur', wealth: .75, risk: .7 },
  'villa-riachuelo': { zone: 'Sur', wealth: .8, risk: .6 },
  // conurbano
  'vicente-lopez': { zone: 'Norte', wealth: 1.3, risk: .25 }, 'san-isidro': { zone: 'Norte', wealth: 1.4, risk: .2 }, 'san-fernando': { zone: 'Norte', wealth: 1.05, risk: .35 }, tigre: { zone: 'Norte', wealth: 1.15, risk: .3 },
  'general-san-martin': { zone: 'Oeste', wealth: .95, risk: .45 }, 'tres-de-febrero': { zone: 'Oeste', wealth: 1, risk: .4 }, hurlingham: { zone: 'Oeste', wealth: .95, risk: .4 }, moron: { zone: 'Oeste', wealth: 1.05, risk: .35 },
  'la-matanza': { zone: 'Oeste', wealth: .85, risk: .6 }, avellaneda: { zone: 'Sur', wealth: .95, risk: .5 }, lanus: { zone: 'Sur', wealth: .95, risk: .5 }, 'lomas-de-zamora': { zone: 'Sur', wealth: .9, risk: .55 },
  quilmes: { zone: 'Sur', wealth: .9, risk: .55 }, 'esteban-echeverria': { zone: 'Sur', wealth: .85, risk: .55 }, 'almirante-brown': { zone: 'Sur', wealth: .85, risk: .55 },
}

export const BARRIOS: Barrio[] = GEO.areas.map(area => {
  const meta = META[area.id] ?? { zone: 'Oeste', wealth: 1 }
  const risk = meta.risk ?? Math.max(.15, Math.min(.7, 1.25 - meta.wealth * .8))
  const demand = area.kind === 'barrio' ? .45 + area.pop / 110000 : Math.min(2.4, .7 + area.cells / 450)
  return { id: area.id, name: area.name, zone: meta.zone, x: area.cx, y: area.cy, wealth: meta.wealth, risk, demand: Math.round(demand * 100) / 100, kind: area.kind, region: area.region }
})

const byId = new Map(BARRIOS.map(b => [b.id, b]))
export const barrioById = (id: string) => byId.get(id) ?? byId.get('caballito')!
// Distancia en línea recta, en cuadras (1 unidad de mapa = 100 m ≈ 1 cuadra).
export const distance = (a: { x: number; y: number }, c: { x: number; y: number }) => Math.hypot(a.x - c.x, a.y - c.y)

export const ZONE_COLORS: Record<Barrio['zone'], string> = { Norte: '#5fb3d9', Centro: '#f2c14e', Oeste: '#ef8b4c', Sur: '#e0605c' }

export const START_BARRIOS: { id: string; perk: string; rentMult: number }[] = [
  { id: 'caballito', perk: 'Centro geográfico de la ciudad: llegás a todos lados. Equilibrado.', rentMult: 1 },
  { id: 'balvanera', perk: 'Al lado de los mayoristas de Once: la mercadería te sale 8% menos. Calles bravas.', rentMult: .85 },
  { id: 'palermo', perk: 'Clientes con plata y propinas generosas. El alquiler duele.', rentMult: 1.45 },
  { id: 'flores', perk: 'Avellaneda y la feria: el barrio te banca. Más fans al arrancar.', rentMult: .9 },
  { id: 'barracas', perk: 'Galpones baratos y espacio de sobra: +40% de depósito. Cerca del Riachuelo y del conurbano sur.', rentMult: .75 },
]

// Expansión al conurbano: se compran por región desde el Centro logístico.
export const REGIONS: { id: 'Norte' | 'Oeste' | 'Sur'; name: string; emoji: string; price: number; desc: string }[] = [
  { id: 'Norte', name: 'Zona Norte', emoji: '⛵', price: 9000000, desc: 'Vicente López, San Isidro, San Fernando y Tigre. Casas con jardín y propinas en dólares.' },
  { id: 'Oeste', name: 'Zona Oeste', emoji: '🚆', price: 11000000, desc: 'San Martín, Tres de Febrero, Hurlingham, Morón y La Matanza. Volumen enorme, por el Sarmiento.' },
  { id: 'Sur', name: 'Zona Sur', emoji: '🌉', price: 10000000, desc: 'Avellaneda, Lanús, Lomas, Quilmes y más allá del Riachuelo. Calles bravas, clientes fieles.' },
]
