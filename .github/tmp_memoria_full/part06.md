ll, J., & McNeil, N. (2013). Four types of cyclists? Examination of typology for better understanding of bicycling behavior and potential. *Transportation Research Record, 2387*, 129–138. https://doi.org/10.3141/2387-15

Duthie, J., & Unnikrishnan, A. (2014). Optimization framework for bicycle network design. *Journal of Transportation Engineering, 140*(7).

Geurs, K. T., & van Wee, B. (2004). Accessibility evaluation of land-use and transport strategies: Review and research directions. *Journal of Transport Geography, 12*(2), 127–140. https://doi.org/10.1016/j.jtrangeo.2003.10.005

Iacono, M., Krizek, K. J., & El-Geneidy, A. (2010). Measuring non-motorized accessibility: Issues, alternatives, and execution. *Journal of Transport Geography, 18*(1), 133–140. https://doi.org/10.1016/j.jtrangeo.2009.02.002

Lowry, M. B., Furth, P., & Hadden-Loh, T. (2016). Prioritizing new bicycle facilities to improve low-stress network connectivity. *Transportation Research Part A, 86*, 124–140. https://doi.org/10.1016/j.tra.2016.02.003

Lucas, K. (2012). Transport and social exclusion: Where are we now? *Transport Policy, 20*, 105–113.

Macharis, C., de Witte, A., & Ampe, J. (2009). The multi-actor, multi-criteria analysis methodology (MAMCA) for the evaluation of transport projects: Theory and practice. *Journal of Advanced Transportation, 43*(2), 183–202. https://doi.org/10.1002/atr.5670430206

Mekuria, M. C., Furth, P. G., & Nixon, H. (2012). *Low-Stress Bicycling and Network Connectivity*. Mineta Transportation Institute, Report 11-19.

Natera Orozco, L. G., Battiston, F., Iñiguez, G., & Szell, M. (2020). Data-driven strategies for optimal bicycle network growth. *Royal Society Open Science, 7*, 201130. https://doi.org/10.1098/rsos.201130

Ortúzar, J. de D., & Willumsen, L. G. (2011). *Modelling Transport* (4th ed.). Wiley.

Páez, A., Scott, D. M., & Morency, C. (2012). Measuring accessibility: Positive and normative implementations of various accessibility indicators. *Journal of Transport Geography, 25*, 141–153. https://doi.org/10.1016/j.jtrangeo.2012.03.016

Pereira, R. H. M., Schwanen, T., & Banister, D. (2017). Distributive justice and equity in transportation. *Transport Reviews, 37*(2), 170–191.

Rodríguez, D. A., & Joo, J. (2004). The relationship between non-motorized mode choice and the local physical environment. *Transportation Research Part D, 9*(2), 151–173.

Strahler, A. N. (1957). Quantitative analysis of watershed geomorphology. *Transactions, American Geophysical Union, 38*(6), 913–920. https://doi.org/10.1029/TR038i006p00913

Szell, M., Mimar, S., Perlman, T., Ghoshal, G., & Sinatra, R. (2022). Growing urban bicycle networks. *Scientific Reports, 12*, 6765. https://doi.org/10.1038/s41598-022-10783-y

### Fuentes institucionales y de datos

- Instituto Nacional de Estadísticas (2024). Censo de Población y Vivienda.
- CONASET. Siniestros de tránsito con participación de bicicletas, Región Metropolitana 2020–2024.
- SIES, Ministerio de Educación. Matrícula de educación superior por sede.
- Consejo de Monumentos Nacionales. Catastro de Monumentos Nacionales.
- Red Metropolitana de Movilidad / DTPM. Datos GTFS utilizados en la versión publicada.
- Gobierno Regional Metropolitano de Santiago. Ranking institucional de inversión comunal utilizado por EVA.

---

# 25. Citación de EVA

La referencia recomendada para esta versión es:

> **Gobierno Regional Metropolitano de Santiago, López, A., & Bastías, G. (2026). *EVA — Evaluador de Ciclovías Proyectadas* (Version v3.12.1) [Computer software]. Zenodo. https://doi.org/10.5281/zenodo.22145509**

El DOI identifica el release archivado. Para reproducibilidad de un análisis debe registrarse además la versión de datos, metodología, parámetros y ponderaciones de la corrida.

---

# 26. Conclusiones

EVA transforma un problema de priorización de infraestructura desde una comparación estática de proyectos hacia una evaluación iterativa de red. Su principal aporte metodológico no es un criterio particular, sino la integración de cinco ideas: **marginalidad**, **dependencia del estado de la red**, **criterios normativos explícitos**, **recalculabilidad** y **trazabilidad**.

La versión 3.12.0 del motor combina un modelo geoespacial de componentes, una condición de accesibilidad OD, indicadores territoriales, un modelo Logit de cambio modal, un índice dendrítico incremental, escenarios multicriterio, un solver secuencial, sensibilidad y mecanismos de auditoría. Al mismo tiempo, mantiene limitaciones explícitas: usa aproximaciones zonales, no posee ruteo de costo generalizado arco a arco, utiliza proxies de factibilidad y costos, y no garantiza optimalidad global.

La consecuencia institucional de esta arquitectura es relevante: una decisión compleja deja de depender de una cadena de cálculos difícil de repetir y pasa a ser un proceso que puede **volver a ejecutarse cuando cambian la red, los datos o las prioridades**. Esto no elimina la política de la planificación; la hace más explícita y discutible.

La publicación abierta del código, esta memoria, las fuentes de datos procesadas y el DOI permiten que EVA sea auditado, cuestionado, adaptado y mejorado. Ese carácter revisable es parte de la metodología, no un elemento accesorio de difusión.
