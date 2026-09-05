# Estado vigente — paper EVA / EDTR — 2026-09-05

Este archivo **supersede `CURRENT_STATE_EDTR_2026-09-04.md` como cursor de reanudación**. Debe leerse junto con `AUDITORIA_REVISOR_2_2026-09-04.md` y `AUDITORIA_REVISOR_2_UPDATE_2026-09-05.md`.

## 1. Regla de autoridad

No mezclar resultados provenientes de redes finales distintas. Para el paper, el estado científico común es:

- 133 proyectos modelados;
- 124 proyectos elegibles Comunales + Intercomunales;
- 9 corredores MET fuera de competencia y normalización;
- 601 ejes en la fuente existente;
- 576 ejes en la red efectiva `G0` bajo `perfil=general`;
- 142 componentes en `G0`;
- 107 componentes al completar la cartera;
- 600.177 ocupados con nuevo acceso acumulado respecto de `G0`;
- costo proxy final 43.887 MCLP;
- demanda OD final aproximadamente 871.509–871.513 viajes/día según secuencia por redondeo entero.

Cualquier salida histórica cuya cartera completa termine en **105 componentes** queda deprecada como fuente de cifras vigentes.

## 2. Resultados principales autoritativos

### Doce escenarios

Commit de resultados corregidos:

`376a5e355d7086371fa89ca827262c7c089e4897`

Se mantienen:

- `I_P≈0,887` para Educación superior;
- `I_D≈0,913` para Demanda potencial;
- `I_C≈0,901` para Continuidad de red;
- frontera P–OD: Educación superior + Demanda potencial;
- frontera P–OD–topología: Demanda potencial, Educación superior, Integración metropolitana y Continuidad de red;
- I12 Top-10 en 12/12 escenarios; I14 entre posiciones 4 y 124;
- 90/124 cambian >20 posiciones; 37 >50; 17 >75; 4 >100.

Umbral conjunto 95% P+OD: Educación 44; Integración 44; Balanceado 47; Demanda 48; Seguridad 51; Intermodalidad 53; Continuidad 57; RMC 59; Ciclistas 70; Eficiencia 80; Equidad 94; Dendrítica Alameda 108. El 99% requiere 116–123 proyectos.

### Population-first

- `t*=42`;
- 600.177 ocupados con nuevo acceso;
- 82 proyectos restantes;
- sin ganancia directa ni habilitación de un paso para P;
- `A_P=68.838.193 ocupado-etapa`;
- `I_P=0,925`.

### OD-first

- `t*=52`;
- 871.510/871.511 viajes OD/día frente a la referencia nominal;
- 72 proyectos restantes;
- sin ganancia directa ni habilitación OD a un paso;
- la diferencia de un viaje es resolución de redondeo entero.

## 3. Tres escenarios de referencia — §7.1 corregido

Corrida autoritativa persistida en:

`5c030c1a388eb124e8faef3e8e2aa9889e192acc`

Contraste estático G0 versus secuencia reevaluada:

| Escenario | Spearman | Kendall | desplazamiento medio | máximo | Jaccard Top-30 | primera divergencia |
|---|---:|---:|---:|---:|---:|---:|
| RMC | 0,70866 | 0,53396 | 20,61 | 74 | 0,463 | 2 |
| Balanceado | 0,74086 | 0,55966 | 19,00 | 70 | 0,463 | 2 |
| Ciclistas/Logit | 0,86348 | 0,68975 | 13,39 | 58 | 0,667 | 2 |

El Google Doc principal y la copia nativa LaTeX ya contienen los valores redondeados 0,709/0,534; 0,741/0,560; 0,863/0,690 y 20,61/19,00/13,39.

## 4. Interacciones — §7.4 corregido

Commit autoritativo:

`d9a9a824a5a7f3bf83362d8a4cae4ec4a7ab60cf`

La corrida corregida mantiene los ejemplos narrativos:

- 3.255 efectos dirigidos en 30 etapas RMC;
- 421 positivos; 179 negativos; 2.655 nulos;
- media absoluta 0,004711;
- I26→C049: 0,329→0,561; rango 48→4;
- I30→C067: rango ~50→3 y selección posterior;
- C068→C006: 0,490→0,227; rango 6→104;
- I10→I14: reducción ~0,151; rango 2→20;
- C049 cae luego de I11 a ~0,302 y rango 64.

§7.4 puede considerarse revalidado con la red efectiva común.

## 5. Depth-2 — único resultado secundario todavía abierto

### Hallazgo

La corrida depth-2 publicada el 2026-09-04 terminó correctamente en 107 componentes, pero su archivo histórico `baseline-greedy.json` provenía de una corrida de 105 componentes. En consecuencia, los antiguos porcentajes de cambio de `A_P` (`−0,14%`, `−0,15%`, `+0,11%`) son **inválidos y están deprecados**.

### Corrección de código

- `ed758343f29e83cdecc22b6f2e8ca6404d200a6a`: el runner reconstruye el baseline desde `results/paper-full-portfolio-scenarios/summary.json`, valida invariantes, exige igualdad del estado final y calcula áreas públicas de trayectoria.
- `15587a75b9b60f6fa9721fb97f337a54adb86509`: el workflow depth-2 se vuelve a ejecutar cuando cambia el baseline autoritativo.

