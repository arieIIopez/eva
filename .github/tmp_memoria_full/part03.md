os monetizados ni costos de ciclo de vida.

## 9.12 Seguridad vial — siniestralidad prevenible intervenida

Para cada siniestro $s$ a no más de 100 m de la traza se utiliza:

$$
Seg_p=\sum_{s\in S(p)}sev_s\,treat_s\,decay_s.
$$

La severidad completa se basa en:

$$
sev_s=6F_s+3G_s+2M_s+L_s,
$$

mientras que el modo KSI utiliza $6F+3G$. La tratabilidad es un factor experto en $[0.15,1]$ y el decaimiento lineal es:

$$
decay_s=1-0.8\frac{d_s}{100},\qquad 0\le d_s\le100\;m.
$$

El criterio identifica **peligrosidad observada y potencialmente tratable**, no estima el efecto causal que produciría construir una ciclovía. No normaliza por exposición ciclista.

## 9.13 Monumentos nacionales — contexto

$$
Mon_p=|\{m:d(m,p)\le300m\}|.
$$

Es un criterio contextual bidireccional con peso 0 por defecto. Un peso positivo puede interpretarse como deseo de conectar patrimonio; uno negativo como precaución frente a intervenciones próximas. Al no formar parte del denominador del score, debe utilizarse con cautela.

## 9.14 Intermodalidad bicicleta–Metro

$$
Int_p=|\{e\in Metro:d(e,p)\le250m\}|.
$$

Cuenta estaciones únicas próximas a la traza. No distingue jerarquía de estación, combinación, capacidad ni existencia de bicicleteros.

## 9.15 Factibilidad constructiva

El motor utiliza el atributo preprocesado `numPistas` como proxy de espacio vial disponible y lo normaliza por el máximo de la cartera. Conceptualmente, cuando el dato proviene de tramos $t$:

$$
Fact_p\approx\frac{\sum_t L_t\,pistas_t}{\sum_tL_t}.
$$

Es un tamiz de factibilidad. No reemplaza levantamiento de perfiles, catastro de estacionamientos, drenaje, arbolado, servicios, expropiaciones o ingeniería de detalle.

## 9.16 Atractor de parques

Cada parque se representa mediante un centroide y un radio efectivo:

$$
r_k=\sqrt{A_k/\pi}.
$$

Se considera conectado si:

$$
d(centroide_k,p)\le r_k+150m.
$$

El valor del proyecto es la superficie total de parques alcanzados:

$$
Par_p=\sum_{k\in K(p)}A_k.
$$

El tamaño funciona como proxy de poder de atracción y no incorpora calidad, equipamiento, afluencia o accesibilidad a entradas reales.

### 9.17 Variables informativas que no integran actualmente el score

EVA también calcula o visualiza variables útiles para decisión experta que no son criterios ponderados del score actual: ferias libres y sus días de funcionamiento, cantidad de paraderos de bus en el eje, pendiente media, pendiente máxima, proporción de longitud sobre 5 %, relación de ferias con red existente y capas OSM de contexto. Su presencia en una ficha no implica que afecten el ranking.

---

# 10. Modelo de elección modal y ciclistas inducidos

## 10.1 Especificación

EVA incorpora un Logit binario bicicleta vs. no bicicleta para viajes al trabajo, estimado mediante Biogeme sobre 117.072 manzanas censales de Chile ponderadas por población ocupada. La implementación aplica la especificación al contexto de la Región Metropolitana con variables de distancia, desnivel, escolaridad y kilómetros de infraestructura ciclable cercana al origen.

La utilidad sistemática implementada es:

$$
V_h=ASC+\Delta ASC+(\beta_d+\beta_{d,L})d_h+\beta_a|\Delta z_h|+\beta_eEsc_h+\beta_cKm500_h.
$$

Los coeficientes publicados en el código son:

| Parámetro | Coeficiente | Interpretación computacional |
|---|---:|---|
| $ASC$ | -1,39 | Constante bicicleta |
| $\beta_d$ | -0,0267 | Distancia por km |
| $\beta_{d,L}$ | -0,0819 | Interacción de distancia en ciudad grande |
| $\beta_a$ | -0,00778 | Desnivel absoluto por metro |
| $\beta_e$ | -0,0786 | Escolaridad media |
| $\beta_c$ | +0,13 | km de ciclovía a 500 m |

La probabilidad es:

$$
P_h(bici)=\frac{1}{1+e^{-V_h}}.
$$

## 10.2 Variables espaciales

La distancia al trabajo se aproxima como promedio ponderado de las distancias entre el centroide del hexágono y los centroides de sus comunas destino:

$$
\bar d_h=\frac{\sum_c f_{h,c}\max(1,d(h,c))}{\sum_c f_{h,c}}.
$$

La variable de infraestructura se calcula como kilómetros de red muestreada dentro de un radio editable —500 m por defecto— del centroide del hexágono.

Para escolaridad y desnivel, 1.006 de los 1.589 hexágonos poseen valores observados derivados de la muestra de estimación. El resto usa valores de respaldo editables (13 años y 40,5 m en la configuración publicada).

## 10.3 Efecto de un proyecto

Para cada proyecto, el sistema suma los kilómetros adicionales que quedan dentro del radio del hexágono y recalcula la probabilidad:

$$
\Delta P_{h,p}=P_h(Km500_h+\Delta Km500_{h,p})-P_h(Km500_h).
$$

Los ciclistas inducidos son:

$$
\Delta Cicl_p=\sum_h P_h^{ocup}\Delta P_{h,p}.
$$

## 10.4 Qué representa y qué no representa

El modelo aproxima **cambio de propensión modal asociado a infraestructura cercana al origen** dentro de una especificación estadística determinada. No representa una simulación completa de elección de ruta, no estima viajes no laborales, no incorpora capacidad de la ciclovía y no modela cambios residenciales o culturales de largo plazo.

