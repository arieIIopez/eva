# EVA · cartera completa C/I · RMC vs Balanceado vs Logit

Generado: 2026-09-01T23:38:01.502Z. Interpretación poblacional actualizada: 2026-09-02.

- Universo modelado: 133.
- Conjunto factible: 124 proyectos Comunales + Intercomunales.
- Cada escenario ejecuta los 124 proyectos completos.
- Escenarios: RMC, Balanceado y Logit (escenario EVA `ciclistas_biogeme`; logit binario estimado con Biogeme).
- Normalización: fija en G0 sobre el mismo conjunto elegible.
- El costo es una variable de factibilidad/restricción y **no** el objetivo del experimento.
- Resultado principal de trayectoria: población marginal potencialmente beneficiada incorporada por cada proyecto y su acumulación a lo largo de la secuencia.

## Métricas poblacionales principales

Para la etapa t se registra la población marginal ΔP_t incorporada por la intervención seleccionada y la población acumulada P_t. Como las tres corridas terminan ejecutando las mismas 124 intervenciones, P_124=600.177 en los tres escenarios; el resultado relevante es **cuándo** se incorpora esa población.

La trayectoria se resume mediante el área bajo la curva acumulada A_P=Σ_t P_t (persona-etapa), el índice normalizado de captura temprana I_P=A_P/(124·P_124) y la etapa media ponderada del beneficiario.

| Escenario | Población proyecto 10 | A_P (persona-etapa) | I_P | Etapa media beneficiario | Etapa 50% |
|---|---:|---:|---:|---:|---:|
| RMC | 319.070 | 64.430.859 | 0,8658 | 17,65 | 9 |
| Balanceado | 283.945 | **64.836.416** | **0,8712** | **16,97** | 11 |
| Logit | 274.191 | 63.944.093 | 0,8592 | 18,46 | 12 |

RMC adelanta más población en las etapas iniciales y supera 50% de la cobertura final en el proyecto 9. Balanceado presenta el mayor rendimiento poblacional de la trayectoria completa: mayor A_P e I_P y menor etapa media ponderada. Logit posterga cobertura poblacional relativa al enfatizar ciclistas inducidos.

## Dependencia del estado

- Desplazamiento medio estático→secuencial: 20,50 (RMC), 18,79 (Balanceado) y 13,44 (Logit).
- RMC–Logit: Jaccard Top-10=0,429.
- Las diferencias de orden son relevantes porque modifican la curva de población potencialmente beneficiada aun cuando la cobertura final converja.

## Nota sobre look-ahead

El diagnóstico depth-2 previo optimiza el puntaje EVA, no la población. Por ello no debe interpretarse automáticamente como una mejora de la trayectoria poblacional. Medido mediante A_P, depth-2 cambia respecto del greedy en -93.016 persona-etapa bajo RMC (-0,14%), -97.374 bajo Balanceado (-0,15%) y +72.184 bajo Logit (+0,11%). Este resultado evidencia la necesidad de alinear la función de búsqueda con el resultado público que se pretende maximizar.

Archivos principales: `population_trajectory_summary.csv`, `scenario_summaries.csv`, `static_vs_sequential.csv`, `pairwise_scenario_order_comparison.csv`, `robust_core.csv`, `cross_evaluation_matrix.csv` y `normalization_reference.json`. `budget_checkpoints.csv` se conserva como control descriptivo, no como resultado principal.

La corrida completa se regenera con `.github/workflows/paper-full-portfolio-scenarios.yml`.
