# EVA — Evaluador de Ciclovías Proyectadas

## Memoria técnica, metodológica y científica

**Gobierno Regional Metropolitano de Santiago — División de Infraestructura y Transportes**  
**Release pública:** v3.12.1  
**Motor de cálculo:** v3.12.0  
**Datos:** 2026.08  
**Procesamiento:** 2026.08-comunas-oficiales  
**Metodología:** v2.3.0  
**Fecha de esta memoria:** 28 de agosto de 2026  
**DOI de la versión:** 10.5281/zenodo.22145509

**Autoría institucional:** Gobierno Regional Metropolitano de Santiago  
**Desarrollo técnico:** Ariel López y Gabriela Bastías, División de Infraestructura y Transportes

> **EVA no automatiza la decisión pública. Automatiza una parte sustantiva de la complejidad de cálculo necesaria para que una decisión de inversión pueda ser comparada, discutida, modificada y reevaluada sobre una base común de evidencia.**

---

## Contenido

1. Resumen ejecutivo
2. Problema de decisión y formulación científica
3. Arquitectura del sistema
4. Inventario de datos de la versión 2026.08
5. Modelo de accesibilidad y viabilidad OD
6. Evaluación marginal de un proyecto
7. Parámetros activos de la versión vigente
8. Sistema multicriterio
9. Catálogo científico de criterios
10. Modelo de elección modal y ciclistas inducidos
11. Índice de conectividad dendrítica
12. Escenarios de política pública
13. Priorización secuencial
14. Sensibilidad, robustez y comparación de carteras
15. Control de calidad
16. Reproducibilidad y trazabilidad
17. Validación: alcances diferenciados
18. Aplicación institucional y gobernanza de decisión
19. Limitaciones científicas y técnicas
20. Agenda de investigación y mejora
21. Catálogo compacto de ecuaciones
22. Matriz de trazabilidad entre metodología y código
23. Observaciones de coherencia detectadas
24. Referencias
25. Citación de EVA
26. Conclusiones

---

## Nota de actualización y alcance

Esta memoria describe el comportamiento de la versión pública de EVA correspondiente al release v3.12.1, cuyo motor de cálculo es v3.12.0 y cuya metodología se identifica como v2.3.0. Sustituye, para efectos de descripción técnica vigente, a la memoria de junio de 2026 asociada a EVA v3.5.0, datos 2026.06 y metodología v1.7.0. La memoria anterior debe conservarse como registro histórico de evolución, pero no debe utilizarse como fuente de verdad para parámetros, criterios o funcionalidades actuales.

La actualización es necesaria porque la plataforma incorporó, entre otras capacidades, un modelo de elección modal para estimar ciclistas inducidos, un índice de conectividad dendrítica basado en distancia topológica a una red raíz, nuevos criterios de intermodalidad, factibilidad y parques, perfiles de usuario, umbrales de calidad de la red, límites comunales oficiales, análisis de carteras, controles adicionales de calidad, nuevas exportaciones y una ampliación del conjunto de escenarios de política pública.

Esta memoria se construyó contrastando tres niveles de evidencia: (i) el código fuente publicado de EVA, que se considera fuente primaria para describir el comportamiento computacional; (ii) la documentación metodológica incorporada en la interfaz y las memorias precedentes; y (iii) literatura científica y técnica utilizada para contextualizar las decisiones de modelación. Cuando existe una discrepancia entre un texto histórico y la implementación vigente, este documento privilegia el código ejecutable y explicita la diferencia.

No se presenta EVA como un modelo causal que determine cuál ciclovía “debe” construirse. Se presenta como un **sistema de apoyo a decisiones de cartera**, diseñado para hacer explícitos criterios, supuestos y consecuencias de distintas configuraciones de política pública.

---

# 1. Resumen ejecutivo

EVA es un sistema de apoyo a la decisión pública desarrollado por la División de Infraestructura y Transportes del Gobierno Regional Metropolitano de Santiago para evaluar y priorizar carteras de infraestructura ciclable como componentes de una red dinámica. Su pregunta central no es únicamente *qué proyecto tiene mejores atributos*, sino **qué proyecto conviene incorporar en cada etapa cuando la construcción de un arco modifica la conectividad, accesibilidad y valor marginal de los proyectos restantes**.

La aplicación actual trabaja con una cartera de 133 proyectos que representa aproximadamente 824 km de infraestructura proyectada. La red base publicada contiene 601 ejes y aproximadamente 940 km de infraestructura ciclable existente. La evaluación combina información censal y territorial, flujos origen-destino laborales, educación superior, siniestralidad ciclista, red de transporte público, parques y áreas verdes, prioridades institucionales y atributos de factibilidad. El sistema incorpora 16 dimensiones en su esquema de evaluación, de las cuales 15 son ponderables en el score ordinario y una —Monumentos Nacionales— opera como criterio contextual con peso neutro por defecto.

EVA distingue tres operaciones diferentes. Primero, **evalúa marginalmente** cada proyecto contra el estado vigente de la red. Segundo, **construye rankings multicriterio** bajo diferentes ponderaciones. Tercero, ejecuta un **solver secuencial greedy**, incorporando el proyecto mejor evaluado en cada iteración y reevaluando luego toda la cartera sobre la nueva red. Esto último es esencial: el valor de un proyecto no es constante en el tiempo.

La versión vigente incorpora además dos desarrollos metodológicos que merecen tratamiento científico específico. El primero es un modelo Logit binario, estimado en Biogeme, que aproxima la variación en la probabilidad de utilizar bicicleta para viajes al trabajo y permite estimar ciclistas inducidos por nueva infraestructura. El segundo es un **índice de conectividad dendrítica**, operacionalizado como distancia topológica mínima a una red raíz mediante búsqueda en anchura (BFS), con atenuación geométrica y actualización incremental a medida que se incorporan proyectos.

El sistema mantiene mecanismos de auditabilidad: versionamiento de motor, datos, procesamiento y metodología; hashes deterministas de datos y configuración; exportación de parámetros y ponderaciones; control de calidad; explicabilidad de la composición del score; sensibilidad a pesos y parámetros; y código fuente publicado bajo Apache License 2.0. La versión v3.12.1 se encuentra archivada en Zenodo con DOI `10.5281/zenodo.22145509`.

La aplicación institucional no se limita a un prototipo. EVA fue aplicado sobre la cartera completa de 133 proyectos y se han definido los primeros 19 proyectos de una priorización secuencial cuyo orden restante seguirá reevaluándose conforme evolucione la red. Sobre esos primeros proyectos se han iniciado, según el estado de cada iniciativa, procesos de términos de referencia, licitación, levantamientos topográficos y diseños. La metodología ha sido objeto de revisión técnica externa y la herramienta, sus criterios y su aplicación han sido presentados, discutidos y validados con organizaciones de la sociedad civil vinculadas a la movilidad en la Mesa Santiago Caminable y Pedaleable.

---

# 2. Problema de decisión y formulación científica

## 2.1 De una lista de proyectos a un problema de red

Una cartera de infraestructura suele presentarse administrativamente como un conjunto de proyectos independientes. Para una red de movilidad esa representación es incompleta. Si un arco nuevo conecta dos subredes previamente separadas, modifica la cantidad de orígenes y destinos alcanzables, el beneficio de proyectos vecinos y la utilidad marginal de obras posteriores. Por ello, la función de valor de un proyecto depende del estado de la red al momento de evaluarlo.

