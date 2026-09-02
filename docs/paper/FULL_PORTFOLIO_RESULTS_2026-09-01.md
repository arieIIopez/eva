# Resultados EDTR — cartera completa C/I bajo RMC, Balanceado y Logit

Fecha de corrida: 2026-09-01
Workflow run: `33570254776`

## Diseño validado

El experimento ejecuta secuencialmente la totalidad de `P^f=124` proyectos elegibles (88 Comunales + 36 Intercomunales) bajo tres configuraciones W existentes de EVA: `ponderacion_rmc`, `balanceado` y `ciclistas_biogeme`, reportado como Logit (Biogeme). La normalización se fija en G0 sobre los mismos 124 proyectos; la raíz es Alameda (`tau=100 m`, `alpha=0.5`). Los 9 proyectos MET permanecen modelados pero no compiten ni definen máximos de normalización.

Los invariantes se cumplieron: las tres secuencias ejecutan los mismos 124 proyectos, acumulan el mismo costo final de **43.887 MCLP** y convergen a **105 componentes de red**. La variable de interés es, por tanto, la trayectoria.

## 1. Dependencia del estado dentro de cada W

Comparación del ranking estático G0 con la secuencia completa reevaluada:

| W | Spearman | Kendall | Desplazamiento medio | Máximo | Jaccard Top-10 | Top-30 |
|---|---:|---:|---:|---:|---:|---:|
| RMC | 0,7072 | 0,5329 | 20,50 | 75 | 0,5385 | 0,4634 |
| Balanceado | 0,7393 | 0,5605 | 18,79 | 70 | 0,5385 | 0,4634 |
| Logit (Biogeme) | 0,8625 | 0,6882 | 13,44 | 58 | 0,4286 | 0,6667 |

En los tres escenarios la primera divergencia aparece en el paso 2. La dependencia del estado no es, por tanto, un artefacto exclusivo de RMC.

## 2. Diferencias entre las tres trayectorias completas

| Par | Spearman | Kendall | Desplazamiento medio | Jaccard Top-10 | Top-30 |
|---|---:|---:|---:|---:|---:|
| RMC–Balanceado | 0,9445 | 0,8586 | 6,24 | 0,8182 | 0,8750 |
| RMC–Logit | 0,9288 | 0,7808 | 9,31 | 0,4286 | 0,6216 |
| Balanceado–Logit | 0,9436 | 0,8020 | 8,76 | 0,5385 | 0,6216 |

Las preferencias W modifican principalmente las primeras etapas. La diferencia temprana más marcada es RMC–Logit; todos los Jaccard convergen a 1 al completar los 124 proyectos.

## 3. Desempeño estructural de la trayectoria completa

| W | Componentes medios | Reducción integrada de componentes |
|---|---:|---:|
| RMC | 111,83 | 3.617 |
| Balanceado | **110,73** | **3.753** |
| Logit | 111,62 | 3.643 |

Balanceado reduce antes la fragmentación de la red en esta aplicación. Esto no implica optimalidad global ni superioridad normativa universal.

## 4. Presupuesto equivalente e intercambios entre objetivos

- Al 10% del costo total, RMC adelanta mayor población marginal y demanda habilitada; Logit adelanta ciclistas inducidos.
- Al 20%, Balanceado alcanza 126 componentes, RMC 128 y Logit 130; Balanceado registra además la mayor demanda habilitada en ese corte, mientras Logit mantiene la mayor acumulación de ciclistas inducidos.
- Al 70%, Balanceado alcanza 106 componentes frente a 110 en RMC y Logit; Logit registra la mayor acumulación de ciclistas inducidos.
- Al 90%, Balanceado y Logit ya alcanzan los 105 componentes finales; Logit registra en ese corte la mayor población marginal, demanda y ciclistas acumulados.

No existe dominancia de Pareto: los tres W adelantan objetivos distintos en diferentes momentos.

## 5. Evaluación cruzada 3×3

Cada trayectoria se evalúa ex post bajo los tres vectores W para evitar comparar directamente puntajes propios de funciones normativas diferentes.

| Evaluador | Trayectoria RMC | Trayectoria Balanceada | Trayectoria Logit |
|---|---:|---:|---:|
| RMC | 44,7088 | **44,9694** | 44,6091 |
| Balanceado | 39,0162 | **39,2996** | 38,8177 |
| Logit | 35,5166 | **35,7118** | 35,3844 |

La trayectoria Balanceada obtiene el mayor valor acumulado bajo los tres evaluadores, pero las brechas respecto del mejor valor son pequeñas (todas <1,23%). **No debe interpretarse como prueba de que Balanceado sea globalmente óptimo.** El hallazgo demuestra que la regla voraz de EVA es miope: seleccionar el máximo S_t en cada etapa no garantiza maximizar la suma de horizonte bajo el mismo W. Esto motiva una extensión futura con look-ahead, programación dinámica u optimización global.

## 6. Núcleo robusto temprano

Seis proyectos aparecen en el Top-10 de las tres secuencias: `C068`, `I11`, `I12`, `I16`, `I22` e `I26`. Otros cuatro (`C066`, `C067`, `I19`, `I30`) aparecen en dos de tres escenarios. El núcleo robusto permite distinguir prioridades tempranas relativamente insensibles a W de intervenciones cuya posición depende de la preferencia normativa.

## 7. Diagnóstico complementario de interacciones

El experimento RMC reducido a 30 intervenciones se conserva exclusivamente como diagnóstico de I_t(i,j): 3.255 efectos dirigidos, 421 positivos, 179 negativos y 2.655 nulos; media absoluta 0,00471. C049 pasa de posición 48 a 4 después de I26 y vuelve a 64 tras I11, evidencia de que las interacciones son dependientes del estado y no deben modelarse necesariamente como coeficientes bilaterales fijos.

## Archivos reproducibles

El código de corrida está en:

- `experiments/paper-full-portfolio-scenarios.js`
- `experiments/runner-full-portfolio-scenarios.html`
- `scripts/run-paper-full-portfolio-scenarios.mjs`
- `.github/workflows/paper-full-portfolio-scenarios.yml`

Los CSV persistidos bajo `results/paper-full-portfolio-scenarios/` contienen los resúmenes, comparaciones de orden, checkpoints presupuestarios, matriz de evaluación cruzada y núcleo robusto. El workflow puede regenerar las secuencias completas de 124 proyectos.
