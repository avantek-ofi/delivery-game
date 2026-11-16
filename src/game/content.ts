import type { Choice, DayEvent, Effect, GameState, Vehicle } from './types'

export const OPEN_MIN = 9 * 60
export const CLOSE_MIN = 21 * 60
export const LATE_CLOSE_MIN = 23 * 60

export const LEVELS = [
  { name: 'La pieza', emoji: '🛏️', price: 0, storage: 40, couriers: 2, rent: 4000, radius: 38, demand: 1, maxCalls: 5, desc: 'Tu cuarto en lo de tu vieja. Cajas abajo de la cama y la bici en el pasillo.' },
  { name: 'Local a la calle', emoji: '🏪', price: 650000, storage: 110, couriers: 5, rent: 16000, radius: 60, demand: 1.25, maxCalls: 7, desc: 'Persiana propia, cartel y vecinos que entran a preguntar. Más zona de cobertura.' },
  { name: 'Galpón', emoji: '🏭', price: 3200000, storage: 300, couriers: 7, rent: 45000, radius: 92, demand: 1.5, maxCalls: 9, desc: 'Un galpón con portón para utilitarios. Llegás a media Capital.' },
  { name: 'Centro logístico', emoji: '🏢', price: 12000000, storage: 800, couriers: 12, rent: 110000, radius: 999, demand: 1.8, maxCalls: 12, desc: 'Estanterías hasta el techo, playa de carga y oficina con aire. Toda la Capital, y la puerta abierta al conurbano.' },
  { name: 'Hub Rebusque', emoji: '🏙️', price: 60000000, storage: 2000, couriers: 20, rent: 240000, radius: 999, demand: 2.2, maxCalls: 15, desc: 'Tu nombre en un edificio. Los que te decían "conseguite un laburo en serio" ahora te piden trabajo.' },
]

export const VEHICLES: Vehicle[] = [
  { id: 'bici', name: 'Bici playera', emoji: '🚲', price: 60000, cap: 4, speed: 1, upkeep: 0, risk: 1, bulky: false, minLevel: 0, desc: 'Sin nafta y sin seguro. La de siempre.' },
  { id: 'ebike', name: 'Bici eléctrica', emoji: '🛴', price: 380000, cap: 5, speed: 1.35, upkeep: 800, risk: .9, bulky: false, minLevel: 0, desc: 'Sube el puente Pueyrredón sin transpirar.' },
  { id: 'moto', name: 'Moto 110', emoji: '🛵', price: 1100000, cap: 8, speed: 1.9, upkeep: 3500, risk: 1.15, bulky: false, minLevel: 1, desc: 'Rápida, con baúl y un poco kamikaze.' },
  { id: 'kangoo', name: 'Utilitario', emoji: '🚐', price: 4200000, cap: 24, speed: 1.45, upkeep: 9000, risk: .7, bulky: true, minLevel: 2, desc: 'Lleva bultos grandes: alimento, cuchas, teles.' },
  { id: 'camion', name: 'Camioncito', emoji: '🚚', price: 9000000, cap: 60, speed: 1.15, upkeep: 18000, risk: .6, bulky: true, minLevel: 3, desc: 'Reparto mayorista a comercios de todo el barrio.' },
]
export const vehicleById = (id: string) => VEHICLES.find(item => item.id === id) ?? VEHICLES[0]

export type Research = { id: string; name: string; emoji: string; desc: string; ideas: number; cost: number; minLevel: number; requires?: string }
export const RESEARCH: Research[] = [
  { id: 'instagram', name: 'Instagram del local', emoji: '📸', desc: 'Abrís canal de Instagram: +35% de pedidos.', ideas: 6, cost: 25000, minLevel: 0 },
  { id: 'qr', name: 'Cobro con QR', emoji: '💳', desc: 'Pagan con el celu: propinas +60%.', ideas: 6, cost: 20000, minLevel: 0 },
  { id: 'packaging', name: 'Packaging fileteado', emoji: '🎁', desc: 'Cajas con filete y una tarjetita escrita a mano: calificaciones +0,4★.', ideas: 10, cost: 45000, minLevel: 0 },
  { id: 'whatsapp', name: 'WhatsApp Business', emoji: '💬', desc: 'Respuestas automáticas: los clientes esperan 40% más antes de cancelar.', ideas: 11, cost: 40000, minLevel: 0 },
  { id: 'ruteo', name: 'Ruteo con app de mapas', emoji: '🗺️', desc: 'Atajos y semáforos en verde: viajes 15% más rápidos.', ideas: 14, cost: 70000, minLevel: 0 },
  { id: 'chango', name: 'Tienda en Mercado Chango', emoji: '🛒', desc: '+60% de pedidos desde el marketplace, pero te cobran 13% de comisión en esos.', ideas: 16, cost: 0, minLevel: 1, requires: 'instagram' },
  { id: 'capacitacion', name: 'Capacitación de cadetes', emoji: '🎓', desc: 'Técnicas de manejo y descanso: los viajes cansan 30% menos.', ideas: 16, cost: 90000, minLevel: 1 },
  { id: 'mayoristas', name: 'Venta a comercios', emoji: '📦', desc: 'Kioscos y almacenes te hacen pedidos grandes (mayoristas).', ideas: 19, cost: 80000, minLevel: 1 },
  { id: 'import', name: 'Importación directa', emoji: '🚢', desc: 'Comprás en origen: 35% más barato, pero tarda 3 días y depende del dólar.', ideas: 22, cost: 150000, minLevel: 1 },
  { id: 'seguro', name: 'Seguro de mercadería', emoji: '🛡️', desc: 'Si te roban un pedido, el seguro cubre el 70%.', ideas: 19, cost: 160000, minLevel: 1 },
  { id: 'restock', name: 'Reposición automática', emoji: '♻️', desc: 'Cada noche se repone stock hasta el mínimo que definas en Depósito.', ideas: 22, cost: 120000, minLevel: 1 },
  { id: 'nocturno', name: 'Turno noche', emoji: '🌙', desc: 'Tomás pedidos hasta las 23 hs. Más ventas, más cansancio.', ideas: 26, cost: 200000, minLevel: 2 },
  { id: 'vip', name: 'Clientes VIP', emoji: '💎', desc: 'Puerto Madero y Recoleta te piden envíos express con propina gorda.', ideas: 29, cost: 250000, minLevel: 2 },
  { id: 'autodespacho', name: 'Bot de despacho', emoji: '🤖', desc: 'Un sistema asigna los pedidos a los cadetes libres por vos.', ideas: 35, cost: 350000, minLevel: 2 },
  { id: 'app', name: 'App propia', emoji: '📲', desc: 'La app de Rebusque en todos los celulares: +60% de pedidos, sin comisión.', ideas: 64, cost: 1500000, minLevel: 3, requires: 'chango' },
  { id: 'franquicia', name: 'Marca registrada', emoji: '™️', desc: 'Tu marca vale: +1 fan cada 2 entregas y +10% en todos los precios.', ideas: 80, cost: 3000000, minLevel: 3 },
]

