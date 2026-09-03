# Estado vigente del paper EVA para EDTR

Fecha de corte: 2026-09-03

Este archivo es el **cursor autoritativo de reanudación** del paper. La fuente viva de contenido es el Google Doc y GitHub conserva el estado científico, computacional y editorial necesario para continuar sin reconstruir la conversación.

## 1. Manuscrito vivo

- Google Doc: `EDTR - Evaluación de trayectorias de implementación en redes de transporte - Método EVA`
- ID: `1d4W7EdCoJDnU1rHB7Z4Y9wy-cU4JnjcaswqS5RtZUIs`
- Título del artículo: **Evaluación de trayectorias de implementación en redes de transporte: método EVA para la secuenciación dependiente del estado**.
- Estado editorial al cierre de esta actualización: **20 páginas exactas** en la exportación PDF de Google Docs.
- Resumen español: aproximadamente **177 palabras** después de la última compactación, bajo el límite de 200 palabras.
- Google Docs sigue siendo fuente de contenido, no artefacto tipográfico final: su PDF rompe varios subíndices/superíndices Unicode. El DOCX final debe reconstruir matemática con Word Math/OMML y pasar QA visual página por página.

## 2. Tesis científica central: evaluación de trayectoria de planes maestros

La formulación que debe preservarse es más general que la aplicación ciclable.

Los planes maestros de transporte suelen representar una condición base `G0` y uno o más horizontes futuros en que una cartera de proyectos y políticas ya está incorporada. Esa evaluación permite comparar estados y proyectos, pero un plan que se ejecuta por etapas también genera una trayectoria:

`G0 -> G1 -> G2 -> ... -> GH`

Cada proyecto `p` actúa como un operador `T_p` que transforma el estado vigente. Si al cambiar `G_t` cambian los beneficios, atributos o prioridades de los proyectos restantes, entonces el orden de implementación forma parte del desempeño del plan y no es sólo una decisión administrativa posterior.

EVA debe presentarse como una **capa de evaluación de trayectoria**. Su pregunta no es solamente “¿qué proyectos componen el mejor estado final?”, sino también:

- ¿qué beneficios se obtienen en cada estado intermedio?;
- ¿cómo cambia el beneficio marginal de un mismo proyecto según el momento en que se incorpora?;
- ¿cómo cambia la prioridad de las alternativas remanentes después de cada intervención?;
- ¿qué secuencias adelantan determinados resultados públicos?;
- ¿cuándo un objetivo alcanza una condición de suficiencia bajo una profundidad explícita de habilitación?;
- ¿qué proyectos son robustamente prioritarios y cuáles dependen fuertemente del estado y de las preferencias de política?

### recomendación general del paper

La conclusión metodológica defendible es:

> **Todo plan maestro cuyos proyectos puedan ser interdependientes debería someter su cartera, al menos, a un test de dependencia de secuencia.**

Si rankings, beneficios y resultados permanecen prácticamente invariantes al actualizar el estado, el test respalda que una priorización estática es suficiente. Si cambian materialmente, debe evaluarse explícitamente la trayectoria y el orden debe tratarse como una variable sustantiva del plan.

Esta recomendación es general. La **validación empírica** del artículo, sin embargo, sigue siendo ciclable; por ello no afirmar que EVA ya está empíricamente validado para metro, carreteras u otros sistemas.

## 3. Inserción en la metodología SECTRA de Chile

La revisión de la metodología oficial chilena permite ubicar EVA en un vacío concreto del proceso de planificación.

La **Guía metodológica para la elaboración de Planes Maestros de Transporte Urbano Metropolitano (PMTUM)** de SECTRA/SUBDERE:

- modela iniciativas respecto de una situación base, individual y conjuntamente;
- trabaja con cortes temporales y estados futuros;
- incorpora evaluación social y evaluación multicriterio del plan;
- una vez conformada la cartera definitiva, exige priorizar proyectos considerando restricciones financieras, temporales y de recursos;
- define una **secuencia de implementación**;
- exige seguimiento, indicadores, complementariedad, evaluaciones periódicas y actualización adaptativa;
- admite explícitamente cambios posteriores en el orden de priorización de iniciativas.

