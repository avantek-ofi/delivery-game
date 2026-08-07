import data from '../data/neighborhoods.json'
export type CityZone = { id: string; name: string; zone: string; x: number; y: number; demand: number; routeRisk: number; security: number; saleSize: number; distance: number; risk: 'Bajo' | 'Medio' | 'Alto'; color: string }
export const cityZones: CityZone[] = data.map(item => ({ ...item, distance: Math.round(Math.hypot(item.x - 23, item.y - 71)), risk: item.routeRisk >= .055 ? 'Alto' : item.routeRisk >= .03 ? 'Medio' : 'Bajo', color: item.zone === 'Norte' ? '#70a67d' : item.zone === 'Centro' ? '#e7bd58' : item.zone === 'Oeste' ? '#e78655' : '#b85f61' }))

export const findZone = (id: string) => cityZones.find(zone => zone.id === id) ?? cityZones[0]
