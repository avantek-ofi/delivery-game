import { useEffect, useRef, useState } from 'react'
import { formatGameTime } from './game/time'
import { clearGame, loadGame, saveGame } from './game/storage'
import { getInitialProducts, randomCategories, type CategoryInfo } from './game/supplier'
import { findMarketplace, marketplaces } from './game/marketplaces'
import { cityZones, findZone } from './game/map'
import { balance } from './game/balance'
import { pickDeliveryEvent, pickMarketEvent } from './game/events'
import { findVehicle, vehicles } from './game/economy'
import type { Category, GameState, Shipment, Offer, Order } from './game/types'

const initialMinutes = 8 * 60

export default function App() {
  const [game, setGame] = useState<GameState | null>(null)
  const [hasSave, setHasSave] = useState(() => Boolean(loadGame()))
  const [storeName, setStoreName] = useState('')
  const [categoryChoices] = useState<CategoryInfo[]>(() => randomCategories())
  const [category, setCategory] = useState<Category>(() => categoryChoices[0].name)
  const [notice, setNotice] = useState('')
  const [openApp, setOpenApp] = useState<'supplier' | 'inventory' | 'listings' | 'offers' | 'orders' | 'map' | 'upgrades' | 'vehicles' | null>(null)
  const [mailOpen, setMailOpen] = useState(true)
  const [mailRead, setMailRead] = useState(false)
  const lastTick = useRef(performance.now())

  useEffect(() => {
    if (!game || game.speed === 0) return
    let frame = 0
    const tick = (now: number) => {
      const deltaSeconds = Math.min((now - lastTick.current) / 1000, 1)
      lastTick.current = now
      setGame(current => {
        if (!current) return null
        const gameMinutes = current.gameMinutes + deltaSeconds * balance.gameMinutesPerRealSecond * current.speed
        const due = current.shipments.filter(shipment => !shipment.received && shipment.arrivesAt <= gameMinutes)
        const finishedOrders = current.orders.filter(order => order.status === 'preparing' && (order.readyAt ?? Infinity) <= gameMinutes)
        const completedDelivery = current.activeDelivery && current.activeDelivery.endsAt <= gameMinutes ? current.activeDelivery : null
        const expiredOffers = current.offers.filter(offer => offer.status === 'pending' && offer.expiresAt <= gameMinutes)
        const canGenerateCustomers = current.listings.length > 0 && gameMinutes - current.lastOfferAt >= Math.max(60, balance.offerIntervalMinutes - current.automation.marketing * 45)
        const canGenerateMarketEvent = !current.marketEvent && gameMinutes - current.lastMarketEventAt >= balance.marketEventIntervalMinutes
        const marketTemplate = canGenerateMarketEvent ? pickMarketEvent() : null
        const generatedMarketEvent = marketTemplate ? { ...marketTemplate, endsAt: gameMinutes + marketTemplate.duration } : null
        const generatedOffers: Offer[] = []
        const directOrders: Order[] = []
        const directReserved: Record<string, number> = {}
        let listingsAfterSales = [...current.listings]
        if (canGenerateCustomers) {
          const batch = Math.min(4, 1 + Math.floor(Math.random() * 3) + current.automation.marketing)
          for (let index = 0; index < batch && listingsAfterSales.length; index++) {
            const listing = listingsAfterSales[Math.floor(Math.random() * listingsAfterSales.length)]
            const quantity = Math.max(1, Math.min(listing.quantity, Math.ceil(Math.random() * 2)))
            const zoneId = cityZones[Math.floor(Math.random() * cityZones.length)].id
            const direct = Math.random() < Math.min(.9, .62 + current.automation.marketing * .08)
            if (direct || current.automation.salesBot > 0) {
              directOrders.push({ id: `direct-${Date.now()}-${index}`, offerId: 'direct', productId: listing.productId, platformId: listing.platformId, quantity, amount: listing.price, zoneId, dueAt: gameMinutes + balance.orderDeadlineMinutes, status: current.automation.autoPacking > 0 ? 'preparing' : 'to_prepare', readyAt: current.automation.autoPacking > 0 ? gameMinutes + balance.preparationMinutes / (1 + current.automation.autoPacking * .35) : undefined })
              directReserved[listing.productId] = (directReserved[listing.productId] ?? 0) + quantity
              listingsAfterSales = listingsAfterSales.flatMap(item => item === listing ? (item.quantity > quantity ? [{ ...item, quantity: item.quantity - quantity }] : []) : [item])
            } else generatedOffers.push({ id: `offer-${Date.now()}-${index}`, productId: listing.productId, platformId: listing.platformId, quantity, amount: Math.round(listing.price * (0.75 + Math.random() * .2) * (current.marketEvent?.multiplier ?? 1)), expiresAt: gameMinutes + balance.offerExpirationMinutes, zoneId, status: 'pending' })
          }
        }
        if (!due.length && !finishedOrders.length && !expiredOffers.length && !generatedOffers.length && !directOrders.length && !completedDelivery && !generatedMarketEvent && !(current.marketEvent && current.marketEvent.endsAt <= gameMinutes)) return { ...current, gameMinutes }
        const inventory = { ...current.inventory }
        due.forEach(shipment => { inventory[shipment.productId] = (inventory[shipment.productId] ?? 0) + shipment.quantity })
        Object.entries(directReserved).forEach(([productId, quantity]) => { inventory[productId] = Math.max(0, (inventory[productId] ?? 0) - quantity) })
        if (due.length) setNotice(`Llegó un envío: ${due.reduce((sum, shipment) => sum + shipment.quantity, 0)} productos ya están en inventario.`)
        if (generatedMarketEvent) setNotice(`Evento del mercado: ${generatedMarketEvent.label}. ${generatedMarketEvent.description}`)
        else if (generatedOffers.length || directOrders.length) setNotice(`Llegaron ${generatedOffers.length + directOrders.length} clientes: ${directOrders.length} compras directas y ${generatedOffers.length} ofertas.`)
        const deliveryOrders = completedDelivery ? current.orders.filter(order => completedDelivery.orderIds.includes(order.id)) : []
        const lostGoods = completedDelivery?.incident === 'goods' || completedDelivery?.incident === 'all'
        const deliveryIncome = lostGoods ? 0 : deliveryOrders.reduce((sum, order) => sum + order.amount * order.quantity * (1 - findMarketplace(order.platformId).commission), 0)
        if (completedDelivery) setNotice(lostGoods ? 'Asalto durante el reparto: perdiste la mercadería y no se liberó el pago.' : `Entrega completada. Cobraste $${Math.round(deliveryIncome).toLocaleString('es-AR')} después de comisiones.`)
        return { ...current, gameMinutes, speed: generatedOffers.length || directOrders.length || completedDelivery ? 1 : current.speed, capital: current.capital + Math.round(deliveryIncome), reputation: current.reputation + (completedDelivery ? (lostGoods ? -1 : deliveryOrders.length) : 0), bicycleAvailable: completedDelivery && (completedDelivery.incident === 'bike' || completedDelivery.incident === 'all') ? false : current.bicycleAvailable, marketEvent: generatedMarketEvent ?? (current.marketEvent && current.marketEvent.endsAt <= gameMinutes ? null : current.marketEvent), lastMarketEventAt: generatedMarketEvent ? gameMinutes : current.lastMarketEventAt, inventory, listings: canGenerateCustomers ? listingsAfterSales : current.listings, lastOfferAt: canGenerateCustomers ? gameMinutes : current.lastOfferAt, activeDelivery: completedDelivery ? null : current.activeDelivery, shipments: current.shipments.map(shipment => due.some(item => item.id === shipment.id) ? { ...shipment, received: true } : shipment), offers: [...current.offers.map(offer => expiredOffers.some(item => item.id === offer.id) ? { ...offer, status: 'expired' as const } : offer), ...generatedOffers], orders: [...current.orders.map(order => completedDelivery?.orderIds.includes(order.id) ? { ...order, status: 'delivered' as const } : finishedOrders.some(item => item.id === order.id) ? { ...order, status: 'ready' as const } : order), ...directOrders] }
      })
      frame = requestAnimationFrame(tick)
    }
    lastTick.current = performance.now()
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [game?.speed])

  useEffect(() => {
    if (!game) return
    const id = window.setTimeout(() => saveGame(game), 350)
    return () => clearTimeout(id)
  }, [game])

  const createGame = () => {
    const cleanName = storeName.trim()
    if (!cleanName) { setNotice('Elegí un nombre para tu tienda antes de continuar.'); return }
    setGame({ storeName: cleanName, category, gameMinutes: initialMinutes, speed: 1, createdAt: new Date().toISOString(), capital: balance.initialCapital, dollarRate: balance.initialDollarRate, shipments: [], inventory: {}, listings: [], offers: [], orders: [], lastOfferAt: initialMinutes, activeDelivery: null, reputation: 0, energy: 100, bicycleAvailable: true, marketEvent: null, lastMarketEventAt: initialMinutes, automation: { salesBot: 0, autoPacking: 0, marketing: 0 }, ownedVehicles: ['bici'], activeVehicleId: 'bici' })
    setHasSave(true)
  }

  if (!game) return <Setup storeName={storeName} setStoreName={setStoreName} category={categoryChoices.some(item => item.name === category) ? category : categoryChoices[0].name} setCategory={setCategory} choices={categoryChoices} notice={notice} onCreate={createGame} hasSave={hasSave} onLoad={() => setGame(loadGame())} />
  const restart = () => { if (window.confirm('¿Reiniciar la partida? Se eliminará el guardado actual.')) { clearGame(); setGame(null); setHasSave(false); setOpenApp(null); setMailOpen(true); setMailRead(false) } }
  return <Office game={game} setGame={setGame} onSave={() => { saveGame(game); setNotice('Partida guardada en este navegador.'); window.setTimeout(() => setNotice(''), 2400) }} notice={notice} openApp={openApp} setOpenApp={setOpenApp} mailOpen={mailOpen} setMailOpen={setMailOpen} mailRead={mailRead} setMailRead={setMailRead} onRestart={restart} />
}

function Setup(props: { storeName: string; setStoreName: (value: string) => void; category: Category; setCategory: (value: Category) => void; choices: CategoryInfo[]; notice: string; onCreate: () => void; hasSave: boolean; onLoad: () => void }) {
  return <main className="setup-shell">
    <section className="setup-card">
      <div className="setup-top"><p className="eyebrow">NUEVA PARTIDA · EDICIÓN BARRIAL</p>{props.hasSave && <button className="load-button" onClick={props.onLoad}>Cargar partida guardada →</button>}</div>
      <h1>Tu negocio<br /><em>empieza hoy.</em></h1>
      <p className="intro">Elegí un rubro, importá con cuidado y convertí una habitación en algo mucho más grande.</p>
      <label className="field"><span>Nombre de la tienda</span><input autoFocus maxLength={28} value={props.storeName} onChange={e => props.setStoreName(e.target.value)} placeholder="Ej. La Esquina Importa" /></label>
      <div className="category-heading"><span>Tu primer rubro</span><small>Podrás ampliar más adelante</small></div>
      <div className="categories">{props.choices.map(item => <button className={`category-card ${props.category === item.name ? 'selected' : ''}`} key={item.name} onClick={() => props.setCategory(item.name)}><i>{item.icon}</i><strong>{item.name}</strong><span>{item.tag}</span><small>{item.description}</small></button>)}</div>
      {props.notice && <p className="warning">{props.notice}</p>}
      <button className="primary" onClick={props.onCreate}>Abrir mi tienda <span>→</span></button>
      <p className="save-note">La partida se guarda en este navegador.</p>
    </section>
  </main>
}

function Office({ game, setGame, onSave, notice, openApp, setOpenApp, mailOpen, setMailOpen, mailRead, setMailRead, onRestart }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onSave: () => void; notice: string; openApp: 'supplier' | 'inventory' | 'listings' | 'offers' | 'orders' | 'map' | 'upgrades' | 'vehicles' | null; setOpenApp: (app: 'supplier' | 'inventory' | 'listings' | 'offers' | 'orders' | 'map' | 'upgrades' | 'vehicles' | null) => void; mailOpen: boolean; setMailOpen: (value: boolean) => void; mailRead: boolean; setMailRead: (value: boolean) => void; onRestart: () => void }) {
  const time = formatGameTime(game.gameMinutes)
  const apps = [
    ['▣', 'Proveedores', 'Abrir importador', 'supplier'], ['▤', 'Inventario', 'Ver mercadería', 'inventory'], ['✉', 'Publicaciones', 'Publicar productos', 'listings'], ['◌', 'Negociaciones', `${game.offers.filter(offer => offer.status === 'pending').length} ofertas pendientes`, 'offers'], ['▧', 'Pedidos', `${game.orders.filter(order => order.status !== 'ready' && order.status !== 'delivered').length} por preparar`, 'orders'], ['⌖', 'Mapa de entregas', game.activeDelivery ? 'Reparto en curso' : 'Planificar ruta', 'map'], ['▰', 'Vehículos', findVehicle(game.activeVehicleId).name, 'vehicles'], ['⚙', 'Mejoras', 'Automatizar procesos', 'upgrades'],
  ]
  const stockUnits = Object.values(game.inventory).reduce((sum, units) => sum + units, 0)
  const inTransit = game.shipments.filter(shipment => !shipment.received).reduce((sum, shipment) => sum + shipment.quantity, 0)
  const attentionFor = (title: string) => title === 'Negociaciones' ? game.offers.filter(offer => offer.status === 'pending').length : title === 'Pedidos' ? game.orders.filter(order => order.status === 'to_prepare' || order.status === 'ready').length : title === 'Mapa de entregas' ? (game.activeDelivery ? 1 : game.orders.filter(order => order.status === 'ready').length) : 0
  return <main className="office-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">↗</span><div><strong>{game.storeName}</strong><small>{game.category} · casa / oficina</small></div></div><div className="top-capital"><small>CAPITAL DISPONIBLE</small><strong>${game.capital.toLocaleString('es-AR')}</strong></div><div className="clock"><span>{time.weekday}, {time.dayOfMonth} de {time.month}</span><strong>{time.clock}</strong><div className="speed-controls"><button className={game.speed === 0 ? 'active' : ''} onClick={() => setGame(g => g && { ...g, speed: 0 })}>Ⅱ</button>{([1, 2, 4] as const).map(speed => <button key={speed} className={game.speed === speed ? 'active' : ''} onClick={() => setGame(g => g && { ...g, speed })}>×{speed}</button>)}</div></div><button className="save-button" onClick={onSave}>Guardar</button><button className="restart-button" onClick={onRestart}>Reiniciar</button></header>
    <section className="dashboard">
      <aside className="dash-nav"><div className="profile-chip"><span>◕</span><div><strong>Tu negocio</strong><small>Nivel 1 · Casa</small></div></div><nav>{apps.map(([icon, title, , app]) => { const attention = attentionFor(title); return <button key={title} className={!app ? 'locked' : ''} disabled={!app} onClick={() => app && setOpenApp(app as 'supplier' | 'inventory' | 'listings' | 'offers' | 'orders' | 'map' | 'upgrades' | 'vehicles')}><i>{icon}</i>{title}{attention > 0 && <b className="nav-badge">{attention}</b>}{!app && <small>Pronto</small>}</button> })}</nav><div className="nav-bottom"><small>REPUTACIÓN</small><strong>★ {game.reputation.toFixed(1)}</strong><span>{game.activeDelivery ? 'En reparto' : 'Negocio activo'}</span></div></aside>
      <section className="dash-content"><div className="dashboard-heading"><div><p className="eyebrow">PANEL GENERAL · DÍA {time.day}</p><h1>Hola, {game.storeName}.</h1><p>Esto es lo que necesita tu negocio hoy.</p></div><button className="mail-action" onClick={() => setMailOpen(true)}>✉ Correo {!mailRead && <b>1</b>}</button></div><div className="metric-grid"><article><small>CAPITAL DISPONIBLE</small><strong className="money">${game.capital.toLocaleString('es-AR')}</strong><span>Para comprar y operar</span></article><article><small>STOCK EN CASA</small><strong>{stockUnits} <em>unid.</em></strong><span>{stockUnits ? 'Listo para publicar' : 'Esperando mercadería'}</span></article><article><small>EN CAMINO</small><strong>{inTransit} <em>unid.</em></strong><span>{inTransit ? 'Seguimiento activo' : 'Sin envíos pendientes'}</span></article><article><small>PUBLICACIONES</small><strong>{game.listings.length}</strong><span>{game.listings.length ? 'Productos en venta' : 'Aún no publicaste'}</span></article></div><section className="next-step"><div><span className="step-number">01</span><div><small>SIGUIENTE PASO</small><h2>{game.offers.some(offer => offer.status === 'pending') ? 'Respondé una oferta' : stockUnits ? 'Publicá tu mercadería' : inTransit ? 'Esperá tu primer envío' : 'Conseguí tu primera mercadería'}</h2><p>{game.offers.some(offer => offer.status === 'pending') ? 'La oferta vence con el tiempo. Podés aceptar, rechazar o contraofertar.' : stockUnits ? 'Definí tus precios y empezá a recibir ofertas.' : inTransit ? 'Podés acelerar el reloj o revisar el detalle del pedido.' : 'Explorá el importador y elegí cantidades según tu capital.'}</p></div></div><button className="primary" onClick={() => setOpenApp(game.offers.some(offer => offer.status === 'pending') ? 'offers' : stockUnits ? 'listings' : 'supplier')}>{game.offers.some(offer => offer.status === 'pending') ? 'Ver oferta' : stockUnits ? 'Publicar productos' : 'Ir a proveedores'} →</button></section><div className="work-grid"><section className="quick-actions"><div className="section-title"><h2>Acciones rápidas</h2><span>Operación</span></div><div className="action-cards">{apps.slice(0, 5).map(([icon, title, text, app]) => <button key={title} onClick={() => setOpenApp(app as 'supplier' | 'inventory' | 'listings' | 'offers' | 'orders')}><i>{icon}</i><div><strong>{title}</strong><small>{text}</small></div><b>→</b></button>)}</div></section><section className="activity"><div className="section-title"><h2>Actividad reciente</h2><span>En vivo</span></div><article><i className="activity-dot"></i><div><strong>{game.offers.some(offer => offer.status === 'pending') ? 'Nueva oferta recibida' : inTransit ? 'Importación en camino' : stockUnits ? 'Mercadería recibida' : 'Tu cuenta está lista'}</strong><small>{game.offers.some(offer => offer.status === 'pending') ? 'Respondé antes de que venza.' : inTransit ? `${inTransit} unidades pendientes de recepción.` : stockUnits ? 'Revisá inventario y publicá tus productos.' : 'El correo tiene una recomendación para empezar.'}</small></div></article></section></div></section>
      {mailOpen && <aside className="mail dashboard-mail"><div className="mail-head"><span>✉</span><strong>Correo</strong><small>{mailRead ? 'leído' : '1 nuevo'}</small><button onClick={() => setMailOpen(false)}>×</button></div><article><p className="from">De: Bienvenida a la plataforma</p><h3>Tu tienda ya tiene un lugar.</h3><p>Tu primer paso es conseguir mercadería. Elegí bien: el precio bajo a veces sale caro.</p><button onClick={() => { setMailRead(true); setMailOpen(false) }}>Entendido</button></article></aside>}
    </section>
    {openApp === 'supplier' && <SupplierWindow game={game} setGame={setGame} onClose={() => setOpenApp(null)} />}
    {openApp === 'inventory' && <InventoryWindow game={game} onClose={() => setOpenApp(null)} />}
    {openApp === 'listings' && <ListingsWindow game={game} setGame={setGame} onClose={() => setOpenApp(null)} />}
    {openApp === 'offers' && <OffersWindow game={game} setGame={setGame} onClose={() => setOpenApp(null)} />}
    {openApp === 'orders' && <OrdersWindow game={game} setGame={setGame} onClose={() => setOpenApp(null)} />}
    {openApp === 'map' && <MapWindow game={game} setGame={setGame} onClose={() => setOpenApp(null)} />}
    {openApp === 'upgrades' && <UpgradesWindow game={game} setGame={setGame} onClose={() => setOpenApp(null)} />}
    {openApp === 'vehicles' && <VehiclesWindow game={game} setGame={setGame} onClose={() => setOpenApp(null)} />}
    <footer className="statusbar"><span><i className="live-dot"></i> TIEMPO DE JUEGO {game.speed === 0 ? 'PAUSADO' : `×${game.speed}`}</span><span>{notice || 'Guardado automático activo'}</span><span>1 s = 20 min de juego</span></footer>
  </main>
}

