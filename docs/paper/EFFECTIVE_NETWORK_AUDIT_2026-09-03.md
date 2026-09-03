# Auditoría de coherencia del estado de red — paper EVA/EDTR

Fecha: 2026-09-03

## Hallazgo

La auditoría detectó que los experimentos del paper mezclaban dos representaciones de la red existente en una misma iteración.

El motor operativo `ENGINE.run()` aplica, para `perfil: "general"`, una red efectiva `effExisting` que excluye tipologías de alto estrés `piloto`, `zona30` y `otro` antes de construir componentes y evaluar accesibilidad/conectividad. Sin embargo, scripts científicos como `paper-all-scenarios-benefits.js` y `paper-experiments-fast.js` reconstruían `componentes_red` directamente sobre `window.existingFC`, es decir, sobre la red bruta. Otros módulos dinámicos del laboratorio también recibían la variable global `window.existingFC`.

La consecuencia es una incoherencia de estado: el score y parte de los beneficios podían calcularse sobre el estado efectivo del motor mientras `C_t` y otros diagnósticos podían observar la red bruta.

## Corrección aplicada

Se creó `experiments/effective-network.js`, sólo para el laboratorio científico. Antes de marcar cada runner como listo:

1. conserva la red bruta en `window.__EVA_EXISTING_RAW_EXPERIMENT`;
2. construye la red efectiva correspondiente al perfil experimental;
3. reemplaza `window.existingFC` por esa red efectiva para que ENGINE, FRACTAL, DEMANDA_MODAL y los diagnósticos de componentes observen un mismo `G_0`;
4. registra conteos y tipologías excluidas para trazabilidad.

La aplicación pública no fue modificada por esta corrección.

Commits iniciales:

- `80e953ab556a5f2fd3dcd819b61a2278c817a71d` — helper de red efectiva;
- `96abe33ab59439b00d314b921895a85068588c0c` — runner científico general;
- `48ddf2144166f636d84b24c2cc1eaa1f972451f7` — runner de doce escenarios.

## Diagnóstico reproducible

Se añadió:

- `scripts/diagnose-effective-network.mjs`;
- workflow `Diagnose effective network`.

Run #1: `33778126567`, conclusión `success`.

Resultado con tolerancia de conectividad de 150 m:

| Magnitud | Red bruta | Red efectiva perfil general |
|---|---:|---:|
| Ejes existentes | 601 | 576 |
| Ejes excluidos | — | 25 |
| Componentes en G0 | 141 | 142 |
| Componentes tras incorporar los 124 proyectos C/I | 105 | 107 |
| Reducción total de componentes | 36 | 35 |

Tipologías excluidas de la red efectiva:

- `piloto`: 17 ejes;
- `otro`: 7 ejes;
- `zona30`: 1 eje.

Conjunto factible usado en el diagnóstico: 124 proyectos (88 comunales + 36 intercomunales).

## Consecuencias científicas

Quedan invalidados para el paper, hasta completar el recálculo:

- el valor final `105 componentes`;
- la reducción final de `36 componentes`;
- `A_C=3913 componente-etapa` de Continuidad de red;
- `I_C=0.876568...` y su redondeo `0,877`;
- los hitos topológicos calculados con la red bruta;
- la frontera tridimensional que incorporaba la dimensión topológica y agregaba Integración/Continuidad.

Ya puede afirmarse que, bajo la definición coherente con el motor y `perfil: "general"`, el estado topológico va de **142 a 107 componentes**, con reducción final de **35**.

Aún no deben modificarse como definitivos `I_C`, `A_C`, hitos topológicos ni la frontera 3D hasta completar la corrida secuencial bajo la red efectiva.

## Alcance potencial más amplio

La inconsistencia no se limita conceptualmente al contador de componentes, porque algunos módulos experimentales dinámicos recibían `window.existingFC` directamente. Por ello deben compararse también, después del recálculo:

- secuencias y rankings;
- `I_P` y `I_D`;
- robustez Top-k;
- efectos de interacción;
- Population-first y OD-first;
- lookahead y sensibilidad.

Si estos resultados cambian, la misma definición de `G_0` deberá propagarse a todos los runners especializados antes de congelar v3.13.0.

## Cambios requeridos en el manuscrito

Después de estabilizar la batería experimental:

1. declarar explícitamente que la validación usa `perfil general`;
2. distinguir red bruta/provenance (601 ejes) de red efectiva `G_0` (576 ejes);
3. reportar `G_0` topológico = 142 componentes y estado final C/I = 107;
4. reemplazar todos los valores de `A_C`, `I_C` y fronteras topológicas por los recalculados;
5. sustituir en §5.1 la expresión ambigua según la cual los corredores MET “permanecen en la base modelada”: permanecen en el **universo modelado**, pero están fuera de `P^f_0` y no son infraestructura existente;
6. mantener separados universo modelado `P`, conjunto factible `P^f_t` y estado físico `G_t`.

No volver a utilizar los valores topológicos anteriores como evidencia autoritativa.
