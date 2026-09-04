# Anexo técnico · diccionario de métricas, campos y cálculo del score EVA

Este anexo complementa [`SUPLEMENTO_TECNICO_CALCULOS_EDTR_2026-09-04.md`](./SUPLEMENTO_TECNICO_CALCULOS_EDTR_2026-09-04.md). Su objetivo es permitir que un revisor conecte **cada clave del vector de ponderación `W`** con el campo bruto que consume el experimento científico, la transformación de normalización y su interpretación.

La fuente computacional primaria de esta tabla es `experiments/paper-experiments-fast.js`; las descripciones metodológicas corregidas están en `src/methodology-corrections.jsx`, `src/metodologia.jsx` y `src/scenarios.jsx`.

## 1. Función de score

Para el paper:

$$
S_t(p)=\frac{\sum_i w_i\hat{x}_{i,p,t}^{G_0}}{\sum_i w_i}
$$

El denominador de pesos excluye materialmente `monumentos`, cuyo peso es 0 en los perfiles estudiados.

Las escalas que dependen de máximos se fijan una vez en `G_0` sobre los 124 proyectos elegibles. El código exacto es `fixedNorm()` + `fixedScore()` en `experiments/paper-experiments-fast.js`.

## 2. Tabla campo → normalización

| Clave `W` | Campo bruto / fuente en objeto enriquecido | Transformación científica fija |
|---|---|---|
| `poblacion` | `p.poblacion` | `p.poblacion / 54569` |
| `costoOD` | `p.costoOD` | `abs(p.costoOD) / 12` |
| `oportunidades` | `p.oportunidades` | `p.oportunidades / 105` |
| `equidad` | `p.equidad` | se usa directamente |
| `continuidad` | `p.continuidad` | se usa directamente |
| `demanda` | `p.demandaHabilitada` | `p.demandaHabilitada / 58232` |
| `ciclistas` | `p.ciclistasInducidos` | `p.ciclistasInducidos / 271` |
| `fractal` | `p.scorePrioridad` | `p.scorePrioridad / 100` |
| `estudiantes` | `p.estudiantes` | `p.estudiantes / 12189` |
| `prioridadGore` | `p.prioridadGore` | valor directo; si falta, 0,5 |
| `costoInv` | `p.costo` | `1 - p.costo / 1435` |
| `seguridad` | `p.siniestrosPeso` | `p.siniestrosPeso / 52.13` |
| `monumentos` | `p.monumentos` | `p.monumentos / 21`, pero peso 0 |
| `intermodal` | `p.metroEstaciones` | `p.metroEstaciones / 6` |
| `factibilidad` | `p.numPistas` | `p.numPistas / 3.9` |
| `parques` | `p.parquesSup` | `p.parquesSup / 780968` |

Las constantes anteriores corresponden exactamente a `results/paper-all-scenarios-benefits/normalization_reference.json`.

### 2.1 Consecuencia de escala fija

No se aplica `min(1,·)`. Si, por ejemplo, una intervención produce más demanda habilitada que el máximo de `G_0`, entonces:

$$
\hat{x}_{demanda,p,t}^{G_0}>1
$$

Esto es deliberado y permite que el score refleje un cambio real del atributo, sin mover la regla de medición.

---

## 3. Cobertura marginal de población ocupada (`poblacion`)

El campo `pob` de la base OD representa **población ocupada modelada**, no población total. Para un proyecto `p`:

$$
\Delta P_p=\sum_{h\in H(p)}ocup_h\,\mathbb{1}[d(h,red_t)>\delta_O]
$$

$$
H(p)=\{h:d(h,p)\le\delta_O\}
$$

con `δ_O=700 m` por defecto.

Interpretación: ocupados residentes en hexágonos que no tienen acceso en el estado vigente y lo adquieren al incorporar el proyecto.

Limitaciones relevantes:

- acceso por distancia geométrica desde el centroide, no por ruta peatonal real;
- el hexágono agrega población;
- no equivale a usuarios observados ni a bienestar;
- puede variar con `G_t` porque el conjunto de hexágonos ya cubiertos cambia.

---

## 4. Tasa de habilitación OD (`costoOD`)

`costoOD` es una **clave histórica**. La corrección metodológica vigente establece explícitamente que el motor del paper **no calcula aquí costo generalizado**.

Sea:

- `D_p^enabled`: flujo que el candidato vuelve viable;
- `D_p^potential`: flujo potencialmente habilitable en su área/estado.

La tasa es:

$$
h_p=\frac{D_p^{enabled}}{D_p^{potential}}
$$

La codificación interna discreta es:

$$
costoOD_p=-\operatorname{round}(30h_p)
$$

El signo negativo es herencia histórica; para el score se utiliza la magnitud:

$$
\hat{x}_{OD,p}=\frac{|costoOD_p|}{12}
$$

en la corrida científica vigente, porque 12 es el máximo absoluto observado en `G_0` entre elegibles.

