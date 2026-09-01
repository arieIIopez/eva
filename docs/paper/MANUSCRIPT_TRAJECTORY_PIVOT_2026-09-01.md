# Giro metodológico del manuscrito EDTR — trayectoria de implementación

Fecha: 2026-09-01

## Manuscrito vivo

Google Doc: `EDTR - Evaluación de trayectorias de implementación en redes de transporte - Método EVA`

ID: `1d4W7EdCoJDnU1rHB7Z4Y9wy-cU4JnjcaswqS5RtZUIs`

Revisión candidata de envío: `AIroW36v5rYlYunNgC6jiXpa7Mno1CHE2cEKAUOmd2OtetL04c8LmESbPoIKJnypmbhOnOBi3gKLwup0-C_6HoELytihvsm6PM0bDcZi_eU`

Título dentro del manuscrito:

**EVALUACIÓN DE TRAYECTORIAS DE IMPLEMENTACIÓN EN REDES DE TRANSPORTE: MÉTODO EVA PARA LA SECUENCIACIÓN DEPENDIENTE DEL ESTADO**

## Tesis científica

El paper no se presenta como un ranking de ciclovías ni como un caso de estudio. EVA se formula como un método para incorporar la **trayectoria de implementación** a la evaluación de carteras y planes maestros de transporte.

La evaluación convencional puede representar una condición base `G0` y un horizonte `GH` con el plan completo. EVA hace explícitos los estados intermedios:

`G0 -> p1 -> G1 -> reevaluación -> p2 -> G2 -> ... -> GH`

Dos secuencias pueden contener exactamente los mismos proyectos, tener el mismo costo y converger al mismo estado físico final, pero producir estados intermedios distintos y diferente valor decisional acumulado.

## Contribución metodológica

EVA representa cada proyecto `p` como operador `T_p` sobre `G_t`, recalcula atributos dependientes de red y reevalúa el conjunto factible `P^f_t`. Mantiene separados `G_t`, `P^f_t`, `W`, `Omega` y `Theta`.

La interacción dirigida se observa como:

`I_t(i,j) = S_j(G_{t+1}) - S_j(G_t)`

Un valor positivo señala habilitación/complementariedad; uno negativo, sustitución o pérdida de necesidad relativa. La evidencia muestra que la interacción también depende del estado, por lo que no se supone `I(i,j)=c`.

## Preguntas centrales

1. ¿Puede el orden alterar el desempeño acumulado aun cuando el plan final sea exactamente el mismo?
2. ¿Puede la reevaluación continua modificar también qué proyectos conviene ejecutar?
3. ¿Pueden las transiciones de estado revelar interacciones dirigidas que cambien durante la implementación?

Normalización, preferencias `W`, estrategia `Omega` y conjunto factible se tratan como controles y no como el centro narrativo.

## Experimento 1 — efecto puro del orden

Se fija el Top-30 inicial y se comparan el orden estático congelado y EVA reordenando únicamente esos mismos 30 proyectos.

Ambas trayectorias terminan con:
- los mismos 30 proyectos;
- costo total `21.079 MCLP`;
- `119` componentes finales.

Resultados:
- valor EVA acumulado: `13,6681 -> 14,0389`, `+2,71%`;
- valor EVA descontado (`delta=0,95`): `7,6399 -> 8,0593`, `+5,49%`;
- reducción integrada de componentes: `362 -> 422`, `+16,57%`;
- componentes medios: `128,93 -> 126,93`;
- después del primer proyecto, EVA tiene mayor valor acumulado en los 29 pasos restantes;
- máxima diferencia en paso 18: aproximadamente `+12,1%`;
- en los diez puntos de presupuesto equivalente EVA tiene mayor valor acumulado; presenta menos componentes en ocho, igualdad al 100% y uno más sólo al 30%.

No existe dominancia de Pareto: algunos indicadores, como ciclistas inducidos, son menores en determinados estados. El valor acumulado es **valor decisional multicriterio EVA**, no bienestar social monetario.

## Experimento 2 — cartera adaptativa abierta

EVA reevalúa en cada paso los 124 proyectos C/I elegibles.

Entran 11 proyectos fuera del Top-30 inicial:
`C067, I04, I27, I25, C086, I06, C089, C046, C052, C035, C063`

Salen 11:
`I14, I15, I08, C006, I05, I07, I02, I29, C060, C057, C058`

Ejemplos:
- C067: rank 57 -> paso 6;
- C089: rank 85 -> paso 25;
- I14: rank 2 -> no entra en los primeros 30.

