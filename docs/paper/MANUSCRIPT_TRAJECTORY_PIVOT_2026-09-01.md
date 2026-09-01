# Giro metodológico del manuscrito EDTR — trayectoria de implementación

Fecha: 2026-09-01

## Manuscrito vivo

Google Doc: `EDTR - Evaluación de trayectorias de implementación en redes de transporte - Método EVA`

ID: `1d4W7EdCoJDnU1rHB7Z4Y9wy-cU4JnjcaswqS5RtZUIs`

Título propuesto dentro del manuscrito:

**EVALUACIÓN DE TRAYECTORIAS DE IMPLEMENTACIÓN EN REDES DE TRANSPORTE: MÉTODO EVA PARA LA SECUENCIACIÓN DEPENDIENTE DEL ESTADO**

## Tesis científica

El paper ya no se presenta principalmente como un artículo sobre ranking de ciclovías ni como un caso de estudio. EVA se formula como un método para incorporar la **trayectoria de implementación** a la evaluación de carteras y planes maestros de transporte.

La evaluación convencional puede representar una condición base `G0` y un horizonte `GH` con el plan completo. EVA hace explícitos los estados intermedios:

`G0 -> p1 -> G1 -> reevaluación -> p2 -> G2 -> ... -> GH`

Dos secuencias pueden contener exactamente los mismos proyectos, tener el mismo costo y converger al mismo estado físico final, pero producir distintos estados intermedios y diferente valor decisional acumulado.

## Contribución metodológica

EVA representa cada proyecto `p` como operador `T_p` sobre el estado `G_t`, recalcula atributos dependientes de red y reevalúa el conjunto factible `P^f_t`. La arquitectura mantiene separados `G_t`, `P`, `P^f_t`, `W`, `Omega` y `Theta`.

La interacción dirigida se observa como:

`I_t(i,j) = S_j(G_{t+1}) - S_j(G_t)`

Un valor positivo es señal de habilitación/complementariedad; uno negativo, de sustitución o pérdida de necesidad relativa. La evidencia muestra que la interacción también puede depender del estado, por lo que no debe suponerse necesariamente `I(i,j)=c`.

## Preguntas centrales del paper

1. ¿Puede el orden alterar el desempeño acumulado aun cuando el plan final sea exactamente el mismo?
2. ¿Puede la reevaluación continua modificar también qué proyectos conviene ejecutar?
3. ¿Pueden las transiciones de estado revelar interacciones dirigidas y demostrar que esas interacciones cambian durante la implementación?

Los análisis de normalización, preferencias `W`, estrategia `Omega` y conjunto factible quedan como pruebas de sensibilidad y delimitación de la arquitectura, no como el centro narrativo.

## Experimento 1 — efecto puro del orden

Se fija el Top-30 inicial y se comparan el orden estático congelado y EVA reordenando únicamente esos mismos 30 proyectos. Ambas trayectorias terminan con exactamente los mismos proyectos, costo total `21.079 MCLP` y `119` componentes. Por tanto, las diferencias intermedias son atribuibles al orden.

Resultados:

- valor EVA acumulado: `13,6681 -> 14,0389`, `+2,71%`;
- valor EVA descontado (`delta=0,95`): `7,6399 -> 8,0593`, `+5,49%`;
- reducción integrada de componentes: `362 -> 422`, `+16,57%`;
- componentes medios: `128,93 -> 126,93`;
- después del primer proyecto, EVA tiene mayor valor acumulado en los 29 pasos restantes;
- máxima diferencia en paso 18: `+1,0602`, aproximadamente `+12,1%`;
- en 10 puntos de presupuesto equivalente, EVA tiene mayor valor acumulado en los 10; menos componentes en 8, igualdad al 100% y un componente más sólo al 30%.

No existe dominancia de Pareto: ciclistas inducidos son menores bajo EVA en algunos estados. El valor acumulado es **valor decisional multicriterio EVA**, no bienestar social monetario.

## Experimento 2 — cartera adaptativa abierta

EVA reevalúa en cada paso los 124 proyectos C/I elegibles.

Entran 11 proyectos fuera del Top-30 inicial:
`C067, I04, I27, I25, C086, I06, C089, C046, C052, C035, C063`

Salen 11 proyectos del Top-30 inicial:
`I14, I15, I08, C006, I05, I07, I02, I29, C060, C057, C058`

