# Rebusque · tycoon de reparto porteño

> Te echaron del call center. Tenés 23 años, una bici playera, $200.000 en una lata y una pieza en lo de tu vieja en Caballito. Franco dice que todo el mundo compra por el celu. Rebusque arranca hoy.

Juego web de gestión que mezcla **central de despacho estilo _911 Operator_** (pedidos que entran en tiempo real sobre un mapa real de CABA y el conurbano, cadetes que recorren las calles cuadra por cuadra, emergencias en ruta) con **progresión tipo _Game Dev Tycoon_** (ideas para investigar, rubros nuevos, equipo, local que crece de pieza a hub logístico). Estética de filete porteño, carteles de subte y ticket de caja.

## Cómo se juega

**De día (09:00 a 21:00)** el celular suena:

- Cada pedido aparece como un pin en su barrio real, con un anillo que marca la paciencia del cliente.
- Al seleccionar uno o varios pedidos, el mapa muestra **la ruta por las calles**, con las paradas numeradas, las cuadras y los minutos de ida y vuelta. Después elegís quién sale.
- El cadete avanza **cuadra por cuadra** por la grilla porteña; las avenidas (Rivadavia, Libertador, 9 de Julio, General Paz…) son más rápidas. Más cuadras, más tiempo.
- En la calle pasan cosas: pinchaduras, piquetes, porteros que no atienden, trapitos, robos. Algunas te llaman como una emergencia y decidís vos.
- **Hora pico** al mediodía y a la salida del laburo. **Rachas** de entregas perfectas que suben las propinas. **Contratos del día** con premio.

**De noche** se planifica:

- Ticket de cierre de caja y pronóstico de mañana (superclásico, diluvio, paro de colectivos, Hot Sale…).
- **Surtido recomendado**: compra stock solo, según popularidad, pronóstico y presupuesto.
- **Flota**: contratar, capacitar (cursos), comprar vehículos y mejorarlos (canasto, puesta a punto, candado, ploteo).
- **Local**: mudarse (5 etapas), mejoras permanentes (estanterías, mesa de embalaje, mostrador a la calle, cartel luminoso, cocina y vestuario, cámaras y GPS, centro de atención), financiamiento y **expansión al conurbano** (Zona Norte, Oeste y Sur).
- **Desarrollo**: rubros, mejoras del negocio y **calidad por rubro** (genérico → marca propia).
- Historias del barrio con decisiones que tienen consecuencias.

**El celular** (📱 o tecla C): WhatsApp con Franco, tu vieja, Mara, los clientes y el banco; home banking con préstamos; clima y pronóstico; estadísticas; manual; y un botón para **pedirle consejo a Franco**, que analiza tu negocio y te dice qué hacer.

**Tutorial guiado** paso a paso al empezar (se puede repetir desde el manual del celular), consejos contextuales y un botón "?" en cada panel.

**Perdés** si cerrás tres días seguidos con la caja en rojo. **Ganás** al abrir el Hub Rebusque con 10.000 fans (y podés seguir jugando hasta conquistar el AMBA).

### Atajos

`Espacio` pausa · `1`–`7` paneles · `C` celular · `Esc` cierra · ruedita para zoom y arrastrar para mover el mapa.

## Contenido

| | |
|---|---|
| Mapa | Los 48 barrios oficiales de CABA + 15 partidos del conurbano, con avenidas reales y una grilla de cuadras para el ruteo |
| Rubros | 12, con 4 niveles de calidad |
| Productos | 60, con volumen, fragilidad y bultos que requieren utilitario |
| Local | 5 etapas + 7 mejoras con varios niveles + 3 regiones del conurbano |
| Flota | 5 vehículos, 4 mejoras por vehículo, cursos para cadetes, garage y venta de usados |
| Investigación | 16 mejoras del negocio |
| Publicidad | 8 campañas |
| Eventos | 21 eventos del día, 10 incidentes en ruta, 15 historias nocturnas, contratos diarios, horas pico |
| Progresión | 25 desafíos con premio, 6 rangos, 3 préstamos |

El análisis de qué tomamos de 911 Operator, Game Dev Tycoon y otros juegos está en [`docs/benchmark.md`](docs/benchmark.md).

## Arquitectura

```text
src/
  game/
    types.ts      # modelo de estado
    catalog.ts    # rubros y productos
    geo.ts        # generado: polígonos de barrios/partidos, grilla de cuadras y avenidas
    routing.ts    # A* por cuadras (avenidas más rápidas)
    barrios.ts    # datos de juego por barrio y regiones del conurbano
    content.ts    # local, vehículos, investigación, campañas, eventos, incidentes, historias, desafíos
    engine.ts     # simulación pura: tick, despacho, entregas, cierre de día, acciones de gestión
    save.ts       # guardado versionado en localStorage
  screens/        # menú/intro/setup, mapa, operaciones, paneles, modales, radio
  ui/             # íconos pixel-art, sonido chiptune, piezas comunes
scripts/sim.ts      # bot que juega N días sin interfaz para revisar el balance
scripts/build-geo.py # regenera geo.ts a partir de los GeoJSON públicos
```

El motor es puro (estado → estado), así que la interfaz solo dispara acciones y la simulación se puede correr sin navegador:

```bash
npm run sim -- 40 caballito celus   # días, barrio inicial, rubro inicial
```

El mapa se genera desde datos abiertos: los límites oficiales de barrios de CABA (GCBA) y los partidos de la provincia (click_that_hood). Los íconos de productos son emojis pasados a pixel-art en un canvas, así todo el catálogo comparte estética sin depender de spritesheets.

## Desarrollo

```bash
npm install
npm run dev
npm run build
```

Con Docker: `docker compose up --build` sirve el build con nginx.

## Créditos

Idea y desarrollo original: Tec. Franco M. Cortinez · Avantek. Música: *Tangorockeando*, *Tarde de Plaza* y *Folklore Pixelado*.
