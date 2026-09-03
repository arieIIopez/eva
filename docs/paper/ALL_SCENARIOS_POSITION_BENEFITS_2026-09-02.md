# EDTR · Posición por proyecto, beneficios comunes y saturación · 12 escenarios EVA

Fecha de análisis: 2026-09-02/03.

## 1. Propósito

Esta extensión del experimento principal responde tres preguntas adicionales:

1. ¿Qué tan estable es la prioridad de cada ciclovía frente a distintas preferencias de política pública `W`?
2. ¿Qué escenarios adelantan con mayor eficacia beneficios comunes comparables —población marginal, habilitación OD/demanda y conexión topológica— sin comparar directamente puntajes normativos heterogéneos?
3. ¿En qué etapa aparecen rendimientos decrecientes y una saturación práctica de esos beneficios?

La unidad de análisis sigue siendo la trayectoria de implementación sobre el mismo conjunto factible de 124 proyectos C/I, con normalización fija en `G0` y raíz Alameda.

## 2. Escenarios predefinidos

Se comparan los doce escenarios actualmente definidos en EVA:

- Ponderación RMC;
- Balanceado;
- Equidad territorial;
- Demanda potencial;
- Ciclistas inducidos (Biogeme);
- Red dendrítica Alameda (fractal);
- Continuidad de red;
- Eficiencia presupuestaria;
- Educación superior;
- Integración metropolitana;
- Seguridad vial;
- Intermodalidad bici-metro.

## 3. Estabilidad de posición por ciclovía

Para cada proyecto `i` se define su posición secuencial `r_i(W)` bajo cada escenario. La estabilidad se reporta sin construir un metarranking arbitrario mediante dos familias de métricas:

`R_i = max_W r_i(W) - min_W r_i(W)`

como amplitud de sensibilidad interescenario, y

`F_i(k) = (1/|W|) * sum_W 1[r_i(W) <= k]`

como frecuencia de prioridad robusta en un Top-`k`. Se reportan además media, mediana y desviación estándar de posición. Un proyecto puede así ser estable, polarizado o sistemáticamente tardío sin asignarle un único rango promedio normativo.

### 3.1 Núcleo robusto

Resultados disponibles de la matriz de doce escenarios:

| Proyecto | Nombre | r_min | r_max | media | Top-10 / 12 | Lectura |
|---|---|---:|---:|---:|---:|---|
| I12 | Las Rejas–Suiza–Departamental | 1 | 10 | 2,42 | 12 | prioridad robusta Top-10 |
| I26 | San Pablo | 1 | 19 | 4,75 | 11 | prioridad robusta Top-20 |
| I16 | Matta–Vespucio Norte | 2 | 12 | 6,58 | 10 | prioridad robusta Top-20 |
| C066 | Cuatro Poniente | 1 | 18 | 6,58 | 8 | prioridad robusta Top-20 |
| I30 | Walker–Hualle–Aguirre | 3 | 14 | 7,42 | 10 | prioridad robusta Top-20 |
| I11 | José Joaquín Pérez | 3 | 17 | 7,67 | 8 | prioridad robusta Top-20 |
| I22 | Pedro Fontova | 3 | 16 | 8,67 | 8 | prioridad robusta Top-20 |
| I04 | Del Ferrocarril | 6 | 15 | 10,33 | 6 | prioridad robusta Top-20 |

I12 es el caso más claro: `F_I12(10)=1`, pues permanece dentro de los primeros diez lugares bajo los doce escenarios. Esto constituye una señal de consenso multicriterio mucho más fuerte que su posición bajo un único vector de pesos.

### 3.2 Proyectos polarizados o muy sensibles a W

