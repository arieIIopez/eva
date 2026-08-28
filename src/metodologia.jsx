/* ============================================================
   EvaCiclo · Metodología — registro de fichas metodológicas
   Cada entrada: descripción, ecuación LaTeX, valores esperados,
   limitaciones y referencias académicas.
============================================================ */

const METODOLOGIA = {

  /* ===================== Modelo de elección modal ===================== */
  mod_logit: {
    title: "Modelo de elección modal (logit bici)",
    desc: "Logit binario bici vs. no-bici para el viaje al trabajo, estimado con Biogeme sobre 117.072 manzanas censales de todo Chile ponderadas por ocupados (modelo «ciclo_todo_chile 41», 234.144 observaciones). En EVA se aplica al contexto RM (ciudad grande, valle central, clima no lluvioso-frío) sobre cada hexágono OD: la utilidad de la bici depende de la distancia al trabajo, el desnivel, la escolaridad y — la palanca de política — los km de ciclovía a 500 m del origen. Cada proyecto evaluado incrementa esa variable en los hexes de su corredor, y los ciclistas inducidos son ocupados × ΔP(bici). Coeficientes (rob. t-stat): ASC −1.39 (−17.5) · β_dist −0.0267 (−6.2) · β_dist,large −0.0819 (−25) · β_alt −0.00778 (−23.2) · β_educ −0.0786 (−13.0) · β_ciclo +0.13 (+13.7). Todos p < 0.001.",
    eq: [
      "V_{bici} = ASC + (\\beta_{dist} + \\beta_{dist,large}) \\cdot d_{km} + \\beta_{alt} |\\Delta h| + \\beta_{educ} \\cdot esc + \\beta_{ciclo} \\cdot km_{500}",
      "P(bici) = \\frac{e^{V_{bici}}}{1 + e^{V_{bici}}}",
      "\\Delta ciclistas_p = \\sum_{h} ocup_h \\left[ P(km_{500,h} + \\Delta km_{500,h}^{(p)}) - P(km_{500,h}) \\right]",
    ],
    expected: "P̄(bici) regional ≈ 3–4% (share observado en la muestra: 4.03%). β_ciclo = +0.13 implica que 1 km adicional de ciclovía a 500 m sube la utilidad en 0.13 → en niveles bajos de P, ≈ +12–13% relativo de probabilidad.",
    limits: [
      "Transferencia de modelo: los coeficientes son nacionales; se aplican a la RM vía dummies de contexto, sin re-estimación local.",
      "La tabla de estimación se une vía diccionario id_manzana→MANZENT: 1.006 de 1.589 hexágonos usan escolaridad y desnivel observados de la muestra (medias ponderadas por ocupados); el resto usa constantes RM editables en Tweaks. La distancia OD se recalcula por centroides comunales (no ruta real) y los km de ciclovía a 500 m se miden desde el centroide del hex.",
      "Escolaridad y desnivel de respaldo (13.0 años, 40.5 m) solo aplican a los hexes sin manzanas en la muestra de estimación.",
      "Solo motivo trabajo; no capta inducción de largo plazo (cambios residenciales, cultura ciclista) ni efectos de red no locales.",
    ],
    refs: [
      "Bierlaire, M. (2023). A short introduction to Biogeme. EPFL, Transport and Mobility Laboratory.",
      "Estimación «ciclo_todo_chile», modelo 41 (2026). Logit ponderado por manzana, LL = −766.522, 8 parámetros.",
      "Ortúzar, J. de D. & Willumsen, L.G. (2011). Modelling Transport, 4ª ed. Wiley, cap. 7 (modelos de elección discreta).",
    ],
  },

  capa_pbici: {
    title: "Capa P(bici) — modelo logit",
    desc: "Probabilidad de que un ocupado del hexágono elija la bicicleta para su viaje al trabajo, según el modelo de elección modal. El color escala de azul (≤1%) a rojo (≥9%); si hay proyectos priorizados, se pinta la probabilidad DEL ESCENARIO y un anillo naranjo marca los hexes donde el escenario suma ciclistas. Click en un hex abre su ficha con P(bici), ciclistas estimados y sus manzanas MANZENT.",
    eq: null,
    expected: "Los máximos aparecen donde coinciden viajes cortos, red densa y baja escolaridad media relativa; el pericentro plano supera a la periferia lejana y al sector oriente alto.",
    limits: ["Ver limitaciones del modelo en la ficha «Modelo de elección modal (logit bici)»."],
    refs: ["Estimación «ciclo_todo_chile», modelo 41 (2026).", "INE (2024). Censo de Población y Vivienda."],
  },

  dicc_manzanas: {
    title: "Diccionario de manzanas (MANZENT por hex)",
    desc: "Recupera el código censal MANZENT de las 66.873 manzanas que alimentan los centroides OD (eliminado del GeoJSON optimizado para reducir peso) y las asigna a su hexágono de agregación por centroide más cercano (EPSG:31979 → WGS84). Habilita joins a nivel de manzana con el censo 2024 y con futuras salidas de modelos de transporte.",
    eq: null,
    expected: "66.873 MANZENT asignadas a 1.589 hexágonos; el conteo por hex coincide con el campo n del hex en el 97.5% de los casos (resto ±3, efecto borde).",
    limits: ["Asignación por centroide más cercano: en bordes de hexágono una manzana puede quedar asignada al hex vecino."],
    refs: ["INE (2024). Censo de Población y Vivienda.", "Diccionario centroides_manzanas_OD (paquete de optimización de la base OD)."],
  },


  /* ===================== Score global ===================== */
  sec_score: {
    title: "Puntaje multicriterio",
    desc: "Cada proyecto recibe un puntaje agregado como suma ponderada de sus indicadores normalizados. Los indicadores se normalizan por el máximo de la cartera activa (re-escalado min-max sobre 0), de modo que cada criterio aporta en [0,1] y los pesos definen su importancia relativa. El puntaje se recalcula en vivo al mover cualquier ponderador y en cada iteración del proceso secuencial.",
    eq: ["P_p = \\frac{\\sum_{i} w_i \\, \\hat{x}_{i,p}}{\\sum_{i} w_i}", "\\hat{x}_{i,p} = \\frac{x_{i,p}}{\\max_{q \\in \\text{cartera}} x_{i,q}}"],
    expected: "P_p ∈ [0, 1]. En la cartera PMC los líderes suelen puntuar 0.55–0.75; la mediana ronda 0.25–0.35.",
    limits: [
      "La normalización por máximo hace que el puntaje sea relativo a la cartera: agregar o quitar proyectos cambia los puntajes de todos.",
      "Suma ponderada asume compensabilidad total entre criterios (un déficit en equidad se compensa con población); métodos outranking (ELECTRE, PROMETHEE) evitan esto pero pierden transparencia.",
      "Los pesos son juicio de valor del decisor, no datos: deben sancionarse institucionalmente.",
    ],
    refs: [
      "Saaty, T.L. (1980). The Analytic Hierarchy Process. McGraw-Hill.",
      "Vega, J., Greene, M. & Ortúzar, J. de D. (2024). Metodología de evaluación de accesibilidad ciclista. Travel Behaviour and Society (base del informe técnico GORE).",
      "Macharis, C., de Witte, A. & Ampe, J. (2009). The multi-actor, multi-criteria analysis methodology (MAMCA) for the evaluation of transport projects. J. of Advanced Transportation 43(2).",
    ],
  },

  /* ===================== Criterios ===================== */
  crit_poblacion: {
    title: "Población marginal",
    desc: "Ocupados que residen en hexágonos NO atendidos por la red base actual y que quedan a distancia de acceso del proyecto evaluado. Mide el aporte incremental de cobertura: solo cuenta población que antes no tenía acceso, evitando doble conteo con la red existente.",
    eq: ["\\Delta Pob_p = \\sum_{h \\in H(p)} pob_h \\cdot \\mathbb{1}\\left[ d(h, \\text{red base}) > \\delta_O \\right]", "H(p) = \\{ h : d(h, p) \\le \\delta_O \\}"],
    expected: "En la cartera PMC: 0–60.000 personas por proyecto; los corredores periféricos largos lideran. δ_O = 700 m por defecto.",
    limits: [
      "Usa distancia euclidiana al eje, no distancia de ruta por la vialidad real (sobreestima acceso cuando hay barreras: autopistas, ríos, líneas férreas).",
      "El hexágono de 600 m agrega ~42 manzanas; la población se asigna completa al centroide.",
      "No distingue propensión al ciclismo de la población beneficiada.",
    ],
    refs: [
      "Vega, Greene & Ortúzar (2024), op. cit.",
      "Geurs, K. & van Wee, B. (2004). Accessibility evaluation of land-use and transport strategies. J. of Transport Geography 12(2).",
      "INE (2024). Censo de Población y Vivienda — n_ocupado por manzana.",
    ],
  },

  crit_costoOD: {
    title: "Reducción de costo OD",
    desc: "Proxy de la reducción del costo generalizado de viaje origen-destino que produce el proyecto, estimada a partir de los viajes nuevos viables que habilita y su distribución por destino. Un viaje pasa de 'inviable' (sin subred que conecte O y D) a 'viable': su costo percibido cae de infinito (o del costo de la alternativa) al costo de la ruta ciclable.",
    eq: ["\\Delta C_p = \\sum_{(o,d)} f_{od} \\left( C_{od}^{sin} - C_{od}^{con} \\right)", "C_{od} = \\min_{r \\in R_{od}} \\sum_{a \\in r} L_a \\cdot F_a^{infra} \\cdot F_a^{jerarquia} \\cdot F_a^{pend} \\cdot F_a^{cruce}"],
    expected: "Correlaciona con demanda habilitada; proyectos conectores de subredes grandes dominan este criterio.",
    limits: [
      "El costo se aproxima a nivel de subred conectada, no con ruteo arco a arco (eso requiere el grafo OSM completo, Fase 2 plena).",
      "Los factores F provienen de literatura, no de preferencias declaradas locales.",
    ],
    refs: [
      "Broach, J., Dill, J. & Gliebe, J. (2012). Where do cyclists ride? A route choice model. Transportation Research A 46(10).",
      "Ortúzar, J. de D. & Willumsen, L.G. (2011). Modelling Transport, 4ª ed. Wiley.",
    ],
  },

  crit_oportunidades: {
    title: "Hexes beneficiados",
    desc: "Número de hexágonos de población que obtienen al menos un viaje nuevo viable gracias al proyecto (sea por cercanía directa al trazado o por la interconexión de subredes que el proyecto produce). Mide la extensión territorial del beneficio, complementando a la población (que mide intensidad).",
    eq: ["O_p = \\left| \\{ h : \\exists d \\; v_{h,d}^{con\\,p} \\wedge \\neg v_{h,d}^{sin\\,p} \\} \\right|"],
    expected: "0–250 hexes por proyecto. Valores altos con población baja indican beneficio extenso pero difuso.",
    limits: [
      "Cuenta hexes, no personas: un hex con 50 habitantes pesa igual que uno con 20.000 (por eso se combina con población marginal).",
      "Sensible al umbral de viabilidad de destino (cobertura mínima).",
    ],
    refs: [
      "Geurs & van Wee (2004), op. cit.",
      "Páez, A., Scott, D. & Morency, C. (2012). Measuring accessibility: positive and normative implementations. J. of Transport Geography 25.",
    ],
  },

  crit_equidad: {
    title: "Equidad territorial",
    desc: "Fracción de la población beneficiada del proyecto que reside en comunas cuya cobertura ciclable actual está bajo la mediana regional. Prioriza proyectos que cierran brechas territoriales en vez de densificar zonas ya bien servidas.",
    eq: ["E_p = \\frac{\\sum_{h \\in B(p)} pob_h \\cdot \\mathbb{1}[cob_{c(h)} < \\tilde{cob}]}{\\sum_{h \\in B(p)} pob_h}"],
    expected: "E_p ∈ [0, 1]. Proyectos en periferia sur-poniente suelen superar 0.8; en el cono oriente caen bajo 0.3.",
    limits: [
      "La cobertura comunal es un promedio que oculta heterogeneidad intracomunal.",
      "No incorpora ingreso ni vulnerabilidad social directamente (la cobertura ciclable actúa como proxy).",
      "La mediana se recalcula con la red base vigente: el indicador es dinámico durante la priorización secuencial.",
    ],
    refs: [
      "Lucas, K. (2012). Transport and social exclusion: Where are we now? Transport Policy 20.",
      "Pereira, R., Schwanen, T. & Banister, D. (2017). Distributive justice and equity in transportation. Transport Reviews 37(2).",
    ],
  },

  sec_redes: {
    title: "Redes aisladas (subredes inconexas)",
    desc: "Particiona la red existente en componentes conexos mediante union-find espacial: dos ejes pertenecen a la misma subred si la distancia mínima entre sus geometrías es ≤ δ (distancia de conexión, ajustable 100 m – 5 km). Cada subred se colorea distinto en el mapa, evidenciando la fragmentación de la red. Sobre esa partición se identifican los proyectos conectores: ciclovías proyectadas cuya geometría se aproxima a ≤ δ de dos o más subredes, y que al construirse las fusionarían en una red mayor — el efecto de interconexión que el motor valora vía continuidad y demanda OD habilitada.",
    eq: [
      "G_k : \\text{componentes de } \\{e_i\\} \\text{ bajo } d(e_i, e_j) \\le \\delta",
      "C_p = \\left|\\{ k : d(p, G_k) \\le \\delta \\}\\right| \\ge 2 \\;\\Rightarrow\\; p \\text{ es conector}"
    ],
    expected: "Con δ = 1 km la red SECTRA forma típicamente 15–40 subredes; con δ = 100 m supera las 140. El valor de un conector crece con el km total de las subredes que une.",
    limits: [
      "La proximidad geométrica no garantiza conexión funcional (autopistas, ríos o líneas férreas pueden separar ejes cercanos).",
      "δ es una tolerancia visual-analítica: el motor de evaluación usa su propia tolerancia de empalme (parámetro de umbrales) para el cálculo de ranking.",
      "Subredes medidas solo sobre la red existente; los proyectos priorizados (incorporados a la base) no se incluyen en esta vista.",
    ],
    refs: [
      "Furth, P., Mekuria, M. & Nixon, H. (2012). Low-Stress Bicycling and Network Connectivity. Mineta Transportation Institute, Report 11-19.",
      "Natera Orozco, L. et al. (2020). Data-driven strategies for optimal bicycle network growth. Royal Society Open Science 7(12).",
      "Szell, M. et al. (2022). Growing urban bicycle networks. Scientific Reports 12.",
    ],
  },

  crit_prioridadGore: {
    title: "Prioridad de inversión GORE",
    desc: "Incorpora el ranking de inversión comunal del Gobierno Regional como criterio de priorización. Cada comuna tiene una categoría oficial (Alta · Media alta · Media · Media baja · Baja) derivada de su nivel de inversión regional. El score del proyecto es el promedio de la prioridad comunal, ponderado por dónde vive la población nueva que el proyecto beneficia: un proyecto cuyo beneficio cae en comunas de alta prioridad GORE puntúa cerca de 1; si cae en comunas de baja prioridad, cerca de 0.",
    eq: [
      "s_c \\in \\{1, 0.75, 0.5, 0.25, 0\\} \\;\\text{según categoría de inversión de la comuna } c",
      "PG_p = \\frac{\\sum_c \\Delta B_{p,c} \\cdot s_c}{\\sum_c \\Delta B_{p,c}}"
    ],
    expected: "0–1. Proyectos en Quinta Normal, Conchalí, Renca, La Granja, Lo Espejo o Maipú (cat. Alta) tienden a 1; en Vitacura, Las Condes, Lo Barnechea o Providencia (cat. Baja) tienden a 0. Sin beneficiarios nuevos → 0.5 neutro.",
    limits: [
      "Cubre las 34 comunas del ranking GORE; comunas rurales fuera del listado se tratan como neutras (0.5).",
      "La categoría es por comuna completa: no distingue heterogeneidad interna.",
      "Criterio de política regional (no técnico-funcional): su peso refleja cuánto debe alinearse la priorización de ciclovías con la inversión regional general.",
    ],
    refs: [
      "GORE Región Metropolitana (2026). Ranking de inversión comunal. Documento de trabajo, División de Presupuesto e Inversión Regional.",
      "Vega, Greene & Ortúzar (2024), op. cit. — sobre integración de criterios de política en evaluación multicriterio.",
    ],
  },

  crit_continuidad: {
    title: "Continuidad / interconexión",
    desc: "Mide cuántos componentes inconexos de la red base el proyecto une físicamente (empalme a ≤ tolerancia). Un proyecto que fusiona subredes separadas crea valor de red: habilita viajes entre pares de zonas que ninguna de las subredes servía por sí sola — el efecto que motiva la evaluación secuencial.",
    eq: ["K_p = \\left| \\{ k : d(p, G_k) \\le \\tau \\} \\right|, \\qquad \\hat{k}_p = \\min\\left(1, \\frac{K_p}{4}\\right)"],
    expected: "K_p típico: 0–8 componentes unidos. El indicador satura en 4 (K_p/4). El número de componentes de la red depende de la tolerancia de empalme τ vigente.",
    limits: [
      "El empalme se evalúa por proximidad geométrica entre ejes, no por conectividad vial efectiva (un eje al otro lado de una autopista puede quedar 'unido').",
      "No pondera el tamaño de los componentes unidos (unir dos redes grandes vale más que unir dos colas cortas; eso lo captura demanda habilitada).",
    ],
    refs: [
      "Furth, P., Mekuria, M. & Nixon, H. (2012). Low-Stress Bicycling and Network Connectivity. Mineta Transportation Institute, Report 11-19.",
      "Barthélemy, M. (2011). Spatial networks. Physics Reports 499.",
    ],
  },

  crit_seguridad: {
    title: "Siniestralidad prevenible intervenida",
    desc: "Mide cuánta siniestralidad ciclista PREVENIBLE intervendría el proyecto. Cada siniestro con participación de bicicletas (CONASET 2020–2024) a ≤100 m de la traza se pondera por tres factores: (1) severidad — peso CONASET 6·fallecidos+3·graves+2·menos graves+1·leve, o solo fatales+graves en modo KSI; (2) tratabilidad — cuánto mitiga ese tipo/causa/ubicación una ciclovía segregada (0.15–1; p. ej. colisión por alcance o lateral en tramo recto ≈ alta; conflicto de cruce o por ebriedad ≈ baja); (3) decaimiento por distancia — 1 sobre el eje, 0.2 en el borde del buffer. Valora positivamente el corredor peligroso (lógica de intervención / Vision Zero), no lo evita.",
    eq: ["Seg_p = \\sum_{s \\in S(p)} sev_s \\cdot \\tau_s \\cdot \\left(1 - 0.8\\tfrac{d_s}{100}\\right)", "\\tau_s = \\text{tratabilidad}(tipo, causa, ubic) \\in [0.15, 1]"],
    expected: "Normalizado 0–1 contra el proyecto de mayor siniestralidad prevenible de la cartera. 4.446 siniestros 2020–2024 (94 fallecidos, 853 graves); 68% prevenible en promedio. La ficha muestra fallecidos/graves/leves del corredor y el % prevenible.",
    limits: [
      "Es exposición/peligrosidad OBSERVADA y prevenible, no una predicción del efecto causal de la ciclovía sobre los siniestros.",
      "La tratabilidad es una regla experta por tipo/causa/ubicación, no un modelo calibrado con estudios antes-después.",
      "Sin normalizar por exposición ciclista (flujo): un corredor muy transitado acumula más siniestros sin ser necesariamente más peligroso por viaje.",
      "Geolocalización a nivel de intersección/dirección y asignación al corredor por proximidad euclidiana (≤100 m).",
    ],
    refs: ["CONASET (2025). Siniestros de tránsito con participación de bicicletas, RM 2020–2024.", "Vision Zero Network. High Injury Network methodology."],
  },

  crit_monumentos: {
    title: "Monumentos nacionales (contexto)",
    desc: "Capa de contexto patrimonial: cuenta los Monumentos Nacionales (CMN) a ≤300 m de la traza del proyecto. Es un criterio BIDIRECCIONAL con peso NEUTRO (0) por defecto, que no suma ni resta al ranking salvo que el usuario lo active: peso negativo penaliza proyectos que pasan cerca de monumentos (evitar intervención sobre entorno patrimonial), peso positivo los favorece (acercar/conectar la red ciclable al patrimonio). No participa en el denominador del puntaje, por lo que actúa como un modificador aditivo del score base.",
    eq: ["Mon_p = \\#\\{ m : d(m, p) \\le 300\\,m \\}", "score = \\frac{\\sum_i w_i n_i + w_{mon} n_{mon}}{\\sum_i w_i}, \\;\\; w_{mon} \\in [-50, 50]"],
    expected: "351 monumentos en la RM (289 Monumentos Históricos, 49 Zonas Típicas, 13 Santuarios de la Naturaleza). Normalizado 0–1 contra el proyecto con más monumentos asociados.",
    limits: [
      "Asociación por proximidad euclidiana (≤300 m), no por accesibilidad real ni por la vía que conecta.",
      "Los puntos representan el monumento (a veces varios componentes del mismo bien); no delimitan la Zona Típica completa.",
      "Es un dato de contexto para decisión experta; con peso neutro por defecto no expresa una política de priorización por sí mismo.",
    ],
    refs: ["Consejo de Monumentos Nacionales (2025). Catastro de Monumentos Nacionales, Región Metropolitana."],
  },

  crit_intermodal: {
    title: "Intermodalidad bici-metro",
    desc: "Mide cuántas estaciones de Metro conecta el eje (a ≤250 m de la traza). Un corredor que toca o acerca estaciones habilita el viaje combinado bicicleta+metro — la bici resuelve el primer y último kilómetro y el metro el tramo largo —, aumentando el radio de captación de la red. Valora positivamente los ejes que funcionan como alimentadores del Metro.",
    eq: ["Int_p = \\#\\{ e \\in Metro : d(e, p) \\le 250\\,m \\}"],
    expected: "126 estaciones de Metro en la red. Normalizado 0–1 contra el eje que conecta más estaciones. La ficha muestra las estaciones conectadas y la distancia a la más cercana.",
    limits: [
      "Proximidad euclidiana (≤250 m), no accesibilidad real (puede haber barreras entre la traza y el acceso a la estación).",
      "No pondera la capacidad de la estación ni la disponibilidad de bicicleteros.",
      "No distingue líneas ni combinación: una estación de intercambio cuenta igual que una simple.",
    ],
    refs: ["GTFS Santiago — Red Metropolitana de Movilidad (DTPM)."],
  },

  crit_factibilidad: {
    title: "Factibilidad constructiva (ancho de vía)",
    desc: "Aproxima la facilidad y el menor costo de construir la ciclovía a partir del número de pistas de la calle: una vía ancha (más pistas) permite alojar una ciclovía segregada reasignando calzada con menor conflicto y costo, mientras que una calle angosta (pocas pistas) obliga a soluciones más complejas y caras. Valora positivamente los ejes sobre vías anchas. El número de pistas por proyecto es el promedio ponderado por longitud de sus tramos.",
    eq: ["Fact_p = \\frac{\\sum_t L_t \\cdot pistas_t}{\\sum_t L_t}"],
    expected: "1,5 a 3,9 pistas por proyecto. Normalizado 0–1 contra el eje más ancho de la cartera.",
    limits: [
      "El número de pistas es un proxy del ancho disponible, no una medición del ancho real ni del perfil transversal.",
      "No considera la demanda de estacionamiento, arbolado o veredas que compiten por el espacio.",
      "No sustituye un anteproyecto de ingeniería: es un indicador de tamizaje para priorización.",
    ],
    refs: ["Atributo num_pistas del catastro vial de la cartera PMC."],
  },

  crit_parques: {
    title: "Atractor de parques (por tamaño)",
    desc: "Los parques y áreas verdes operan como hotspots atractores de viajes recreativos, con un poder de atracción proporcional a su tamaño. El criterio suma la superficie (m²) de los parques que el eje toca o bordea (a ≤ radio del parque + 150 m de la traza): un eje que pasa junto a un parque metropolitano aporta mucho más que uno junto a una plaza vecinal. Valora positivamente los ejes que conectan grandes superficies verdes.",
    eq: ["Par_p = \\sum_{k \\in K(p)} A_k, \\;\\; K(p) = \\{ k : d(centroide_k, p) \\le r_k + 150\\,m \\}", "r_k = \\sqrt{A_k / \\pi}"],
    expected: "754 parques (24,8 km² en total). Normalizado 0–1 contra el eje que conecta mayor superficie de parques. La ficha muestra n.º de parques y hectáreas conectadas.",
    limits: [
      "Cada parque se reduce a su centroide con un radio efectivo √(A/π); no usa el borde real del polígono.",
      "El tamaño es un proxy del poder de atracción; no incorpora equipamiento, calidad ni uso real del parque.",
      "No pondera la población del entorno ni la competencia entre parques cercanos.",
    ],
    refs: ["Catastro de parques y áreas verdes, Región Metropolitana (2023)."],
  },

  crit_ciclistas: {
    title: "Ciclistas inducidos (logit)",
    desc: "Nuevos ciclistas diarios al trabajo que el proyecto induce según el modelo de elección modal «ciclo_todo_chile 41» (logit binario bici vs. no-bici, Biogeme): para cada hexágono del corredor, el proyecto incrementa los km de ciclovía a 500 m del origen, lo que sube la utilidad de la bici (β_ciclo = +0.13/km) y con ella P(bici). Los inducidos son ocupados × ΔP(bici), sumados sobre los hexes tocados. A diferencia de la demanda OD habilitada (viabilidad de viajes existentes), este criterio estima CAMBIO DE COMPORTAMIENTO: cuánta gente nueva pedalearía. En el ranking se normaliza por el máximo de la cartera.",
    eq: ["\\Delta ciclistas_p = \\sum_{h} ocup_h \\left[ P(km_{500,h} + \\Delta km_{500,h}^{(p)}) - P(km_{500,h}) \\right]"],
    expected: "En la cartera PMC, los líderes inducen cientos a pocos miles de ciclistas/día; proyectos en zonas ya densas en ciclovías inducen poco (Δkm_500 marginal) aunque tengan alta demanda OD.",
    limits: [
      "Hereda todas las limitaciones del modelo logit (ver ficha «Modelo de elección modal»): transferencia nacional→RM, solo motivo trabajo, distancia por centroides comunales.",
      "Al evaluar proyectos por separado, los Δ no son aditivos entre proyectos que comparten hexes (efecto saturación de km_500); la cifra de cartera es cota superior.",
      "Sensible al radio de influencia y a β_ciclo, ambos editables en «Modelo de demanda · supuestos» (Fase 3).",
    ],
    refs: [
      "Estimación «ciclo_todo_chile», modelo 41 (2026). Logit ponderado por manzana, LL = −766.522, 8 parámetros.",
      "Bierlaire, M. (2023). A short introduction to Biogeme. EPFL.",
    ],
  },

  sec_demandaSupuestos: {
    title: "Modelo de demanda · supuestos",
    desc: "Parámetros vivos del modelo logit aplicado en EVA. β ciclovías y el radio de influencia controlan la palanca de política (cuánto pesa la infraestructura nueva en la utilidad); el ajuste ASC desplaza el nivel general de P(bici) sin alterar el ranking (útil para calibrar el share base a un objetivo observado, p. ej. 4.03% de la muestra); escolaridad y desnivel de respaldo solo aplican a los hexes sin variables observadas de la muestra de estimación (583 de 1.589). Cualquier cambio reevalua los ciclistas inducidos de toda la cartera. «Restaurar coeficientes estimados» vuelve a los valores Biogeme.",
    eq: ["V_{bici} = ASC + \\Delta ASC + (\\beta_{dist} + \\beta_{dist,large}) d_{km} + \\beta_{alt}|\\Delta h| + \\beta_{educ} \\cdot esc + \\beta_{ciclo} \\cdot km_{500}"],
    expected: "Con los valores estimados: P̄(bici) ≈ 2.9% y ~99 mil ciclistas/día base. ΔASC +0.35 ≈ share 4%. Modificar solo para análisis de sensibilidad.",
    limits: [
      "Estos parámetros NO son pesos de priorización: cambian la estimación de demanda, no la importancia del criterio en el ranking.",
      "ΔASC uniforme: recalibra el nivel, no la distribución espacial.",
    ],
    refs: ["Estimación «ciclo_todo_chile», modelo 41 (2026).", "Bierlaire, M. (2023). A short introduction to Biogeme. EPFL."],
  },

  crit_fractal: {
    title: "Conectividad fractal (red dendrítica Alameda)",
    desc: "Prioriza cada proyecto según su distancia topológica al eje raíz — la Avenida Alameda (ciclovía existente en el eje Alameda + proyecto ALAMEDA TRAMO 3) — imitando el crecimiento de una red de drenaje (orden de Strahler invertido). Paso 1: se detecta conectividad real entre ejes con un test de intersección exacta de segmentos más una tolerancia de snapping de 100 m (los trazos reales rara vez cierran exactamente; la tolerancia absorbe extremos abiertos y offsets de digitalización, coherente con los umbrales de aproximación de EVA). Paso 2: una búsqueda en anchura (BFS) desde la raíz asigna a cada proyecto su grado de separación (saltos hasta la Alameda). Paso 3: el score se atenúa geométricamente con el grado; los ejes aislados (sin camino a la raíz) puntúan 0. Es INCREMENTAL: cada proyecto priorizado (candado) se funde con la raíz, y en el recálculo siguiente sus vecinos suben a grado 1 — la red crece desde la Alameda sumando afluentes, como un sistema fluvial.",
    eq: ["Score_p = 100 \\cdot 0.5^{(g_p - 1)} \\quad ; \\quad g_p = \\min saltos(p \\to Alameda) \\quad ; \\quad Score_{aislado} = 0"],
    expected: "Grado 1 (toca la Alameda) = 100 · grado 2 = 50 · grado 3 = 25 · grado 4 = 12.5 … En el ranking se usa normalizado (score/100). Al priorizar ejes, la distribución de grados se desplaza hacia arriba.",
    limits: [
      "La tolerancia de 100 m puede unir ejes paralelos cercanos que no se conectan en terreno (veredas opuestas de una autopista); es el costo de absorber desconexiones de dibujo.",
      "El grado es topológico, no métrico: un afluente de 8 km y uno de 300 m que tocan la Alameda puntúan igual — combinar con km/costo para desempatar.",
      "La raíz depende del nombre del eje («Alameda») en la red SECTRA y del proyecto ALAMEDA TRAMO 3; si se renombran, actualizar el filtro.",
    ],
    refs: [
      "Strahler, A. (1957). Quantitative analysis of watershed geomorphology. Trans. AGU 38(6).",
      "Implementación: src/fractal.js — FRACTAL.calcularPrioridadFractal(ejeFC, proyectosFC, {toleranciaM, factorAtenuacion}).",
    ],
  },

  crit_demanda: {
    title: "Demanda OD habilitada",
    desc: "Viajes diarios al trabajo (vector censal origen→destino a 52 comunas) que pasan de inviables a viables con el proyecto. Es la métrica central del enfoque: no basta vivir cerca de la ciclovía — la red resultante debe llevar a las personas a su destino. Un viaje es viable cuando una misma subred conecta el origen (≤ δ_O) con la comuna destino (cobertura ≥ umbral).",
    eq: ["D_p = \\sum_{h} \\sum_{d=1}^{52} f_{h,d} \\cdot \\mathbb{1}\\left[ v_{h,d}^{con\\,p} \\wedge \\neg v_{h,d}^{sin\\,p} \\right]"],
    expected: "0–35.000 viajes/día por proyecto. La cartera completa habilita ~2 M de los 2.57 M de viajes OD regionales.",
    limits: [
      "El vector OD es solo motivo trabajo (censo); no incluye estudios, compras ni salud.",
      "Viabilidad binaria: no modela elección modal (un viaje viable no implica que se realice en bicicleta).",
      "El destino del viaje es el lugar de trabajo (censo 2024), resuelto a nivel comunal: dentro de la comuna destino la posición exacta del empleo no es observable.",
    ],
    refs: [
      "Vega, Greene & Ortúzar (2024), op. cit.",
      "Ortúzar & Willumsen (2011), op. cit., cap. 5 (distribución de viajes).",
      "INE (2024). Censo — matriz de conmutación laboral por manzana.",
    ],
  },

  crit_estudiantes: {
    title: "Generación estudiantil",
    desc: "Estudiantes que ganan acceso con el proyecto, en dos componentes: (a) educación media — generación de proximidad: asisten a establecimientos cercanos a su residencia, basta ganar acceso a la red; (b) educación superior — viaje con destino: requiere que alguna subred accesible desde su hex alcance una sede con matrícula (atracción). El proyecto puede habilitarlo por cercanía o por interconexión de subredes.",
    eq: ["S_p = \\underbrace{\\sum_{h \\in H(p)} estM_h \\cdot \\mathbb{1}[\\neg con_h]}_{\\text{media: proximidad}} + \\underbrace{\\sum_{h} estS_h \\cdot \\mathbb{1}\\left[ alc_{h}^{con\\,p} \\wedge \\neg alc_{h}^{sin\\,p} \\right]}_{\\text{superior: } \\to \\text{sede}}"],
    expected: "0–15.000 estudiantes por proyecto. 170.933 estudiantes superiores viven hoy sin sede alcanzable por red ciclable.",
    limits: [
      "Educación media supone matrícula cercana al hogar (sin datos de establecimiento real por estudiante).",
      "Para superior basta alcanzar una sede cualquiera; no verifica que sea la sede donde estudia.",
      "La matrícula 2025 de la sede no se cruza con la residencia de sus alumnos.",
    ],
    refs: [
      "SIES — Mineduc (2025). Matrícula de educación superior por sede.",
      "INE (2024). Censo — asistencia educacional por manzana.",
      "Rodríguez, D. & Joo, J. (2004). The relationship between non-motorized mode choice and the local physical environment. Transportation Research D 9(2).",
    ],
  },

  crit_costoInv: {
    title: "Eficiencia económica",
    desc: "Indicador inverso del costo total estimado del proyecto: premia carteras que logran beneficio con menor inversión. El costo se estima por km según tipología (costo unitario referencial ajustable) mientras no se cargue el CSV de costos oficiales.",
    eq: ["\\hat{c}_p = 1 - \\frac{C_p}{\\max_q C_q}, \\qquad C_p = L_p \\cdot c_{km}"],
    expected: "ĉ_p ∈ [0, 1]. Proyectos cortos puntúan alto; el costo referencial usado es ~$280 M/km (segregada estándar).",
    limits: [
      "Costo lineal por km: ignora obras singulares (puentes, pasos desnivelados) que dominan el costo real de varios corredores.",
      "No es una evaluación social (no calcula VAN ni TIR); para eso se requiere perfil de demanda y precios sociales MDS.",
    ],
    refs: [
      "MDS (2024). Precios sociales vigentes — Sistema Nacional de Inversiones.",
      "MINVU (2015). Vialidad Ciclo-Inclusiva: Recomendaciones de Diseño.",
    ],
  },

  /* ===================== Umbrales ===================== */
  um_distOrigen: {
    title: "Acceso origen a red",
    desc: "Distancia máxima desde la residencia (centroide del hex) hasta la red ciclable para considerar que la persona tiene acceso en el origen del viaje. Es el umbral δ_O de la condición de beneficio.",
    eq: ["acceso_O(h) \\iff d(h, \\text{red}) \\le \\delta_O"],
    expected: "Default 700 m (~3 min en bicicleta, ~9 min a pie). Rango de literatura: 300–1.000 m; valores mayores diluyen el indicador.",
    limits: [
      "Distancia euclidiana, no de red vial.",
      "Aplicada al centroide del hex (600 m), por lo que la precisión efectiva es ± 300 m.",
    ],
    refs: [
      "Vega, Greene & Ortúzar (2024), op. cit.",
      "Kuzmyak, R. et al. (2014). Estimating Bicycling and Walking for Planning and Project Development. NCHRP Report 770.",
    ],
  },
  um_distDestino: {
    title: "Acceso destino a red",
    desc: "Distancia máxima entre la red ciclable y el destino del viaje (manzanas de la comuna destino o sede de educación superior) para considerar el destino servido. Es el umbral δ_D de la condición de beneficio en el extremo de atracción.",
    eq: ["acceso_D(d) \\iff d(\\text{red}, d) \\le \\delta_D"],
    expected: "Default 700 m, simétrico con el origen. Para destinos laborales densos puede reducirse a 500 m sin gran pérdida.",
    limits: [
      "La comuna destino se considera servida según el % de su población a ≤ δ_D de la subred (ver Cobertura mínima destino), un proxy de la localización real de los empleos.",
    ],
    refs: [
      "Vega, Greene & Ortúzar (2024), op. cit.",
      "Geurs & van Wee (2004), op. cit.",
    ],
  },
  um_connectTol: {
    title: "Tolerancia de empalme",
    desc: "Separación máxima entre extremos/trazados de dos ejes para considerarlos conectados en el mismo componente de red. Modela cruces de calzada y discontinuidades menores que un ciclista resuelve sin infraestructura dedicada.",
    eq: ["G_i \\sim G_j \\iff \\min_{a \\in G_i, b \\in G_j} d(a,b) \\le \\tau"],
    expected: "Con τ = 50 m la red SECTRA se fragmenta en >200 componentes; con τ = 300 m colapsa a ~60.",
    limits: [
      "No verifica que el empalme sea físicamente cruzable (autopistas, canales).",
      "Sensibilidad alta: es el parámetro que más afecta el conteo de componentes y, con ello, el criterio de interconexión.",
    ],
    refs: [
      "Furth, Mekuria & Nixon (2012), op. cit. (concepto de islas de bajo estrés).",
    ],
  },
  um_habThreshold: {
    title: "Cobertura mínima destino",
    desc: "Porcentaje mínimo de la población de la comuna destino que debe estar a ≤ δ_D de la subred para considerar que esa subred 'sirve' el destino. Evita que tocar una esquina de una comuna grande cuente como servirla completa.",
    eq: ["sirve(K, c) \\iff \\frac{pob_{\\le \\delta_D}(K, c)}{pob_c} \\ge \\theta"],
    expected: "Subirlo endurece la viabilidad y reduce la demanda OD habilitada total; bajarlo la aumenta.",
    limits: [
      "El destino del viaje censal es el lugar de trabajo, pero el censo lo entrega a nivel comunal: la localización del empleo dentro de la comuna se aproxima espacialmente con la distribución de su población.",
      "Umbral único para todas las comunas, sin distinguir su tamaño.",
    ],
    refs: [
      "Vega, Greene & Ortúzar (2024), op. cit.",
    ],
  },
  um_porcProtegido: {
    title: "% protegido mínimo del viaje",
    desc: "Fracción mínima del recorrido que debe transcurrir por infraestructura ciclable (vs. calzada compartida) para que el viaje cuente como beneficiado. Refleja que la disposición a pedalear cae abruptamente cuando el viaje exige tramos largos en tráfico mixto.",
    eq: ["\\frac{L_{protegido}}{L_{total}} \\ge \\pi_{min}"],
    expected: "Default 50%. Ciclistas 'interesados pero preocupados' (mayoría de la población) requieren 70–100% protegido.",
    limits: [
      "En la implementación actual se aproxima por subred (la viabilidad exige red continua), no por descomposición tramo a tramo de cada ruta.",
    ],
    refs: [
      "Dill, J. & McNeil, N. (2013). Four Types of Cyclists? Transportation Research Record 2387.",
      "Furth, Mekuria & Nixon (2012), op. cit.",
    ],
  },
  um_aproxFinal: {
    title: "Aproximación final sin infraestructura",
    desc: "Tramo final del viaje (entre la red y el destino exacto) que se acepta recorrer sin infraestructura ciclable, típicamente por calles locales de baja velocidad.",
    eq: ["d_{final} \\le \\alpha"],
    expected: "Default 700 m. En zonas céntricas con calles tranquilas puede ampliarse; en torno a vías expresas debería reducirse.",
    limits: [
      "No discrimina la jerarquía vial del tramo final (una local de 30 km/h y una troncal pesan igual).",
    ],
    refs: [
      "Mekuria, M., Furth, P. & Nixon, H. (2012). Low-Stress Bicycling and Network Connectivity (LTS niveles 1-2 para tramos finales).",
    ],
  },
  um_tiempoMax: {
    title: "Tiempo máximo de viaje",
    desc: "Duración máxima aceptable del viaje en bicicleta para considerarlo beneficiable. A velocidad de referencia, define un radio máximo de viaje y filtra pares OD demasiado lejanos para ser ciclables.",
    eq: ["t_{od} = \\frac{C_{od}}{v_{ref}} \\le t_{max}"],
    expected: "Default 60 min (~15 km a 15 km/h). La mediana de viajes ciclistas reales en Santiago es ~25 min (EOD 2012).",
    limits: [
      "Umbral duro: un viaje de 61 min cuenta 0 (sin decaimiento gradual tipo función de impedancia).",
      "No considera bicicletas eléctricas, que amplían el radio efectivo ~2×.",
    ],
    refs: [
      "SECTRA (2012). Encuesta Origen-Destino de Viajes, Santiago.",
      "Iacono, M., Krizek, K. & El-Geneidy, A. (2010). Measuring non-motorized accessibility. J. of Transport Geography 18(1).",
    ],
  },
  um_costoPorKm: {
    title: "Costo por kilómetro",
    desc: "Valor unitario de construcción aplicado a toda la cartera para estimar el costo total de cada proyecto. El costo de un proyecto se obtiene multiplicando su longitud por este valor, lo que permite probar distintos escenarios de costo (estándar urbano, segregada con obras mayores, etc.) sin editar la cartera. Alimenta tanto el criterio de eficiencia económica del multicriterio como la restricción del modo presupuesto.",
    eq: ["C_p = L_p \\cdot c_{km}"],
    expected: "Por defecto 100 M/km. Rango editable 1–5.000 M/km. Referencias: una ciclobanda demarcada bordea 30–80 M/km; una ciclovía segregada con obras de pavimento, semaforización y saneamiento puede superar 300–500 M/km.",
    limits: [
      "Aplica un valor único a toda la cartera: no distingue diferencias de costo por tipología (segregada vs. demarcada), obras de arte o expropiaciones.",
      "Para evaluación de inversión definitiva debe reemplazarse por los presupuestos de ingeniería de detalle de cada proyecto.",
    ],
    refs: [
      "MINVU / SECTRA. Recomendaciones de diseño y costos referenciales de infraestructura ciclo-inclusiva.",
    ],
  },

  um_presupuesto: {
    title: "Presupuesto disponible",
    desc: "Restricción presupuestaria del proceso secuencial: el solver incorpora proyectos en orden de puntaje hasta agotar este monto. Permite responder '¿qué construyo primero con $X?' en vez de ordenar la cartera completa.",
    eq: ["\\max \\sum_{p \\in S} B_p \\quad \\text{s.a.} \\quad \\sum_{p \\in S} C_p \\le B"],
    expected: "La cartera PMC completa cuesta ~$390 mil M (estimación referencial). Presupuestos típicos de un programa cuatrienal: $50–150 mil M.",
    limits: [
      "El secuencial greedy no garantiza el óptimo de la mochila (knapsack); con presupuestos muy ajustados un algoritmo exacto puede diferir ~5-10%.",
    ],
    refs: [
      "Duthie, J. & Unnikrishnan, A. (2014). Optimization framework for bicycle network design. J. of Transportation Engineering 140(7).",
    ],
  },

  /* ===================== Costo percibido ===================== */
  sec_costoPercibido: {
    title: "Costo percibido de arcos",
    desc: "El costo de recorrer un arco no es solo su longitud: se multiplica por factores de infraestructura, jerarquía vial, pendiente y cruces. Un km en ciclovía segregada 'cuesta' menos que un km en avenida sin protección. Estos factores alimentan el cálculo de rutas y la reducción de costo OD.",
    eq: ["C_a = L_a \\cdot F^{infra}_a \\cdot F^{jerarquia}_a \\cdot F^{pend}_a \\cdot F^{cruce}_a"],
    expected: "Factores entre 0.5 (muy atractivo) y 2.0 (muy disuasivo). La evidencia de preferencias reveladas sitúa la penalización de tráfico mixto en avenidas en 1.4–1.7.",
    limits: [
      "Factores multiplicativos asumen independencia entre atributos (pendiente en avenida no penaliza más que la suma de ambos).",
      "Valores de literatura internacional; idealmente se calibran con encuestas de preferencias locales.",
    ],
    refs: [
      "Broach, Dill & Gliebe (2012), op. cit.",
      "Hood, J., Sall, E. & Charlton, B. (2011). A GPS-based bicycle route choice model for San Francisco. Transportation Letters 3(1).",
      "MINVU (2015). Vialidad Ciclo-Inclusiva.",
    ],
  },
  cp_segregada: {
    title: "Bonificación ciclovía segregada",
    desc: "Factor < 1 que reduce el costo percibido de arcos con ciclovía segregada: los ciclistas aceptan rutas más largas con tal de usar infraestructura protegida.",
    eq: ["F^{infra} = 0.85 \\Rightarrow 1\\,\\text{km segregado} \\equiv 850\\,\\text{m percibidos}"],
    expected: "0.7–0.9 según evidencia de elección de ruta (los ciclistas desvían hasta un 15–30% de distancia extra por usar segregada).",
    limits: ["No distingue calidad de la segregación (ancho, estado de pavimento, iluminación)."],
    refs: ["Broach, Dill & Gliebe (2012), op. cit."],
  },
  cp_primaria: {
    title: "Penalización avenida primaria",
    desc: "Factor > 1 sobre arcos en vías primarias/troncales sin protección: alto flujo y velocidad vehicular disuaden el uso ciclista.",
    eq: ["F^{jerarquia} \\in [1.0, 2.0]"],
    expected: "1.3–1.7. La penalización equivale al desvío que un ciclista acepta para evitar la vía.",
    limits: ["La jerarquía OSM (highway=primary) no siempre refleja velocidad de operación real."],
    refs: ["Hood, Sall & Charlton (2011), op. cit.", "Mekuria, Furth & Nixon (2012) — Level of Traffic Stress."],
  },
  cp_pendiente: {
    title: "Penalización pendiente >5%",
    desc: "Factor > 1 en arcos con pendiente sostenida sobre 5%: el esfuerzo físico reduce la disposición a pedalear, especialmente en viajes utilitarios. Cada proyecto trae ahora su pendiente media y máxima reales (promedio ponderado por longitud de tramo, atributo pend_med_pct del catastro); en la Región Metropolitana la mayoría de los ejes es plana (media <2%), por lo que la penalización afecta a un subconjunto acotado de corredores hacia el piedemonte.",
    eq: ["F^{pend} = 1 + \\beta \\cdot \\max(0, s - 0.05)"],
    expected: "1.2–1.5 para pendientes 5–8%. Sobre 8% el efecto es casi prohibitivo para viajes cotidianos.",
    limits: ["Pendiente media del arco; no captura cuestas cortas y empinadas dentro de un arco largo.", "Sin ajuste por bicicletas eléctricas."],
    refs: ["Broach, Dill & Gliebe (2012), op. cit.", "Iacono, Krizek & El-Geneidy (2010), op. cit."],
  },
  cp_cruce: {
    title: "Penalización cruce crítico",
    desc: "Factor > 1 que castiga arcos que atraviesan intersecciones de alto riesgo o demora (cruces de autopistas, rotondas, intersecciones sin semáforo en vías rápidas).",
    eq: ["F^{cruce} \\in [1.0, 1.6]"],
    expected: "1.1–1.4. Cada cruce crítico equivale a 100–300 m percibidos adicionales.",
    limits: ["Requiere identificación de cruces críticos desde OSM (crossing/barrier), aún parcial en la región."],
    refs: ["Mekuria, Furth & Nixon (2012), op. cit.", "Winters, M. et al. (2011). Motivators and deterrents of bicycling. Transportation 38."],
  },

  /* ===================== KPIs ===================== */
  kpi_pobBase: {
    title: "Población atendida base",
    desc: "Ocupados que residen a ≤ δ_O de la red ciclable vigente (red SECTRA + proyectos ya priorizados en la sesión). Es la línea base contra la cual se mide el aporte marginal de cada proyecto, y se actualiza en cada iteración del proceso secuencial.",
    eq: ["Pob_{base} = \\sum_{h} pob_h \\cdot \\mathbb{1}\\left[ d(h, \\text{red}) \\le \\delta_O \\right]"],
    expected: "~2.37 M con la red SECTRA actual (68.9% de los 3.44 M de ocupados RM). Crece con cada proyecto incorporado.",
    limits: ["Acceso geométrico ≠ acceso funcional: estar cerca de la red no implica poder llegar al destino (ver Demanda OD habilitada)."],
    refs: ["Vega, Greene & Ortúzar (2024), op. cit."],
  },
  kpi_brecha: {
    title: "Brecha de cobertura",
    desc: "Ocupados sin acceso a la red ciclable vigente (complemento de la población atendida). Es el universo máximo que la cartera de proyectos puede incorporar por cobertura directa.",
    eq: ["Brecha = Pob_{total} - Pob_{base}"],
    expected: "~1.07 M de ocupados hoy. Concentrada en periferia sur, poniente y norte de la RM.",
    limits: ["No toda la brecha es cerrable con ciclovías: parte corresponde a zonas de muy baja densidad o topografía adversa."],
    refs: ["Lucas (2012), op. cit."],
  },
  kpi_red: {
    title: "Red base",
    desc: "Kilómetros y ejes de infraestructura ciclable existente considerados como condición base (catastro SECTRA dic-2025), más los proyectos incorporados durante la sesión de priorización.",
    eq: ["L_{red} = \\sum_{e \\in \\text{SECTRA}} L_e + \\sum_{p \\in \\text{priorizados}} L_p"],
    expected: "~940 km / 601 ejes SECTRA al inicio. La cartera PMC completa (120 proyectos) agrega ~411 km.",
    limits: ["Incluye tipologías heterogéneas (ciclovía, ciclobanda, senda multipropósito, cicloparque) sin ponderar su calidad."],
    refs: ["SECTRA (2025). Catastro de ciclovías RM."],
  },
  kpi_marginal: {
    title: "Marginal acumulado",
    desc: "Incremento total de población atendida logrado por los proyectos priorizados en la sesión, medido como diferencia entre la población base actual y la población base original (sin proyectos). Equivale al área ganada de la curva de beneficio acumulado.",
    eq: ["\\Delta_{acum} = Pob_{base}^{actual} - Pob_{base}^{original}"],
    expected: "0 al inicio; la cartera completa suma ~580 mil ocupados adicionales con umbrales por defecto.",
    limits: ["Mide solo cobertura de origen; el beneficio de viabilidad OD (viajes habilitados) se reporta por separado en cada ficha."],
    refs: ["Vega, Greene & Ortúzar (2024), op. cit."],
  },

  /* ===================== Secciones ===================== */
  sec_sensibilidad: {
    title: "Análisis de sensibilidad",
    desc: "Mide la estabilidad del ranking ante cambios de supuestos. Re-puntúa la cartera bajo los 8 escenarios predefinidos más perturbaciones de ±50% sobre cada peso, y registra para cada proyecto su posición promedio, mejor, peor, rango y frecuencia en top-5/10/20. Proyectos robustos mantienen buena posición en casi todos los escenarios; los sensibles cambian fuertemente. Como el puntaje deriva de indicadores ya normalizados, el análisis no requiere re-correr el motor.",
    eq: ["\\text{pos}_p^{(s)} = \\text{rank}\\big(\\textstyle\\sum_i w_i^{(s)}\\, n_{p,i}\\big)", "\\text{robusto} \\iff \\text{freq}_{top10} \\ge 80\\% \\;\\wedge\\; \\text{rango pequeño}"],
    expected: "Con la cartera actual: un subconjunto de proyectos de alto aporte (gran población marginal y conexión de subredes) se mantiene en top-10 en casi todos los escenarios; otros dependen de un solo criterio y son volátiles.",
    limits: [
      "Explora sensibilidad a los PESOS; la sensibilidad a parámetros del motor (distancias, umbral) requiere re-correr el motor y no está incluida en este barrido rápido.",
      "Las perturbaciones son uniformes ±50%; no representan una distribución de probabilidad de los pesos.",
    ],
    refs: ["Saltelli et al. (2008). Global Sensitivity Analysis."],
  },

  sec_carteras: {
    title: "Comparación de carteras",
    desc: "Compara conjuntos alternativos de proyectos: top-10 por cada criterio, la cartera secuencial recomendada por el solver y la selección manual del usuario. Población con acceso y población beneficiada se calculan como UNIÓN de hexágonos únicos aportados por los proyectos (sin doble conteo). Kilómetros, inversión y número de proyectos son sumas exactas. Demanda habilitada y matrícula se reportan como Σ marginal y se interpretan como cota superior, porque un mismo viaje o matrícula puede ser servido por más de un proyecto.",
    eq: ["P_{\\text{cartera}} = \\sum_{h \\in \\bigcup_p H_p} \\text{pob}(h)"],
    expected: "La cartera secuencial recomendada suele dominar en población por peso invertido; las carteras top-por-criterio muestran el trade-off entre demanda, equidad y continuidad.",
    limits: [
      "La unión de aportes individuales no captura sinergia (dos proyectos juntos pueden habilitar más que la suma de sus aportes por separado); para el total exacto con sinergia debe usarse la priorización secuencial.",
      "Demanda y matrícula son cotas superiores (Σ marginal).",
    ],
    refs: ["Vega, Greene & Ortúzar (2024)."],
  },

  sec_escenarios: {
    title: "Escenarios de ponderación",
    desc: "Configuraciones predefinidas de pesos multicriterio que representan distintas prioridades de política pública (equidad, demanda, continuidad, eficiencia, educación, integración metropolitana). Seleccionar un escenario carga sus pesos; ajustar cualquier peso manualmente convierte la sesión en «personalizado». El escenario activo se registra en todas las exportaciones para trazabilidad.",
    eq: ["w^{(esc)} = (w_1, w_2, \\dots, w_n) \\;\\text{fijo por escenario}"],
    expected: "8 escenarios. El escenario «Seguridad vial» pondera fuertemente la siniestralidad ciclista observada (CONASET 2020–2024) acompañada de continuidad de red, equidad y población; mide peligrosidad observada del corredor, no reducción esperada de siniestros.",
    limits: [
      "Los pesos de cada escenario son una propuesta metodológica, no un mandato normativo; deben validarse con la contraparte técnica del GORE.",
      "El escenario de seguridad vial usa siniestralidad histórica como proxy de exposición/peligrosidad; no modela el efecto causal de la nueva infraestructura sobre los siniestros.",
    ],
    refs: ["Vega, Greene & Ortúzar (2024). Evaluación multicriterio de infraestructura ciclo-inclusiva."],
  },

  sec_secuencial: {
    title: "Priorización secuencial",
    desc: "Proceso iterativo greedy: (1) cada proyecto se evalúa individualmente contra la condición base — se coloca, se mide, se retira; (2) terminado el barrido, el de mayor puntaje se incorpora definitivamente a la base; (3) los restantes se reevalúan contra la nueva base — sus aportes cambian porque la red creció (un conector puede perder valor si otro ya unió esas subredes, o ganarlo si ahora empalma con la red ampliada); (4) se repite hasta agotar cartera o presupuesto. El orden resultante es el plan de construcción que maximiza el aporte incremental en cada paso.",
    eq: ["p^*_t = \\arg\\max_{p \\notin S_{t-1}} P_p \\left( \\text{base} \\cup S_{t-1} \\right), \\qquad S_t = S_{t-1} \\cup \\{ p^*_t \\}"],
    expected: "Para la cartera PMC (120 proyectos): ~120 iteraciones × ~1.2 s. El orden difiere del ranking estático especialmente después de la 10ª incorporación.",
    limits: [
      "Greedy no garantiza el óptimo global del conjunto (la combinación de 2 proyectos 'mediocres' que se complementan puede superar al líder individual).",
      "Los pesos multicriterio se mantienen fijos durante toda la secuencia.",
    ],
    refs: [
      "Larsen, J., Patterson, Z. & El-Geneidy, A. (2013). Build it. But where? Int. J. of Sustainable Transportation 7(4).",
      "Duthie & Unnikrishnan (2014), op. cit.",
    ],
  },
  sec_curva: {
    title: "Curva de beneficio acumulado",
    desc: "Población marginal acumulada al incorporar proyectos en el orden del ranking vigente. Su forma cóncava típica revela rendimientos decrecientes: los primeros proyectos capturan la mayor parte del beneficio. El punto donde la pendiente cae bajo el costo de oportunidad sugiere el corte de cartera.",
    eq: ["B(k) = \\sum_{t=1}^{k} \\Delta Pob_{p^*_t}"],
    expected: "Cóncava creciente. En la cartera PMC, los primeros 20 proyectos suelen capturar ~60% del beneficio total.",
    limits: ["La curva mostrada usa el orden del ranking actual; solo tras correr el solver secuencial refleja el orden óptimo greedy."],
    refs: ["Vega, Greene & Ortúzar (2024), op. cit."],
  },

  /* ===================== Capas ===================== */
  capa_existente: {
    title: "Red ciclable existente",
    desc: "Catastro SECTRA de infraestructura ciclable construida en la RM (dic-2025): ciclovías, ciclobandas, sendas multipropósito y cicloparques. Constituye la condición base del análisis — todo aporte de un proyecto se mide contra esta red.",
    eq: null,
    expected: "601 ejes · ~940 km. El número de componentes conexos se calcula dinámicamente según la tolerancia de empalme τ vigente (default 150 m).",
    limits: ["El catastro puede omitir obras municipales recientes.", "Geometrías heterogéneas: algunos ejes duplican calzadas paralelas."],
    refs: ["SECTRA (2025). Catastro de ciclovías RM."],
  },
  capa_proyectos: {
    title: "Ciclovías proyectadas (cartera PMC)",
    desc: "Cartera del Plan Maestro de Ciclovías del GORE RM (mayo 2026): 120 proyectos comunales e intercomunales a evaluar y priorizar uno a uno contra la condición base.",
    eq: null,
    expected: "120 proyectos · ~411 km. Trazados en línea discontinua naranja; al priorizarse pasan a sólido azul (se integran a la base).",
    limits: ["Trazados de planificación: el diseño de detalle puede modificar recorridos.", "Sin costos oficiales por proyecto aún (se estiman por km)."],
    refs: ["GORE RM (2026). Plan Maestro de Ciclovías — cartera comunal e intercomunal."],
  },
  capa_od: {
    title: "Población OD (centroides)",
    desc: "66.873 manzanas censales agregadas a 1.589 hexágonos de ~600 m. Cada hex conserva: ocupados (generan el vector OD laboral hacia 52 comunas), personas totales, estudiantes de media y superior, y sus 10 principales destinos de viaje. Azul = conectado a la red base; naranjo = no atendido.",
    eq: null,
    expected: "3.44 M ocupados · 7.06 M personas · 2.57 M viajes/día. Click en un hex abre su ficha con destinos y viabilidad.",
    limits: ["La agregación hexagonal desplaza la población hasta ±300 m de su manzana real.", "Vector OD solo motivo trabajo."],
    refs: ["INE (2024). Censo de Población y Vivienda.", "Vega, Greene & Ortúzar (2024), op. cit."],
  },
  capa_heat: {
    title: "Heatmap demanda potencial",
    desc: "Densidad de población ocupada ponderada por kernel gaussiano, útil para lectura rápida de concentraciones de demanda potencial sin el detalle hex a hex.",
    eq: null,
    expected: "Manchas intensas en pericentro sur-poniente y corredores densos. Complementa (no reemplaza) la capa de centroides.",
    limits: ["El radio del kernel varía con el zoom: es una visualización, no una superficie estadística."],
    refs: ["Silverman, B.W. (1986). Density Estimation for Statistics and Data Analysis. Chapman & Hall."],
  },
  capa_edu: {
    title: "Sedes de educación superior",
    desc: "152 sedes (universidades, IP, CFT) con matrícula 2025, como polos de atracción de viajes estudiantiles. El diámetro del círculo es proporcional a la matrícula. Un estudiante superior tiene su viaje habilitado cuando una subred accesible desde su hex alcanza al menos una sede.",
    eq: null,
    expected: "371.747 matrículas. Solo 382 de 1.589 hexes tienen hoy una sede alcanzable vía red ciclable.",
    limits: ["La matrícula no se cruza con la residencia de los alumnos de cada sede.", "Sedes fuera de la RM no incluidas."],
    refs: ["SIES — Mineduc (2025). Matrícula por sede."],
  },

  capa_siniestros: {
    title: "Siniestros ciclistas (CONASET)",
    desc: "4.446 siniestros de tránsito con participación de bicicletas en la RM (2020–2024). Color por severidad: rojo = con fallecidos, naranja = lesionado grave, ámbar = lesionados/leves, gris = solo daños. A vista general se muestra como mapa de calor de densidad ponderada; al acercar, como puntos individuales con ficha.",
    eq: null,
    expected: "94 fallecidos y 840 siniestros con lesionado grave en 5 años. Alimenta el criterio y el escenario de Seguridad vial.",
    limits: ["Localización a nivel de intersección/dirección.", "No incorpora exposición (flujo ciclista) ni subregistro de siniestros sin parte policial."],
    refs: ["CONASET (2025). Observatorio de datos de siniestros de tránsito."],
  },

  capa_monumentos: {
    title: "Monumentos nacionales (CMN)",
    desc: "351 puntos de Monumentos Nacionales de la RM (Monumentos Históricos, Zonas Típicas o Pintorescas y Santuarios de la Naturaleza). Se asocian a cada proyecto por proximidad (≤300 m) como dato de contexto patrimonial.",
    eq: null,
    expected: "289 Monumentos Históricos · 49 Zonas Típicas · 13 Santuarios de la Naturaleza. Click en un punto abre su ficha (nombre, categoría, comuna).",
    limits: ["Puntos, no polígonos: no delimitan la superficie protegida de las Zonas Típicas.", "Algunos bienes tienen varios componentes como puntos separados."],
    refs: ["Consejo de Monumentos Nacionales (2025)."],
  },

  capa_ferias: {
    title: "Ferias libres y persas",
    desc: "395 tramos de calle donde se instalan ferias libres y persas en la RM. Cada feria opera en días específicos de la semana (uno o dos, según el caso) y ocupa la calzada, generando interferencias temporales con el tránsito. Capa de contexto para evaluar compatibilidad de uso del espacio vial al diseñar una ciclovía.",
    eq: null,
    expected: "395 ferias en 34 comunas (168 ferias, 213 feria+persa, 14 persas). Sábado y domingo son los días de mayor actividad. Click en un tramo abre su ficha (nombre, ubicación, días, horario, puestos).",
    limits: [
      "NO altera el motor de cálculo ni el puntaje: es información de contexto para el diseño.",
      "Cada proyecto identifica las ferias que cruza su tramo (≤80 m de la traza) y la unión de días en que operan; una ciclovía sobre una calle-feria exige solución de coexistencia (desvío, horario, sección).",
      "El catastro puede no reflejar cambios recientes de recorrido o días de cada feria.",
    ],
    refs: ["Catastro de Ferias Libres y Persas, Región Metropolitana."],
  },

  capa_metro: {
    title: "Estaciones de Metro (hotspots intermodales)",
    desc: "126 estaciones de la red de Metro de Santiago (GTFS). Se muestran como hotspots intermodales: los ejes que las tocan o conectan (≤250 m) alimentan el criterio de intermodalidad bici-metro. Click en una estación abre su ficha.",
    eq: null,
    expected: "126 estaciones. Los paraderos de bus (~12.000, también del GTFS) NO se dibujan: se cuentan por eje como indicador de complejidad de diseño, visible en la ficha de cada proyecto.",
    limits: ["Puntos de estación; no representan accesos ni andenes individuales."],
    refs: ["GTFS Santiago — DTPM (2025)."],
  },

  capa_paraderos: {
    title: "Paraderos de bus (conteo por eje)",
    desc: "Nube de ~12.000 paraderos de bus del GTFS de Santiago. No se visualizan como puntos: se cuentan por eje (paraderos a ≤40 m de la traza) como indicador de COMPLEJIDAD de diseño — un corredor con muchos paraderos implica más conflictos de sección, paradas y giros. Es informativo: no altera el puntaje.",
    eq: null,
    expected: "El conteo aparece en la ficha de cada proyecto y en las exportaciones. No hay capa visual asociada.",
    limits: ["Conteo por proximidad (≤40 m); no distingue paraderos por sentido ni frecuencia."],
    refs: ["GTFS Santiago — DTPM (2025)."],
  },

  capa_parques: {
    title: "Parques y áreas verdes (atractores)",
    desc: "754 parques y áreas verdes de la RM (24,8 km²), reducidos a centroide + radio efectivo. Operan como hotspots atractores de viajes recreativos ponderados por tamaño: alimentan el criterio 'Atractor de parques' del ranking. En el mapa el símbolo escala con la superficie; click abre su ficha.",
    eq: null,
    expected: "754 parques, de plazas vecinales (~0,2 ha) a parques metropolitanos (~244 ha). Un eje conecta un parque si pasa a ≤ radio + 150 m de su centroide.",
    limits: ["Centroide + radio efectivo, no el borde real del polígono.", "El tamaño es proxy del atractivo; no considera equipamiento ni calidad."],
    refs: ["Catastro de parques y áreas verdes RM (2023)."],
  },

  capa_comunas: {
    title: "Límites comunales (RM)",
    desc: "52 comunas de la Región Metropolitana con su límite administrativo oficial (fuente: shapefile regional provisto, EPSG:32719, reproyectado a WGS84). Sirve como capa de referencia visual y como fuente de verdad para asignar comuna a proyectos sin el campo declarado: cada segmento se prueba punto-en-polígono contra estos límites (en vez de aproximar por el hexágono OD más cercano).",
    eq: null,
    expected: "52 polígonos (comunas) cubriendo toda la RM, sin huecos entre comunas vecinas.",
    limits: ["Simplificado a 5 decimales (~1 m) para aligerar el archivo; no afecta la asignación de comuna.", "Límite administrativo, no coincide exactamente con límites naturales (ríos, cerros) en zonas rurales."],
    refs: ["Capa de límites comunales, Región Metropolitana de Santiago (shapefile regional, EPSG:32719)."],
  },

  /* ===================== Otros ===================== */
  sec_perfil: {
    title: "Perfil de usuario",
    desc: "Tipología de ciclista que calibra la tolerancia al estrés de tráfico del análisis. La literatura clasifica la población en cuatro grupos con disposiciones muy distintas: el diseño para 'interesados pero preocupados' (~50-60% de la población) exige red protegida continua.",
    eq: null,
    expected: "Default: ciclista general (estrés bajo, LTS 1-2). El perfil experto tolera tráfico mixto y amplía la red utilizable.",
    limits: ["Los porcentajes de cada tipo provienen de estudios norteamericanos; la distribución local puede diferir."],
    refs: ["Dill & McNeil (2013), op. cit.", "Geller, R. (2009). Four Types of Cyclists. Portland Bureau of Transportation."],
  },
  sec_modo: {
    title: "Modo de priorización",
    desc: "Selecciona el criterio rector del ranking: un indicador único (población, costo OD, equidad, costo-eficiencia) o el puntaje multicriterio ponderado. Los modos de criterio único son útiles para análisis de sensibilidad: revelan qué proyectos son robustos (líderes bajo cualquier criterio) y cuáles dependen de los pesos.",
    eq: null,
    expected: "Default: multicriterio. Un proyecto en el top-10 de los 5 modos es una apuesta segura.",
    limits: ["El modo activo afecta el ranking mostrado y el orden del solver secuencial."],
    refs: ["Macharis, de Witte & Ampe (2009), op. cit."],
  },

  seg_modo: {
    title: "Siniestralidad considerada (Todos / KSI)",
    desc: "Define qué siniestros pesan en el criterio de seguridad vial. «Todos» usa el peso CONASET completo (fallecidos, graves, menos graves y leves). «Solo fatales + graves» (KSI, killed or seriously injured) restringe a los siniestros con víctimas graves o fatales, siguiendo la lógica de redes de alta lesividad de Vision Zero: concentra la prioridad en los corredores que matan y lesionan gravemente. En ambos modos cada siniestro se pondera además por tratabilidad y por distancia a la traza.",
    eq: null,
    expected: "Default: Todos. En modo KSI, un proyecto sin fallecidos ni graves en su corredor cae a puntaje de seguridad 0 aunque acumule muchos siniestros leves.",
    limits: ["KSI reduce la muestra y puede aumentar el ruido aleatorio en corredores con pocos eventos graves."],
    refs: ["Vision Zero Network. High Injury Network."],
  },
};