Sea una red ciclable efectiva en la iteración $t$:

$$
G_t=(V_t,E_t)
$$

y una cartera de proyectos candidatos $\mathcal{P}_t$. La evaluación de un proyecto $p$ no se expresa como una constante $U(p)$, sino como una función dependiente del estado:

$$
U_t(p)=U(p\mid G_t,\Theta,W,D)
$$

donde $\Theta$ representa parámetros metodológicos, $W$ las ponderaciones de política pública y $D$ los datos vigentes.

Una vez incorporado un proyecto seleccionado $p_t^*$:

$$
G_{t+1}=G_t\cup p_t^*
$$

por lo que, en general:

$$
U_{t+1}(q)\neq U_t(q), \qquad q\in\mathcal{P}_{t+1}.
$$

Esta dependencia es el fundamento del solver secuencial de EVA.

## 2.2 Decisión multicriterio y carácter normativo

La priorización no puede reducirse a una sola variable sin imponer implícitamente una política. Maximizar demanda, cerrar brechas territoriales, mejorar seguridad vial, conectar Metro, reducir costo o expandir continuidad son objetivos legítimos pero no equivalentes. EVA hace visibles esas elecciones mediante ponderaciones explícitas.

La literatura de análisis multicriterio aplicada a transporte muestra precisamente que distintas partes interesadas pueden asignar importancias diferentes a objetivos cuantitativos y cualitativos. EVA adopta una suma ponderada por su transparencia y facilidad de deliberación, no porque suponga que exista un conjunto de pesos “científicamente correcto”. En este sentido, los datos son empíricos; **los pesos son normativos**.

## 2.3 Accesibilidad como relación origen-red-destino

EVA no define accesibilidad únicamente por proximidad a una ciclovía. Una persona puede vivir a pocos metros de infraestructura y, sin embargo, no disponer de una subred que le permita alcanzar su destino. El sistema combina proximidad de origen, continuidad de la red y servicio del destino. Esta aproximación se alinea con la literatura que entiende accesibilidad como potencial de alcanzar oportunidades espacialmente distribuidas y advierte que la elección de indicadores contiene decisiones normativas (Geurs y van Wee, 2004; Páez, Scott y Morency, 2012).

## 2.4 Conectividad, estrés y crecimiento de redes

La conectividad ciclable no es equivalente a conectividad vial general. La literatura de *low-stress bicycling* destaca que la red relevante para una gran parte de la población es aquella que puede recorrerse sin enlaces con niveles de estrés incompatibles con su tolerancia (Mekuria, Furth y Nixon, 2012). EVA no implementa un LTS completo arco a arco, pero incorpora un perfil de usuario “general” que excluye ciertas tipologías de la red efectiva y un umbral opcional de proporción protegida por componente.

La literatura reciente también ha estudiado el crecimiento de redes ciclistas como problema estructural y secuencial. Natera Orozco et al. (2020) y Szell et al. (2022) muestran que la estrategia de crecimiento altera las propiedades de la red y que pueden existir rendimientos no lineales. Lowry, Furth y Hadden-Loh (2016) demuestran además que es posible priorizar proyectos ciclables por su aporte incremental a la conectividad y accesibilidad. EVA se inscribe en esa familia de problemas, con una adaptación al contexto institucional y de datos de Santiago.

---

# 3. Arquitectura del sistema

## 3.1 Capas funcionales

La arquitectura publicada puede describirse en seis capas:

1. **Datos:** carteras de proyectos, red existente, hexágonos OD, educación superior, siniestros, monumentos, ferias, Metro, paraderos de bus, parques, límites comunales y variables del modelo modal.
2. **Motor geoespacial:** muestreo de líneas, grilla espacial, proximidad, construcción de componentes conexos y evaluación marginal.
3. **Modelos complementarios:** elección modal Logit, conectividad dendrítica y vista de subredes aisladas.
4. **Evaluación multicriterio:** normalización, ponderaciones, escenarios y explicabilidad.
5. **Análisis:** solver secuencial, sensibilidad, comparación de carteras y QA.
6. **Interfaz y salida:** mapas, fichas, reportes, CSV, GeoJSON, JSON reproducibles y bloques de procedencia.

La aplicación mantiene componentes separados en el repositorio (`engine.jsx`, `demanda-modal.jsx`, `fractal.js`, `analysis.jsx`, `qa.jsx`, `scenarios.jsx`, `reports.js`, entre otros), lo que favorece la revisión de responsabilidades y la trazabilidad de cambios.

## 3.2 Convención geométrica

Para cálculos rápidos dentro de la Región Metropolitana, el motor aproxima coordenadas WGS84 mediante factores locales:

$$
K_x\approx 92.6\;\text{km/grado},\qquad K_y\approx111\;\text{km/grado}.
$$

Para dos puntos $(\lambda_1,\phi_1)$ y $(\lambda_2,\phi_2)$, la distancia local utilizada es:

$$
d\approx 1000\sqrt{[(\lambda_2-\lambda_1)K_x]^2+[(\phi_2-\phi_1)K_y]^2}.
$$

Esta aproximación es computacionalmente eficiente y razonable para análisis regionales de proximidad, pero no reemplaza una métrica geodésica o un ruteo sobre red cuando se requieren precisiones de ingeniería.

## 3.3 Muestreo de geometrías y grilla espacial

Las geometrías lineales se densifican a intervalos regulares y sus muestras se indexan en una grilla espacial. El motor principal emplea una celda de aproximadamente $0.005^\circ$ y utiliza búsquedas en celdas vecinas para reducir el número de comparaciones. La conectividad de ejes no se calcula mediante una matriz completa $O(n^2)$ de distancias, sino a partir de muestras candidatas próximas.

La granularidad de muestreo introduce una aproximación. Por ello, tolerancias como `connectTol` deben interpretarse conjuntamente con el paso de muestreo y no como una precisión topográfica.

## 3.4 Componentes conexos mediante union-find

Sea el conjunto de ejes efectivos $E$. Dos ejes se consideran conectables cuando existen muestras cuya distancia es menor o igual a la tolerancia de empalme $\tau$. Sobre esa relación se construyen componentes conexos mediante *union-find*.

$$
e_i\sim e_j \quad \text{si}\quad d_{min}(e_i,e_j)\le\tau.
$$

El resultado es una partición:

$$
E=G_1\cup G_2\cup\cdots\cup G_K, \qquad G_i\cap G_j=\varnothing.
$$

Cada componente representa una subred operativa bajo la tolerancia seleccionada. La elección de $\tau$ es crítica: valores bajos producen una red más fragmentada; valores altos fusionan discontinuidades crecientes y pueden generar conexiones geométricas que no son funcionalmente cruzables.

---

# 4. Inventario de datos de la versión 2026.08

La siguiente tabla resume el inventario funcional utilizado por la versión pública. Los conteos deben interpretarse como estado del paquete de datos 2026.08 y pueden cambiar en versiones posteriores.

