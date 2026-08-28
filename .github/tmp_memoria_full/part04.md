lameda como tronco expresa una hipótesis espacial de desarrollo, no una verdad natural.
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

La herramienta, sus criterios, aplicación y alcance fueron presentados, discutidos y va