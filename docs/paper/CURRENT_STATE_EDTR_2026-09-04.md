# Estado vigente del paper EVA para EDTR

Fecha de corte: 2026-09-04

Este archivo es el **cursor autoritativo de reanudación** del paper EVA para EDTR. Supersede `CURRENT_STATE_EDTR_2026-09-03.md` y, para topología/umbrales, `CROSS_SCENARIO_RANK_FRONTIER_SATURATION_2026-09-03.md`.

## 1. Manuscrito vivo y archivo Word

Título: **Evaluación de trayectorias de implementación en redes de transporte: método EVA para la secuenciación dependiente del estado**.

Google Doc de trabajo principal:

- ID `1d4W7EdCoJDnU1rHB7Z4Y9wy-cU4JnjcaswqS5RtZUIs`.

Durante el 4 de septiembre se generó además un Word de revisión con las ecuaciones preservadas en LaTeX, se corrigieron problemas de paginación heredados de Google Docs y se verificaron visualmente **20 páginas**, dentro del máximo editorial trabajado para EDTR.

## 2. Paquete documental para revisores

La entrada recomendada es `docs/paper/README.md`.

Documentos nuevos y vigentes:

1. `docs/paper/SUPLEMENTO_TECNICO_CALCULOS_EDTR_2026-09-04.md` — explicación extensa y reproducible de todo el cálculo del paper: formulación, datos, red efectiva, normalización, perfiles W, algoritmo, trayectorias, suficiencia, interacciones, Pareto, sensibilidad, QA y figuras.
2. `docs/paper/ANEXO_DICCIONARIO_METRICAS_Y_SCORE_EDTR.md` — diccionario de las 16 claves del score, campos brutos, transformaciones exactas, ecuaciones y cautelas.
3. `docs/paper/REFERENCIAS_APA_DOI.md` — bibliografía APA 7 con DOI enlazado, software EVA/Zenodo y fuente PMTUM.
4. `docs/paper/README.md` — índice de lectura para un revisor y mapa de experimentos/resultados.

El README de `results/paper-all-scenarios-benefits/` fue corregido para eliminar la interpretación antigua de que el umbral 95% “identifica rendimientos decrecientes”. La redacción vigente distingue concentración temprana/cola lenta de suficiencia objetivo-específica.

## 3. Corrección cerrada: definición de red efectiva

La capa `experiments/effective-network.js` replica el perfil `general` del motor y excluye `piloto`, `zona30` y `otro` antes de ejecutar cualquier módulo científico.

Trazabilidad principal:

- `48ddf2144166f636d84b24c2cc1eaa1f972451f7` — alinea runner de 12 escenarios;
- `3b0898e30bdb70cf14c177e12c6930617bc340e4` — fuerza rerun cuando cambia red efectiva;
- `bd7be8a91cacc7bd834ac663eefa80fdc4f408cf` — estado común de experimentos;
- `376a5e355d7086371fa89ca827262c7c089e4897` — GitHub Actions persiste resultados corregidos.

Cifras antiguas `105 componentes`, `I_C=0,876568` y `3.913 componente-etapa` son **obsoletas para el resultado final del paper**.

## 4. Snapshot autoritativo del experimento principal

Fuente: `results/paper-all-scenarios-benefits/`, commit `376a5e355d7086371fa89ca827262c7c089e4897`.

- universo modelado: 133 proyectos;
- elegibles: 124 = 88 comunales + 36 intercomunales;
- red existente fuente: 601 ejes;
- red efectiva `G0`: 576 ejes;
- `G0`: 142 componentes;
- estado final común: 107 componentes;
- reducción final: 35;
- nuevo acceso final común: 600.177 ocupados modelados;
- costo proxy final común: 43.887 MCLP.

Resultados líderes:

- Educación superior: `I_P=0,886870`;
- Demanda potencial: `I_D=0,912567`;
- Continuidad de red: `A_C=3909 componente-etapa`, `I_C=0,900691`.

Fronteras:

- 2D `(I_P,I_D)`: Educación superior y Demanda potencial;
- 3D `(I_P,I_D,I_C)`: se agregan Integración metropolitana y Continuidad de red.

## 5. Umbral práctico conjunto P–OD

Con `C_PD,W(t)=min(P_t/P_H,D_t/D_H)`, 95%:

| Escenario | Etapa |
|---|---:|
| Educación | 44 |
| Integración | 44 |
| Balanceado | 47 |
| Demanda | 48 |
| Seguridad | 51 |
| Intermodal | 53 |
| Continuidad | 57 |
| RMC | 59 |
| Ciclistas | 70 |
| Eficiencia | 80 |
| Equidad | 94 |
| Dendrítica Alameda | 108 |

El 99% requiere 116–123 proyectos. Esto es **captura práctica**, no condición de beneficio marginal nulo.

