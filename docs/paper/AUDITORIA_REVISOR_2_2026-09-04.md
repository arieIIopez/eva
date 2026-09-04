# Auditoría científica tipo Revisor 2 — paper EVA / EDTR

Fecha de corte: 2026-09-04  
Estado: **abierta hasta cerrar las reruns de diagnósticos secundarios sobre la red efectiva común**.

Este documento registra observaciones científicas, computacionales y editoriales detectadas al cruzar el manuscrito vivo, el suplemento técnico, el código experimental y las salidas persistidas. Su finalidad es impedir que resultados generados con definiciones distintas del estado inicial `G0` entren simultáneamente al artículo.

## 1. Criterio de auditoría

Para considerar un resultado apto para el manuscrito debe cumplir simultáneamente:

1. usar el mismo conjunto factible de 124 proyectos Comunales + Intercomunales cuando el experimento así lo requiera;
2. usar perfil `general` y la misma red existente efectiva;
3. aplicar `experiments/effective-network.js` después de `loadProjects()` y antes de ejecutar el experimento;
4. utilizar normalización fija en `G0` cuando el objetivo científico sea aislar dependencia del estado de cambios mecánicos del denominador;
5. persistir la salida en `results/` mediante un workflow reproducible;
6. poder trazarse a un commit concreto;
7. no transferir cifras topológicas provenientes de corridas históricas cuya red final era 105 componentes.

Estado autoritativo de control:

| Control | Valor vigente |
|---|---:|
| Ejes existentes fuente | 601 |
| Ejes efectivos `G0` | 576 |
| Componentes `G0` | 142 |
| Proyectos elegibles | 124 |
| Componentes finales cartera completa | 107 |
| Reducción final común | 35 |
| Acceso marginal final | 600.177 ocupados |
| Costo proxy final | 43.887 MCLP |

La corrida autoritativa de doce escenarios permanece fijada por el commit `376a5e355d7086371fa89ca827262c7c089e4897` hasta que exista una release específica del paper.

## 2. Matriz de observaciones

