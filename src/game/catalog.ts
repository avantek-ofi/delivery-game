import type { Product, RubroId } from './types'

export type Rubro = { id: RubroId; name: string; emoji: string; color: string; pitch: string; ideas: number; cost: number; minLevel: number }

// Los colores de los rubros siguen la paleta de las líneas de subte.
export const RUBROS: Rubro[] = [
  { id: 'celus', name: 'Celulares y accesorios', emoji: '📱', color: '#1aa3d9', pitch: 'Rotan rápido, se rompen fácil y todo el mundo necesita un cargador.', ideas: 0, cost: 0, minLevel: 0 },
  { id: 'mate', name: 'Matería', emoji: '🧉', color: '#3c9a4f', pitch: 'Yerba, termos y mates. La demanda nunca baja: es Buenos Aires.', ideas: 0, cost: 0, minLevel: 0 },
  { id: 'ropa', name: 'Indumentaria', emoji: '👕', color: '#d64561', pitch: 'Margen alto, temporadas cambiantes y clientes que piden cambio de talle.', ideas: 0, cost: 0, minLevel: 0 },
  { id: 'almacen', name: 'Almacén de barrio', emoji: '🍪', color: '#e5a524', pitch: 'Alfajores, dulce de leche y fideos. Ticket bajo, volumen enorme.', ideas: 12, cost: 60000, minLevel: 0 },
  { id: 'futbol', name: 'Fútbol', emoji: '⚽', color: '#2f62c6', pitch: 'Camisetas y pelotas. Si hay clásico, se vende todo.', ideas: 18, cost: 90000, minLevel: 0 },
  { id: 'mascotas', name: 'Mascotas', emoji: '🐶', color: '#a86fd1', pitch: 'Clientes fieles que vuelven todos los meses por la bolsa de alimento.', ideas: 21, cost: 110000, minLevel: 1 },
  { id: 'bazar', name: 'Bazar y cocina', emoji: '🍳', color: '#ef7d32', pitch: 'Ollas, tuppers y cafeteras. Frágil pero noble.', ideas: 24, cost: 140000, minLevel: 1 },
  { id: 'belleza', name: 'Belleza', emoji: '💄', color: '#e86aa7', pitch: 'Tendencias de TikTok que explotan de un día para el otro.', ideas: 27, cost: 160000, minLevel: 1 },
  { id: 'gamer', name: 'Gamer', emoji: '🎮', color: '#6b4ee6', pitch: 'Joysticks y teclados mecánicos. Cliente exigente, ticket alto.', ideas: 36, cost: 260000, minLevel: 2 },
  { id: 'ferreteria', name: 'Ferretería', emoji: '🔧', color: '#7d8a96', pitch: 'El vecino que arregla todo un domingo a la mañana. Pesado pero rentable.', ideas: 36, cost: 240000, minLevel: 2 },
  { id: 'libreria', name: 'Librería escolar', emoji: '📚', color: '#3fb6a8', pitch: 'Vuelta al cole, carpetas y útiles. Picos enormes en marzo.', ideas: 30, cost: 180000, minLevel: 1 },
  { id: 'electro', name: 'Electro', emoji: '📺', color: '#c0392b', pitch: 'Smart TV, aires y pavas eléctricas. Necesitás utilitario y espalda financiera.', ideas: 51, cost: 600000, minLevel: 3 },
]

const p = (rubro: RubroId, id: string, name: string, emoji: string, price: number, costRatio: number, vol: number, pop: number, extra: Partial<Product> = {}): Product =>
  ({ id: `${rubro}-${id}`, rubro, name, emoji, price, cost: Math.round(price * Math.min(.86, costRatio * 1.22) / 100) * 100, vol, pop, ...extra })

