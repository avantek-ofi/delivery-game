# Delivery Game — Edición Barrial

Juego web de gestión y logística ambientado en Buenos Aires. El jugador empieza con una tienda casera, importa productos, construye reputación y termina operando una red logística propia.

La meta no es hacer un dashboard con colores pixelados: es un **tycoon narrativo 2D** donde el centro operativo, la computadora y la ciudad son partes del mismo juego.

## Visión de producto

El juego conecta tres capas:

1. **Base operativa:** depósito, paquetes, equipos, vehículos y repartos.
2. **Computadora:** compras, publicaciones, clientes, finanzas y decisiones operativas.
3. **Ciudad:** demanda por barrios, rutas, riesgo, eventos, oportunidades y expansión territorial.

La dirección de arte se define como: **Buenos Aires nocturna, economía de barrio y tecnología precaria que mejora junto al jugador**. La UI debe ser diegética: software retro ficticio dentro del mundo del juego, con ventanas, cursores, tickets, sonidos y feedback visual.

## Vertical slice objetivo

> Recibo un correo → compro un producto → llega a mi base → lo publico → negocio una venta → preparo un paquete → reparto en Caballito → cobro y mejoro mi operación.

Cada cambio de funcionalidad debe reforzar esta secuencia antes de agregar sistemas desconectados.

## Estado actual

- [x] Crear tienda y elegir rubro inicial.
- [x] Guardado local automático y carga de partida.
- [x] Tiempo simulado con pausa y velocidades ×1, ×2 y ×4.
- [x] Importar mercadería, descontar capital y recibir envíos.
- [x] Inventario, publicaciones por plataforma y control de stock reservado.
- [x] Ofertas, contraofertas, ventas directas, vencimientos y pedidos.
- [x] Preparación manual o automática mediante mejoras.
- [x] Rutas, capacidad, energía, riesgo, incidentes y cobro de entregas.
- [x] Vehículos, automatizaciones y eventos configurables.
- [x] Flujo visual inicial: intro → centro operativo → correo → catálogo.
- [x] Escritorio retro con iconos, barra de tareas, widgets y ventanas apilables.
- [x] Ventanas arrastrables y minimizables durante la sesión.
- [x] Fondo pixel-art de Buenos Aires y fondo arcade de CABA originales.
- [x] Spritesheets iniciales de productos y UI.

## Roadmap vivo

Esta lista es la fuente de verdad para continuar el proyecto. Al implementar una tarea, marcarla y añadir una nota breve en el historial.

### Hito 1 — Fundamentos visuales y UX

- [x] Persistir posición, tamaño, orden y estado minimizado de ventanas por partida.
- [x] Permitir reubicar, ocultar y bloquear los widgets del escritorio.
- [x] Incorporar spritesheets propios de productos y componentes UI; queda pendiente sustituir todos los íconos restantes.
- [x] Añadir sonidos opcionales de feedback para notificaciones de juego.
- [x] Completar feedback visual contextual para correo, mercado, entregas, compras y errores.
- [x] Añadir modo accesible: reducir movimiento, alto contraste y controles de teclado nativos.

### Hito 2 — Base logística y despacho

- [x] Sustituir la habitación por una base operativa que crece de puesto de venta a nodo logístico.
- [x] Implementar energía operativa y cierre de turno con avance de tiempo.
- [x] Añadir capacidad real de almacenamiento; importaciones que exceden el espacio quedan bloqueadas.
- [x] Incorporar mejoras de estanterías, empaque y panel de despacho con tres niveles.
- [x] Conectar mesa de empaque al tiempo de preparación y despacho al riesgo y gasto de energía.
- [x] Visualizar la escala de la base, stock listo, flota y pedidos listos sin volver a una habitación decorativa.
- [x] Habilitar asignación simultánea de múltiples vehículos a rutas independientes con progreso individual.

### Hito 3 — Aplicaciones del escritorio

