# Estado vigente del paper EVA para EDTR

Fecha de corte: 2026-09-03

Este archivo es el punto de reanudación recomendado para continuar el paper. Sustituye, como cursor de trabajo, a `FINAL_MANUSCRIPT_QA_2026-09-02.md`, porque desde el 3 de septiembre el manuscrito incorporó resultados de los doce escenarios EVA, frontera de beneficios y saturación/suficiencia objetivo-específica.

## 1. Manuscrito vivo

Google Doc de trabajo:

`EDTR - Evaluación de trayectorias de implementación en redes de transporte - Método EVA`

ID: `1d4W7EdCoJDnU1rHB7Z4Y9wy-cU4JnjcaswqS5RtZUIs`

URL: `https://docs.google.com/document/d/1d4W7EdCoJDnU1rHB7Z4Y9wy-cU4JnjcaswqS5RtZUIs/edit`

Título vigente:

**Evaluación de trayectorias de implementación en redes de transporte: método EVA para la secuenciación dependiente del estado**

El paper debe mantenerse como contribución **metodológica y transferible**. EVA ciclable es la aplicación empírica que permite probar el marco; el objeto científico no es producir un ranking de ciclovías como fin en sí mismo.

## 2. Correcciones consolidadas

- Universo modelado: 133 proyectos.
- Conjunto factible de priorización: 124 proyectos = 88 comunales + 36 intercomunales.
- Los 9 corredores MET permanecen modelados como parte del contexto, pero están excluidos de la competencia por prioridad y de las referencias de normalización del experimento.
- Contraste científico con normalización fija en `G0`; la normalización operacional queda como sensibilidad.
- Los doce escenarios predefinidos de EVA se utilizan como funciones de preferencia `W`; no se introduce un vector ad hoc para el paper.
- La puntuación `S_t` genera la secuencia, pero no se interpreta como bienestar social ni como resultado público final.
- Población marginal, habilitación OD y reducción de componentes se analizan como resultados de trayectoria.
- La suficiencia es objetivo-específica y debe distinguirse de la saturación práctica a 90/95/99%.
- `costoOD` significa habilitación OD en el código histórico; no es costo generalizado de viaje.
- El costo se registra y puede operar como restricción de factibilidad/programación, pero no es función objetivo del experimento actual.

## 3. Resultados autoritativos vigentes

Experimento principal: 124 proyectos comunales/intercomunales, doce configuraciones predefinidas, normalización fija en `G0`, mismo conjunto final.

Estado final común:

- 600.177 personas cubiertas.
- 105 componentes de red.
- 43.887 MCLP.

Robustez de prioridad:

- 90/124 proyectos cambian más de 20 posiciones entre escenarios.
- 37 cambian más de 50; 17 más de 75; 4 más de 100.
- I12 Las Rejas-Suiza-Departamental es Top-10 en 12/12 escenarios.
- I26 San Pablo es Top-10 en 11/12.
- I14 Lo Ovalle varía entre las posiciones 4 y 124.

Captura temprana:

- Educación superior: mejor población, `I_P = 0,886884`.
- Demanda potencial: mejor habilitación OD, `I_D = 0,912585`.
- Continuidad de red: mejor reducción temprana de componentes, `I_C = 0,876568`.

Fronteras:

- En `(I_P, I_D)`, sólo Educación superior y Demanda potencial forman la frontera de Pareto.
- Incorporando topología se agregan Integración metropolitana y Continuidad de red.

Suficiencia objetivo-específica:

- `Population-first`: `t*_P = 42`, cobertura 600.177, quedan 82 proyectos; no existe ganancia poblacional directa ni habilitada a un paso entre los remanentes.
- `OD-first`: `t*_D = 52`, 871.510 de 871.511 viajes OD/día, quedan 72 proyectos; no existe ganancia OD directa ni habilitada a un paso bajo la precisión usada.

Saturación práctica conjunta población + OD (`C_PD = min(P/P_H, D/D_H)`):

