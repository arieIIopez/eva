# Corrección del estado de red efectivo en los experimentos EDTR

Fecha: 2026-09-03

## Problema detectado

La aplicación operacional EVA trabaja con un perfil de usuario. Bajo `perfil: "general"`, `ENGINE.run` excluye de la red existente los ejes cuyo `tipoNorm` corresponde a `piloto`, `zona30` u `otro`. Parte de los runners científicos mantenía, sin embargo, `window.existingFC` como la red bruta para módulos auxiliares como FRACTAL y diagnósticos de componentes. Esto podía mezclar dos definiciones distintas de `G0` dentro de una misma corrida.

La corrección metodológica exige que **todos los módulos científicos compartan exactamente el mismo estado inicial efectivo** antes de calcular scores, accesibilidad, demanda, topología o estrategias dendríticas.

## Diagnóstico reproducible

Workflow: `Diagnose effective network`, run `33778126567`, conclusión `success`.

Con `connectTol = 150 m` y los 124 proyectos C/I elegibles:

- red existente bruta: 601 ejes;
- red existente efectiva bajo perfil general: 576 ejes;
- ejes excluidos: 25 = 17 `piloto` + 7 `otro` + 1 `zona30`;
- componentes iniciales con red bruta: 141;
- componentes finales con red bruta: 105;
- reducción bruta: 36;
- componentes iniciales con red efectiva: 142;
- componentes finales con red efectiva: 107;
- reducción efectiva: 35.

Por tanto, las cifras topológicas `141 -> 105` y reducción `36` usadas en outputs previos **no son compatibles con el estado de red efectivo del motor** y deben ser sustituidas por resultados regenerados.

## Corrección implementada

Se agregó `experiments/effective-network.js`, que conserva una copia de la red bruta y expone como `window.existingFC` la red efectiva correspondiente al perfil experimental. Los runners científicos deben cargar esta capa después de `engine.jsx` y antes de ejecutar experimentos, y aplicar:

```js
const experimentParams = { ...(window.PARAM_DEFAULTS || {}), perfil: "general", segKSI: false };
window.EVA_EXPERIMENT_NETWORK_API.apply(experimentParams);
```

Runners ya alineados:

- `experiments/runner.html`;
- `experiments/runner-all-scenarios-benefits.html`;
- `experiments/runner-population-first-only.html`;
- `experiments/runner-od-first-only.html`;
- `experiments/runner-connectivity-first-only.html`.

Commits principales:

- `80e953ab556a5f2fd3dcd819b61a2278c817a71d` — Align paper experiments with effective network state.
- `96abe33ab59439b00d314b921895a85068588c0c` — Use one effective G0 across paper experiments.
- `48ddf2144166f636d84b24c2cc1eaa1f972451f7` — Align 12-scenario runner with effective network state.
- `424319a28a2540821caae3545c6bf7d024d3ab96` — Align Population-first runner with effective network state.
- `033fd8c6b66a01ffc6d1d763410093c639ffa2bf` — Align OD-first runner with effective network state.
- `2503dc073c3281d5ced66b341d2a62454c6c88b0` — Align Connectivity-first runner with effective network state.

## Consecuencia para los resultados del paper

Hasta completar las corridas regeneradas, deben considerarse provisionales todos los resultados que puedan depender del estado auxiliar de red, en particular:

- número e integral de componentes `C_t`;
- `I_C`;
- comparaciones tridimensionales o fronteras que incorporen topología;
- posiciones de proyectos en escenarios donde FRACTAL o atributos relacionales dependan del estado global;
- por extensión, cualquier trayectoria P u OD cuyo orden pueda cambiar por esa reevaluación.

Esto no invalida la formulación general del método EVA ni la conclusión de que un plan debe evaluar su trayectoria. La corrección refuerza precisamente el principio metodológico del artículo: `G_t` debe ser único, explícito y compartido por todas las capas de evaluación.

## Criterio de cierre

No volver a insertar en el manuscrito cifras `I_C`, ranking topológico, frontera 3D ni resultados cruzados de los doce escenarios hasta que:

1. termine con éxito el workflow `Paper all scenarios benefits` iniciado desde `48ddf214...`;
2. terminen las corridas Population-first, OD-first y Connectivity-first bajo la red efectiva;
3. se comparen outputs antiguos y nuevos para determinar qué resultados cambiaron;
4. se regenere la documentación de resultados y figuras desde las salidas corregidas.