- [x] Consolidar Correo, Importador, Inventario, Publicar, Negociar, Pedidos, Finanzas y Despacho como aplicaciones con ventanas propias.
- [x] Inbox inicial con tutorial de proveedor y notificación persistente hasta lectura.
- [x] Importador con cotización del dólar, selección aleatoria de 14 productos y control de espacio disponible.
- [x] Inventario con stock disponible, publicaciones y mercadería en tránsito; la Base representa estanterías y preparación.
- [x] Tienda con tarjetas de producto, precio sugerido, comisión, cobro neto y publicación por plataforma.
- [x] Negociaciones con bandeja de compradores, detalle de margen, contraoferta y resultado visual.
- [x] Pedidos activos, historial de 30 días de juego y estadísticas acumuladas de cobros e incidentes.
- [x] Finanzas con capital, proyección por publicación, comisiones, ticket promedio y cobros históricos.

### Hito 4 — Economía, clientes y narrativa

- [ ] Añadir volumen, fragilidad, estacionalidad, rotación y devolución a los productos.
- [ ] Proveedores con calidad, reputación, demora, mínimo de compra y riesgo.
- [ ] Competencia visible que ajuste precios y sature categorías.
- [ ] Perfiles de clientes con paciencia, presupuesto, barrio y preferencias.
- [ ] Reseñas, clientes recurrentes, reclamos y recomendaciones.
- [ ] Eventos narrativos: vecino con local, tendencia, proveedor, influencer y competidor.

### Hito 5 — CABA y logística

- [ ] Dividir el mapa en distritos visuales con arquitectura y densidad propias.
- [ ] Incorporar clima, cortes, manifestaciones, atajos y tráfico como decisiones de ruta.
- [ ] Ordenar paradas de entrega y comparar tiempo, coste, riesgo y energía.
- [ ] Incidentes interactivos: lluvia, pinchadura, cliente ausente, robo y desvío.
- [ ] Reparto tercerizado, empleados y mensajería para ampliar la flota actual.
- [ ] Más hitos geográficos: avenidas, parques, trenes, río y puntos de referencia porteños.

### Hito 6 — Progresión y objetivos

- [ ] Cuaderno de objetivos dentro del juego.
- [ ] Hitos: primera venta, cliente recurrente, cinco publicaciones, estantes y primer empleado.
- [ ] Desbloqueos: local, depósito, flota y múltiples sucursales.
- [ ] Reputación con efectos concretos en clientes, proveedores y plataformas.
- [ ] Balance de late game: operador logístico con varias rutas activas.

## Arquitectura objetivo

```text
src/
  game/       # economía, tiempo, inventario, ventas, eventos y guardado
  scenes/     # intro, habitación, computadora, progreso físico y reparto
  desktop/    # gestor de ventanas, widgets, taskbar y notificaciones
  apps/       # correo, navegador, inventario, tienda, pedidos y finanzas
  map/        # CABA, distritos, rutas, pines y reparto
  ui/         # botones, paneles, diálogos, tooltips y HUD
  assets/     # sprites, tiles, fondos, efectos y audio
```

## Recursos artísticos actuales

- `src/assets/buenos-aires-night.png`: fondo de escritorio pixel-art.
- `src/assets/caba-arcade-map.png`: fondo arcade del mapa de entregas.
- `src/assets/sprites/product-sprites.png`: seis sprites de productos sobre transparencia.
- `src/assets/sprites/ui-sprites.png`: sprites de botones, badges y piezas de UI sobre transparencia.

Los archivos `*-source.png` conservan el fondo cromático original; los archivos sin ese sufijo son los recursos listos para usar.

## Datos de balance

Los valores configurables viven en `src/data/`:

- `balance.json`: capital inicial, ritmo del reloj, plazos, riesgos y tiempos.
- `vehicles.json`: precio, velocidad, capacidad y mantenimiento de vehículos.
- `neighborhoods.json`: barrios, coordenadas, demanda y riesgo.
- `events.json`: eventos de mercado y reparto.

## Desarrollo

```bash
npm install
npm run dev
npm run build
```

## Historial de roadmap

- **2026-08-07:** se documentó la visión de producto, el vertical slice y el roadmap. Se añadieron spritesheets iniciales para productos y UI, y fondos pixel-art de escritorio y mapa.
