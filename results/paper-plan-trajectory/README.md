# EVA · trayectoria de implementación

Resultados del experimento metodológico ejecutado el 2026-09-01 con Ponderación RMC, normalización fija en G0 y conjunto factible Comunal + Intercomunal.

## Hallazgo controlado

El orden estático y EVA reordenado contienen exactamente los mismos 30 proyectos, cuestan 21.079 MCLP y terminan con 119 componentes. Sin embargo, EVA obtiene 14,0389 puntos de valor decisional acumulado frente a 13,6681 (+2,71%), 8,0593 frente a 7,6399 con descuento delta=0,95 (+5,49%) y una reducción integrada de componentes de 422 frente a 362 (+16,57%). EVA mantiene en promedio 126,93 componentes durante la implementación frente a 128,93 del orden estático.

Con presupuestos equivalentes, EVA presenta mayor valor decisional acumulado en los diez puntos entre 10% y 100% del presupuesto; presenta menos componentes en ocho, igual al 100% y uno más al 30%.

## Hallazgo adaptativo

Al permitir que EVA reevalúe los 124 proyectos elegibles después de cada intervención, 11 proyectos entran al Top-30 y 11 del Top-30 inicial son desplazados. La secuencia adaptativa abierta termina las primeras 30 intervenciones con 114 componentes, costo 19.431 MCLP y valor EVA acumulado 15,3998.

La trayectoria registra 3.255 efectos dirigidos sobre proyectos restantes: 421 positivos, 179 negativos y 2.655 nulos. El efecto positivo más intenso observado es I26→C049 (+0,23169; rank 48→4) y el negativo más intenso C068→C006 (-0,26322; rank 6→104).

## Interpretación

El experimento 1 demuestra que el orden puede importar aun cuando el plan final sea idéntico. El experimento 2 muestra que, cuando la cartera puede adaptarse, el cambio de estado puede modificar además qué proyectos conviene programar. Los efectos positivos y negativos se interpretan como señales de complementariedad/habilitación y sustitución/pérdida de necesidad relativa, no como decisiones automáticas de construir o eliminar.

El análisis extendido, secuencias completas, ejemplos y cautelas metodológicas están en `docs/paper/PLAN_TRAJECTORY_RESULTS_2026-09-01.md`.

Archivos persistidos:

- `order_only_summary.csv`
- `order_only_budget_comparison.csv`
- `adaptive_open_summary.csv`
- `adaptive_open_transition_summary.csv`

La corrida completa, incluidos panel candidato-etapa y efectos dirigidos, es reproducible con `experiments/paper-plan-trajectory.js` y `scripts/run-paper-plan-trajectory.mjs`.