/* ===================== Enlaces DOI / fuente de referencias ===================== */
/* Se asocian por subcadena del autor: cada ref string que contenga la clave recibe el enlace. */
const REF_LINKS = [
  { match: "Vega",                 doi: "10.1016/j.tbs.2023.100674" },
  { match: "Geurs",                doi: "10.1016/j.jtrangeo.2003.10.005" },
  { match: "Broach",               doi: "10.1016/j.tra.2012.07.005" },
  { match: "Ortúzar & Willumsen",  doi: "10.1002/9781119993308" },
  { match: "Macharis",             doi: "10.1002/atr.5670430206" },
  { match: "Páez",                 doi: "10.1016/j.jtrangeo.2012.03.016" },
  { match: "Lucas",                doi: "10.1016/j.tranpol.2012.01.013" },
  { match: "Pereira",              doi: "10.1080/01441647.2016.1257660" },
  { match: "Barthélemy",           doi: "10.1016/j.physrep.2010.11.002" },
  { match: "Hood",                 doi: "10.3328/TL.2011.03.01.63-75" },
  { match: "Dill, J. & McNeil",    doi: "10.3141/2387-15" },
  { match: "Dill & McNeil",        doi: "10.3141/2387-15" },
  { match: "Rodríguez",            doi: "10.1016/j.trd.2003.11.001" },
  { match: "Kuzmyak",              doi: "10.17226/22330" },
  { match: "Iacono",               doi: "10.1016/j.jtrangeo.2009.02.002" },
  { match: "Duthie",               doi: "10.1061/(ASCE)TE.1943-5436.0000635" },
  { match: "Larsen",               doi: "10.1080/15568318.2011.631098" },
  { match: "Winters",              doi: "10.1007/s11116-010-9284-y" },
  { match: "Silverman",            doi: "10.1201/9781315140919" },
  { match: "Natera",               doi: "10.1098/rsos.201130" },
  { match: "Szell",                doi: "10.1038/s41598-022-10783-y" },
  { match: "Furth",                url: "https://transweb.sjsu.edu/research/Low-Stress-Bicycling-and-Network-Connectivity", label: "Informe MTI 11-19 ↗" },
  { match: "Mekuria",              url: "https://transweb.sjsu.edu/research/Low-Stress-Bicycling-and-Network-Connectivity", label: "Informe MTI 11-19 ↗" },
  { match: "Geller",               url: "https://www.portland.gov/transportation/walking-biking-transit-safety/documents/four-types-cyclists/download", label: "Portland BOT ↗" },
];

