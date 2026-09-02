# Look-ahead depth-2 completo · RMC, Balanceado y Logit

Fecha: 2026-09-02

## Objetivo

Comprobar si la limitación de miopía observada en la heurística voraz de EVA puede reducirse mediante una anticipación local de dos pasos en la cartera completa, sin formular ni reclamar una optimización global.

## Diseño

- Universo modelado: 133 proyectos.
- Conjunto factible: 124 proyectos Comunales + Intercomunales.
- Escenarios: RMC, Balanceado y Logit (Biogeme).
- Cada escenario ejecuta los 124 proyectos completos.
- Normalización: fija en G0 sobre las 124 alternativas elegibles.
- Estrategia topológica: Alameda, tolerancia 100 m, alpha=0,5.
- Descuento por etapa: delta=0,95.
- Baseline: EVA greedy, selección del mayor S_t contemporáneo.
- Look-ahead: profundidad 2 con shortlist K=3 de primeras alternativas. En cada etapa se selecciona p maximizando

  L2(p|G_t) = S_t(p) + delta * max_q S_{t+1}(q | T_p(G_t)).

- K=3 es un límite computacional de búsqueda, no un parámetro normativo de EVA.
- No se garantiza óptimo global.

## Resultados principales

| Escenario | Δ valor propio acumulado | Δ valor propio descontado | Δ componentes medios | Δ reducción integrada de componentes |
|---|---:|---:|---:|---:|
| RMC | +0,845% | +1,920% | +0,161 | -20 (-0,553%) |
| Balanceado | +0,435% | +0,882% | +0,105 | -13 (-0,346%) |
| Logit | +0,366% | +0,739% | -0,040 | +5 (+0,137%) |

La anticipación mejora el valor decisional acumulado bajo las tres funciones objetivo. La mayor ganancia se observa en RMC. Sin embargo, no existe dominancia estructural: RMC y Balanceado presentan una fragmentación media levemente mayor con depth-2, mientras Logit mejora muy ligeramente la reducción integrada de componentes.

Las tres variantes depth-2 seleccionan I14 como primera intervención. Frente a greedy, la divergencia aparece en el paso 1 en los tres escenarios. El efecto sobre la composición temprana es mayor en RMC y Balanceado y menor en Logit:

| Escenario | Jaccard Top-10 | Top-20 | Top-30 | Top-50 |
|---|---:|---:|---:|---:|
| RMC | 0,429 | 0,739 | 0,875 | 1,000 |
| Balanceado | 0,538 | 0,818 | 0,875 | 1,000 |
| Logit | 1,000 | 0,905 | 1,000 | 1,000 |

Por tanto, la anticipación local altera sobre todo las primeras etapas; a partir del Top-50 las secuencias contienen el mismo subconjunto bajo cada W, aunque el orden interno puede haber cambiado antes.

## Evaluación cruzada de las trayectorias depth-2

La secuencia depth-2 generada bajo Balanceado sigue obteniendo el mayor valor acumulado entre las tres trayectorias depth-2 bajo los tres evaluadores: 45,115 bajo RMC, 39,471 bajo Balanceado y 35,827 bajo Logit. Esto no prueba optimalidad de Balanceado; confirma que incluso con anticipación de dos pasos queda espacio entre una heurística local y el problema global de horizonte completo.

## Interpretación para el paper

El resultado completa la evidencia sobre miopía algorítmica:

1. La evaluación cruzada de las trayectorias greedy ya mostraba que la secuencia generada por cada W no necesariamente maximizaba su propio valor acumulado.
2. El rollout depth-2 mejora sistemáticamente el valor propio de cada W, por lo que parte de esa brecha es corregible mediante anticipación local.
3. Las ganancias son moderadas (<1% sin descuento y <2% con descuento por etapa), y no implican mejora simultánea de todas las métricas físicas.
4. Por ello el aporte principal de EVA continúa siendo la evaluación dependiente del estado y de la trayectoria. El look-ahead se presenta como extensión metodológica y no como redefinición del método base.

## Reproducibilidad

- Workflow: `.github/workflows/paper-lookahead-depth2.yml`
- Experimento: `experiments/paper-lookahead-depth2.js`
- Runner: `experiments/runner-lookahead-depth2.html`
- Exportador: `scripts/run-paper-lookahead-depth2.mjs`
- GitHub Actions run: `33586498458`
- Artifact: `eva-paper-lookahead-depth2`, id `9831563607`
- SHA256 artifact: `708b537f87bc851065d5c4fee59dfaeeb6f39f1e49f84e6be2de69b28bd42658`
