/* ============================================================
   EVA · EDTR · 12 escenarios preestablecidos: posiciones y beneficios
   ------------------------------------------------------------
   Objetivo:
   1) ejecutar la cartera C/I completa bajo TODOS los escenarios EVA;
   2) registrar posición inicial y posición secuencial de cada proyecto;
   3) comparar captura temprana de población marginal;
   4) comparar conexión funcional (viajes OD nuevos viables) y conexión
      estructural (reducción de componentes de red);
   5) identificar, para cada trayectoria observada, el último paso en que
      agregar una ciclovía aumenta alguno de esos tres resultados.

   IMPORTANTE:
   - normalización fija en G0 sobre el mismo conjunto elegible C/I;
   - el score propio de escenarios distintos NO se compara entre sí;
   - pobBeneficiada se conserva como diagnóstico funcional, pero no se
     acumula como población única porque una misma persona puede ganar
     nuevos viajes viables en más de una etapa;
   - demandaHabilitada sí representa viajes OD nuevos viables respecto
     del estado previo y se acumula como beneficio funcional incremental;
   - reducción de componentes = C_{t-1} - C_t; positiva implica menor
     fragmentación, negativa implica que el proyecto aislado añade un
     nuevo componente.
============================================================ */
(function () {
  "use strict";

  const base = window.EVA_PAPER_EXPERIMENTS;
  if (!base || !base.evaluateState || !base.fixedScore || !base.rootCfg) {
    throw new Error("paper-all-scenario-benefits.js requiere paper-experiments-fast.js");
  }

  const num = v => Number.isFinite(+v) ? +v : 0;
  const normText = v => String(v == null ? "" : v).trim().toLowerCase();
  const rawPortfolio = () => (window.FC_RAW && window.FC_RAW["Plan Maestro"]) || window.projectsFC;
  const CRITERIA = [
    "poblacion", "costoOD", "oportunidades", "equidad", "continuidad",
    "demanda", "ciclistas", "fractal", "estudiantes", "prioridadGore",
    "costoInv", "seguridad", "monumentos", "intermodal", "factibilidad", "parques",
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
    const comp = window.ENGINE.buildComponents(
      window.existingFC,
      lockedGeoms || [],
      num(params && params.connectTol) || 150
    );
    return comp.count;
  }

  function scenarioDefinitions() {
    const scenarios = window.EVA_SCENARIOS || [];
    if (!scenarios.length) throw new Error("No se encontraron escenarios EVA preestablecidos");
    return scenarios.map(s => ({
      key: s.key,
      label: s.nombre,
      description: s.desc,
      weights: { ...(s.weights || {}) },
    }));
  }

  function initialRanking(def, params, scales, rootConfig, eligibleIds) {
    const state = evaluateEligibleFixed([], def.weights, params, scales, rootConfig, eligibleIds);
    return state.ranked.map((p, i) => ({
      scenario: def.key,
      scenario_label: def.label,
      rank: i + 1,
      id: p.id,
      nombre: p.nombre,
      escala: projectProps(p.id).escala || p.escala || null,
      score: num(p.score),
      poblacion_marginal_G0: num(p.poblacion),
      poblacion_beneficiada_G0: num(p.pobBeneficiada),
      demanda_habilitada_G0: num(p.demandaHabilitada),
      componentes_unidos_G0: num(p.componentesUnidos),
      costo_mclp: num(p.costo),
    }));
  }

  async function simulate(def, params, scales, rootConfig, eligibleIds, initialComponents) {
    const lockedGeoms = [];
    const rows = [];
    const initialRows = initialRanking(def, params, scales, rootConfig, eligibleIds);
    const initialMap = new Map(initialRows.map(r => [r.id, r]));
    const n = eligibleIds.size;
    let componentsBefore = initialComponents;

    for (let step = 1; step <= n; step++) {
      const state = evaluateEligibleFixed(lockedGeoms, def.weights, params, scales, rootConfig, eligibleIds);
      const chosen = state.ranked[0];
      if (!chosen) break;
      const geom = projectGeom(chosen.id);
      if (!geom) throw new Error(`No se encontró geometría para ${chosen.id}`);
      const initial = initialMap.get(chosen.id);
      const props = projectProps(chosen.id);
      const prev = rows.at(-1) || {};

      lockedGeoms.push(geom);
      const componentsAfter = componentsCount(lockedGeoms, params);
      const componentReduction = componentsBefore - componentsAfter;

      const row = {
        scenario: def.key,
        scenario_label: def.label,
        step,
        id: chosen.id,
        nombre: chosen.nombre,
        escala: props.escala || chosen.escala || null,
        initial_rank: initial ? initial.rank : null,
        rank_shift_vs_G0: initial ? initial.rank - step : null,
        own_score: num(chosen.score),
        poblacion_marginal: num(chosen.poblacion),
        poblacion_beneficiada_funcional: num(chosen.pobBeneficiada),
        demanda_habilitada: num(chosen.demandaHabilitada),
        componentes_unidos: num(chosen.componentesUnidos),
        componentes_antes: componentsBefore,
        componentes_despues: componentsAfter,
        reduccion_componentes: componentReduction,
        ciclistas_inducidos: num(chosen.ciclistasInducidos),
        costo_mclp: num(chosen.costo),
      };

      row.cum_population = num(prev.cum_population) + row.poblacion_marginal;
      row.cum_demand_enabled = num(prev.cum_demand_enabled) + row.demanda_habilitada;
      row.cum_functional_population_events = num(prev.cum_functional_population_events) + row.poblacion_beneficiada_funcional;
      row.cum_component_reduction = initialComponents - componentsAfter;
      row.cum_cost_mclp = num(prev.cum_cost_mclp) + row.costo_mclp;
      rows.push(row);
      componentsBefore = componentsAfter;

      if (step === 1 || step % 10 === 0 || step === n) {
        console.log(`[all-W-benefits] ${def.label}: ${step}/${n} · ${chosen.id}`);
      }
      if (window.evaYield) await window.evaYield();
    }

    return {
      key: def.key,
      label: def.label,
      description: def.description,
      weights: def.weights,
      initial_ranking: initialRows,
      rows,
      sequence: rows.map(r => r.id),
    };
  }

  function firstStepAtShare(rows, field, share) {
    const finalValue = num((rows.at(-1) || {})[field]);
    if (!(finalValue > 0)) return null;
    const threshold = finalValue * share;
    const r = rows.find(x => num(x[field]) >= threshold);
    return r ? r.step : null;
  }

  function lastPositiveStep(rows, field) {
    let last = 0;
    for (const r of rows) if (num(r[field]) > 0) last = r.step;
    return last || null;
  }

  function pathArea(rows, cumulativeField) {
    return rows.reduce((s, r) => s + num(r[cumulativeField]), 0);
  }

  function captureIndex(rows, cumulativeField) {
    if (!rows.length) return null;
    const finalValue = num(rows.at(-1)[cumulativeField]);
    if (!(finalValue > 0)) return null;
    return pathArea(rows, cumulativeField) / (rows.length * finalValue);
  }

  function weightedMeanStage(rows, marginalField) {
    const total = rows.reduce((s, r) => s + Math.max(0, num(r[marginalField])), 0);
    if (!(total > 0)) return null;
    return rows.reduce((s, r) => s + r.step * Math.max(0, num(r[marginalField])), 0) / total;
  }

  function summarize(run, initialComponents) {
    const rows = run.rows;
    const last = rows.at(-1) || {};
    const lp = lastPositiveStep(rows, "poblacion_marginal");
    const ld = lastPositiveStep(rows, "demanda_habilitada");
    const lc = lastPositiveStep(rows, "reduccion_componentes");
    const lastAny = Math.max(lp || 0, ld || 0, lc || 0) || null;
    return {
      scenario: run.key,
      scenario_label: run.label,
      steps: rows.length,
      final_population: num(last.cum_population),
      final_demand_enabled: num(last.cum_demand_enabled),
      final_components: num(last.componentes_despues),
      final_component_reduction: initialComponents - num(last.componentes_despues),
      final_cost_mclp: num(last.cum_cost_mclp),
      area_population_person_stage: pathArea(rows, "cum_population"),
      population_early_capture_index: captureIndex(rows, "cum_population"),
      population_weighted_mean_stage: weightedMeanStage(rows, "poblacion_marginal"),
      area_demand_trip_stage: pathArea(rows, "cum_demand_enabled"),
      demand_early_capture_index: captureIndex(rows, "cum_demand_enabled"),
      demand_weighted_mean_stage: weightedMeanStage(rows, "demanda_habilitada"),
      area_component_reduction_stage: pathArea(rows, "cum_component_reduction"),
      component_early_capture_index: captureIndex(rows, "cum_component_reduction"),
      last_population_gain_step: lp,
      last_demand_gain_step: ld,
      last_component_reduction_step: lc,
      last_any_observed_gain_step: lastAny,
      zero_benefit_tail_projects: lastAny == null ? rows.length : rows.length - lastAny,
      population_50_step: firstStepAtShare(rows, "cum_population", 0.50),
      population_75_step: firstStepAtShare(rows, "cum_population", 0.75),
      population_90_step: firstStepAtShare(rows, "cum_population", 0.90),
      population_95_step: firstStepAtShare(rows, "cum_population", 0.95),
      population_99_step: firstStepAtShare(rows, "cum_population", 0.99),
      demand_50_step: firstStepAtShare(rows, "cum_demand_enabled", 0.50),
      demand_75_step: firstStepAtShare(rows, "cum_demand_enabled", 0.75),
      demand_90_step: firstStepAtShare(rows, "cum_demand_enabled", 0.90),
      demand_95_step: firstStepAtShare(rows, "cum_demand_enabled", 0.95),
      demand_99_step: firstStepAtShare(rows, "cum_demand_enabled", 0.99),
    };
  }

  function mean(xs) { return xs.length ? xs.reduce((a,b)=>a+b,0)/xs.length : null; }
  function median(xs) {
    if (!xs.length) return null;
    const a = [...xs].sort((x,y)=>x-y), m = Math.floor(a.length/2);
    return a.length % 2 ? a[m] : (a[m-1]+a[m])/2;
  }
  function stdev(xs) {
    if (xs.length < 2) return 0;
    const m = mean(xs);
    return Math.sqrt(xs.reduce((s,x)=>s+(x-m)*(x-m),0)/xs.length);
  }

  function rankingMatrix(runs, eligibleIds) {
    const seqMaps = new Map(runs.map(run => [run.key, new Map(run.sequence.map((id,i)=>[id,i+1]))]));
    const initMaps = new Map(runs.map(run => [run.key, new Map(run.initial_ranking.map(r=>[r.id,r.rank]))]));
    const rows = [];
    for (const id of eligibleIds) {
      const props = projectProps(id);
      const seqRanks = runs.map(run => seqMaps.get(run.key).get(id)).filter(Number.isFinite);
      const initRanks = runs.map(run => initMaps.get(run.key).get(id)).filter(Number.isFinite);
      const row = {
        id,
        nombre: props.nombre || props.eje || id,
        escala: props.escala || null,
        sequence_rank_min: Math.min(...seqRanks),
        sequence_rank_max: Math.max(...seqRanks),
        sequence_rank_range: Math.max(...seqRanks) - Math.min(...seqRanks),
        sequence_rank_mean: mean(seqRanks),
        sequence_rank_median: median(seqRanks),
        sequence_rank_sd: stdev(seqRanks),
        initial_rank_mean: mean(initRanks),
        top10_scenarios: seqRanks.filter(r => r <= 10).length,
        top20_scenarios: seqRanks.filter(r => r <= 20).length,
        top30_scenarios: seqRanks.filter(r => r <= 30).length,
        bottom30_scenarios: seqRanks.filter(r => r > 94).length,
      };
      for (const run of runs) {
        row[`seq_${run.key}`] = seqMaps.get(run.key).get(id) ?? null;
        row[`g0_${run.key}`] = initMaps.get(run.key).get(id) ?? null;
      }
      rows.push(row);
    }
    return rows.sort((a,b) => a.sequence_rank_mean - b.sequence_rank_mean || String(a.id).localeCompare(String(b.id)));
  }

  function pairwiseRankRows(runs) {
    const out = [];
    for (let i = 0; i < runs.length; i++) {
      const A = new Map(runs[i].sequence.map((id,k)=>[id,k+1]));
      for (let j = i + 1; j < runs.length; j++) {
        const B = new Map(runs[j].sequence.map((id,k)=>[id,k+1]));
        const ids = runs[i].sequence.filter(id => B.has(id));
        const d = ids.map(id => Math.abs(A.get(id)-B.get(id)));
        const top = k => {
          const a = new Set(runs[i].sequence.slice(0,k));
          const b = new Set(runs[j].sequence.slice(0,k));
          let inter = 0; for (const id of a) if (b.has(id)) inter++;
          return inter / new Set([...a,...b]).size;
        };
        out.push({
          scenario_a: runs[i].key,
          scenario_b: runs[j].key,
          mean_abs_rank_difference: mean(d),
          max_abs_rank_difference: Math.max(...d),
          jaccard_top10: top(10),
          jaccard_top20: top(20),
          jaccard_top30: top(30),
        });
      }
    }
    return out;
  }

  function observedEnvelope(runs) {
    const n = Math.max(...runs.map(r => r.rows.length));
    const rows = [];
    for (let step = 1; step <= n; step++) {
      const at = runs.map(run => ({ run, row: run.rows[step-1] })).filter(x => x.row);
      const bestPop = at.reduce((a,b) => num(b.row.cum_population) > num(a.row.cum_population) ? b : a);
      const bestDem = at.reduce((a,b) => num(b.row.cum_demand_enabled) > num(a.row.cum_demand_enabled) ? b : a);
      const bestComp = at.reduce((a,b) => num(b.row.cum_component_reduction) > num(a.row.cum_component_reduction) ? b : a);
      rows.push({
        step,
        max_cum_population: num(bestPop.row.cum_population),
        population_scenario: bestPop.run.key,
        max_cum_demand_enabled: num(bestDem.row.cum_demand_enabled),
        demand_scenario: bestDem.run.key,
        max_cum_component_reduction: num(bestComp.row.cum_component_reduction),
        component_scenario: bestComp.run.key,
      });
    }
    return rows;
  }

  async function runAllScenarioBenefits(opts) {
    opts = opts || {};
    const params = { ...(window.PARAM_DEFAULTS || {}), perfil: "general", segKSI: false };
    const rootConfig = base.rootCfg("Alameda", 100, 0.5);
    const eligibleIds = eligibleIdSet();
    const scenarios = scenarioDefinitions();
    const scales = fixedReferenceEligible(params, rootConfig, eligibleIds);
    const initialComponents = componentsCount([], params);
    const runs = [];

    console.log(`[all-W-benefits] Inicio · ${eligibleIds.size} proyectos × ${scenarios.length} escenarios`);
    for (const def of scenarios) {
      runs.push(await simulate(def, params, scales, rootConfig, eligibleIds, initialComponents));
    }

    const summaries = runs.map(r => summarize(r, initialComponents));
    const matrix = rankingMatrix(runs, eligibleIds);
    const pairwise = pairwiseRankRows(runs);
    const envelope = observedEnvelope(runs);

    const result = {
      generated_at: new Date().toISOString(),
      versions: { ...(window.EVA_VERSION || {}) },
      design: {
        experiment: "all predefined EVA scenarios: project positions and benefit trajectories",
        modeled_projects: (rawPortfolio().features || []).length,
        eligible_projects: eligibleIds.size,
        eligible_scales: ["Comunal", "Intercomunal"],
        scenario_count: scenarios.length,
        scenarios: scenarios.map(s => ({ key:s.key, label:s.label, description:s.description, weights:s.weights })),
        normalization: "fixed-G0-eligible-CI",
        root: rootConfig,
        benefit_definitions: {
          population: "poblacion marginal que gana acceso en cada estado",
          functional_connection: "demandaHabilitada: viajes OD nuevos que pasan a ser viables respecto del estado previo",
          structural_connection: "reduccion_componentes = componentes_antes - componentes_despues",
          diagnostic_population_functional: "pobBeneficiada: población con >=1 viaje nuevo viable; no se interpreta acumulada como población única"
        },
        saturation_note: "last_any_observed_gain_step es descriptivo de la trayectoria realizada. No demuestra que no exista otra secuencia capaz de habilitar beneficios posteriores.",
      },
      normalization_reference: scales,
      initial_components: initialComponents,
      summaries,
      ranking_matrix: matrix,
      pairwise_rank_comparison: pairwise,
      observed_benefit_envelope: envelope,
      runs,
    };
    setRoot(rootConfig);
    console.log("[all-W-benefits] Experimento completo terminado");
    return result;
  }

  window.EVA_PAPER_EXPERIMENTS.runAllScenarioBenefits = runAllScenarioBenefits;
})();
