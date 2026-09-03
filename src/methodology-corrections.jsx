/* ============================================================
   EVA · Correcciones metodológicas de compatibilidad · v3.13 experimental
   ------------------------------------------------------------
   Corrige fichas heredadas cuyo texto quedó desalineado del motor vigente.
   Se carga inmediatamente después de metodologia.jsx y antes de la UI.

   IMPORTANTE: esta capa no modifica cálculos, parámetros ni ponderaciones.
   Sólo corrige documentación mostrada al usuario. Debe consolidarse dentro
   de metodologia.jsx antes de declarar una release estable posterior.
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
})();