export type Campaign = { id: string; name: string; emoji: string; desc: string; cost: number; days: number; demand: number; fans: number; minLevel: number; zone?: 'Norte' | 'Centro' | 'Oeste' | 'Sur'; once?: boolean; requires?: string }
export const CAMPAIGNS: Campaign[] = [
  { id: 'grupo', name: 'Post en el grupo de vecinos', emoji: '👥', desc: '"Hola vecinos, ¿alguien conoce...?" Gratis, pero con poco alcance.', cost: 3000, days: 1, demand: 1.1, fans: 6, minLevel: 0 },
  { id: 'volantes', name: 'Volantes en la parada del 60', emoji: '📄', desc: 'Mil volantes y un rollo de cinta.', cost: 18000, days: 2, demand: 1.22, fans: 15, minLevel: 0 },
  { id: 'cartel', name: 'Cartel fileteado a mano', emoji: '🎨', desc: 'Un fileteador de San Telmo te pinta la persiana. Permanente: +8% de pedidos.', cost: 120000, days: 9999, demand: 1.08, fans: 40, minLevel: 1, once: true },
  { id: 'sorteo', name: 'Sorteo en Instagram', emoji: '🎉', desc: '"Seguinos, etiquetá a 3 amigos y compartí". Explota de seguidores.', cost: 45000, days: 1, demand: 1.1, fans: 90, minLevel: 0, requires: 'instagram' },
  { id: 'influencer', name: 'Influencer de Palermo', emoji: '🤳', desc: 'Una historia y la zona Norte se vuelve loca.', cost: 260000, days: 3, demand: 1.6, fans: 220, minLevel: 1, zone: 'Norte' },
  { id: 'radio', name: 'Spot en radio AM', emoji: '📻', desc: 'Lo escuchan los taxistas, los porteros y tu abuela.', cost: 400000, days: 4, demand: 1.3, fans: 260, minLevel: 2 },
  { id: 'subte', name: 'Publicidad en la línea B', emoji: '🚇', desc: 'Todo Corrientes ve tu marca de Alem a Rosas.', cost: 900000, days: 5, demand: 1.4, fans: 600, minLevel: 2 },
  { id: 'tele', name: 'Auspicio en la tele de la tarde', emoji: '📺', desc: '"Este segmento se lo traemos gracias a..." Fama nacional.', cost: 3500000, days: 7, demand: 1.65, fans: 2500, minLevel: 3 },
]

export const FIRST_NAMES = ['Brian', 'Mica', 'Lauti', 'Agus', 'Juli', 'Tomi', 'Flor', 'Santi', 'Cami', 'Nacho', 'Rocío', 'Ezequiel', 'Yanina', 'Maxi', 'Luz', 'Thiago', 'Abril', 'Kevin', 'Sol', 'Matías', 'Daiana', 'Facu', 'Ludmila', 'Gonza', 'Belén', 'Joaquín', 'Romina', 'Walter', 'Nati', 'Pato']
export const LAST_NAMES = ['Gómez', 'Fernández', 'Benítez', 'Romero', 'Sosa', 'Acosta', 'Ruiz', 'Ledesma', 'Paz', 'Vera', 'Godoy', 'Ojeda', 'Molina', 'Ríos', 'Quiroga', 'Ibarra', 'Cabrera', 'Ponce', 'Toledo', 'Villalba']
export const COURIER_EMOJI = ['🧑', '👩', '👨', '🧑‍🦱', '👩‍🦰', '🧔', '👱', '👩‍🦱', '🧑‍🦳', '👨‍🦲']
export const BIOS = [
  'Conoce cada bache de Av. Rivadavia.', 'Estudia de noche en la UBA. Nunca llega tarde.', 'Fue cadete en una farmacia diez años.', 'Hincha de Chacarita, optimista profesional.',
  'Escucha cumbia a todo volumen. Los clientes la aman.', 'Dice que sabe todos los atajos. Algunos existen.', 'Ex mensajero de una escribanía de Tribunales.', 'Tiene un primo para cada problema.',
  'Recién llegado de Corrientes, con ganas de comerse la ciudad.', 'Hace malabares en los semáforos los domingos.', 'Ama los perros. Los perros la aman a ella.', 'Toma mate manejando. No lo recomendamos.',
  'Trabajó en un delivery de pizza en Almagro.', 'Calladito, cuidadoso, nunca rompió un paquete.', 'Habla con todos los porteros de Recoleta.', 'Corre maratones. Literalmente no se cansa.',
]

export const CUSTOMER_NAMES = ['Marta de Boedo', 'Cacho', 'Gisela', 'El Ruso', 'Doña Rosa', 'Carla (3°B)', 'Pocho', 'Mirta', 'Ramiro', 'Vane', 'Tito', 'Lorena', 'Don Alberto', 'Pili', 'Rulo', 'Coqui', 'La Colo', 'Jony', 'Silvia la del kiosco', 'Peti', 'Beto', 'Chiara', 'Manu', 'Tati', 'Hernán', 'Sabri', 'Oscar el portero', 'Mabel', 'Fede', 'Valen']
export const ORDER_NOTES = ['Tocá el timbre fuerte que no anda.', 'Dejalo con el portero, se llama Oscar.', 'Si no estoy, al vecino del 4°.', 'Llamame antes, el perro muerde.', 'Es un regalo, ¡no lo abras!', 'Pago en efectivo, tengo cambio.', 'Estoy en la oficina hasta las 18.', 'Departamento al fondo, pasillo largo.', 'Por favor rápido, lo necesito hoy.', 'Escalera, no hay ascensor. Perdón.', 'Me lo recomendó mi cuñada.', 'Si podés traeme facturas también, jaja.', 'Edificio con portero eléctrico roto.', 'Frente a la plaza, la casa verde.', 'Es para mi vieja, cumple hoy.']