La brecha es que esas etapas no establecen un procedimiento que, después de incorporar cada proyecto, reconstruya sistemáticamente el nuevo estado y recalcule el beneficio y la prioridad de todas las alternativas remanentes.

EVA se inserta **entre la evaluación/conformación de la cartera y su programación definitiva**, y puede volver a utilizarse durante el seguimiento:

1. calibrar y representar `G0`;
2. modelar/evaluar proyectos y paquetes mediante los instrumentos sectoriales vigentes;
3. realizar evaluación social y multicriterio;
4. conformar la cartera definitiva;
5. **aplicar EVA para construir y comparar trayectorias secuenciales**;
6. fijar programación financiera y temporal con conocimiento del efecto de orden;
7. durante la ejecución, actualizar `G_t` y repetir el análisis cuando cambien proyectos, restricciones o condiciones externas.

EVA **no reemplaza** las herramientas SECTRA. En aplicaciones viales o de transporte público puede operar como capa de orquestación:

- `ESTRAUS` / `VIVALDI`: pueden producir indicadores y estados operacionales de red en cada `G_t`;
- `MESPIVU` / SNI: pueden aportar resultados de evaluación social;
- `MODEM` / `MODEC`: pueden aportar emisiones e impactos ambientales/económicos;
- AHP u otro MCDA: puede representar preferencias `W`;
- EVA organiza la actualización iterativa `G_t -> T_p(G_t) -> G_{t+1}` y compara la trayectoria completa.

La referencia incorporada al manuscrito es:

`SECTRA y SUBDERE (2025) Guía metodológica para la elaboración de Planes Maestros de Transporte Urbano Metropolitano (PMTUM). Programa de Vialidad y Transporte Urbano, Ministerio de Transportes y Telecomunicaciones, Chile.`

## 4. Qué NO debe reclamarse como novedad

EVA no inventa la idea de que el orden importa. La literatura de secuenciación, expansión multiperíodo, planificación adaptativa y proyectos interdependientes ya lo reconoce.

Antecedentes recientes especialmente próximos:

- Paulsen y Rich (2023): expansión ciclable secuencial con interdependencias;
- Paulsen y Rich (2024): demanda inducida, actualización de estados intermedios y reglas económicas de detención;
- Yu et al. (2026): reevaluación iterativa de una cartera oficial mediante TOPSIS.

La contribución incremental de EVA es la **articulación auditable** de:

- estado `G_t`;
- operadores `T_p`;
- conjunto factible `P^f_t`;
- preferencias `W`;
- estrategia topológica `Ω`;
- parámetros `Θ`;
- resultados públicos separados de la función decisional;
- normalización controlada para no confundir dependencia de estado con cambios del denominador;
- interacciones dirigidas `I_t(p,q)`;
- captura temprana y suficiencia objetivo-específica;
- trazabilidad entre datos, parámetros, código, resultados y versión.

EVA se presenta como **método de evaluación de trayectoria**, no como un nuevo optimizador global.

## 5. Universo experimental y normalización

- Universo modelado: 133 proyectos.
- Conjunto factible inicial `P^f_0`: 124 proyectos = 88 comunales + 36 intercomunales.
- Nueve corredores MET permanecen modelados, pero se excluyen de competencia por prioridad y de las referencias de normalización del experimento.
- Las corridas científicas usan referencias de normalización fijadas en `G0`.
- La normalización operacional de EVA sobre la cartera activa se conserva como sensibilidad.
- La escala fija `G0` no está necesariamente acotada a `[0,1]`: un atributo que supere posteriormente el máximo observado en `G0` puede producir `x_hat > 1`.
- El costo no es objetivo del experimento; puede operar como restricción de factibilidad/programación.

## 6. Significado correcto de P y D

### Población

El motor usa `h.properties.pob`, que corresponde a **población ocupada modelada** asociada a la base OD laboral, no a población total.

