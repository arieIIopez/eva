lidados con organizaciones de la sociedad civil vinculadas a movilidad en la Mesa Santiago Caminable y Pedaleable. Esta dimensión evalúa pertinencia, comprensibilidad y capacidad de transparentar decisiones, no exactitud matemática de cada modelo.

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

Di