// Eventos del día: se anuncian la noche anterior para que puedas planificar stock.
export const DAY_EVENTS: DayEvent[] = [
  { id: 'calma', title: 'Día tranquilo', text: 'Sol, 22 grados y nada raro en el pronóstico. Ideal para trabajar.', emoji: '☀️', tone: 'neutral' },
  { id: 'calma2', title: 'Martes cualquiera', text: 'La ciudad en piloto automático. Ni bien ni mal.', emoji: '🌤️', tone: 'neutral' },
  { id: 'lluvia', title: 'Diluvio porteño', text: 'Se inunda Juan B. Justo. Nadie quiere salir: piden todo a domicilio, pero las calles son un río.', emoji: '🌧️', tone: 'neutral', demand: 1.35, speed: .75, risk: 1.3 },
  { id: 'clasico', title: 'Superclásico', text: 'Juegan Boca y River. Camisetas, bufandas y fernet vuelan de las góndolas.', emoji: '🏟️', tone: 'good', rubros: { futbol: 2.8, almacen: 1.6 } },
  { id: 'paro', title: 'Paro de colectivos', text: 'No anda ni el 152. Todos piden delivery y los autos colapsan las avenidas.', emoji: '🚌', tone: 'neutral', demand: 1.3, speed: .85 },
  { id: 'hotsale', title: 'Hot Sale', text: 'Tres días de descuentos en todo el país. La gente compra hasta lo que no necesita.', emoji: '🔥', tone: 'good', demand: 1.6, cost: 1.04 },
  { id: 'frio', title: 'Ola polar', text: 'Seis grados en Plaza de Mayo. Buzos, termos y yerba a la orden del día.', emoji: '🥶', tone: 'good', rubros: { ropa: 1.8, mate: 1.9 } },
  { id: 'calor', title: 'Golpe de calor', text: '38° de térmica. Se agotan los ventiladores y nadie quiere pedalear.', emoji: '🥵', tone: 'neutral', rubros: { electro: 2.4, almacen: 1.3 }, speed: .9 },
  { id: 'dolar', title: 'Salta el dólar', text: 'Los noticieros con placas rojas. Importar sale más caro y los mayoristas remarcan.', emoji: '💵', tone: 'bad', dollar: 1.12, cost: 1.06, demand: .9 },
  { id: 'dolar-baja', title: 'Calma cambiaria', text: 'El dólar baja un poco. Buen momento para comprar mercadería.', emoji: '📉', tone: 'good', dollar: .94, cost: .96 },
  { id: 'piquete', title: 'Corte en la 9 de Julio', text: 'Marcha al Congreso. El centro está imposible y los cadetes dan vueltas.', emoji: '🪧', tone: 'bad', speed: .8, risk: 1.1 },
  { id: 'feriado', title: 'Fin de semana largo', text: 'Media ciudad se fue a la costa. La otra media está aburrida y compra online.', emoji: '🏖️', tone: 'neutral', demand: .8, tips: 1.4 },
  { id: 'aguinaldo', title: 'Cobraron el aguinaldo', text: 'Hay plata en la calle. Ticket más alto y propinas generosas.', emoji: '💰', tone: 'good', demand: 1.3, tips: 1.6 },
  { id: 'gamer', title: 'Lanzamiento de un juego', text: 'Salió el juego de fútbol del año. Todos quieren joystick nuevo.', emoji: '🕹️', tone: 'good', rubros: { gamer: 2.6, celus: 1.3 } },
  { id: 'vuelta-cole', title: 'Vuelta al cole', text: 'Las listas de útiles llegaron. Las madres están en modo guerra.', emoji: '🎒', tone: 'good', rubros: { libreria: 3, ropa: 1.3 } },
  { id: 'dia-madre', title: 'Día de la Madre', text: 'Perfumes, kits de mate y planchitas. Que no falte el moño.', emoji: '💐', tone: 'good', rubros: { belleza: 2.4, mate: 1.5, bazar: 1.5 } },
  { id: 'tiktok', title: 'Algo se volvió viral', text: 'Un tiktoker mostró un sérum milagroso y ahora todos lo quieren.', emoji: '📈', tone: 'good', rubros: { belleza: 1.9, celus: 1.4 } },
  { id: 'mascotas', title: 'Feria de adopción en Parque Centenario', text: 'Cientos de familias nuevas con perro. Necesitan de todo.', emoji: '🐾', tone: 'good', rubros: { mascotas: 2.5 } },
  { id: 'corte-luz', title: 'Corte de luz en media ciudad', text: 'Edesur dice que "mañana se normaliza". Los ascensores no andan y nadie atiende el portero.', emoji: '🔌', tone: 'bad', demand: .85, speed: .85, rubros: { ferreteria: 2, electro: 1.4 } },
  { id: 'inspeccion', title: 'Operativo de tránsito', text: 'Controles en todas las avenidas. Si tu gente anda sin casco, olvidate.', emoji: '🚓', tone: 'bad', speed: .88, risk: .7 },
  { id: 'mundial', title: 'Juega la Selección', text: 'Toda la ciudad frente a la tele. Antes del partido: camisetas, fernet y una tele nueva.', emoji: '🇦🇷', tone: 'good', rubros: { futbol: 3, electro: 1.8, almacen: 1.7 }, demand: 1.1 },
]

