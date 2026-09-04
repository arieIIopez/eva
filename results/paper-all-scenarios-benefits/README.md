# EVA · 12 escenarios · posiciones, beneficios y saturación

Generado: 2026-09-03T18:28:53.555Z

> **Estado autoritativo del paper:** estas salidas corresponden al rerun corregido que unifica la definición de red efectiva entre motor y diagnósticos. Para la topología del paper usar `G0 = 142` componentes y estado final común `= 107` componentes. Véase `docs/paper/SUPLEMENTO_TECNICO_CALCULOS_EDTR_2026-09-04.md`.

- Universo modelado: 133.
- Conjunto factible: 124 proyectos Comunales + Intercomunales.
- Escenarios predefinidos ejecutados: 12.
- Normalización: fija en G0 sobre el mismo conjunto elegible.
- Beneficios comunes observados: población marginal, demanda OD habilitada y reducción de componentes.
- Estado físico final: misma cartera de 124 proyectos en los doce escenarios.

## Interpretación

Como todos los escenarios ejecutan la misma cartera completa, el estado final converge. La comparación relevante es el **orden** y el **momento en que se capturan los beneficios**.

Los hitos 50/75/90/95/99% describen **concentración temprana y una cola de captura lenta**. No deben interpretarse por sí solos como demostración de rendimientos marginales decrecientes en sentido económico ni como beneficio marginal cero.

La afirmación de suficiencia requiere una prueba distinta y objetivo-específica. En el paper se implementan:

- `Population-first`: detención cuando no existe ganancia poblacional directa ni habilitada a un paso;
- `OD-first`: detención análoga para habilitación OD.

Por lo tanto:

- **umbral 95/99%** = diagnóstico descriptivo de trayectoria;
- **t\*** Population-first/OD-first = condición de suficiencia bajo una métrica y horizonte de habilitación explícitos.

## Archivos principales

- `scenario_benefit_summary.csv`: resumen de áreas, índices e hitos por escenario.
- `project_rank_matrix_12_scenarios.csv`: posición de cada proyecto en los doce perfiles.
- `project_rank_variability.csv`: amplitud y frecuencia Top-k por proyecto.
- `pareto_population_connection.csv`: frontera población–OD.
- `best_scenario_by_stage.csv`: perfil líder por etapa y resultado.
- `*_full_sequence.csv`: secuencia completa y resultados marginales/acumulados de cada escenario.
- `*_initial_ranking.csv`: ranking estático en G0 por escenario.
- `*_weights.json`: vector W efectivamente utilizado.
- `normalization_reference.json`: escalas fijas de normalización en G0.

## Figuras reproducibles

- `figure_saturation_population_od.svg`
- `figure_population_connection_frontier.svg`
- `figure_rank_volatility_top30.svg`
- `figure_rank_heatmap_124x12.svg`

## Documentación de cálculo

Para ecuaciones, algoritmos, pseudocódigo, tablas, sensibilidad y trazabilidad completa, consultar:

- `docs/paper/SUPLEMENTO_TECNICO_CALCULOS_EDTR_2026-09-04.md`
- `docs/paper/REFERENCIAS_APA_DOI.md`
- `docs/paper/README.md`