| Proyecto | Nombre | r_min | r_max | rango | Top-10 / 12 | Lectura |
|---|---|---:|---:|---:|---:|---|
| I14 | Lo Ovalle | 4 | 124 | 120 | 5 | extremadamente dependiente del objetivo |
| I08 | General Óscar Bonilla | 5 | 116 | 111 | 3 | muy sensible |
| I25 | San Francisco | 5 | 113 | 108 | 2 | muy sensible |
| I05 | Diagonal José María Caro | 9 | 110 | 101 | 1 | muy sensible |
| I06 | Diagonal Oriente | 15 | 115 | 100 | 0 | muy sensible |
| C010 | Esq. Blanca–Alberto Llona | 22 | 122 | 100 | 0 | muy sensible |
| C067 | Cardenal Raúl Silva Henríquez | 4 | 100 | 96 | 8 | alta prioridad en muchos W, pero polarizada |
| I19 | PAC–Lo Espejo–San Bernardo | 4 | 98 | 94 | 7 | alta prioridad en muchos W, pero polarizada |

Lo Ovalle es especialmente ilustrativo: `R_I14=120`. Una sola afirmación del tipo “es el proyecto número X de la cartera” oculta que su prioridad cambia desde cuarto a último lugar según el objetivo público representado por `W`.

## 4. Comparación de beneficios comunes

Dado que los puntajes propios de escenarios distintos no comparten una escala normativa común, la comparación se realiza con resultados físicos/comunes.

### 4.1 Población marginal

La trayectoria acumulada se resume mediante `A_P = Σ_t P_t` y el índice de captura temprana `I_P`.

Valores de las corridas de 124 proyectos:

1. Educación superior: `A_P=66.003.660`, `I_P=0,8869`.
2. Demanda potencial: `A_P=64.945.037`, `I_P=0,8727`.
3. Balanceado: `A_P=64.836.416`, `I_P=0,8712`.
4. RMC: `A_P=64.430.859`, `I_P=0,8658`.

Educación superior adelanta más población a lo largo de toda la trayectoria entre los escenarios predefinidos, aunque no fue diseñado explícitamente como Population-first. Debe interpretarse como resultado empírico de la interacción entre su vector de preferencias y la estructura espacial de la cartera, no como superioridad general del escenario.

### 4.2 Conexión funcional: habilitación OD/demanda

Se usa `A_D = Σ_t D_t`, donde `D_t` es demanda acumulada habilitada hasta la etapa `t`.

Los principales escenarios son:

1. Demanda potencial: `A_D=98.620.452 viaje-etapa`, `I_D=0,9126`.
2. Integración metropolitana: `98.263.214`, `I_D=0,9093`.
3. Continuidad de red: `98.038.888`, `I_D=0,9072`.
4. Balanceado: `97.767.367`, `I_D=0,9047`.

### 4.3 Conexión topológica: reducción de componentes

La reducción acumulada de fragmentación se resume mediante el área de reducción de componentes durante las 124 etapas. Los mayores valores son:

1. Continuidad de red: `3.913 componente-etapa`;
2. Integración metropolitana: `3.803`;
3. Demanda potencial: `3.767`;
4. Intermodalidad bici-metro: `3.761`;
5. Balanceado: `3.753`.

Por ello “conexión” debe desagregarse en conexión funcional OD y conexión topológica. Un escenario puede adelantar viajes habilitados sin ser el que más tempranamente consolida componentes de red.

## 5. Fronteras de beneficios

### 5.1 Frontera bidimensional población–conexión funcional

Al evaluar simultáneamente `A_P` y `A_D`, la frontera no dominada de los doce escenarios predefinidos queda compuesta por:

- **Educación superior**, que maximiza captura poblacional de trayectoria;
- **Demanda potencial**, que maximiza captura de viajes OD habilitados.

Los otros diez escenarios son dominados en este plano bidimensional por al menos uno de estos dos. Esto no los hace inferiores en general: pueden producir más seguridad, equidad, conexión topológica, ciclistas inducidos u otros resultados no contenidos en `A_P × A_D`.

### 5.2 Frontera tridimensional: población + conexión funcional + conexión topológica

Al incorporar la reducción temprana de componentes como tercera dimensión, la frontera no dominada se amplía a cuatro estrategias:

- **Educación superior**: extremo de captura poblacional;
- **Demanda potencial**: extremo de habilitación OD;
- **Integración metropolitana**: compromiso intermedio entre población, OD y consolidación de red;
- **Continuidad de red**: extremo de conexión topológica.

Esta frontera tridimensional es más fiel al significado de “conexión” en EVA y refuerza que no existe un único escenario predefinido que maximice simultáneamente todos los resultados públicos considerados.