| Componente | Magnitud de referencia | Uso principal |
|---|---:|---|
| Proyectos Plan Maestro | 133 proyectos, ~824 km | Universo principal de evaluación y priorización |
| Red ciclable existente | 601 ejes, ~940 km | Red base para componentes, cobertura y conectividad |
| Hexágonos OD | 1.589 | Unidad de agregación de población y flujos laborales |
| Población empleada modelada | ~3,44 millones | Cobertura y demanda laboral |
| Flujo OD laboral | ~2,57 millones viajes/día | Viabilidad y demanda habilitada |
| Variables Logit observadas | 1.006 hexágonos | Escolaridad y desnivel observados para modelo modal |
| Educación superior | 152 sedes, ~371.747 matrículas | Generación estudiantil / acceso a sedes |
| Siniestros ciclistas 2020–2024 | 4.446 eventos | Seguridad vial; 94 fallecidos y 853 graves en la base publicada |
| Monumentos nacionales | 351 | Contexto patrimonial |
| Ferias libres | 395 | Contexto de compatibilidad operacional |
| Estaciones de Metro | 126 | Intermodalidad bici–Metro |
| Paraderos de bus | ~12.177 | Complejidad operacional informativa |
| Parques y áreas verdes | 754 | Atractor recreativo ponderado por superficie |
| Comunas RM | 52 | Agregación territorial y límites oficiales |
| Otras carteras | 639 proyectos | Evaluación exploratoria de iniciativas externas al Plan Maestro |

### 4.1 Población y OD

Los hexágonos integran población ocupada y un vector de destinos laborales. El motor principal utiliza hasta diez destinos principales por hexágono en su condición de viabilidad. Debe distinguirse entre el flujo OD utilizado por el motor y una predicción de demanda ciclista: **un viaje habilitable no es necesariamente un viaje que será realizado en bicicleta**. Esa segunda pregunta se aborda separadamente con el modelo Logit.

### 4.2 Límites comunales oficiales

La versión 2026.08 incorpora límites comunales oficiales reproyectados a WGS84 y utiliza overlay punto-en-polígono para completar la pertenencia comunal de proyectos. El procedimiento de vecino OD más cercano permanece como respaldo. Esta mejora reduce una fuente de error presente en versiones anteriores.

### 4.3 Transporte público y atractores

Metro se incorpora como hotspot intermodal; los paraderos de bus se contabilizan como contexto de complejidad; parques se ponderan por superficie; ferias se identifican por proximidad e intersección de sus trazados; y sedes de educación superior se utilizan como destinos que una subred puede alcanzar.

---

# 5. Modelo de accesibilidad y viabilidad OD

## 5.1 Acceso al origen

Para cada hexágono $h$, se obtiene el conjunto de componentes que se encuentran dentro de la distancia de acceso al origen $\delta_O$:

$$
A_O(h)=\{K: d(h,G_K)\le\delta_O\}.
$$

Con el valor por defecto vigente:

$$
\delta_O=700\;m.
$$

Un hexágono se considera conectado si $|A_O(h)|>0$ después de aplicar, cuando corresponda, los filtros de perfil y porcentaje protegido.

## 5.2 Servicio de destino

Para cada componente $K$ y comuna $c$, el motor calcula la población de esa comuna que se encuentra dentro de la distancia efectiva de destino:

$$
\delta_D^{eff}=\delta_D+\alpha_f,
$$

donde $\alpha_f$ es la aproximación final aceptada sin infraestructura. En la configuración por defecto vigente $\alpha_f=0$, por lo que $\delta_D^{eff}=700$ m.

El componente sirve una comuna cuando:

$$
serves(K,c)=\mathbb{1}\left[
\frac{P_{K,c}^{\le\delta_D^{eff}}}{P_c}\ge\theta
\right],
$$

con $\theta=0.40$ por defecto.

Esta condición evita que una subred que apenas roza una comuna sea tratada como si permitiera alcanzar cualquier destino dentro de ella. No obstante, la población comunal funciona como proxy de la distribución espacial de empleos porque el Censo identifica la comuna de trabajo, no el punto exacto de empleo.

## 5.3 Restricción de tiempo

Si `tiempoMax > 0`, se calcula una distancia máxima aproximada:

$$
d_{max}=v_{ref}\frac{t_{max}}{60},
$$

y un par OD se descarta cuando la distancia euclidiana entre el hexágono de origen y el centroide poblacional de la comuna destino supera ese valor.

Con los valores por defecto vigentes, `tiempoMax = 0`, por lo que esta restricción está desactivada. La velocidad de referencia permanece disponible con default $15$ km/h para escenarios en que se active el límite temporal.

## 5.4 Umbral de infraestructura protegida

La implementación actual calcula, para cada componente $K$:

$$
q_K=\frac{L_K^{prot}}{L_K^{tot}}.
$$

Cuando el parámetro $\pi_{min}>0$, el componente solo habilita beneficios si:

$$
q_K\ge\pi_{min}.
$$

Es importante precisar que **este control se aplica al componente completo, no a la ruta OD individual**. La descripción “porcentaje protegido del viaje” debe entenderse en esta versión como una aproximación a la calidad de la subred. El valor por defecto vigente es $\pi_{min}=0$, es decir, sin exigencia adicional.

## 5.5 Perfil de usuario

EVA distingue dos perfiles de red efectiva:

- **general:** excluye de la red base tipologías identificadas internamente como `piloto`, `zona30` y `otro`;
- **experto:** utiliza toda la red publicada.

Este mecanismo aproxima la diferencia entre una red tolerable para usuarios generales y una red utilizable por ciclistas con mayor disposición a compartir espacio con tránsito motorizado. No equivale a una clasificación LTS completa y debe interpretarse como filtro operativo.

---

# 6. Evaluación marginal de un proyecto

Cada proyecto se evalúa temporalmente contra la red base vigente. El proceso puede resumirse así:

1. muestrear su geometría;
2. identificar los componentes de red que toca a distancia $\tau$;
3. construir la unión de cobertura destino de esos componentes y del propio proyecto;
4. identificar hexágonos que ganan acceso al origen;
5. reevaluar viajes OD que eran inviables;
6. calcular beneficios marginales y atributos de contexto;
7. retirar el proyecto y repetir con el siguiente candidato.

## 6.1 Componentes tocados

Sea $T(p)$ el conjunto de componentes a distancia menor o igual a `connectTol`:

$$
T(p)=\{K: d(p,G_K)\le\tau\}.
$$

La cantidad $|T(p)|$ alimenta el criterio de continuidad y determina qué subredes se fusionan virtualmente para evaluar el proyecto.

## 6.2 Fusión sin doble conteo

Para una comuna $c$, el servicio de la red fusionada se construye como unión de identificadores de hexágono, no como suma directa de coberturas de componentes. Si $H_{K,c}$ es el conjunto de hexágonos de la comuna $c$ servidos por $K$:

$$
H_{p,c}^{merge}=H_{p,c}\cup\bigcup_{K\in T(p)}H_{K,c}.
$$

La población servida se calcula después sobre la unión:

$$
P_{p,c}^{merge}=\sum_{h\in H_{p,c}^{merge}}P_h.
$$

Esta regla evita que un hexágono cubierto por dos componentes sea contado dos veces.

## 6.3 Demanda potencial y demanda habilitada

Para cada hexágono candidato, el sistema examina sus destinos laborales principales que **no eran viables en la base**. La suma de esos flujos conforma el potencial habilitable $F_p^{pot}$. Los flujos que, después de fusionar el proyecto y los componentes tocados, pasan a cumplir la condición de servicio conforman $F_p^{hab}$.

