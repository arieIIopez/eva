# Experimento correctivo EDTR — RMC + universo priorizable C/I

Generado: 2026-09-01T16:15:17.087Z

## Diseño

- Escenario principal: Ponderación RMC.
- Elegibles: Comunal + Intercomunal.
- Excluidos del ranking y de la referencia de normalización: Metropolitano (MET).
- Proyectos totales: 133; elegibles: 124; excluidos: 9.

## Dependencia de estado

- k=10: Jaccard=0.538, Spearman=0.806, Kendall=0.644, desplazamiento medio=6.60.
- k=20: Jaccard=0.538, Spearman=0.656, Kendall=0.526, desplazamiento medio=9.35.
- k=30: Jaccard=0.463, Spearman=0.761, Kendall=0.600, desplazamiento medio=16.60.

## Interacciones

K medio absoluto=0.009281; Q(0.01)=0.155; positivas=205; negativas=175.
Mayor |Δ_ord|=0.067102: I12 ↔ I15.

## Sensibilidad

- Balanceado vs RMC, Top-10 C/I: Jaccard=0.818.
- Mínimo Jaccard Top-10 entre raíces vs raíz por defecto: 0.333.
- Núcleo robusto Top-10 (frecuencia >=0,8): raíces=5, tau×alpha=8, escenarios W=5.

## Diseño factorial 2×2

- Cambio total Balanceado+todos → RMC+C/I, k=5: Jaccard=0.000, Spearman=-0.200, desplazamiento medio=12.80.
- Cambio total Balanceado+todos → RMC+C/I, k=10: Jaccard=0.111, Spearman=-0.067, desplazamiento medio=9.70.
- Cambio total Balanceado+todos → RMC+C/I, k=20: Jaccard=0.333, Spearman=0.588, desplazamiento medio=9.90.
- Cambio total Balanceado+todos → RMC+C/I, k=30: Jaccard=0.395, Spearman=0.875, desplazamiento medio=13.03.

## Interpretación para el manuscrito EDTR

El cambio dominante proviene de la definición del conjunto factible, no de sustituir Balanceado por RMC. Con todos los proyectos, Balanceado y RMC tienen el mismo Top-10 (Jaccard=1,000); al restringir la cartera a proyectos comunales e intercomunales, el cambio de escenario produce Jaccard=0,818 en Top-10. En cambio, excluir MET altera radicalmente las primeras posiciones: bajo RMC, `rmc_all` versus `rmc_eligible` tiene Jaccard=0,111 en Top-10.

La dependencia de estado se mantiene y se hace más visible en el universo correcto: el ordenamiento estático y la secuencia con normalización fija comparten 19 de los primeros 30 proyectos (Jaccard=0,463), con desplazamiento medio de 16,6 posiciones. La interacción media absoluta baja respecto de la corrida anterior, pero persiste la no conmutatividad decisional (K=0,00928; Q(0,01)=0,155; máximo |Δ_ord|=0,06710).

La conclusión previa de invariancia topológica ya no se sostiene. Bajo el escenario dendrítico y universo C/I, cuatro de las seis raíces contrastadas presentan Jaccard Top-10=0,333 respecto de Alameda. Para tau×alpha, tau no altera el Top-10 dentro de 50–150 m, mientras alpha sí: el solapamiento respecto de alpha=0,35 cae hasta Jaccard=0,667 para alpha=0,80. Por ello H2 debe reformularse y, con esta especificación, recibe apoyo.

La sensibilidad normativa también aumenta: sólo cinco proyectos aparecen en Top-10 con frecuencia >=0,80 entre los doce escenarios W. El paper debe abandonar la afirmación de que la variación de W domina a la estrategia topológica en las primeras diez posiciones; con el universo corregido, ambas dimensiones son sustantivas y la elección de raíz puede producir una divergencia incluso mayor.
