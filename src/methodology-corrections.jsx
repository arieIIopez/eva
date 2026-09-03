/* ============================================================
   EVA · Correcciones metodológicas de compatibilidad · v3.13 experimental
   ------------------------------------------------------------
   Corrige fichas heredadas cuyo texto quedó desalineado del motor vigente.
   Se carga inmediatamente después de metodologia.jsx y antes de la UI.

   IMPORTANTE: esta capa no modifica cálculos, parámetros ni ponderaciones.
   Sólo corrige documentación mostrada al usuario. Debe consolidarse dentro
   de metodologia.jsx y scenarios.jsx antes de declarar una release estable.
============================================================ */
(function applyMethodologyCorrections() {
  const M = window.METODOLOGIA;
  if (!M) throw new Error("methodology-corrections.jsx requiere metodologia.jsx");

  if (M.sec_score) {
    M.sec_score.desc = "Cada proyecto recibe un puntaje agregado como suma ponderada de indicadores orientados y normalizados. En la aplicación operacional, las escalas que dependen de máximos se recalculan sobre la cartera activa; algunos criterios ya están expresados en [0,1] y el costo de inversión se orienta en sentido inverso. El puntaje se recalcula al cambiar ponderadores y en cada iteración secuencial. Los experimentos científicos del paper EDTR usan, en cambio, referencias de normalización fijadas en G₀ para aislar dependencia del estado de cambios mecánicos del denominador.";
    M.sec_score.eq = [
      "S_t(p) = \\frac{\\sum_i w_i \\, \\hat{x}_{i,p,t}}{\\sum_i w_i}",
      "\\hat{x}_{costo,p,t} = 1 - \\frac{costo_p}{M_{costo}}",
    ];
    M.sec_score.limits = [
      "La normalización operacional por máximos activos hace que parte del puntaje sea relativo a la cartera; por eso los experimentos de dependencia del estado fijan M_i en G₀.",
      "La suma ponderada asume compensabilidad entre criterios; un déficit en un criterio puede ser compensado por otro.",
      "Los pesos representan preferencias del decisor, no parámetros estimados; deben declararse y someterse a sensibilidad.",
      "Costo y factibilidad son proxies de planificación y no reemplazan presupuestos ni diseños de ingeniería de cada proyecto.",
    ];
  }

  M.crit_costoOD = {
    title: "Tasa de habilitación OD (clave histórica costoOD)",
    desc: "Indicador de conexión funcional: mide qué fracción de los viajes OD potencialmente habilitables en el área de influencia pasa de no viable a viable al incorporar el proyecto al estado actual de la red. El identificador interno `costoOD` se conserva por compatibilidad histórica, pero el motor vigente NO calcula aquí costo generalizado ni ruteo arco a arco. Operativamente la tasa se codifica en una escala discreta 0–30; el valor se guarda con signo negativo histórico y el score utiliza su magnitud absoluta, de modo que una mayor tasa de habilitación recibe mayor valoración.",
    eq: [
      "h_p = \\frac{D^{enabled}_p}{D^{potential}_p}",
      "costoOD_p = -\\operatorname{round}(30 h_p)",
      "\\hat{x}_{OD,p} = \\frac{|costoOD_p|}{\\max_q |costoOD_q|}",
    ],
    expected: "Escala interna 0–30. Valores altos identifican proyectos que vuelven viable una proporción elevada del flujo OD potencialmente habilitable bajo el estado de red evaluado.",
    limits: [
      "No representa reducción monetaria ni temporal del costo generalizado de viaje.",
      "La conectividad se evalúa por componentes y umbrales de acceso/destino, no mediante ruteo arco a arco.",
      "La discretización a 31 niveles reduce precisión y puede producir empates entre proyectos con tasas cercanas.",
      "La métrica depende del estado G_t: al cambiar la red cambian los viajes previamente no viables y, por tanto, el denominador potencialmente habilitable.",
    ],
    refs: [
      "Geurs, K. & van Wee, B. (2004). Accessibility evaluation of land-use and transport strategies. Journal of Transport Geography 12(2).",
      "Páez, A., Scott, D. & Morency, C. (2012). Measuring accessibility: positive and normative implementations. Journal of Transport Geography 25.",
      "Ortúzar, J. de D. & Willumsen, L.G. (2011). Modelling Transport, 4th ed. Wiley.",
    ],
  };

  /* `pob` en od_hex representa población ocupada modelada, no población total. */
  M.crit_poblacion = {
    title: "Cobertura marginal de población ocupada",
    desc: "Ocupados que residen en hexágonos sin acceso a la red efectiva en el estado vigente y que adquieren acceso al incorporar el proyecto. El motor utiliza el campo `pob` de la base OD, correspondiente a población ocupada modelada; no debe interpretarse como población total. La métrica es incremental y evita recontar ocupados que ya tenían acceso.",
    eq: [
      "\\Delta P_p = \\sum_{h \\in H(p)} ocup_h \\cdot \\mathbb{1}[d(h, red_t)>\\delta_O]",
      "H(p)=\\{h:d(h,p)\\le\\delta_O\\}",
    ],
    expected: "En la cartera PMC el rango observado es aproximadamente 0–60.000 ocupados por proyecto. δ_O = 700 m por defecto.",
    limits: [
      "Representa acceso potencial de población ocupada modelada; no población total, uso observado, bienestar ni causalidad individual.",
      "Usa distancia geométrica desde el centroide del hexágono a la red, no una ruta peatonal real de acceso; puede sobreestimar acceso ante barreras urbanas.",
      "El hexágono agrega población y el acceso se asigna al conjunto del hexágono desde su centroide.",
      "No distingue por sí sola propensión a usar bicicleta; esa dimensión se modela separadamente.",
    ],
    refs: [
      "Vega, Greene & Ortúzar (2024), op. cit.",
      "Geurs, K. & van Wee, B. (2004). Accessibility evaluation of land-use and transport strategies. J. of Transport Geography 12(2).",
      "INE (2024). Censo de Población y Vivienda — n_ocupado por manzana.",
    ],
  };

  if (M.crit_oportunidades) {
    M.crit_oportunidades.desc = "Número de hexágonos OD que obtienen al menos un viaje laboral nuevo viable gracias al proyecto, sea por acceso directo o por interconexión de subredes. Mide extensión territorial del cambio y complementa la cobertura marginal de población ocupada, que representa su intensidad demográfica dentro de la base OD.";
    M.crit_oportunidades.limits = [
      "Cuenta hexágonos, no personas ni ocupados: dos hexágonos pesan igual aunque contengan magnitudes muy distintas; por eso se combina con cobertura de población ocupada.",
      "Sensible al umbral de servicio del destino y a los parámetros de acceso y conectividad.",
    ];
  }

  if (M.crit_equidad) {
    M.crit_equidad.title = "Equidad territorial de población ocupada habilitada";
    M.crit_equidad.desc = "Fracción de la población ocupada asociada a hexágonos con nuevos viajes viables que reside en comunas cuya cobertura ciclable actual está bajo la mediana regional. Prioriza cierre de brechas territoriales dentro de la población ocupada representada por la base OD; no constituye una medida completa de equidad social.";
    M.crit_equidad.limits = [
      "La cobertura comunal es un promedio que oculta heterogeneidad intracomunal.",
      "La métrica utiliza población ocupada modelada y no incorpora directamente ingreso, género, discapacidad u otras dimensiones distributivas.",
      "La mediana de cobertura depende del estado vigente de la red y puede cambiar durante la priorización secuencial.",
    ];
  }

  /* Corrige terminología de escenarios sin modificar los vectores de pesos. */
  if (Array.isArray(window.EVA_SCENARIOS)) {
    window.EVA_SCENARIOS.forEach(s => {
      if (!s || !s.desc) return;
      s.desc = s.desc
        .replace(/población marginal/g, "cobertura marginal de población ocupada")
        .replace(/cobertura poblacional/g, "cobertura de población ocupada");
    });
  }

  /* Corrige la explicación automática del score generada por scenarios.jsx. */
  if (typeof window.evaExplainScore === "function") {
    const baseExplainScore = window.evaExplainScore;
    const fixLabel = (s) => (s || "")
      .replace(/población marginal/g, "cobertura marginal de población ocupada")
      .replace(/cobertura poblacional/g, "cobertura de población ocupada");

    window.evaExplainScore = function (p, weights, ranking) {
      const out = baseExplainScore(p, weights, ranking);
      if (!out) return out;
      out.explicacion = fixLabel(out.explicacion)
        .replace(/beneficia ([0-9.]+) personas de forma marginal/g, "incorpora acceso para $1 ocupados de forma marginal");
      if (Array.isArray(out.aportes)) {
        out.aportes.forEach(a => { if (a && a.criterio === "poblacion") a.etiqueta = "cobertura marginal de población ocupada"; });
      }
      if (Array.isArray(out.fortalezas)) out.fortalezas = out.fortalezas.map(fixLabel);
      if (Array.isArray(out.debilidades)) out.debilidades = out.debilidades.map(fixLabel);
      return out;
    };
  }
})();
