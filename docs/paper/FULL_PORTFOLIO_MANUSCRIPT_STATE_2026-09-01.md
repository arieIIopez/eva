# Paper EDTR · estado del manuscrito tras experimento de cartera completa

Fecha: 2026-09-01

## Manuscrito

Título vigente: **Evaluación de trayectorias de implementación en redes de transporte: método EVA para la secuenciación dependiente del estado**.

Google Doc nativo:
- ID: `1d4W7EdCoJDnU1rHB7Z4Y9wy-cU4JnjcaswqS5RtZUIs`
- Título: `EDTR - Evaluación de trayectorias de implementación en redes de transporte - Método EVA`

Copia DOCX de envío con ecuaciones matemáticas nativas construidas desde LaTeX:
- Drive ID: `18NAF9OKgTz97wPlrESI3aRT7RzXiVmRN`
- Nombre: `EDTR - EVA - manuscrito cartera completa RMC Balanceado Logit - LaTeX.docx`
- QA visual: 19 páginas, dentro del máximo EDTR de 20 páginas.
- Las ecuaciones (1)–(10), incluidas (3a–b) y (4a–c), están almacenadas como objetos matemáticos Word/OMML; Google Docs degrada esas ecuaciones a texto al exportar, por lo que la copia DOCX es la versión de envío que preserva la notación matemática.

## Experimento principal

Universo modelado: 133 proyectos.
Conjunto factible: 124 proyectos, 88 Comunales + 36 Intercomunales. Los 9 MET quedan fuera de competencia y normalización.

Escenarios W principales:
1. Ponderación RMC.
2. Balanceado.
3. Logit (Biogeme), alias del escenario EVA `ciclistas_biogeme`.

Condiciones comunes:
- normalización fija en G0 sobre los 124 proyectos elegibles;
- misma red base;
- misma estrategia topológica y parámetros técnicos;
- los tres escenarios ejecutan los 124 proyectos completos.

Invariantes finales:
- costo: 43.887 MCLP en los tres escenarios;
- componentes finales: 105 en los tres escenarios;
- mismo conjunto físico final.

Resultados reproducibles: `results/paper-full-portfolio-scenarios/`.
Workflow: `.github/workflows/paper-full-portfolio-scenarios.yml`.
Merge a `main`: commit `685411eccb684ab5af518c400417a66f767688cd`.

## Resultados centrales

### Dependencia del estado bajo los tres W

Estático G0 vs secuencia completa:
- RMC: Spearman 0,707; Kendall 0,533; desplazamiento medio 20,50; máximo 75; Jaccard Top-30 0,463.
- Balanceado: Spearman 0,739; Kendall 0,560; desplazamiento medio 18,79; máximo 70; Jaccard Top-30 0,463.
- Logit: Spearman 0,862; Kendall 0,688; desplazamiento medio 13,44; máximo 58; Jaccard Top-30 0,667.
- La primera divergencia aparece en el paso 2 en los tres escenarios.

Conclusión: la dependencia del estado no es un artefacto de RMC; W modula su magnitud y momento.

### Diferencias entre trayectorias

- RMC vs Balanceado: Spearman 0,944; Kendall 0,859; desplazamiento medio 6,24; Jaccard Top-10 0,818; Top-30 0,875.
- RMC vs Logit: Spearman 0,929; Kendall 0,781; desplazamiento medio 9,31; Jaccard Top-10 0,429; Top-30 0,622.
- Balanceado vs Logit: Spearman 0,944; Kendall 0,802; desplazamiento medio 8,76; Jaccard Top-10 0,538; Top-30 0,622.

Núcleo robusto Top-10 en los tres W: `C068`, `I11`, `I12`, `I16`, `I22`, `I26`.

### Desempeño estructural

- RMC: 111,83 componentes medios; reducción integrada 3.617.
- Balanceado: 110,73 componentes medios; reducción integrada 3.753.
- Logit: 111,62 componentes medios; reducción integrada 3.643.

Balanceado produce la menor fragmentación media y la mayor reducción integrada durante la implementación, aunque los tres convergen al mismo estado final.

Los checkpoints de presupuesto muestran trade-offs: RMC adelanta población/demanda en etapas iniciales, Logit adelanta ciclistas inducidos en varias etapas tempranas y Balanceado reduce antes la fragmentación en buena parte del horizonte. No existe dominancia de Pareto.

### Evaluación cruzada y límite de la heurística voraz

Cada una de las tres trayectorias fue reevaluada bajo los tres W. Entre las tres secuencias generadas, la trayectoria Balanceada obtiene el mayor valor acumulado bajo los tres evaluadores:
- evaluador RMC: Balanceado 44,969; RMC 44,709; Logit 44,609;
- evaluador Balanceado: Balanceado 39,300; RMC 39,016; Logit 38,818;
- evaluador Logit: Balanceado 35,712; RMC 35,517; Logit 35,384.

Interpretación correcta: esto **no** prueba que Balanceado sea globalmente óptimo ni universalmente superior. Demuestra que la heurística voraz de EVA, que maximiza el valor contemporáneo en cada paso, no garantiza maximizar la suma acumulada en el horizonte incluso bajo su propio W. Es una oportunidad explícita para comparar a futuro EVA-greedy con look-ahead, programación dinámica u optimización global.

## Diagnóstico complementario de interacciones

El experimento RMC de 30 pasos se conserva como diagnóstico secundario de complementariedad/sustitución y dependencia del estado de `I_t(i,j)`:
- 3.255 efectos dirigidos;
- 421 positivos, 179 negativos, 2.655 nulos;
- C049: rank 48 → 4 tras I26 y luego → 64 tras I11, evidencia de interacción dependiente del estado.

No presentar este Top-30 como experimento principal del paper.

## Lectura científica del paper

La contribución se formula como evaluación explícita de la trayectoria de implementación de una cartera ya definida:

`G0 -> G1 -> ... -> GH`

El plan maestro no queda completamente descrito por condición base y horizonte final. EVA permite observar cómo el orden, las preferencias W y las interacciones modifican los estados intermedios y el valor marginal de lo restante.

EVA no reemplaza evaluación social, no produce fechas/calendario y no garantiza óptimo global. Su valor es hacer explícita, trazable y reevaluable la secuencia de implementación.
