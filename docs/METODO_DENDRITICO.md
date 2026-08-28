# Método dendrítico de EVA

## Índice de conectividad dendrítica por distancia topológica a una red raíz

**Sistema:** EVA — Evaluador de Ciclovías Proyectadas  
**Release pública:** v3.12.1  
**Motor:** v3.12.0  
**Metodología:** v2.3.0  
**Implementación:** `src/fractal.js`  
**Organismo:** Gobierno Regional Metropolitano de Santiago — División de Infraestructura y Transportes

## 1. Propósito

El método dendrítico de EVA busca introducir explícitamente una lógica de **crecimiento de red** en la evaluación de proyectos. Su pregunta no es únicamente qué proyecto presenta mejores atributos propios, sino **qué proyecto expande de manera más directa una estructura de red definida como raíz y cómo esa expansión modifica la posición topológica de los proyectos restantes**.

La interfaz histórica utiliza expresiones como “fractal” y “Strahler invertido”. Para efectos científicos, la implementación vigente se describe con mayor precisión como un **índice de conectividad dendrítica por distancia topológica a una red raíz**. El método está inspirado en la organización jerárquica de redes dendríticas, pero **no calcula el orden de Strahler clásico ni una dimensión fractal**.

## 2. Idea conceptual

Una red ciclable puede crecer de forma dispersa o consolidarse progresivamente desde una estructura troncal. EVA representa esta segunda lógica mediante una raíz inicial y proyectos que operan como ramas sucesivas.

La raíz no es estática. Está formada por:

1. la red ciclable existente conectada al eje Alameda;
2. los proyectos del eje Alameda identificados por la implementación; y
3. los proyectos que ya han sido incorporados a la secuencia de priorización.

Por ello, cada incorporación altera la distancia topológica de los candidatos restantes. Un proyecto que antes estaba a tres saltos de la raíz puede quedar a uno después de ejecutar un conector intermedio.

## 3. Grafo de conectividad

Sea:

$$
G_{\tau}=(V,E_{\tau})
$$

un grafo espacial donde cada vértice $v_i\in V$ representa un eje ciclable existente o proyectado.

Existe una arista entre dos ejes $i$ y $j$ cuando sus geometrías se intersectan o cuando su distancia mínima se encuentra dentro de una tolerancia espacial $\tau$:

$$
(i,j)\in E_{\tau}
\quad\Longleftrightarrow\quad
\operatorname{intersect}(i,j)=1
\;\lor\;
d_{min}(i,j)\le\tau.
$$

La implementación dendrítica utiliza por defecto:

$$
\tau=100\;m.
$$

Este valor no debe interpretarse como una constante universal. Es una tolerancia de *snapping* destinada a absorber discontinuidades de digitalización, extremos que no cierran exactamente y pequeños offsets cartográficos.

## 4. Detección geométrica

El algoritmo trabaja directamente con segmentos de geometrías `LineString` y `MultiLineString`.

Dos conjuntos de segmentos se consideran conectados si:

- existe una intersección geométrica real; o
- la distancia mínima entre extremos y segmentos es menor o igual a $\tau$.

Para reducir el costo computacional, antes de medir distancias se utiliza un prefiltro por *bounding boxes* expandidas por la tolerancia.

La aproximación métrica local empleada en Santiago es:

$$
K_x\approx92.6\;km/grado,\qquad
K_y\approx111\;km/grado.
$$

Esta convención es adecuada para consultas de proximidad regional, pero no reemplaza comprobaciones de ingeniería en terreno.

## 5. Construcción de la raíz

Sea $R_0$ el conjunto raíz inicial. En EVA se construye en dos etapas.

Primero se identifica la ciclovía existente asociada al eje Alameda y se propaga su pertenencia por la red existente mediante una búsqueda en anchura. Por tanto, $R_0$ no contiene únicamente el tramo denominado Alameda: incluye toda infraestructura existente que puede alcanzarse desde ella bajo la tolerancia dendrítica.

Segundo, se incorporan a la raíz los proyectos Alameda definidos por la implementación.

En la iteración $t$, los proyectos previamente priorizados también pasan a formar parte de la raíz:

$$
R_t=R_0\cup P_t,
$$

donde $P_t$ es el conjunto de proyectos incorporados hasta ese momento.

Esta característica convierte el indicador en una medida **endógena al proceso secuencial**.

## 6. Distancia topológica

Para cada proyecto candidato $p$ se calcula su distancia mínima a la raíz en número de saltos del grafo:

$$
g_t(p)=\min_{r\in R_t} d_G(p,r),
$$

donde $d_G$ representa distancia geodésica en el grafo, no distancia métrica en metros.

La interpretación es:

