# Manuscrito EDTR · QA final 2026-09-02

## Estado científico

El experimento principal ejecuta los 124 proyectos Comunales + Intercomunales bajo RMC, Balanceado y Logit (Biogeme), con normalización fija en G0 y el mismo estado final. El diagnóstico algorítmico complementario ejecuta rollout depth-2 con shortlist K=3 sobre los mismos 124 proyectos y los tres W.

## Look-ahead completo

Ganancia en valor propio acumulado frente a greedy:
- RMC: +0,8452%; descontado por etapa: +1,9204%.
- Balanceado: +0,4352%; descontado: +0,8817%.
- Logit: +0,3664%; descontado: +0,7389%.

No hay dominancia estructural: RMC y Balanceado presentan fragmentación media levemente mayor con depth-2; Logit mejora marginalmente. La anticipación local mitiga la miopía sin demostrar optimalidad global.

## Estado editorial de la copia DOCX de envío

- 18 páginas renderizadas.
- Todas las 18 páginas inspeccionadas visualmente después del último cambio.
- Sin páginas vacías o semivacías artificiales por saltos de página.
- Tabla 4 y Figuras 2–3 verificadas visualmente.
- Ecuaciones numeradas y expresiones matemáticas relevantes convertidas a objetos Word Math/OMML generados desde LaTeX.
- 53 objetos matemáticos OMML en el DOCX final.
- Sin cambios controlados (`w:ins`/`w:del` = 0).
- Sin `comments.xml`.
- Único guion bajo textual remanente: `ciclistas_biogeme`, identificador de software y no expresión matemática.

## Artefacto final local

`EDTR_EVA_manuscrito_final_18p_LaTeX.docx`

La copia Word debe considerarse el artefacto autoritativo de envío porque Google Docs no preserva de forma fiable todos los objetos matemáticos nativos al exportar.

## Reproducibilidad

Resultados principales: `results/paper-full-portfolio-scenarios/`.
Look-ahead: `results/paper-lookahead-depth2/`.
Documentación: `docs/paper/LOOKAHEAD_DEPTH2_FULL_2026-09-02.md`.