La formulación correcta para el artículo es, por tanto, una **frontera de compromisos**, no la identificación de un escenario universalmente óptimo.

## 6. Rendimientos decrecientes y saturación

Para un resultado acumulado `Y_t`, se define la fracción capturada `C_Y(t)=Y_t/Y_H`. Una medida de saturación práctica conjunta para población y conexión funcional puede escribirse como:

`t_W^(γ) = min{t : C_P,W(t) >= γ y C_D,W(t) >= γ}`.

Al incluir conexión topológica puede añadirse `C_K,W(t)` y exigir las tres condiciones. `γ=0,95` representa saturación práctica; no implica beneficio marginal exactamente cero.

Los resúmenes disponibles muestran que la etapa de 95% depende fuertemente de `W`:

| Escenario | Población 95% | Demanda 95% | máximo de ambas |
|---|---:|---:|---:|
| Educación superior | 44 | 37 | 44 |
| Integración metropolitana | 44 | 35 | 44 |
| Balanceado | 47 | 38 | 47 |
| Demanda potencial | 48 | 35 | 48 |
| Seguridad vial | 51 | 40 | 51 |
| Intermodalidad | 53 | 35 | 53 |
| Continuidad | 57 | 36 | 57 |
| RMC | 59 | 38 | 59 |
| Logit/Biogeme | 70 | 41 | 70 |
| Equidad | 75 | 45 | 75 |
| Eficiencia | 77 | 47 | 77 |
| Fractal Alameda | 107 | 49 | 107 |

Esto permite separar **saturación práctica** de **suficiencia exacta**. Population-first ya demostró suficiencia poblacional exacta en `t*=42` bajo `ε=0` y habilitación de un paso. En cambio, una política multicriterio puede continuar incorporando proyectos con pequeñas ganancias poblacionales hasta etapas tardías porque persigue simultáneamente otros objetivos.

Los resúmenes de las secuencias predefinidas muestran además que la última ganancia positiva de población o demanda ocurre, en casi todos los escenarios, muy cerca de agotar la cartera. Por ello no corresponde afirmar que las curvas multicriterio alcancen beneficio exactamente cero en torno al 95%. La conclusión científicamente correcta es que después del umbral aparece una **cola de rendimientos decrecientes**.

No debe escribirse “después de X proyectos no hay beneficio” salvo que el beneficio marginal sea exactamente cero para todas las métricas declaradas. La formulación correcta es “después de X proyectos se ha capturado γ% del beneficio final respecto de Y y el beneficio marginal entra en una zona de rendimientos decrecientes”.

## 7. Corrida exacta de 12 escenarios

Se incorporó un nuevo experimento reproducible:

- `experiments/paper-all-scenarios-benefits.js`
- `experiments/runner-all-scenarios-benefits.html`
- `scripts/run-paper-all-scenarios-benefits.mjs`
- `.github/workflows/paper-all-scenarios-benefits.yml`

La corrida exporta la trayectoria completa de 124 pasos para cada uno de los doce escenarios, matriz de posiciones, frontera población–conexión y métricas de saturación. Los CSV de etapa permitirán graficar directamente `ΔP_t`, `ΔD_t` y reducción topológica por etapa, sin interpolar checkpoints.

## 8. Integración propuesta en el manuscrito

Incorporar una subsección de resultados del tipo:

**7.X Robustez de prioridad por proyecto y frontera de beneficios**

con tres resultados visuales:

1. gráfico de posición de proyectos seleccionados a través de los doce escenarios;
2. frontera de beneficios `A_P × A_D`, con la conexión topológica como tercera dimensión o panel complementario;
3. curvas acumuladas/marginales de población, demanda y conectividad con zona de rendimientos decrecientes y umbrales 95/99%.

El mensaje metodológico que emerge es más fuerte que una comparación de rankings: EVA permite distinguir **qué proyectos son prioridad robusta**, **cuáles dependen de la preferencia pública declarada**, **qué escenarios se ubican en la frontera de resultados públicos** y **hasta qué punto de la trayectoria se capturan los beneficios que justifican continuar expandiendo la cartera**.
