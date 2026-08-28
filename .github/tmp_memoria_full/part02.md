red base vigente. El proceso puede resumirse así:

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

No es una evaluación social de proyectos: no calcula VAN, TIR, benefici