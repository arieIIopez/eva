# EVA — Memoria técnica, metodológica y científica

**Gobierno Regional Metropolitano de Santiago — División de Infraestructura y Transportes**  
**Release pública:** v3.12.1  
**Motor:** v3.12.0  
**Datos:** 2026.08  
**Procesamiento:** 2026.08-comunas-oficiales  
**Metodología:** v2.3.0  
**DOI:** [10.5281/zenodo.22145509](https://doi.org/10.5281/zenodo.22145509)

> **EVA no automatiza la decisión pública. Automatiza una parte sustantiva de la complejidad de cálculo necesaria para que una decisión de inversión pueda ser comparada, discutida, modificada y reevaluada sobre una base común de evidencia.**

## Alcance de esta memoria

Esta memoria documenta el comportamiento de la versión pública vigente de EVA. Sustituye, para efectos de descripción técnica actual, a las memorias asociadas a versiones anteriores del sistema. Cuando existe una diferencia entre documentación histórica y código ejecutable, se considera al código publicado como fuente primaria para describir la implementación.

EVA es un **sistema de apoyo a decisiones de cartera**. No es un modelo causal que determine cuál ciclovía “debe” construirse, ni reemplaza la evaluación social de inversiones, la ingeniería de detalle o las decisiones administrativas y políticas que correspondan.

La versión vigente incorpora, entre otras capacidades, un modelo de accesibilidad origen-red-destino, evaluación marginal de proyectos, análisis multicriterio, priorización secuencial, sensibilidad, modelo Logit para ciclistas inducidos, conectividad dendrítica, intermodalidad bici-Metro, seguridad vial, factibilidad constructiva, parques como atractores, control de calidad, comparación de carteras y exportaciones reproducibles.

## 1. Problema científico y de decisión

Una cartera de infraestructura ciclable no puede tratarse estrictamente como una colección de proyectos independientes. Cuando un nuevo arco se incorpora a la red puede fusionar subredes, acercar población a infraestructura, habilitar destinos y alterar el valor de proyectos posteriores.

Sea la red efectiva en la iteración $t$:

$$
G_t=(V_t,E_t)
$$

y sea $\mathcal{P}_t$ el conjunto de proyectos candidatos. El valor de un proyecto se entiende como una función dependiente del estado:

$$
U_t(p)=U(p\mid G_t,\Theta,W,D),
$$

donde $\Theta$ representa parámetros metodológicos, $W$ las ponderaciones de política pública y $D$ los datos vigentes.

Si se incorpora el proyecto seleccionado $p_t^*$:

$$
G_{t+1}=G_t\cup p_t^*,
$$

entonces, en general:

$$
U_{t+1}(q)\neq U_t(q).
$$

Esta propiedad fundamenta la priorización secuencial: **el orden de construcción puede modificar el resultado territorial final**.

## 2. Arquitectura computacional

La arquitectura pública de EVA separa responsabilidades en módulos revisables:

| Función | Implementación principal |
|---|---|
| Versiones, parámetros y procedencia | `src/version.jsx` |
| Carga y preparación de datos | `src/data.jsx` |
| Componentes conexos, accesibilidad y evaluación marginal | `src/engine.jsx` |
| Modelo Logit | `src/demanda-modal.jsx` |
| Conectividad dendrítica | `src/fractal.js` |
| Escenarios y explicabilidad | `src/scenarios.jsx` |
| Sensibilidad y comparación de carteras | `src/analysis.jsx` |
| Redes aisladas | `src/netview.jsx` |
| Control de calidad | `src/qa.jsx` |
| Reportes | `src/reports.js` |

La red se modela mediante componentes conexos construidos con *union-find* y consultas espaciales apoyadas en una grilla. Las geometrías lineales se muestrean para evitar el costo de comparar todos los pares de ejes.

Para cálculos rápidos en la Región Metropolitana se utiliza una aproximación métrica local sobre WGS84:

$$
K_x\approx92.6\;km/grado,\qquad K_y\approx111\;km/grado.
$$

Esta convención es apropiada para análisis regionales de proximidad, pero no sustituye una métrica geodésica o un ruteo topológico de precisión cuando se requiere ingeniería de detalle.

## 3. Componentes de red, acceso y viabilidad OD

### 3.1 Componentes conexos

Dos ejes se consideran pertenecientes a una misma subred cuando sus muestras espaciales se aproximan dentro de la tolerancia de empalme $\tau$:

$$
e_i\sim e_j\quad\text{si}\quad d_{min}(e_i,e_j)\le\tau.
$$

El valor por defecto vigente es:

$$
\tau=150\;m.
$$

La tolerancia es un parámetro analítico: valores pequeños fragmentan la red; valores grandes pueden fusionar discontinuidades que no necesariamente son funcionalmente cruzables.

### 3.2 Acceso al origen

Para cada hexágono $h$ se identifica el conjunto de componentes a distancia menor o igual al umbral de acceso $\delta_O$:

$$
A_O(h)=\{K:d(h,G_K)\le\delta_O\}.
$$

Con la configuración vigente:

$$
\delta_O=700\;m.
$$

### 3.3 Servicio del destino

La distancia efectiva de destino es:

$$
\delta_D^{eff}=\delta_D+\alpha_f,
$$

donde $\alpha_f$ es la aproximación final admitida sin infraestructura. En la configuración por defecto actual $\alpha_f=0$, por lo que $\delta_D^{eff}=700$ m.

Un componente $K$ se considera capaz de servir una comuna $c$ cuando la población única de esa comuna situada dentro de la distancia de destino supera el umbral $\theta$:

$$
serves(K,c)=\mathbb{1}\left[
\frac{P_{K,c}^{\le\delta_D^{eff}}}{P_c}\ge\theta
\right].
$$

El valor por defecto es:

$$
\theta=0.40.
$$

### 3.4 Calidad protegida, perfil y tiempo máximo

La versión actual permite exigir una proporción mínima de infraestructura protegida por componente:

$$
q_K=\frac{L_K^{prot}}{L_K^{tot}}\ge\pi_{min}.
$$

El default vigente es $\pi_{min}=0$, por lo que esta restricción está desactivada mientras el usuario no la modifique. El perfil `general` excluye de la red efectiva ciertas tipologías de mayor estrés, mientras el perfil `experto` considera la totalidad de la red publicada.

También puede activarse un límite de tiempo mediante una velocidad de referencia:

$$
d_{max}=v_{ref}\frac{t_{max}}{60}.
$$

Los valores por defecto son $t_{max}=0$ —sin límite activo— y $v_{ref}=15$ km/h.

## 4. Evaluación marginal

Cada proyecto candidato se agrega temporalmente a la red, se evalúan sus efectos y luego se retira. Esto permite distinguir entre beneficio bruto y beneficio **marginal**.

### 4.1 Población marginal

$$
\Delta Pob_p=\sum_h P_h\;\mathbb{1}[h\text{ gana acceso por }p].
$$

Sólo contabiliza población que no tenía acceso a la red efectiva antes de incorporar el proyecto.

### 4.2 Demanda OD habilitada

Para los destinos laborales representados en cada hexágono, EVA identifica viajes que eran inviables en la red base y que pasan a ser viables al incorporar el proyecto:

$$
D_p=\sum_h\sum_d f_{h,d}\;\mathbb{1}
[v_{h,d}^{con,p}\land\neg v_{h,d}^{sin,p}].
$$

La viabilidad no equivale a una predicción de elección modal. Indica que la estructura de red satisface las condiciones operativas definidas por el modelo.

### 4.3 Proxy histórico `costoOD`

Una revisión del código vigente muestra que el campo denominado históricamente `costoOD` **no calcula actualmente un costo generalizado de ruta arco a arco**. El motor calcula:

$$
r_p=\frac{F_p^{hab}}{F_p^{pot}}
$$

y almacena internamente:

$$
costoOD_p=-round(30r_p).
$$

Para el score se utiliza su valor absoluto normalizado. Por ello, esta memoria interpreta el criterio como **proxy de tasa de habilitación OD**, manteniendo el nombre de campo por compatibilidad. Una futura versión debería renombrarlo o implementar efectivamente el costo generalizado documentado en etapas anteriores.

## 5. Sistema multicriterio

Los indicadores cuantitativos se normalizan respecto del máximo de la cartera activa:

$$
\hat{x}_{i,p}=\frac{x_{i,p}}{\max_q x_{i,q}}.
$$

El score ordinario es una suma ponderada:

$$
S_p=\frac{\sum_i w_i\hat{x}_{i,p}}{\sum_i w_i}.
$$

La normalización es relativa: modificar el universo de proyectos puede cambiar los valores normalizados incluso sin modificar un proyecto individual. La suma ponderada supone compensabilidad entre criterios. EVA la utiliza porque permite observar con claridad cómo las preferencias normativas transforman el ranking.

Los pesos **no son datos empíricos**. Son una representación explícita de prioridades de política, planificación y decisión.

## 6. Criterios de la versión vigente

EVA dispone de 16 dimensiones registradas en el sistema. Quince son ponderables ordinariamente; Monumentos Nacionales opera como criterio contextual con peso cero por defecto.

| Criterio | Síntesis operacional |
|---|---|
| Población marginal | Personas que ganan acceso a la red |
| `costoOD` | Proxy de tasa de viajes potenciales que pasan a ser viables |
| Oportunidades | Hexágonos con al menos un viaje nuevo viable |
| Equidad territorial | Beneficio en comunas bajo la mediana de cobertura |
| Continuidad | Número de componentes tocados, saturado en cuatro |
| Demanda OD | Viajes laborales que pasan de inviables a viables |
| Ciclistas inducidos | $\sum P_h\Delta P_h(bici)$ según Logit |
| Conectividad dendrítica | Distancia topológica a una red raíz con atenuación |
| Estudiantes | Acceso de estudiantes de media y superior |
| Prioridad GORE | Prioridad comunal ponderada por población beneficiada |
| Eficiencia económica | Inverso del costo lineal normalizado |
| Seguridad vial | Severidad × tratabilidad × decaimiento espacial |
| Intermodalidad | Estaciones de Metro a ≤250 m del eje |
| Factibilidad | Número medio ponderado de pistas como proxy de ancho |
| Parques | Superficie de áreas verdes conectadas por el eje |
| Monumentos | Contexto patrimonial a ≤300 m; neutro por defecto |

La continuidad se implementa como:

$$
Cont_p=\min\left(1,\frac{K_p}{4}\right),
$$

donde $K_p$ es el número de componentes de red que el proyecto toca dentro de la tolerancia vigente.

El costo de inversión se aproxima en la versión actual como:

$$
C_p=L_p\,c_{km},
$$

con $c_{km}=100$ MCLP/km por defecto, y la eficiencia es:

$$
Eff_p=1-\frac{C_p}{\max_qC_q}.
$$

Debe entenderse como un proxy de priorización, no como presupuesto de ingeniería ni evaluación social.

## 7. Modelo de elección modal y ciclistas inducidos

EVA incorpora un Logit binario bicicleta/no bicicleta para viajes al trabajo, estimado con Biogeme sobre 117.072 manzanas censales, ponderadas por población ocupada. La especificación aplicada en la Región Metropolitana es:

$$
V_{bici}=ASC+(\beta_{dist}+\beta_{dist,large})d_{km}
+\beta_{alt}|\Delta h|+\beta_{educ}esc+\beta_{ciclo}km_{500}.
$$

La probabilidad es:

$$
P(bici)=\frac{1}{1+e^{-V_{bici}}}.
$$

Coeficientes implementados:

| Parámetro | Coeficiente |
|---|---:|
| $ASC$ | -1.39 |
| $\beta_{dist}$ | -0.0267 |
| $\beta_{dist,large}$ | -0.0819 |
| $\beta_{alt}$ | -0.00778 |
| $\beta_{educ}$ | -0.0786 |
| $\beta_{ciclo}$ | +0.13 |

Para cada proyecto se calcula el incremento de kilómetros de ciclovía dentro del radio de influencia del hexágono y la variación de probabilidad resultante:

$$
\Delta P_{h,p}=P_h(km_{500,h}+\Delta km_{500,h,p})-P_h(km_{500,h}).
$$

Los ciclistas inducidos se aproximan como:

$$
\Delta Cicl_p=\sum_h P_h^{ocup}\Delta P_{h,p}.
$$

Este criterio modela una variación de propensión asociada a la infraestructura cercana al origen. No representa ruteo completo, viajes no laborales, capacidad de la ciclovía, cambios residenciales ni efectos culturales de largo plazo. Cuando varios proyectos comparten hexágonos, los efectos individuales no son aditivos debido a la forma logística.

## 8. Índice de conectividad dendrítica

La interfaz histórica utiliza expresiones como “fractal” y “Strahler invertido”. Científicamente, la implementación actual se describe con mayor precisión como **índice de conectividad dendrítica por distancia topológica a una red raíz**. Está inspirado en la organización jerárquica de redes de drenaje, pero **no calcula el orden de Strahler clásico ni una dimensión fractal**.

El método completo, sus ecuaciones, supuestos y agenda de validación se documentan en [`METODO_DENDRITICO.md`](METODO_DENDRITICO.md).

Sea $G_\tau=(V,E_\tau)$ el grafo inducido por la proximidad/intersección de ejes bajo una tolerancia dendrítica de 100 m. La raíz $R_t$ contiene la red existente conectada al eje Alameda, los proyectos Alameda definidos por la implementación y los proyectos previamente priorizados.

La distancia topológica de un candidato es:

$$
g_t(p)=\min_{r\in R_t}d_G(p,r).
$$

La contribución implementada es:

$$
F_t(p)=
\begin{cases}
100,&g_t(p)=0,\\
100\alpha^{g_t(p)-1},&g_t(p)\ge1,\\
0,&p\text{ aislado},
\end{cases}
$$

con $\alpha=0.5$. En el multicriterio se utiliza $\hat F_t=F_t/100$.

La característica central es su actualización incremental:

$$
R_{t+1}=R_t\cup\{p_t^*\}.
$$

Por tanto, un proyecto restante puede disminuir su distancia topológica luego de construir otro. Esta es una formulación explícita del principio de dependencia secuencial de EVA.

## 9. Escenarios de política pública

La versión vigente publica doce escenarios:

1. Ponderación RMC.
2. Balanceado.
3. Equidad territorial.
4. Demanda potencial.
5. Ciclistas inducidos (Biogeme).
6. Red dendrítica Alameda.
7. Continuidad de red.
8. Eficiencia presupuestaria.
9. Educación superior.
10. Integración metropolitana.
11. Seguridad vial.
12. Intermodalidad bici-Metro.

Un escenario no constituye una “solución correcta”. Es una hipótesis normativa reproducible sobre la importancia relativa de distintas dimensiones.

La función `evaExplainScore` descompone el score de un proyecto en aportes por criterio, identifica fortalezas, debilidades, el criterio dominante y advierte cuando una posición depende fuertemente de una sola dimensión. Esa explicabilidad es relevante porque evita presentar el ranking como una caja negra.

## 10. Priorización secuencial

El solver completo usa una heurística greedy iterativa. En cada paso:

1. reevalúa todos los candidatos contra la red base más los proyectos previamente incorporados;
2. calcula el score bajo los pesos vigentes;
3. escoge el candidato de mayor score que respeta el presupuesto, si existe restricción;
4. incorpora su geometría a la red efectiva;
5. repite el proceso.

Formalmente:

$$
p_t^*=\arg\max_{p\in\mathcal P_t}S(p\mid G_t).
$$

La red evoluciona:

$$
G_{t+1}=G_t\cup p_t^*.
$$

El greedy maximiza el aporte de cada iteración, **pero no garantiza optimalidad global**. Dos proyectos individualmente modestos pueden ser superiores en conjunto a una decisión greedy. Por esa razón el resultado debe interpretarse como secuencia de alta calidad y auditable, no como demostración de óptimo matemático global.

## 11. Sensibilidad y robustez

EVA implementa dos familias de análisis.

### Sensibilidad de ponderaciones

Se comparan los escenarios predefinidos y perturbaciones de ±50 % sobre doce criterios núcleo. Para cada proyecto se calcula posición promedio, mejor y peor posición, rango, desviación y frecuencia en Top-5, Top-10 y Top-20.

La clasificación vigente considera robusto un proyecto cuando:

$$
freq_{Top10}\ge0.80
$$

y

$$
rango\le\max(8,0.08N).
$$

Se clasifica como sensible cuando:

$$
rango\ge0.35N.
$$

La rutina de perturbación individual aún no recorre intermodalidad, factibilidad y parques; esos criterios sí participan en escenarios. Esta diferencia queda documentada como una mejora pendiente.

### Sensibilidad paramétrica

La rutina actual ejecuta 15 corridas, variando por separado cinco parámetros en tres niveles: acceso origen, acceso destino, tolerancia de empalme, cobertura mínima de destino y costo por kilómetro.

Una extensión prevista es incorporar una sensibilidad específica del índice dendrítico sobre la tolerancia espacial y el factor de atenuación.

## 12. Control de calidad

El módulo de QA verifica, entre otros aspectos:

- identificadores duplicados;
- proyectos sin comuna;
- fuente de asignación comunal y uso de límites oficiales;
- longitud o costo cero;
- geometrías vacías o inválidas;
- coordenadas fuera del área esperada;
- diferencia superior al 10 % entre longitud geométrica y declarada;
- hexágonos sin población o vector OD;
- sedes sin matrícula;
- comunas sin población o cobertura calculada.

El reporte diferencia problemas críticos y advertencias y conserva la procedencia de la corrida. El QA no demuestra validez científica del modelo; verifica consistencia estructural de los insumos y condiciones básicas de ejecución.

## 13. Reproducibilidad y trazabilidad

La versión pública registra separadamente:

- motor `3.12.0`;
- datos `2026.08`;
- procesamiento `2026.08-comunas-oficiales`;
- metodología `2.3.0`.

`evaDataHash` genera una huella determinista sensible a componentes relevantes de los datos y `evaConfigHash` firma parámetros, pesos y configuración. `evaProvenance` integra versiones, hashes, CRS, unidad monetaria, fecha y otras propiedades en las exportaciones.

Estos hashes son mecanismos de trazabilidad, **no firmas criptográficas de seguridad**.

## 14. Validación y gobernanza

EVA distingue cuatro dimensiones que no deben confundirse:

- **verificación computacional:** consistencia del motor, QA y reproducibilidad;
- **revisión técnica:** escrutinio externo de metodología e implementación;
- **validación social:** presentación, discusión y validación de criterios y aplicación con organizaciones vinculadas a movilidad;
- **validación operacional:** uso efectivo del sistema para apoyar la secuenciación de una cartera que ya avanza a etapas de desarrollo.

La revisión técnica externa no equivale a afirmar que EVA sea una publicación científica revisada por pares. Del mismo modo, la validación social no sustituye una validación empírica del modelo.

La aplicación institucional se documenta separadamente en [`IMPACTO.md`](IMPACTO.md) y los alcances de validación en [`VALIDACION.md`](VALIDACION.md).

## 15. Limitaciones principales

Las limitaciones de la versión actual deben mantenerse visibles:

1. La conectividad se aproxima mediante proximidad geométrica y muestreo; no existe ruteo completo arco a arco.
2. Los destinos laborales del Censo se conocen a nivel comunal, por lo que su localización interna se aproxima.
3. El criterio `costoOD` es actualmente una tasa de habilitación transformada, no un costo generalizado de ruta.
4. Los costos de inversión son lineales por kilómetro salvo que se incorporen datos de ingeniería más detallados.
5. La factibilidad por número de pistas es un indicador de tamizaje y no sustituye un perfil transversal.
6. La seguridad vial usa peligrosidad observada, severidad y una regla de tratabilidad; no estima causalmente la reducción de siniestros.
7. El Logit se transfiere desde una estimación nacional y sólo representa viajes al trabajo.
8. El índice dendrítico depende de una raíz institucional y de parámetros de conexión/atenuación.
9. La suma ponderada permite compensación total entre criterios.
10. El solver greedy no garantiza el óptimo global.

## 16. Agenda científica de mejora

Las líneas de trabajo prioritarias son: validación del índice dendrítico frente a diferentes raíces y parámetros; perturbación automática de los 15 criterios ponderables; ruteo arco a arco con costo generalizado; modelos explícitos de bajo estrés; costos de ingeniería por proyecto; validación antes-después de demanda y seguridad; análisis distributivo intracomunal; y evaluación de estrategias secuenciales alternativas al greedy.

Para la conectividad dendrítica se propone evaluar, como protocolo inicial:

$$
\tau_f\in\{50,75,100,150\}\;m
$$

y

$$
\alpha\in\{0.35,0.50,0.65,0.80\},
$$

comparando rankings mediante correlación de Spearman/Kendall, rango de posiciones y frecuencia de aparición en Top-10. Esta prueba se propone como **validación futura** y no debe confundirse con una función ya automatizada en v3.12.0.

## 17. Referencias metodológicas seleccionadas

- Barthélemy, M. (2011). Spatial networks. *Physics Reports, 499*, 1–101. https://doi.org/10.1016/j.physrep.2010.11.002
- Bierlaire, M. (2023). *A short introduction to Biogeme*. EPFL.
- Broach, J., Dill, J., & Gliebe, J. (2012). Where do cyclists ride? *Transportation Research Part A, 46*(10), 1730–1740. https://doi.org/10.1016/j.tra.2012.07.005
- Dill, J., & McNeil, N. (2013). Four types of cyclists? *Transportation Research Record, 2387*, 129–138. https://doi.org/10.3141/2387-15
- Geurs, K. T., & van Wee, B. (2004). Accessibility evaluation of land-use and transport strategies. *Journal of Transport Geography, 12*(2), 127–140. https://doi.org/10.1016/j.jtrangeo.2003.10.005
- Lowry, M. B., Furth, P., & Hadden-Loh, T. (2016). Prioritizing new bicycle facilities to improve low-stress network connectivity. *Transportation Research Part A, 86*, 124–140. https://doi.org/10.1016/j.tra.2016.02.003
- Macharis, C., de Witte, A., & Ampe, J. (2009). The multi-actor, multi-criteria analysis methodology. *Journal of Advanced Transportation, 43*(2), 183–202. https://doi.org/10.1002/atr.5670430206
- Mekuria, M. C., Furth, P. G., & Nixon, H. (2012). *Low-Stress Bicycling and Network Connectivity*. Mineta Transportation Institute.
- Natera Orozco, L. G., Battiston, F., Iñiguez, G., & Szell, M. (2020). Data-driven strategies for optimal bicycle network growth. *Royal Society Open Science, 7*, 201130. https://doi.org/10.1098/rsos.201130
- Páez, A., Scott, D. M., & Morency, C. (2012). Measuring accessibility. *Journal of Transport Geography, 25*, 141–153. https://doi.org/10.1016/j.jtrangeo.2012.03.016
- Strahler, A. N. (1957). Quantitative analysis of watershed geomorphology. *Transactions, American Geophysical Union, 38*(6), 913–920. https://doi.org/10.1029/TR038i006p00913
- Szell, M., Mimar, S., Perlman, T., Ghoshal, G., & Sinatra, R. (2022). Growing urban bicycle networks. *Scientific Reports, 12*, 6765. https://doi.org/10.1038/s41598-022-10783-y

## 18. Citación

> **Gobierno Regional Metropolitano de Santiago, López, A., & Bastías, G. (2026). *EVA — Evaluador de Ciclovías Proyectadas* (Version v3.12.1) [Computer software]. Zenodo. https://doi.org/10.5281/zenodo.22145509**

La reproducción de un resultado específico requiere además informar las versiones de datos y metodología, parámetros, ponderaciones y, cuando corresponda, la secuencia de proyectos incorporados.
