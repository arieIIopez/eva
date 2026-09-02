# EVA · cartera completa C/I · RMC vs Balanceado vs Logit

Generado: 2026-09-01T23:38:01.502Z

- Universo modelado: 133.
- Conjunto factible: 124 proyectos Comunales + Intercomunales.
- Cada escenario ejecuta los 124 proyectos completos.
- Escenarios: RMC, Balanceado y Logit (escenario EVA `ciclistas_biogeme`; logit binario estimado con Biogeme).
- Normalización: fija en G0 sobre el mismo conjunto elegible.
- Invariantes: mismo conjunto final=true; mismo costo final=true; mismos componentes finales=true.
- Costo final común: 43.887 MCLP.
- Componentes finales comunes: 105.

## Regla de comparación

Los puntajes propios de RMC, Balanceado y Logit no se comparan directamente como una escala normativa común. Se comparan órdenes, métricas estructurales/físicas y una matriz de evaluación cruzada: cada trayectoria es evaluada bajo cada uno de los tres vectores W.

## Hallazgos principales

- Dependencia del estado robusta bajo los tres W: desplazamiento medio estático→secuencial de 20,50 (RMC), 18,79 (Balanceado) y 13,44 (Logit).
- RMC–Logit es la mayor divergencia temprana: Jaccard Top-10=0,429.
- Balanceado obtiene la menor fragmentación media (110,73 componentes) y mayor reducción integrada de componentes (3.753).
- La matriz cruzada muestra que la regla voraz no garantiza maximizar el valor acumulado de horizonte bajo su propio W; no se interpreta como prueba de optimalidad de Balanceado.

Archivos principales: `scenario_summaries.csv`, `static_vs_sequential.csv`, `pairwise_scenario_order_comparison.csv`, `budget_checkpoints.csv`, `robust_core.csv`, `cross_evaluation_matrix.csv` y `normalization_reference.json`.

La corrida completa se regenera con `.github/workflows/paper-full-portfolio-scenarios.yml`.
