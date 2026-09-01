# Resultados — EVA y trayectoria de implementación de un plan maestro

Fecha de corrida: 2026-09-01

Workflow: `Paper plan trajectory experiment`
Run: `33543155548`
Artifact: `9814615341` (`eva-paper-plan-trajectory`)
Commit experimental: `0a0f6f8345f76daba5262e326f105baf5b49ca36`

## Configuración

- Universo modelado: 133 proyectos.
- Conjunto factible: 124 proyectos Comunales + Intercomunales.
- Escenario: Ponderación RMC.
- Normalización: referencia fija en G0 sobre el conjunto factible C/I.
- Raíz: Alameda; tau=100 m; alpha=0.5.
- Horizonte experimental: 30 proyectos.
- Descuento de valor decisional: delta=0.95 por etapa.
- Componentes de la red inicial: 141.

El puntaje EVA acumulado se interpreta como valor decisional bajo la función multicriterio del método. No es una medida monetaria de bienestar social.

---

## Experimento 1 — mismo plan final, distinto orden

### Diseño controlado

Se fija el Top-30 obtenido en G0 y se comparan:

1. **Orden estático:** los treinta proyectos se ejecutan exactamente en el ranking inicial.
2. **EVA reordenado:** después de cada intervención se actualiza la red y se reevalúan únicamente los proyectos restantes de ese mismo Top-30.

Los dos recorridos terminan con:

- exactamente los mismos 30 proyectos;
- el mismo costo total: 21.079 MCLP;
- el mismo número final de componentes: 119.

Por tanto, las diferencias antes del paso 30 son atribuibles al **orden de implementación**, no a una composición distinta del plan final.

### Resultado agregado

| Métrica | Orden estático | EVA, mismo conjunto | Diferencia EVA |
|---|---:|---:|---:|
| Valor EVA acumulado | 13,6681 | 14,0389 | +0,3709 (+2,71%) |
| Valor EVA descontado, delta=0,95 | 7,6399 | 8,0593 | +0,4194 (+5,49%) |
| Componentes medios durante 30 etapas | 128,93 | 126,93 | -2,00 |
| Reducción integrada de componentes | 362 | 422 | +60 (+16,57%) |
| Componentes finales | 119 | 119 | 0 |
| Costo final, MCLP | 21.079 | 21.079 | 0 |

El valor EVA acumulado es igual en el primer paso y mayor bajo el reordenamiento EVA en **cada uno de los 29 pasos posteriores**. La diferencia máxima aparece en el paso 18: +1,0602 puntos EVA acumulados, equivalente a aproximadamente +12,1% respecto de la trayectoria estática en ese momento.

En conectividad, EVA presenta menos componentes que el orden estático en 19 de las 30 etapas, el mismo número en 9 y un número mayor sólo en 2. En promedio mantiene dos componentes menos durante el horizonte y ambos recorridos convergen finalmente a 119 componentes.

### Comparación con presupuestos equivalentes

Se compara el último estado alcanzable bajo cada trayectoria para fracciones del mismo presupuesto final de 21.079 MCLP.

| Presupuesto | Paso estático | Paso EVA | Delta valor EVA acumulado | Componentes estático | Componentes EVA | Delta componentes | Delta demanda acumulada |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 10% | 1 | 2 | +0,586 | 139 | 138 | -1 | +41,6% |
| 20% | 3 | 4 | +0,663 | 138 | 137 | -1 | +67,4% |
| 30% | 7 | 7 | +0,156 | 135 | 136 | +1 | +26,1% |
| 40% | 9 | 9 | +0,291 | 133 | 132 | -1 | +53,8% |
| 50% | 13 | 12 | +0,040 | 129 | 128 | -1 | +47,2% |
| 60% | 16 | 15 | +0,275 | 128 | 125 | -3 | +40,7% |
| 70% | 19 | 17 | +0,175 | 126 | 124 | -2 | +33,0% |
| 80% | 23 | 21 | +0,271 | 124 | 121 | -3 | +28,7% |
| 90% | 26 | 24 | +0,327 | 123 | 120 | -3 | +27,1% |
| 100% | 30 | 30 | +0,371 | 119 | 119 | 0 | ~0% |