## 6. Tres escenarios de referencia

Usar las cifras del rerun de 12 escenarios:

- Balanceado: `A_P=64.498.446`, `I_P=0,866659`;
- RMC: `A_P=64.232.198`, `I_P=0,863081`;
- Ciclistas: `A_P=63.805.634`, `I_P=0,857350`.

Población acumulada al proyecto 10: 283.945, 319.070 y 274.191 respectivamente. Hitos 50%: 11, 9 y 12.

Population-first: `A_P=68.838.193`, `I_P≈0,925`; ventajas sobre Balanceado/RMC/Ciclistas: 6,73%, 7,17% y 7,89%.

## 7. Suficiencia objetivo-específica

Population-first:

- `t*_P=42`;
- 82 proyectos remanentes;
- 600.177 ocupados con nuevo acceso;
- no existe ganancia directa ni habilitada a un paso al detenerse;
- `A_P=68.838.193` sobre horizonte común 124;
- `I_P=0,924972`;
- ningún habilitador de un paso fue ejecutado antes del stop.

OD-first:

- `t*_D=52`;
- 72 remanentes;
- 871.510/871.511 viajes OD/día;
- no existe ganancia directa ni habilitada a un paso al detenerse;
- área 99.097.405 viaje-etapa;
- índice 0,916134;
- ningún habilitador de un paso fue ejecutado.

Nunca describir los remanentes como innecesarios: la suficiencia es específica a métrica y profundidad de habilitación.

## 8. Diagnósticos históricos preservados

Los experimentos de interacción, trayectoria adaptativa, normalización y rollout continúan siendo útiles para el mecanismo que prueban, pero algunos se generaron antes de la corrección topológica. Por tanto:

- pueden usarse para cambios de ranking, signos/magnitud de interacción y comparación score vs outcomes;
- **no** deben usarse como fuente de topología final si reportan 105 componentes.

Diagnóstico RMC 30 etapas: 3.255 interacciones dirigidas, 421 positivas, 179 negativas, 2.655 nulas; media absoluta 0,00471. Ejemplos I26→C049, C068→C006 e I10→I14 permanecen como evidencia de dependencia del estado.

## 9. Versionamiento y cita

Release pública citable:

- EVA `v3.12.1`;
- motor `v3.12.0`;
- datos `2026.08`;
- metodología `v2.3.0`;
- DOI https://doi.org/10.5281/zenodo.22145509.

**No existe todavía release pública v3.13.0.** El paper usa una rama de desarrollo posterior congelada por commit. No declarar v3.13.0 publicada hasta crear efectivamente tag/release y, si corresponde, depósito Zenodo.

## 10. Interpretación científica que debe preservarse

- EVA es una **capa de evaluación de trayectoria**, no un optimizador global nuevo.
- La novedad no es que “el orden importa”, sino la articulación auditable de estado, transformación, factibilidad, preferencias, normalización, resultados públicos e interacciones.
- `S_t` es valor decisional, no bienestar social.
- `I_t(p,q)` es señal dentro del modelo, no causalidad o complementariedad económica.
- P, D y C no son validadores externos independientes de W.
- Normalización científica fija en `G0`.
- `I_C` es índice de trayectoria topológica, no una proporción necesariamente monótona de captura.
- No hay W universalmente superior sin declarar el resultado relevante.
- La validación empírica es ciclable; la transferibilidad es arquitectónica.

## 11. Estado editorial y técnico al cierre de esta actualización

Completado:

- manuscrito actualizado con cifras topológicas corregidas;
- Word de revisión regenerado con ecuaciones LaTeX y 20 páginas verificadas;
- paquete GitHub extenso para revisión externa;
- bibliografía APA/DOI;
- figuras reproducibles enlazadas desde el suplemento;
- aclaración de datasets históricos versus autoritativos;
- README de resultados corregido semánticamente.

## 12. Próximos pasos

1. Ejecutar auditoría final tipo revisor 2 usando el suplemento como mapa de evidencia.
2. Verificar una a una las afirmaciones bibliográficas del estado del arte contra las fuentes primarias.
3. Consolidar `methodology-corrections.jsx` dentro de las fuentes principales antes de una release estable posterior.
4. Rerun de CI después de esa consolidación y verificar que las salidas científicas no cambian.
5. Crear tag/release reproducible del paper sólo después del QA; no usar v3.13.0 antes de que exista realmente.
6. Mantener el Word de envío dentro de 20 páginas después de cualquier corrección final.
7. Antes de envío, hacer una última inspección cruzada: manuscrito ↔ suplemento ↔ CSV ↔ código ↔ referencias.

Para retomar el trabajo desde un chat nuevo: comenzar por `docs/paper/README.md`, luego este cursor y finalmente el suplemento técnico.