import { useEffect, useRef, useState } from 'react'
import { formatGameTime } from './time'
import { clearGame, loadGame, saveGame } from './storage'
import { getInitialProducts, getSupplierSelection, randomCategories, type CategoryInfo } from './supplier'
import { findMarketplace, marketplaces } from './marketplaces'
import { cityZones, findZone } from './map'
import { balance } from './balance'
import { pickDeliveryEvent, pickMarketEvent } from './events'
import { findVehicle, vehicles } from './economy'
import type { Category, GameState, Shipment, Offer, Order } from './types'
import { IntroScene } from '../scenes/IntroScene'
import { DesktopIcon } from '../desktop/DesktopIcon'
import { Taskbar } from '../desktop/Taskbar'
import { NotificationSystem } from '../desktop/NotificationSystem'
import { DesktopWidgets } from '../desktop/DesktopWidgets'
import { useRetroWindowDrag } from '../desktop/useRetroWindowDrag'
import { ProductSprite } from '../ui/ProductSprite'
import { AccessibilityControls } from '../desktop/AccessibilityControls'

const initialMinutes = 8 * 60

export default function Game() {
  useRetroWindowDrag()
  const [game, setGame] = useState<GameState | null>(null)
  const [hasSave, setHasSave] = useState(() => Boolean(loadGame()))
  const [storeName, setStoreName] = useState('')
  const [categoryChoices] = useState<CategoryInfo[]>(() => randomCategories())
  const [category, setCategory] = useState<Category>(() => categoryChoices[0].name)
  const [notice, setNotice] = useState('')
  const [openApp, setOpenApp] = useState<'supplier' | 'inventory' | 'listings' | 'offers' | 'orders' | 'map' | 'upgrades' | 'vehicles' | 'facility' | 'finance' | null>(null)
  const [mailOpen, setMailOpen] = useState(false)
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
              directOrders.push({ id: `direct-${Date.now()}-${index}`, offerId: 'direct', productId: listing.productId, platformId: listing.platformId, quantity, amount: listing.price, zoneId, dueAt: gameMinutes + balance.orderDeadlineMinutes, status: current.automation.autoPacking > 0 ? 'preparing' : 'to_prepare', readyAt: current.automation.autoPacking > 0 ? gameMinutes + balance.preparationMinutes / (1 + current.automation.autoPacking * .35 + current.facility.packing * .2) : undefined })
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

  useEffect(() => {
    if (!notice) return
    const id = window.setTimeout(() => setNotice(''), 3600)
    return () => window.clearTimeout(id)
  }, [notice])

  useEffect(() => {
    if (!game?.activeDeliveries.length) return
    const finished = game.activeDeliveries.filter(delivery => delivery.endsAt <= game.gameMinutes)
    if (!finished.length) return
    setGame(current => {
      if (!current) return null
      const completedIds = new Set(finished.flatMap(delivery => delivery.orderIds))
      const income = finished.reduce((total, delivery) => {
        const lostGoods = delivery.incident === 'goods' || delivery.incident === 'all'
        if (lostGoods) return total
        return total + current.orders.filter(order => delivery.orderIds.includes(order.id)).reduce((sum, order) => sum + order.amount * order.quantity * (1 - findMarketplace(order.platformId).commission), 0)
      }, 0)
      const deliveredCount = finished.reduce((sum, delivery) => sum + delivery.orderIds.length, 0)
      const lostCount = finished.filter(delivery => delivery.incident === 'goods' || delivery.incident === 'all').length
      const bikeLost = finished.some(delivery => (delivery.vehicleId ?? 'bici') === 'bici' && (delivery.incident === 'bike' || delivery.incident === 'all'))
      setNotice(lostCount ? `${finished.length} reparto(s) terminaron; ${lostCount} tuvieron incidentes.` : `${finished.length} reparto(s) completados. Cobraste $${Math.round(income).toLocaleString('es-AR')}.`)
      return { ...current, capital: current.capital + Math.round(income), reputation: current.reputation + deliveredCount - lostCount, bicycleAvailable: bikeLost ? false : current.bicycleAvailable, orderStats: { completed: current.orderStats.completed + deliveredCount, revenue: current.orderStats.revenue + Math.round(income), incidents: current.orderStats.incidents + lostCount }, activeDeliveries: current.activeDeliveries.filter(delivery => !finished.some(done => done.startsAt === delivery.startsAt && done.vehicleId === delivery.vehicleId)), orders: current.orders.map(order => completedIds.has(order.id) ? { ...order, status: 'delivered' as const, completedAt: current.gameMinutes } : order) }
    })
  }, [game?.gameMinutes, game?.activeDeliveries.length])

  useEffect(() => {
    if (!game) return
    const month = 30 * 24 * 60
    const expiredHistory = game.orders.some(order => order.status === 'delivered' && game.gameMinutes - (order.completedAt ?? order.dueAt) >= month)
    if (!expiredHistory) return
    setGame(current => current && ({ ...current, orders: current.orders.filter(order => order.status !== 'delivered' || current.gameMinutes - (order.completedAt ?? order.dueAt) < month) }))
  }, [game?.gameMinutes, game?.orders.length])

  const createGame = () => {
    const cleanName = storeName.trim()
    if (!cleanName) { setNotice('Elegí un nombre para tu tienda antes de continuar.'); return }
    setGame({ storeName: cleanName, category, gameMinutes: initialMinutes, speed: 1, createdAt: new Date().toISOString(), capital: balance.initialCapital, dollarRate: balance.initialDollarRate, shipments: [], inventory: {}, listings: [], offers: [], orders: [], orderStats: { completed: 0, revenue: 0, incidents: 0 }, lastOfferAt: initialMinutes, activeDelivery: null, activeDeliveries: [], reputation: 0, energy: 100, bicycleAvailable: true, marketEvent: null, lastMarketEventAt: initialMinutes, automation: { salesBot: 0, autoPacking: 0, marketing: 0 }, facility: { level: 0, storage: 0, packing: 0, dispatch: 0 }, ownedVehicles: ['bici'], activeVehicleId: 'bici' })
    setHasSave(true)
    setNotice('TENÉS 1 CORREO NUEVO')
  }

  if (!game) return <Setup storeName={storeName} setStoreName={setStoreName} category={categoryChoices.some(item => item.name === category) ? category : categoryChoices[0].name} setCategory={setCategory} choices={categoryChoices} notice={notice} onCreate={createGame} hasSave={hasSave} onLoad={() => setGame(loadGame())} />
  const restart = () => { if (window.confirm('¿Reiniciar la partida? Se eliminará el guardado actual.')) { clearGame(); setGame(null); setHasSave(false); setOpenApp(null); setMailOpen(false); setMailRead(false) } }
  return <Office game={game} setGame={setGame} onSave={() => { saveGame(game); setNotice('Partida guardada en este navegador.'); window.setTimeout(() => setNotice(''), 2400) }} notice={notice} openApp={openApp} setOpenApp={setOpenApp} mailOpen={mailOpen} setMailOpen={setMailOpen} mailRead={mailRead} setMailRead={setMailRead} onRestart={restart} />
}

