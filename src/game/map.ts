import data from '../data/neighborhoods.json'
export type CityZone = { id: string; name: string; zone: string; x: number; y: number; demand: number; routeRisk: number; security: number; saleSize: number; distance: number; risk: 'Bajo' | 'Medio' | 'Alto'; color: string }

// Positions tuned to the illustrated arcade map, not to geographic latitude/longitude.
const artPositions: Record<string, [number, number]> = {
  belgrano: [30, 15], nunez: [37, 11], palermo: [34, 24], colegiales: [39, 19], saavedra: [43, 15], recoleta: [48, 27], retiro: [58, 28],
  'san-nicolas': [56, 38], monserrat: [55, 46], balvanera: [45, 43], almagro: [40, 47], caballito: [31, 49], flores: [24, 55], floresta: [18, 56], 'villa-del-parque': [22, 39], devoto: [15, 33],
  boedo: [45, 57], 'parque-patricios': [49, 65], barracas: [60, 72], boca: [76, 68], 'nueva-pompeya': [38, 70], lugano: [30, 81], soldati: [42, 80],
  'san-telmo': [62, 51], 'puerto-madero': [71, 43],
}

export const cityZones: CityZone[] = data.map(item => {
  const [x, y] = artPositions[item.id] ?? [item.x, item.y]
  return { ...item, x, y, distance: Math.round(Math.hypot(x - 24, y - 55)), risk: item.routeRisk >= .055 ? 'Alto' : item.routeRisk >= .03 ? 'Medio' : 'Bajo', color: item.zone === 'Norte' ? '#70a67d' : item.zone === 'Centro' ? '#e7bd58' : item.zone === 'Oeste' ? '#e78655' : '#b85f61' }
})

export const findZone = (id: string) => cityZones.find(zone => zone.id === id) ?? cityZones[0]
