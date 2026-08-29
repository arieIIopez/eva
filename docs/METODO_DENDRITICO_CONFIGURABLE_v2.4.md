# Método dendrítico configurable de EVA — metodología 2.4.0

**Estado:** desarrollo posterior a la release archivada v3.12.1  
**Motor de desarrollo:** 3.13.0  
**Metodología:** 2.4.0  
**Datos:** 2026.08  
**Implementación:** `src/fractal.js` + `src/dendritic-config.js`

## 1. Cambio metodológico

La metodología 2.4.0 conserva el índice de conectividad dendrítica por distancia topológica documentado para v3.12.1, pero elimina la dependencia algorítmica de una raíz territorial fija. Alameda permanece como configuración predeterminada para asegurar comparabilidad retrospectiva, mientras la raíz inicial se representa como un parámetro de planificación:

\[
R_0 = R(\rho,\tau),
\]

donde \(\rho\) identifica el eje semilla y \(\tau\) la tolerancia geométrica de conectividad.

El usuario puede elegir cualquier eje de la red existente. Opcionalmente, la semilla se expande por conectividad a todo el componente construido alcanzable bajo \(\tau\). Los proyectos ya priorizados se agregan a la raíz en cada iteración:

\[
R_t = R_0(\rho,\tau) \cup P_t.
\]

## 2. Distancia y score

Para cada proyecto candidato \(p\):

\[
g_t(p\mid\rho,\tau)=\min_{r\in R_t}d_G(p,r).
\]

El score es:

\[
D_t(p\mid\rho,\tau,\alpha)=
\begin{cases}
1, & p\in R_t,\\
\alpha^{g_t(p)-1}, & g_t(p)\ge1,\\
0, & p\text{ desconectado}.
\end{cases}
\]

Los defaults históricos se conservan:

- \(\rho=\) Alameda;
- \(\tau=100\) m;
- \(\alpha=0.5\).

Estos valores son supuestos de modelación, no constantes universales.

## 3. Raíz como hipótesis de planificación

La raíz deja de ser una propiedad del territorio codificada en el algoritmo y pasa a ser una hipótesis explícita de planificación. Dos corridas que utilizan los mismos datos, pesos e indicadores pueden producir secuencias diferentes si parten de raíces distintas:

\[
\pi_{\rho_1} \neq \pi_{\rho_2}.
\]

Esta propiedad permite estudiar dependencia de trayectoria y robustez topológica sin modificar el resto del marco multicriterio.

## 4. Integración con el solver secuencial

La capa `src/dendritic-config.js` corrige una limitación de la implementación previa del solver completo: en cada iteración se recalculan explícitamente tanto la conectividad dendrítica como el criterio de ciclistas inducidos antes de volver a puntuar los candidatos. Por tanto, cuando estos criterios tienen peso positivo, su valor dentro del solver es efectivamente dependiente del estado de la red.

El procedimiento es:

```text
INPUT: G0, cartera P, pesos W, parámetros Θ, raíz ρ
R0 = componente raíz generado desde ρ
L = ∅

mientras existan candidatos:
    evaluar P \ L contra G0 + L
    recalcular elección modal contra G0 + L
    recalcular D(p | ρ, τ, α, L)
    recomputar score multicriterio
    elegir p* = argmax S(p)
    L = L ∪ {p*}
    Rt+1 = R0 ∪ L
```

La estrategia sigue siendo greedy y no garantiza óptimo global.

## 5. Reproducibilidad

La configuración de raíz se incorpora a `evaConfigHash`, junto con:

- identificador/nombre del eje raíz;
- modo de coincidencia;
- expansión al componente conectado;
- inclusión de proyectos del mismo eje;
- tolerancia \(\tau\);
- factor \(\alpha\).

La salida del solver registra además el grado y score dendrítico del proyecto elegido en cada paso y devuelve la configuración de raíz utilizada.

## 6. Sensibilidad propuesta

Para el artículo metodológico se propone estudiar:

\[
\tau\in\{50,75,100,150\}\text{ m}
\]

\[
\alpha\in\{0.35,0.50,0.65,0.80\}
\]

junto con un conjunto reducido de raíces \(\rho\) estructuralmente contrastantes.

La robustez de cada proyecto puede resumirse mediante frecuencia de inclusión Top-k:

\[
R_k(p)=\frac{1}{M}\sum_{m=1}^{M}\mathbf{1}[r_m(p)\le k].
\]

También se recomienda comparar rankings mediante Spearman, Kendall, Jaccard Top-k y rango mediano/intercuartílico.

## 7. Alcance

La formulación dendrítica no implica que una estructura jerárquica sea universalmente óptima. Es una estrategia topológica posible dentro de un marco más amplio que puede privilegiar otras morfologías —malla, redundancia, policentrismo o cobertura— mediante otros criterios de coherencia topológica.

Alameda es, por tanto, una instancia empírica de \(\rho\), no parte constitutiva del método general.