Run en curso al crear este cursor:

- workflow: `Paper lookahead depth2`;
- run id: `33972922519`;
- head SHA: `15587a75b9b60f6fa9721fb97f337a54adb86509`.

### Regla de reanudación

Al volver al proyecto, **primero revisar ese workflow o el último `Paper lookahead depth2`**. Si terminó con éxito:

1. comprobar `baseline-greedy.json`: `initial_components=142` y `final_components=107` en las tres referencias;
2. leer `public_trajectory_areas.csv`, `depth2_improvements.csv`, `greedy_vs_depth2.csv` y `depth2_summaries.csv`;
3. actualizar §7.5 con los valores corregidos;
4. marcar R2-02 cerrado y congelar el nuevo commit de resultados.

Hasta entonces, el manuscrito no reporta porcentajes numéricos depth-2.

## 6. Manuscrito vivo

### Google Doc principal

- ID: `1d4W7EdCoJDnU1rHB7Z4Y9wy-cU4JnjcaswqS5RtZUIs`
- título: `EDTR - Evaluación de trayectorias de implementación en redes de transporte - Método EVA`
- tab: `t.0`
- última revisión conocida después de las correcciones del 2026-09-05: `ANLCKQnSxqpTxYlc8d0eEjNBl3pgdyuguZ7ru7-AMo0QxyZ_QQm84-oDm20r8mFmCs52xH0mDKZnwvxCrnjKtDHaa_B3xpRgXWSQ0NNNdF8`

Cambios aplicados:

- §7.1 actualizado a la corrida 142→107;
- §6.7 actualizado a rutas reproducibles vigentes;
- §7.5 depurado de porcentajes producidos con baseline 105;
- §4.4 ya distingue igualdad física final de pequeña resolución numérica de D;
- §4.7 ya explicita que no existe un umbral universal de materialidad.

### Google Doc nativo con ecuaciones LaTeX

- ID: `1kocRJOBPpdW58VgX9B6cHj66MGBWRrleH5KcJdpHq9E`
- última revisión conocida después de sincronizar §§6.7, 7.1 y 7.5: `ANLCKQlBsNyDAdehHqS8wfTpaRAcGRIUkzio_z7ZRg-OX7izRoQ9Uq9g6Fq0qwjOnVsCDKrOXhBlYZGnDp1dDlIQNybFX8-apspxQd6S57w`

Mantener esta copia como fuente portátil de matemáticas; el Google Doc principal sigue siendo la referencia de layout.

### Control editorial de extensión 2026-09-05

La exportación PDF del Google Doc principal, después de las correcciones anteriores, tiene:

- **20 páginas exactas**;
- tamaño Carta (612×792 pt);
- 1.015.872 bytes (~0,97 MiB).

La inspección renderizada de las 20 páginas muestra que el contenido permanece dentro del límite editorial. Sin embargo, la exportación de Google Docs reemplaza varios subíndices y superíndices Unicode por cuadrados vacíos en la notación matemática. Por ello esta exportación es válida para QA de longitud/layout, **no** como archivo final de envío. El Word final deberá usar ecuaciones nativas OMML.

## 7. Deuda técnica pre-v3.13

La consolidación comenzó el 2026-09-05:

- `b1805d7eee4742272e51f1ac9510a02af30ca124`: `src/scenarios.jsx` incorpora directamente la semántica “cobertura marginal de población ocupada” y `evaExplainScore` ya no depende del wrapper de compatibilidad; los vectores de pesos no se modificaron.
- `5089587669168f72161c4cd5115836226b5ba800`: `src/methodology-corrections.jsx` quedó reducido únicamente a las fichas todavía heredadas de `metodologia.jsx`.

Pendiente antes de una release estable:

1. integrar en `src/metodologia.jsx` las correcciones de `sec_score`, `crit_costoOD`, `crit_poblacion`, `crit_oportunidades` y `crit_equidad`;
2. eliminar el include de la capa temporal;
3. borrar `src/methodology-corrections.jsx` sólo después de verificar que no queda semántica dependiente de ella;
4. rerun QA y experimentos afectados.

Semántica que debe conservarse:

- `pob` = población ocupada modelada, no población total;
- `costoOD` = clave histórica para tasa discreta de habilitación OD, no costo generalizado;
- normalización operacional distinta de la normalización fija G0 usada en el paper;
- escenario/explicador del score debe decir “cobertura marginal de población ocupada”.

## 8. Trazabilidad editorial y release

- La versión pública estable continúa siendo **v3.12.1** con DOI `10.5281/zenodo.22145509`.
- El motor 3.13.0 y metodología 2.4.0 son experimentales y **no deben describirse como release pública**.
- §5.5 del manuscrito ya refleja esta diferencia.

## 9. Secuencia de cierre

1. cerrar y persistir depth-2 corregido;
2. actualizar §7.5 y auditoría;
3. terminar consolidación de `methodology-corrections.jsx` en `metodologia.jsx`;
4. rerun CI;
5. congelar un commit reproducible único del paper;
6. generar Word final con ecuaciones OMML, Times New Roman 12, interlineado simple, páginas numeradas y <20 MB;
7. QA visual página por página del DOCX/PDF derivado;
8. sólo entonces declarar versión lista para envío EDTR.
