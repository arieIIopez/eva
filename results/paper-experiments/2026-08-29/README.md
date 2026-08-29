# Resultados reproducibles del paper

Corrida científica ejecutada sobre el commit `ecf0dc90060b8d50fd77ef4ac67e4f1be8473f71`.

- Fecha de generación: 2026-08-29T05:17:30.914Z
- Motor: 3.13.0
- Metodología: 2.4.0
- Datos: 2026.08
- Proyectos: 133
- Red existente: 601 ejes
- Hexágonos OD: 1.589
- GitHub Actions run: 33235782752
- Artifact original: 9710220048 (`eva-paper-experiments`)
- SHA-256 del artifact ZIP: `94f7069f655cda1472e7ab0ec6de09e40e411ef2d2a8dab94972c0683847933a`

## Contraste principal

La prueba principal fija las escalas de normalización en G0 para aislar cambios producidos por el estado de red de cambios mecánicos en los denominadores de normalización. Para k=30, ranking estático y secuencia estado-dependiente presentan Jaccard Top-k=0,500; Spearman=0,7584; Kendall tau=0,5586; desplazamiento medio=13,7 posiciones y 20 proyectos comunes.

## Normalización operacional

La secuencia fixed-G0 y la secuencia operacional coinciden completamente en Top-10 y Top-20. Para k=30 presentan Jaccard=0,8182, Spearman=0,9666, Kendall tau=0,8746 y 27 proyectos comunes.

## Interacción y efecto de orden

Sobre los 20 proyectos de mayor puntuación inicial se evaluaron 190 pares no ordenados y 380 interacciones dirigidas. La interacción media absoluta es C=0,013726. El 33,16% de las interacciones satisface |I|>=0,01. El mayor |Delta_ord| observado es 0,087022 para MET-L04 <-> I22.

## Sensibilidad topológica

Las seis raíces ensayadas producen el mismo Top-10 que Alameda. Las 16 combinaciones tau x alpha también producen el mismo Top-10 bajo el escenario dendrítico multicriterio. Este resultado nulo corresponde a la profundidad y especificación ensayadas y no demuestra invariancia general de la estrategia topológica.

## Sensibilidad a preferencias

Bajo los 12 escenarios W, MET-L02, MET-L03 y MET-L04 aparecen en Top-10 en 12/12 corridas. I16, I26, MET-L05, MET-L06 y MET-L09 aparecen en 11/12; MET-L01 y MET-L07 en 10/12. Equidad territorial y eficiencia presupuestaria presentan Jaccard Top-10=0,4286 respecto de Balanceado.

Los CSV adjuntos conservan las métricas utilizadas en el manuscrito. El artifact completo puede regenerarse ejecutando el workflow de experimentos sobre el commit indicado.