$$
F_p^{pot}=\sum_{h,d}f_{h,d}\,\mathbb{1}[\neg v_{h,d}^{base}]\,\mathbb{1}[h\text{ interactúa con }p]
$$

$$
F_p^{hab}=\sum_{h,d}f_{h,d}\,\mathbb{1}[\neg v_{h,d}^{base}]\,\mathbb{1}[v_{h,d}^{p}].
$$

La población beneficiada OD cuenta una vez a cada hexágono que obtiene al menos un destino nuevo viable.

---

# 7. Parámetros activos de la versión vigente

El archivo `src/version.jsx` funciona como fuente única de verdad de los defaults del motor. Esto es relevante porque algunos textos históricos de la interfaz aún conservan valores anteriores. La siguiente tabla refleja el comportamiento ejecutable actual.

| Parámetro | Símbolo | Default | Rango UI | Efecto computacional |
|---|---|---:|---:|---|
| Acceso origen | $\delta_O$ | 700 m | 200–1500 m | Componentes accesibles desde cada hexágono |
| Acceso destino | $\delta_D$ | 700 m | 200–1500 m | Servicio de comuna y sedes |
| Tolerancia de empalme | $\tau$ | 150 m | 50–500 m | Formación de componentes conexos |
| Cobertura mínima destino | $\theta$ | 40 % | 0–100 % | Condición `serves(K,c)` |
| Costo por km | $c_{km}$ | 100 MCLP/km | 1–5000 | Costo total y eficiencia |
| Proporción protegida mínima | $\pi_{min}$ | 0 % | 0–100 % | Filtro de componentes por calidad |
| Aproximación final | $\alpha_f$ | 0 m | 0–1500 m | Aumenta radio efectivo de destino |
| Tiempo máximo | $t_{max}$ | 0 min | 0–120 min | 0 = sin límite; filtra pares OD si se activa |
| Velocidad de referencia | $v_{ref}$ | 15 km/h | 12–20 | Convierte tiempo máximo en distancia |
| Perfil | — | general | general/experto | Selección de red efectiva |
| Seguridad KSI | — | falso | todos/KSI | Cambia severidad utilizada en seguridad |

### Nota de coherencia documental

La memoria de junio y algunas fichas históricas describían `porcProtegido`, `aproxFinal` y `tiempoMax` como parámetros en desarrollo o mostraban defaults de 50 %, 700 m y 60 min. En el código vigente esos parámetros están activos pero sus defaults son **0 %, 0 m y 0 min**, respectivamente. Esta memoria adopta los valores ejecutables.

---

# 8. Sistema multicriterio

## 8.1 Normalización

La mayoría de los criterios cuantitativos se normalizan por el máximo observado entre los proyectos activos de la cartera:

$$
\hat{x}_{i,p}=\frac{x_{i,p}}{\max_{q\in\mathcal{P}_{act}} x_{i,q}}.
$$

Este esquema tiene dos propiedades. Primero, preserva una interpretación simple $\hat{x}\in[0,1]$. Segundo, hace que el valor normalizado sea **relativo al universo activo**: agregar, retirar o bloquear proyectos puede modificar los denominadores y, por tanto, los scores relativos.

Equidad, prioridad GORE y continuidad ya se construyen directamente en $[0,1]$. Eficiencia económica utiliza una transformación inversa del costo.

## 8.2 Score ordinario

Con Monumentos en peso cero y pesos no negativos, el score se calcula como:

$$
S_p=\frac{\sum_{i\in I}w_i\hat{x}_{i,p}}{\sum_{i\in I}w_i}.
$$

La implementación trata Monumentos como modificador contextual: su peso se excluye del denominador pero, si el usuario lo activa, su contribución puede sumarse o restarse en el numerador. Por ello, con peso patrimonial distinto de cero el score no queda necesariamente restringido al intervalo $[0,1]$.

## 8.3 Explicabilidad

`evaExplainScore` calcula el aporte de cada criterio:

$$
a_{i,p}=\frac{w_i\hat{x}_{i,p}}{\sum_jw_j},
$$

ordena esos aportes, identifica fortalezas y debilidades y marca dependencia de un criterio cuando el principal explica más de 45 % del score agregado. Esta regla no constituye una prueba estadística de causalidad; es una alerta de concentración de la función multicriterio.

---

# 9. Catálogo científico de criterios

## 9.1 Población marginal

**Pregunta:** ¿cuántas personas ocupadas ganan acceso directo a la red con el proyecto?

$$
\Delta Pob_p=\sum_{h\in H_O(p)}P_h\,\mathbb{1}[h\text{ no conectado en la base}].
$$

Este indicador evita premiar repetidamente a población que ya tenía acceso. Su principal limitación es espacial: utiliza proximidad euclidiana del centroide del hexágono a la infraestructura, por lo que no representa barreras peatonales/ciclistas finas ni distancia real por la vialidad.

## 9.2 Proxy de habilitación OD — campo histórico `costoOD`

La etiqueta histórica “costo OD” puede inducir a pensar que el motor calcula una ruta de costo generalizado arco a arco. **La versión 3.12.0 no hace ese cálculo.** El valor ejecutable es una transformación de la tasa de habilitación de viajes potencialmente habilitables:

$$
r_p=\begin{cases}
F_p^{hab}/F_p^{pot}, & F_p^{pot}>0,\\
0,&F_p^{pot}=0.
\end{cases}
$$

El campo interno se construye como:

$$
costoOD_p=-\operatorname{round}(30r_p),
$$

y la normalización usa su valor absoluto. En términos prácticos, el criterio favorece proyectos que convierten una mayor proporción de viajes candidatos de inviables a viables.

**Implicación científica:** en esta memoria se recomienda denominarlo **proxy de habilitación OD**. Un verdadero costo generalizado requeriría grafo arco a arco, función de impedancia, ruteo y atributos de cada segmento. La ecuación de costo percibido que aparece en documentos históricos debe considerarse una línea de desarrollo, no una descripción del cálculo vigente.

## 9.3 Oportunidades / hexágonos beneficiados

$$
O_p=|\{h:\exists d\;\neg v^{base}_{h,d}\land v^{p}_{h,d}\}|.
$$

Mide extensión territorial del beneficio, no intensidad. Por eso complementa población marginal y demanda habilitada.

## 9.4 Equidad territorial

Sea $\widetilde{cob}$ la mediana de cobertura comunal y $B_p$ los hexágonos con nuevos viajes viables:

$$
E_p=\frac{\sum_{h\in B_p}P_h\,\mathbb{1}[cob_{c(h)}<\widetilde{cob}]}{\sum_{h\in B_p}P_h}.
$$

El indicador prioriza beneficios que recaen en comunas con cobertura ciclable inferior a la mediana. Es una medida distributiva territorial, no un índice socioeconómico: no utiliza ingreso o vulnerabilidad individual.

## 9.5 Continuidad / interconexión

Si $K_p=|T(p)|$ es la cantidad de componentes que el proyecto toca:

$$
Cont_p=\min\left(1,\frac{K_p}{4}\right).
$$

La saturación en cuatro componentes evita que un caso geométricamente excepcional domine el score. La métrica no pondera el tamaño de las subredes; esa información aparece indirectamente en los viajes habilitados.

## 9.6 Demanda OD habilitada

$$
D_p=\sum_{h}\sum_d f_{h,d}\;\mathbb{1}[\neg v^{base}_{h,d}\land v^p_{h,d}].
$$