| ID | Severidad | Hallazgo | Evidencia | Sección afectada | Acción | Estado |
|---|---|---|---|---|---|---|
| R2-01 | **Alta** | El runner histórico de trayectoria/interacciones no aplicaba la red efectiva común. | `experiments/runner-plan-trajectory.html` cargaba los datos y ejecutaba los experimentos sin `effective-network.js`. | §7.4 y cualquier cifra derivada de `results/paper-plan-trajectory/`. | Alinear runner, workflow y rerun; sustituir cifras sólo después de persistir resultados nuevos. | **Corrección de infraestructura aplicada; rerun pendiente de cierre.** |
| R2-02 | **Alta** | El runner histórico de rollout profundidad 2 tampoco aplicaba la red efectiva común. | `experiments/runner-lookahead-depth2.html` ejecutaba sobre `window.existingFC` sin la capa efectiva. | §7.5. | Alinear runner y workflow; rerun; recalcular las comparaciones. | **Corrección de infraestructura aplicada; rerun pendiente de cierre.** |
| R2-03 | **Alta** | Las salidas persistidas de `paper-full-portfolio-scenarios` eran anteriores a la corrección topológica, aunque su runner actual sí aplicaba la red efectiva. | Archivos históricos contenían estado final de 105 componentes. | §7.1 y cualquier comparación RMC–Balanceado–Ciclistas basada en esa carpeta. | Workflow actualizado para regenerar y publicar resultados en `main`. | **Rerun en curso.** |
| R2-04 | Media | El manuscrito afirmaba que `Y_k` era exactamente común entre escenarios y que usar `A_Y` o `I_Y` era algebraicamente equivalente. | En el rerun autoritativo `D_k` varía entre 871.509 y 871.513 viajes/día por redondeo entero; `P_k` y reducción topológica sí coinciden. | §4.4. | Formular la Pareto sobre `A_P`, `A_D` y `A_C`; usar índices para presentación normalizada y no asumir equivalencia exacta para D. | **Corregido en Google Doc el 2026-09-04.** |
| R2-05 | Media | Los resultados de 95/99% podían leerse como prueba de rendimientos marginales decrecientes. | Umbrales describen concentración acumulada; no identifican una función marginal monotónica. | §7.6, documentación de resultados. | Reinterpretar como concentración temprana + cola lenta; separar de suficiencia. | **Cerrado.** |
| R2-06 | Media | Population-first y OD-first pueden confundirse con óptimos globales o reglas económicas de detención. | Implementación: greedy, con exploración exhaustiva sólo de habilitadores a un paso cuando la ganancia directa es nula. | §4.6, §7.3, conclusiones. | Explicitar optimalidad limitada, objetivo específico y horizonte de habilitación de un paso. | **Cerrado en manuscrito/suplemento; vigilar redacción final.** |
| R2-07 | Media | `P`, `D` y `C` no son validadores completamente externos de `W`. | Algunos criterios del score utilizan variables relacionadas con cobertura, demanda y continuidad. | Interpretación de §7.6 y discusión. | Tratar P/D/C como resultados comparables, pero reconocer endogeneidad parcial; no presentarlos como validación externa. | **Cerrado conceptualmente.** |
| R2-08 | Media | Los signos de `I_t(p,q)` podrían sobreinterpretarse causalmente. | La interacción es diferencia de score recalculado, dependiente de estado, W y modelo. | §4.3, §7.4. | Usar “señal decisional” o “efecto de estado”; no causalidad, beneficio monetario ni complementariedad económica demostrada. | **Cerrado conceptualmente; revisar cifras tras rerun.** |
| R2-09 | Baja/Media | `src/metodologia.jsx` conserva texto heredado que contradice semántica vigente (`costoOD`, población total). | `src/methodology-corrections.jsx` corrige la documentación en runtime pero no la fuente principal. | Reproducibilidad/versionamiento. | Consolidar correcciones en las fuentes principales antes de declarar v3.13 estable. | **Abierto como deuda técnica pre-release.** |
| R2-10 | Media | La afirmación de transferibilidad puede exceder la evidencia empírica. | Validación empírica actual es ciclable en Santiago; otros modos requerirían redefinir criterios, estado y transformaciones. | §4.8, discusión, conclusión. | Mantener transferibilidad **arquitectónica**, no validación modal universal. | **Cerrado conceptualmente.** |
| R2-11 | Media | Falta fijar un umbral universal para decidir cuándo la dependencia de secuencia es “material”. | Spearman/Kendall/Jaccard/desplazamientos son diagnósticos descriptivos; no existe umbral normativo validado. | Discusión / recomendación general. | Recomendar prueba de dependencia y reporte de magnitudes; evitar declarar un corte universal. | **Abierto como limitación deliberada, no como error.** |
| R2-12 | Media | Diferencia de 1 viaje en OD-first puede parecer inconsistencia. | OD-first: 871.510; referencia nominal 871.511; corridas completas 871.509–871.513. | §7.3. | Explicar discretización/redondeo entero y reportar `871.510/871.511` cuando se compare con referencia nominal. | **Cerrado.** |

## 3. Correcciones de infraestructura realizadas durante esta auditoría

### 3.1 Trayectoria e interacciones

Se modificó `experiments/runner-plan-trajectory.html` para:

```javascript
const experimentParams = {
  ...(window.PARAM_DEFAULTS || {}),
  perfil: 'general',
  segKSI: false
};
window.EVA_EXPERIMENT_NETWORK_API.apply(experimentParams);
```

`effective-network.js` se carga antes de los módulos experimentales. El workflow `.github/workflows/paper-plan-trajectory.yml` ahora:

- reacciona a cambios en `effective-network.js`;
- posee permiso `contents: write`;
- persiste `results/paper-plan-trajectory/` en `main`;
- conserva artefactos de la corrida.

### 3.2 Rollout profundidad 2