function SupplierWindow({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const products = getInitialProducts(game.category)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [error, setError] = useState('')
  const total = products.reduce((sum, product) => sum + (quantities[product.id] ?? 0) * product.priceUsd * game.dollarRate * (1 + product.importFee), 0)
  const units = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0)
  const purchase = () => {
    if (!units) { setError('Elegí al menos una unidad para tu primer pedido.'); return }
    if (total > game.capital) { setError('Ese pedido supera tu capital disponible.'); return }
    const arrivesAt = game.gameMinutes + balance.firstImportArrivalMinutes
    const shipments: Shipment[] = products.filter(product => quantities[product.id]).map(product => ({ id: `${product.id}-${Date.now()}`, productId: product.id, quantity: quantities[product.id] ?? 0, arrivesAt, received: false }))
    setGame(current => current && { ...current, capital: Math.round(current.capital - total), shipments: [...current.shipments, ...shipments] })
    onClose()
  }
  return <div className="modal-backdrop"><section className="supplier-window"><header><div><small>IMPORTADOR INTERNACIONAL</small><h2>Dragón de Bolsillo</h2></div><button onClick={onClose}>×</button></header><div className="supplier-info"><span>★ 3.8 · 124 reseñas</span><span>USD 1 = ${game.dollarRate.toLocaleString('es-AR')}</span><span>Primer envío: llega en ~90 min</span></div><p className="supplier-copy">Precios atractivos, reputación intermedia. Revisá los costos de importación antes de confirmar.</p><div className="product-list">{products.map(product => { const quantity = quantities[product.id] ?? 0; const landed = Math.round(product.priceUsd * game.dollarRate * (1 + product.importFee)); return <article className="product-row" key={product.id}><div className="product-pixel">{product.name.slice(0, 1)}</div><div><strong>{product.name}</strong><small>{product.description}</small></div><div className="price"><strong>US$ {product.priceUsd}</strong><small>+ {Math.round(product.importFee * 100)}% importación</small><b>${landed.toLocaleString('es-AR')} c/u</b></div><div className="quantity"><button onClick={() => setQuantities(current => ({ ...current, [product.id]: Math.max(0, quantity - 1) }))}>−</button><b>{quantity}</b><button onClick={() => setQuantities(current => ({ ...current, [product.id]: quantity + 1 }))}>+</button></div></article>})}</div>{error && <p className="purchase-error">{error}</p>}<footer><div><small>CAPITAL DISPONIBLE</small><strong>${game.capital.toLocaleString('es-AR')}</strong></div><div><small>PEDIDO · {units} unidades</small><strong>${Math.round(total).toLocaleString('es-AR')}</strong></div><button className="primary" onClick={purchase}>Confirmar importación →</button></footer></section></div>
}

