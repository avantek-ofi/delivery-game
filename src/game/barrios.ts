import type { Barrio } from './types'

// Coordenadas en % sobre el arte del mapa (caba-arcade-map.png).
const b = (id: string, name: string, zone: Barrio['zone'], x: number, y: number, wealth: number, risk: number, demand: number): Barrio => ({ id, name, zone, x, y, wealth, risk, demand })

export const BARRIOS: Barrio[] = [
  b('nunez', 'Núñez', 'Norte', 32, 11, 1.2, .2, .9),
  b('saavedra', 'Saavedra', 'Norte', 24, 16, 1.05, .25, .8),
  b('urquiza', 'Villa Urquiza', 'Norte', 27, 24, 1.1, .25, 1),
  b('belgrano', 'Belgrano', 'Norte', 40, 19, 1.25, .2, 1.2),
  b('colegiales', 'Colegiales', 'Norte', 38, 26, 1.15, .22, .9),
  b('chacarita', 'Chacarita', 'Norte', 33, 32, 1, .35, .8),
  b('palermo', 'Palermo', 'Norte', 47, 28, 1.3, .25, 1.4),
  b('recoleta', 'Recoleta', 'Norte', 56, 27, 1.35, .2, 1.2),
  b('retiro', 'Retiro', 'Centro', 66, 27, 1.1, .55, .9),
  b('villa-crespo', 'Villa Crespo', 'Oeste', 42, 38, 1.05, .3, 1.1),
  b('devoto', 'Villa Devoto', 'Oeste', 15, 37, 1.1, .2, .8),
  b('villa-del-parque', 'Villa del Parque', 'Oeste', 22, 33, 1, .25, .8),
  b('liniers', 'Liniers', 'Oeste', 7, 50, .9, .45, .8),
  b('floresta', 'Floresta', 'Oeste', 23, 53, .95, .4, .8),
  b('mataderos', 'Mataderos', 'Oeste', 13, 63, .9, .5, .8),
  b('flores', 'Flores', 'Oeste', 31, 58, 1, .4, 1.2),
  b('caballito', 'Caballito', 'Oeste', 40, 49, 1.05, .3, 1.3),
  b('almagro', 'Almagro', 'Centro', 47, 43, 1, .35, 1.1),
  b('boedo', 'Boedo', 'Centro', 49, 58, .95, .4, .9),
  b('balvanera', 'Balvanera (Once)', 'Centro', 53, 43, .9, .5, 1.2),
  b('san-nicolas', 'San Nicolás', 'Centro', 61, 38, 1.1, .45, 1.2),
  b('monserrat', 'Monserrat', 'Centro', 62, 47, 1, .45, .9),
  b('constitucion', 'Constitución', 'Sur', 58, 57, .85, .65, .9),
  b('san-telmo', 'San Telmo', 'Centro', 68, 53, 1.05, .4, 1),
  b('puerto-madero', 'Puerto Madero', 'Centro', 78, 42, 1.5, .15, .7),
  b('parque-patricios', 'Parque Patricios', 'Sur', 58, 67, .9, .5, .9),
  b('pompeya', 'Nueva Pompeya', 'Sur', 49, 70, .85, .6, .8),
  b('barracas', 'Barracas', 'Sur', 69, 70, .9, .55, .9),
  b('boca', 'La Boca', 'Sur', 79, 76, .85, .65, .8),
  b('soldati', 'Villa Soldati', 'Sur', 43, 81, .8, .7, .7),
  b('lugano', 'Villa Lugano', 'Sur', 36, 86, .8, .7, .8),
]

export const barrioById = (id: string) => BARRIOS.find(item => item.id === id) ?? BARRIOS[0]
// Distancia en "cuadras de juego": compensa el aspecto 16:9 del mapa.
export const distance = (a: { x: number; y: number }, c: { x: number; y: number }) => Math.hypot(a.x - c.x, (a.y - c.y) * .5625)

export const ZONE_COLORS: Record<Barrio['zone'], string> = { Norte: '#5fb3d9', Centro: '#f2c14e', Oeste: '#ef8b4c', Sur: '#d9534f' }

export const START_BARRIOS: { id: string; perk: string; rentMult: number }[] = [
  { id: 'caballito', perk: 'Centro geográfico de la ciudad: llegás a todos lados. Equilibrado.', rentMult: 1 },
  { id: 'balvanera', perk: 'Al lado de los mayoristas de Once: la mercadería te sale 8% menos. Calles bravas.', rentMult: .85 },
  { id: 'palermo', perk: 'Clientes con plata y propinas generosas. El alquiler duele.', rentMult: 1.45 },
  { id: 'flores', perk: 'Avellaneda y la feria: el barrio te banca. Más fans al arrancar.', rentMult: .9 },
  { id: 'barracas', perk: 'Galpones baratos y espacio de sobra: +40% de depósito. Lejos del norte.', rentMult: .75 },
]