function Setup(props: { storeName: string; setStoreName: (value: string) => void; category: Category; setCategory: (value: Category) => void; choices: CategoryInfo[]; notice: string; onCreate: () => void; hasSave: boolean; onLoad: () => void }) {
  return <IntroScene><main className="new-game-shell"><section className="new-game-window"><header><span>NUEVA PARTIDA.EXE</span><span>_ X</span></header><div className="new-game-content"><p className="command">C:\\USERS\\VOS&gt; iniciar_emprendimiento</p><h1>Tu tienda arranca hoy.</h1><p>Elegí un rubro y convertí tus ahorros en un negocio real.</p><label className="field"><span>NOMBRE DE LA TIENDA</span><input autoFocus maxLength={28} value={props.storeName} onChange={e => props.setStoreName(e.target.value)} placeholder="Ej. La Esquina Importa" /></label><div className="category-heading"><span>PRIMER RUBRO</span><small>podés ampliar más adelante</small></div><div className="categories">{props.choices.map(item => <button className={`category-card ${props.category === item.name ? 'selected' : ''}`} key={item.name} onClick={() => props.setCategory(item.name)}><i>{item.icon}</i><strong>{item.name}</strong><small>{item.tag}</small></button>)}</div>{props.notice && <p className="warning">{props.notice}</p>}<button className="pixel-button" onClick={props.onCreate}>CREAR TIENDA</button>{props.hasSave && <button className="load-link" onClick={props.onLoad}>Cargar partida guardada</button>}</div></section></main></IntroScene>
}

function Office({ game, setGame, onSave, notice, openApp, setOpenApp, mailOpen, setMailOpen, mailRead, setMailRead, onRestart }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onSave: () => void; notice: string; openApp: 'supplier' | 'inventory' | 'listings' | 'offers' | 'orders' | 'map' | 'upgrades' | 'vehicles' | 'facility' | 'finance' | null; setOpenApp: (app: 'supplier' | 'inventory' | 'listings' | 'offers' | 'orders' | 'map' | 'upgrades' | 'vehicles' | 'facility' | 'finance' | null) => void; mailOpen: boolean; setMailOpen: (value: boolean) => void; mailRead: boolean; setMailRead: (value: boolean) => void; onRestart: () => void }) {
  const pendingOffers = game.offers.filter(offer => offer.status === 'pending').length
  const pendingOrders = game.orders.filter(order => order.status === 'to_prepare' || order.status === 'ready').length
  const deliveriesReady = game.activeDeliveries.length || game.orders.filter(order => order.status === 'ready').length
  const apps: Array<[string, string, () => void, number?]> = [
    ['M', 'Correo', () => setMailOpen(true), mailRead ? 0 : 1],
    ['O', 'Importar', () => setOpenApp('supplier')],
    ['I', 'Inventario', () => setOpenApp('inventory')],
    ['T', 'Publicar', () => setOpenApp('listings')],
    ['N', 'Negociar', () => setOpenApp('offers'), pendingOffers],
    ['P', 'Pedidos', () => setOpenApp('orders'), pendingOrders],
    ['E', 'Despacho', () => setOpenApp('map'), deliveriesReady],
    ['B', 'Base', () => setOpenApp('facility')],
    ['$', 'Finanzas', () => setOpenApp('finance')],
    ['V', 'Flota', () => setOpenApp('vehicles')],
    ['+', 'Mejoras', () => setOpenApp('upgrades')]
  ]
  return <main className="computer-scene">
    <header className="computer-top"><span>CENTRO OPERATIVO v0.2</span><span>{game.storeName.toUpperCase()} · BUENOS AIRES</span></header>
    <section className="computer-wallpaper">
      <div className="desktop-icons">{apps.map(([icon, label, action, alert]) => <DesktopIcon key={label} icon={icon} label={label} alert={alert} onClick={action} />)}</div>
      <p className="desktop-guide">FLUJO: IMPORTAR → PUBLICAR → NEGOCIAR → PREPARAR → DESPACHAR</p>
      <DesktopWidgets game={game} />
      <AccessibilityControls />
    </section>
    <Taskbar game={game} setSpeed={speed => setGame(current => current && { ...current, speed })} />
    {mailOpen && <div className="modal-backdrop pixel-modal"><section className="desktop-window"><header><span>CORREO.EXE</span><button onClick={() => setMailOpen(false)}>X</button></header><div className="mail-layout"><aside><b>ENTRADA {!mailRead && <em>1</em>}</b><span>ImportaYa</span></aside><article><small>DE: importa@importaya.cn</small><h2>Queres empezar a vender?</h2><p>Tenemos productos mayoristas en cantidades chicas para que puedas probar sin quemar todos tus ahorros.</p><button className="pixel-button" onClick={() => { setMailRead(true); setMailOpen(false); setOpenApp('supplier') }}>VER CATALOGO</button></article></div></section></div>}
    {openApp === 'supplier' && <SupplierWindow game={game} setGame={setGame} onClose={() => setOpenApp(null)} />}
    {openApp === 'inventory' && <InventoryWindow game={game} onClose={() => setOpenApp(null)} />}
    {openApp === 'listings' && <PublishingDesk game={game} setGame={setGame} onClose={() => setOpenApp(null)} />}
    {openApp === 'offers' && <NegotiationDesk game={game} setGame={setGame} onClose={() => setOpenApp(null)} />}
    {openApp === 'orders' && <OrderCenter game={game} setGame={setGame} onClose={() => setOpenApp(null)} />}
    {openApp === 'map' && <DispatchWindow game={game} setGame={setGame} onClose={() => setOpenApp(null)} />}
    {openApp === 'facility' && <FacilityWindow game={game} setGame={setGame} onClose={() => setOpenApp(null)} />}
    {openApp === 'finance' && <FinanceDesk game={game} onClose={() => setOpenApp(null)} />}
    {openApp === 'upgrades' && <UpgradesWindow game={game} setGame={setGame} onClose={() => setOpenApp(null)} />}
    {openApp === 'vehicles' && <VehiclesWindow game={game} setGame={setGame} onClose={() => setOpenApp(null)} />}
    <NotificationSystem message={notice} />
    <div className="save-controls"><button onClick={onSave}>GUARDAR</button><button onClick={onRestart}>REINICIAR</button></div>
  </main>
}

