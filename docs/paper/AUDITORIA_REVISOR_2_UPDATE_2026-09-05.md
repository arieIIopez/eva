# Actualización auditoría científica tipo Revisor 2 — 2026-09-05

Este documento complementa `AUDITORIA_REVISOR_2_2026-09-04.md` y registra el cierre de las corridas corregidas y un nuevo hallazgo en el contraste depth-2.

## Estado de control

- Universo modelado: 133 proyectos.
- Conjunto factible científico: 124 proyectos Comunales + Intercomunales.
- Red existente fuente: 601 ejes.
- Red efectiva `G0` (`perfil=general`): 576 ejes.
- Componentes en `G0`: 142.
- Estado final de la cartera completa corregida: 107 componentes.
- Reducción final común: 35 componentes.
- Ganancia final de acceso: 600.177 ocupados modelados respecto de `G0`.
- Costo proxy final: 43.887 MCLP.
- Motor experimental: 3.13.0; metodología experimental: 2.4.0. **Aún no existe release pública v3.13.0.**

## Cierres desde la auditoría del 4 de septiembre

### R2-01 — trayectoria e interacciones: CERRADO

La corrida corregida de `paper-plan-trajectory` quedó persistida en `main` mediante el commit:

`d9a9a824a5a7f3bf83362d8a4cae4ec4a7ab60cf`

El runner aplica `effective-network.js`. Los valores utilizados en §7.4 se mantienen después de la corrección:

- 3.255 efectos dirigidos en las primeras 30 intervenciones RMC;
- 421 positivos, 179 negativos y 2.655 nulos;
- media absoluta `|I| = 0,004711`;
- I26→C049: `+0,231691`, puntuación 0,329→0,561, rango 48→4;
- I30→C067: `+0,226038`, rango aproximadamente 50→3;
- C068→C006: señal negativa de aproximadamente `-0,263`;
- I10→I14: reducción cercana a `0,151`;
- C049 pierde posteriormente la ventaja después de I11, confirmando dependencia del estado y no un coeficiente bilateral fijo.

Por tanto, §7.4 puede volver a considerarse autoritativo bajo la red efectiva común.

### R2-03 — tres escenarios completos / §7.1: CERRADO

La corrida corregida quedó persistida en:

`5c030c1a388eb124e8faef3e8e2aa9889e192acc`

Todos los escenarios RMC, Balanceado y Ciclistas terminan en 107 componentes. El contraste estático versus secuencial corregido es:

| Escenario | Spearman | Kendall | desplazamiento medio | Jaccard Top-30 | primera divergencia |
|---|---:|---:|---:|---:|---:|
| RMC | 0,70866 | 0,53396 | 20,61 | 0,463 | 2 |
| Balanceado | 0,74086 | 0,55966 | 19,00 | 0,463 | 2 |
| Ciclistas/Logit | 0,86348 | 0,68975 | 13,39 | 0,667 | 2 |

El manuscrito vivo fue actualizado el 2026-09-05 a valores redondeados 0,709/0,534; 0,741/0,560; 0,863/0,690.

## Nuevo hallazgo crítico: baseline histórico del rollout depth-2

La nueva corrida depth-2 del 4 de septiembre sí utilizó la red efectiva y terminó en 107 componentes, pero `results/paper-lookahead-depth2/baseline-greedy.json` seguía apuntando a una corrida greedy histórica que terminaba en **105 componentes**. Por tanto, los archivos de comparación `greedy_vs_depth2.csv` y `depth2_improvements.csv` de esa corrida mezclaban dos definiciones distintas de `G0` y **no son válidos como evidencia para §7.5**.

Esto invalida específicamente los porcentajes históricos de cambio de `A_P` que figuraban en el manuscrito (`−0,14%`, `−0,15%`, `+0,11%`). Esos porcentajes fueron retirados temporalmente del Google Doc y de la copia nativa con LaTeX.

### Corrección de código aplicada

Commit:

`ed758343f29e83cdecc22b6f2e8ca6404d200a6a`

`scripts/run-paper-lookahead-depth2.mjs` ahora:

1. reconstruye el baseline greedy directamente desde `results/paper-full-portfolio-scenarios/summary.json`;
2. verifica los invariantes de la cartera completa;
3. falla si greedy y depth-2 no terminan con el mismo número de componentes;
4. calcula áreas de trayectoria de población, OD y ciclistas a partir de los acumulados por etapa;
5. exporta `public_trajectory_areas.csv`;
6. deja trazado el archivo y commit de origen del baseline.

El workflow fue actualizado en:

`15587a75b9b60f6fa9721fb97f337a54adb86509`

Ahora se vuelve a ejecutar cuando cambia el `summary.json` autoritativo de la cartera completa y evita usar un baseline congelado fuera de sincronía.

### R2-02 / §7.5 — estado actual

**Código corregido; nueva corrida en ejecución al corte de este documento.**

Hasta que la salida nueva quede persistida en `main`, §7.5 sólo conserva la conclusión metodológica no numérica: el score decisional `S_t` y un resultado público de trayectoria no deben tratarse como el mismo objetivo. Los porcentajes concretos del rollout permanecen suspendidos.

## Cambios editoriales aplicados el 2026-09-05

Se actualizaron tanto el Google Doc principal como su copia nativa con ecuaciones LaTeX:

1. §7.1 con los valores corregidos de Spearman, Kendall y desplazamiento medio;
2. §6.7 con las rutas reproducibles actuales (`paper-full-portfolio-scenarios`, `paper-all-scenarios-benefits`, `paper-population-first-only`, `paper-od-first-only`, `paper-lookahead-depth2`, `paper-plan-trajectory`, `paper-experiments`);
3. §7.5 retirando los porcentajes depth-2 producidos contra el baseline antiguo.

## Regla de autoridad desde este corte

- Resultados de 12 escenarios, Pareto, saturación, Population-first y OD-first: autoritativos con las correcciones topológicas ya documentadas.
- §7.1: autoritativo con `5c030c1a...`.
- §7.4: autoritativo con `d9a9a824...`.
- §7.5: **pendiente únicamente de la nueva comparación greedy↔depth-2 con baseline 142→107**.
- Cualquier archivo histórico que termine en 105 componentes se considera trazabilidad histórica y no fuente vigente para resultados topológicos o comparaciones de trayectoria.

## Deudas restantes antes del cierre editorial

1. cerrar la nueva corrida depth-2 y actualizar §7.5 con sus valores efectivos;
2. consolidar `src/methodology-corrections.jsx` dentro de `src/metodologia.jsx` y `src/scenarios.jsx`, luego retirar la capa de compatibilidad;
3. rerun CI después de esa consolidación;
4. congelar un commit científico único del paper antes de cualquier eventual release v3.13.0;
5. reexportar el manuscrito y verificar el límite de 20 páginas;
6. generar el DOCX final con ecuaciones Word/OMML y hacer QA visual página por página.