Los efectos marginales de proyectos individuales tampoco son aditivos cuando comparten los mismos hexágonos: la función logística y el incremento de `km500` generan saturación. Por ello, sumar `ciclistasInducidos` de varios proyectos independientes produce una cota superior, no necesariamente el valor conjunto exacto.

## 10.5 Sensibilidad del modelo modal

La interfaz permite modificar $\beta_c$, $\Delta ASC$, escolaridad de respaldo, desnivel de respaldo y radio de influencia. Esos controles cambian **la estimación de demanda**, no el peso político del criterio “ciclistas inducidos”. Conviene distinguir:

- **parámetro del modelo:** altera $x_{i,p}$;
- **peso multicriterio:** altera $w_i$.

Confundir ambos niveles puede conducir a doble ponderación implícita.

---

# 11. Índice de conectividad dendrítica

## 11.1 Precisión conceptual

La interfaz utiliza las expresiones “conectividad fractal” y “red dendrítica Alameda”. La implementación fue inspirada por la organización jerárquica de redes de drenaje y por la noción de orden de Strahler. Sin embargo, **el algoritmo vigente no calcula un orden de Strahler en sentido estricto ni una dimensión fractal**.

El orden de Strahler clásico aumenta cuando confluyen cursos del mismo orden (Strahler, 1957). EVA hace algo diferente: construye un grafo de proximidad geométrica y calcula la **distancia topológica mínima a un conjunto raíz mediante búsqueda en anchura (BFS)**. Por rigor, esta memoria denomina al indicador:

> **Índice de conectividad dendrítica por distancia topológica a una red raíz.**

La analogía fluvial se conserva como explicación intuitiva, no como identidad matemática.

## 11.2 Grafo dendrítico

Sea $\mathcal{L}$ el conjunto de ejes existentes y proyectos candidatos. Para una tolerancia dendrítica $\tau_f=100$ m se define:

$$
G_f=(V,E_f),
$$

$$
(i,j)\in E_f\iff intersect(i,j)\;\lor\;d_{seg}(i,j)\le\tau_f.
$$

La función de conectividad utiliza dos pruebas:

1. intersección exacta de segmentos mediante orientación;
2. distancia mínima extremo-segmento menor o igual a la tolerancia.

Antes de calcular distancias detalladas se aplica un prefiltro de *bounding boxes* expandidas.

## 11.3 Definición de la raíz

La raíz base $R_0$ se construye a partir de la red existente vinculada al eje Alameda. El procedimiento:

1. identifica ejes existentes cuyo nombre contiene “Alameda”;
2. ejecuta una expansión BFS sobre la red existente con tolerancia 100 m;
3. incorpora a la raíz los proyectos identificados como Alameda en la cartera;
4. incorpora todos los proyectos ya priorizados manual o secuencialmente.

Por tanto, en la iteración $t$:

$$
R_t=R_0\cup P_t,
$$

donde $P_t$ son las geometrías ya incorporadas.

## 11.4 Grado de separación

Para cada proyecto candidato $p$ se define:

$$
g_t(p)=\min_{r\in R_t}d_G(p,r),
$$

donde $d_G$ se mide en cantidad de saltos topológicos.

Interpretación:

- $g=0$: forma parte de la raíz;
- $g=1$: conecta directamente con la raíz;
- $g=2$: conecta con un proyecto de grado 1;
- $g=n$: requiere $n$ niveles topológicos;
- $g=\varnothing$: no existe camino hacia la raíz bajo $\tau_f$.

## 11.5 Atenuación geométrica

El score bruto implementado es:

$$
F_t(p)=
\begin{cases}
100,&g_t(p)=0,\\
100\alpha^{g_t(p)-1},&g_t(p)\ge1,\\
0,&g_t(p)=\varnothing,
\end{cases}
$$

con:

$$
\alpha=0.5.
$$

El valor normalizado usado en el multicriterio es:

$$
\widehat F_t(p)=F_t(p)/100.
$$

| Grado | Score bruto | Score normalizado |
|---:|---:|---:|
| 0 | 100 | 1,000 |
| 1 | 100 | 1,000 |
| 2 | 50 | 0,500 |
| 3 | 25 | 0,250 |
| 4 | 12,5 | 0,125 |
| 5 | 6,25 | 0,0625 |
| aislado | 0 | 0 |

La equivalencia entre grado 0 y grado 1 es una decisión de diseño actual: pertenecer a la raíz y conectarse directamente a ella reciben la misma contribución máxima.

## 11.6 Carácter incremental

La principal propiedad del índice es que la raíz crece con la secuencia. Si $p_t^*$ es incorporado:

$$
R_{t+1}=R_t\cup\{p_t^*\}.
$$

Entonces algunos proyectos restantes pueden experimentar:

$$
g_{t+1}(q)<g_t(q).
$$

Un eje de grado 3 puede transformarse en grado 1 después de construir el enlace que acerca la red. Esta propiedad hace al indicador coherente con el principio general de EVA: **el orden de construcción cambia el valor marginal de los proyectos**.

## 11.7 Diferencia con continuidad

Continuidad y conectividad dendrítica no son el mismo criterio.

- **Continuidad** pregunta cuántos componentes existentes toca el proyecto bajo `connectTol` y satura en cuatro.
- **Dendrítico** pregunta cuántos saltos topológicos separan al proyecto de una red raíz específica bajo una tolerancia fija de 100 m.

Un proyecto puede unir varios componentes y, a la vez, estar lejos de la raíz Alameda; o puede ser un afluente directo de la raíz y tocar solo un componente.

## 11.8 Limitaciones

1. **Raíz normativa:** elegir A