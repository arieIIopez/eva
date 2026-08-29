# Protocolo experimental — paper de priorización secuencial de redes

## Objetivo

Evaluar empíricamente, usando EVA como instanciación ciclable, cuatro propiedades del marco general de priorización secuencial de intervenciones en redes:

1. dependencia del estado de red;
2. efecto del orden de ejecución;
3. sensibilidad a preferencias de política pública;
4. sensibilidad a trayectoria topológica.

Este protocolo no presupone resultados. Las métricas se calculan después de ejecutar corridas reproducibles con la misma versión de datos y motor.

## A. Ranking estático versus secuencia estado-dependiente

### A.1 Ranking estático

Calcular una sola vez los scores de la cartera completa respecto de la red inicial \(G_0\) y ordenar los proyectos sin reevaluación posterior.

### A.2 Secuencia

Ejecutar el solver greedy completo:

\[
p_t^*=\arg\max_{p\in\mathcal P_t}S(p\mid G_t,\Omega,W,\Theta),
\qquad
G_{t+1}=T_{p_t^*}(G_t).
\]

### A.3 Comparaciones

Para \(k\in\{5,10,15,20,30\}\):

- Spearman entre posiciones;
- Kendall \(\tau\);
- desplazamiento absoluto medio y mediano;
- Jaccard Top-k;
- número de proyectos que entran/salen del Top-k;
- desempeño acumulado independiente del score compuesto.

## B. Efecto de orden

Para pares seleccionados \((p,q)\), estimar:

\[
\Delta_{ord}(p,q)=
\left[S(p\mid G_t)+\delta S(q\mid T_p(G_t))\right]
-
\left[S(q\mid G_t)+\delta S(p\mid T_q(G_t))\right].
\]

Construir una matriz de efecto de orden para un subconjunto de proyectos relevante por score, conectividad o función topológica. La matriz debe distinguir complementariedad, sustitución e independencia aproximada.

No interpretar \(\Delta_{ord}\) como causalidad económica: es una propiedad del modelo de decisión bajo la configuración evaluada.

## C. Baselines

Comparar la secuencia multicriterio contra:

- máxima población marginal;
- máxima demanda habilitada;
- máxima continuidad;
- máxima equidad;
- máxima eficiencia presupuestaria;
- criterio dendrítico puro;
- orden estático multicriterio;
- orden aleatorio.

Para el baseline aleatorio utilizar al menos 500 permutaciones con semilla registrada. Reportar media, mediana y cuantiles 5–95%.

## D. Métricas de desempeño acumulado

Evitar validar EVA con el mismo score compuesto usado para seleccionar proyectos. Utilizar resultados independientes, según disponibilidad:

- población marginal acumulada;
- demanda OD habilitada acumulada;
- ciclistas inducidos acumulados;
- cantidad de componentes de red;
- tamaño o participación del componente principal;
- cobertura territorial/comunal;
- indicador de equidad territorial;
- costo acumulado;
- costo por unidad de beneficio.

Evaluar al menos después de \(k=5,10,15,20,30\) intervenciones.

## E. Sensibilidad de pesos

Usar los escenarios predefinidos de EVA y perturbaciones controladas de pesos. Para cada proyecto registrar:

- rango mediano;
- rango intercuartílico;
- frecuencia Top-10/Top-20;
- mejor y peor posición;
- Spearman/Kendall entre escenarios.

Los pesos se interpretan como preferencias normativas, no como parámetros empíricamente verdaderos.

## F. Sensibilidad topológica dendrítica

### F.1 Raíz

Seleccionar un conjunto reducido de raíces \(\rho\) estructuralmente contrastantes. Alameda opera como referencia histórica. Incluir, de ser posible:

- una troncal central;
- un eje periférico;
- un eje ubicado en otro componente relevante de la red.

Registrar el identificador exacto de cada raíz y si se expande al componente existente conectado.

### F.2 Tolerancia y atenuación

Evaluar:

\[
\tau\in\{50,75,100,150\}\text{ m}
\]

\[
\alpha\in\{0.35,0.50,0.65,0.80\}.
\]

Aplicar un diseño escalonado: primero aislar el efecto de \(\rho\), luego combinar raíces representativas con \(\tau\) y \(\alpha\), y finalmente cruzar configuraciones topológicas contrastantes con los principales escenarios \(W\).

### F.3 Núcleo robusto

Para \(M\) configuraciones y posición \(r_m(p)\):

\[
R_k(p)=\frac{1}{M}\sum_{m=1}^{M}\mathbf{1}[r_m(p)\le k].
\]

Reportar \(R_{10}\) y \(R_{20}\). Un valor cercano a 1 indica robustez de prioridad frente a configuraciones evaluadas, no optimalidad universal.

## G. Trazabilidad mínima de cada corrida

Cada resultado debe registrar:

- `engine_version`;
- `data_version`;
- `data_processing_version`;
- `methodology_version`;
- `data_hash`;
- `config_hash`;
- parámetros \(\Theta\);
- pesos \(W\);
- raíz \(\rho\);
- tolerancia \(\tau\);
- atenuación \(\alpha\);
- orden completo de proyectos;
- métricas acumuladas por iteración;
- semilla, cuando exista aleatoriedad.

## H. Figuras principales sugeridas

1. diagrama del marco general e instanciaciones modales;
2. slopegraph de posiciones estáticas versus secuenciales para Top-20;
3. curvas de desempeño acumulado por estrategia;
4. heatmap de efecto de orden o interdependencia para proyectos seleccionados;
5. estabilidad Top-k bajo escenarios \(W\) y raíces \(\rho\);
6. mapas comparativos de redes resultantes tras 20 intervenciones bajo trayectorias topológicas distintas.

## I. Criterio de cierre del manuscrito

La sección de resultados del paper sólo debe completarse cuando las corridas estén archivadas y puedan reproducirse desde una versión identificada de EVA. La aplicación institucional de los primeros proyectos puede discutirse como evidencia de uso, pero no sustituye la validación experimental del marco metodológico.