La discretización puede producir empates y es una de las razones por las que `demandaHabilitada` se conserva además como resultado bruto separado.

---

## 5. Hexágonos/oportunidades habilitadas (`oportunidades`)

El criterio contabiliza hexágonos OD que obtienen al menos un viaje laboral nuevo viable:

$$
O_p=\left|\{h:\exists d\;v_{h,d}^{con,p}\land\neg v_{h,d}^{sin,p}\}\right|
$$

No pondera por población: un hexágono cuenta como una unidad. Por eso se combina con la dimensión poblacional.

---

## 6. Equidad territorial (`equidad`)

La documentación metodológica define una fracción asociada a población ocupada habilitada que reside en comunas con cobertura ciclable por debajo de la mediana regional. Forma conceptual:

$$
E_p=\frac{\sum_{h\in B(p)}ocup_h\,\mathbb{1}[cob_{c(h)}<\widetilde{cob}]}{\sum_{h\in B(p)}ocup_h}
$$

El paper consume `p.equidad` directamente porque ya es un índice orientado.

No es una medida integral de justicia distributiva: no incluye directamente ingreso, género, discapacidad u otras dimensiones sociales.

---

## 7. Continuidad de red (`continuidad`)

El motor construye componentes espaciales de la red mediante proximidad geométrica. En el paper la tolerancia de conexión es 150 m. Un candidato puede tocar una o más subredes y modificar la continuidad del sistema.

El score consume `p.continuidad` como un índice ya preparado. En paralelo, para resultados públicos se registra el número de componentes completo después de cada intervención, lo que permite no confundir el criterio de decisión con el outcome topológico final.

Esta separación es metodológicamente importante:

- `continuidad` contribuye a `S_t`;
- `componentes_red`, `reduccion_componentes_etapa` y `reduccion_componentes_acumulada` se guardan como resultados observables de la trayectoria.

---

## 8. Demanda OD habilitada (`demanda`)

El campo bruto es `p.demandaHabilitada`.

$$
\Delta D_t(p)=\sum_{(o,d)}f_{od}\;\mathbb{1}\{OD\text{ pasa de no viable a viable}\}
$$

Normalización:

$$
\hat{x}_{demanda,p,t}^{G_0}=\frac{\Delta D_t(p)}{58232}
$$

A diferencia de `costoOD`, este campo conserva el volumen entero de viajes habilitados y se utiliza para construir `D_t`, `A_D` e `I_D`.

---

## 9. Ciclistas inducidos (`ciclistas`)

La capa metodológica documenta un logit binario bici/no-bici estimado con Biogeme sobre 117.072 manzanas censales ponderadas por ocupados. La utilidad documentada es:

$$
V_{bici}=ASC+(\beta_{dist}+\beta_{dist,large})d_{km}+\beta_{alt}|\Delta h|+\beta_{educ}esc+\beta_{ciclo}km_{500}
$$

$$
P(bici)=\frac{e^{V_{bici}}}{1+e^{V_{bici}}}
$$

La ganancia atribuida a un proyecto se calcula como:

$$
\Delta ciclistas_p=\sum_h ocup_h\left[P(km_{500,h}+\Delta km_{500,h}^{(p)})-P(km_{500,h})\right]
$$

Coeficientes documentados en `src/metodologia.jsx`:

| Parámetro | Valor |
|---|---:|
| ASC | -1,39 |
| `β_dist` | -0,0267 |
| `β_dist,large` | -0,0819 |
| `β_alt` | -0,00778 |
| `β_educ` | -0,0786 |
| `β_ciclo` | +0,13 |

El paper no usa este resultado como validación causal externa; es un criterio/diagnóstico adicional dentro del sistema EVA.

---

## 10. Estrategia dendrítica (`fractal`)

El escenario dendrítico usa una raíz `R_t` y una separación topológica por grados. Para la configuración de referencia:

- raíz = Alameda;
- tolerancia `τ=100 m`;
- atenuación `α=0,5`.

La descripción operacional de `src/scenarios.jsx` corresponde a una regla del tipo:

$$
scorePrioridad=100\,\alpha^{grado-1}
$$

para proyectos conectados a la estructura jerárquica; los aislados reciben 0 bajo la regla dendrítica. Con `α=0,5`:

$$
scorePrioridad=100\cdot0,5^{grado-1}
$$

Cada proyecto seleccionado se incorpora a la raíz/estructura vigente y por eso la separación de los candidatos restantes puede cambiar en la siguiente iteración.

El score científico normaliza contra la base teórica 100, no contra el máximo candidato activo.

---

## 11. Educación superior (`estudiantes`)

El campo consumido es `p.estudiantes`, escalado por el máximo `G_0=12189`. Representa la dimensión de generación/acceso estudiantil definida en las capas de datos de EVA. El perfil Educación asigna peso 40 a este criterio, manteniendo pesos contextuales en los demás.