export type IncidentDef = { id: string; title: string; text: string; emoji: string; delay?: number; lose?: boolean; damage?: number; injury?: boolean; choices?: (Choice & { delay?: number; lose?: boolean; rating?: number })[] }
export const INCIDENTS: IncidentDef[] = [
  { id: 'pinchadura', title: 'Pinchadura', text: 'Una goma pinchada en pleno Av. La Plata. Toca parche y bombín.', emoji: '🛞', delay: 20 },
  { id: 'semaforo', title: 'Semáforo eterno', text: 'El de Pueyrredón y Córdoba no cambia más. Paciencia.', emoji: '🚦', delay: 10 },
  { id: 'robo', title: '¡Robo!', text: 'Dos pibes en moto. Se llevaron el paquete. Tu cadete está bien, pero asustado.', emoji: '🚨', lose: true },
  { id: 'choque', title: 'Choque leve', text: 'Un taxi abrió la puerta sin mirar. Hay que arreglar el vehículo.', emoji: '💥', delay: 25, damage: 25000, injury: true },
  {
    id: 'portero', title: 'Nadie atiende', text: 'El cliente no contesta el portero ni el celular. ¿Qué hacemos?', emoji: '🔔',
    choices: [
      { label: 'Esperar 20 minutos', detail: 'Perdés tiempo pero entregás.', effect: {}, result: 'Al rato bajó en pantuflas pidiendo perdón.', delay: 20 },
      { label: 'Dejárselo al portero', detail: 'Rápido, pero la calificación puede bajar.', effect: {}, result: 'Oscar el portero lo guardó. El cliente no quedó muy contento.', rating: -1.5 },
    ],
  },
  {
    id: 'propina', title: 'El cliente quiere negociar', text: '"Che, ¿no me hacés un descuentito? Te pago en efectivo ahora."', emoji: '🤝',
    choices: [
      { label: 'Hacerle 10%', detail: 'Cliente feliz, menos plata.', effect: { fans: 3 }, result: 'Te dejó 5 estrellas y te va a recomendar.', rating: 1 },
      { label: 'Precio es precio', detail: 'Cobrás completo.', effect: {}, result: 'Pagó a regañadientes.', rating: -.5 },
    ],
  },
  {
    id: 'desvio', title: 'Calle cortada', text: 'Están rompiendo la vereda en toda la cuadra. Hay un atajo por una cortada, pero es medio oscura.', emoji: '🚧',
    choices: [
      { label: 'Tomar el atajo', detail: 'Ahorrás tiempo. Algo de riesgo.', effect: {}, result: 'Salió bien. Por esta vez.', delay: -8 },
      { label: 'Dar toda la vuelta', detail: '+15 minutos, cero riesgo.', effect: {}, result: 'Llegaste más tarde pero tranquilo.', delay: 15 },
    ],
  },
  {
    id: 'vecina', title: 'Doña Rosa intercepta', text: 'La vecina del 2° ve la caja: "¿Eso vendés vos? Traeme uno a mí también, nene."', emoji: '👵',
    choices: [
      { label: 'Anotarle el pedido', detail: '+5 fans, perdés unos minutos charlando.', effect: { fans: 5 }, result: 'Te contó la vida de todo el edificio. Pero ganaste una clienta.', delay: 10 },
      { label: 'Disculparse y seguir', detail: 'El pedido no espera.', effect: {}, result: 'Te miró feo. Va a hablar de vos en la panadería.' },
    ],
  },
  {
    id: 'caja-rota', title: 'La caja llegó golpeada', text: 'Un pozo en Av. Directorio y el paquete pegó un salto. Se ve un poco abollado.', emoji: '📦',
    choices: [
      { label: 'Ofrecer cambio gratis', detail: 'Te cuesta $8.000, salvás la reseña.', cost: 8000, effect: { capital: -8000, fans: 2 }, result: 'El cliente valoró la honestidad.', rating: .5 },
      { label: 'Entregar igual', detail: 'Cruzá los dedos.', effect: {}, result: 'Se dio cuenta. Reseña de 2 estrellas.', rating: -2 },
    ],
  },
  {
    id: 'perro', title: 'Perro suelto', text: 'Un ovejero alemán decidió que tu cadete es su enemigo personal.', emoji: '🐕', delay: 12,
  },
  {
    id: 'trapito', title: 'Te cobran el estacionamiento', text: '"¿Te lo cuido, jefe?" Un trapito exige $3.000 para dejar el vehículo.', emoji: '🅿️',
    choices: [
      { label: 'Pagar $3.000', detail: 'Lo cuidan. Supuestamente.', cost: 3000, effect: { capital: -3000 }, result: 'Ningún problema.' },
      { label: 'Negarse', detail: 'Algo puede pasar...', effect: {}, result: 'Al volver, le habían desinflado una rueda.', delay: 15 },
    ],
  },
]

type StoryDef = { id: string; who: string; emoji: string; title: string; text: string; choices: Choice[]; when: (s: GameState) => boolean }
const c = (label: string, detail: string, effect: Effect, result: string, cost?: number): Choice => ({ label, detail, effect, result, cost })