function refLink(refText) {
  for (const r of REF_LINKS) {
    if (refText.includes(r.match)) {
      if (r.doi) return { href: "https://doi.org/" + r.doi, label: "doi:" + r.doi };
      if (r.url) return { href: r.url, label: r.label || "Ver fuente ↗" };
    }
  }
  return null;
}

/* ===================== Componentes ===================== */

function EqBlock({ tex }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current) return;
    if (window.katex) {
      try { window.katex.render(tex, ref.current, { throwOnError: false, displayMode: true }); }
      catch (e) { ref.current.textContent = tex; }
    } else {
      ref.current.textContent = tex;
    }
  }, [tex]);
  return <div className="info-eq" ref={ref}></div>;
}

function InfoModal({ entry, onClose }) {
  React.useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const eqs = entry.eq ? (Array.isArray(entry.eq) ? entry.eq : [entry.eq]) : [];
  return (
    <div className="info-scrim" onClick={onClose}>
      <div className="info-modal" onClick={e => e.stopPropagation()}>
        <div className="info-modal-h">
          <div className="info-modal-title">{entry.title}</div>
          <button className="info-close" onClick={onClose} title="Cerrar">✕</button>
        </div>
        <div className="info-modal-body">
          <div className="info-sec">
            <div className="info-sec-h">Descripción metodológica</div>
            <p className="info-p">{entry.desc}</p>
          </div>
          {eqs.length > 0 && (
            <div className="info-sec">
              <div className="info-sec-h">Formulación</div>
              {eqs.map((e, i) => <EqBlock key={i} tex={e} />)}
            </div>
          )}
          {entry.expected && (
            <div className="info-sec">
              <div className="info-sec-h">Valores esperados</div>
              <p className="info-p">{entry.expected}</p>
            </div>
          )}
          {entry.limits && entry.limits.length > 0 && (
            <div className="info-sec">
              <div className="info-sec-h">Limitaciones</div>
              <ul className="info-ul">
                {entry.limits.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            </div>
          )}
          {entry.refs && entry.refs.length > 0 && (
            <div className="info-sec">
              <div className="info-sec-h">Referencias</div>
              <ul className="info-ul refs">
                {entry.refs.map((r, i) => {
                  const link = refLink(r);
                  return (
                    <li key={i}>
                      {r}
                      {link && (
                        <a className="info-doi" href={link.href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>{link.label}</a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoButton({ k }) {
  const [open, setOpen] = React.useState(false);
  const entry = METODOLOGIA[k];
  if (!entry) return null;
  return (
    <>
      <button
        className="info-btn"
        title={"Metodología: " + entry.title}
        onClick={e => { e.stopPropagation(); setOpen(true); }}
      >i</button>
      {open && <InfoModal entry={entry} onClose={() => setOpen(false)} />}
    </>
  );
}

/* ===================== Defaults desde PARAM_SCHEMA (fuente única) =====================
   Inyecta el default real del motor en cada ficha de parámetro, de modo que
   la documentación NO pueda contradecir la configuración: si cambia el schema,
   cambia el texto. */
(function alignDefaults() {
  const S = window.PARAM_SCHEMA;
  if (!S) return;
  const map = { um_distOrigen: "distOrigen", um_distDestino: "distDestino", um_connectTol: "connectTol", um_habThreshold: "habThreshold", um_costoPorKm: "costoPorKm", um_porcProtegido: "porcProtegido", um_aproxFinal: "aproxFinal", um_tiempoMax: "tiempoMax" };
  Object.entries(map).forEach(([fichaKey, paramKey]) => {
    const ficha = METODOLOGIA[fichaKey], sch = S[paramKey];
    if (!ficha || !sch) return;
    const def = `Valor por defecto: ${sch.default} ${sch.unit} (fuente única: PARAM_SCHEMA · motor v${window.EVA_VERSION.ENGINE_VERSION}). `;
    ficha.expected = def + (ficha.expected || "");
  });
})();

Object.assign(window, { METODOLOGIA, InfoButton });