Es la cantidad de viajes laborales diarios que pasan de inviables a viables bajo la lógica de componentes y servicio de destino. Es una métrica de **posibilidad de viaje**, no de elección modal.

## 9.7 Ciclistas inducidos

Se desarrolla en detalle en el capítulo 10. Su indicador principal es:

$$
\Delta Cicl_p=\sum_h P_h[P_h^{bici}(con\;p)-P_h^{bici}(base)].
$$

La implementación usa población ocupada del hexágono como factor de expansión.

## 9.8 Conectividad dendrítica

Se desarrolla en detalle en el capítulo 11. El indicador normalizado vigente es una función de la distancia topológica mínima a la red raíz y de una atenuación $\alpha=0.5$.

## 9.9 Generación estudiantil

EVA combina dos componentes conceptualmente diferentes:

$$
Est_p=EstM_p+EstS_p.
$$

`EstM` aproxima estudiantes de enseñanza media que ganan acceso por proximidad al origen; `EstS` representa estudiantes superiores que antes no alcanzaban ninguna sede a través de una subred accesible y pasan a poder alcanzar al menos una después de incorporar el proyecto. La segunda parte es una condición de acceso a sedes, no una matriz residencia-sede observada.

## 9.10 Prioridad de inversión GORE

Cada comuna del ranking institucional recibe un score:

$$
s_c\in\{1,0.75,0.5,0.25,0\}.
$$

Para un proyecto:

$$
PG_p=\frac{\sum_c\Delta B_{p,c}s_c}{\sum_c\Delta B_{p,c}},
$$

donde $\Delta B_{p,c}$ es la población nueva beneficiada en la comuna. Sin población beneficiada, el valor es 0.5 neutro. Este criterio es explícitamente **institucional y normativo**, no una propiedad física del proyecto.

## 9.11 Eficiencia económica

El costo referencial vigente es:

$$
C_p=L_p\,c_{km},
$$

con $c_{km}=100$ MCLP/km por defecto. La eficiencia normalizada es:

$$
Eff_p=1-\frac{C_p}{\max_q C_q}.
$$

No es una evaluación social de proyectos: no calcula VAN, TIR, beneficios monetizados ni costos de ciclo de vida.

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

1. **Raíz normativa:** elegir Alameda como tronco expresa una hipótesis espacial de desarrollo, no una verdad natural.
2. **Tolerancia:** 100 m puede fusionar ejes separados por barreras físicas.
3. **Distancia topológica:** no distingue longitud métrica; un proyecto de 300 m y uno de 8 km pueden tener el mismo grado.
4. **Atenuación fija:** $\alpha=0.5$ no está calibrado empíricamente.
5. **Dependencia de nombres:** la detección inicial de Alameda depende de atributos textuales de la base.
6. **No es Strahler clásico:** no utiliza reglas de confluencia de órdenes ni razón de bifurcación.

## 11.9 Protocolo científico propuesto de sensibilidad dendrítica

La versión publicada no automatiza todavía este experimento, pero la validación futura debería considerar:

$$
\tau_f\in\{50,75,100,150\}\;m
$$

y

$$
\alpha\in\{0.35,0.50,0.65,0.80\}.
$$

Para cada configuración se recomienda comparar rankings mediante Spearman $\rho$, Kendall $\tau_K$, frecuencia Top-10 y rango de posiciones. Un proyecto podría clasificarse como dendríticamente robusto si mantiene un rango pequeño y elevada frecuencia Top-10 a través de combinaciones plausibles de $\tau_f$ y $\alpha$.

Este protocolo permitiría separar proyectos cuya prioridad es una propiedad estable de la estructura de red de aquellos cuya posición depende fuertemente de una convención geométrica.

---

# 12. Escenarios de política pública

La versión actual publica doce escenarios predefinidos. Todos, salvo la ponderación RMC, fueron homologados para mantener un piso de contexto en los criterios ponderables; Monumentos permanece en cero por defecto.

| Escenario | Foco dominante |
|---|---|
| Ponderación RMC | Configuración institucional específica |
| Balanceado | Cobertura, demanda, equidad y continuidad |
| Equidad territorial | Cierre de brechas |
| Demanda potencial | Flujos OD habilitados |
| Ciclistas inducidos (Biogeme) | Cambio modal estimado |
| Red dendrítica Alameda | Crecimiento desde red raíz |
| Continuidad de red | Interconexión de subredes |
| Eficiencia presupuestaria | Beneficio relativo y factibilidad |
| Educación superior | Generación/acceso estudiantil |
| Integración metropolitana | Intercomunalidad, Metro y continuidad |
| Seguridad vial | Peligrosidad ciclista prevenible |
| Intermodalidad bici–Metro | Conexión de estaciones |

Estos escenarios no deben interpretarse como “alternativas técnicas neutras”. Cada uno expresa una visión de qué dimensión debe recibir mayor peso. El valor de EVA reside en permitir que esas diferencias sean observables y comparables con los mismos datos.

---

# 13. Priorización secuencial

## 13.1 Ranking estático

Con una red fija $G_t$, el ranking estático ordena:

$$
rank_t=sort_{desc}\{S_t(p):p\in\mathcal P_t\}.
$$

Es útil para explorar pesos rápidamente, pero no captura cómo cambia la red después de seleccionar un proyecto.

## 13.2 Solver greedy iterativo

El solver completo aplica:

$$
p_t^*=\arg\max_{p\in\mathcal P_t}S(p\mid G_t).
$$

Luego:

$$
G_{t+1}=G_t\cup p_t^*,
$$

$$
\mathcal P_{t+1}=\mathcal P_t\setminus\{p_t^*\},
$$

y se recalculan indicadores, normalizaciones, componentes, demanda OD y demás dimensiones para los candidatos restantes.

El algoritmo puede detenerse por agotamiento de cartera, número máximo de pasos, ausencia de aporte positivo o presupuesto.

## 13.3 Restricción presupuestaria

El costo del proyecto es:

$$
C_p=L_pc_{km}.
$$

En cada iteración, si el candidato de mayor score excede el presupuesto restante, el solver avanza al siguiente candidato factible. Esto es un **greedy con restricción de presupuesto**, no un algoritmo exacto de mochila.

## 13.4 Optimalidad

EVA no afirma que el greedy encuentre el óptimo global. Dos proyectos con score individual moderado pueden producir juntos una sinergia superior a un proyecto líder. Formalmente, el procedimiento garantiza una mejor elección local según la función vigente, no la maximización exhaustiva de todas las permutaciones posibles.

Para $N=133$, una búsqueda exhaustiva de secuencias es inviable ($N!$). Alternativas futuras incluyen búsqueda por haces (*beam search*), algoritmos genéticos, programación matemática aproximada o métodos basados en propiedades submodulares, pero requerirían definir con precisión una función objetivo global y asumir costos computacionales mayores.

## 13.5 Por qué la secuencia es un resultado distinto del ranking

La diferencia conceptual puede representarse así:

$$
S_0(p_1)>S_0(p_2)
$$

no implica:

$$
S_1(p_2)=S_0(p_2).
$$

Al construir $p_1$, $p_2$ puede perder valor porque una conexión ya fue resuelta o ganarlo porque ahora empalma con una red mayor. Por esta razón, EVA prioriza **secuencias** y no solo listas ordenadas.

