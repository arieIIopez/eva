/* ============================================================
   EVA · EDTR · 12 escenarios: posiciones, beneficios y saturación
   ------------------------------------------------------------
   Ejecuta el conjunto factible completo C/I (124 proyectos) bajo todos
   los escenarios predefinidos de EVA, manteniendo normalización fija G0.

   Objetivos del experimento:
   1) observar la posición secuencial de cada ciclovía bajo cada W;
   2) comparar captura temprana de población marginal;
   3) comparar habilitación OD/demanda como beneficio de conexión;
   4) comparar reducción de componentes como beneficio topológico;
   5) estimar saturación práctica mediante hitos 50/75/90/95/99%;
   6) identificar la frontera de Pareto población–conexión.

   Nota: ejecutar toda la cartera hace que los estados finales converjan.
   El objeto de comparación es la trayectoria y el momento de captura.
============================================================ */
(function () {
  "use strict";

  const base = window.EVA_PAPER_EXPERIMENTS;
  if (!base || !base.evaluateState || !base.fixedScore || !base.rootCfg) {
    throw new Error("paper-all-scenarios-benefits.js requiere paper-experiments-fast.js");
  }

  const num = v => Number.isFinite(+v) ? +v : 0;
  const normText = v => String(v == null ? "" : v).trim().toLowerCase();
  const rawPortfolio = () => (window.FC_RAW && window.FC_RAW["Plan Maestro"]) || window.projectsFC;
  const CRITERIA = [
    "poblacion", "costoOD", "oportunidades", "equidad", "continuidad",
    "demanda", "ciclistas", "fractal", "estudiantes", "prioridadGore",
    "costoInv", "seguridad", "monumentos", "intermodal", "factibilidad", "parques",
  ];
  const SCENARIO_KEYS = [
    "ponderacion_rmc", "balanceado", "equidad", "demanda", "ciclistas_biogeme",
    "fractal_alameda", "continuidad", "eficiencia", "educacion",
    "integracion", "seguridad", "intermodal",
  ];

  function projectGeom(id) {
    return (rawPortfolio().features || []).find(f => f.properties && f.properties.id === id);
  }
  function projectProps(id) {
    const f = projectGeom(id);
    return (f && f.properties) || {};
  }
  function isEligibleFeature(f) {
    const escala = normText(f && f.properties && f.properties.escala);
    return escala === "comunal" || escala === "intercomunal";
  }
  function eligibleIdSet() {
    return new Set((rawPortfolio().features || [])
      .filter(isEligibleFeature)
      .map(f => f.properties && f.properties.id));
  }
  function setRoot(rootConfig) {
    if (rootConfig && window.FRACTAL && window.FRACTAL.setRootConfig) {
      window.FRACTAL.setRootConfig(rootConfig);
    }
  }
  function allCriteriaWeights() {
    return Object.fromEntries(CRITERIA.map(k => [k, k === "monumentos" ? 0 : 1]));
  }
  function max1(rows, fn) {
    return Math.max(1, ...rows.map(r => num(fn(r))));
  }
  function makeEligibleScales(enriched, eligibleIds) {
    const rows = (enriched || []).filter(p => eligibleIds.has(p.id));
    return {
      reference: "eligible-CI-G0",
      eligible_count: rows.length,
      poblacion: max1(rows, p => p.poblacion),
      costoOD: max1(rows, p => Math.abs(num(p.costoOD))),
      oportunidades: max1(rows, p => p.oportunidades),
      demanda: max1(rows, p => p.demandaHabilitada),
      ciclistas: max1(rows, p => p.ciclistasInducidos),
      estudiantes: max1(rows, p => p.estudiantes),
      seguridad: max1(rows, p => p.siniestrosPeso),
      monumentos: max1(rows, p => p.monumentos),
      intermodal: max1(rows, p => p.metroEstaciones),
      factibilidad: max1(rows, p => p.numPistas),
      parques: max1(rows, p => p.parquesSup),
      costo: max1(rows, p => p.costo),
      fractalBase: 100,
    };
  }
  function fixedReferenceEligible(params, rootConfig, eligibleIds) {
    setRoot(rootConfig);
    const state = base.evaluateState([], allCriteriaWeights(), params);
    return makeEligibleScales(state.enriched, eligibleIds);
  }
  function evaluateEligibleFixed(lockedGeoms, weights, params, scales, rootConfig, eligibleIds) {
    setRoot(rootConfig);
    const state = base.evaluateState(lockedGeoms || [], weights || {}, params || {});
    const lockedIds = new Set((lockedGeoms || []).map(f => f.properties && f.properties.id));
    const ranked = (state.enriched || [])
      .filter(p => eligibleIds.has(p.id) && !lockedIds.has(p.id))
      .map(p => ({ ...p, score: base.fixedScore(p, weights || {}, scales) }))
      .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));
    return { ...state, ranked };
  }
  function componentsCount(lockedGeoms, params) {
    return window.ENGINE.buildComponents(
      window.existingFC,
      lockedGeoms || [],
      num(params && params.connectTol) || 150
    ).count;
  }
  function scenarioDefinitions() {
    const map = window.EVA_SCENARIO_MAP || {};
    return SCENARIO_KEYS.map(key => {
      const src = map[key];
      if (!src || !src.weights) throw new Error(`Escenario EVA no disponible: ${key}`);
      return { key, label: src.nombre || key, weights: { ...src.weights } };
    });
  }
  function initialRanking(def, params, scales, rootConfig, eligibleIds) {
    const state = evaluateEligibleFixed([], def.weights, params, scales, rootConfig, eligibleIds);
    return state.ranked.map((p, i) => ({
      rank: i + 1,
      id: p.id,
      nombre: p.nombre,
      escala: projectProps(p.id).escala || p.escala || null,
      score: num(p.score),
    }));
  }

  async function simulateScenario(def, params, scales, rootConfig, eligibleIds, initialComponents) {
    const lockedGeoms = [];
    const rows = [];
    const initialRows = initialRanking(def, params, scales, rootConfig, eligibleIds);
    const initialMap = new Map(initialRows.map(r => [r.id, r]));
    let previousComponents = initialComponents;

    for (let step = 1; step <= eligibleIds.size; step++) {
      const state = evaluateEligibleFixed(lockedGeoms, def.weights, params, scales, rootConfig, eligibleIds);
      const chosen = state.ranked[0];
      if (!chosen) break;
      const geom = projectGeom(chosen.id);
      if (!geom) throw new Error(`No se encontró geometría para ${chosen.id}`);
      const initial = initialMap.get(chosen.id);
      lockedGeoms.push(geom);
      const componentsNow = componentsCount(lockedGeoms, params);
      const prev = rows.at(-1) || {};
      const props = projectProps(chosen.id);

      const row = {
        scenario: def.key,
        scenario_label: def.label,
        step,
        id: chosen.id,
        nombre: chosen.nombre,
        escala: props.escala || chosen.escala || null,
        initial_rank: initial ? initial.rank : null,
        own_score: num(chosen.score),
        poblacion_marginal: num(chosen.poblacion),
        poblacion_beneficiada: num(chosen.pobBeneficiada),
        demanda_habilitada: num(chosen.demandaHabilitada),
        ciclistas_inducidos: num(chosen.ciclistasInducidos),
        componentes_unidos: num(chosen.componentesUnidos),
        componentes_red: componentsNow,
        delta_componentes: componentsNow - previousComponents,
        reduccion_componentes_etapa: previousComponents - componentsNow,
        reduccion_componentes_acumulada: initialComponents - componentsNow,
        costo_mclp: num(chosen.costo),
      };
      row.cum_cost_mclp = num(prev.cum_cost_mclp) + row.costo_mclp;
      row.cum_population = num(prev.cum_population) + row.poblacion_marginal;
      row.cum_demand = num(prev.cum_demand) + row.demanda_habilitada;
      row.cum_cyclists = num(prev.cum_cyclists) + row.ciclistas_inducidos;
      rows.push(row);
      previousComponents = componentsNow;

      if (step % 10 === 0 || step === 1 || step === eligibleIds.size) {
        console.log(`[paper-all-W] ${def.label}: ${step}/${eligibleIds.size} · ${chosen.id}`);
      }
      if (window.evaYield) await window.evaYield();
    }
    return { key: def.key, label: def.label, weights: def.weights, initial_ranking: initialRows, rows, sequence: rows.map(r => r.id) };
  }

  function thresholdStep(rows, field, finalValue, fraction) {
    const target = finalValue * fraction;
    const r = rows.find(x => num(x[field]) >= target - 1e-9);
    return r ? r.step : null;
  }
  function weightedMeanStage(rows, marginalField, finalValue) {
    if (!(finalValue > 0)) return null;
    return rows.reduce((s, r) => s + r.step * Math.max(0, num(r[marginalField])), 0) / finalValue;
  }
  function lastPositiveStep(rows, field) {
    const positive = rows.filter(r => num(r[field]) > 0);
    return positive.length ? positive.at(-1).step : 0;
  }
  function trajectorySummary(run, initialComponents) {
    const rows = run.rows;
    const last = rows.at(-1) || {};
    const finalPopulation = num(last.cum_population);
    const finalDemand = num(last.cum_demand);
    const finalComponentReduction = initialComponents - num(last.componentes_red);
    const areaPopulation = rows.reduce((s, r) => s + num(r.cum_population), 0);
    const areaDemand = rows.reduce((s, r) => s + num(r.cum_demand), 0);
    const areaComponents = rows.reduce((s, r) => s + num(r.reduccion_componentes_acumulada), 0);
    const n = rows.length || 1;
    const out = {
      scenario: run.key,
      scenario_label: run.label,
      steps: rows.length,
      final_population: finalPopulation,
      final_demand_enabled: finalDemand,
      final_components: num(last.componentes_red),
      final_component_reduction: finalComponentReduction,
      final_cost_mclp: num(last.cum_cost_mclp),
      area_population_person_stage: areaPopulation,
      population_early_capture_index: finalPopulation ? areaPopulation / (n * finalPopulation) : null,
      population_weighted_mean_stage: weightedMeanStage(rows, "poblacion_marginal", finalPopulation),
      area_demand_trip_stage: areaDemand,
      demand_early_capture_index: finalDemand ? areaDemand / (n * finalDemand) : null,
      demand_weighted_mean_stage: weightedMeanStage(rows, "demanda_habilitada", finalDemand),
      area_component_reduction_stage: areaComponents,
      component_early_capture_index: finalComponentReduction ? areaComponents / (n * finalComponentReduction) : null,
      last_population_gain_step: lastPositiveStep(rows, "poblacion_marginal"),
      last_demand_gain_step: lastPositiveStep(rows, "demanda_habilitada"),
      last_component_reduction_step: lastPositiveStep(rows, "reduccion_componentes_etapa"),
    };
    for (const pct of [50, 75, 90, 95, 99]) {
      const f = pct / 100;
      out[`population_${pct}_step`] = thresholdStep(rows, "cum_population", finalPopulation, f);
      out[`demand_${pct}_step`] = thresholdStep(rows, "cum_demand", finalDemand, f);
      const compTarget = finalComponentReduction * f;
      const rc = rows.find(r => num(r.reduccion_componentes_acumulada) >= compTarget - 1e-9);
      out[`components_${pct}_step`] = rc ? rc.step : null;
    }
    out.joint_population_demand_index = (
      num(out.population_early_capture_index) + num(out.demand_early_capture_index)
    ) / 2;
    out.joint_95_step = Math.max(num(out.population_95_step), num(out.demand_95_step));
    out.joint_99_step = Math.max(num(out.population_99_step), num(out.demand_99_step));
    return out;
  }

  function rankMatrix(runs) {
    const ids = runs[0] ? runs[0].sequence.slice() : [];
    const allIds = [...new Set(runs.flatMap(r => r.sequence))];
    return allIds.map(id => {
      const p = projectProps(id);
      const out = { id, nombre: p.nombre || p.eje || id, escala: p.escala || null };
      const seqRanks = [];
      for (const run of runs) {
        const sr = run.sequence.indexOf(id) + 1;
        const ir = run.initial_ranking.find(r => r.id === id)?.rank || null;
        out[`seq_${run.key}`] = sr || null;
        out[`g0_${run.key}`] = ir;
        if (sr) seqRanks.push(sr);
      }
      if (seqRanks.length) {
        const sorted = seqRanks.slice().sort((a,b) => a-b);
        const mean = seqRanks.reduce((a,b) => a+b, 0) / seqRanks.length;
        out.rank_min = sorted[0];
        out.rank_max = sorted.at(-1);
        out.rank_range = out.rank_max - out.rank_min;
        out.rank_mean = mean;
        out.rank_median = sorted.length % 2 ? sorted[(sorted.length-1)/2] : (sorted[sorted.length/2-1]+sorted[sorted.length/2])/2;
        out.rank_sd = Math.sqrt(seqRanks.reduce((s,x)=>s+(x-mean)**2,0)/seqRanks.length);
        out.top10_count = seqRanks.filter(x=>x<=10).length;
        out.top20_count = seqRanks.filter(x=>x<=20).length;
        out.top30_count = seqRanks.filter(x=>x<=30).length;
        out.bottom30_count = seqRanks.filter(x=>x>runs.length ? x>94 : false).length;
      }
      return out;
    }).sort((a,b) => num(a.rank_mean)-num(b.rank_mean));
  }

  function paretoPopulationDemand(summaries) {
    return summaries.filter(a => !summaries.some(b => b !== a &&
      num(b.area_population_person_stage) >= num(a.area_population_person_stage) &&
      num(b.area_demand_trip_stage) >= num(a.area_demand_trip_stage) &&
      (num(b.area_population_person_stage) > num(a.area_population_person_stage) ||
       num(b.area_demand_trip_stage) > num(a.area_demand_trip_stage))
    )).map(s => ({
      scenario: s.scenario,
      scenario_label: s.scenario_label,
      area_population_person_stage: s.area_population_person_stage,
      area_demand_trip_stage: s.area_demand_trip_stage,
      population_early_capture_index: s.population_early_capture_index,
      demand_early_capture_index: s.demand_early_capture_index,
    }));
  }

  async function runAllScenarioBenefits() {
    const params = { ...(window.PARAM_DEFAULTS || {}), perfil: "general", segKSI: false };
    const rootConfig = base.rootCfg("Alameda", 100, 0.5);
    const eligibleIds = eligibleIdSet();
    const scenarios = scenarioDefinitions();
    const scales = fixedReferenceEligible(params, rootConfig, eligibleIds);
    const initialComponents = componentsCount([], params);
    const runs = [];

    console.log(`[paper-all-W] Inicio · ${eligibleIds.size} proyectos × ${scenarios.length} escenarios`);
    for (const def of scenarios) {
      runs.push(await simulateScenario(def, params, scales, rootConfig, eligibleIds, initialComponents));
    }
    const summaries = runs.map(r => trajectorySummary(r, initialComponents));
    const matrix = rankMatrix(runs);
    const pareto = paretoPopulationDemand(summaries);

    setRoot(rootConfig);
    return {
      generated_at: new Date().toISOString(),
      versions: { ...(window.EVA_VERSION || {}) },
      design: {
        experiment: "12 predefined EVA policy scenarios, full eligible portfolio",
        modeled_projects: (rawPortfolio().features || []).length,
        eligible_projects: eligibleIds.size,
        scenarios: scenarios.map(s => ({ key: s.key, label: s.label, weights: s.weights })),
        normalization: "fixed-G0-eligible-CI",
        root: rootConfig,
        connection_metrics: ["demanda_habilitada", "reduccion_componentes"],
      },
      normalization_reference: scales,
      initial_components: initialComponents,
      summaries,
      pareto_population_demand: pareto,
      rank_matrix: matrix,
      runs,
    };
  }

  window.EVA_PAPER_EXPERIMENTS.runAllScenarioBenefits = runAllScenarioBenefits;
})();
