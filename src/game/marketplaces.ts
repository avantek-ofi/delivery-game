export type Marketplace = {
  id: string
  name: string
  commission: number
  audience: string
  note: string
}

export const marketplaces: Marketplace[] = [
  { id: 'mercado-chango', name: 'Mercado Chango', commission: 0.13, audience: 'Alcance alto', note: 'Más visibilidad, comisión más alta.' },
  { id: 'vidriera', name: 'La Vidriera', commission: 0.08, audience: 'Alcance medio', note: 'Menos comisión, crecimiento más lento.' },
]

export const findMarketplace = (id: string) => marketplaces.find(platform => platform.id === id) ?? marketplaces[0]