Frente al Top-30 estático:
- costo `-7,82%`;
- valor EVA acumulado `+12,67%`;
- valor descontado `+11,00%`;
- componentes finales `119 -> 114`;
- población marginal `+16,06%`;
- demanda habilitada `+22,39%`;
- ciclistas inducidos `-12,01%`.

Esta comparación se interpreta como política adaptativa de cartera y no como efecto puro del orden, porque cambia la composición final.

## Interacciones durante la trayectoria

3.255 efectos dirigidos:
- 421 positivos;
- 179 negativos;
- 2.655 nulos;
- media absoluta `0,004710`;
- `Q(|I|>=0,005)=15,55%`;
- `Q(|I|>=0,01)=10,14%`.

Señal habilitante máxima:
- I26 San Pablo -> C049 Federico Errázuriz: score `0,329 -> 0,561`, rank `48 -> 4`.

Señal negativa máxima:
- C068 San Carlos -> C006 Domingo Tocornal: score `0,490 -> 0,227`, rank `6 -> 104`.

Dependencia del estado:
- C049 inicialmente: rank 48 / score 0,329;
- después de I26: rank 4 / 0,561;
- después de I11: rank 64 / 0,302.

Esto respalda escribir `I_t(i,j)`.

## Precauciones

- EVA usa una heurística voraz; no demuestra óptimo global.
- El experimento controlado compara contra el orden estático, no contra todas las permutaciones.
- El puntaje EVA no es bienestar monetario.
- Una interacción negativa no implica eliminar automáticamente un proyecto.
- La aplicación empírica ciclable valida el mecanismo, no los mismos indicadores para otros modos.
- La transferibilidad es arquitectónica.

## Estado editorial final para EDTR

Se realizó una edición de envío contra la plantilla oficial `Formato EDTR 27-06-2023.docx`.

Cumplimientos verificados:
- extensión final renderizada: **19 páginas**; límite EDTR: 20;
- Times New Roman 12 e interlineado simple en el cuerpo;
- título ajustado a 16 pt según plantilla;
- resumen en español menor a 200 palabras;
- seis palabras clave;
- tablas y figuras incorporadas en posición;
- portada compactada para evitar una segunda página casi vacía;
- encabezados 6.3 y 7 Resultados comienzan página nueva para evitar títulos huérfanos;
- Figura 2 duplicada detectada durante QA y corregida;
- revisión visual de las 19 páginas sin cortes ni desbordes.

Cambios de reducción de extensión realizados sin alterar los experimentos centrales:
- se eliminaron las tablas descriptivas de tipología, familias de atributos y mapeo de criterios, convirtiéndolas en prosa compacta;
- se eliminó la sección analítica `H+ / H-` porque no forma parte de la función de decisión EVA utilizada en los experimentos;
- se retiró el detalle algebraico secundario del indicador dendrítico, manteniendo su descripción operacional y reproducibilidad en código;
- se comprimieron estado del arte, normalización, transferibilidad, reproducibilidad y reiteraciones de conclusiones;
- resultados, controles y cifras centrales permanecieron.

Numeración final de ecuaciones:
- (1) operador de transformación;
- (2) interacción dirigida;
- (3a)-(3b) función de evaluación / estrategia topológica;
- (4a)-(4c) efecto de orden;
- (5) trayectoria de estados;
- (6) objetivo de secuenciación;
- (7) restricción presupuestaria;
- (8) selección voraz;
- (9) actualización de estado;
- (10) suma ponderada EVA.

## Figuras y tabla centrales

- Tabla 4: comparación controlada del mismo Top-30, costo y estado final.
- Figura 2: valor decisional acumulado frente a porcentaje de presupuesto equivalente. Fuente: `results/paper-plan-trajectory/order_only_budget_comparison.csv`.
- Figura 3: evolución de C049 Federico Errázuriz antes/después de I26 e I11, demostrando dependencia de estado de la interacción.

## Resultados reproducibles

- Experimento RMC+C/I: `results/paper-experiments/2026-09-01-rmc-eligible/`
- Experimento de trayectorias: `results/paper-plan-trajectory/`
- Informe detallado: `docs/paper/PLAN_TRAJECTORY_RESULTS_2026-09-01.md`
- Presupuesto equivalente: `results/paper-plan-trajectory/order_only_budget_comparison.csv`

Workflow de trayectoria: `Paper plan trajectory experiment`, run `33543155548`, artifact `9814615341`.

## Próximos controles antes de submission

El framing científico y la estructura se consideran cerrados. Los pasos restantes son de envío: revisión bibliográfica DOI por DOI, metadatos de autores/afiliaciones, declaración de financiamiento/conflictos si corresponde y carga en el sistema editorial de EDTR.