---

# 14. Sensibilidad, robustez y comparación de carteras

## 14.1 Sensibilidad a ponderaciones

La función `evaSensitivity` re-puntúa los proyectos usando todos los escenarios predefinidos y perturbaciones de ±50 % sobre un conjunto de doce criterios núcleo. Para cada proyecto registra:

- posición media;
- mejor y peor posición;
- rango;
- desviación estándar;
- frecuencia en Top-5, Top-10 y Top-20;
- dependencia de un criterio dominante.

La clasificación implementada es:

**Robusto** si:

$$
freq_{Top10}\ge80\%
$$

y

$$
rango\le\max(8,0.08N).
$$

**Sensible** si:

$$
rango\ge0.35N.
$$

El resto se clasifica como intermedio.

### Limitación de cobertura

El conjunto de perturbaciones individuales actual no incluye `intermodal`, `factibilidad` ni `parques`, aunque esos criterios sí integran el score y aparecen en los escenarios. Por tanto, la sensibilidad de pesos es amplia pero no exhaustiva respecto de los 15 criterios ponderables. Esta memoria recomienda ampliar esa rutina en una versión futura.

## 14.2 Sensibilidad paramétrica

La rutina paramétrica reejecuta el motor sobre 15 corridas, variando individualmente cinco parámetros:

| Parámetro | Valores |
|---|---|
| $\delta_O$ | 500, 700, 1000 m |
| $\delta_D$ | 500, 700, 1000 m |
| $\tau$ | 50, 150, 300 m |
| $\theta$ | 20, 40, 60 % |
| $c_{km}$ | 80, 100, 150 MCLP/km |

La rutina restaura el estado base al finalizar. Todavía no recorre automáticamente `porcProtegido`, `aproxFinal`, `tiempoMax`, parámetros Logit ni parámetros dendríticos.

## 14.3 Comparación de carteras

La comparación de carteras utiliza unión de identificadores de hexágono para población con acceso y población beneficiada, evitando doble conteo. En cambio, demanda habilitada y matrícula se reportan como suma de marginales y deben interpretarse como cota superior cuando varios proyectos benefician los mismos flujos o sedes.

Para obtener el efecto conjunto exacto de una secuencia debe ejecutarse el solver sobre la red acumulada, no sumar evaluaciones individuales.

---

# 15. Control de calidad

El módulo QA verifica, entre otros aspectos:

- identificadores internos duplicados;
- proyectos sin comuna;
- comunas inferidas o asignadas por overlay oficial;
- longitud o costo cero;
- geometrías vacías o inválidas;
- coordenadas fuera de un bounding box regional;
- diferencia superior a 10 % entre longitud geométrica y longitud declarada;
- hexágonos sin población o sin vector OD;
- sedes sin matrícula;
- comunas sin población o cobertura;
- duplicados de IDs originales de red existente.

Los hallazgos se agrupan en **críticos** y **advertencias**, produciendo los estados `CONFORME`, `CONFORME CON ADVERTENCIAS` o `NO CONFORME`.

La existencia de un QA automatizado no implica que todos los errores semánticos sean detectables. Por ejemplo, un eje puede estar correctamente georreferenciado y, aun así, poseer un atributo de número de pistas desactualizado. El QA verifica principalmente consistencia estructural y geométrica.

---

# 16. Reproducibilidad y trazabilidad

## 16.1 Versionamiento

Toda corrida debe identificarse al menos por:

- versión del motor;
- versión de datos;
- versión de procesamiento;
- versión metodológica;
- fecha de compilación;
- parámetros;
- pesos;
- escenario;
- selección de proyectos incorporados.

## 16.2 Hash de datos

`evaDataHash` construye una firma determinista no criptográfica sobre atributos seleccionados del dataset, incluyendo geometrías resumidas de proyectos, longitud de red, magnitudes OD, población, matrícula y versión.

## 16.3 Hash de configuración

$$
h_{config}=hash(\Theta,W,extra).
$$

La aplicación utiliza esta firma para advertir cuando un resultado secuencial quedó desactualizado respecto de parámetros o ponderaciones vigentes.

## 16.4 Procedencia

Las exportaciones pueden incorporar un bloque de procedencia con versiones, hashes, CRS, unidad monetaria y fecha de exportación. Este mecanismo transforma una captura de ranking en una **corrida reconstruible**.

## 16.5 Publicación abierta

El software de EVA se publica bajo Apache License 2.0. Las capas de datos mantienen sus condiciones de origen y no quedan automáticamente relicenciadas por la licencia del software. La versión pública v3.12.1 está archivada en Zenodo y posee DOI persistente.

---

# 17. Validación: alcances diferenciados

El término “validación” se utiliza en EVA con cuatro significados distintos que no deben confundirse.

## 17.1 Verificación computacional

Comprueba que el motor sea consistente con sus reglas, que los resultados cambien de forma explicable ante parámetros y que las corridas puedan reproducirse. Incluye QA, hashes, casos límite, sensibilidad y reimplementaciones parciales.

## 17.2 Revisión técnica externa

La metodología y funcionamiento han sido sometidos a revisión técnica por especialistas externos del ámbito académico y de la modelación de transportes. Este escrutinio contribuyó a mejoras, pero **no equivale a una publicación científica revisada por pares**.

## 17.3 Validación con sociedad civil

La herramienta, sus criterios, aplicación y alcance fueron presentados, discutidos y validados con organizaciones de la sociedad civil vinculadas a movilidad en la Mesa Santiago Caminable y Pedaleable. Esta dimensión evalúa pertinencia, comprensibilidad y capacidad de transparentar decisiones, no exactitud matemática de cada modelo.

## 17.4 Validación operacional

EVA fue aplicado a la cartera completa de 133 proyectos. A la fecha de esta memoria se han definido los primeros 19 proyectos de la secuencia y, según el estado de cada uno, se han iniciado procesos de TDR, licitación, levantamientos topográficos y diseños. Esta utilización demuestra integración operacional, pero no constituye por sí sola evaluación causal de los beneficios futuros de las obras.

---

# 18. Aplicación institucional y gobernanza de decisión

EVA debe entenderse como una capa de evidencia dentro de un proceso decisional más amplio. Un ranking no reemplaza:

- evaluación social de inversiones;
- factibilidad jurídica y presupuestaria;
- ingeniería de detalle;
- disponibilidad de faja;
- coordinación con municipios y organismos sectoriales;
- participación ciudadana;
- decisiones políticas legítimas.

La ventaja del sistema es reducir el costo de iterar. En un proceso manual, cambiar una ponderación, un proyecto o la red base puede requerir rehacer una cadena extensa de cálculos. En EVA, las ponderaciones se recalculan instantáneamente sobre indicadores normalizados y los cambios estructurales se procesan mediante nuevas corridas del motor.

Esto permite que la deliberación no ocurra *después* de un cálculo rígido, sino *sobre* un espacio de alternativas recalculables.

---

# 19. Limitaciones científicas y técnicas

## 19.1 Modelo zonal y centroides

Los hexágonos simplifican la distribución interna de población. Los destinos laborales se conocen principalmente a nivel comunal y sus distancias se aproximan con centroides. Las barreras urbanas finas pueden quedar invisibilizadas.

## 19.2 Conectividad por tolerancia

