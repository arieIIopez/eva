# EDTR · Curva de captura conjunta población–conexión

Fecha: 2026-09-02/03

## Definición

Para evitar combinar arbitrariamente población y conexión en un puntaje único, se normalizan por separado los dos resultados acumulados comparables:

`C_P,W(t) = P_W,t / P_W,H`

`C_D,W(t) = D_W,t / D_W,H`

La fracción capturada simultáneamente en ambas dimensiones se representa mediante el criterio conservador:

`C_J,W(t) = min(C_P,W(t), C_D,W(t))`.

Para cada escenario `W` y porcentaje `γ`, la etapa conjunta de captura es la primera etapa en que se ha alcanzado al menos `γ` de la población final y al menos `γ` de la habilitación OD final:

`t_W^(γ) = min{t : C_J,W(t) >= γ} = max(t_P,W^(γ), t_D,W^(γ))`.

No es un criterio de beneficio cero. Es una medida de **saturación práctica** que permite observar cuándo la trayectoria entra en una cola de rendimientos decrecientes.

## Punto de rodilla endógeno

Además de los umbrales normativos 90/95/99%, la corrida exacta calcula un diagnóstico de saturación empírica. Sea `n` el número de proyectos de la trayectoria y `x_t=t/n`. Para una curva acumulada front-loaded y normalizada, se define:

`t_knee = arg max_t [ C_J,W(t) - x_t ]`.

Es la etapa de máximo alejamiento vertical respecto de la diagonal temporal y aproxima el punto en que la captura conjunta deja de crecer con la intensidad de las primeras etapas y entra en una cola de ganancias marginales menores. Se reporta como **diagnóstico geométrico descriptivo**, no como óptimo económico ni como regla universal de detención.

La corrida exporta también la última etapa con ganancia positiva de población y la última con ganancia positiva de habilitación OD. Sólo después del máximo de ambas puede afirmarse, para esas dos métricas, que no queda ganancia adicional observada. Esto mantiene separadas tres nociones: rodilla empírica, saturación práctica y beneficio marginal exactamente cero.

## Escenarios no dominados al considerar población, OD y conexión topológica

La frontera tridimensional de los doce escenarios predefinidos contiene:

- Educación superior;
- Demanda potencial;
- Integración metropolitana;
- Continuidad de red.

Para estos cuatro perfiles eficientes, los umbrales conjuntos conocidos son:

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

Conviene distinguir explícitamente cuatro conceptos:

1. **captura temprana**: cuánto resultado se obtiene en las primeras etapas;
2. **rodilla empírica**: punto geométrico donde la curva cambia de régimen;
3. **saturación práctica**: etapa en que se alcanza un umbral alto, por ejemplo 90% o 95%;
4. **suficiencia exacta**: estado en que el beneficio marginal declarado y la habilitación examinada son cero.

La figura reproducible correspondiente se genera en `scripts/plot-paper-all-scenarios-benefits.py`. Para el cuerpo del artículo debe mostrarse la curva exacta `C_J,W(t)` de los perfiles no dominados, los puntos de rodilla y los umbrales 95/99%; la matriz completa 124×12 y el resto de diagnósticos quedan como material suplementario reproducible.
