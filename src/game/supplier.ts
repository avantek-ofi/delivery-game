import type { Category } from './types'

export type SupplierProduct = { id: string; name: string; description: string; priceUsd: number; importFee: number; suggestedPrice: number; volume: 1 | 2 | 3; fragility: number; seasonality: 'Estable' | 'Tendencia' | 'Estacional'; rotation: 'Lenta' | 'Media' | 'Rapida' }
export type SupplierProfile = { id: string; name: string; quality: number; delay: number; priceFactor: number; risk: 'Bajo' | 'Medio' | 'Alto'; note: string }
export const supplierProfiles: SupplierProfile[] = [
  { id: 'dragon', name: 'Dragon de Bolsillo', quality: 3, delay: 90, priceFactor: 1, risk: 'Medio', note: 'Catalogo amplio y primer envio rapido.' },
  { id: 'mayorista', name: 'Mayorista Central', quality: 4, delay: 150, priceFactor: .91, risk: 'Bajo', note: 'Mejor costo; requiere planificar la llegada.' },
  { id: 'trend', name: 'Trend Lab', quality: 5, delay: 220, priceFactor: 1.13, risk: 'Bajo', note: 'Productos de tendencia con mejor terminacion.' }
]
export type CategoryInfo = { name: Category; icon: string; tag: string; description: string }

export const categories: CategoryInfo[] = [
  { name: 'Tecnología', icon: '▣', tag: 'Margen alto', description: 'Gadgets y accesorios con inversión alta.' },
  { name: 'Ropa', icon: '◆', tag: 'Alta competencia', description: 'Entrada económica y tendencias variables.' },
  { name: 'Hogar', icon: '⌂', tag: 'Equilibrado', description: 'Artículos útiles de demanda estable.' },
  { name: 'Mascotas', icon: '♣', tag: 'Clientes fieles', description: 'Accesorios para compañeros de cuatro patas.' },
  { name: 'Deportes', icon: '●', tag: 'Demanda estacional', description: 'Entrenamiento, aire libre y bienestar.' },
  { name: 'Belleza', icon: '✦', tag: 'Margen medio', description: 'Cuidado personal y tendencias virales.' },
  { name: 'Juguetes', icon: '★', tag: 'Picos festivos', description: 'Productos divertidos con demanda cambiante.' },
  { name: 'Papelería', icon: '▤', tag: 'Bajo costo', description: 'Organización, estudio y oficina.' },
  { name: 'Cocina', icon: '◒', tag: 'Demanda estable', description: 'Utensilios compactos y prácticos.' },
  { name: 'Accesorios', icon: '◇', tag: 'Compra impulsiva', description: 'Productos pequeños fáciles de repartir.' },
]