// Cartas de historia que aparecen de noche (estilo Game Dev Tycoon).
export const STORY: StoryDef[] = [
  {
    id: 'mara', who: 'Mara, mayorista de Once', emoji: '👩‍💼', title: 'Un lote que nadie quiere',
    text: '"Nene, me quedaron cajas de una importación que se cayó. Te las dejo a precio de costo si me pagás hoy. Son veinte unidades, mezcladas. ¿Te animás?"',
    when: s => s.day >= 2 && s.lifetime.delivered >= 3,
    choices: [
      c('Comprar el lote ($70.000)', 'Mercadería surtida de tus rubros, barata.', { capital: -70000, stock: [], relation: ['mara', 2], flag: 'lote-mara' }, 'Mara te guiña un ojo: "Sabía que eras de los que se la juegan".', 70000),
      c('Pasar', 'No es momento de arriesgar.', { relation: ['mara', -1] }, '"Otra vez será", dice. Se nota que esperaba otra cosa.'),
    ],
  },
  {
    id: 'vieja', who: 'Tu vieja', emoji: '👩‍🦳', title: '"¿Y vos cuándo vas a comer?"',
    text: 'Tu vieja entra a la pieza con un táper de milanesas. "Trabajás todo el día, nene. Comé algo. Y sacá esas cajas del pasillo que tu tía se tropezó."',
    when: s => s.day >= 3 && s.level === 0,
    choices: [
      c('Sentarse a comer con ella', 'Recuperás energía y ánimo.', { energy: 100, rep: .05 }, 'Milanesas con puré. Mañana es otro día.'),
      c('Comer parado mientras armás paquetes', 'Seguís laburando: +3 ideas.', { ideas: 3, energy: -10 }, 'Se fue negando con la cabeza. Pero armaste un sistema nuevo de etiquetas.'),
    ],
  },
  {
    id: 'tadeo', who: 'Tadeo, el de la feria', emoji: '🧔', title: 'Un puesto en la feria',
    text: '"Loco, el domingo hay feria en Plaza Irlanda. Tengo un tablón libre. Si querés, lo compartimos y te hacés conocido en el barrio."',
    when: s => s.day >= 4 && s.fans >= 25,
    choices: [
      c('Ir a la feria ($15.000)', '+40 fans y demanda +20% por 2 días.', { capital: -15000, fans: 40, modifier: { label: 'Te conocieron en la feria', demand: 1.2, days: 2 }, relation: ['tadeo', 2] }, 'Vendiste, charlaste y hasta te pidieron una foto con el cartel.', 15000),
      c('Prefiero el online', 'No te movés del despacho.', { relation: ['tadeo', -1] }, 'Tadeo se encoge de hombros. "Vos te lo perdés."'),
    ],
  },
  {
    id: 'inspector', who: 'Inspector municipal', emoji: '🕵️', title: 'Inspección sorpresa',
    text: 'Un tipo con chaleco y carpeta toca la persiana. "Habilitación comercial, matafuegos y libro de quejas. ¿Tiene todo en regla?"',
    when: s => s.level >= 1 && !s.story.flags.includes('habilitado'),
    choices: [
      c('Regularizar todo ($90.000)', 'Pagás la habilitación y quedás tranquilo para siempre.', { capital: -90000, flag: 'habilitado', rep: .1 }, 'Te sellan el papel. Ahora tenés un cuadrito en la pared.', 90000),
      c('"Vuelva la semana que viene"', 'Ganás tiempo... y te labran un acta de $45.000.', { capital: -45000, rep: -.1 }, 'Te deja una multa en el mostrador. Va a volver.'),
    ],
  },
  {
    id: 'lobo', who: 'Esteban Lobo, de Lobo Envíos', emoji: '🐺', title: 'La competencia se presenta',
    text: '"Pibe, te vi crecer. Lobo Envíos maneja medio Palermo. Te ofrezco $400.000 por tu cartera de clientes y te contrato de encargado. Pensalo."',
    when: s => s.level >= 1 && s.lifetime.delivered >= 60,
    choices: [
      c('Vender tus clientes', '+$400.000 pero perdés la mitad de tus fans.', { capital: 400000, flag: 'vendido', relation: ['lobo', 2] }, 'Lobo sonríe como un lobo. Te quedás con la plata y empezar de cero en fans.'),
      c('"Ni en pedo, Esteban"', 'Lobo te declara la guerra: demanda -10% por 3 días, +80 fans por orgullo de barrio.', { fans: 80, modifier: { label: 'Guerra con Lobo Envíos', demand: .9, days: 3 }, relation: ['lobo', -3], flag: 'guerra-lobo' }, 'Te mira fijo. "Nos vemos en la calle." El barrio te banca.'),
    ],
  },
  {
    id: 'abuela', who: 'Abuela Nélida', emoji: '👵', title: 'La lata de galletitas',
    text: 'Tu abuela te llama a Villa Urquiza. Abre una lata de galletitas danesas... adentro hay plata. "Esto lo guardé para vos. No le digas a tu tío."',
    when: s => s.capital < 60000 && s.day >= 3 && !s.loanTaken.includes('abuela'),
    choices: [
      c('Aceptar con un abrazo', '+$120.000. Sin intereses, con mucho amor.', { capital: 120000, flag: 'abuela-ayudo' }, 'Te vas con la plata, un budín y tres consejos que no pediste.'),
      c('"No abu, me arreglo solo"', '+2 ideas por pura dignidad.', { ideas: 2 }, '"Sos igual a tu abuelo", dice. Y te da un budín igual.'),
    ],
  },
  {
    id: 'lucia', who: 'Lucía, referente del barrio', emoji: '👩‍🦱', title: 'El comedor del barrio',
    text: '"El comedor de Pompeya necesita mercadería para el fin de semana. Sé que no es tu negocio, pero si podés dar una mano, el barrio no se olvida."',
    when: s => s.lifetime.delivered >= 25 && s.rubros.includes('almacen'),
    choices: [
      c('Donar mercadería ($50.000)', '+0,2★ de reputación y +60 fans.', { capital: -50000, rep: .2, fans: 60, relation: ['lucia', 3] }, 'El sábado te mandan una foto de los pibes comiendo. Vale más que cualquier balance.', 50000),
      c('Ahora no puedo', 'El negocio primero.', { relation: ['lucia', -1] }, '"Entiendo", dice Lucía. Y entendés que entiende.'),
    ],
  },
  {
    id: 'cadete-renuncia', who: 'Uno de tus cadetes', emoji: '😤', title: '"Quiero un aumento"',
    text: '"Jefe, con la inflación no llego a fin de mes. O me sube el sueldo 20% o me voy con Lobo Envíos."',
    when: s => s.couriers.filter(x => !x.isPlayer).length >= 2,
    choices: [
      c('Darle el aumento', 'Sueldos +20% para ese cadete. Gana energía y lealtad.', { flag: 'aumento' }, 'Te da la mano fuerte. "No se va a arrepentir."'),
      c('"La puerta está abierta"', 'Se va. Te ahorrás el sueldo.', { flag: 'renuncia' }, 'Junta sus cosas y se va sin saludar.'),
    ],
  },
  {
    id: 'tiktok', who: 'Una tiktoker', emoji: '🤳', title: 'Unboxing viral',
    text: 'Una tiktoker de 400 mil seguidores te escribe: "Me encantó el packaging. ¿Me mandás algo para hacer unboxing? Gratis, obvio."',
    when: s => s.research.includes('packaging') && s.fans >= 100,
    choices: [
      c('Mandarle un regalo ($35.000)', '+300 fans y demanda +30% por 2 días.', { capital: -35000, fans: 300, modifier: { label: 'Unboxing viral', demand: 1.3, days: 2 } }, 'El video tiene un millón de vistas. Tu celular no para de sonar.', 35000),
      c('No trabajo con influencers', 'Te ahorrás la plata.', {}, 'Te deja en visto. Bueno.'),
    ],
  },
  {
    id: 'garage', who: 'Don Ruggero', emoji: '👴', title: 'El galpón del tano',
    text: '"Tengo un galpón vacío en Barracas desde que cerré la carpintería. Te lo alquilo barato, pero tenés que limpiarlo vos."',
    when: s => s.level === 1 && s.capital >= 1000000,
    choices: [
      c('Ir a verlo', 'El próximo salto de local te sale 25% menos.', { flag: 'descuento-galpon', relation: ['ruggero', 2] }, '"Vos tenés pinta de laburador", dice. Te convida un café.'),
      c('Por ahora estoy bien', 'Seguís en el local.', {}, '"Cuando quieras, pibe."'),
    ],
  },
  {
    id: 'hackeo', who: 'Tu primo Leo', emoji: '🧑‍💻', title: 'Te hackearon el Instagram',
    text: 'Te llegan mensajes raros: alguien está ofreciendo "iPhones a $50.000" desde tu cuenta. Tu primo Leo dice que lo arregla por un precio.',
    when: s => s.research.includes('instagram') && s.day >= 8,
    choices: [
      c('Pagarle a Leo ($60.000)', 'Recuperás la cuenta en una hora.', { capital: -60000 }, 'Leo cobra y te cambia todas las contraseñas a "Rebusque123". Bueno.', 60000),
      c('Arreglarlo solo', 'Perdés 15% de fans y un día de demanda baja.', { fans: -60, modifier: { label: 'Cuenta hackeada', demand: .8, days: 1 }, rep: -.1 }, 'Tardaste todo el día y algunos clientes no te creyeron.'),
    ],
  },
  {
    id: 'club', who: 'Club de barrio', emoji: '🏅', title: 'Sponsor del equipo de baby fútbol',
    text: 'El club del barrio busca sponsor para las camisetas de la categoría 2015. Tu logo en el pecho de veinte pibes.',
    when: s => s.level >= 1 && s.day >= 10,
    choices: [
      c('Poner el logo ($180.000)', '+150 fans y demanda +10% permanente en tu zona.', { capital: -180000, fans: 150, flag: 'sponsor', modifier: { label: 'Sponsor del club', demand: 1.1, days: 9999 } }, 'Ganaron 7 a 0 el debut. Dicen que es por la camiseta.', 180000),
      c('No da', 'Quizás el año que viene.', {}, 'Los pibes juegan con camisetas lisas. Te sentís un poco culpable.'),
    ],
  },
  {
    id: 'periodista', who: 'Periodista de un diario', emoji: '📰', title: 'Una nota sobre emprendedores',
    text: '"Estamos haciendo una nota sobre jóvenes emprendedores porteños. ¿Nos contás tu historia?"',
    when: s => s.level >= 2,
    choices: [
      c('Dar la entrevista', '+500 fans y +0,1★.', { fans: 500, rep: .1 }, 'Salís en la tapa del suplemento con una foto en la que tenés los ojos cerrados.'),
      c('Prefiero el perfil bajo', '+5 ideas (te concentrás en el negocio).', { ideas: 5 }, 'El que no se muestra no se expone, decía tu abuelo.'),
    ],
  },
  {
    id: 'mara2', who: 'Mara, mayorista de Once', emoji: '👩‍💼', title: 'Exclusividad',
    text: '"Te vengo viendo. Si me comprás a mí en exclusiva, te hago 10% de descuento en todo. Para siempre."',
    when: s => (s.story.relations.mara ?? 0) >= 2 && s.level >= 1,
    choices: [
      c('Trato hecho', 'Todo el stock de Once te sale 10% menos.', { flag: 'mara-exclusiva', relation: ['mara', 2] }, '"Así me gusta". Se dan la mano sobre un rollo de film.'),
      c('Prefiero comparar precios', 'Libertad comercial.', { relation: ['mara', -1] }, '"Cada uno con su negocio", dice. Pero se le nota la bronca.'),
    ],
  },
  {
    id: 'lobo2', who: 'Esteban Lobo', emoji: '🐺', title: 'Lobo está en problemas',
    text: 'Lobo Envíos quebró. Esteban te llama con la voz cortada: "Tengo tres utilitarios y diez cadetes en la calle. ¿Te sirven?"',
    when: s => s.story.flags.includes('guerra-lobo') && s.level >= 2,
    choices: [
      c('Comprarle un utilitario ($1.500.000)', 'Un utilitario a un tercio de precio.', { capital: -1500000, flag: 'kangoo-lobo', relation: ['lobo', 3] }, 'Esteban te da las llaves. "Cuidalo, pibe. Ganaste vos."', 1500000),
      c('"Lo siento, Esteban"', 'Te quedás con sus clientes: +400 fans.', { fans: 400 }, 'Los clientes de Lobo ahora te llaman a vos.'),
    ],
  },
]

