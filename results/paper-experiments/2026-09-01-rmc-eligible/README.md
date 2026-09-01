# Experimento correctivo EDTR — RMC + universo priorizable C/I

Generado: 2026-09-01T16:15:17.087Z

## Diseño

- Escenario principal: Ponderación RMC.
- Elegibles: Comunal + Intercomunal.
- Excluidos del ranking y de la referencia de normalización: Metropolitano (MET).
- Proyectos totales: 133; elegibles: 124 (88 comunales + 36 intercomunales); excluidos: 9.
- Motor 3.13.0; metodología 2.4.0; datos 2026.08.

## Dependencia de estado

- k=10: Jaccard=0.538, Spearman=0.806, Kendall=0.644, desplazamiento medio=6.60.
- k=20: Jaccard=0.538, Spearman=0.656, Kendall=0.526, desplazamiento medio=9.35.
- k=30: Jaccard=0.463, Spearman=0.761, Kendall=0.600, desplazamiento medio=16.60.
- En k=30 hay 19 proyectos comunes. El mayor desplazamiento entre los 30 seleccionados corresponde a C089 J J Pérez: ranking estático 85 → paso secuencial 25 (60 posiciones).

## Sensibilidad a normalización

La secuencia con referencia fija G0 y la secuencia operacional conservan el mismo conjunto Top-5 (Jaccard=1,000), pero divergen desde k=10. Para k=30: Jaccard=0.714, Spearman=0.840, Kendall=0.593 y 25 proyectos comunes. La normalización importa, pero su efecto es menor que la divergencia estático–secuencial con escala fija.

## Interacciones

K medio absoluto=0.009281; Q(0.01)=0.155; positivas=205; negativas=175; media firmada=-0.001585.
Mayor |Δ_ord|=0.067102: I12 Las Rejas–Suiza–Departamental ↔ I15 Martínez de Rozas. Ejecutar I12 primero reduce la valoración posterior de I15 en 0.067002; ejecutar I15 primero modifica I12 sólo en +0.000101.

## Sensibilidad topológica

- Balanceado vs RMC, Top-10 C/I: Jaccard=0.818.
- Raíces: Alameda y Andrés Bello producen la misma secuencia Top-10; Ruta G-690, Bollenar, Paine–Aculeo y Quilamuta tienen Jaccard=0.333 respecto de Alameda. H2 recibe apoyo.
- Núcleo Top-10 presente en las seis raíces: C068, I04, I12, I14 e I19.
- Para tau×alpha con raíz Alameda, tau∈{50,75,100,150} m no cambia el Top-10 para un alpha dado. Alpha sí cambia la composición: respecto de alpha=0.35, el Jaccard cae a 0.818 para alpha=0.50/0.65 y a 0.667 para alpha=0.80.
- Ocho proyectos tienen frecuencia Top-10=1 en las 16 combinaciones tau×alpha: C067, I04, I11, I12, I14, I19, I26 e I30.

## Sensibilidad a preferencias W

Respecto de RMC, el Jaccard Top-10 es 0.818 para Balanceado; 0.667 para Demanda, Educación e Integración; 0.538 para Eficiencia; y 0.429 para Equidad, Ciclistas inducidos, Dendrítico, Continuidad, Seguridad e Intermodalidad.

El núcleo R10>=0.80 entre los doce escenarios está compuesto por cinco proyectos: I12 (1.000), I26 (0.917), C068 (0.833), I16 (0.833) e I30 (0.833).

## Diseño factorial 2×2

El cambio dominante proviene de la definición del conjunto factible, no de sustituir Balanceado por RMC:

- Con todos los proyectos, Balanceado → RMC: Top-10 Jaccard=1.000.
- Dentro de C/I, Balanceado → RMC: Top-10 Jaccard=0.818.
- Bajo RMC, todos → C/I: Top-10 Jaccard=0.111 y Top-30=0.395.
- Cambio total Balanceado+todos → RMC+C/I: Top-10 Jaccard=0.111; Top-30=0.395.

## Implicación para el manuscrito EDTR

La dependencia de estado se mantiene y se hace más visible en el universo correcto. La conclusión de invariancia topológica de la corrida anterior no se sostiene cuando los MET dejan de competir por prioridad. El artículo debe tratar explícitamente la distinción entre universo modelado y conjunto factible P^f: en esta aplicación, la definición de elegibilidad tiene un efecto mayor sobre el ranking inicial que el cambio Balanceado→RMC.

La evidencia corregida no permite sostener que W domina a Ω. Las dos dimensiones alteran de manera sustantiva el Top-10 y la sensibilidad a raíces llega a una divergencia mayor (Jaccard mínimo=0.333) que la observada entre escenarios W respecto de RMC (mínimo=0.429), aunque los diseños no son estrictamente simétricos y no se estimó la interacción completa rho×tau×alpha.
