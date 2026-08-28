ciclable no es equivalente a conectividad vial general. La literatura de *low-stress bicycling* destaca que la red relevante para una gran parte de la población es aquella que puede recorrerse sin enlaces con niveles de estrés incompatibles con su tolerancia (Mekuria, Furth y Nixon, 2012). EVA no implementa un LTS completo arco a arco, pero incorpora un perfil de usuario “general” que excluye ciertas tipologías de la red efectiva y un umbral opcional de proporción protegida por componente.

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

Cada proyecto se evalúa temporalmente contra la 