Tanto el motor como el índice dendrítico utilizan reglas de proximidad geométrica. Una autopista, río, muro o desnivel puede impedir una conexión que espacialmente parece cercana.

## 19.3 Ausencia de ruteo arco a arco en el score OD

La versión actual no calcula rutas de mínimo costo generalizado para cada par OD. El campo `costoOD` es un proxy de tasa de habilitación. La documentación futura debería renombrarlo o implementar la formulación de costo generalizado completa.

## 19.4 Suma multicriterio compensatoria

Una suma ponderada permite compensación total: un desempeño muy bajo en equidad puede compensarse con demanda alta. Métodos outranking o restricciones mínimas pueden ser apropiados si la institución desea criterios no compensables.

## 19.5 Logit transferido

Los coeficientes del modelo modal se aplican a RM desde una estimación nacional y el modelo utiliza solo viajes al trabajo. La inferencia de ciclistas inducidos debe presentarse como estimación modelada, no como demanda observada futura.

## 19.6 Seguridad sin exposición

Los siniestros no se dividen por flujo ciclista. La métrica mezcla volumen de exposición y riesgo por viaje. Cuando existan conteos sistemáticos de bicicletas, convendría construir tasas de siniestralidad.

## 19.7 Factibilidad por proxy

El número de pistas no representa por sí solo factibilidad constructiva. Es una variable de screening.

## 19.8 Costos lineales

El costo único por kilómetro no captura puentes, saneamiento, semáforos, expropiaciones o interferencias. La priorización presupuestaria debe actualizarse con costos de ingeniería cuando estén disponibles.

## 19.9 Greedy no global

La secuencia maximiza score marginal paso a paso, no una función global exhaustiva. La calidad de la secuencia debe analizarse frente a alternativas y sensibilidad.

## 19.10 Índice dendrítico normativo

Alameda como raíz y $\alpha=0.5$ son hipótesis de planificación. Deben someterse a sensibilidad y, si se usan para decisión formal, justificarse institucionalmente.

---

# 20. Agenda de investigación y mejora

Se proponen las siguientes líneas para versiones futuras:

1. **Ruteo ciclable arco a arco** con costo generalizado y barreras explícitas.
2. **Renombrar o reemplazar `costoOD`** para eliminar la discrepancia entre nombre histórico y cálculo vigente.
3. **Sensibilidad exhaustiva de 15 criterios** ponderables.
4. **Sensibilidad automática dendrítica** sobre $\tau_f$ y $\alpha$.
5. **Calibración local del Logit** cuando existan datos RM adecuados y validación fuera de muestra.
6. **Exposición ciclista** para convertir siniestralidad observada en tasas.
7. **Costos de ingeniería por proyecto** y escenarios de incertidumbre presupuestaria.
8. **Análisis de Pareto** para mostrar trade-offs entre demanda, equidad, seguridad y costo sin reducirlos siempre a un único score.
9. **Comparación del greedy** con beam search u otros métodos aproximados en subconjuntos de la cartera.
10. **Validación longitudinal** de resultados a medida que proyectos priorizados se diseñen y ejecuten.

---

# 21. Catálogo compacto de ecuaciones

| Concepto | Expresión |
|---|---|
| Acceso origen | $A_O(h)=\{K:d(h,G_K)\le\delta_O\}$ |
| Servicio destino | $P_{K,c}^{\le\delta_D}/P_c\ge\theta$ |
| Distancia máxima por tiempo | $d_{max}=v_{ref}t_{max}/60$ |
| Calidad protegida de componente | $q_K=L_K^{prot}/L_K^{tot}$ |
| Población marginal | $\Delta Pob_p=\sum P_h\mathbb{1}[nuevo\;acceso]$ |
| Demanda potencial | $F_p^{pot}=\sum f_{h,d}\mathbb{1}[no\;viable\;base]$ |
| Demanda habilitada | $F_p^{hab}=\sum f_{h,d}\mathbb{1}[nuevo\;viable]$ |
| Proxy habilitación OD | $r_p=F_p^{hab}/F_p^{pot}$ |
| Campo `costoOD` | $-round(30r_p)$ |
| Oportunidades | $O_p=|\{h:\exists d\;nuevo\;viable\}|$ |
| Equidad | $E_p=\sum P_hI(cob_c<mediana)/\sum P_h$ |
| Continuidad | $Cont_p=\min(1,K_p/4)$ |
| Prioridad GORE | $PG_p=\sum_c\Delta B_{p,c}s_c/\sum_c\Delta B_{p,c}$ |
| Costo | $C_p=L_pc_{km}$ |
| Eficiencia | $Eff_p=1-C_p/\max C$ |
| Seguridad | $Seg_p=\sum sev\cdot treat\cdot decay$ |
| Intermodalidad | $Int_p=\#\{Metro:d\le250m\}$ |
| Parques | $Par_p=\sum_{k\in K(p)}A_k$ |
| Radio parque | $r_k=\sqrt{A_k/\pi}$ |
| Logit | $P=1/(1+e^{-V})$ |
| Ciclistas inducidos | $\sum P_h[P_h^{con}-P_h^{base}]$ |
| Grado dendrítico | $g_t(p)=\min_{r\in R_t}d_G(p,r)$ |
| Score dendrítico | $100\alpha^{g-1}$, $\alpha=0.5$ |
| Score MCDA | $S_p=\sum w_i\hat x_{i,p}/\sum w_i$ |
| Normalización | $\hat x_{i,p}=x_{i,p}/\max_qx_{i,q}$ |
| Selección secuencial | $p_t^*=arg\max S(p\mid G_t)$ |

---

# 22. Matriz de trazabilidad entre metodología y código

| Función / concepto | Implementación principal | Observación de auditoría |
|---|---|---|
| Versiones y defaults | `src/version.jsx` | Fuente primaria de parámetros vigentes |
| Carga y preparación de datos | `src/data.jsx` | Incluye límites comunales y capas de contexto |
| Componentes conexos y OD | `src/engine.jsx` | Núcleo de evaluación marginal |
| Normalización base | `src/engine.jsx` | Recalculada sobre proyectos activos |
| Score interactivo | `src/app.jsx` | 15 criterios ponderables + Monumentos contextual |
| Escenarios | `src/scenarios.jsx` | 12 escenarios publicados |
| Explicabilidad | `src/scenarios.jsx` | Descomposición de aportes y dominancia |
| Logit | `src/demanda-modal.jsx` | P(bici) y ciclistas inducidos |
| Dendrítico | `src/fractal.js` | BFS, raíz incremental, atenuación 0.5 |
| Redes aisladas | `src/netview.jsx` | Vista diagnóstica con distancia 100 m–5 km |
| Solver secuencial | `src/engine.jsx` | Greedy asíncrono con presupuesto opcional |
| Sensibilidad y carteras | `src/analysis.jsx` | Pesos, parámetros, comparación de carteras |
| QA | `src/qa.jsx` | Controles estructurales y geométricos |
| Reportes | `src/reports.js` | Reportes ejecutivos y fichas imprimibles |
| Reproducibilidad | `src/version.jsx` | Hash de datos, configuración y procedencia |

---

# 23. Observaciones de coherencia detectadas en esta actualización

Esta sección registra diferencias encontradas entre textos históricos y el código vigente para que futuras versiones puedan cerrarlas explícitamente.

### 23.1 `costoOD`