export const PRODUCTS: Product[] = [
  p('celus', 'funda', 'Funda antigolpe', '📱', 9500, .38, 1, 1.4),
  p('celus', 'cargador', 'Cargador turbo 30W', '🔌', 14000, .45, 1, 1.3),
  p('celus', 'auris', 'Auriculares bluetooth', '🎧', 32000, .5, 1, 1, { fragile: true }),
  p('celus', 'powerbank', 'Power bank 20.000', '🔋', 38000, .52, 1, .8),
  p('celus', 'reloj', 'Smartwatch', '⌚', 79000, .55, 1, .5, { fragile: true }),

  p('mate', 'yerba', 'Yerba 1 kg', '🌿', 6500, .62, 2, 1.6),
  p('mate', 'bombilla', 'Bombilla de alpaca', '🥄', 11000, .42, 1, .8),
  p('mate', 'mate', 'Mate de calabaza', '🧉', 18000, .45, 1, 1, { fragile: true }),
  p('mate', 'termo', 'Termo acero 1 L', '🧴', 52000, .5, 2, .8),
  p('mate', 'kit', 'Kit matero con bolso', '👜', 74000, .52, 3, .45),

  p('ropa', 'medias', 'Medias pack x3', '🧦', 7000, .38, 1, 1.2),
  p('ropa', 'remera', 'Remera estampada', '👕', 19000, .4, 1, 1.2),
  p('ropa', 'gorra', 'Gorra bordada', '🧢', 16000, .4, 1, .9),
  p('ropa', 'buzo', 'Buzo oversize', '🧥', 46000, .45, 2, .8),
  p('ropa', 'zapas', 'Zapatillas urbanas', '👟', 89000, .55, 2, .6),

  p('almacen', 'alfajores', 'Caja de alfajores x12', '🍫', 14000, .55, 2, 1.6),
  p('almacen', 'ddl', 'Dulce de leche 1 kg', '🍯', 7500, .6, 1, 1.3),
  p('almacen', 'galletitas', 'Galletitas surtidas', '🍪', 4500, .58, 1, 1.4),
  p('almacen', 'fideos', 'Combo fideos + salsa', '🍝', 9000, .62, 2, 1),
  p('almacen', 'fernet', 'Fernet 750 + cola', '🥤', 21000, .6, 3, 1.1, { fragile: true }),

  p('futbol', 'pelota', 'Pelota N°5', '⚽', 28000, .48, 2, 1),
  p('futbol', 'bufanda', 'Bufanda del club', '🧣', 15000, .42, 1, 1),
  p('futbol', 'camiseta', 'Camiseta titular', '🎽', 85000, .5, 1, .9),
  p('futbol', 'botines', 'Botines', '🥾', 98000, .55, 2, .5),
  p('futbol', 'arco', 'Arquito plegable', '🥅', 64000, .5, 5, .3, { bulky: true }),

  p('mascotas', 'alimento', 'Alimento balanceado 15 kg', '🦴', 48000, .64, 5, 1.2, { bulky: true }),
  p('mascotas', 'piedras', 'Piedritas sanitarias', '🐱', 9000, .55, 3, 1.1),
  p('mascotas', 'correa', 'Correa retráctil', '🐕', 17000, .4, 1, .8),
  p('mascotas', 'juguete', 'Juguete mordillo', '🎾', 6500, .35, 1, 1),
  p('mascotas', 'cucha', 'Cucha acolchada', '🛏️', 56000, .48, 5, .4, { bulky: true }),

  p('bazar', 'tuppers', 'Set de tuppers', '🥡', 15000, .42, 2, 1.1),
  p('bazar', 'vasos', 'Vasos de vidrio x6', '🥛', 13000, .44, 2, .9, { fragile: true }),
  p('bazar', 'sarten', 'Sartén antiadherente', '🍳', 32000, .48, 2, .9),
  p('bazar', 'cafetera', 'Cafetera italiana', '☕', 38000, .48, 2, .7, { fragile: true }),
  p('bazar', 'cuchillos', 'Set de cuchillos', '🔪', 44000, .5, 2, .5),

  p('belleza', 'labial', 'Labial mate', '💄', 11000, .35, 1, 1.2),
  p('belleza', 'serum', 'Sérum facial', '🧪', 24000, .4, 1, 1, { fragile: true }),
  p('belleza', 'perfume', 'Perfume importado', '🌸', 72000, .55, 1, .6, { fragile: true }),
  p('belleza', 'planchita', 'Planchita de pelo', '💇', 46000, .5, 2, .6),
  p('belleza', 'esmaltes', 'Kit de esmaltes', '💅', 13500, .38, 1, 1),

  p('gamer', 'mouse', 'Mouse RGB', '🖱️', 26000, .45, 1, 1.1),
  p('gamer', 'teclado', 'Teclado mecánico', '⌨️', 68000, .5, 2, .9),
  p('gamer', 'joystick', 'Joystick inalámbrico', '🎮', 74000, .55, 1, 1),
  p('gamer', 'headset', 'Headset 7.1', '🎧', 59000, .5, 2, .7),
  p('gamer', 'consola', 'Consola retro 10.000 juegos', '🕹️', 115000, .55, 2, .5, { fragile: true }),

  p('ferreteria', 'cinta', 'Cinta + precintos', '🩹', 5500, .45, 1, 1.2),
  p('ferreteria', 'lampara', 'Lámparas LED x4', '💡', 9500, .45, 1, 1.3, { fragile: true }),
  p('ferreteria', 'destor', 'Set de destornilladores', '🪛', 22000, .45, 2, .9),
  p('ferreteria', 'taladro', 'Taladro percutor', '🔨', 89000, .55, 3, .6),
  p('ferreteria', 'escalera', 'Escalera de aluminio', '🪜', 98000, .55, 6, .3, { bulky: true }),

  p('libreria', 'cuaderno', 'Cuaderno Rivadavia', '📒', 6000, .5, 1, 1.4),
  p('libreria', 'carpeta', 'Carpeta N°3 + hojas', '📁', 9000, .5, 1, 1.1),
  p('libreria', 'cartuchera', 'Cartuchera completa', '✏️', 18000, .44, 1, 1),
  p('libreria', 'mochila', 'Mochila escolar', '🎒', 52000, .5, 3, .7),
  p('libreria', 'calcu', 'Calculadora científica', '🧮', 34000, .5, 1, .6),

  p('electro', 'pava', 'Pava eléctrica', '🫖', 42000, .55, 2, 1.1),
  p('electro', 'ventilador', 'Ventilador de pie', '🌀', 78000, .58, 5, .9, { bulky: true }),
  p('electro', 'tostadora', 'Tostadora', '🍞', 39000, .55, 2, .8),
  p('electro', 'parlante', 'Parlante karaoke', '🔊', 120000, .58, 4, .6),
  p('electro', 'tele', 'Smart TV 50"', '📺', 620000, .7, 6, .35, { bulky: true, fragile: true }),
]

export const productById = (id: string) => PRODUCTS.find(item => item.id === id)!
export const rubroById = (id: RubroId) => RUBROS.find(item => item.id === id)!
export const productsOf = (rubro: RubroId) => PRODUCTS.filter(item => item.rubro === rubro)

export const TIERS: Record<'barato' | 'justo' | 'caro', { label: string; price: number; demand: number; rep: number }> = {
  barato: { label: 'Precio de amigo', price: .88, demand: 1.35, rep: .05 },
  justo: { label: 'Precio justo', price: 1, demand: 1, rep: 0 },
  caro: { label: 'Precio premium', price: 1.18, demand: .68, rep: -.04 },
}