- $g=0$: el eje pertenece a la raíz;
- $g=1$: conecta directamente con la raíz;
- $g=2$: conecta con un eje de grado 1;
- $g=3$: está a tres niveles topológicos de la raíz;
- $g=\varnothing$: no existe un camino hasta la raíz bajo la tolerancia vigente.

El cálculo se realiza mediante **Breadth-First Search (BFS)**, lo que garantiza la distancia mínima en número de saltos para un grafo no ponderado.

## 7. Función de puntuación

EVA transforma el grado topológico en un score mediante una atenuación geométrica.

Sea $\alpha$ el factor de atenuación. La implementación vigente utiliza:

$$
\alpha=0.5.
$$

El score bruto es:

$$
F_t(p)=
\begin{cases}
100, & g_t(p)=0,\\[4pt]
100\alpha^{g_t(p)-1}, & g_t(p)\ge1,\\[4pt]
0, & g_t(p)=\varnothing.
\end{cases}
$$

Con $\alpha=0.5$:

| Grado | Score bruto | Score normalizado |
|---:|---:|---:|
| 0 | 100 | 1.000 |
| 1 | 100 | 1.000 |
| 2 | 50 | 0.500 |
| 3 | 25 | 0.250 |
| 4 | 12.5 | 0.125 |
| 5 | 6.25 | 0.0625 |
| aislado | 0 | 0 |

El valor usado en el multicriterio es:

$$
\hat F_t(p)=\frac{F_t(p)}{100}.
$$

## 8. Carácter incremental

La propiedad central del método es que la raíz crece con la secuencia.

Si en la iteración $t$ se selecciona el proyecto $p_t^*$:

$$
R_{t+1}=R_t\cup\{p_t^*\}.
$$

Para un candidato restante $q$ puede ocurrir:

$$
g_{t+1}(q)<g_t(q).
$$

Por tanto:

$$
F_{t+1}(q)>F_t(q).
$$

Esto formaliza la intuición de crecimiento dendrítico: al construir una rama, los ejes próximos a ella pasan a encontrarse más cerca del tronco efectivo.

La consecuencia de planificación es relevante: **el orden de incorporación modifica las oportunidades de conexión posteriores**.

## 9. Integración con el score multicriterio

El criterio dendrítico no determina por sí solo el ranking general. Se integra como una dimensión más del score:

$$
S_p=\frac{\sum_i w_i\hat{x}_{i,p}}{\sum_i w_i}.
$$

Para el criterio dendrítico:

$$
\hat{x}_{dend,p}=\hat F_t(p).
$$

El escenario predefinido **Red dendrítica Alameda** aumenta significativamente $w_{dend}$ y mantiene otros criterios de continuidad, demanda, población, equidad y factibilidad para evitar que la cercanía topológica sea el único fundamento de decisión.

## 10. Diferencia con continuidad de red

El criterio dendrítico y el criterio de continuidad responden a preguntas distintas.

La continuidad mide cuántos componentes existentes toca un proyecto:

$$
Cont_p=\min\left(1,\frac{K_p}{4}\right).
$$

El método dendrítico mide cuántos saltos topológicos separan al proyecto de una **raíz específica y evolutiva**.

Un proyecto puede tener alta continuidad porque conecta varias subredes y, al mismo tiempo, encontrarse lejos de la raíz dendrítica. Del mismo modo, un eje puede tener grado dendrítico 1 y conectar solamente un componente. Ambos criterios son complementarios.

## 11. Interpretación de política pública

El método representa una estrategia explícita de consolidación de red. No sostiene que Alameda sea una raíz universal ni que toda política ciclable deba crecer desde ese eje.

La raíz es una **hipótesis de planificación**. Puede entenderse como una forma de preguntar:

> Si la política desea consolidar una estructura troncal determinada, ¿qué proyectos extienden esa estructura de forma más inmediata y cómo cambia esa respuesta después de cada incorporación?

En una adaptación de EVA a otro territorio, $R_0$ puede definirse a partir de otra infraestructura troncal, una red de centros metropolitanos, estaciones de transporte masivo o un conjunto multicéntrico de raíces.

## 12. Limitaciones

### 12.1 Tolerancia geométrica

Una tolerancia de 100 m puede considerar conectados ejes que en terreno están separados por autopistas, canales, vías férreas u otras barreras. El algoritmo mide proximidad geométrica, no cruzabilidad efectiva.

### 12.2 Distancia topológica no métrica

El grado mide saltos de red. Un eje de 300 m y otro de 8 km que conectan directamente con la raíz reciben el mismo grado. La longitud, costo, demanda y otros efectos deben ser considerados mediante criterios complementarios.

### 12.3 Dependencia de la raíz

