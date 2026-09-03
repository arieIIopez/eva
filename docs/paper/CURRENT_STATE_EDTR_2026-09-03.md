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

El Google Doc es la **fuente viva de contenido**, pero ya no debe considerarse el artefacto tipográfico final: su exportación PDF rompe numerosos subíndices/superíndices matemáticos Unicode. El DOCX de envío deberá reconstruir las expresiones matemáticas como Word Math/OMML y pasar QA visual página por página.

## 2. Contribución científica que debe preservarse

EVA no reclama como novedad que “el orden importa”. La literatura de secuenciación, expansión multiperíodo, planificación adaptativa, portafolios interdependientes y crecimiento de redes ya demuestra efectos de secuencia e interdependencia. Paulsen y Rich (2023) y Yu et al. (2026) son antecedentes recientes especialmente próximos.

La contribución defendible del paper es más específica:

1. evaluar la **trayectoria de implementación de una cartera pública ya formulada**, no diseñar desde cero una red final óptima;
2. representar explícitamente el estado `G_t`, los operadores de transformación `T_p`, el conjunto factible `P^f_t`, las preferencias `W`, la estrategia topológica `Ω` y los parámetros `Θ`;
3. separar cambios atribuibles al estado de red de cambios debidos a normalización o preferencias;
4. comparar secuencias que contienen exactamente el mismo conjunto físico final mediante resultados públicos comunes;
5. diagnosticar interacciones **dirigidas y dependientes del estado** `I_t(p,q)` sin imponer una matriz bilateral constante;
6. distinguir saturación práctica de una **condición de suficiencia objetivo-específica** definida bajo un horizonte explícito de habilitación;
7. mantener trazabilidad entre datos, código, parámetros, resultados y versión computacional.

La transferencia a otros modos es una hipótesis **arquitectónica**: `G_t → T_p(G_t) → G_{t+1}` puede conservarse sustituyendo las métricas sectoriales. La validación empírica del artículo sigue siendo ciclable y no demuestra por sí sola validez externa en metro, vialidad u otros sistemas.

## 3. Universo, conjunto factible y normalización

- Universo modelado: 133 proyectos.
- Conjunto factible inicial: 124 proyectos = 88 comunales + 36 intercomunales.
- Nueve corredores MET permanecen en la representación del sistema, pero están excluidos de competencia por prioridad y de las referencias de normalización del experimento.
- El contraste científico utiliza normalización fijada en `G0` sobre el conjunto elegible.
- La normalización operacional de EVA, basada en la cartera activa, se conserva sólo como sensibilidad.
- El costo no es la función objetivo del experimento; puede operar como restricción de factibilidad/programación.

El código experimental verifica la referencia fija `G0` mediante `fixedNorm` y `fixedScore`; eliminar proyectos durante la secuencia no modifica mecánicamente los denominadores científicos.

## 4. Notación corregida

Correcciones incorporadas al manuscrito:

- `D_t` queda reservado para habilitación OD acumulada.
- El beneficio poblacional directo se escribe `B^P_t(p)=ΔP_t(p|G_t)`.
- La habilitación poblacional de un paso se escribe `H^P_t(p)=max_{q∈P^f_t\{p}} ΔP_{t+1}(q|T_p(G_t))`.
- La condición se generaliza como `B^Y_t` y `H^Y_t` para un resultado público `Y`.
- Se eliminó la expresión “suficiencia exacta”: los puntos de detención son condiciones de suficiencia **respecto del objetivo y de una profundidad de habilitación de un paso**.
- `I_Y=A_Y/(k·Y_k)` se define sólo para `Y_k>0`.
- La ecuación multicriterio se expresa como `S_t(p)`, no como puntuación estática `S_p`.
- La ecuación de `arg max` poblacional define el objetivo de referencia y **no afirma que la heurística voraz de EVA resuelva el óptimo global**.
- `I_t(p,q)>0/<0` se interpreta como señal de complementariedad/sustitución **dentro de la función decisional**, no como prueba causal o económica de complementariedad.
- H2, que aparecía sólo en resultados, quedó formalmente definida en el diseño experimental.

## 5. Criterios y proxies auditados contra el motor

El motor vigente muestra que:

- `demandaHabilitada = flowEnabled`: viajes OD previamente no viables que pasan a ser viables.
- La clave histórica `costoOD` **no es costo generalizado**. Codifica una tasa de habilitación OD: `habRate = flowEnabled/potentialFlow`, discretizada como `-round(habRate*30)`; para el score se usa su magnitud.
- El costo de inversión es un proxy reproducible: longitud del proyecto × costo unitario (`100 MCLP/km` por defecto).
- El criterio de costo entra orientado como `costoInv = 1 - costo/max(costo)`; menor costo produce mayor contribución.
- Factibilidad utiliza un proxy espacial asociado al número de pistas; no demuestra que una calle más ancha sea efectivamente más barata de intervenir.
- `flowEnabled` se redondea a entero antes de retornar cada beneficio marginal. Esto explica la diferencia de un viaje entre 871.510 y 871.511 al sumar secuencias distintas.

Estas precisiones ya fueron incorporadas al paper.

## 6. Correcciones realizadas en EVA

Sin alterar pesos ni resultados experimentales:

### `src/scenarios.jsx`

Commit `ec0401b6b170f9f34fa2547917d79dd698823d7d`

- `costoOD`: “tasa de habilitación OD”.
- `demanda`: “volumen de demanda OD habilitada”.
- `costoInv`: “eficiencia de costo (inverso normalizado)”.
- factibilidad: “factibilidad espacial (proxy: número de pistas)”.
- el escenario Eficiencia presupuestaria ya no afirma calcular una razón beneficio/costo ni que las calles anchas sean necesariamente más baratas.
- escenarios temáticos usan “prioriza” en vez de afirmar optimización monoobjetivo.

### corrección temporal de fichas metodológicas

`src/metodologia.jsx` conserva texto heredado incorrecto para `crit_costoOD` y `sec_score`. Para evitar una sobrescritura riesgosa del archivo completo se creó una capa de compatibilidad:

- `src/methodology-corrections.jsx`: commit `3cfdb7034e8561a5cf717ef43b920c8184c89a86`.
- carga desde `index.html`: commit `68fe38bd35ea76534c47d41603dde441eef69326`.

Esta capa corrige la documentación mostrada por la aplicación sin modificar cálculos. **Antes de una release estable v3.13 debe consolidarse dentro de `metodologia.jsx` y eliminarse la deuda de compatibilidad.**

## 7. Resultados autoritativos

Experimento principal: 124 proyectos elegibles, doce perfiles `W`, normalización fija `G0`, mismo conjunto final.

Estado final común:

- 600.177 personas cubiertas.
- 105 componentes de red.
- 43.887 MCLP de costo proxy acumulado.

Robustez de prioridad:

- 90/124 proyectos cambian más de 20 posiciones entre escenarios.
- 37 cambian más de 50; 17 más de 75; 4 más de 100.
- I12 Las Rejas–Suiza–Departamental: Top-10 en 12/12 escenarios.
- I26 San Pablo: Top-10 en 11/12.
- I14 Lo Ovalle: rango 4–124.

Captura temprana:

- Educación superior: `I_P=0,886884`.
- Demanda potencial: `I_D=0,912585`.
- Continuidad de red: `I_C=0,876568`.

Fronteras:

- En `(I_P,I_D)`: Educación superior y Demanda potencial.
- Incluyendo topología: se agregan Integración metropolitana y Continuidad de red.

Suficiencia objetivo-específica:

- Population-first: 42/124, 82 remanentes, 600.177 personas, sin beneficio directo ni habilitado a un paso entre los remanentes.
- OD-first: 52/124, 72 remanentes, 871.510/871.511 viajes OD/día, sin beneficio directo ni habilitado a un paso entre los remanentes.
- La diferencia de un viaje se explica por redondeo entero de los incrementos `flowEnabled` por etapa, no por una diferencia funcional del estado final.

Saturación práctica conjunta población + OD:

- 95%: 44–107 proyectos según `W`.
- 99%: 116–123 proyectos.
- La cola expresa rendimientos decrecientes; no equivale a beneficio cero.

## 8. Escenarios `W`: alcance de la robustez