El nombre y algunas fichas describen una reducción de costo generalizado, pero el motor vigente calcula una tasa de habilitación de viajes transformada a una escala interna. Esta memoria utiliza la formulación ejecutable.

### 23.2 “Fractal / Strahler”

La analogía dendrítica es útil, pero el algoritmo es BFS de distancia topológica a raíz, no un cálculo clásico de orden Strahler ni una dimensión fractal. Esta memoria corrige la terminología científica sin cambiar la función de software.

### 23.3 Defaults de nuevos umbrales

Los defaults ejecutables de porcentaje protegido, aproximación final y tiempo máximo son cero. Algunos textos incorporados en etapas anteriores muestran 50 %, 700 m y 60 min. `version.jsx` prevalece.

### 23.4 Costo por kilómetro

La implementación vigente usa 100 MCLP/km por defecto. Cifras distintas en ejemplos históricos deben tratarse como escenarios referenciales y no como configuración activa.

### 23.5 Sensibilidad de pesos

La rutina individual de ±50 % recorre doce criterios núcleo; intermodalidad, factibilidad y parques participan de escenarios pero no reciben todavía perturbación individual automática.

Estas diferencias no impiden el funcionamiento de EVA, pero son relevantes para una documentación científica reproducible.

---

# 24. Referencias

Barthélemy, M. (2011). Spatial networks. *Physics Reports, 499*, 1–101. https://doi.org/10.1016/j.physrep.2010.11.002

Bierlaire, M. (2023). *A short introduction to Biogeme*. Transport and Mobility Laboratory, EPFL.

Broach, J., Dill, J., & Gliebe, J. (2012). Where do cyclists ride? A route choice model developed with revealed preference GPS data. *Transportation Research Part A, 46*(10), 1730–1740. https://doi.org/10.1016/j.tra.2012.07.005

Dill, J., & McNeil, N. (2013). Four types of cyclists? Examination of typology for better understanding of bicycling behavior and potential. *Transportation Research Record, 2387*, 129–138. https://doi.org/10.3141/2387-15

Duthie, J., & Unnikrishnan, A. (2014). Optimization framework for bicycle network design. *Journal of Transportation Engineering, 140*(7).

Geurs, K. T., & van Wee, B. (2004). Accessibility evaluation of land-use and transport strategies: Review and research directions. *Journal of Transport Geography, 12*(2), 127–140. https://doi.org/10.1016/j.jtrangeo.2003.10.005

Iacono, M., Krizek, K. J., & El-Geneidy, A. (2010). Measuring non-motorized accessibility: Issues, alternatives, and execution. *Journal of Transport Geography, 18*(1), 133–140. https://doi.org/10.1016/j.jtrangeo.2009.02.002

Lowry, M. B., Furth, P., & Hadden-Loh, T. (2016). Prioritizing new bicycle facilities to improve low-stress network connectivity. *Transportation Research Part A, 86*, 124–140. https://doi.org/10.1016/j.tra.2016.02.003

Lucas, K. (2012). Transport and social exclusion: Where are we now? *Transport Policy, 20*, 105–113.

Macharis, C., de Witte, A., & Ampe, J. (2009). The multi-actor, multi-criteria analysis methodology (MAMCA) for the evaluation of transport projects: Theory and practice. *Journal of Advanced Transportation, 43*(2), 183–202. https://doi.org/10.1002/atr.5670430206

Mekuria, M. C., Furth, P. G., & Nixon, H. (2012). *Low-Stress Bicycling and Network Connectivity*. Mineta Transportation Institute, Report 11-19.

Natera Orozco, L. G., Battiston, F., Iñiguez, G., & Szell, M. (2020). Data-driven strategies for optimal bicycle network growth. *Royal Society Open Science, 7*, 201130. https://doi.org/10.1098/rsos.201130

Ortúzar, J. de D., & Willumsen, L. G. (2011). *Modelling Transport* (4th ed.). Wiley.

Páez, A., Scott, D. M., & Morency, C. (2012). Measuring accessibility: Positive and normative implementations of various accessibility indicators. *Journal of Transport Geography, 25*, 141–153. https://doi.org/10.1016/j.jtrangeo.2012.03.016

Pereira, R. H. M., Schwanen, T., & Banister, D. (2017). Distributive justice and equity in transportation. *Transport Reviews, 37*(2), 170–191.

Rodríguez, D. A., & Joo, J. (2004). The relationship between non-motorized mode choice and the local physical environment. *Transportation Research Part D, 9*(2), 151–173.

Strahler, A. N. (1957). Quantitative analysis of watershed geomorphology. *Transactions, American Geophysical Union, 38*(6), 913–920. https://doi.org/10.1029/TR038i006p00913

Szell, M., Mimar, S., Perlman, T., Ghoshal, G., & Sinatra, R. (2022). Growing urban bicycle networks. *Scientific Reports, 12*, 6765. https://doi.org/10.1038/s41598-022-10783-y

### Fuentes institucionales y de datos

- Instituto Nacional de Estadísticas (2024). Censo de Población y Vivienda.
- CONASET. Siniestros de tránsito con participación de bicicletas, Región Metropolitana 2020–2024.
- SIES, Ministerio de Educación. Matrícula de educación superior por sede.
- Consejo de Monumentos Nacionales. Catastro de Monumentos Nacionales.
- Red Metropolitana de Movilidad / DTPM. Datos GTFS utilizados en la versión publicada.
- Gobierno Regional Metropolitano de Santiago. Ranking institucional de inversión comunal utilizado por EVA.

---

# 25. Citación de EVA

La referencia recomendada para esta versión es:

> **Gobierno Regional Metropolitano de Santiago, López, A., & Bastías, G. (2026). *EVA — Evaluador de Ciclovías Proyectadas* (Version v3.12.1) [Computer software]. Zenodo. https://doi.org/10.5281/zenodo.22145509**

El DOI identifica el release archivado. Para reproducibilidad de un análisis debe registrarse además la versión de datos, metodología, parámetros y ponderaciones de la corrida.

---

# 26. Conclusiones

EVA transforma un problema de priorización de infraestructura desde una comparación estática de proyectos hacia una evaluación iterativa de red. Su principal aporte metodológico no es un criterio particular, sino la integración de cinco ideas: **marginalidad**, **dependencia del estado de la red**, **criterios normativos explícitos**, **recalculabilidad** y **trazabilidad**.

La versión 3.12.0 del motor combina un modelo geoespacial de componentes, una condición de accesibilidad OD, indicadores territoriales, un modelo Logit de cambio modal, un índice dendrítico incremental, escenarios multicriterio, un solver secuencial, sensibilidad y mecanismos de auditoría. Al mismo tiempo, mantiene limitaciones explícitas: usa aproximaciones zonales, no posee ruteo de costo generalizado arco a arco, utiliza proxies de factibilidad y costos, y no garantiza optimalidad global.

La consecuencia institucional de esta arquitectura es relevante: una decisión compleja deja de depender de una cadena de cálculos difícil de repetir y pasa a ser un proceso que puede **volver a ejecutarse cuando cambian la red, los datos o las prioridades**. Esto no elimina la política de la planificación; la hace más explícita y discutible.

La publicación abierta del código, esta memoria, las fuentes de datos procesadas y el DOI permiten que EVA sea auditado, cuestionado, adaptado y mejorado. Ese carácter revisable es parte de la metodología, no un elemento accesorio de difusión.