function InventoryWindow({ game, onClose }: { game: GameState; onClose: () => void }) {
  const products = getInitialProducts(game.category)
  const incoming = game.shipments.filter(shipment => !shipment.received)
  return <div className="modal-backdrop"><section className="supplier-window inventory-window"><header><div><small>CASA / OFICINA</small><h2>Inventario</h2></div><button onClick={onClose}>×</button></header><div className="inventory-summary"><span><b>{Object.values(game.inventory).reduce((sum, units) => sum + units, 0)}</b> unidades disponibles</span><span><b>{incoming.reduce((sum, shipment) => sum + shipment.quantity, 0)}</b> en camino</span></div><div className="product-list">{products.map(product => <article className="product-row" key={product.id}><div className="product-pixel">{product.name.slice(0, 1)}</div><div><strong>{product.name}</strong><small>{product.description}</small></div><div className="stock-count"><small>EN CASA</small><strong>{game.inventory[product.id] ?? 0} u.</strong></div><div className="stock-count"><small>PUBLICADAS</small><strong>{game.listings.some(listing => listing.productId === product.id) ? 'Sí' : 'No'}</strong></div></article>)}</div></section></div>
}

function ListingsWindow({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const products = getInitialProducts(game.category).filter(product => (game.inventory[product.id] ?? 0) > 0)
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? '')
  const [platformId, setPlatformId] = useState(marketplaces[0].id)
  const selected = products.find(product => product.id === selectedId)
  const [price, setPrice] = useState(selected?.suggestedPrice ?? 0)
  const [quantity, setQuantity] = useState(1)
  const [tab, setTab] = useState<'create' | 'active'>('create')
  const [message, setMessage] = useState(products.length ? '' : 'Todavía no tenés mercadería disponible para publicar.')
  const platform = findMarketplace(platformId)
  const otherReserved = game.listings.filter(listing => !(listing.productId === selectedId && listing.platformId === platformId)).filter(listing => listing.productId === selectedId).reduce((sum, listing) => sum + listing.quantity, 0)
  const available = Math.max(0, (game.inventory[selectedId] ?? 0) - otherReserved)
  useEffect(() => {
    const product = products.find(item => item.id === selectedId)
    const existing = game.listings.find(listing => listing.productId === selectedId && listing.platformId === platformId)
    if (product) setPrice(existing?.price ?? product.suggestedPrice)
    setQuantity(existing?.quantity ?? Math.min(1, Math.max(0, (game.inventory[selectedId] ?? 0) - game.listings.filter(listing => listing.productId === selectedId && listing.platformId !== platformId).reduce((sum, listing) => sum + listing.quantity, 0))))
  }, [selectedId, platformId])
  const publish = () => {
    if (!selected || price <= 0 || quantity < 1 || quantity > available) { setMessage('Revisá la cantidad disponible y el precio antes de publicar.'); return }
    setGame(current => current && { ...current, listings: [...current.listings.filter(listing => !(listing.productId === selected.id && listing.platformId === platformId)), { productId: selected.id, price: Math.round(price), quantity, platformId }] })
    setMessage(`${quantity} unidad${quantity === 1 ? '' : 'es'} de ${selected.name} publicada${quantity === 1 ? '' : 's'} en ${platform.name}.`)
  }
  const payout = Math.round(price * (1 - platform.commission))
  return <div className="modal-backdrop"><section className="supplier-window listing-window"><header><div><small>PLATAFORMA DE VENTAS</small><h2>Publicaciones</h2></div><button onClick={onClose}>×</button></header><div className="listing-tabs"><button className={tab === 'create' ? 'active' : ''} onClick={() => setTab('create')}>Crear publicación</button><button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>Mis publicaciones <b>{game.listings.length}</b></button></div>{tab === 'create' ? <><p className="supplier-copy">Elegí dónde vender: cada plataforma cobra una comisión al concretar una venta.</p>{products.length > 0 && <><div className="platform-picker"><small>1 · ELEGÍ UNA PLATAFORMA</small><div>{marketplaces.map(item => <button className={platformId === item.id ? 'selected' : ''} key={item.id} onClick={() => setPlatformId(item.id)}><strong>{item.name}</strong><span>{item.audience}</span><b>{Math.round(item.commission * 100)}% comisión</b><small>{item.note}</small></button>)}</div></div><div className="listing-form improved"><label>2 · Producto<select value={selectedId} onChange={event => setSelectedId(event.target.value)}>{products.map(product => <option key={product.id} value={product.id}>{product.name} · {game.inventory[product.id]} en casa</option>)}</select></label><label>3 · Unidades a publicar<input type="number" min="0" max={available} value={quantity} onChange={event => setQuantity(Math.min(available, Math.max(0, Number(event.target.value))))} /><small>{available} disponibles; el resto queda guardado</small></label><label>4 · Tu precio<input type="number" min="1" value={price} onChange={event => setPrice(Number(event.target.value))} /><small>Sugerido: ${selected?.suggestedPrice.toLocaleString('es-AR')}</small></label><div className="payout"><small>COBRÁS POR VENTA</small><strong>${payout.toLocaleString('es-AR')}</strong><span>Luego de {Math.round(platform.commission * 100)}% de comisión</span></div><button className="primary" disabled={!available} onClick={publish}>Publicar {quantity} unid. →</button></div></>}</> : <div className="published-list tab-list">{game.listings.length ? game.listings.map((listing, index) => { const product = getInitialProducts(game.category).find(item => item.id === listing.productId); const itemPlatform = findMarketplace(listing.platformId); return <p key={`${listing.productId}-${listing.platformId}-${index}`}><b>● {product?.name} <small>en {itemPlatform.name}</small></b><span>{listing.quantity} u. · ${listing.price.toLocaleString('es-AR')} · comisión {Math.round(itemPlatform.commission * 100)}%</span></p> }) : <div className="empty-state"><strong>No hay productos publicados.</strong><span>Creá una publicación para empezar a recibir ofertas.</span></div>}</div>}{message && <p className="listing-message">{message}</p>}</section></div>
}

