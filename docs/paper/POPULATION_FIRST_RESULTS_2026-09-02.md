# Resultado Population-first para manuscrito EDTR — 2026-09-02

## Hallazgo

La política Population-first alcanza la cobertura poblacional final de referencia (600.177 personas) después de 42 de los 124 proyectos elegibles. En el estado 43 quedan 82 alternativas con población marginal directa igual a cero. La prueba exhaustiva de habilitación de un paso tampoco identifica nueva población (`best_one_step_enabled_population = 0`). Por ello se activa la condición endógena de detención.

Esto constituye evidencia empírica de **suficiencia respecto del objetivo poblacional modelado**, no de innecesariedad general de los proyectos restantes.

## Métricas

- Proyectos ejecutados: 42/124.
- Proyectos restantes: 82.
- Población al detenerse: 600.177 (100% de la referencia alcanzada por las carteras completas).
- 50%: etapa 8.
- 75%: etapa 15.
- 90%: etapa 23.
- 95%: etapa 28.
- 99%: etapa 35.
- A_P a horizonte común de 124 etapas: 68.838.193 persona-etapa.
- I_P: 0,92497.
- Costo acumulado descriptivo al detenerse: 20.631 MCLP. El costo no es la función objetivo de Population-first.
- Proyectos de población directa cero ejecutados como habilitantes: 0.

Comparación de I_P:
- Population-first: 0,92497.
- Balanceado: 0,87120.
- RMC: 0,86575.
- Logit: 0,85921.

Comparación de A_P:
- Population-first: 68.838.193.
- Balanceado: 64.836.416.
- RMC: 64.430.859.
- Logit: 63.944.093.

El A_P de Population-first supera a Balanceado en 4.001.777 persona-etapa (+6,17%), a RMC en 4.407.334 (+6,84%) y a Logit en 4.894.100 (+7,65%). Estas diferencias son esperables porque Population-first selecciona directamente por el resultado poblacional, mientras las otras trayectorias son generadas por funciones multicriterio W.

## Interpretación para el paper

La evidencia permite distinguir tres preguntas distintas:

1. **qué proyecto selecciona una función multicriterio en el estado actual** (`S_t`);
2. **qué tan favorable es la trayectoria resultante respecto de un resultado público declarado** (`A_P`, `I_P`);
3. **cuándo la cartera deja de producir ganancia marginal observable respecto de ese objetivo**, aun cuando permanezcan proyectos con valor en otras dimensiones.

El punto 3 permite introducir la noción de suficiencia condicionada al objetivo. Bajo población y horizonte de habilitación de un paso, ejecutar automáticamente los 124 proyectos no es necesario para alcanzar la cobertura poblacional final modelada: 42 intervenciones bastan dentro de esta representación. Los 82 proyectos restantes deben ser reevaluados respecto de otros objetivos o de interacciones de mayor profundidad.

## Cautelas obligatorias

- No afirmar que 82 proyectos son innecesarios en términos generales.
- No interpretar población potencialmente beneficiada como demanda observada, bienestar monetario o causalidad individual.
- No afirmar optimalidad global de Population-first.
- La habilitación se prueba sólo a un paso; pueden existir cadenas de dos o más proyectos cero que generen valor poblacional posterior.
- El resultado es específico de la cartera, definición de población marginal, red base, geometrías y parámetros del experimento.

## Fuente reproducible

- `results/paper-population-first-only/`
- `experiments/paper-population-first-only.js`
- `.github/workflows/paper-population-first-only.yml`
- Run GitHub Actions: `33645812740`.
