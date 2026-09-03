# EVA · 12 escenarios: posiciones, beneficios y suficiencia

Fecha de consolidación: 2026-09-02/03.

## Propósito

Este experimento responde a una extensión del artículo EDTR: evaluar la posición que toma cada ciclovía bajo todos los escenarios predefinidos de EVA y comparar cómo cada trayectoria adelanta distintos beneficios públicos. La comparación se hace sobre el mismo conjunto factible de 124 proyectos Comunales + Intercomunales, con normalización fija en G0 y la misma configuración topológica. Como todas las corridas ejecutan la cartera completa, el estado final converge y el objeto científico es la trayectoria.

Workflow reproducible: `.github/workflows/paper-all-scenarios-benefits.yml`.
Run exitoso: `33699031270`.
Artifact: `9874927203` (`eva-paper-all-scenarios-benefits`).

## Escenarios predefinidos

1. Ponderación RMC
2. Balanceado
3. Equidad territorial
4. Demanda potencial
5. Ciclistas inducidos (Biogeme)
6. Red dendrítica Alameda (fractal)
7. Continuidad de red
8. Eficiencia presupuestaria
9. Educación superior
10. Integración metropolitana
11. Seguridad vial
12. Intermodalidad bici-metro

## Invariantes del experimento

- Proyectos elegibles por escenario: 124.
- Población final potencialmente beneficiada: 600.177 personas en todos los escenarios.
- Componentes finales: 105 en todos los escenarios, desde 141 iniciales (reducción total = 36).
- Costo final: 43.887 MCLP en todos los escenarios.
- Demanda OD final habilitada: aproximadamente 871,5 mil viajes/día; existen diferencias de 1–4 viajes entre corridas por dependencia de trayectoria/precisión del cálculo.

Por tanto, las diferencias no corresponden al conjunto final, sino a **cuándo** se capturan los beneficios.

## 1. Posición de cada ciclovía según escenario

El archivo generado `project_rank_matrix_12_scenarios.csv` contiene para cada uno de los 124 proyectos su posición secuencial bajo los 12 escenarios, además de posición mínima, máxima, rango, media, mediana, desviación estándar y frecuencia de aparición en Top-10, Top-20 y Top-30.

### Núcleo robusto temprano

- **I12 Las Rejas–Suiza–Departamental**: posiciones 1–10; Top-10 en 12/12 escenarios; posición media 2,42.
- **I26 San Pablo**: posiciones 1–19; Top-10 en 11/12; media 4,75.
- **I16 Matta–Vespucio Norte**: posiciones 2–12; Top-10 en 10/12; media 6,58.
- **I30 Walker–Hualle–Aguirre**: posiciones 3–14; Top-10 en 10/12; media 7,42.
- **C068 San Carlos**: posiciones 5–28; Top-10 en 10/12; media 10,17.
- C066 Cuatro Poniente, I11 José Joaquín Pérez e I22 Pedro Fontova aparecen en Top-10 en 8/12 escenarios.

Sólo I12 permanece Top-10 en los doce escenarios. Catorce proyectos permanecen Top-30 en 12/12 escenarios.

### Prioridad altamente dependiente de W

- **I14 Lo Ovalle**: posición 4–124; rango 120. Secuencia: RMC 48, Balanceado 11, Equidad 5, Demanda 12, Logit 4, Dendrítica 7, Continuidad 56, Eficiencia 124, Educación 8, Integración 66, Seguridad 9, Intermodal 70.
- **I08 General Oscar Bonilla**: rango 111 (5–116).
- **I25 San Francisco**: rango 108 (5–113).
- **I05 Diagonal José María Caro**: rango 101.
- **C067 Cardenal Raúl Silva Henríquez**: rango 96 (4–100).
- **I19 PAC–Lo Espejo–San Bernardo**: rango 94 (4–98).
- **C049 Federico Errázuriz**: rango 87 (32–119).

En conjunto, 90 de 124 proyectos cambian más de 20 posiciones entre escenarios; 37 cambian más de 50; 17 cambian más de 75; y 4 cambian más de 100 posiciones. Esto muestra que la prioridad no es una propiedad intrínseca del proyecto: depende de W y del estado de la red en que el proyecto es evaluado.

## 2. El beneficio marginal del mismo proyecto también cambia

Como una misma ciclovía entra en estados G_t distintos según el escenario, no sólo cambia su posición: también puede cambiar el beneficio marginal que produce en el momento de ejecución.

Ejemplos de población marginal observada entre escenarios:

- I14 Lo Ovalle: 0–45.894 personas.
- I10 Gran Avenida: 3.242–38.695.
- I20 PAC–Lo Espejo–El Bosque: 22.368–45.106.
- C068 San Carlos: 13.595–35.574.
- I25 San Francisco: 7.590–29.567.
- I26 San Pablo: 17.407–38.151.
- I05 Diagonal José María Caro: 21–18.972.
- I19 PAC–Lo Espejo–San Bernardo: 2.119–20.704.
- I12 Las Rejas–Suiza–Departamental: 28.648–44.459.

Ejemplos de habilitación OD/demanda funcional:

- EP-I10 Gran Avenida: 5.817–143.789 viajes/día.
- I19 PAC–Lo Espejo–San Bernardo: 4.563–115.411.
- I25 San Francisco: 5.804–109.712.
- I22 Pedro Fontova: 35.847–84.453.
- C068 San Carlos: 7.940–75.675.
- I14 Lo Ovalle: 0–70.565.
- I11 José Joaquín Pérez: 20.732–68.671.
- I04 Del Ferrocarril: 33.320–68.501.
- I08 General Oscar Bonilla: 1.681–59.223.