---

## 12. Prioridad regional (`prioridadGore`)

Se consume como índice directamente. Si el dato está ausente, la capa científica usa 0,5 como valor de respaldo:

$$
\hat{x}_{GORE}=\begin{cases}
prioridadGore_p, & \text{si existe}\\
0,5, & \text{si falta}
\end{cases}
$$

Este criterio representa una preferencia/prioridad institucional precalificada, no un outcome independiente del experimento.

---

## 13. Eficiencia de costo (`costoInv`)

Costo proxy bruto: `p.costo`.

En la configuración por defecto el costo de proyecto se aproxima a partir de longitud con un factor de 100 MCLP/km, sujeto a los datos existentes del proyecto.

La orientación para el score es inversa:

$$
\hat{x}_{costo,p}=1-\frac{costo_p}{1435}
$$

Por construcción, menor costo produce mayor contribución. **No es BCR, VAN ni evaluación social.**

---

## 14. Seguridad vial (`seguridad`)

El campo bruto es `p.siniestrosPeso`; se escala por `52,13`. La capa de escenario describe el indicador como siniestralidad ciclista **prevenible** en corredores, ponderada por severidad, tratabilidad mediante infraestructura segregada y cercanía a la traza.

El suplemento no reemplaza el código de preparación de esta capa con una fórmula simplificada que no existe en el motor. Para auditoría exacta de los ponderadores de siniestros debe seguirse la fuente que construye `siniestrosPeso`.

---

## 15. Monumentos (`monumentos`)

Se calcula y puede visualizarse, pero en los doce escenarios del paper:

$$
w_{monumentos}=0
$$

Por tanto, no altera el score ni el ranking científico. Se mantiene para compatibilidad/información.

---

## 16. Intermodalidad bici–Metro (`intermodal`)

Campo bruto `p.metroEstaciones`; escala fija 6. El escenario Intermodalidad asigna peso 35 a esta dimensión. Representa el número/señal de estaciones de Metro asociadas al corredor bajo la regla espacial de EVA.

---

## 17. Factibilidad espacial (`factibilidad`)

Campo bruto `p.numPistas`; escala fija 3,9. Es un **proxy** de factibilidad espacial asociado al número de pistas, no una validación de diseño geométrico, expropiaciones, servicios, permisos ni presupuesto.

---

## 18. Parques (`parques`)

Campo bruto `p.parquesSup`; escala fija 780.968. Representa superficie de parques asociada al proyecto bajo la regla espacial de la base. Funciona como atractor territorial complementario.

---

## 19. Descomposición del score de un proyecto

Para cada criterio:

$$
aporte_{i,p,t}=\frac{w_i\hat{x}_{i,p,t}}{\sum_j w_j}
$$

Por tanto:

$$
S_t(p)=\sum_i aporte_{i,p,t}
$$

La función `evaExplainScore` usa esta descomposición para identificar qué criterios explican mayor proporción del score. La clasificación de “criterio dominante” de la interfaz es descriptiva y no forma parte del algoritmo de selección del paper.

### Ejemplo de auditoría numérica genérica

Si un proyecto en Balanceado tiene, para tres criterios ilustrativos:

- `poblacion=27.284,5` → `0,5` normalizado;
- `demandaHabilitada=29.116` → `0,5`;
- `continuidad=0,8`;

entonces sus aportes parciales son:

$$
\frac{14(0,5)+12(0,5)+12(0,8)}{\sum_i w_i}
$$

más los restantes criterios. Este ejemplo es **didáctico**, no corresponde a un proyecto observado.

---

## 20. Qué atributos pueden cambiar con el estado

La distinción conceptual del paper es:

- `X^I`: atributos intrínsecos, típicamente estables;
- `X^R_t`: atributos relacionales;
- `X^T_t`: atributos topológicos;
- `X^H_t`: atributos habilitantes.

En EVA, población marginal, habilitación OD, oportunidades, continuidad y coherencia dendrítica son ejemplos claros de dimensiones que pueden cambiar cuando se modifica la red. Otros atributos pueden permanecer constantes o cambiar sólo si se modifica una capa exógena.

En el experimento se mantienen constantes las condiciones exógenas para aislar el efecto de `T_p(G_t)`.

---

## 21. Control contra documentación heredada

`src/metodologia.jsx` contiene fichas históricas. `src/methodology-corrections.jsx` corrige semántica sin cambiar cálculos. Para el paper deben preservarse especialmente estas correcciones:

1. `poblacion` = población **ocupada** modelada, no total;
2. `costoOD` = tasa discreta de habilitación OD, no costo generalizado;
3. normalización científica = referencia fija `G_0`, no máximo activo;
4. costo y factibilidad = proxies;
5. pesos `W` = preferencias, no parámetros estimados.

La existencia de esta capa de compatibilidad es deuda técnica documentada; debe consolidarse en las fuentes principales antes de declarar una release estable posterior.