Los resultados dependen de $R_0$. Una raíz distinta puede producir una jerarquía dendrítica diferente. Por ello la definición de raíz debe ser visible, justificable y sometida a análisis de escenarios.

### 12.4 Dependencia de nombres en la implementación vigente

La identificación inicial de Alameda utiliza atributos de nombre presentes en las capas. La robustez futura mejoraría si la raíz se define mediante identificadores explícitos o una capa independiente de configuración.

### 12.5 No optimalidad global

El criterio dendrítico describe relación con la raíz. Cuando se combina con el solver greedy de EVA, no demuestra que la secuencia completa sea el óptimo global de todas las combinaciones posibles.

## 13. Protocolo de sensibilidad propuesto

Los parámetros $\tau$ y $\alpha$ deben tratarse como supuestos de modelación y no como verdades fijas.

Se propone evaluar, por ejemplo:

$$
\tau\in\{50,75,100,150\}\;m
$$

y

$$
\alpha\in\{0.35,0.50,0.65,0.80\}.
$$

Esto genera 16 configuraciones.

Para cada proyecto $p$ se pueden estimar:

$$
\bar r_p,
\quad\sigma(r_p),
\quad r_p^{min},
\quad r_p^{max},
$$

junto con la frecuencia de pertenencia al Top 10:

$$
Pr(p\in Top10)=\frac{\#\{s:r_{p,s}\le10\}}{N_s}.
$$

La similitud entre rankings puede evaluarse mediante correlación de Spearman o $\tau$ de Kendall.

Un proyecto puede clasificarse como dendríticamente robusto cuando mantiene posiciones altas en un rango amplio de valores plausibles de $\tau$ y $\alpha$.

## 14. Validación futura

La validación empírica del método podría abordarse mediante cuatro líneas:

1. **Validación geométrica:** revisar manualmente o en terreno una muestra de conexiones detectadas por el algoritmo y estimar falsos positivos/falsos negativos para distintos valores de $\tau$.
2. **Validación de estructura:** comparar la secuencia dendrítica con estrategias alternativas de crecimiento de red, como máxima accesibilidad marginal, máxima continuidad o crecimiento desde múltiples raíces.
3. **Validación operacional:** observar si los proyectos priorizados efectivamente permiten consolidar continuidad funcional a medida que entran en diseño y ejecución.
4. **Validación de comportamiento:** contrastar, cuando existan datos posteriores, si la consolidación de redes continuas produce cambios observables en uso, accesibilidad o elección modal.

## 15. Pseudocódigo

```text
INPUT:
  red existente E
  proyectos candidatos P
  proyectos ya priorizados L
  tolerancia tau
  atenuación alpha

1. Identificar infraestructura existente asociada a Alameda.
2. Expandir por BFS sobre E para obtener toda la red existente
   conectada a esa semilla bajo tau.
3. Formar raíz R = red existente conectada + proyectos Alameda + L.
4. Construir nodos para todos los proyectos candidatos.
5. Asignar grado 0 a los proyectos incluidos en R.
6. BFS por ondas:
      grado = 1
      mientras exista frontera:
          asignar grado a todo proyecto no visitado
          conectado a la frontera bajo tau
          frontera = proyectos recién asignados
          grado = grado + 1
7. Para cada proyecto p:
      si aislado: F(p)=0
      si grado 0: F(p)=100
      si grado >=1: F(p)=100*alpha^(grado-1)
8. Normalizar F(p)/100 e incorporar al multicriterio.
9. Al priorizar un nuevo proyecto, agregarlo a L y repetir.
```

## 16. Reproducibilidad

La implementación pública se encuentra en:

- `src/fractal.js`: cálculo de conectividad, raíz y BFS;
- `src/app.jsx`: integración incremental con proyectos priorizados;
- `src/scenarios.jsx`: escenario de ponderación dendrítica;
- `src/version.jsx`: fórmula y versión metodológica declarada;
- `src/metodologia.jsx`: ficha metodológica mostrada en la aplicación.

Las exportaciones de EVA incluyen versión del motor, datos, metodología y fórmula dendrítica para favorecer la reproducción de corridas.

## 17. Referencias conceptuales

- Barthélemy, M. (2011). Spatial networks. *Physics Reports, 499*.
- Natera Orozco, L. et al. (2020). Data-driven strategies for optimal bicycle network growth. *Royal Society Open Science, 7*(12).
- Strahler, A. N. (1957). Quantitative analysis of watershed geomorphology. *Transactions, American Geophysical Union, 38*(6).
- Szell, M. et al. (2022). Growing urban bicycle networks. *Scientific Reports, 12*.

La referencia a Strahler se utiliza como antecedente conceptual de jerarquización dendrítica. EVA no implementa el algoritmo clásico de ordenación Strahler.