const make = (category: string, rows: Array<[string, string, number, number]>): SupplierProduct[] => rows.flatMap(([id, name, priceUsd, suggestedPrice], index) => {
  const traits = { volume: (1 + index % 3) as 1 | 2 | 3, fragility: index % 3 === 0 ? .02 : index % 3 === 1 ? .08 : .16, seasonality: (index % 3 === 0 ? 'Estable' : index % 3 === 1 ? 'Tendencia' : 'Estacional') as SupplierProduct['seasonality'], rotation: (index % 3 === 0 ? 'Rapida' : index % 3 === 1 ? 'Media' : 'Lenta') as SupplierProduct['rotation'] }
  const base = { id: `${category}-${id}`, name, priceUsd, suggestedPrice, importFee: .12 + (index % 4) * .02, description: index % 2 ? 'Buen margen y demanda media.' : 'Liviano y fácil de almacenar.', ...traits }
  const variants = [
    { suffix: 'Mini', factor: .72, description: 'Entrada económica; ideal para probar demanda.' },
    { suffix: 'Plus', factor: 1.22, description: 'Versión mejorada con margen más alto.' },
    { suffix: 'Neo', factor: .94, description: 'Edición de temporada; buena para publicaciones nuevas.' }
  ]
  return [base, ...variants.map((variant, variantIndex) => ({ id: `${category}-${id}-${variant.suffix.toLowerCase()}`, name: `${name} ${variant.suffix}`, priceUsd: Math.max(2, Math.round(priceUsd * variant.factor)), suggestedPrice: Math.round(suggestedPrice * variant.factor * (1.04 + variantIndex * .03)), importFee: .12 + ((index + variantIndex + 1) % 4) * .02, description: variant.description, volume: Math.max(1, Math.min(3, traits.volume + (variantIndex === 1 ? 1 : 0))) as 1 | 2 | 3, fragility: Math.min(.22, traits.fragility + variantIndex * .025), seasonality: traits.seasonality, rotation: traits.rotation }))]
})
const catalog: Record<Category, SupplierProduct[]> = {
  Tecnología: make('tech', [['cable','Cable Carga Turbo',9,15500],['stand','Soporte Flexi',14,26000],['speaker','Mini Parlante Boom',23,43000],['earbuds','Auriculares Nube',19,36000],['lamp','Lámpara USB Pixel',12,22000],['tracker','Rastreador Llaverito',16,31000]]),
  Ropa: make('clothes', [['cap','Gorra Bordada',5,9000],['shirt','Remera Gráfica',8,15000],['bag','Riñonera Urbana',11,21000],['socks','Medias Galácticas',4,7500],['hoodie','Buzo Nube',18,34000],['belt','Cinto Modular',7,13500]]),
  Hogar: make('home', [['light','Luz Nocturna',7,12500],['organizer','Organizador Mini',11,20500],['mug','Taza Térmica',16,31000],['hooks','Ganchos Ninja',4,7800],['diffuser','Difusor Bruma',13,24500],['scale','Balanza Cocina',15,29000]]),
  Mascotas: make('pets', [['toy','Mordillo Cósmico',5,9500],['bowl','Plato Antivoracidad',9,17000],['leash','Correa Reflectiva',12,23000],['brush','Cepillo Mimos',7,13500],['bed','Cucha Nube',22,41000],['bottle','Botella Paseo',10,19000]]),
  Deportes: make('sport', [['band','Bandas Elásticas',8,15000],['bottle','Botella Gym',9,17000],['rope','Soga Turbo',6,12000],['gloves','Guantes Fit',11,21000],['mat','Colchoneta Flex',18,34000],['roller','Rodillo Relax',14,27000]]),
  Belleza: make('beauty', [['mirror','Espejo LED',13,25000],['brush','Cepillo Glow',7,14000],['roller','Rodillo Facial',8,15500],['case','Neceser Pop',6,12000],['dryer','Secador Pocket',19,37000],['nails','Kit Uñas Flash',10,19500]]),
  Juguetes: make('toys', [['blocks','Bloques Mini',9,17500],['plush','Peluche Ajolote',11,22000],['puzzle','Puzzle Porteño',7,13500],['car','Autito Turbo',8,15000],['robot','Robot Bailarín',21,41000],['slime','Masa Galáctica',4,8000]]),
  Papelería: make('paper', [['pens','Lapiceras Pastel',4,8000],['planner','Agenda Emprende',7,14000],['notes','Notas Pixel',3,6500],['case','Cartuchera Pop',6,12000],['markers','Marcadores Dúo',8,15500],['board','Pizarra Mini',11,21000]]),
  Cocina: make('kitchen', [['cutter','Cortador Espiral',7,13500],['scale','Balanza Pocket',14,27000],['bottle','Aceitera Spray',8,15500],['mold','Molde Bocados',6,12000],['knife','Cuchillo Cerámico',13,25000],['container','Contenedor Click',9,17500]]),
  Accesorios: make('accessory', [['wallet','Billetera Slim',7,14000],['glasses','Anteojos Retro',9,17500],['watch','Reloj Minimal',16,31000],['ring','Anillo Mood',4,8000],['bag','Bolso Mini',12,23000],['umbrella','Paraguas Pocket',10,19500]]),
}

export const getInitialProducts = (category: Category) => catalog[category]
export const getSupplierSelection = (category: Category, count = 14, premium = false) => {
  const premiumItems = premium ? catalog[category].slice(0, 4).map(product => ({ ...product, id: product.id + '-premium', name: product.name + ' Edición Pro', priceUsd: Math.round(product.priceUsd * 2.4), suggestedPrice: Math.round(product.suggestedPrice * 3.1), description: 'Línea premium: mayor inversión, mejor margen y precio de venta.' })) : []
  return [...catalog[category], ...premiumItems].sort(() => Math.random() - .5).slice(0, count)
}
export const randomCategories = (count = 3) => [...categories].sort(() => Math.random() - .5).slice(0, count)
