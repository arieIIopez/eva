# Estado vigente del paper EVA para EDTR

Fecha de corte: 2026-09-03

Este archivo es el **cursor autoritativo de reanudación** del paper. Sustituye como punto de partida a `FINAL_MANUSCRIPT_QA_2026-09-02.md` y al DOCX de 18 páginas generado el 2 de septiembre, porque el manuscrito, los experimentos y la auditoría científica cambiaron sustantivamente el 3 de septiembre.

## 1. Manuscrito vivo

Google Doc de contenido:

- Título: `EDTR - Evaluación de trayectorias de implementación en redes de transporte - Método EVA`
- ID: `1d4W7EdCoJDnU1rHB7Z4Y9wy-cU4JnjcaswqS5RtZUIs`
- URL: `https://docs.google.com/document/d/1d4W7EdCoJDnU1rHB7Z4Y9wy-cU4JnjcaswqS5RtZUIs/edit`

Título del artículo:

**Evaluación de trayectorias de implementación en redes de transporte: método EVA para la secuenciación dependiente del estado**

El Google Doc es la **fuente viva de contenido**, pero no debe considerarse el artefacto tipográfico final: su exportación PDF rompe numerosos subíndices/superíndices matemáticos Unicode. El DOCX de envío deberá reconstruir las expresiones matemáticas como Word Math/OMML y pasar QA visual página por página.

## 2. Contribución científica que debe preservarse

EVA no reclama como novedad que “el orden importa”, que una red pueda actualizarse después de una inversión o que una secuencia pueda detenerse. La literatura de secuenciación, expansión multiperíodo, planificación adaptativa, portafolios interdependientes y crecimiento de redes ya cubre esas ideas. Los antecedentes recientes especialmente próximos son Paulsen y Rich (2023, 2024) y Yu et al. (2026).

La contribución defendible es la **articulación metodológica y reproducible** de una cartera pública ya formulada:

1. representar explícitamente el estado `G_t`, los operadores `T_p`, el conjunto factible `P^f_t`, las preferencias `W`, la estrategia topológica `Ω` y los parámetros `Θ`;
2. separar la función decisional `S_t` de los resultados públicos con que se juzga la trayectoria;
3. separar cambios atribuibles al estado de red de cambios mecánicos de normalización y de cambios en preferencias;
4. comparar secuencias que contienen exactamente el mismo conjunto físico final para aislar el efecto de trayectoria;
5. diagnosticar interacciones **dirigidas y dependientes del estado** `I_t(p,q)` sin imponer una matriz bilateral constante;
6. distinguir saturación práctica de una **condición de suficiencia objetivo-específica**, condicionada a la métrica y al horizonte explícito de habilitación;
7. mantener trazabilidad entre datos, código, parámetros, resultados y versión computacional.

Paulsen y Rich (2024) incorpora demanda inducida, actualización de estados intermedios y reglas económicas de detención. Yu et al. (2026) reevalúa iterativamente una cartera oficial mediante TOPSIS. Por ello la novedad de EVA no puede formularse como secuenciación dinámica, reevaluación o detención por sí solas.

La transferencia a otros modos es una hipótesis **arquitectónica**: `G_t → T_p(G_t) → G_{t+1}` puede conservarse sustituyendo las métricas sectoriales. La validación empírica del artículo sigue siendo ciclable y no demuestra por sí sola validez externa en metro, vialidad u otros sistemas.

## 3. Universo, conjunto factible y normalización

- Universo modelado: 133 proyectos.
- Conjunto factible inicial: 124 proyectos = 88 comunales + 36 intercomunales.
- Nueve corredores MET permanecen en la representación del sistema, pero están excluidos de competencia por prioridad y de las referencias de normalización del experimento.
- El contraste científico utiliza normalización fijada en `G0` sobre el conjunto elegible.
- La normalización operacional de EVA, basada en la cartera activa, se conserva sólo como sensibilidad.
- El costo no es la función objetivo del experimento; puede operar como restricción de factibilidad/programación.

El código experimental verifica la referencia fija `G0` mediante `fixedNorm` y `fixedScore`; eliminar proyectos durante la secuencia no modifica mecánicamente los denominadores científicos.

## 4. Notación y formulación corregidas

Correcciones incorporadas al manuscrito:

- `D_t` queda reservado para habilitación OD acumulada.
- El beneficio directo de cobertura de población ocupada se escribe `B^P_t(p)=ΔP_t(p|G_t)`.
- Sea `P^f_{t+1}(p)` el conjunto factible sucesor tras aplicar `T_p`. La habilitación de un paso se escribe `H^P_t(p)=max_{q∈P^f_{t+1}(p)} ΔP_{t+1}(q|T_p(G_t))`.
- En la aplicación empírica no se activan nuevas precedencias, por lo que `P^f_{t+1}(p)` coincide con el conjunto remanente tras retirar `p`.
- La condición se generaliza como `B^Y_t` y `H^Y_t` para un resultado público `Y`.
- Se eliminó la expresión “suficiencia exacta”: los puntos de detención son condiciones de suficiencia **respecto de una métrica y de una profundidad de habilitación de un paso**.
- La suficiencia EVA no equivale a una regla económica basada en NPV/BCR/rentabilidad y no declara sin valor a los proyectos restantes.
- Para población y OD, `I_Y=A_Y/(k·Y_k)` se usa con `Y_k>0` como índice de captura temprana.
- Para topología, como `C_t` puede ser no monótono, `A_C` e `I_C` son integral e índice normalizado de trayectoria topológica; no deben interpretarse como proporción monotónica de captura.
- La ecuación multicriterio se expresa como `S_t(p)`.
- `S^0_t(p)=F(X^I_p,X^R_{p,t},X^T_{p,t},X^H_{p,t};Ω,W,Θ)`: los atributos habilitantes sí forman parte de la evaluación, pero `I_t` se observa ex post y no se reincorpora recursivamente.
- La ecuación de `arg max` poblacional define el objetivo de referencia y **no afirma que la heurística voraz de EVA resuelva el óptimo global**.
- `I_t(p,q)>0/<0` se interpreta como señal de complementariedad/sustitución **dentro de la función decisional**, no como prueba causal o económica de complementariedad.
- H1–H3 se tratan como hipótesis diagnósticas falsables contrastadas descriptivamente, no como pruebas estadísticas de hipótesis nula.

## 5. Hallazgo crítico: `P_t` es población ocupada modelada

La auditoría cruzada del código, la interfaz y la memoria técnica confirmó que el campo usado por el motor para cobertura es `h.properties.pob`.

Este campo corresponde a **población ocupada modelada**, asociada a los vectores OD laborales, y no a población total. La interfaz distingue `per` como “Personas (Censo 2024)” y `pob` como “Ocupados”. La memoria técnica identifica aproximadamente 3,44 millones de población empleada modelada como base de cobertura y demanda laboral.

Consecuencia científica:

- `P_t` debe interpretarse como cobertura/acceso de **población ocupada modelada**.
- Las 600.177 unidades del estado final son **600.177 ocupados modelados con acceso bajo la definición EVA**, no 600.177 habitantes de población total.
- `A_P` se expresa adecuadamente como `ocupado-etapa`.
- Population-first agota esta métrica operacional; no demuestra cobertura completa de población total ni redundancia técnica de los proyectos restantes.

Esta corrección **no modifica ningún resultado numérico**: corrige la interpretación de una variable que el motor ya calculaba de manera consistente con la base OD.

### definición operacional vigente

La configuración experimental utiliza los defaults del esquema de parámetros de `src/version.jsx`:

- acceso origen `distOrigen = 700 m`;
- acceso destino `distDestino = 700 m`;
- tolerancia de empalme `connectTol = 150 m`;
- cobertura mínima para que una subred “sirva” una comuna destino `habThreshold = 40%` de la población ocupada modelada de esa comuna;
- diez principales destinos laborales por hexágono;
- `porcProtegido = 0%` y `aproxFinal = 0 m` en la corrida base;
- `tiempoMax = 0`, por lo que no se impone un límite temporal OD adicional;
- costo proxy `100 MCLP/km`.

Un hexágono gana acceso cuando su centroide queda a distancia `distOrigen` de un componente elegible. Un viaje laboral OD es viable cuando un componente accesible desde el origen sirve la comuna destino bajo el umbral anterior. Estas son métricas geométrico-topológicas, no ruteo arco-a-arco ni uso observado.

## 6. Otros criterios y proxies auditados contra el motor

- `demandaHabilitada = flowEnabled`: viajes OD previamente no viables que pasan a ser viables.
- La clave histórica `costoOD` **no es costo generalizado**. Codifica una tasa de habilitación OD: `habRate = flowEnabled/potentialFlow`, discretizada como `-round(habRate*30)`; para el score se usa su magnitud.
- El costo de inversión es un proxy reproducible: longitud × costo unitario (`100 MCLP/km` por defecto).
- El criterio de costo entra orientado como `costoInv = 1 - costo/max(costo)`; menor costo produce mayor contribución.
- Factibilidad utiliza un proxy espacial asociado al número de pistas; no demuestra que una calle más ancha sea efectivamente más barata de intervenir.
- `flowEnabled` se redondea a entero antes de retornar cada beneficio marginal. Esto explica la diferencia de un viaje entre 871.510 y 871.511 al sumar secuencias distintas.