function OffersWindow({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const offers = game.offers.filter(offer => offer.status === 'pending')
  const [counter, setCounter] = useState<Record<string, number>>({})
  const [result, setResult] = useState('')
  const accept = (offer: Offer, amount = offer.amount) => {
    const listing = game.listings.find(item => item.productId === offer.productId && item.platformId === offer.platformId)
    if (!listing) return
    const order: Order = { id: `order-${Date.now()}`, offerId: offer.id, productId: offer.productId, platformId: offer.platformId, quantity: offer.quantity, amount, zoneId: offer.zoneId, dueAt: game.gameMinutes + balance.orderDeadlineMinutes, status: 'to_prepare' }
    setGame(current => {
      if (!current || (current.inventory[offer.productId] ?? 0) < offer.quantity) return current
      return { ...current, inventory: { ...current.inventory, [offer.productId]: (current.inventory[offer.productId] ?? 0) - offer.quantity }, offers: current.offers.map(item => item.id === offer.id ? { ...item, status: 'accepted' } : item), listings: current.listings.flatMap(item => item.productId === offer.productId && item.platformId === offer.platformId ? (item.quantity === offer.quantity ? [] : [{ ...item, quantity: item.quantity - offer.quantity }]) : [item]), orders: [...current.orders, order] }
    })
  }
  const counterOffer = (offer: Offer) => {
    const value = counter[offer.id] ?? offer.amount
    const listing = game.listings.find(item => item.productId === offer.productId && item.platformId === offer.platformId)
    if (!listing) return
    const accepted = value <= offer.amount && Math.random() < .8
    if (accepted) { accept(offer, value); setResult('El cliente aceptó tu contraoferta. Ya tenés un pedido para preparar.') }
    else { setGame(current => current && ({ ...current, offers: current.offers.map(item => item.id === offer.id ? { ...item, status: 'rejected' } : item) })); setResult(value > offer.amount ? 'El cliente rechazó una contraoferta más cara que su oferta inicial.' : 'El cliente no aceptó la contraoferta.' ) }
  }
  return <div className="modal-backdrop"><section className="supplier-window offers-window"><header><div><small>BANDEJA DE NEGOCIACIONES</small><h2>Ofertas de compradores</h2></div><button onClick={onClose}>×</button></header><p className="supplier-copy">Las ofertas vencen en seis horas de juego. Aceptá, rechazá o probá una contraoferta. Un precio mayor a la oferta del cliente puede hacer que se vaya.</p>{offers.length ? <div className="offer-list">{offers.map(offer => { const product = getInitialProducts(game.category).find(item => item.id === offer.productId); const listing = game.listings.find(item => item.productId === offer.productId && item.platformId === offer.platformId); const platform = findMarketplace(offer.platformId); const zone = findZone(offer.zoneId); return <article key={offer.id}><div className="buyer-avatar">C</div><div className="offer-main"><small>CLIENTE NUEVO · {platform.name} · {zone.name}</small><strong>Quiere {offer.quantity} u. de {product?.name}</strong><span>Publicado a ${listing?.price.toLocaleString('es-AR')} · ofrece <b>${offer.amount.toLocaleString('es-AR')}</b> por unidad</span></div><div className="offer-actions"><button className="accept" onClick={() => { accept(offer); setResult('Oferta aceptada: el pedido quedó pendiente de preparación.') }}>Aceptar</button><button onClick={() => { setGame(current => current && ({ ...current, offers: current.offers.map(item => item.id === offer.id ? { ...item, status: 'rejected' } : item) })); setResult('Oferta rechazada.') }}>Rechazar</button><div><input type="number" max={offer.amount} value={counter[offer.id] ?? ''} placeholder={`Máx. ${offer.amount}`} onChange={event => setCounter(current => ({ ...current, [offer.id]: Number(event.target.value) }))} /><button onClick={() => counterOffer(offer)}>Enviar</button></div></div></article> })}</div> : <div className="empty-state"><strong>No hay ofertas pendientes.</strong><span>Publicá productos y dejá pasar tiempo de juego para recibir compradores.</span></div>}{result && <p className="listing-message">{result}</p>}</section></div>
}

function OrdersWindow({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const orders = game.orders
  const startPreparing = (order: Order) => setGame(current => current && ({ ...current, orders: current.orders.map(item => item.id === order.id ? { ...item, status: 'preparing', readyAt: current.gameMinutes + balance.preparationMinutes } : item) }))
  return <div className="modal-backdrop"><section className="supplier-window orders-window"><header><div><small>OPERACIÓN</small><h2>Pedidos</h2></div><button onClick={onClose}>×</button></header><p className="supplier-copy">Prepará los pedidos antes de poder cargarlos en la bicicleta. La entrega se agregará en la siguiente etapa.</p>{orders.length ? <div className="order-list">{orders.map(order => { const product = getInitialProducts(game.category).find(item => item.id === order.productId); return <article key={order.id}><div className="product-pixel">{product?.name.slice(0, 1)}</div><div><small>ENTREGAR ANTES DEL DÍA {Math.floor(order.dueAt / 1440) + 1}</small><strong>{order.quantity} u. de {product?.name}</strong><span>Pago retenido: ${order.amount.toLocaleString('es-AR')} por unidad</span></div><div className={`order-status ${order.status}`}>{order.status === 'to_prepare' ? 'Por preparar' : order.status === 'preparing' ? 'Empaquetando…' : 'Listo para entregar'}</div>{order.status === 'to_prepare' && <button className="primary" onClick={() => startPreparing(order)}>Preparar →</button>}</article> })}</div> : <div className="empty-state"><strong>No hay pedidos todavía.</strong><span>Las ofertas aceptadas se convertirán en pedidos para preparar.</span></div>}</section></div>
}

function MapWindow({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const ready = game.orders.filter(order => order.status === 'ready')
  const vehicle = findVehicle(game.activeVehicleId)
  const [route, setRoute] = useState<string[]>([])
  const plannedOrders = route.map(id => ready.find(order => order.id === id)).filter((order): order is Order => Boolean(order))
  const baseMinutes = Math.max(balance.bikeMinimumRouteMinutes / vehicle.speed, plannedOrders.reduce((sum, order) => sum + findZone(order.zoneId).distance * balance.bikeMinutesPerBlock / vehicle.speed, 0))
  const start = () => {
    if (!plannedOrders.length || (!game.bicycleAvailable && vehicle.id === 'bici')) return
    const event = pickDeliveryEvent()
    const totalMinutes = baseMinutes * (event?.timeMultiplier ?? 1)
    const highestRisk = plannedOrders.reduce((highest, order) => Math.max(highest, balance.deliveryRisk[findZone(order.zoneId).risk]), 0) * (event?.riskMultiplier ?? 1)
    const roll = Math.random()
    const incident = roll >= highestRisk ? 'none' : roll < highestRisk * .15 ? 'all' : roll < highestRisk * .35 ? 'bike' : 'goods'
    setGame(current => current && ({ ...current, energy: Math.max(0, current.energy - Math.ceil(totalMinutes / 20)), activeDelivery: { orderIds: plannedOrders.map(order => order.id), route: [...plannedOrders.map(order => order.zoneId), 'home'], startsAt: current.gameMinutes, endsAt: current.gameMinutes + totalMinutes, incident, event: event ? { id: event.id, label: event.label, description: event.description, tone: event.tone } : null }, orders: current.orders.map(order => plannedOrders.some(item => item.id === order.id) ? { ...order, status: 'delivering' } : order) }))
  }
  const delivery = game.activeDelivery
  const totalMinutes = delivery ? delivery.endsAt - delivery.startsAt : baseMinutes
  const progress = delivery ? Math.min(1, Math.max(0, (game.gameMinutes - delivery.startsAt) / (delivery.endsAt - delivery.startsAt))) : 0
  const routeIds = delivery ? ['home', ...delivery.route] : ['home', ...plannedOrders.map(order => order.zoneId)]
  const coord = (id: string) => id === 'home' ? { x: 23, y: 71 } : findZone(id)
  const points = routeIds.map(id => coord(id))
  const path = points.map(point => `${point.x},${point.y}`).join(' ')
  const bikePoint = () => {
    const segment = Math.min(points.length - 2, Math.floor(progress * Math.max(1, points.length - 1)))
    const local = progress * Math.max(1, points.length - 1) - segment
    const from = points[segment] ?? points[0]
    const to = points[segment + 1] ?? from
    return { x: from.x + (to.x - from.x) * local, y: from.y + (to.y - from.y) * local }
  }
  const bike = bikePoint()
  return <div className="modal-backdrop"><section className="supplier-window map-window"><header><div><small>LOGÍSTICA PERSONAL · {vehicle.name.toUpperCase()}</small><h2>Ruta de entregas</h2></div><button onClick={onClose}>×</button></header><div className="map-layout"><section className="city-map"><div className="map-label">CABA · MAPA OPERATIVO</div><div className="river">RÍO DE LA PLATA</div><div className="map-landmark obelisk">▲<small>Obelisco</small></div><svg className="city-roads" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M5 82 L28 62 L45 50 L74 32" /><path d="M12 18 L40 42 L72 74 L92 86" /><path d="M18 55 L49 49 L92 45" /><path d="M39 5 L42 94" /></svg>{points.length > 1 && <svg className="route-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={path} /></svg>}<span className="home-pin">⌂<small>Casa / negocio</small></span>{cityZones.map(zone => <button key={zone.id} className={`zone-pin ${routeIds.includes(zone.id) ? 'on-route' : ''}`} style={{ left: `${zone.x}%`, top: `${zone.y}%`, '--zone': zone.color } as React.CSSProperties}><i></i><strong>{zone.name}</strong><small>{zone.risk} riesgo</small></button>)}{delivery && <span className="bike pixel-bike" style={{ left: `${bike.x}%`, top: `${bike.y}%` }}><i></i><b></b></span>}</section><aside className="route-panel">{delivery ? <><span className="delivery-live">● REPARTO EN CURSO</span><h3>{vehicle.name} en ruta</h3><p>Avance: {Math.round(progress * 100)}% · La ruta incluye el regreso a casa.</p><div className="delivery-progress"><i style={{ width: `${progress * 100}%` }}></i></div><div className="route-stops">{delivery.route.map((zoneId, index) => <span key={`${zoneId}-${index}`}><b>{index + 1}</b>{zoneId === 'home' ? 'Regreso a casa' : findZone(zoneId).name}</span>)}</div><small>Al terminar se libera el pago, menos la comisión de la plataforma.</small></> : <><p className="route-intro">Elegí hasta {vehicle.capacity} pedidos; {vehicle.name} tiene capacidad para {vehicle.capacity} paquetes.</p><div className="capacity"><span>PAQUETES CARGADOS</span><strong>{route.length} / {vehicle.capacity} · energía {game.energy}%</strong></div>{ready.length ? <div className="route-orders">{ready.map(order => { const product = getInitialProducts(game.category).find(item => item.id === order.productId); const position = route.indexOf(order.id); return <button key={order.id} className={position >= 0 ? 'selected' : ''} onClick={() => setRoute(current => position >= 0 ? current.filter(id => id !== order.id) : current.length < vehicle.capacity ? [...current, order.id] : current)}><b>{position >= 0 ? `${position + 1}°` : '+'}</b><span>{product?.name}<small>{findZone(order.zoneId).name} · {order.quantity} u.</small></span></button>})}</div> : <div className="empty-state"><strong>No hay pedidos listos.</strong><span>Negociá una oferta y prepará el pedido primero.</span></div>}<div className="route-summary"><span>Ida y vuelta estimada</span><strong>{plannedOrders.reduce((sum, order) => sum + findZone(order.zoneId).distance, 0)} cuadras</strong><span>Tiempo: {Math.round(totalMinutes)} min. de juego</span></div><button className="primary" disabled={!route.length || (!game.bicycleAvailable && vehicle.id === 'bici')} onClick={start}>Salir a repartir →</button></>}</aside></div></section></div>
}

function UpgradesWindow({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const upgrades = [{ id: 'salesBot' as const, icon: '▣', name: 'Bot de ventas', text: 'Convierte consultas en compras directas.', base: 85000 }, { id: 'autoPacking' as const, icon: '▧', name: 'Mesa automática', text: 'Prepara los pedidos apenas ingresan.', base: 120000 }, { id: 'marketing' as const, icon: '★', name: 'Impulso publicitario', text: 'Atrae más clientes con mayor frecuencia.', base: 70000 }]
  const buy = (id: keyof GameState['automation'], base: number) => setGame(current => { if (!current) return null; const level = current.automation[id]; const cost = Math.round(base * (1 + level * .8)); return level >= 3 || current.capital < cost ? current : { ...current, capital: current.capital - cost, automation: { ...current.automation, [id]: level + 1 } } })
  return <div className="modal-backdrop"><section className="supplier-window upgrades-window"><header><div><small>TECNOLOGÍA DEL NEGOCIO</small><h2>Mejoras y automatización</h2></div><button onClick={onClose}>×</button></header><p className="supplier-copy">Invertí para atender varias compras sin ejecutar cada tarea manualmente.</p><div className="upgrade-grid">{upgrades.map(upgrade => { const level = game.automation[upgrade.id]; const cost = Math.round(upgrade.base * (1 + level * .8)); return <article key={upgrade.id}><i>{upgrade.icon}</i><div><small>NIVEL {level} / 3</small><h3>{upgrade.name}</h3><p>{upgrade.text}</p><div className="level-dots">{[1,2,3].map(item => <b className={item <= level ? 'active' : ''} key={item}></b>)}</div></div><button disabled={level >= 3 || game.capital < cost} onClick={() => buy(upgrade.id, upgrade.base)}>{level >= 3 ? 'Máximo' : `$${cost.toLocaleString('es-AR')}`}</button></article>})}</div></section></div>
}

function VehiclesWindow({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const buy = (id: string, price: number) => setGame(current => !current || current.ownedVehicles.includes(id) || current.capital < price ? current : { ...current, capital: current.capital - price, ownedVehicles: [...current.ownedVehicles, id], activeVehicleId: id })
  return <div className="modal-backdrop"><section className="supplier-window upgrades-window"><header><div><small>FLOTA Y MANTENIMIENTO</small><h2>Vehículos</h2></div><button onClick={onClose}>×</button></header><p className="supplier-copy">Cada vehículo aumenta capacidad y velocidad. Podés seleccionar cualquiera que ya tengas.</p><div className="upgrade-grid">{vehicles.map(vehicle => { const owned = game.ownedVehicles.includes(vehicle.id); const active = game.activeVehicleId === vehicle.id; return <article key={vehicle.id}><i>{vehicle.id === 'bici' || vehicle.id === 'bici-pro' ? '♧' : vehicle.id === 'moto' ? '◉' : '▰'}</i><div><small>{active ? 'VEHÍCULO ACTIVO' : owned ? 'EN GARAJE' : 'DISPONIBLE PARA COMPRA'}</small><h3>{vehicle.name}</h3><p>{vehicle.capacity} paquetes · velocidad ×{vehicle.speed} · mantenimiento ${vehicle.maintenance.toLocaleString('es-AR')}</p></div><button onClick={() => owned ? setGame(current => current && { ...current, activeVehicleId: vehicle.id }) : buy(vehicle.id, vehicle.price)} disabled={!owned && game.capital < vehicle.price}>{active ? 'Activo' : owned ? 'Usar' : `$${vehicle.price.toLocaleString('es-AR')}`}</button></article> })}</div></section></div>
}