Se aplicó la misma definición de red efectiva a `experiments/runner-lookahead-depth2.html`. El workflow `.github/workflows/paper-lookahead-depth2.yml` quedó conectado a cambios de la red efectiva y publica las nuevas salidas.

### 3.3 Tres escenarios completos

El runner `experiments/runner-full-portfolio-scenarios.html` ya utilizaba `effective-network.js`, pero su workflow no garantizaba la regeneración/persistencia moderna en `main`. `.github/workflows/paper-full-portfolio-scenarios.yml` fue actualizado para hacerlo.

## 4. Corrección editorial ya aplicada al manuscrito

La frase anterior:

> “En las corridas completas, k y cada Y_k son comunes entre escenarios, por lo que la dominancia es equivalente si se usan los índices I_P, I_D e I_C”.

fue reemplazada por una formulación que distingue igualdad exacta de P/C y cuasi igualdad de D por redondeo, y deja la Pareto definida sobre áreas acumuladas.

Motivo: el vector observado de demanda final en los doce escenarios es:

`871511, 871511, 871511, 871509, 871510, 871513, 871512, 871511, 871512, 871512, 871512, 871512`.

La variación relativa es despreciable para la interpretación sustantiva, pero invalida la afirmación de equivalencia algebraica exacta.

## 5. Qué debe recalcularse antes de cerrar el paper

### 5.1 §7.1 — ranking estático versus secuencial

No conservar automáticamente los valores históricos. Esperar la nueva salida de `paper-full-portfolio-scenarios` y recalcular, para RMC, Balanceado y Ciclistas:

- Spearman;
- Kendall;
- desplazamiento medio;
- Jaccard Top-30;
- primer paso de divergencia.

### 5.2 §7.4 — interacciones

Después de la rerun de `paper-plan-trajectory`, verificar nuevamente:

- número de efectos dirigidos;
- positivos/negativos/nulos;
- media absoluta;
- densidades por `epsilon`;
- ejemplos I26→C049, I30→C067, C068→C006 e I10→I14;
- cualquier cambio de posición citado.

Si los ejemplos cambian, reemplazarlos por los casos extremos de la corrida corregida, no conservarlos por continuidad narrativa.

### 5.3 §7.5 — rollout profundidad 2

Recalcular por escenario:

- divergencia respecto del greedy;
- valor decisional;
- `A_P` público;
- trayectoria topológica;
- interpretación de por qué mayor score no implica necesariamente mayor resultado público P.

### 5.4 §7.6 — sensibilidad

El runner general `experiments/runner.html` ya carga y aplica `effective-network.js`. Tras la rerun correspondiente, confirmar específicamente:

- Jaccard Top-30 fijo versus normalización operacional;
- Jaccard Top-10 133 modelados versus 124 elegibles;
- sensibilidad a raíz, `tau` y `alpha` si se mantiene en el paper.

## 6. Regla para usar resultados históricos

Los resultados históricos no se eliminan: son parte de la trazabilidad. Sin embargo:

- **no** pueden ser fuente de cifras topológicas vigentes si terminan en 105 componentes;
- **no** pueden mezclarse con resultados cuyo `G0` efectivo termina en 107 componentes al completar la misma cartera;
- sólo pueden conservarse como historia del proceso de depuración o para explicar por qué se efectuó una corrección.

## 7. Estado de cierre

Esta auditoría sólo se considera cerrada cuando:

1. los tres workflows secundarios terminan satisfactoriamente;
2. sus salidas quedan persistidas en `main`;
3. se sustituyen las cifras afectadas del manuscrito;
4. suplemento, README de paper y cursor utilizan las mismas cifras;
5. se vuelve a exportar el manuscrito y se comprueba el límite editorial;
6. se congela el commit/release reproducible del paper.

Hasta entonces, los resultados autoritativos de **12 escenarios, saturación, Pareto, Population-first y OD-first** permanecen utilizables; los números específicos de **§7.1, §7.4 y §7.5** están bajo revalidación computacional.