## 7. Correcciones realizadas en EVA

Sin alterar pesos ni resultados experimentales:

### `src/scenarios.jsx`

Commit `ec0401b6b170f9f34fa2547917d79dd698823d7d`

- `costoOD`: “tasa de habilitación OD”.
- `demanda`: “volumen de demanda OD habilitada”.
- `costoInv`: “eficiencia de costo (inverso normalizado)”.
- factibilidad: “factibilidad espacial (proxy: número de pistas)”.
- el escenario Eficiencia presupuestaria ya no afirma calcular una razón beneficio/costo.
- escenarios temáticos usan “prioriza” en vez de afirmar optimización monoobjetivo.

### capa temporal de compatibilidad metodológica

`src/metodologia.jsx` conserva texto heredado desalineado para algunos criterios. La capa `src/methodology-corrections.jsx`, cargada después de `metodologia.jsx`, corrige la documentación sin alterar cálculos.

Commits principales:

- `3cfdb7034e8561a5cf717ef43b920c8184c89a86` — corrección de `costoOD` y score.
- `68fe38bd35ea76534c47d41603dde441eef69326` — carga de la capa de compatibilidad.
- `bbf588211320f8c558a59624a7ccc1d0730a5766` — semántica de población ocupada en fichas, escenarios, equidad, oportunidades y explicación automática del score.

La última corrección reemplaza en la interfaz “población marginal” por “cobertura marginal de población ocupada” donde corresponde y evita frases como “beneficia X personas” cuando la variable es `pob`.

**Antes de v3.13 estable debe consolidarse esta capa dentro de `metodologia.jsx` y `scenarios.jsx` y eliminarse la deuda de compatibilidad.** No cambiar el motor de `pob` a población total salvo que se decida explícitamente formular y recalibrar una métrica distinta; hacerlo ahora invalidaría la interpretación y reproducibilidad del experimento vigente.

## 8. Resultados autoritativos

Experimento principal: 124 proyectos elegibles, doce perfiles `W`, normalización fija `G0`, mismo conjunto final.

Estado final común:

- 600.177 ocupados modelados con acceso según EVA.
- 105 componentes de red.
- 43.887 MCLP de costo proxy acumulado.

Robustez de prioridad:

- 90/124 proyectos cambian más de 20 posiciones entre escenarios.
- 37 cambian más de 50; 17 más de 75; 4 más de 100.
- I12 Las Rejas–Suiza–Departamental: Top-10 en 12/12 escenarios.
- I26 San Pablo: Top-10 en 11/12.
- I14 Lo Ovalle: rango 4–124.

Trayectorias:

- Educación superior: `I_P=0,886884`, mayor captura temprana de cobertura de población ocupada entre los doce perfiles.
- Demanda potencial: `I_D=0,912585`, mayor captura temprana de habilitación OD.
- Continuidad de red: `I_C=0,876568`, mayor índice normalizado de trayectoria topológica.

Estas métricas **no son validadores externos independientes de W**: P, D y C guardan relación con criterios que participan en `S_t`. Deben interpretarse como consecuencias comparables de distintos perfiles de política, no como prueba de que un perfil sea intrínsecamente “mejor”.

Fronteras dentro de los doce perfiles y resultados analizados:

- En `(I_P,I_D)`: Educación superior y Demanda potencial.
- Incluyendo topología: se agregan Integración metropolitana y Continuidad de red.
- No afirmar dominancia universal en el espacio completo de ponderaciones.

Suficiencia objetivo-específica:

- Population-first: 42/124, 82 remanentes, 600.177 ocupados modelados con acceso, sin ganancia directa ni habilitada a un paso de esta métrica entre los remanentes.
- OD-first: 52/124, 72 remanentes, 871.510/871.511 viajes OD/día, sin beneficio OD directo ni habilitado a un paso bajo la resolución usada.
- La diferencia de un viaje se explica por redondeo entero de `flowEnabled` por etapa.

Saturación práctica conjunta cobertura de población ocupada + OD:

- 95%: 44–107 proyectos según `W`.
- 99%: 116–123 proyectos.
- La cola indica **captura adicional lenta**. El salto 95→99% no prueba por sí mismo rendimientos marginales decrecientes en sentido económico o matemático y no equivale a beneficio cero.

