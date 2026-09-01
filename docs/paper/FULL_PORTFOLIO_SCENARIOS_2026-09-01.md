# Experimento EDTR — cartera completa C/I bajo RMC, Balanceado y Logit

Fecha: 2026-09-01

## Decisión metodológica

El experimento principal de escenarios debe ejecutar **todas las ciclovías Comunales e Intercomunales elegibles** y no detenerse en un Top-30.

Conjunto factible:

- 88 proyectos Comunales;
- 36 proyectos Intercomunales;
- total `P^f = 124`;
- los 9 proyectos MET permanecen en el universo modelado pero no compiten por prioridad ni definen la normalización del experimento.

## Escenarios de ponderación

Se comparan tres vectores `W` ya existentes en EVA:

1. `ponderacion_rmc` — **RMC**;
2. `balanceado` — **Balanceado**;
3. `ciclistas_biogeme` — reportado en el experimento como **Logit (Biogeme)**, porque el criterio dominante de ciclistas inducidos proviene del logit binario bici/no-bici estimado con Biogeme.

No se inventa un nuevo vector Logit: se usa exactamente el escenario `ciclistas_biogeme` almacenado en `src/scenarios.jsx`.

## Invariantes

Las tres corridas utilizan:

- la misma red base;
- el mismo conjunto factible de 124 proyectos;
- las mismas capas territoriales;
- la misma raíz Alameda, `tau=100 m`, `alpha=0.5`;
- los mismos parámetros técnicos;
- normalización fija en `G0` calculada sólo sobre proyectos C/I.

Cada escenario ejecuta los 124 proyectos hasta agotar `P^f`. Por ello, salvo error de ejecución, las tres trayectorias deben terminar con:

- el mismo conjunto final de proyectos;
- el mismo costo total;
- el mismo estado físico final de la red.

La variable de interés es la **trayectoria de implementación**.

## Comparaciones

### A. Estático G0 vs secuencial, dentro de cada W

Para RMC, Balanceado y Logit se compara el ordenamiento inicial completo de 124 proyectos con la secuencia obtenida al reevaluar después de cada intervención.

Métricas:

- Spearman sobre los 124 proyectos;
- Kendall sobre los 124 proyectos;
- desplazamiento medio y máximo;
- Jaccard Top-10, 20, 30, 50, 75, 100 y 124.

Esto verifica si la dependencia del estado es robusta al vector normativo `W`.

### B. Secuencia RMC vs Balanceado vs Logit

Se comparan las tres secuencias completas mediante las mismas métricas de orden. Como el Top-124 necesariamente contiene los mismos proyectos, la comparación relevante está en las etapas tempranas e intermedias y en las posiciones relativas.

### C. Trayectoria bajo presupuesto equivalente

Al 10%, 20%, ..., 100% del costo final común se registran:

- etapa alcanzada;
- componentes de red;
- población marginal acumulada;
- demanda habilitada acumulada;
- ciclistas inducidos acumulados.

Estas variables son comparables entre escenarios sin asumir equivalencia normativa de sus puntajes.

### D. Evaluación cruzada de trayectorias

Los puntajes propios de RMC, Balanceado y Logit **no deben compararse directamente entre sí**, porque corresponden a funciones normativas distintas.

Para resolverlo, en cada estado y para cada proyecto seleccionado se calculan simultáneamente:

- `S_RMC`;
- `S_Balanceado`;
- `S_Logit`.

Al finalizar se construye una matriz `3 × 3`:

- filas: función evaluadora;
- columnas: escenario que generó la trayectoria.

Así puede responderse, por ejemplo, cuánto valor RMC acumula una trayectoria generada por Logit, o cuánto valor Logit acumula una trayectoria generada por Balanceado, sin mezclar escalas entre funciones distintas.

### E. Núcleo robusto

Se calcula la frecuencia de aparición en Top-10, Top-20, Top-30 y Top-50 de los tres escenarios para identificar proyectos tempranos robustos frente a las preferencias normativas.

## Implementación

- JS: `experiments/paper-full-portfolio-scenarios.js`
- runner: `experiments/runner-full-portfolio-scenarios.html`
- exportador: `scripts/run-paper-full-portfolio-scenarios.mjs`
- workflow: `.github/workflows/paper-full-portfolio-scenarios.yml`
- salida: `results/paper-full-portfolio-scenarios/`

## Precauciones científicas

- Las tres secuencias son heurísticas voraces; no prueban optimalidad global.
- El puntaje de un escenario no representa bienestar social monetario.
- Comparar `cumulative_own_score` entre distintos W no es una prueba válida de superioridad normativa; para eso se usa la matriz de evaluación cruzada y métricas físicas comunes.
- Como todos los proyectos se ejecutan, el estado final no discrimina entre escenarios; la evidencia está en la rapidez y el orden con que se obtienen las propiedades de red y otros resultados acumulados.