function SupplierWindow({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const [products] = useState(() => getSupplierSelection(game.category))
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [error, setError] = useState('')
  const total = products.reduce((sum, product) => sum + (quantities[product.id] ?? 0) * product.priceUsd * game.dollarRate * (1 + product.importFee), 0)
  const units = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0)
  const storageCapacity = 10 + game.facility.level * 8 + game.facility.storage * 12
  const occupiedStorage = Object.values(game.inventory).reduce((sum, quantity) => sum + quantity, 0) + game.shipments.filter(shipment => !shipment.received).reduce((sum, shipment) => sum + shipment.quantity, 0)
  const purchase = () => {
    if (!units) { setError('Elegí al menos una unidad para tu primer pedido.'); return }
    if (total > game.capital) { setError('Ese pedido supera tu capital disponible.'); return }
    if (occupiedStorage + units > storageCapacity) { setError(`No entra todo en la base: ${occupiedStorage} de ${storageCapacity} espacios ocupados.`); return }
    const arrivesAt = game.gameMinutes + balance.firstImportArrivalMinutes
    const shipments: Shipment[] = products.filter(product => quantities[product.id]).map(product => ({ id: `${product.id}-${Date.now()}`, productId: product.id, quantity: quantities[product.id] ?? 0, arrivesAt, received: false }))
    setGame(current => current && { ...current, capital: Math.round(current.capital - total), shipments: [...current.shipments, ...shipments] })
    onClose()
  }
  return <div className="modal-backdrop"><section className="supplier-window"><header><div><small>IMPORTADOR INTERNACIONAL</small><h2>Dragón de Bolsillo</h2></div><button onClick={onClose}>×</button></header><div className="supplier-info"><span>★ 3.8 · 124 reseñas</span><span>USD 1 = ${game.dollarRate.toLocaleString('es-AR')}</span><span>Primer envío: llega en ~90 min</span></div><p className="supplier-copy">Precios atractivos, reputación intermedia. Revisá los costos de importación antes de confirmar.</p><div className="product-list">{products.map(product => { const quantity = quantities[product.id] ?? 0; const landed = Math.round(product.priceUsd * game.dollarRate * (1 + product.importFee)); return <article className="product-row" key={product.id}><ProductSprite productId={product.id} label={product.name} /><div><strong>{product.name}</strong><small>{product.description}</small></div><div className="price"><strong>US$ {product.priceUsd}</strong><small>+ {Math.round(product.importFee * 100)}% importación</small><b>${landed.toLocaleString('es-AR')} c/u</b></div><div className="quantity"><button onClick={() => setQuantities(current => ({ ...current, [product.id]: Math.max(0, quantity - 1) }))}>−</button><b>{quantity}</b><button onClick={() => setQuantities(current => ({ ...current, [product.id]: quantity + 1 }))}>+</button></div></article>})}</div>{error && <p className="purchase-error">{error}</p>}<footer><div><small>CAPITAL DISPONIBLE</small><strong>${game.capital.toLocaleString('es-AR')}</strong></div><div><small>PEDIDO · {units} unidades</small><strong>${Math.round(total).toLocaleString('es-AR')}</strong></div><button className="primary" onClick={purchase}>Confirmar importación →</button></footer></section></div>
}

