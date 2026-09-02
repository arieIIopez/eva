# Diagnóstico exploratorio de anticipación · RMC · 30 pasos

Fecha: 2026-09-02

## Objetivo

Comprobar si la limitación de miopía observada en la heurística voraz de EVA puede reducirse mediante una anticipación local de dos pasos, sin formular un problema de optimización global.

## Diseño

- Universo modelado: 133 proyectos.
- Conjunto factible: 124 proyectos Comunales + Intercomunales.
- Escenario: RMC.
- Horizonte diagnóstico: primeras 30 decisiones.
- Normalización: fija en G0 sobre las 124 alternativas elegibles.
- Estrategia topológica: Alameda, tolerancia 100 m, alpha=0,5.
- Descuento por etapa: delta=0,95.
- Baseline: EVA greedy, selección del mayor S_t contemporáneo.
- Look-ahead: profundidad 2 con shortlist K=3. En cada etapa se comparan los tres candidatos contemporáneos mejor evaluados y se elige p según
  L2(p|G_t) = S_t(p) + delta * max_q S_{t+1}(q | T_p(G_t)).
- K=3 es un límite computacional del diagnóstico, no un parámetro normativo de EVA.
- La prueba no garantiza optimalidad global.

## Resultados

| Métrica al paso 30 | Greedy | Look-ahead depth-2 Top-3 | Diferencia |
|---|---:|---:|---:|
| Valor decisional acumulado RMC | 15,399817 | 15,665901 | +0,266084 (+1,73%) |
| Valor descontado por etapa | 8,480210 | 8,656349 | +0,176139 (+2,08%) |
| Componentes de red | 114 | 114 | 0 |
| Demanda habilitada acumulada | 800.723 | 791.263 | -9.460 (-1,18%) |
| Ciclistas inducidos acumulados | 3.313 | 3.498 | +185 (+5,58%) |
| Jaccard del conjunto Top-30 | — | — | 0,875 (28/30 comunes) |

El look-ahead cambia la primera decisión: el greedy selecciona I12, mientras la anticipación elige I14. Para I14, la puntuación inmediata es menor que la de I12, pero su valor de dos etapas es mayor bajo la regla L2; esto representa directamente el mecanismo que la heurística greedy no observa.

Los dos conjuntos Top-30 comparten 28 proyectos. Sólo greedy: I10 y C063. Sólo look-ahead: I14 e I03.

## Interpretación

La anticipación limitada mejora moderadamente la función decisional RMC acumulada y descontada, por lo que la miopía detectada en la evaluación cruzada no es sólo un artefacto de comparar vectores W diferentes. Sin embargo, no existe dominancia de Pareto: al paso 30 ambos recorridos presentan la misma fragmentación; el look-ahead habilita menos demanda acumulada y más ciclistas inducidos.

La conclusión defendible es que una pequeña dosis de anticipación puede corregir parcialmente la heurística voraz, pero el rendimiento depende del criterio observado y del horizonte de búsqueda. El resultado se mantiene como diagnóstico complementario del paper y no modifica la definición principal de EVA ni permite reclamar optimalidad.

## Reproducibilidad

- Workflow: `.github/workflows/paper-lookahead-rmc30.yml`
- Experimento: `experiments/paper-lookahead-rmc30.js`
- Runner: `experiments/runner-lookahead-rmc30.html`
- Exportador: `scripts/run-paper-lookahead-rmc30.mjs`
- GitHub Actions run: `33586634064`
- Artifact: `eva-paper-lookahead-rmc30`, id `9830480538`