Además, `poblacion = pobNew` representa ocupados que **adquieren acceso respecto del estado anterior**. Por tanto:

- `Delta P_t` = nueva ganancia marginal de acceso de población ocupada;
- `P_t` = ganancia acumulada de acceso respecto de `G0`;
- las 600.177 unidades finales NO son población total cubierta por la red y tampoco incluyen a quienes ya tenían acceso en `G0`;
- `pobBeneficiada` es otra variable: ocupados que obtienen al menos un viaje OD nuevo viable, incluidos efectos de interconexión.

`A_P` debe expresarse como `ocupado-etapa`.

### OD

Configuración experimental base:

- 1.589 hexágonos de aproximadamente 600 m;
- acceso origen: 700 m;
- acceso destino: 700 m;
- tolerancia de empalme: 150 m;
- comuna destino servida si una subred cubre al menos 40% de sus ocupados modelados;
- se evalúan los diez principales destinos laborales por hexágono;
- `porcProtegido = 0%`;
- `aproxFinal = 0 m`;
- `tiempoMax = 0`;
- costo proxy: 100 MCLP/km.

`Delta D_t` y `D_t` son un **proxy de habilitación funcional OD a nivel comunal**, no un ruteo puerta-a-puerta hacia lugares de trabajo individuales.

## 7. Otros criterios auditados

- `demandaHabilitada = flowEnabled`: viajes OD previamente no viables que pasan a ser viables.
- `costoOD` es una clave histórica; actualmente codifica una tasa de habilitación OD discretizada `-round(30*habRate)`, no costo generalizado.
- costo de inversión = longitud × costo unitario;
- `costoInv = 1 - costo/max(costo)`;
- factibilidad es un proxy espacial asociado al número de pistas;
- `flowEnabled` se redondea a entero antes de retornar el beneficio marginal, lo que explica la diferencia 871.510/871.511 entre trayectorias.

## 8. Resultados actualmente usados en el manuscrito

Robustez de prioridad:

- 90/124 proyectos cambian más de 20 posiciones entre los doce perfiles;
- 37 cambian más de 50; 17 más de 75; 4 más de 100;
- I12 Las Rejas–Suiza–Departamental: Top-10 en 12/12;
- I26 San Pablo: Top-10 en 11/12;
- I14 Lo Ovalle: rango 4–124.

Cobertura y OD:

- estado final: ganancia acumulada de acceso para 600.177 ocupados modelados;
- Population-first: 42/124; 82 remanentes; sin ganancia directa ni habilitada a un paso de P;
- OD-first: 52/124; 72 remanentes; 871.510/871.511 viajes OD/día; sin beneficio directo ni habilitado a un paso de D;
- 95% conjunto P+OD: 44–107 proyectos según `W`;
- 99%: 116–123 proyectos.

La cola 95->99% indica captura adicional lenta; **no** demuestra por sí sola rendimientos marginales decrecientes en sentido económico/matemático y no equivale a beneficio cero.

P, D y C están relacionados con criterios que participan en `S_t`; no son validadores externos independientes de los perfiles `W`. Las fronteras de Pareto deben interpretarse como consecuencias comparables de las políticas evaluadas, no como prueba de que un perfil sea universalmente mejor.

Los doce `W` son perfiles predefinidos plausibles, no un muestreo exhaustivo del simplex de ponderaciones.

## 9. Bloqueo técnico pendiente: métrica topológica C_t

**No congelar los resultados topológicos ni publicar v3.13.0 hasta resolver esto.**

El motor principal, con perfil `general`, construye los componentes sobre `effExisting`, que excluye de la red efectiva tipologías `piloto`, `zona30` y `otro` antes de aplicar `buildComponents`.

En la capa experimental, `fixedStepRecord` parece registrar `componentes_red` mediante `window.ENGINE.buildComponents(window.existingFC, lockedGeoms, connectTol)`, es decir, usando la red existente completa en vez de la misma `effExisting` del motor.

Si se confirma, pueden cambiar:

- `C_t`;
- `A_C`;
- `I_C`;
- la afirmación de que Continuidad lidera la trayectoria topológica;
- la frontera tridimensional que incluye la dimensión topológica;
- el valor final de componentes informado en el paper.

Esto no implica automáticamente que cambien P, D, los rankings multicriterio o Population-first/OD-first, pero debe verificarse empíricamente tras corregir el registro topológico.

Los valores topológicos actualmente escritos (`105 componentes`, `I_C=0,876568`, `3.913 componente-etapa`) son **provisionales hasta ese rerun**.

## 10. Correcciones de semántica/documentación en EVA

Commits principales:

- `ec0401b6b170f9f34fa2547917d79dd698823d7d` — etiquetas OD, costo y factibilidad;
- `3cfdb7034e8561a5cf717ef43b920c8184c89a86` — corrección de fichas heredadas de `costoOD` y score;
- `68fe38bd35ea76534c47d41603dde441eef69326` — carga de `methodology-corrections.jsx`;
- `bbf588211320f8c558a59624a7ccc1d0730a5766` — semántica de población ocupada en fichas, escenarios, equidad, oportunidades y explicación automática.

Estas correcciones no cambian intencionalmente pesos ni cálculos.

Antes de v3.13 estable, consolidar `methodology-corrections.jsx` dentro de `metodologia.jsx`/`scenarios.jsx` y eliminar la capa temporal. No sustituir `pob` por población total salvo rediseño metodológico explícito, porque eso alteraría el experimento.

## 11. Reproducibilidad

Release citable vigente:

- EVA `v3.12.1`;
- motor `v3.12.0`;
- datos `2026.08`;
- metodología `v2.3.0`;
- DOI `10.5281/zenodo.22145509`.

El paper usa código experimental identificado internamente como motor `3.13.0` y metodología `2.4.0`, pero todavía no existe una release pública GitHub v3.13.0.

Workflow `Paper experiments`:

- run #36, commit `3cfdb7034e8561a5cf717ef43b920c8184c89a86`: **success**;
- run #37, commit `bbf588211320f8c558a59624a7ccc1d0730a5766`: **success**.

La corrida #37 confirma que las correcciones semánticas de población ocupada no rompieron el workflow. Después de corregir la inconsistencia de `C_t` debe ejecutarse un nuevo rerun y comparar resultados.

## 12. Estado editorial

La última exportación después de incorporar el marco SECTRA y compactar redundancias tiene **20 páginas exactas**.

El resumen se reescribió para mantener explícita la contribución general y quedó en aproximadamente 177 palabras. Su cierre sostiene que EVA justifica incorporar un **test de dependencia de secuencia** como etapa complementaria en la evaluación de planes maestros.

La sección 7.7 y las conclusiones ya expresan la inserción general:

- evaluación convencional: proyecto/plan respecto de una base;
- EVA: valor de cada intervención condicionado al estado anterior y trayectoria acumulada;
- inserción PMTUM: después de conformar cartera y antes de cerrar programación, con reutilización durante seguimiento;
- recomendación: test de dependencia de secuencia como diagnóstico estándar para carteras con interdependencias potenciales.

El bloqueo tipográfico de Google Docs permanece: usar OMML/Word Math en el DOCX final y revisar visualmente las 20 páginas.

## 13. Próximos pasos obligatorios

Continuar en este orden:

1. corregir la inconsistencia `effExisting` versus `window.existingFC` en el registro de componentes de los experimentos;
2. rerun completo de `Paper experiments` y comparar P, D, C, rankings y fronteras;
3. actualizar el manuscrito si cambian los resultados topológicos;
4. terminar lectura tipo **revisor 2**, con foco en validez externa, endogeneidad score/outcomes, causalidad y sensibilidad de parámetros;
5. consolidar `methodology-corrections.jsx` dentro de las fuentes principales;
6. congelar commit reproducible y resolver release/tag `v3.13.0`;
7. generar DOCX EDTR con OMML;
8. QA visual/editorial final: 20 páginas, resumen <=200 palabras;
9. sólo entonces declarar versión final de envío.