export type Goal = { id: string; title: string; desc: string; reward: Effect; rewardText: string; check: (s: GameState) => boolean; progress: (s: GameState) => [number, number] }
const g = (id: string, title: string, desc: string, reward: Effect, rewardText: string, progress: (s: GameState) => [number, number]): Goal => ({ id, title, desc, reward, rewardText, progress, check: s => { const [a, b] = progress(s); return a >= b } })
export const GOALS: Goal[] = [
  g('primer', 'Primer envío', 'Entregá tu primer pedido.', { capital: 15000 }, '$15.000', s => [s.lifetime.delivered, 1]),
  g('diez', 'Ya tenés calle', 'Entregá 10 pedidos.', { capital: 30000, ideas: 2 }, '$30.000 + 2 💡', s => [s.lifetime.delivered, 10]),
  g('cien-fans', 'Cien seguidores', 'Llegá a 100 fans.', { capital: 40000 }, '$40.000', s => [s.fans, 100]),
  g('equipo', 'No estás solo', 'Contratá a tu primer cadete.', { ideas: 3 }, '3 💡', s => [s.couriers.length, 2]),
  g('local', 'Persiana propia', 'Mudate a un local a la calle.', { fans: 60, ideas: 3 }, '60 fans + 3 💡', s => [s.level, 1]),
  g('rubros', 'Diversificar', 'Tené 4 rubros abiertos.', { capital: 80000 }, '$80.000', s => [s.rubros.length, 4]),
  g('cinco-estrellas', 'Excelencia porteña', 'Tené reputación de 4,5★ o más con 20 entregas.', { fans: 120 }, '120 fans', s => [s.lifetime.delivered >= 20 ? Math.round(s.rep * 10) : 0, 45]),
  g('cien', 'Centenario', 'Entregá 100 pedidos.', { capital: 200000, ideas: 6 }, '$200.000 + 6 💡', s => [s.lifetime.delivered, 100]),
  g('millon', 'Primer palo', 'Tené $1.000.000 en caja.', { ideas: 8 }, '8 💡', s => [s.capital, 1000000]),
  g('moto', 'Motorizado', 'Comprá una moto.', { fans: 80 }, '80 fans', s => [s.couriers.some(x => x.vehicle.model === 'moto') || s.garage.some(v => v.model === 'moto') ? 1 : 0, 1]),
  g('racha', 'Racha imparable', 'Hacé una racha de 10 entregas perfectas seguidas.', { capital: 60000, fans: 40 }, '$60.000 + 40 fans', s => [s.lifetime.bestStreak, 10]),
  g('cuadras', 'Mil cuadras', 'Recorré 1.000 cuadras entre todo el equipo.', { ideas: 4 }, '4 💡', s => [s.lifetime.cuadras, 1000]),
  g('mejoras', 'Local equipado', 'Comprá 4 mejoras del local.', { capital: 150000 }, '$150.000', s => [Object.values(s.facility).reduce((a, b) => a + b, 0), 4]),
  g('tuneado', 'Tuneado', 'Ponele 3 mejoras a tus vehículos.', { fans: 60 }, '60 fans', s => [[...s.couriers.map(c => c.vehicle), ...s.garage].reduce((a, v) => a + v.mods.length, 0), 3]),
  g('premium', 'Calidad de exportación', 'Llevá un rubro a Línea premium.', { ideas: 6 }, '6 💡', s => [Math.max(0, ...Object.values(s.quality).map(v => v ?? 0)), 2]),
  g('conurbano', 'Cruzar la General Paz', 'Abrí tu primera zona del conurbano.', { fans: 800 }, '800 fans', s => [s.regions.length, 1]),
  g('galpon', 'Galponero', 'Mudate a un galpón.', { capital: 500000 }, '$500.000', s => [s.level, 2]),
  g('mil-fans', 'Mil fans', 'Llegá a 1.000 fans.', { capital: 300000 }, '$300.000', s => [s.fans, 1000]),
  g('dia-record', 'Día récord', 'Facturá $1.000.000 en un solo día.', { ideas: 10 }, '10 💡', s => [s.lifetime.bestDay, 1000000]),
  g('flota', 'Flota propia', 'Tené 6 cadetes trabajando.', { capital: 400000 }, '$400.000', s => [s.couriers.length, 6]),
  g('quinientos', 'Leyenda del delivery', 'Entregá 500 pedidos.', { capital: 1000000, ideas: 15 }, '$1.000.000 + 15 💡', s => [s.lifetime.delivered, 500]),
  g('centro', 'Centro logístico', 'Llegá al Centro logístico.', { fans: 1000 }, '1.000 fans', s => [s.level, 3]),
  g('diez-mil', 'Fenómeno porteño', 'Llegá a 10.000 fans.', { capital: 3000000 }, '$3.000.000', s => [s.fans, 10000]),
  g('hub', 'Rey de CABA', 'Abrí el Hub Rebusque.', { fans: 5000 }, '5.000 fans', s => [s.level, 4]),
  g('amba', 'Dueño del AMBA', 'Abrí las tres zonas del conurbano.', { capital: 5000000 }, '$5.000.000', s => [s.regions.length, 3]),
]

