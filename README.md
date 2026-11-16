# Rebusque · tycoon de reparto porteño

> Te echaron del call center. Tenés 23 años, una bici playera, $200.000 en una lata y una pieza en lo de tu vieja en Caballito. Franco dice que todo el mundo compra por el celu. Rebusque arranca hoy.

Juego web de gestión que mezcla **central de despacho estilo _911 Operator_** (pedidos que entran en tiempo real sobre el mapa de CABA, cadetes que salen a la calle, emergencias en ruta) con **progresión tipo _Game Dev Tycoon_** (ideas para investigar, rubros nuevos, equipo, local que crece de pieza a hub logístico). Estética de filete porteño, carteles de subte y ticket de caja.

## Cómo se juega

**De día (09:00 a 21:00)** el celular suena:

- Cada pedido aparece como un pin en el barrio, con un anillo que marca la paciencia del cliente.
- Seleccionás uno o varios pedidos (lista o mapa) y elegís qué cadete sale. El juego arma la ruta, calcula el tiempo y chequea carga, bultos y stock.
- Si falta mercadería: **corrida a Once** (al instante, 50% más cara) o rechazás el pedido.
- En la calle pasan cosas: pinchaduras, piquetes, porteros que no atienden, trapitos, robos. Algunas te obligan a decidir en el momento.
- Cada entrega deja plata, calificación (⭐), fans e ideas 💡. Las cancelaciones y las malas reseñas te bajan.

**De noche** se planifica:

- Cerrás caja con un ticket del día.
- Mirás el pronóstico de mañana (superclásico, diluvio, paro de colectivos, Hot Sale, salto del dólar, ola polar…) y comprás stock en consecuencia.
- Contratás cadetes (cada uno con velocidad, cuidado, sueldo y personalidad), comprás vehículos, investigás mejoras, abrís rubros y lanzás campañas.
- Aparecen historias del barrio con decisiones que tienen consecuencias: Mara la mayorista de Once, tu vieja, la abuela Nélida, Esteban Lobo de la competencia, un inspector municipal…

**Perdés** si cerrás tres días seguidos con la caja en rojo. **Ganás** al abrir el Hub Rebusque con 10.000 fans (y podés seguir jugando).

### Atajos

`Espacio` pausa · `1`–`7` abren los paneles · `Esc` cierra y limpia la selección.

## Contenido

| | |
|---|---|
| Barrios | 31 de CABA, cada uno con riqueza (propinas), riesgo y demanda |
| Rubros | 12 (celulares, matería, indumentaria, almacén, fútbol, mascotas, bazar, belleza, gamer, ferretería, librería, electro) |
| Productos | 60, con volumen, fragilidad y bultos que requieren utilitario |
| Local | 5 etapas: La pieza → Local a la calle → Galpón → Centro logístico → Hub Rebusque |
| Vehículos | Bici, bici eléctrica, moto, utilitario, camioncito |
| Investigación | 16 mejoras (Instagram, QR, packaging, Mercado Chango, importación, seguro, bot de despacho, app propia…) |
| Publicidad | 8 campañas, desde el grupo de vecinos de Facebook hasta la tele de la tarde |
| Eventos | 21 eventos del día, 10 incidentes en ruta (6 con decisión), 15 historias nocturnas |
| Progresión | 18 desafíos con premio, 6 rangos, 3 tipos de préstamo |
| Economía | Inflación semanal (precios, costos y sueldos), dólar que afecta la importación, gastos fijos diarios |

## Arquitectura

```text
src/
  game/
    types.ts      # modelo de estado
    catalog.ts    # rubros y productos
    barrios.ts    # barrios de CABA y coordenadas sobre el mapa
    content.ts    # local, vehículos, investigación, campañas, eventos, incidentes, historias, desafíos
    engine.ts     # simulación pura: tick, despacho, entregas, cierre de día, acciones de gestión
    save.ts       # guardado versionado en localStorage
  screens/        # menú/intro/setup, mapa, operaciones, paneles, modales, radio
  ui/             # íconos pixel-art, sonido chiptune, piezas comunes
scripts/sim.ts    # bot que juega N días sin interfaz para revisar el balance
```

El motor es puro (estado → estado), así que la interfaz solo dispara acciones y la simulación se puede correr sin navegador:

```bash
npm run sim -- 40 caballito celus   # días, barrio inicial, rubro inicial
```

Los íconos de productos son emojis pasados a pixel-art en un canvas, así todo el catálogo comparte estética sin depender de spritesheets.

## Desarrollo

```bash
npm install
npm run dev
npm run build
```

Con Docker: `docker compose up --build` sirve el build con nginx.

## Créditos

Idea y desarrollo original: Tec. Franco M. Cortinez · Avantek. Música: *Tangorockeando*, *Tarde de Plaza* y *Folklore Pixelado*.
