# Resultados reproducibles para el paper

Generado: 2026-09-04T17:02:59.072Z

- Motor: 3.13.0
- Metodología: 2.4.0
- Datos: 2026.08
- Proyectos: 133
- Red existente: 576 ejes
- Hexágonos OD: 1589

## Contraste principal: estado con normalización fija en G0

Para k=20: Jaccard Top-k=0.667, Spearman=0.783, Kendall tau=0.621, desplazamiento medio=9.35.

## Contraste operacional

Para k=20: Jaccard Top-k=0.667. La diferencia entre la secuencia fija y la operacional tiene Jaccard Top-k=1.000 para k=20.

## Efecto de orden con escalas G0

Mayor |Δ_ord| dentro del subconjunto evaluado: 0.087104 para MET-L04 ↔ I22.
Interacción media absoluta C=0.013726 sobre 380 interacciones dirigidas.

## Robustez Top-10

- Frecuencia >=0,8 al variar raíces bajo escenario dendrítico multicriterio: 10 proyectos.
- Frecuencia >=0,8 al variar tau y alpha bajo escenario dendrítico multicriterio: 10 proyectos.
- Frecuencia >=0,8 entre escenarios de política pública W: 10 proyectos.

La prueba principal fija las escalas de normalización en G0. Esta decisión evita atribuir al estado de la red cambios que sólo provienen de retirar del conjunto activo el proyecto que define el máximo de un criterio. La sensibilidad de alpha se evalúa dentro de un score multicriterio, ya que en un ranking puramente dendrítico alpha es una transformación monótona de la distancia topológica. Estos resultados describen la aplicación EVA; no constituyen validación empírica del marco en otros modos de transporte.