export const RANKS = ['Pibe del rebusque', 'Emprendedor de barrio', 'Comerciante con calle', 'PyME porteña', 'Rey de la logística', 'Leyenda de CABA']
export const rankOf = (s: GameState) => {
  const score = s.level * 2 + (s.lifetime.delivered >= 30 ? 1 : 0) + (s.lifetime.delivered >= 300 ? 1 : 0) + (s.fans >= 2000 ? 1 : 0)
  return Math.min(RANKS.length - 1, Math.floor(score / 2))
}

export const LOANS = [
  { id: 'amigo', name: 'Préstamo de un amigo', emoji: '🤙', amount: 80000, perDay: 10000, days: 8, desc: 'Te presta Franco. 8 cuotas de $10.000. Sin intereses, pero con cargadas.', once: true },
  { id: 'banco', name: 'Crédito del banco', emoji: '🏦', amount: 600000, perDay: 52000, days: 14, desc: '14 cuotas diarias de $52.000 (≈21% de interés). Necesitás un local.', minLevel: 1 },
  { id: 'prestamista', name: 'El prestamista de la esquina', emoji: '🕶️', amount: 300000, perDay: 65000, days: 7, desc: '7 cuotas de $65.000 (≈52% de interés). No preguntes qué pasa si no pagás.' },
]

