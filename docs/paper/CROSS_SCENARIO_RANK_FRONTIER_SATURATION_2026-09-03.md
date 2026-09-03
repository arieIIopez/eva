# Posición, frontera de beneficios y saturación en 12 escenarios EVA

Fecha: 2026-09-03

Este documento fija la interpretación metodológica y los resultados que alimentan la versión EDTR del paper EVA. La evidencia proviene de la corrida reproducible de los 124 proyectos comunales/intercomunales bajo las doce configuraciones predefinidas de EVA, con normalización fija en G0 y el mismo conjunto final.

## 1. Qué se compara

Los doce escenarios son:

1. Ponderación RMC
2. Balanceado
3. Equidad territorial
4. Demanda potencial
5. Ciclistas inducidos (Biogeme / Logit)
6. Red dendrítica Alameda (fractal)
7. Continuidad de red
8. Eficiencia presupuestaria
9. Educación superior
10. Integración metropolitana
11. Seguridad vial
12. Intermodalidad bici-metro

Cada escenario ejecuta los mismos 124 proyectos. El estado final común alcanza 600.177 personas cubiertas, 105 componentes de red y 43.887 MCLP. Por ello las diferencias de posición y beneficio acumulado corresponden a la trayectoria, no a la composición final.

## 2. Posición de cada ciclovía

La salida autoritativa es `results/paper-all-scenarios-benefits/project_rank_matrix_12_scenarios.csv` y debe contener la posición secuencial de cada proyecto bajo cada W, junto con su ranking inicial G0.

Hallazgos agregados:

- 90 de 124 proyectos cambian más de 20 posiciones entre escenarios.
- 37 cambian más de 50.
- 17 cambian más de 75.
- 4 cambian más de 100.
- I12 Las Rejas-Suiza-Departamental permanece Top-10 en 12/12 escenarios y se mueve sólo entre las posiciones 1 y 10.
- I26 San Pablo es Top-10 en 11/12.
- I16 Matta-Vespucio Norte, I30 Walker-Hualle-Aguirre y C068 San Carlos son Top-10 en 10/12.
- I14 Lo Ovalle es el ejemplo extremo: posición 4 a 124 según W.

Esto permite distinguir **prioridad robusta** de **prioridad altamente dependiente de la política W**.

## 3. La prioridad cambia también porque cambia el beneficio marginal

La variación de posición no es sólo un efecto aritmético de cambiar W. El orden conduce al mismo proyecto a estados de red diferentes y modifica sus resultados marginales observados.

Ejemplos entre las doce trayectorias:

- I14 Lo Ovalle: 0-45.894 personas marginales; 0-70.565 viajes OD habilitados.
- I25 San Francisco: 7.590-29.567 personas; 5.804-109.712 viajes.
- EP-I10 Gran Avenida: 5.817-143.789 viajes OD habilitados.
- I20 PAC-Lo Espejo-El Bosque: 22.368-45.106 personas.
- C068 San Carlos: 13.595-35.574 personas; 7.940-75.675 viajes.

Por tanto `r_i(W)` refleja simultáneamente preferencias y estados `G_t` distintos.

## 4. Captura temprana de beneficios comunes

Resultados principales:

### Población marginal

- Educación superior: `I_P = 0,886884`, mejor captura temprana de población.
- Demanda potencial: `I_P = 0,872660`.
- Balanceado: `I_P = 0,871200`.
- RMC: `I_P = 0,865751`.

### Conexión funcional OD

- Demanda potencial: `I_D = 0,912585`, mejor captura temprana de conexión OD.
- Integración metropolitana: `I_D = 0,909276`.
- Continuidad de red: `I_D = 0,907201`.
- Balanceado: `I_D = 0,904689`.
- Educación superior: `I_D = 0,904516`.

### Consolidación topológica

La reducción de componentes se analiza separadamente porque puede ser no monótona: una intervención puede crear temporalmente un componente aislado antes de conectarlo.

- Continuidad de red: `I_C = 0,876568`, mayor captura temprana de reducción de componentes.
- Integración metropolitana: `I_C = 0,851927`.
- Demanda potencial: `I_C = 0,843862`.

## 5. Frontera población-conexión

En el plano bidimensional `(I_P, I_D)`, la frontera de Pareto contiene únicamente:

- **Educación superior**: maximiza la captura temprana de población.
- **Demanda potencial**: maximiza la captura temprana de conexión OD.

Los otros diez escenarios son dominados en este plano de dos objetivos, pero no deben calificarse como universalmente inferiores porque pueden privilegiar seguridad, equidad, topología u otros resultados.

Al agregar la dimensión topológica, la frontera tridimensional incorpora además:

- Integración metropolitana.
- Continuidad de red.

Interpretación: no existe un W universalmente dominante; existe una **frontera de compromisos** condicionada al resultado público que se desea adelantar.

## 6. Saturación práctica conjunta población + OD

Para evitar introducir un nuevo vector de pesos, se normalizan los dos resultados monotónicos:

`C_P,W(t) = P_t / P_H`

`C_D,W(t) = D_t / D_H`

Se define una captura conjunta conservadora:

`C_PD,W(t) = min(C_P,W(t), C_D,W(t))`

Así ambos objetivos deben haber alcanzado al menos la proporción declarada. La saturación práctica a umbral `gamma` es:

`t_W^(gamma) = min { t : C_PD,W(t) >= gamma }`

Para `gamma = 0,95`:

| Escenario | 90% | 95% | 99% |
|---|---:|---:|---:|
| Educación superior | 34 | 44 | 117 |
| Integración metropolitana | 37 | 44 | 118 |
| Balanceado | 35 | 47 | 118 |
| Demanda potencial | 36 | 48 | 118 |
| Seguridad vial | 37 | 51 | 116 |
| Intermodalidad bici-metro | 37 | 53 | 118 |
| Continuidad de red | 40 | 57 | 120 |
| Ponderación RMC | 38 | 59 | 120 |
| Ciclistas inducidos / Logit | 39 | 70 | 119 |
| Equidad territorial | 38 | 75 | 116 |
| Eficiencia presupuestaria | 47 | 77 | 122 |
| Dendrítica Alameda | 42 | 107 | 123 |

El salto desde 95% hasta 99% es grande en todos los escenarios: la cola final requiere aproximadamente 116-123 proyectos. Esto es evidencia de **rendimientos decrecientes**, no de beneficio marginal exactamente nulo.

## 7. Suficiencia exacta no es lo mismo que saturación práctica

El paper debe mantener esta distinción:

- **Population-first:** suficiencia exacta poblacional en `t*_P = 42`; 82 proyectos permanecen; no existe nueva cobertura directa ni habilitada a un paso.
- **OD-first:** suficiencia funcional en `t*_D = 52`; 72 proyectos permanecen; 871.510 de 871.511 viajes OD/día de referencia quedan habilitados; no existe nueva habilitación directa ni a un paso bajo la precisión utilizada.
- **Saturación práctica 95%:** umbral descriptivo para comparar escenarios multicriterio; no autoriza declarar innecesarios los proyectos restantes.
- **Conectividad topológica:** debe mantenerse separada de la curva conjunta población-OD por su posible no monotonicidad. Una prueba Connectivity-first exacta debe documentarse sólo cuando su corrida reproducible quede persistida.

Que `t*_D > t*_P` es sustantivo: agotar nueva cobertura poblacional no equivale a agotar los beneficios de conexión de red.

## 8. Figuras en el manuscrito EDTR

La versión de trabajo del Google Doc incorpora:

- **Figura 2:** saturación práctica conjunta de población y conexión OD bajo los doce escenarios.
- **Figura 4:** rango mínimo-máximo y posición media de los proyectos más sensibles a W.
- **Figura 5:** frontera de compromiso población-conexión para los doce escenarios.

La matriz completa 124 x 12 debe permanecer como dato reproducible/suplementario, no como figura principal por razones de legibilidad.

## 9. Reproducibilidad

Experimento base:

- `experiments/paper-all-scenarios-benefits.js`
- `scripts/run-paper-all-scenarios-benefits.mjs`
- `.github/workflows/paper-all-scenarios-benefits.yml`

Postproceso:

- `scripts/analyze-paper-all-scenarios.py`
- `scripts/analyze-saturation-population-od.py`

Resultados esperados en:

- `results/paper-all-scenarios-benefits/`

El workflow se configuró para publicar automáticamente la matriz de rangos, productos de frontera y curva/umbrales de saturación en `main` después de una corrida exitosa.
