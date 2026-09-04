# Estado vigente del paper EVA para EDTR

Fecha de corte: 2026-09-04

Este archivo es el **cursor autoritativo de reanudación** del paper EVA para EDTR y **supersede** `docs/paper/CURRENT_STATE_EDTR_2026-09-03.md` y, para cifras topológicas y umbrales, `docs/paper/CROSS_SCENARIO_RANK_FRONTIER_SATURATION_2026-09-03.md`.

## 1. Manuscrito vivo

- Google Doc: `EDTR - Evaluación de trayectorias de implementación en redes de transporte - Método EVA`
- ID: `1d4W7EdCoJDnU1rHB7Z4Y9wy-cU4JnjcaswqS5RtZUIs`
- Título: **Evaluación de trayectorias de implementación en redes de transporte: método EVA para la secuenciación dependiente del estado**.
- La última exportación PDF verificada antes de esta corrección tenía 20 páginas exactas; después de los cambios del 4 de septiembre debe volver a exportarse y comprobar que sigue dentro del límite EDTR.

## 2. Corrección cerrada: definición de red efectiva y topología

El bloqueo sobre `C_t` quedó resuelto.

La capa experimental contiene `experiments/effective-network.js`, que replica para el perfil `general` la definición funcional del motor: excluye de la red existente los ejes con `tipoNorm` `piloto`, `zona30` y `otro` y sustituye `window.existingFC` por esa red efectiva antes de ejecutar los experimentos. Los runners cargan y aplican esta capa antes de marcar el entorno como listo.

Commits de trazabilidad:

- `48ddf2144166f636d84b24c2cc1eaa1f972451f7` — alinea el runner de 12 escenarios con la red efectiva;
- `3b0898e30bdb70cf14c177e12c6930617bc340e4` — fuerza rerun del análisis de 12 escenarios cuando cambia la red efectiva;
- `bd7be8a91cacc7bd834ac663eefa80fdc4f408cf` — activa experimentos desde el estado común de red efectiva;
- `376a5e355d7086371fa89ca827262c7c089e4897` — GitHub Actions persiste las salidas corregidas de los 12 escenarios.

Por tanto, las cifras previas `105 componentes`, `I_C=0,876568` y `3.913 componente-etapa` deben considerarse **obsoletas**.

## 3. Resultados autoritativos después del rerun

Fuente principal: `results/paper-all-scenarios-benefits/scenario_benefit_summary.csv`, generado 2026-09-03T18:28:53Z y persistido en el commit `376a5e355d7086371fa89ca827262c7c089e4897`.

Estado común de la cartera completa:

- 124 proyectos elegibles = 88 comunales + 36 intercomunales;
- ganancia acumulada final de acceso: 600.177 ocupados modelados;
- `G0` efectivo: 142 componentes;
- estado final: **107 componentes**;
- reducción final común: 35 componentes;
- costo acumulado proxy: 43.887 MCLP.

Captura temprana:

- Educación superior: `I_P = 0,886870`;
- Demanda potencial: `I_D = 0,912567`;
- Continuidad de red: **`A_C = 3909 componente-etapa`, `I_C = 0,900691`**;
- Integración metropolitana: `I_C = 0,874885`;
- Demanda potencial: `I_C = 0,863134`.

Fronteras:

- 2D `(I_P,I_D)`: sólo **Educación superior** y **Demanda potencial**;
- 3D `(I_P,I_D,I_C)`: se mantienen además **Integración metropolitana** y **Continuidad de red**.

La corrección modifica valores topológicos, pero no cambia la composición cualitativa de la frontera 3D.

## 4. Umbral práctico conjunto población + OD

Con `C_PD,W(t)=min(P_t/P_H,D_t/D_H)`, el 95% se alcanza en:

- Educación superior: 44;
- Integración metropolitana: 44;
- Balanceado: 47;
- Demanda potencial: 48;
- Seguridad vial: 51;
- Intermodalidad bici-metro: 53;
- Continuidad de red: 57;
- RMC: 59;
- Ciclistas: 70;
- Eficiencia presupuestaria: **80**;
- Equidad territorial: **94**;
- Dendrítica Alameda: **108**.

El 99% exige entre 116 y 123 proyectos según escenario. El umbral de 95% es descriptivo y no equivale a suficiencia ni a beneficio marginal nulo.

## 5. Tres escenarios de referencia: cifras que deben usarse

Las cifras de `results/paper-full-portfolio-scenarios/population_trajectory_summary.csv` fueron generadas el 2 de septiembre y quedaron anteriores a la unificación de red efectiva. Para el manuscrito, RMC, Balanceado y Ciclistas deben leerse desde el rerun de los 12 escenarios:

- Balanceado: `A_P = 64.498.446 ocupado-etapa`, `I_P = 0,866659`;
- RMC: `A_P = 64.232.198`, `I_P = 0,863081`;
- Ciclistas: `A_P = 63.805.634`, `I_P = 0,857350`.

Los hitos de 50% permanecen 11, 9 y 12, respectivamente; las poblaciones acumuladas al proyecto 10 usadas en el texto permanecen 283.945, 319.070 y 274.191.

Population-first mantiene `A_P = 68.838.193` e `I_P ≈ 0,925`; frente a las cifras autoritativas anteriores supera a Balanceado en 6,73%, a RMC en 7,17% y a Ciclistas en 7,89%.

## 6. Suficiencia objetivo-específica

Sin cambios sustantivos:

- Population-first: `t*_P = 42`, 82 proyectos remanentes, 600.177 ocupados modelados con nuevo acceso, sin ganancia directa ni habilitada a un paso para P;
- OD-first: `t*_D = 52`, 72 remanentes, 871.510/871.511 viajes OD/día, sin ganancia directa ni habilitada a un paso para D.

No declarar innecesarios los proyectos restantes. La suficiencia es específica al resultado y al horizonte de habilitación de un paso.

## 7. Versionamiento y cita reproducible

Release pública citable vigente:

- EVA `v3.12.1`;
- motor `v3.12.0`;
- datos `2026.08`;
- metodología `v2.3.0`;
- DOI `10.5281/zenodo.22145509`.

**No existe todavía una release pública v3.13.0.** El manuscrito ya fue corregido para no presentar `3.13.0` como release publicada. Los experimentos del artículo deben identificarse como desarrollo posterior y congelarse por commit; el snapshot de resultados de 12 escenarios actualmente citado es `376a5e355d7086371fa89ca827262c7c089e4897`.

Antes del envío conviene crear tag/release reproducible y, si corresponde, nuevo depósito Zenodo.

## 8. Correcciones aplicadas al Google Doc el 4 de septiembre

Se corrigieron directamente en el manuscrito:

- resumen español: `I_C=0,901`;
- abstract inglés: `I_C=0.901`;
- §7.6: `A_C=3.909 componente-etapa; I_C=0,901`;
- §7.6: umbrales 95% Eficiencia=80, Equidad=94 y Dendrítica=108;
- §7.2: `A_P` e `I_P` de Balanceado/RMC/Ciclistas alineados al rerun de 12 escenarios;
- §7.3: porcentajes de ventaja de Population-first actualizados a 6,73%, 7,17% y 7,89%;
- §5.5: reemplazada la afirmación de “versión experimental 3.13.0” publicada por referencia explícita al desarrollo posterior y al commit reproducible `376a5e...`;
- §7.7: eliminado doble punto tipográfico.

## 9. Interpretación científica que debe preservarse

- EVA es una **capa de evaluación de trayectoria** para carteras interdependientes, no un nuevo optimizador global.
- El mismo conjunto final puede producir trayectorias de beneficio materialmente distintas.
- `S_t` es una función decisional, no bienestar social.
- P, D y C no son validadores externos independientes de W; se usan como resultados comparables y deben interpretarse con esa endogeneidad.
- La normalización científica permanece fija en `G0`.
- La reducción de componentes se analiza separadamente porque `C_t` puede ser no monótono.
- No existe un W universalmente superior sin declarar previamente el resultado público relevante.
- La validación empírica es ciclable; la transferibilidad a otros modos es arquitectónica y requiere redefinir/validar la capa sectorial.

## 10. Próximos pasos obligatorios

1. Reexportar el Google Doc a PDF y verificar nuevamente el límite de 20 páginas después de las correcciones del 4 de septiembre.
2. Realizar lectura tipo **revisor 2** centrada en novedad incremental, endogeneidad score/outcomes, validez externa, causalidad, sensibilidad de parámetros y sobreafirmaciones.
3. Auditar referencias una por una contra las afirmaciones de estado del arte.
4. Auditar ecuaciones, símbolos y notación contra el código.
5. Consolidar `methodology-corrections.jsx` dentro de las fuentes principales si aún permanece como capa temporal.
6. Congelar release/tag reproducible para el paper; no usar `v3.13.0` como release hasta que exista.
7. Generar DOCX final EDTR con ecuaciones nativas Word Math/OMML.
8. QA visual/editorial final: máximo 20 páginas, resumen <=200 palabras, figuras y referencias consistentes.

Hasta completar estos pasos, el Google Doc es el manuscrito vivo y este archivo es el cursor de reanudación.