export const NEWS_TICKER = [
  'RADIO BARRIO 📻 Se viene la lluvia: lleven paraguas y no dejen la ropa colgada',
  'Cortaron Corrientes por obras… otra vez',
  'El precio del alfajor ya cotiza en bolsa',
  'Vecinos de Caballito piden más bicisendas',
  'El subte B anda con demoras: "problemas técnicos"',
  'Confirmado: la medialuna de la panadería de la esquina sigue siendo la mejor',
  'Encuesta: 9 de cada 10 porteños toman mate en la oficina',
  'Se agotaron las entradas para el clásico en 4 minutos',
  'Récord de pedidos online: "ya nadie sale de casa", dicen los kiosqueros',
  'Un perro se subió al 39 y viajó hasta Barracas. Está bien.',
  'Furor por los emprendimientos de barrio: "comprale al vecino"',
  'Alerta amarilla por tormentas en el AMBA',
  'El dólar abrió estable y el mercado respira',
  'Inauguran una feria de diseño en Palermo Soho',
]


// ---------- mejoras del local ----------
export type FacilityDef = { id: string; name: string; emoji: string; desc: string; levels: { price: number; text: string }[]; minLevel: number }
export const FACILITY: FacilityDef[] = [
  { id: 'estanterias', name: 'Estanterías', emoji: '🗄️', minLevel: 0, desc: 'Más lugar en el depósito sin mudarte.', levels: [{ price: 45000, text: '+25% de depósito' }, { price: 160000, text: '+50% de depósito' }, { price: 600000, text: '+80% de depósito' }] },
  { id: 'embalaje', name: 'Mesa de embalaje', emoji: '📦', minLevel: 0, desc: 'Paquetes prolijos y rápidos: cada entrega tarda menos y llega más linda.', levels: [{ price: 60000, text: '+0,15★ y -1 min por parada' }, { price: 220000, text: '+0,3★ y -2 min por parada, frágiles más seguros' }] },
  { id: 'mostrador', name: 'Mostrador a la calle', emoji: '🏪', minLevel: 1, desc: 'La gente que pasa por la vereda compra lo que tenés en stock, sin delivery.', levels: [{ price: 120000, text: '≈1 venta de mostrador por hora' }, { price: 380000, text: '≈2 ventas por hora' }, { price: 1100000, text: '≈3,5 ventas por hora' }] },
  { id: 'cartel', name: 'Cartel luminoso', emoji: '💡', minLevel: 1, desc: 'Neón en la fachada: te ven desde la esquina.', levels: [{ price: 150000, text: '+7% de pedidos' }, { price: 650000, text: '+15% de pedidos' }] },
  { id: 'vestuario', name: 'Cocina y vestuario', emoji: '☕', minLevel: 1, desc: 'Mate, microondas y una ducha. Los cadetes recuperan energía entre viajes.', levels: [{ price: 90000, text: '+8 de energía por hora en la base' }, { price: 300000, text: '+16 de energía por hora en la base' }] },
  { id: 'alarma', name: 'Cámaras y rastreo GPS', emoji: '📹', minLevel: 1, desc: 'Cámaras en el local y rastreo de toda la flota.', levels: [{ price: 200000, text: '-25% de incidentes en la calle' }, { price: 700000, text: '-45% de incidentes en la calle' }] },
  { id: 'call', name: 'Centro de atención', emoji: '🎧', minLevel: 2, desc: 'Alguien que atiende el teléfono por vos.', levels: [{ price: 500000, text: '+3 pedidos simultáneos y +20% de paciencia' }, { price: 1600000, text: '+6 pedidos simultáneos y +40% de paciencia' }] },
]
export const facilityById = (id: string) => FACILITY.find(f => f.id === id)!

// ---------- mejoras de vehículos ----------
export type VehicleMod = { id: string; name: string; emoji: string; desc: string; priceFactor: number; minPrice: number }
export const VEHICLE_MODS: VehicleMod[] = [
  { id: 'carga', name: 'Canasto / baúl grande', emoji: '🧺', desc: '+40% de carga', priceFactor: .18, minPrice: 18000 },
  { id: 'motor', name: 'Puesta a punto', emoji: '⚙️', desc: '+15% de velocidad', priceFactor: .22, minPrice: 25000 },
  { id: 'candado', name: 'Candado + seguro', emoji: '🔒', desc: '-35% de incidentes', priceFactor: .15, minPrice: 15000 },
  { id: 'ploteo', name: 'Ploteo con tu marca', emoji: '🎨', desc: '+1 fan por entrega (publicidad rodante)', priceFactor: .12, minPrice: 20000 },
]

// ---------- calidad de la línea de productos ----------
export const QUALITY_LEVELS = [
  { name: 'Genérico', price: 0, ideas: 0 },
  { name: 'Marca conocida', price: 80000, ideas: 4 },
  { name: 'Línea premium', price: 300000, ideas: 10 },
  { name: 'Marca propia', price: 1200000, ideas: 22 },
]
// cada nivel: +7% precio de venta, +4% costo, +0,15★ y +5% de pedidos del rubro

export const TRAINING_COST = 25000

// ---------- hora pico ----------
export const rushHour = (minute: number): { mult: number; label: string } => {
  const h = minute / 60
  if (h >= 12 && h < 14.5) return { mult: 1.6, label: 'Hora pico: almuerzo' }
  if (h >= 18 && h < 20.5) return { mult: 1.5, label: 'Hora pico: salida del laburo' }
  if (h < 10) return { mult: .7, label: 'Arranca el día' }
  if (h >= 21) return { mult: .85, label: 'Turno noche' }
  return { mult: 1, label: '' }
}

// ---------- contactos del celular ----------
export const CONTACTS: Record<string, { name: string; emoji: string; status: string }> = {
  franco: { name: 'Franco', emoji: '🧔', status: 'Tu mentor. Local en Almagro.' },
  mama: { name: 'Mamá', emoji: '👩‍🦳', status: 'Hay milanesas en la heladera' },
  mara: { name: 'Mara (Once)', emoji: '👩‍💼', status: 'Mayorista. Te hace precio.' },
  clientes: { name: 'Clientes', emoji: '💬', status: 'Reseñas y mensajes' },
  banco: { name: 'Banco Porteño', emoji: '🏦', status: 'Notificaciones' },
  lobo: { name: 'Esteban Lobo', emoji: '🐺', status: 'Lobo Envíos' },
  barrio: { name: 'Vecinos del barrio', emoji: '🏘️', status: 'Grupo · 248 miembros' },
}
