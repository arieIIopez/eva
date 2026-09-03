# EDTR · OD-first y suficiencia exacta de conexión funcional

Fecha: 2026-09-02/03

## Propósito

Complementar `Population-first` con una prueba monoobjetivo sobre **conexión funcional**, medida como viajes OD nuevos que pasan de no viables a viables al transformar el estado de red.

El motor EVA define `demandaHabilitada = flowEnabled` como viajes **nuevos** viables origen→destino. En cada evaluación se excluyen los pares OD ya viables en el estado base, por lo que, al recalcular la red después de cada intervención, `ΔD_t` es marginal respecto de `G_t` y puede acumularse a lo largo de la trayectoria sin recontar ganancias anteriores.

## Definiciones

Para una alternativa `p` en `G_t`:

`D_t^D(p) = ΔD_t(p | G_t)`

es la ganancia directa de habilitación OD.

Si todas las alternativas tienen `ΔD_t=0`, se prueba una habilitación de un paso:

`H_t^D(p) = max_{q != p} ΔD_{t+1}(q | T_p(G_t))`.

Con `epsilon=0`, la suficiencia funcional se alcanza cuando:

`max_p D_t^D(p) = 0`

y
`max_p H_t^D(p) = 0`.

El punto se denota `t_D*`.

## Política OD-first

1. Mientras exista `ΔD_t>0`, elegir la alternativa con mayor ganancia OD directa.
2. Si todas presentan `ΔD_t=0`, simular exhaustivamente cada alternativa restante como posible puente de un paso.
3. Ejecutar un proyecto de ganancia directa cero sólo si habilita alguna alternativa con `ΔD_{t+1}>0`.
4. Si no existe ganancia directa ni habilitada a un paso, detener la secuencia.

Empates se resuelven determinísticamente por `id`.

La política es voraz y **no garantiza un óptimo global**. Tampoco detecta cadenas habilitantes que requieran dos o más proyectos consecutivos de `ΔD=0`.

## Referencia final

Las corridas completas RMC y Balanceado alcanzan `871.511` viajes OD marginales acumulados. Logit alcanza `871.510` por una diferencia de redondeo de un viaje. Se utiliza `871.511` como referencia reproducible de cobertura funcional completa observada en las corridas de cartera agotada.

## Relación con Population-first

- `t_P*`: suficiencia exacta de nueva cobertura poblacional bajo `Population-first` y habilitación de un paso. Resultado conocido: `t_P*=42`, con 82 proyectos restantes.
- `t_D*`: suficiencia exacta de nueva habilitación OD bajo `OD-first` y habilitación de un paso. Resultado a obtener mediante la corrida reproducible.

Ninguno de los dos puntos significa que la cartera restante carezca de valor en seguridad, equidad, ciclistas inducidos, intermodalidad, resiliencia o conexión topológica.

## Distinción con rendimientos decrecientes

El artículo debe separar:

1. **rodilla empírica** `t_knee`: cambio geométrico de régimen en la curva conjunta población–OD;
2. **saturación práctica** `t^(gamma)`: etapa en que se alcanza un porcentaje alto, por ejemplo 90% o 95%;
3. **suficiencia exacta** `t_P*` o `t_D*`: beneficio directo y habilitado igual a cero para el resultado declarado y el horizonte de interacción examinado.

Por tanto, no debe escribirse que después de la rodilla o del 95% “no hay beneficio”. Esa afirmación sólo es defendible para una métrica concreta cuando se satisface su condición de suficiencia exacta.

## Implementación reproducible

- `experiments/paper-od-first-only.js`
- `experiments/runner-od-first-only.html`
- `scripts/run-paper-od-first-only.mjs`
- `.github/workflows/paper-od-first-only.yml`
- salida prevista: `results/paper-od-first-only/`