- 95%: entre 44 y 107 proyectos según `W`.
- 99%: entre 116 y 123 proyectos.
- La cola representa rendimientos decrecientes; no equivale a beneficio marginal nulo.

Resultados completos: `docs/paper/CROSS_SCENARIO_RANK_FRONTIER_SATURATION_2026-09-03.md` y `results/paper-all-scenarios-benefits/`.

## 4. Estado editorial EDTR al 2026-09-03

Se corrigió el Google Doc vigente:

- resumen español reducido a 191 palabras;
- abstract inglés reducido a una extensión equivalente;
- Figura 4 = frontera población-conexión;
- Figura 5 = robustez de prioridad;
- numeración de figuras vuelve a ser ascendente.

Se exportó el manuscrito vigente a PDF y se hizo revisión visual de las 20 páginas:

- 20 páginas exactas;
- sin páginas vacías;
- sin figuras cortadas o desbordes visibles;
- cuerpo principal en Times New Roman 12;
- Figuras 2 a 5 legibles.

Restricciones editoriales vigentes de EDTR que deben seguir controlándose:

- archivo final en Microsoft Word;
- interlineado sencillo;
- Times New Roman 12;
- páginas numeradas;
- resumen español de máximo 200 palabras y máximo seis palabras clave;
- abstract de longitud similar y máximo seis keywords;
- máximo 20 páginas;
- archivo menor de 20 MB.

El manuscrito está exactamente en el límite de 20 páginas. Cualquier texto nuevo debe reemplazar o compactar contenido existente, no simplemente añadirse.

## 5. Reproducibilidad y versiones

Release pública estable y citable:

- EVA `v3.12.1`.
- Motor `v3.12.0`.
- Datos `2026.08`.
- Metodología `v2.3.0`.
- DOI: `10.5281/zenodo.22145509`.

Los experimentos del paper utilizan capacidades posteriores descritas en el manuscrito como versión experimental `v3.13.0` (raíz configurable, recálculo y experimentos secuenciales), pero **al 2026-09-03 no existe una release GitHub v3.13.0**. La última release formal es v3.12.1.

Último commit que documenta los resultados de doce escenarios antes de las correcciones editoriales de este archivo: `ae4c6313bd41205edd277f68157cc830a2dd7fd8` (`Document 12-scenario rank frontier and saturation results`).

Antes del envío debe congelarse de manera inequívoca el entorno experimental utilizado en el artículo: idealmente mediante release/tag y depósito permanente; alternativamente, el manuscrito y material suplementario deben identificar el commit exacto reproducible sin presentar `v3.13.0` como release publicada si aún no existe.

## 6. Figuras principales vigentes

- Figura 1: arquitectura general del método EVA.
- Figura 2: saturación práctica conjunta de población y conexión OD.
- Figura 3: interacción dependiente del estado de C049 Federico Errázuriz.
- Figura 4: frontera población-conexión entre doce escenarios EVA.
- Figura 5: robustez de prioridad de proyectos bajo doce escenarios EVA.

La matriz completa 124 x 12 debe permanecer como material reproducible/suplementario, no como figura principal.

## 7. Próximo cursor de trabajo

No retomar desde el DOCX `EDTR_EVA_manuscrito_final_18p_LaTeX.docx` ni desde `FINAL_MANUSCRIPT_QA_2026-09-02.md`: ambos anteceden la ampliación a doce escenarios y los resultados de saturación/frontera.

Próximas tareas, en este orden:

1. Congelar la versión experimental reproducible que sustenta el paper y resolver cómo citarla.
2. Auditar una a una las referencias bibliográficas y su correspondencia con las afirmaciones del estado del arte.
3. Revisar ecuaciones, símbolos y consistencia de notación entre texto, figuras y código.
4. Revisar el manuscrito como revisor EDTR: novedad, brecha, suficiencia de evidencia, sobreafirmaciones y transferibilidad.
5. Generar el nuevo DOCX de envío a partir del estado vigente, preservando ecuaciones nativas y máximo 20 páginas.
6. Hacer QA visual final del DOCX/PDF exportado y recién entonces marcar una nueva versión como `final`.
