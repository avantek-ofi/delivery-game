import type { DesktopApp, GameState, MailMessage, OnboardingState } from '../game/types'

export const starterApps: DesktopApp[] = ['supplier', 'inventory', 'listings', 'orders', 'map']
export const starterMail = (createdAt: number): MailMessage => ({
  id: 'franco-welcome', sender: 'Franco', subject: 'Bienvenido a tu nuevo negocio', createdAt, read: false, required: true,
  body: [
    'Che, me alegra que hayas decidido intentarlo. Tenés $150.000: son tus ahorros, así que cada compra cuenta.',
    'La regla es simple: importá poco, publicá lo que tengas, atendé pedidos y entregá bien. No te apures a crecer sin caja.',
    'Yo te voy avisando cuando tengas algo nuevo para aprender. Arrancá leyendo el mail de ImportaYa y elegí tu primera mercadería.',
  ],
})

export const importaYaMail = (createdAt: number): MailMessage => ({
  id: 'importaya-first', sender: 'ImportaYa', subject: 'Tu catálogo inicial está listo', createdAt, read: false,
  body: [
    'Te habilitamos tres productos de prueba y un solo proveedor para tu primera compra.',
    'Elegí cantidades chicas: la mercadería tarda en llegar y ocupa espacio. Cuando vendas y mejores tu negocio, vas a acceder a más catálogo.',
  ],
})

type UnlockRule = { app: DesktopApp; id: string; test: (game: GameState) => boolean; subject: string; body: string[] }
const rules: UnlockRule[] = [
  { app: 'upgrades', id: 'growth-unlocked', test: game => game.progression.totalImported > 0, subject: 'Nuevo: Centro de desarrollo', body: ['Ya moviste tu primera mercadería. Desde Desarrollo podés investigar negociación, catálogo y publicidad.', 'La investigación convierte resultados en nuevas herramientas; elegí con cuidado en qué gastar.'] },
  { app: 'offers', id: 'negotiation-unlocked', test: game => game.onboarding.research.includes('negotiation'), subject: 'Nueva habilidad: Negociar', body: ['Investigaste negociación. A partir de ahora algunos compradores van a mandar ofertas y podés aceptarlas, rechazarlas o contraofertar.'] },
  { app: 'customers', id: 'customers-unlocked', test: game => game.progression.totalDelivered >= 2, subject: 'Nuevo: Clientes y reseñas', body: ['Dos entregas ya hablan de vos. Se habilitó Clientes para ver reseñas, reclamos y quienes vuelven a comprarte.', 'Las reseñas no son azar puro: entregar antes del vencimiento, evitar incidentes y mejorar empaque y despacho sube la calificación y tu reputación.'] },
  { app: 'finance', id: 'finance-unlocked', test: game => game.orderStats.completed >= 3, subject: 'Nuevo: Finanzas', body: ['Ya hay suficiente movimiento para mirar números. Finanzas te muestra caja, comisiones y proyecciones.'] },
  { app: 'vehicles', id: 'fleet-unlocked', test: game => game.facility.level >= 1, subject: 'Nueva: Flota', body: ['Tu base ya puede sostener operación. Se habilitó Flota para planificar compras y vehículos desbloqueables.'] },
  { app: 'neighborhood', id: 'neighborhood-unlocked', test: game => game.progression.totalDelivered >= 3, subject: 'Nuevo: El barrio', body: ['El barrio ya te conoce. Se habilitaron historias, relaciones y decisiones que pueden modificar tu mercado y tus rutas.'] },
  { app: 'goals', id: 'goals-unlocked', test: game => game.progression.totalListings >= 2, subject: 'Nuevo: Objetivos', body: ['Tu vidriera está activa. Objetivos te ayuda a orientar el próximo salto y reclamar recompensas.'] },
  { app: 'phone', id: 'phone-unlocked', test: game => game.reputation >= 3, subject: 'Nuevo: Celular de gestión', body: ['Tu reputación empieza a abrir puertas. El celular reúne avisos, rango y personalización de escritorio.'] },
]

export const applyProgressUnlocks = (game: GameState): OnboardingState => {
  const onboarding = game.onboarding
  const nextApps = [...onboarding.unlockedApps]
  const nextMail = [...onboarding.mails]
  for (const rule of rules) {
    if (!rule.test(game) || nextApps.includes(rule.app) || nextMail.some(mail => mail.id === rule.id)) continue
    nextApps.push(rule.app)
    nextMail.push({ id: rule.id, sender: 'Franco', subject: rule.subject, body: rule.body, createdAt: game.gameMinutes, read: false })
  }
  return { ...onboarding, unlockedApps: nextApps, mails: nextMail }
}
