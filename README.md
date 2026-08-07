# Delivery Game · Edición Barrial

Juego web de gestión y logística en el que el jugador convierte una tienda casera en un negocio de reventa. Hay que importar productos, administrar el inventario, publicar en distintas plataformas, negociar con compradores y organizar entregas por los barrios de Buenos Aires.

La partida se desarrolla en tiempo simulado: el reloj puede pausarse o acelerarse y las decisiones operativas tienen consecuencias sobre el capital, la reputación, la energía y la capacidad de entrega.

## Ciclo de juego

1. Crear una tienda y elegir su rubro inicial.
2. Comprar mercadería a proveedores y esperar la llegada de los envíos.
3. Publicar productos, definir cantidades y precios para cada plataforma.
4. Recibir ofertas o ventas directas, negociar y preparar pedidos.
5. Planificar una ruta según la capacidad del vehículo y entregar los pedidos.
6. Cobrar el pago, mejorar el negocio y reinvertir para crecer.

## Funcionalidades

- Creación de partida con nombre de tienda y categoría de productos.
- Guardado local automático y carga de partidas desde el navegador.
- Reloj de juego con velocidades ×1, ×2, ×4 y pausa.
- Importación de productos, costos, tiempos de llegada y stock en tránsito.
- Inventario disponible, publicaciones activas y control de cantidades por plataforma.
- Ofertas de compradores, contraofertas, vencimientos y ventas directas.
- Reserva inmediata de stock: una unidad vendida queda comprometida al aceptar la venta y no puede volver a publicarse mientras espera la entrega.
- Preparación manual de pedidos o automática mediante mejoras.
- Mapa operativo de CABA en estilo pixel art, con barrios, niveles de riesgo, rutas, puntos de entrega, río y progreso del repartidor.
- Planificación de rutas según capacidad, distancia, energía y velocidad del vehículo.
- Riesgos de reparto e incidentes que pueden afectar la mercadería, la bicicleta o el pago.
- Flota de vehículos con diferente capacidad, velocidad y costo.
- Mejoras de automatización: bot de ventas, mesa automática e impulso publicitario.
- Eventos aleatorios configurables: festivales, tendencias virales, competencia, lluvia, cortes de calle y atajos. Estos modifican la demanda, el tiempo de ruta o el riesgo de entrega.
- Capital, comisiones de plataformas y reputación como indicadores de progreso.

## Configuración de balance y eventos

Los valores principales del juego se encuentran en `src/data/`:

- `balance.json`: capital inicial, ritmo del reloj, plazos, riesgos y tiempos de operación.
- `vehicles.json`: vehículos, precio, velocidad, capacidad y mantenimiento.
- `neighborhoods.json`: barrios, coordenadas del mapa, demanda y riesgo.
- `events.json`: catálogo y probabilidad de los eventos aleatorios de mercado y reparto.

## Desarrollo

```bash
npm install
npm run dev
```

Para generar una compilación de producción:

```bash
npm run build
```
