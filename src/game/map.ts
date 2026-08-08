import data from '../data/neighborhoods.json'
export type CityZone = { id: string; name: string; zone: string; x: number; y: number; demand: number; routeRisk: number; security: number; saleSize: number; distance: number; risk: 'Bajo' | 'Medio' | 'Alto'; color: string; rent: number }

// Positions tuned by CABA's real north / west / center / south relation and the arcade landmarks.
const artPositions: Record<string, [number, number]> = {
  nunez: [32, 11], saavedra: [24, 16], belgrano: [40, 19], colegiales: [38, 26], palermo: [47, 28], recoleta: [56, 27], retiro: [66, 27],
  devoto: [15, 37], 'villa-del-parque': [22, 33], floresta: [23, 53], flores: [31, 58], caballito: [40, 49], almagro: [47, 43], balvanera: [53, 43],
  'san-nicolas': [61, 38], monserrat: [62, 47], 'san-telmo': [68, 53], 'puerto-madero': [78, 42],
  boedo: [49, 58], 'nueva-pompeya': [49, 70], 'parque-patricios': [58, 67], barracas: [69, 70], boca: [79, 76], soldati: [43, 81], lugano: [36, 86],
}

export const cityZones: CityZone[] = data.map(item => {
  const [x, y] = artPositions[item.id] ?? [item.x, item.y]
  const baseRent = item.zone === 'Norte' ? 43000 : item.zone === 'Centro' ? 38000 : item.zone === 'Oeste' ? 29000 : 21000
  const rent = Math.round(baseRent * (.82 + item.demand * .15 + item.security * .05) / 1000) * 1000
  return { ...item, x, y, distance: Math.round(Math.hypot(x - 24, y - 55)), risk: item.routeRisk >= .055 ? 'Alto' : item.routeRisk >= .03 ? 'Medio' : 'Bajo', color: item.zone === 'Norte' ? '#70a67d' : item.zone === 'Centro' ? '#e7bd58' : item.zone === 'Oeste' ? '#e78655' : '#b85f61', rent }
})

export const findZone = (id: string) => cityZones.find(zone => zone.id === id) ?? cityZones[0]