## 9. Escenarios `W`: alcance de la robustez

Los doce perfiles no son un muestreo exhaustivo del simplex de ponderaciones.

- Once escenarios genéricos fueron homologados con un piso de contexto común y elevan un foco temático.
- RMC conserva los pesos institucionales provistos.

Por tanto, la evidencia demuestra dependencia del estado bajo **doce perfiles de política predefinidos y plausibles**, no bajo todas las combinaciones posibles de pesos.

## 10. Estado editorial y bloqueo tipográfico

El manuscrito se mantiene en el límite editorial de EDTR: **20 páginas** en las últimas exportaciones PDF revisadas durante la auditoría.

El resumen español estaba en 191 palabras antes de las últimas precisiones de terminología; debe volver a contarse antes del cierre, aunque los cambios fueron menores.

Figuras principales:

1. arquitectura general del método EVA;
2. saturación práctica conjunta cobertura de población ocupada–OD;
3. interacción dependiente del estado de C049 Federico Errázuriz;
4. frontera cobertura de población ocupada–conexión entre doce escenarios;
5. robustez de prioridad de proyectos.

### bloqueo de Google Docs

La exportación PDF de Google Docs muestra cuadrados vacíos en numerosos subíndices/superíndices matemáticos Unicode. Esto hace que la exportación directa desde Drive **no sea publicable**.

Solución acordada:

- mantener Google Docs como fuente viva de contenido;
- una vez congelado el texto científico, producir el DOCX de envío con expresiones matemáticas transformadas a objetos Word Math/OMML;
- renderizar el DOCX/PDF resultante y revisar visualmente las 20 páginas;
- recién entonces marcar el archivo como final.

No degradar el manuscrito sustituyendo matemática por ASCII sólo para acomodar Google Docs.

## 11. Reproducibilidad y versión a congelar

Release estable/citable vigente:

- EVA `v3.12.1`.
- motor `v3.12.0`.
- datos `2026.08`.
- metodología `v2.3.0`.
- DOI `10.5281/zenodo.22145509`.

El paper utiliza código experimental que se identifica internamente como motor `3.13.0` y metodología `2.4.0`, pero **no existe todavía una release GitHub v3.13.0**.

Workflow `Paper experiments`:

- run #36, commit `3cfdb7034e8561a5cf717ef43b920c8184c89a86`: **success**.
- run #37, commit `bbf588211320f8c558a59624a7ccc1d0730a5766`: iniciado correctamente después de las correcciones semánticas de población ocupada; al momento de esta actualización estaba `in_progress`.

La rama `main` incluye correcciones de semántica/documentación posteriores a las corridas originales, pero no cambios deliberados en pesos o cálculos. Antes del envío se debe:

1. verificar que #37 concluya con éxito y que los resultados numéricos sean invariantes;
2. consolidar la documentación metodológica heredada;
3. ejecutar/verificar QA sobre el estado que se vaya a congelar;
4. fijar un commit/tag de referencia;
5. preferentemente publicar `v3.13.0` y archivarla; si no se publica, el artículo debe citar el SHA exacto y no presentar v3.13.0 como release archivada.

## 12. Últimos commits relevantes

- `bbf588211320f8c558a59624a7ccc1d0730a5766` — Clarify employed-population semantics across EVA.
- `68fe38bd35ea76534c47d41603dde441eef69326` — Load methodology compatibility corrections.
- `3cfdb7034e8561a5cf717ef43b920c8184c89a86` — Correct stale OD and score methodology cards.
- `ec0401b6b170f9f34fa2547917d79dd698823d7d` — Clarify OD, cost and feasibility criterion labels.
- `5e7f7986376d9117ed48d18bed4dd4fabe6fee37` — Align EDTR figure numbering with current manuscript.
- `ae4c6313bd41205edd277f68157cc830a2dd7fd8` — Document 12-scenario rank frontier and saturation results.

## 13. Próximo cursor

Continuar en este orden:

1. verificar conclusión y outputs del workflow #37;
2. completar la lectura tipo **revisor 2**, especialmente validez de métricas, endogeneidad entre score y outcomes, validez externa y lenguaje causal;
3. consolidar `methodology-corrections.jsx` dentro de `metodologia.jsx`/`scenarios.jsx` y eliminar la capa temporal;
4. congelar el commit experimental reproducible y resolver release/tag v3.13.0;
5. generar el nuevo DOCX EDTR con OMML;
6. QA visual y editorial completo, máximo 20 páginas y resumen ≤200 palabras;
7. sólo después declarar versión final de envío.
