# Paper EDTR · índice para revisión y reproducibilidad

## Evaluación de trayectorias de implementación en redes de transporte: método EVA para la secuenciación dependiente del estado

Esta carpeta reúne la documentación científica, metodológica y computacional que respalda el paper. Para una revisión externa se recomienda comenzar por los siguientes documentos, en este orden.

## Documentos vigentes

1. **[Suplemento técnico completo de cálculos](./SUPLEMENTO_TECNICO_CALCULOS_EDTR_2026-09-04.md)**  
   Explica la arquitectura matemática de EVA, construcción de `G_0`, conjunto factible, normalización, score, doce perfiles de política, algoritmo secuencial, métricas de trayectoria, saturación P–OD, suficiencia Population-first/OD-first, interacciones, Pareto, sensibilidad, figuras y trazabilidad archivo por archivo.

2. **[Referencias APA 7 con DOI](./REFERENCIAS_APA_DOI.md)**  
   Bibliografía del paper y del suplemento con enlaces DOI persistentes; incluye la referencia citable de EVA y la fuente institucional PMTUM.

3. **[Cursor científico vigente](./CURRENT_STATE_EDTR_2026-09-04.md)**  
   Estado de avance, correcciones cerradas, cifras autoritativas y próximos pasos. Este archivo prevalece sobre cursores anteriores.

4. **[Ecuaciones en LaTeX](./EQUATIONS_LATEX_2026-09-01.tex)**  
   Archivo histórico de apoyo. Para la formulación vigente debe preferirse el suplemento técnico y el manuscrito actual, porque algunas ecuaciones fueron refinadas después del 1 de septiembre.

## Resultado principal reproducible

La corrida autoritativa de doce escenarios está en:

[`../../results/paper-all-scenarios-benefits/`](../../results/paper-all-scenarios-benefits/)

Snapshot de resultados del paper:

`376a5e355d7086371fa89ca827262c7c089e4897`

Valores de control:

| Control | Valor |
|---|---:|
| Proyectos modelados | 133 |
| Proyectos elegibles | 124 |
| Ejes de red existentes fuente | 601 |
| Ejes efectivos en `G_0` | 576 |
| Componentes en `G_0` | 142 |
| Componentes finales | 107 |
| Reducción final | 35 |
| Nuevo acceso final común | 600.177 ocupados |
| Costo proxy final común | 43.887 MCLP |
| Mejor `I_P` | Educación superior ≈ 0,887 |
| Mejor `I_D` | Demanda potencial ≈ 0,913 |
| Mejor `I_C` | Continuidad ≈ 0,901 |
| Population-first | 42 proyectos |
| OD-first | 52 proyectos |

## Figuras reproducibles

- [Saturación conjunta población–OD](../../results/paper-all-scenarios-benefits/figure_saturation_population_od.svg)
- [Frontera población–OD](../../results/paper-all-scenarios-benefits/figure_population_connection_frontier.svg)
- [Volatilidad de ranking](../../results/paper-all-scenarios-benefits/figure_rank_volatility_top30.svg)
- [Heatmap 124×12](../../results/paper-all-scenarios-benefits/figure_rank_heatmap_124x12.svg)

## Mapa de experimentos

| Experimento | Código | Resultados |
|---|---|---|
| 12 escenarios completos | `experiments/paper-all-scenarios-benefits.js` | `results/paper-all-scenarios-benefits/` |
| Population-first | `experiments/paper-population-first-only.js` | `results/paper-population-first-only/` |
| OD-first | `experiments/paper-od-first-only.js` | `results/paper-od-first-only/` |
| Trayectoria e interacciones | `experiments/paper-plan-trajectory.js` | `results/paper-plan-trajectory/` |
| Diagnósticos RMC/sensibilidad | `experiments/paper-experiments-fast.js` | `results/paper-experiments/2026-09-01-rmc-eligible/` |
| Rollout profundidad 2 | `experiments/paper-lookahead-depth2.js` | `results/paper-lookahead-depth2/` |

## Advertencia sobre archivos históricos

Parte de la carpeta conserva experimentos y notas previas para trazabilidad. En particular, documentos anteriores pueden contener **105 componentes finales** o `I_C≈0,8766`. Esos números corresponden a una definición experimental de red anterior a la unificación de `effective-network.js` y son **obsoletos para el paper vigente**.

Para las cifras topológicas del manuscrito actual deben usarse exclusivamente los resultados corregidos: `G_0=142`, final `=107`, reducción `=35`, y Continuidad `A_C=3909`, `I_C≈0,900691`.

## Regla de lectura

- **Resultado del paper:** priorizar archivos regenerados después de la corrección de red efectiva.
- **Diagnóstico de mecanismo:** pueden consultarse experimentos anteriores de interacción/rollout, pero sin reutilizar sus cifras topológicas obsoletas.
- **Novedad científica:** EVA no reclama haber descubierto que el orden importa ni reemplaza optimización global, evaluación social o modelación estratégica. Su aporte es una arquitectura auditable para evaluar trayectorias y dependencia de secuencia de una cartera.
