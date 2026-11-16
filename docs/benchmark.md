# Benchmark: qué funciona en otros juegos y cómo lo usa Rebusque

Análisis de diseño de los juegos de referencia y de otros del género. Para cada mecánica: por qué funciona allá y cómo quedó en Rebusque.

## 911 Operator (Jutsu Games)

| Qué hace bien | Por qué engancha | En Rebusque |
|---|---|---|
| Mapa de una ciudad real con calles | El jugador reconoce lugares y aprende la geografía, así que decidir pasa a ser intuitivo | Mapa propio de **los 48 barrios oficiales de CABA** y 15 partidos del conurbano, con avenidas reales (Rivadavia, Libertador, 9 de Julio, General Paz…) |
| Las unidades se mueven por las calles | La distancia se siente, y mandar a la unidad más cercana es una decisión real | **Ruteo A\* por cuadras**: cada viaje va en cruz por la grilla porteña y las avenidas son más rápidas. El tiempo depende de las cuadras, del vehículo y del cadete |
| Ves la ruta antes de despachar | Bajás el riesgo de equivocarte y entendés por qué tarda | **Vista previa** en celeste con paradas numeradas, minutos de ida y vuelta y cuadras, antes de tocar "Enviar" |
| Llamados con temporizador | Presión constante y priorización | Pedidos con **anillo de paciencia**; los urgentes, VIP y mayoristas tienen otros tiempos |
| Incidentes que requieren decisión | Rompen la rutina y generan historias | **Emergencias en ruta** con alarma: robos, porteros, trapitos, cortes, Doña Rosa |
| Unidades especializadas | Planificar la flota tiene sentido | Los **bultos grandes** necesitan utilitario; hay motos para distancias largas |
| Abrir distritos/ciudades nuevas | Progresión espacial visible | **Cobertura por radio** que crece con el local, y **expansión al conurbano** por región |

## Game Dev Tycoon (Greenheart Games)

| Qué hace bien | Por qué engancha | En Rebusque |
|---|---|---|
| Etapas de oficina (garage → oficina → estudio) | Hitos claros y emocionantes | 5 etapas: Pieza → Local → Galpón → Centro logístico → Hub |
| Puntos de investigación separados de la plata | Dos recursos, dos tipos de decisión | **Ideas 💡** ganadas al entregar, para rubros, mejoras y calidad |
| Reseñas al lanzar un juego | Feedback inmediato y emocional | **Ticket de cierre de caja** cada noche, reseñas de clientes en WhatsApp, estrellas en cada entrega |
| Capacitar al personal | Apego a los empleados | **Cursos** de manejo y de cuidado, experiencia que sube stats, cadetes con nombre y bio |
| Eventos con decisiones | Historia emergente | 15 **historias nocturnas** con personajes recurrentes y relaciones |
| Fans / hype | Crecimiento exponencial visible | **Fans** que alimentan la demanda; campañas de publicidad |

## Otros juegos del género

| Juego | Mecánica | En Rebusque |
|---|---|---|
| Overcooked / Diner Dash | Picos de presión y combos | **Horas pico** (almuerzo y salida del laburo) y **rachas** de entregas perfectas que suben propinas |
| Mini Metro | Mapa limpio y legible, crecimiento gradual | Estética 911 oscura, grilla de cuadras, leyenda, zoom y arrastre |
| Recettear / Moonlighter | Comprar barato y vender caro, con pronóstico de demanda | **Pronóstico de mañana** que cambia la demanda por rubro; compra en Once, importación o corrida urgente |
| Stardew Valley | Celular/buzón como hub narrativo | **Celular** con WhatsApp, banco, clima, estadísticas y manual |
| Two Point Hospital | Asesor que comenta lo que pasa | **Consejo de Franco**: lee el estado del negocio y dice qué hacer |
| Dispatch / This is the Police | Objetivos diarios encima del loop | **Contratos del día**: un cliente pide N entregas de un rubro, zona o calidad, con premio |
| Factorio / Shapez | Automatizar lo que ya dominaste | **Bot de despacho** y **reposición automática** para el juego tardío |

## Principios que guían el diseño

1. **Toda decisión se ve en el mapa.** Rutas, cobertura, riesgo y paciencia son visuales.
2. **Primero aprendés haciendo.** Un tutorial paso a paso con resaltado; después, consejos contextuales y un manual en el celular.
3. **Micro y macro separados en el tiempo.** De día despachás (911); de noche gestionás (Tycoon).
4. **Automatizar lo aprendido.** Lo repetitivo se puede delegar a medida que creces.
5. **Barrio y cultura porteña en todo.** Nombres, eventos, avenidas, textos y estética de filete.