Ejemplos: C067 pasa de rank 57 a paso 6; C089 de 85 a paso 25; I14 parte rank 2 y no entra en los primeros 30.

Frente al Top-30 estático, la trayectoria abierta obtiene costo `-7,82%`, valor EVA acumulado `+12,67%`, valor descontado `+11,00%`, componentes finales `119 -> 114`, población marginal `+16,06%`, demanda habilitada `+22,39%` y ciclistas inducidos `-12,01%`.

Esta comparación no identifica efecto puro del orden porque la composición cambia; se interpreta como política adaptativa de cartera.

## Interacciones durante la trayectoria

Se observaron 3.255 efectos dirigidos: 421 positivos, 179 negativos y 2.655 nulos; media absoluta `0,004710`; `Q(|I|>=0,005)=15,55%` y `Q(|I|>=0,01)=10,14%`.

Señal habilitante máxima: I26 San Pablo -> C049 Federico Errázuriz, score `0,329 -> 0,561`, rank `48 -> 4`.

Señal negativa máxima: C068 San Carlos -> C006 Domingo Tocornal, score `0,490 -> 0,227`, rank `6 -> 104`.

Dependencia del estado: C049 pasa de rank 48 / score 0,329 a rank 4 / 0,561 después de I26, y luego a rank 64 / 0,302 después de I11. Esto respalda representar las interacciones como `I_t(i,j)`.

## Precauciones de interpretación

- EVA usa actualmente una heurística voraz; no demuestra óptimo global.
- La comparación controlada demuestra ventaja frente al orden estático, no frente a todas las permutaciones posibles.
- El puntaje EVA no es bienestar monetario.
- Una interacción negativa no implica eliminar automáticamente un proyecto.
- La aplicación empírica ciclable valida el mecanismo, no los mismos indicadores para otros modos.
- La transferibilidad es arquitectónica.

## Cambios aplicados al manuscrito

- Nuevo título, resumen/abstract y palabras clave.
- Introducción reescrita desde el problema `G0 -> GH` versus trayectoria intermedia.
- Sección 2.5 reenfocada hacia la brecha entre formulación del plan e implementación.
- Secciones 3 y 4 conservan la formalización, pero la tipología queda como soporte y no como contribución principal.
- Sección 3.2 renombrada `Operadores de transformación y funciones de red`.
- Sección 3.3 renombrada `Atributos y dependencia del estado`.
- Sección 3.6 comprimida a las condiciones mínimas del problema secuencial y remitida a `I_t`, `K_t` y `Q_t` para medir intensidad empírica; se eliminó el catálogo redundante de cinco ejes tipológicos.
- Se eliminó un párrafo redundante de transferibilidad en 5.1.
- Sección 6 organizada como protocolo de evaluación de trayectorias: métricas, experimento controlado, experimento abierto, interacciones, sensibilidad y reproducibilidad.
- Sección 7 centrada en trayectoria, adaptación e interacción; sensibilidades como controles.
- Tabla 4 añadida para el contraste controlado de trayectorias.
- **Figura 2** incorporada al Google Doc: valor decisional acumulado frente a porcentaje de presupuesto equivalente para el mismo Top-30. Datos: `results/paper-plan-trajectory/order_only_budget_comparison.csv`.
- **Figura 3** incorporada al Google Doc: evolución de C049 Federico Errázuriz antes y después de I26 e I11 para mostrar que la interacción depende del estado.
- Sección 8 reescrita con el aporte metodológico y sus límites.

## Estado editorial al 2026-09-01

La narrativa central queda organizada en tres demostraciones: (1) mismo plan final, distinta trayectoria; (2) cartera adaptativa que cambia composición; y (3) interacciones dirigidas dependientes del estado. La siguiente revisión debe concentrarse en formato final EDTR, consistencia de ecuaciones/notación, referencias, calidad gráfica de Figura 1 y extensión total, sin volver a abrir el framing científico salvo que aparezca nueva evidencia.

## Resultados reproducibles

- Experimento correctivo RMC+C/I: `results/paper-experiments/2026-09-01-rmc-eligible/`
- Experimento de trayectorias: `results/paper-plan-trajectory/`
- Informe detallado: `docs/paper/PLAN_TRAJECTORY_RESULTS_2026-09-01.md`
- Presupuesto equivalente: `results/paper-plan-trajectory/order_only_budget_comparison.csv`

Workflow de trayectoria: `Paper plan trajectory experiment`, run `33543155548`, artifact `9814615341`.
