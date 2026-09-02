# Rediseño del paper: población marginal, habilitación y suficiencia de cartera

Fecha: 2026-09-02

## Cambio conceptual

El costo no es la función objetivo del experimento. La pregunta pública principal es cuánto y cuán temprano una secuencia incorpora población potencialmente beneficiada. El costo puede actuar como restricción de factibilidad o programación.

La cartera deja de asumirse como una lista que necesariamente debe ejecutarse completa. EVA debe permitir tres decisiones conceptuales sobre una intervención restante: construir ahora, postergar/reordenar, o exigir reevaluación de su necesidad bajo el objetivo considerado.

## Variables poblacionales

Para un proyecto p en el estado G_t:

- D_t(p) = Delta P_t(p | G_t): población marginal directa potencialmente beneficiada.
- P_t(pi) = suma acumulada de población marginal a lo largo de la trayectoria.
- A_P(pi) = suma_t P_t(pi): área población-etapa; mide captura temprana.

## Proyecto de población cero

Delta P_t(p)=0 no implica que p sea inútil. Puede ser un proyecto habilitante.

Cuando todas las alternativas restantes presentan beneficio directo nulo, se define una prueba de habilitación de un paso:

H_t^P(p) = max_{q != p} Delta P_{t+1}(q | T_p(G_t)).

Bajo el estado de saturación directa, el valor de H identifica si construir p abre población potencialmente beneficiada en la etapa siguiente.

Clasificación operativa:

1. Beneficio directo: Delta P_t(p)>epsilon.
2. Proyecto habilitante: Delta P_t(p)<=epsilon y H_t^P(p)>epsilon.
3. Sin justificación poblacional observada en el horizonte de un paso: Delta P_t(p)<=epsilon y H_t^P(p)<=epsilon.

La tercera categoría NO equivale a proyecto inútil. Puede justificarse por seguridad vial, equidad, continuidad, redundancia, resiliencia, intermodalidad u otros objetivos, o por habilitación a mayor profundidad.

## Regla Population-first

Mientras exista población marginal directa positiva:

p_t* = argmax_p Delta P_t(p | G_t).

Si max Delta P_t <= epsilon, se prueban exhaustivamente los proyectos restantes como puentes de un paso. Se construye el p que maximiza H_t^P si max H_t^P > epsilon.

La secuencia se detiene cuando:

max_p Delta P_t(p | G_t) <= epsilon

y
max_p H_t^P(p) <= epsilon.

Este t* es un criterio endógeno de suficiencia poblacional de la cartera bajo horizonte de habilitación de un paso.

## Experimento

Universo modelado: 133 proyectos.
Conjunto factible: 124 comunales + intercomunales.
MET: excluidos de competencia y normalización.
Normalización: fija en G0 sobre P^f.
Base topológica: Alameda; tolerancia 100 m; alpha 0,5.
Epsilon base: 0 personas.

Se comparan:

A. Replay completo de RMC, Balanceado y Logit.
En cada etapa se registra la Delta P elegida, la máxima Delta P disponible y la brecha local de población. Los pasos de población cero se clasifican en:
- cero pese a existir alternativa positiva;
- cero observado como habilitante de un paso cuando todas las Delta P eran cero;
- cero sin ganancia poblacional de un paso observada.

B. Population-first con detención endógena.
La política selecciona máxima población directa; sólo usa un proyecto cero como puente cuando habilita población positiva inmediatamente después. Si no existe tal puente, detiene la cartera.

## Resultados a reportar

- población total potencialmente alcanzable;
- número de proyectos requeridos hasta detención;
- proyectos restantes;
- porcentaje de la población total alcanzada al detenerse;
- A_P e índice normalizado de captura temprana, usando horizonte común de 124 etapas y meseta después de detenerse;
- etapas para 50%, 75%, 90%, 95% y 99% de cobertura;
- número de proyectos cero en cada W;
- número de ceros seleccionados mientras existían alternativas con población positiva;
- proyectos cero habilitantes;
- proyectos sin justificación poblacional observada dentro del horizonte de un paso;
- brecha local acumulada respecto de la máxima población marginal disponible.

## Precaución científica

La regla Population-first es una heurística greedy poblacional con puente de un paso. No garantiza maximizar globalmente A_P y no detecta cadenas habilitantes que requieran dos o más proyectos cero consecutivos antes de producir población positiva. Por ello el criterio de detención debe denominarse suficiencia poblacional bajo horizonte de habilitación de un paso, no optimalidad ni innecesariedad absoluta de la infraestructura restante.