Los doce perfiles no son un muestreo exhaustivo del simplex de ponderaciones.

- Once escenarios genéricos fueron homologados con un piso de contexto común y elevan un foco temático.
- RMC conserva los pesos institucionales provistos.

Por tanto, la evidencia demuestra dependencia del estado bajo **doce perfiles de política predefinidos y plausibles**, no bajo todas las combinaciones posibles de pesos. Esta limitación ya está declarada en el manuscrito.

## 9. Estado editorial y bloqueo tipográfico

El manuscrito se mantiene en el límite editorial de EDTR: **20 páginas** en la exportación PDF revisada antes de los últimos ajustes menores. Debe volver a verificarse después de cada edición sustantiva.

El resumen español tiene 191 palabras y el abstract una extensión equivalente.

Figuras principales:

1. arquitectura general del método EVA;
2. saturación práctica conjunta población–OD;
3. interacción dependiente del estado de C049 Federico Errázuriz;
4. frontera población–conexión entre doce escenarios;
5. robustez de prioridad de proyectos.

### bloqueo de Google Docs

La exportación PDF de Google Docs muestra cuadrados vacíos en numerosos subíndices/superíndices matemáticos Unicode. La fuente textual contiene, entre otros, `ₜ`, `ₚ`, `₀`, `₁`, `ᴾ`, `⁰`, `ₖ` y `ᵢ` en alta frecuencia. Esto hace que la exportación directa desde Drive **no sea publicable**.

Solución acordada:

- mantener Google Docs como fuente viva de contenido;
- una vez congelado el texto científico, producir el DOCX de envío con expresiones matemáticas transformadas a objetos Word Math/OMML;
- renderizar el DOCX/PDF resultante y revisar visualmente las 20 páginas;
- recién entonces marcar el archivo como final.

No degradar el manuscrito sustituyendo masivamente matemática por ASCII sólo para acomodar Google Docs.

## 10. Reproducibilidad y versión a congelar

Release estable/citable vigente:

- EVA `v3.12.1`.
- motor `v3.12.0`.
- datos `2026.08`.
- metodología `v2.3.0`.
- DOI `10.5281/zenodo.22145509`.

El paper utiliza código experimental posterior. **No existe todavía una release GitHub v3.13.0.**

La rama `main` incluye ahora correcciones de semántica/documentación posteriores a las corridas, pero no cambios en los pesos o cálculos que generaron los resultados. Antes del envío se debe:

1. consolidar la documentación metodológica heredada;
2. ejecutar/verificar QA y experimentos reproducibles sobre el estado que se vaya a congelar;
3. fijar un commit/tag de referencia;
4. preferentemente publicar `v3.13.0` y archivarla; si no se publica, el artículo debe citar el SHA exacto y no presentar v3.13.0 como release archivada.

## 11. Últimos commits relevantes

- `68fe38bd35ea76534c47d41603dde441eef69326` — Load methodology compatibility corrections.
- `3cfdb7034e8561a5cf717ef43b920c8184c89a86` — Correct stale OD and score methodology cards.
- `ec0401b6b170f9f34fa2547917d79dd698823d7d` — Clarify OD, cost and feasibility criterion labels.
- `5e7f7986376d9117ed48d18bed4dd4fabe6fee37` — Align EDTR figure numbering with current manuscript.
- `ae4c6313bd41205edd277f68157cc830a2dd7fd8` — Document 12-scenario rank frontier and saturation results.

El workflow `Paper experiments` se activa con cambios en `main`; durante esta actualización existía una ejecución posterior a las correcciones de metodología. Su conclusión debe verificarse antes de congelar versión.

## 12. Próximo cursor

Continuar en este orden:

1. verificar el workflow `Paper experiments` y cualquier fallo derivado de los últimos commits;
2. realizar una última lectura tipo **revisor 2** para identificar sobreafirmaciones, omisiones y objeciones previsibles;
3. consolidar las correcciones de `metodologia.jsx` en la fuente principal;
4. congelar el commit experimental reproducible y resolver release/tag v3.13.0;
5. generar el nuevo DOCX EDTR con OMML;
6. QA visual y editorial completo, máximo 20 páginas;
7. sólo después declarar versión final de envío.