function InventoryWindow({ game, onClose }: { game: GameState; onClose: () => void }) {
  const products = getInitialProducts(game.category).filter(product => (game.inventory[product.id] ?? 0) > 0)
  const incoming = game.shipments.filter(shipment => !shipment.received)
  return <div className="modal-backdrop"><section className="supplier-window inventory-window"><header><div><small>CASA / OFICINA</small><h2>Inventario</h2></div><button onClick={onClose}>×</button></header><div className="inventory-summary"><span><b>{Object.values(game.inventory).reduce((sum, units) => sum + units, 0)}</b> unidades disponibles</span><span><b>{incoming.reduce((sum, shipment) => sum + shipment.quantity, 0)}</b> en camino</span></div>{products.length ? <div className="product-list">{products.map(product => <article className="product-row" key={product.id}><ProductSprite productId={product.id} label={product.name} /><div><strong>{product.name}</strong><small>{product.description}</small></div><div className="stock-count"><small>EN CASA</small><strong>{game.inventory[product.id] ?? 0} u.</strong></div><div className="stock-count"><small>PUBLICADAS</small><strong>{game.listings.some(listing => listing.productId === product.id) ? 'Sí' : 'No'}</strong></div></article>)}</div> : <div className="empty-state"><strong>El estante está vacío.</strong><span>Comprá mercadería en el navegador y esperá el envío.</span></div>}</section></div>
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

function PublishingDesk({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const products = getInitialProducts(game.category).filter(product => (game.inventory[product.id] ?? 0) > 0)
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? '')
  const [platformId, setPlatformId] = useState(marketplaces[0].id)
  const [price, setPrice] = useState(products[0]?.suggestedPrice ?? 0)
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState('')
  const selected = products.find(product => product.id === selectedId)
  const platform = findMarketplace(platformId)
  const reservedElsewhere = game.listings.filter(listing => listing.productId === selectedId && listing.platformId !== platformId).reduce((sum, listing) => sum + listing.quantity, 0)
  const available = Math.max(0, (game.inventory[selectedId] ?? 0) - reservedElsewhere)
  const currentListing = game.listings.find(listing => listing.productId === selectedId && listing.platformId === platformId)
  const suggested = selected?.suggestedPrice ?? 0
  const takeHome = Math.round(price * (1 - platform.commission))

  useEffect(() => {
    const product = products.find(item => item.id === selectedId)
    const existing = game.listings.find(listing => listing.productId === selectedId && listing.platformId === platformId)
    if (product) setPrice(existing?.price ?? product.suggestedPrice)
    setQuantity(Math.max(1, Math.min(existing?.quantity ?? 1, Math.max(1, (game.inventory[selectedId] ?? 0) - game.listings.filter(listing => listing.productId === selectedId && listing.platformId !== platformId).reduce((sum, listing) => sum + listing.quantity, 0)))))
  }, [selectedId, platformId])

  const publish = () => {
    if (!selected || available < 1 || quantity < 1 || quantity > available || price < 1) { setMessage('Revisa stock, cantidad y precio antes de publicar.'); return }
    setGame(current => current && ({ ...current, listings: [...current.listings.filter(listing => !(listing.productId === selected.id && listing.platformId === platformId)), { productId: selected.id, platformId, quantity, price: Math.round(price) }] }))
    setMessage(`Publicacion lista: ${quantity} u. de ${selected.name} en ${platform.name}.`)
  }

  return <div className="modal-backdrop"><section className="supplier-window publishing-desk">
    <header><div><small>VENTAS · PASO A PASO</small><h2>Crear publicacion</h2></div><button onClick={onClose}>X</button></header>
    {!products.length ? <div className="empty-state publish-empty"><strong>No hay stock para publicar.</strong><span>Importa mercaderia y espera a que llegue al inventario.</span></div> : <>
      <div className="publish-step"><b>1</b><div><strong>Elegí el producto</strong><small>Solo se muestran unidades que estan en tu inventario.</small></div></div>
      <div className="publish-product-grid">{products.map(product => <button className={product.id === selectedId ? 'selected' : ''} key={product.id} onClick={() => setSelectedId(product.id)}><ProductSprite productId={product.id} label={product.name} /><span><strong>{product.name}</strong><small>{game.inventory[product.id]} en casa</small></span></button>)}</div>
      <div className="publish-step"><b>2</b><div><strong>Elegí el canal</strong><small>La comision se descuenta al entregar el pedido.</small></div></div>
      <div className="publish-platform-grid">{marketplaces.map(item => <button className={platformId === item.id ? 'selected' : ''} key={item.id} onClick={() => setPlatformId(item.id)}><strong>{item.name}</strong><span>{item.audience}</span><small>{Math.round(item.commission * 100)}% comision · {item.note}</small></button>)}</div>
      <section className="publish-controls">
        <div className="quantity-control"><span>CANTIDAD DISPONIBLE <b>{available} u.</b></span><div><button onClick={() => setQuantity(value => Math.max(1, value - 1))}>−</button><strong>{quantity}</strong><button onClick={() => setQuantity(value => Math.min(available, value + 1))}>+</button></div></div>
        <label className="price-control"><span>TU PRECIO POR UNIDAD</span><input type="number" min="1" value={price} onChange={event => setPrice(Math.max(1, Number(event.target.value)))} /><div><button onClick={() => setPrice(Math.round(suggested * .9))}>-10%</button><button className="suggested" onClick={() => setPrice(suggested)}>USAR SUGERIDO ${suggested.toLocaleString('es-AR')}</button><button onClick={() => setPrice(Math.round(suggested * 1.1))}>+10%</button></div></label>
        <div className="publish-income"><small>VAS A COBRAR</small><strong>${takeHome.toLocaleString('es-AR')}</strong><span>por venta · luego de {Math.round(platform.commission * 100)}% de comision</span></div>
        <button className="primary publish-button" disabled={available < 1} onClick={publish}>{currentListing ? 'ACTUALIZAR PUBLICACION' : 'PUBLICAR AHORA'} →</button>
      </section>
      <div className="published-inline"><b>{game.listings.length} publicaciones activas</b><span>{currentListing ? `Editando la publicacion actual de ${selected?.name}.` : 'Tu stock no publicado sigue en inventario.'}</span></div>
    </>}
    {message && <p className="listing-message">{message}</p>}
  </section></div>
}

function NegotiationDesk({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const offers = game.offers.filter(offer => offer.status === 'pending')
  const [selectedId, setSelectedId] = useState(offers[0]?.id ?? '')
  const [counter, setCounter] = useState(0)
  const [result, setResult] = useState('')
  const offer = offers.find(item => item.id === selectedId) ?? offers[0]
  useEffect(() => { if (!offers.some(item => item.id === selectedId)) setSelectedId(offers[0]?.id ?? '') }, [offers.length, selectedId])
  useEffect(() => { if (offer) setCounter(offer.amount) }, [offer?.id])
  const buyerFor = (id: string) => ['Camila R.', 'Nico P.', 'Sofia M.', 'Tomi G.', 'Vale S.', 'Juan D.'][[...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 6]
  const accept = (amount: number) => {
    if (!offer) return
    const listing = game.listings.find(item => item.productId === offer.productId && item.platformId === offer.platformId)
    if (!listing) { setResult('Esta publicación ya no tiene stock disponible.'); return }
    const order: Order = { id: `order-${Date.now()}`, offerId: offer.id, productId: offer.productId, platformId: offer.platformId, quantity: offer.quantity, amount: Math.round(amount), zoneId: offer.zoneId, dueAt: game.gameMinutes + balance.orderDeadlineMinutes, status: 'to_prepare' }
    setGame(current => {
      if (!current || (current.inventory[offer.productId] ?? 0) < offer.quantity) return current
      return { ...current, inventory: { ...current.inventory, [offer.productId]: (current.inventory[offer.productId] ?? 0) - offer.quantity }, offers: current.offers.map(item => item.id === offer.id ? { ...item, status: 'accepted' } : item), listings: current.listings.flatMap(item => item.productId === offer.productId && item.platformId === offer.platformId ? (item.quantity <= offer.quantity ? [] : [{ ...item, quantity: item.quantity - offer.quantity }]) : [item]), orders: [...current.orders, order] }
    })
    setResult(`Pedido confirmado para ${buyerFor(offer.id)}. Ahora preparalo desde Pedidos.`)
  }
  const negotiate = () => {
    if (!offer) return
    const threshold = offer.amount * 1.08
    if (counter <= threshold && Math.random() < (counter <= offer.amount ? .9 : .66)) { accept(counter); return }
    setGame(current => current && ({ ...current, offers: current.offers.map(item => item.id === offer.id ? { ...item, status: 'rejected' } : item) }))
    setResult(`${buyerFor(offer.id)} no aceptó la contraoferta.`)
  }
  const reject = () => { if (!offer) return; setGame(current => current && ({ ...current, offers: current.offers.map(item => item.id === offer.id ? { ...item, status: 'rejected' } : item) })); setResult('Oferta archivada. Tu publicación sigue activa.') }
  if (!offer) return <div className="modal-backdrop"><section className="supplier-window negotiation-desk"><header><div><small>MENSAJES DE COMPRADORES</small><h2>Negociaciones</h2></div><button onClick={onClose}>X</button></header><div className="empty-state negotiation-empty"><strong>Tu bandeja está al día.</strong><span>Las ofertas aparecen cuando tus publicaciones atraen compradores.</span></div>{result && <p className="listing-message">{result}</p>}</section></div>
  const product = getInitialProducts(game.category).find(item => item.id === offer.productId)
  const listing = game.listings.find(item => item.productId === offer.productId && item.platformId === offer.platformId)
  const platform = findMarketplace(offer.platformId)
  const zone = findZone(offer.zoneId)
  const diff = listing ? Math.round((offer.amount / listing.price - 1) * 100) : 0
  const net = Math.round(counter * (1 - platform.commission))
  return <div className="modal-backdrop"><section className="supplier-window negotiation-desk">
    <header><div><small>MENSAJES DE COMPRADORES · {offers.length} ABIERTAS</small><h2>Negociaciones</h2></div><button onClick={onClose}>X</button></header>
    <div className="negotiation-layout"><aside className="offer-inbox"><div><b>BANDEJA</b><span>{offers.length} ofertas</span></div>{offers.map(item => { const itemProduct = getInitialProducts(game.category).find(product => product.id === item.productId); return <button className={item.id === offer.id ? 'selected' : ''} key={item.id} onClick={() => setSelectedId(item.id)}><i>{buyerFor(item.id).slice(0, 1)}</i><span><strong>{buyerFor(item.id)}</strong><small>{itemProduct?.name} · {findZone(item.zoneId).name}</small></span><b>${item.amount.toLocaleString('es-AR')}</b></button> })}</aside>
      <section className="offer-detail"><div className="buyer-banner"><i>{buyerFor(offer.id).slice(0, 1)}</i><div><small>COMPRADOR EN {zone.name.toUpperCase()}</small><h3>{buyerFor(offer.id)}</h3><span>Quiere {offer.quantity} u. de {product?.name}</span></div><b>{platform.name}</b></div><div className="offer-product"><ProductSprite productId={offer.productId} label={product?.name} /><div><strong>{product?.name}</strong><small>{product?.description}</small><span>Entrega estimada en {zone.name} · riesgo {zone.risk}</span></div></div><div className="offer-metrics"><article><small>PUBLICADO</small><strong>${listing?.price.toLocaleString('es-AR')}</strong></article><article className={diff < 0 ? 'warning' : 'good'}><small>OFERTA</small><strong>${offer.amount.toLocaleString('es-AR')}</strong><span>{diff >= 0 ? '+' : ''}{diff}%</span></article><article><small>NETO SI ACEPTAS</small><strong>${Math.round(offer.amount * (1 - platform.commission)).toLocaleString('es-AR')}</strong></article></div><section className="offer-decision"><div><small>CONTRAOFERTA POR UNIDAD</small><input type="number" min="1" value={counter} onChange={event => setCounter(Math.max(1, Number(event.target.value)))} /><span>Recibis ${net.toLocaleString('es-AR')} luego de {Math.round(platform.commission * 100)}% de comisión.</span></div><button className="accept" onClick={() => accept(offer.amount)}>ACEPTAR ${offer.amount.toLocaleString('es-AR')}</button><button className="counter" onClick={negotiate}>ENVIAR CONTRAOFERTA</button><button className="reject" onClick={reject}>RECHAZAR</button></section></section></div>{result && <p className="listing-message">{result}</p>}
  </section></div>
}

function OrderCenter({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const [tab, setTab] = useState<'active' | 'history'>('active')
  const active = game.orders.filter(order => order.status !== 'delivered')
  const history = game.orders.filter(order => order.status === 'delivered').sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0))
  const prepare = (order: Order) => setGame(current => current && ({ ...current, orders: current.orders.map(item => item.id === order.id ? { ...item, status: 'preparing', readyAt: current.gameMinutes + balance.preparationMinutes / (1 + current.facility.packing * .2) } : item) }))
  const label = (status: Order['status']) => status === 'to_prepare' ? 'Por preparar' : status === 'preparing' ? 'Empaquetando' : status === 'ready' ? 'Listo para despacho' : status === 'delivering' ? 'En reparto' : 'Entregado'
  const shown = tab === 'active' ? active : history
  return <div className="modal-backdrop"><section className="supplier-window order-center"><header><div><small>OPERACION Y TRAZABILIDAD</small><h2>Pedidos</h2></div><button onClick={onClose}>X</button></header><section className="order-dashboard"><article><small>ACTIVOS</small><strong>{active.length}</strong><span>requieren seguimiento</span></article><article><small>COMPLETADOS</small><strong>{game.orderStats.completed}</strong><span>acumulados</span></article><article><small>COBRADO</small><strong>${game.orderStats.revenue.toLocaleString('es-AR')}</strong><span>luego de comisiones</span></article><article><small>INCIDENTES</small><strong>{game.orderStats.incidents}</strong><span>acumulados</span></article></section><div className="order-tabs"><button className={tab === 'active' ? 'active' : ''} onClick={() => setTab('active')}>Pedidos activos <b>{active.length}</b></button><button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Historial mensual <b>{history.length}</b></button></div><p className="order-note">{tab === 'active' ? 'Los pedidos listos siguen acá hasta que los asignes a una ruta desde Despacho.' : 'Las entregas se conservan durante 30 días de juego; después queda solo su impacto en las estadísticas.'}</p>{shown.length ? <div className="order-board">{shown.map(order => { const product = getInitialProducts(game.category).find(item => item.id === order.productId); const zone = findZone(order.zoneId); return <article key={order.id}><ProductSprite productId={order.productId} label={product?.name} /><div><small>{zone.name.toUpperCase()} · ${order.amount.toLocaleString('es-AR')} c/u</small><strong>{order.quantity} u. de {product?.name}</strong><span>{tab === 'history' ? `Entregado día ${Math.floor((order.completedAt ?? order.dueAt) / 1440) + 1}` : `Vence día ${Math.floor(order.dueAt / 1440) + 1}`}</span></div><b className={`order-chip ${order.status}`}>{label(order.status)}</b>{order.status === 'to_prepare' && <button className="primary" onClick={() => prepare(order)}>PREPARAR</button>}</article> })}</div> : <div className="empty-state order-empty"><strong>{tab === 'active' ? 'No hay pedidos activos.' : 'Todavía no hay entregas en el historial.'}</strong><span>{tab === 'active' ? 'Aceptá una oferta o espera una compra directa.' : 'Las entregas realizadas aparecerán acá durante un mes de juego.'}</span></div>}</section></div>
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
  const startPreparing = (order: Order) => setGame(current => current && ({ ...current, orders: current.orders.map(item => item.id === order.id ? { ...item, status: 'preparing', readyAt: current.gameMinutes + balance.preparationMinutes / (1 + current.facility.packing * .2) } : item) }))
  return <div className="modal-backdrop"><section className="supplier-window orders-window"><header><div><small>OPERACIÓN</small><h2>Pedidos</h2></div><button onClick={onClose}>×</button></header><p className="supplier-copy">Prepará los pedidos antes de poder cargarlos en la bicicleta. La entrega se agregará en la siguiente etapa.</p>{orders.length ? <div className="order-list">{orders.map(order => { const product = getInitialProducts(game.category).find(item => item.id === order.productId); return <article key={order.id}><ProductSprite productId={order.productId} label={product?.name} /><div><small>ENTREGAR ANTES DEL DÍA {Math.floor(order.dueAt / 1440) + 1}</small><strong>{order.quantity} u. de {product?.name}</strong><span>Pago retenido: ${order.amount.toLocaleString('es-AR')} por unidad</span></div><div className={`order-status ${order.status}`}>{order.status === 'to_prepare' ? 'Por preparar' : order.status === 'preparing' ? 'Empaquetando…' : 'Listo para entregar'}</div>{order.status === 'to_prepare' && <button className="primary" onClick={() => startPreparing(order)}>Preparar →</button>}</article> })}</div> : <div className="empty-state"><strong>No hay pedidos todavía.</strong><span>Las ofertas aceptadas se convertirán en pedidos para preparar.</span></div>}</section></div>
}

function DispatchWindow({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const ready = game.orders.filter(order => order.status === 'ready')
  const busyIds = new Set(game.activeDeliveries.map(delivery => delivery.vehicleId ?? 'bici'))
  const idleIds = game.ownedVehicles.filter(id => !busyIds.has(id) && (id !== 'bici' || game.bicycleAvailable))
  const [vehicleId, setVehicleId] = useState(idleIds[0] ?? game.activeVehicleId)
  const [route, setRoute] = useState<string[]>([])
  const vehicle = findVehicle(vehicleId)
  const planned = route.map(id => ready.find(order => order.id === id)).filter((order): order is Order => Boolean(order))
  const stops = ['home', ...planned.map(order => order.zoneId), 'home']
  const distance = stops.slice(1).reduce((sum, stop, index) => {
    const from = stops[index] === 'home' ? { x: 24, y: 55 } : findZone(stops[index])
    const to = stop === 'home' ? { x: 24, y: 55 } : findZone(stop)
    return sum + Math.hypot(to.x - from.x, to.y - from.y)
  }, 0)
  const minutes = Math.max(balance.bikeMinimumRouteMinutes / vehicle.speed, distance * balance.bikeMinutesPerBlock / vehicle.speed)
  useEffect(() => { if (!idleIds.includes(vehicleId)) { setVehicleId(idleIds[0] ?? game.activeVehicleId); setRoute([]) } }, [game.activeDeliveries.length, game.ownedVehicles.join(','), vehicleId])
  const positionFor = (delivery: NonNullable<GameState['activeDelivery']>) => {
    const progress = Math.min(1, Math.max(0, (game.gameMinutes - delivery.startsAt) / (delivery.endsAt - delivery.startsAt)))
    const coords = ['home', ...delivery.route].map(id => id === 'home' ? { x: 24, y: 55 } : findZone(id))
    const segment = Math.min(coords.length - 2, Math.floor(progress * Math.max(1, coords.length - 1)))
    const part = progress * Math.max(1, coords.length - 1) - segment
    const from = coords[segment] ?? coords[0]
    const to = coords[segment + 1] ?? from
    return { x: from.x + (to.x - from.x) * part, y: from.y + (to.y - from.y) * part, progress }
  }
  const launch = () => {
    if (!planned.length || !idleIds.includes(vehicleId)) return
    const event = pickDeliveryEvent()
    const totalMinutes = minutes * (event?.timeMultiplier ?? 1)
    const risk = planned.reduce((highest, order) => Math.max(highest, balance.deliveryRisk[findZone(order.zoneId).risk]), 0) * (event?.riskMultiplier ?? 1) * (1 - game.facility.dispatch * .08)
    const roll = Math.random()
    const incident = roll >= risk ? 'none' : roll < risk * .15 ? 'all' : roll < risk * .35 ? 'bike' : 'goods'
    setGame(current => current && ({ ...current, energy: Math.max(0, current.energy - Math.ceil(totalMinutes / (20 + current.facility.dispatch * 5))), activeDeliveries: [...current.activeDeliveries, { vehicleId, orderIds: planned.map(order => order.id), route: [...planned.map(order => order.zoneId), 'home'], startsAt: current.gameMinutes, endsAt: current.gameMinutes + totalMinutes, incident, event: event ? { id: event.id, label: event.label, description: event.description, tone: event.tone } : null }], orders: current.orders.map(order => planned.some(item => item.id === order.id) ? { ...order, status: 'delivering' } : order) }))
    setRoute([])
  }
  const activeZones = new Set(game.activeDeliveries.flatMap(delivery => delivery.route))
  return <div className="modal-backdrop"><section className="supplier-window map-window dispatch-window">
    <header><div><small>DESPACHO · {game.activeDeliveries.length} RUTAS ACTIVAS</small><h2>Central de entregas</h2></div><button onClick={onClose}>X</button></header>
    <div className="dispatch-layout"><section className="city-map dispatch-map"><div className="map-label">CABA · TABLERO DE RUTAS</div><div className="river">RIO DE LA PLATA</div><span className="home-pin">BASE<small>Centro operativo</small></span>{cityZones.map(zone => <span key={zone.id} className={`zone-pin ${activeZones.has(zone.id) || planned.some(order => order.zoneId === zone.id) ? 'on-route' : ''}`} style={{ left: `${zone.x}%`, top: `${zone.y}%`, '--zone': zone.color } as React.CSSProperties}><i></i><strong>{zone.name}</strong></span>)}{game.activeDeliveries.map((delivery, index) => { const point = positionFor(delivery); return <span className={`dispatch-bike bike pixel-bike bike-${index % 4}`} key={`${delivery.vehicleId}-${delivery.startsAt}`} style={{ left: `${point.x}%`, top: `${point.y}%` }} title={`${findVehicle(delivery.vehicleId ?? 'bici').name}: ${Math.round(point.progress * 100)}%`}></span> })}</section>
      <aside className="dispatch-panel"><section className="fleet-live"><small>FLOTA EN RUTA</small>{game.activeDeliveries.length ? game.activeDeliveries.map(delivery => { const progress = positionFor(delivery).progress; return <article key={`${delivery.vehicleId}-${delivery.startsAt}`}><b>{findVehicle(delivery.vehicleId ?? 'bici').name}</b><span>{delivery.orderIds.length} pedidos · {Math.round(progress * 100)}%</span><i><em style={{ width: `${progress * 100}%` }}></em></i></article> }) : <p>Todos los vehiculos estan disponibles.</p>}</section>
        <section className="dispatch-form"><small>1 · ASIGNAR VEHICULO</small><div className="dispatch-vehicles">{idleIds.map(id => { const item = findVehicle(id); return <button key={id} className={vehicleId === id ? 'selected' : ''} onClick={() => { setVehicleId(id); setRoute([]) }}><b>{item.name}</b><span>{item.capacity} paquetes · x{item.speed}</span></button> })}</div>{!idleIds.length && <p className="dispatch-empty">No hay vehiculos libres. Espera a que termine una ruta o amplia la flota.</p>}
          <small>2 · CARGAR PEDIDOS</small><div className="route-orders">{ready.map(order => { const product = getInitialProducts(game.category).find(item => item.id === order.productId); const index = route.indexOf(order.id); return <button key={order.id} className={index >= 0 ? 'selected' : ''} onClick={() => setRoute(value => index >= 0 ? value.filter(id => id !== order.id) : value.length < vehicle.capacity ? [...value, order.id] : value)}><b>{index >= 0 ? index + 1 : '+'}</b><span>{product?.name}<small>{findZone(order.zoneId).name} · {order.quantity} u.</small></span></button> })}</div>
          <div className="dispatch-summary"><span>{route.length}/{vehicle.capacity} paquetes · {Math.round(distance)} cuadras</span><strong>ETA {Math.round(minutes)} min</strong><small>Energia estimada: -{Math.ceil(minutes / (20 + game.facility.dispatch * 5))}%</small></div><button className="primary" disabled={!planned.length || !idleIds.includes(vehicleId)} onClick={launch}>DESPACHAR RUTA →</button>
        </section></aside></div>
  </section></div>
}

function MapWindow({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const ready = game.orders.filter(order => order.status === 'ready')
  const vehicle = findVehicle(game.activeVehicleId)
  const [route, setRoute] = useState<string[]>([])
  const plannedOrders = route.map(id => ready.find(order => order.id === id)).filter((order): order is Order => Boolean(order))
  const routeStops = ['home', ...plannedOrders.map(order => order.zoneId), 'home']
  const routeDistance = routeStops.slice(1).reduce((sum, stop, index) => {
    const from = routeStops[index] === 'home' ? { x: 24, y: 55 } : findZone(routeStops[index])
    const to = stop === 'home' ? { x: 24, y: 55 } : findZone(stop)
    return sum + Math.hypot(to.x - from.x, to.y - from.y)
  }, 0)
  const baseMinutes = Math.max(balance.bikeMinimumRouteMinutes / vehicle.speed, routeDistance * balance.bikeMinutesPerBlock / vehicle.speed)
  const start = () => {
    if (!plannedOrders.length || (!game.bicycleAvailable && vehicle.id === 'bici')) return
    const event = pickDeliveryEvent()
    const totalMinutes = baseMinutes * (event?.timeMultiplier ?? 1)
    const highestRisk = plannedOrders.reduce((highest, order) => Math.max(highest, balance.deliveryRisk[findZone(order.zoneId).risk]), 0) * (event?.riskMultiplier ?? 1) * (1 - game.facility.dispatch * .08)
    const roll = Math.random()
    const incident = roll >= highestRisk ? 'none' : roll < highestRisk * .15 ? 'all' : roll < highestRisk * .35 ? 'bike' : 'goods'
    setGame(current => current && ({ ...current, energy: Math.max(0, current.energy - Math.ceil(totalMinutes / (20 + current.facility.dispatch * 5))), activeDelivery: { orderIds: plannedOrders.map(order => order.id), route: [...plannedOrders.map(order => order.zoneId), 'home'], startsAt: current.gameMinutes, endsAt: current.gameMinutes + totalMinutes, incident, event: event ? { id: event.id, label: event.label, description: event.description, tone: event.tone } : null }, orders: current.orders.map(order => plannedOrders.some(item => item.id === order.id) ? { ...order, status: 'delivering' } : order) }))
  }
  const delivery = game.activeDelivery
  const totalMinutes = delivery ? delivery.endsAt - delivery.startsAt : baseMinutes
  const progress = delivery ? Math.min(1, Math.max(0, (game.gameMinutes - delivery.startsAt) / (delivery.endsAt - delivery.startsAt))) : 0
  const routeIds = delivery ? ['home', ...delivery.route] : ['home', ...plannedOrders.map(order => order.zoneId)]
  const coord = (id: string) => id === 'home' ? { x: 24, y: 55 } : findZone(id)
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
  return <div className="modal-backdrop"><section className="supplier-window map-window"><header><div><small>LOGÍSTICA PERSONAL · {vehicle.name.toUpperCase()}</small><h2>Ruta de entregas</h2></div><button onClick={onClose}>×</button></header><div className="map-layout"><section className="city-map"><div className="map-label">CABA · MAPA OPERATIVO</div><div className="river">RÍO DE LA PLATA</div><div className="map-landmark obelisk">▲<small>Obelisco</small></div><svg className="city-roads" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M5 82 L28 62 L45 50 L74 32" /><path d="M12 18 L40 42 L72 74 L92 86" /><path d="M18 55 L49 49 L92 45" /><path d="M39 5 L42 94" /></svg>{points.length > 1 && <svg className="route-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={path} /></svg>}<span className="home-pin">⌂<small>Casa / negocio</small></span>{cityZones.map(zone => <button key={zone.id} className={`zone-pin ${routeIds.includes(zone.id) ? 'on-route' : ''}`} style={{ left: `${zone.x}%`, top: `${zone.y}%`, '--zone': zone.color } as React.CSSProperties}><i></i><strong>{zone.name}</strong><small>{zone.risk} riesgo</small></button>)}{delivery && <span className="bike pixel-bike" style={{ left: `${bike.x}%`, top: `${bike.y}%` }}><i></i><b></b></span>}</section><aside className="route-panel">{delivery ? <><span className="delivery-live">● REPARTO EN CURSO</span><h3>{vehicle.name} en ruta</h3><p>Avance: {Math.round(progress * 100)}% · La ruta incluye el regreso a casa.</p><div className="delivery-progress"><i style={{ width: `${progress * 100}%` }}></i></div><div className="route-stops">{delivery.route.map((zoneId, index) => <span key={`${zoneId}-${index}`}><b>{index + 1}</b>{zoneId === 'home' ? 'Regreso a casa' : findZone(zoneId).name}</span>)}</div><small>Al terminar se libera el pago, menos la comisión de la plataforma.</small></> : <><p className="route-intro">Elegí hasta {vehicle.capacity} pedidos; {vehicle.name} tiene capacidad para {vehicle.capacity} paquetes.</p><div className="capacity"><span>PAQUETES CARGADOS</span><strong>{route.length} / {vehicle.capacity} · energía {game.energy}%</strong></div>{ready.length ? <div className="route-orders">{ready.map(order => { const product = getInitialProducts(game.category).find(item => item.id === order.productId); const position = route.indexOf(order.id); return <button key={order.id} className={position >= 0 ? 'selected' : ''} onClick={() => setRoute(current => position >= 0 ? current.filter(id => id !== order.id) : current.length < vehicle.capacity ? [...current, order.id] : current)}><b>{position >= 0 ? `${position + 1}°` : '+'}</b><span>{product?.name}<small>{findZone(order.zoneId).name} · {order.quantity} u.</small></span></button>})}</div> : <div className="empty-state"><strong>No hay pedidos listos.</strong><span>Negociá una oferta y prepará el pedido primero.</span></div>}<div className="route-summary"><span>Ida y vuelta estimada</span><strong>{Math.round(routeDistance)} cuadras</strong><span>Tiempo: {Math.round(totalMinutes)} min. de juego</span></div><button className="primary" disabled={!route.length || (!game.bicycleAvailable && vehicle.id === 'bici')} onClick={start}>Salir a repartir →</button></>}</aside></div></section></div>
}

function FinanceDesk({ game, onClose }: { game: GameState; onClose: () => void }) {
  const products = getInitialProducts(game.category)
  const listedUnits = game.listings.reduce((sum, listing) => sum + listing.quantity, 0)
  const stockUnits = Object.values(game.inventory).reduce((sum, quantity) => sum + quantity, 0)
  const potentialGross = game.listings.reduce((sum, listing) => sum + listing.price * listing.quantity, 0)
  const potentialNet = game.listings.reduce((sum, listing) => sum + listing.price * listing.quantity * (1 - findMarketplace(listing.platformId).commission), 0)
  const stockValue = products.reduce((sum, product) => sum + (game.inventory[product.id] ?? 0) * product.priceUsd * game.dollarRate * (1 + product.importFee), 0)
  const averageTicket = game.orderStats.completed ? Math.round(game.orderStats.revenue / game.orderStats.completed) : 0
  return <div className="modal-backdrop"><section className="supplier-window finance-desk"><header><div><small>CAJA Y PROYECCION</small><h2>Finanzas</h2></div><button onClick={onClose}>X</button></header><section className="finance-hero"><div><small>CAPITAL DISPONIBLE</small><strong>${game.capital.toLocaleString('es-AR')}</strong><span>Liquidez para importar y crecer.</span></div><div><small>COBRADO HISTORICO</small><strong>${game.orderStats.revenue.toLocaleString('es-AR')}</strong><span>{game.orderStats.completed} pedidos liquidados.</span></div><div><small>TICKET PROMEDIO</small><strong>${averageTicket.toLocaleString('es-AR')}</strong><span>Neto luego de comisiones.</span></div></section><section className="finance-grid"><article><small>STOCK EN CASA</small><strong>{stockUnits} u.</strong><span>Inversion estimada: ${Math.round(stockValue).toLocaleString('es-AR')}</span></article><article><small>PUBLICADO</small><strong>{listedUnits} u.</strong><span>${potentialGross.toLocaleString('es-AR')} bruto potencial</span></article><article><small>COBRO POTENCIAL</small><strong>${Math.round(potentialNet).toLocaleString('es-AR')}</strong><span>Luego de comisiones de plataformas.</span></article><article><small>RIESGO OPERATIVO</small><strong>{game.orderStats.incidents}</strong><span>Incidentes acumulados en entregas.</span></article></section><section className="finance-table"><header><b>PROYECCION POR PUBLICACION</b><span>Precio, unidades y cobro neto estimado</span></header>{game.listings.length ? game.listings.map((listing, index) => { const product = products.find(item => item.id === listing.productId); const market = findMarketplace(listing.platformId); return <div key={`${listing.productId}-${listing.platformId}-${index}`}><span>{product?.name}</span><small>{market.name}</small><b>{listing.quantity} u.</b><b>${listing.price.toLocaleString('es-AR')}</b><strong>${Math.round(listing.price * listing.quantity * (1 - market.commission)).toLocaleString('es-AR')}</strong></div> }) : <p>Sin publicaciones activas. Publica stock para ver una proyeccion de caja.</p>}</section></section></div>
}

function FacilityWindow({ game, setGame, onClose }: { game: GameState; setGame: React.Dispatch<React.SetStateAction<GameState | null>>; onClose: () => void }) {
  const tiers = [
    { name: 'Puesto de venta', text: 'Tu mesa de operaciones inicial.', cost: 0 },
    { name: 'Microdeposito', text: 'Estantes, mesa y espacio para preparar pedidos.', cost: 180000 },
    { name: 'Centro de despacho', text: 'Separacion de paquetes y salida coordinada.', cost: 520000 },
    { name: 'Nodo logistico', text: 'Una base preparada para administrar una flota.', cost: 1400000 }
  ]
  const current = tiers[game.facility.level]
  const next = tiers[game.facility.level + 1]
  const buyLevel = () => {
    if (!next || game.capital < next.cost) return
    setGame(value => value && ({ ...value, capital: value.capital - next.cost, facility: { ...value.facility, level: (value.facility.level + 1) as 0 | 1 | 2 | 3 } }))
  }
  const upgrades = [
    { id: 'storage' as const, name: 'Estanterias modulares', text: 'Ordena el stock y deja claro que esta disponible.', base: 45000, effect: `+${12 + game.facility.storage * 6} espacios visuales` },
    { id: 'packing' as const, name: 'Mesa de empaque', text: 'Reduce el tiempo manual de preparacion.', base: 70000, effect: `${Math.round(game.facility.packing * 20)}% mas rapido` },
    { id: 'dispatch' as const, name: 'Panel de despacho', text: 'Baja el desgaste y el riesgo al salir a repartir.', base: 110000, effect: `${game.facility.dispatch * 8}% menos riesgo` }
  ]
  const buyUpgrade = (id: 'storage' | 'packing' | 'dispatch', base: number) => setGame(value => {
    if (!value) return null
    const level = value.facility[id]
    const cost = Math.round(base * (1 + level * .75))
    if (level >= 3 || value.capital < cost) return value
    return { ...value, capital: value.capital - cost, facility: { ...value.facility, [id]: level + 1 } }
  })
  const rest = () => setGame(value => value && ({ ...value, gameMinutes: value.gameMinutes + 60, energy: 100 }))
  return <div className="modal-backdrop"><section className="supplier-window facility-window">
    <header><div><small>BASE OPERATIVA · NIVEL {game.facility.level}</small><h2>{current.name}</h2></div><button onClick={onClose}>X</button></header>
    <section className={`base-visual level-${game.facility.level}`}><div className="base-shelves"></div><div className="base-table"></div><div className="base-board">DISPATCH<br/><b>{game.orders.filter(order => order.status === 'ready').length}</b> LISTOS</div><div className="base-van">FLOTA<br/><b>{game.ownedVehicles.length}</b></div><p>{current.text}</p></section>
    <section className="base-status"><div><small>ENERGIA OPERATIVA</small><strong>{game.energy}%</strong><i><b style={{ width: `${game.energy}%` }}></b></i></div><div><small>FLOTA PROPIA</small><strong>{game.ownedVehicles.length}</strong><span>vehiculos</span></div><div><small>DESPACHOS ACTIVOS</small><strong>{game.activeDeliveries.length}</strong><span>en ruta</span></div><button onClick={rest} disabled={game.energy >= 100}>CERRAR TURNO +60 MIN</button></section>
    {next ? <section className="base-next"><div><small>SIGUIENTE ESCALA</small><h3>{next.name}</h3><p>{next.text}</p></div><button className="primary" disabled={game.capital < next.cost} onClick={buyLevel}>MEJORAR BASE ${next.cost.toLocaleString('es-AR')} →</button></section> : <p className="base-max">BASE MAXIMA: preparada para la futura red de despachos simultaneos.</p>}
    <section className="facility-upgrades">{upgrades.map(upgrade => { const level = game.facility[upgrade.id]; const cost = Math.round(upgrade.base * (1 + level * .75)); return <article key={upgrade.id}><span>{level}/3</span><div><strong>{upgrade.name}</strong><small>{upgrade.text}</small><b>{upgrade.effect}</b></div><button disabled={level >= 3 || game.capital < cost} onClick={() => buyUpgrade(upgrade.id, upgrade.base)}>{level >= 3 ? 'LISTO' : `$${cost.toLocaleString('es-AR')}`}</button></article> })}</section>
  </section></div>
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