La evidencia apoya una extensión de la tesis central del artículo:

> **No sólo la prioridad es dependiente del estado; el beneficio marginal del proyecto también puede serlo.**

## 3. Captura temprana de población

Índice I_P (área bajo la curva poblacional normalizada por el horizonte):

1. Educación superior: **0,886884**
2. Demanda potencial: **0,872660**
3. Balanceado: **0,871200**
4. RMC: **0,865751**
5. Integración metropolitana: 0,863948
6. Logit/Biogeme: 0,859210
7. Equidad territorial: 0,858556
8. Seguridad vial: 0,857545
9. Intermodalidad: 0,855566
10. Eficiencia presupuestaria: 0,852555
11. Continuidad de red: 0,850646
12. Dendrítica Alameda: 0,830616

Educación superior alcanza 95% de la población final en la etapa 44; Demanda en 48; Balanceado en 47; RMC en 59; Logit en 70; Dendrítica en 107.

## 4. Captura temprana de conexión funcional OD

Índice I_D:

1. Demanda potencial: **0,912585**
2. Integración metropolitana: **0,909276**
3. Continuidad de red: **0,907201**
4. Balanceado: **0,904689**
5. Educación superior: **0,904516**
6. Intermodalidad: 0,901414
7. RMC: 0,900703
8. Logit/Biogeme: 0,895630
9. Seguridad vial: 0,893623
10. Eficiencia presupuestaria: 0,890640
11. Dendrítica Alameda: 0,886235
12. Equidad territorial: 0,875812

Demanda e Integración alcanzan 95% de la habilitación OD en la etapa 35. Continuidad lo hace en 36, Educación en 37, RMC y Balanceado en 38.

## 5. Captura temprana de conectividad topológica

Índice basado en reducción acumulada de componentes:

1. Continuidad de red: **0,876568**
2. Integración metropolitana: **0,851927**
3. Demanda potencial: **0,843862**
4. Intermodalidad bici-metro: **0,842518**
5. Balanceado: **0,840726**
6. Seguridad vial: 0,828181
7. Educación superior: 0,819444
8. Dendrítica Alameda: 0,818772
9. Logit/Biogeme: 0,816084
10. RMC: 0,810260
11. Eficiencia presupuestaria: 0,800627
12. Equidad territorial: 0,786962

Continuidad alcanza 95% de la reducción final de componentes en la etapa 43, Integración en 52 y Balanceado en 57.

## 6. Frontera población–conexión funcional

La frontera de Pareto construida con A_P (persona-etapa) y A_D (viaje-etapa) contiene únicamente:

- **Educación superior**: mayor captura poblacional (I_P=0,886884) con I_D=0,904516.
- **Demanda potencial**: mayor captura funcional OD (I_D=0,912585) con I_P=0,872660.

Los restantes diez escenarios son dominados por al menos uno de estos dos en esta comparación bidimensional específica. Esto **no** significa que sean inferiores como políticas en sentido general: pueden privilegiar seguridad, equidad, costo, intermodalidad o topología, dimensiones que no están representadas en este plano.

## 7. Suficiencia estricta por objetivo

La comparación de escenarios completos muestra rendimientos decrecientes, pero no define por sí sola un punto de detención. Para identificar cuándo agregar proyectos deja de aumentar un objetivo se utilizan políticas monoobjetivo con detención endógena y habilitación de un paso.

### Población

`Population-first`:
- 42 proyectos ejecutados.
- 600.177 personas = 100% de la cobertura de referencia.
- 82 proyectos remanentes.
- No existe ganancia poblacional directa ni habilitada a un paso en el estado posterior.
- Hitos 50/75/90/95/99%: 8/15/23/28/35.
- Ningún proyecto cero fue necesario como habilitante antes de la detención.

### Conexión funcional OD

`OD-first`:
- 52 proyectos ejecutados.
- 871.510 viajes/día habilitados frente a referencia 871.511 (diferencia de un viaje por precisión/trayectoria).
- 72 proyectos remanentes.
- No existe nueva habilitación OD directa ni habilitada a un paso.
- Hitos 50/75/90/95/99%: 8/14/25/33/44.
- Ningún proyecto cero fue necesario como habilitante antes de la detención.

### Conectividad topológica

Se creó el experimento reproducible `Connectivity-first`, que maximiza reducción inmediata de componentes y, cuando la ganancia directa es nula, prueba exhaustivamente una habilitación de un paso antes de detenerse. Workflow: `.github/workflows/paper-connectivity-first-only.yml`. Run inicial: `33709922207`. El resultado debe incorporarse cuando finalice y sea verificado.

## 8. Implicación para el manuscrito EDTR

La sección empírica debería pasar de una comparación principal de tres W a una arquitectura de evidencia en cuatro niveles:

1. **Robustez de prioridad entre 12 escenarios** mediante matriz proyecto×escenario.
2. **Trayectorias de beneficio** de población, conexión funcional OD y conectividad topológica.
3. **Frontera de Pareto** para mostrar compromisos entre objetivos sin inventar una función agregada universal.
4. **Suficiencia objetivo-específica** mediante Population-first, OD-first y Connectivity-first.

La afirmación central puede fortalecerse como:

> **La prioridad de una intervención y el beneficio marginal que produce no son propiedades fijas del proyecto: emergen de la interacción entre el proyecto, el estado de la red, el conjunto de alternativas y la función de preferencia.**

Y la conclusión de suficiencia debe formularse siempre de manera condicional:

> **Que una cartera haya agotado el beneficio marginal respecto de un objetivo no implica que los proyectos restantes sean innecesarios; implica que su justificación debe provenir de otros objetivos o de interacciones de mayor profundidad que las evaluadas.**
