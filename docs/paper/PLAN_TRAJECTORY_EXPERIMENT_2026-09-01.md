# Experimento metodológico EVA — trayectoria de implementación de un plan maestro

Fecha: 2026-09-01

## Problema

La evaluación convencional de planes maestros de transporte suele comparar una condición base `G0` con un horizonte `GH` en que el conjunto de proyectos ya se encuentra implementado. Esa comparación informa si el estado final es conveniente, pero no determina necesariamente cómo conviene transitar entre ambos estados.

Para una cartera `P={p1,…,pn}`, distintas permutaciones pueden conducir al mismo estado final y producir estados intermedios diferentes:

`G0 → G1 → … → GH`.

EVA se utiliza aquí como método de evaluación secuencial: después de cada intervención se actualiza la red y se reevalúa el valor marginal de los proyectos restantes.

## Preguntas experimentales

1. ¿Importa el orden cuando el conjunto final de proyectos se mantiene exactamente constante?
2. ¿Cuánto valor decisional se captura antes bajo un orden estático versus una secuencia EVA reevaluada?
3. ¿Cómo cambia la integración de la red durante ambas trayectorias?
4. Si se permite reevaluar toda la cartera, ¿qué proyectos entran o salen de la programación inicial?
5. ¿Qué intervenciones generan señales positivas de complementariedad/habilitación y cuáles generan señales negativas de sustitución/pérdida de necesidad relativa?

## Diseño

### Configuración común

- Método: EVA.
- Escenario principal: Ponderación RMC.
- Universo modelado: cartera completa del Plan Maestro.
- Conjunto factible: proyectos de escala Comunal + Intercomunal.
- Corredores Metropolitanos: fuera del conjunto priorizable y fuera de los máximos de normalización.
- Normalización: fija en `G0` para aislar los cambios provenientes del estado de la red.
- Raíz topológica de referencia: Alameda, `tau=100 m`, `alpha=0.5`.
- Horizonte experimental: Top-30.

### Experimento 1 — efecto puro del orden

Se fija el conjunto `P30` formado por los treinta proyectos mejor evaluados en `G0`.

Se comparan dos trayectorias:

- `π_static`: ejecutar `P30` en el orden del ranking inicial.
- `π_EVA|P30`: después de cada intervención, reevaluar sólo los proyectos restantes de `P30` y seleccionar el mejor en el nuevo estado.

Ambas trayectorias contienen exactamente los mismos treinta proyectos. Por tanto, al completar el horizonte producen el mismo conjunto físico final. Las diferencias previas al horizonte se atribuyen al orden.

Métricas:

- puntaje EVA realizado de cada intervención en el estado en que efectivamente se construye;
- puntaje EVA acumulado;
- puntaje EVA acumulado descontado (`delta=0.95` por etapa);
- componentes de red después de cada intervención;
- reducción integrada de componentes a lo largo de la trayectoria;
- demanda habilitada, población marginal y ciclistas inducidos acumulados;
- costo acumulado;
- comparación por etapas y por fracciones equivalentes de presupuesto.

El puntaje EVA acumulado es una medida de valor decisional bajo la función multicriterio y no se interpreta como bienestar social monetario.

### Experimento 2 — plan adaptativo abierto

En cada etapa EVA reevalúa todos los proyectos elegibles aún no ejecutados y selecciona el de mayor valoración actual.

Se compara el Top-30 resultante con el Top-30 inicial para identificar:

- proyectos que ingresan a la programación;
- proyectos inicialmente priorizados que son desplazados;
- evolución de puntajes y rangos;
- efectos dirigidos de cada intervención sobre las alternativas restantes.

Para cada transición se calcula:

`I_t(i,j) = S_j(G_{t+1}) - S_j(G_t)`

con `G_{t+1}=T_i(G_t)`.

Interpretación:

- `I_t(i,j)>0`: señal de complementariedad o habilitación;
- `I_t(i,j)<0`: señal de sustitución o pérdida de necesidad relativa;
- `I_t(i,j)≈0`: independencia aproximada.

Estas etiquetas son diagnósticas. Un valor negativo no demuestra por sí solo que un proyecto deba eliminarse; indica que su valor marginal bajo la función EVA disminuyó después de la intervención precedente.

## Hipótesis metodológicas

**H1 — trayectoria:** aun manteniendo constante el conjunto final de proyectos, distintas secuencias producen estados intermedios y valores acumulados diferentes.

**H2 — adaptación de cartera:** permitir la reevaluación sobre todo el conjunto factible modifica no sólo el orden, sino también la composición de los proyectos seleccionados en las primeras etapas.

**H3 — interacción:** las intervenciones generan efectos dirigidos positivos y negativos sobre proyectos restantes, permitiendo diagnosticar complementariedad, habilitación y sustitución.

## Implicación para el paper EDTR

Este experimento desplaza el aporte desde la comparación de rankings hacia la evaluación de trayectorias de implementación de planes maestros. El problema general no es sólo determinar qué proyectos pertenecen al horizonte, sino cómo conviene incorporarlos y si las intervenciones inicialmente previstas mantienen su necesidad relativa a medida que la red cambia.

La aplicación sobre infraestructura ciclable funciona como evaluación empírica del método EVA; la contribución buscada es metodológica y transferible a carteras de infraestructura vial, transporte público, Metro, ferrocarriles y otras redes de transporte.
