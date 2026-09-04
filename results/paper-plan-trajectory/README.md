# EVA · experimento de trayectoria de implementación

Generado: 2026-09-04T17:07:05.561Z

## Pregunta metodológica

Los planes maestros suelen comparar una condición base G0 con un horizonte GH en que la cartera está implementada. Este experimento evalúa también la trayectoria G0→G1→…→GH y pregunta si el orden de entrada de los proyectos altera el valor capturado durante la implementación y la prioridad de los proyectos restantes.

## Diseño

- Escenario: Ponderación RMC.
- Normalización: referencia fija G0 sobre proyectos Comunales + Intercomunales.
- Universo modelado: 133; elegibles: 124.
- Horizonte experimental: 30 proyectos.
- Descuento por etapa para valor decisional temprano: δ=0.95.
- El puntaje acumulado EVA es un valor decisional multicriterio; no debe interpretarse como bienestar monetario.

## Experimento 1 · mismo plan final, distinto orden

Se comparan (a) el orden estático inicial y (b) un reordenamiento EVA que en cada etapa selecciona el proyecto con mayor valoración actual, pero restringido exactamente al mismo Top-30 inicial. Ambos recorridos deben terminar con el mismo conjunto de proyectos.

- Mismo conjunto final: true.
- Mismo número final de componentes: true (121 vs 121).
- Diferencia de valor EVA acumulado, adaptativo−estático: 0.371240.
- Diferencia de valor EVA descontado (δ=0.95): 0.419477.
- Diferencia en reducción integrada de componentes, adaptativo−estático: 58.000.

La tabla order_only_budget_comparison.csv compara ambas trayectorias con presupuestos equivalentes, evitando atribuir a la secuencia diferencias producidas sólo por el costo de los proyectos.

## Experimento 2 · plan adaptativo abierto

EVA reevalúa los 124 proyectos elegibles después de cada intervención. A diferencia del experimento 1, la composición del Top-30 puede cambiar.

- Proyectos que entran respecto del Top-30 inicial: 11: C067, I04, I27, I25, C086, I06, C089, C046, C052, C035, C063.
- Proyectos inicialmente Top-30 desplazados: 11: I14, I15, I08, C006, I05, I07, I02, I29, C060, C057, C058.
- Efectos dirigidos observados entre transiciones: 3255; positivos=421; negativos=179.
- Magnitud media absoluta del efecto de una intervención sobre proyectos restantes: 0.004711.
- Señal positiva más intensa: I26 → C049, Δscore=0.231691.
- Señal negativa más intensa: C068 → C006, Δscore=-0.263219.

## Lectura metodológica

El experimento 1 aísla el efecto del orden: mismo conjunto final y, por construcción, misma red al completar los 30 proyectos; cualquier diferencia acumulada antes del horizonte proviene de la trayectoria. El experimento 2 agrega adaptación de cartera y permite observar proyectos que ganan o pierden prioridad a medida que cambia la red. Los efectos negativos se interpretan como señales de sustitución o pérdida de necesidad relativa, no como prueba automática de que un proyecto deba eliminarse. Los positivos se interpretan como señales de complementariedad o habilitación.