El reordenamiento EVA presenta mayor valor decisional acumulado en los diez puntos presupuestarios. Respecto de componentes, es mejor en ocho puntos, igual al final y peor únicamente al 30% del presupuesto. Esto muestra que la ventaja observada no se explica sólo por ejecutar proyectos de distinto costo en cada paso.

No todas las dimensiones dominan simultáneamente: los ciclistas inducidos acumulados son menores bajo EVA en varios estados intermedios. Este resultado es coherente con una función RMC multicriterio y debe presentarse como trade-off, no como dominancia de Pareto.

### Secuencias

**Ranking estático inicial:**

`I12 → I14 → I26 → I30 → C066 → I11 → EP-ALAMEDA-T3 → I16 → I20 → I15 → I01 → C068 → EP-I34 → I22 → I09 → I08 → C006 → I05 → EP-I10 → I21 → I07 → I02 → I29 → C060 → C057 → I24 → I19 → I10 → C058 → EP-I33`

**EVA, reordenando exactamente los mismos treinta proyectos:**

`I12 → I26 → I11 → I30 → C066 → I14 → I10 → C068 → I19 → I16 → I22 → I21 → EP-ALAMEDA-T3 → EP-I34 → I20 → I01 → EP-I10 → EP-I33 → I15 → I09 → I29 → I24 → C060 → I02 → I08 → C058 → I07 → C057 → I05 → C006`

La red final es la misma; la trayectoria es distinta.

---

## Experimento 2 — EVA adaptativo abierto

### Diseño

Después de cada intervención se reevalúan todos los proyectos aún disponibles del conjunto factible de 124 proyectos. Por tanto, además de cambiar el orden, puede cambiar la composición del Top-30.

### Secuencia resultante

`I12 → I26 → I11 → I30 → C066 → C067 → I20 → C068 → I16 → I22 → I19 → I04 → I21 → EP-ALAMEDA-T3 → I10 → I01 → I27 → EP-I34 → EP-I10 → I25 → I09 → EP-I33 → C086 → I06 → C089 → C046 → C052 → C035 → C063 → I24`

### Cambio de composición

Entran al Top-30 adaptativo once proyectos que no estaban en el Top-30 inicial:

`C067, I04, I27, I25, C086, I06, C089, C046, C052, C035, C063`.

Son desplazados once proyectos del Top-30 inicial:

`I14, I15, I08, C006, I05, I07, I02, I29, C060, C057, C058`.

Algunos cambios son grandes:

- **C067 Cardenal Raúl Silva Henríquez:** ranking inicial 57; seleccionado en el paso 6.
- **C089 J J Pérez:** ranking inicial 85; seleccionado en el paso 25.
- **C046 Eucaliptos:** ranking inicial 78; seleccionado en el paso 26.
- **C052 Baquedano–Postales Oriente:** ranking inicial 83; seleccionado en el paso 27.
- **C035 Providencia:** ranking inicial 82; seleccionado en el paso 28.
- **I14 Lo Ovalle:** ranking inicial 2; no aparece entre los primeros 30 de la trayectoria abierta.
- **C006 Domingo Tocornal:** ranking inicial 17; tampoco aparece entre los primeros 30.

### Resultado agregado frente al orden estático inicial

Esta comparación ya no controla por conjunto final y debe interpretarse como resultado de una **política adaptativa de cartera**, no como efecto puro del orden.

| Métrica | Top-30 estático | EVA adaptativo abierto | Diferencia |
|---|---:|---:|---:|
| Costo acumulado, MCLP | 21.079 | 19.431 | -1.648 (-7,82%) |
| Valor EVA acumulado | 13,6681 | 15,3998 | +12,67% |
| Valor EVA descontado | 7,6399 | 8,4802 | +11,00% |
| Componentes finales | 119 | 114 | -5 |
| Población marginal acumulada | 436.666 | 506.807 | +16,06% |
| Demanda habilitada acumulada | 654.246 | 800.723 | +22,39% |
| Ciclistas inducidos acumulados | 3.765 | 3.313 | -12,01% |

La disminución de ciclistas inducidos confirma que el resultado no es una mejora simultánea en todos los criterios; es la trayectoria preferida por la función multicriterio RMC utilizada en el experimento.

---

## Interacciones durante la trayectoria

Se calcularon efectos dirigidos entre cada intervención ejecutada y todos los proyectos restantes:

`I_t(i,j) = S_j(G_{t+1}) - S_j(G_t)`.

En 3.255 efectos dirigidos observados:

- positivos: 421;
- negativos: 179;
- exactamente cero: 2.655;
- media firmada: +0,000927;
- media absoluta: 0,004710;
- |I| >= 0,005: 15,55%;
- |I| >= 0,01: 10,14%;
- |I| >= 0,025: 5,13%;
- |I| >= 0,05: 3,04%.

### Señales de habilitación/complementariedad

El efecto positivo más intenso es:

- **I26 San Pablo → C049 Federico Errázuriz:** score 0,329 → 0,561; rank 48 → 4; delta=+0,23169.

Un ejemplo directamente asociado a un proyecto que termina entrando tempranamente en la secuencia es:

- **I30 Walker–Hualle–Aguirre → C067 Cardenal Raúl Silva Henríquez:** score 0,317 → 0,543; rank 50 → 3; delta=+0,22604. Después C066 lo lleva a la primera posición y C067 es seleccionado en el paso 6, pese a haber partido en el lugar 57.

Otro ejemplo tardío:

- **EP-I10 Gran Avenida → C089 J J Pérez:** score 0,264 → 0,397; rank 80 → 8; delta=+0,13299. C089 había comenzado en el puesto 85 y termina siendo seleccionado en el paso 25.

### Señales de sustitución/pérdida de necesidad relativa

El efecto negativo más intenso es:

- **C068 San Carlos → C006 Domingo Tocornal:** score 0,490 → 0,227; rank 6 → 104; delta=-0,26322. C006 estaba originalmente en el lugar 17 y deja de aparecer en el Top-30 adaptativo.

También destaca:

- **I10 Gran Avenida → I14 Lo Ovalle:** score 0,515 → 0,364; rank 2 → 20; delta=-0,15113. I14 había comenzado como segundo proyecto del ranking inicial y no es seleccionado dentro de las primeras treinta intervenciones del plan adaptativo.

Estas señales no equivalen a una recomendación automática de eliminar los proyectos afectados. Indican que su contribución marginal, bajo la función EVA y en ese estado particular, disminuye después de otra intervención.

---

## Hallazgo adicional: la interacción también depende del estado

C049 Federico Errázuriz ilustra que las interdependencias no son necesariamente coeficientes fijos entre pares:

1. antes de I26 se encontraba en rank 48 con score 0,329;
2. ejecutar **I26 San Pablo** aumenta su score a 0,561 y lo lleva al rank 4 (`+0,23169`);
3. la siguiente intervención, **I11 José Joaquín Pérez**, reduce su score a 0,302 y lo lleva al rank 64 (`-0,25868`).

Por tanto, el mismo proyecto puede ser fuertemente habilitado en un estado y perder esa conveniencia en el estado inmediatamente siguiente. Esto respalda una formulación en la que la interacción debe escribirse como `I_t(i,j)` y no necesariamente como una constante `I(i,j)`.

---

## Implicación metodológica para el paper EDTR

La evidencia permite separar dos afirmaciones distintas:

1. **El orden importa aunque el plan final sea exactamente el mismo.** Con los mismos treinta proyectos, mismo costo y misma red final, la trayectoria EVA captura antes mayor valor decisional y mantiene una red menos fragmentada durante buena parte del proceso.
2. **Si la cartera se permite adaptar, también puede cambiar qué proyectos resulta conveniente ejecutar.** Proyectos inicialmente muy bajos pueden convertirse en prioritarios y proyectos inicialmente altos pueden perder relevancia relativa.

Esto permite formular EVA no sólo como un sistema de ranking, sino como un método para evaluar la **trayectoria de implementación de carteras y planes maestros de transporte**:

`G0 → p1 → G1 → reevaluación → p2 → G2 → …`

La contribución potencial del paper es incorporar explícitamente los estados intermedios entre la condición base y el horizonte de proyecto, permitiendo diagnosticar orden, habilitación, complementariedad, sustitución y revisión adaptativa de cartera.

## Archivos completos

La corrida completa generó CSV de trayectorias, panel candidato-etapa y 3.255 efectos dirigidos. El artifact de Actions conserva esos archivos; el experimento es reproducible mediante:

- `experiments/paper-plan-trajectory.js`
- `experiments/runner-plan-trajectory.html`
- `scripts/run-paper-plan-trajectory.mjs`
- `.github/workflows/paper-plan-trajectory.yml`
