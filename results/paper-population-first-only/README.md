# Population-first: suficiencia poblacional

Fecha de corrida: 2026-09-02.

## Diseño

- Universo elegible: 124 proyectos comunales e intercomunales.
- Población final de referencia: 600.177 personas.
- Regla: seleccionar en cada estado el proyecto con mayor población marginal directa `DeltaP`.
- Si todas las alternativas restantes tienen `DeltaP = 0`, probar exhaustivamente cada una como puente de un paso y medir la mayor población marginal disponible en el estado siguiente.
- Detención: si no existe ganancia poblacional directa ni habilitación positiva a un paso.
- La regla es voraz y no garantiza óptimo global.

## Resultado principal

Population-first alcanza las 600.177 personas de cobertura de referencia después de 42 proyectos. En el estado siguiente quedan 82 proyectos, todos con población marginal directa igual a cero; la búsqueda exhaustiva de habilitación a un paso también retorna cero. La corrida se detiene, por tanto, por `no_direct_or_one_step_population_gain`.

La detención no implica que los 82 proyectos restantes carezcan de valor. Significa únicamente que, bajo la métrica de nueva cobertura poblacional y el horizonte de habilitación de un paso, su justificación marginal ya no procede de ese objetivo. Pueden conservar valor por seguridad, equidad, habilitación OD, resiliencia, conectividad u otros objetivos.

## Captura poblacional

| Indicador | Population-first |
|---|---:|
| Proyectos ejecutados hasta suficiencia | 42 |
| Proyectos restantes | 82 |
| Población al detenerse | 600.177 |
| Fracción de la cobertura final | 1,000 |
| 50% de cobertura | etapa 8 |
| 75% | etapa 15 |
| 90% | etapa 23 |
| 95% | etapa 28 |
| 99% | etapa 35 |
| A_P, horizonte común 124 | 68.838.193 persona-etapa |
| I_P | 0,92497 |
| Proyectos cero ejecutados como habilitantes | 0 |

Como referencia, las corridas completas producen I_P=0,86575 (RMC), 0,87120 (Balanceado) y 0,85921 (Logit). Population-first no es directamente comparable como política multicriterio: se introduce para evaluar cuánto de la cartera es suficiente respecto del objetivo específico de nueva cobertura poblacional.

## Archivos

- `population_first_sequence.csv`: 42 intervenciones ejecutadas y población marginal por etapa.
- `population_first_summary.csv`: resumen compacto del punto de detención.
- `remaining_projects.csv`: 82 alternativas remanentes al alcanzar suficiencia poblacional.

Código del experimento: `experiments/paper-population-first-only.js`.
Workflow reproducible: `.github/workflows/paper-population-first-only.yml`.
Run de referencia: GitHub Actions `33645812740`.
