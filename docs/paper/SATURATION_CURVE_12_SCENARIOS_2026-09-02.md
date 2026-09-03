# EDTR · Curva de captura conjunta población–conexión

Fecha: 2026-09-02/03

## Definición

Para cada escenario `W` y porcentaje `γ`, se define la etapa conjunta de captura como la primera etapa en que se ha alcanzado al menos `γ` de la población final y al menos `γ` de la habilitación OD final:

`t_W^(γ) = max(t_P,W^(γ), t_D,W^(γ))`.

No es un criterio de beneficio cero. Es una medida de **saturación práctica** que permite observar cuándo la trayectoria entra en una cola de rendimientos decrecientes.

## Escenarios no dominados al considerar población, OD y conexión topológica

La frontera tridimensional de los doce escenarios predefinidos contiene:

- Educación superior;
- Demanda potencial;
- Integración metropolitana;
- Continuidad de red.

Para estos cuatro perfiles eficientes, los umbrales conjuntos son:

| Escenario | 50% | 75% | 90% | 95% | 99% |
|---|---:|---:|---:|---:|---:|
| Educación superior | 10 | 17 | 34 | 44 | 117 |
| Integración metropolitana | 12 | 21 | 37 | 44 | 118 |
| Demanda potencial | 12 | 19 | 36 | 48 | 118 |
| Continuidad de red | 12 | 25 | 40 | 57 | 120 |

## Hallazgo

La curva tiene una forma de dos regímenes. En los cuatro escenarios eficientes se captura 90% del resultado conjunto con 34–40 proyectos y 95% con 44–57. Sin embargo, llegar a 99% requiere 117–120 proyectos.

Esto significa que una gran parte de la cartera posterior al umbral de 95% contribuye sólo a una fracción pequeña del resultado final en población y habilitación OD. No corresponde concluir que esos proyectos tengan beneficio nulo: pueden conservar aportes en seguridad, equidad, conexión topológica, ciclistas inducidos u otros criterios. La conclusión correcta es que existe una **cola extensa de rendimientos decrecientes respecto de los dos resultados declarados**.

El experimento Population-first es distinto: allí la suficiencia poblacional exacta se alcanza en `t*=42`, porque la política y la regla de detención están construidas sobre población marginal y una prueba de habilitación de un paso.

## Implicación para el paper

Conviene distinguir explícitamente tres conceptos:

1. **captura temprana**: cuánto resultado se obtiene en las primeras etapas;
2. **saturación práctica**: etapa en que se alcanza un umbral alto, por ejemplo 90% o 95%;
3. **suficiencia exacta**: estado en que el beneficio marginal declarado y la habilitación examinada son cero.

La figura reproducible correspondiente se genera en `scripts/plot-paper-all-scenarios-benefits.py` y debe mostrarse como curva de porcentaje conjunto capturado versus número de ciclovías implementadas.
