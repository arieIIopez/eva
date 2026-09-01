/* ============================================================
   EVA · Experimento correctivo EDTR: RMC + universo elegible C/I
   ------------------------------------------------------------
   Motivo metodológico:
   - La priorización institucional debe usar el escenario "Ponderación RMC".
   - Los corredores de escala Metropolitana (MET-*) no pertenecen al listado
     priorizable; el conjunto factible se restringe a proyectos Comunales e
     Intercomunales.
   - Los MET tampoco intervienen en los máximos de normalización de la cartera
     elegible. La red existente y las demás capas territoriales se mantienen.

   El módulo NO altera EVA operativo. Añade una corrida reproducible y un
   diseño factorial 2x2 para separar el efecto de W (Balanceado/RMC) del efecto
   de elegibilidad (todos/C+I).
============================================================ */
(function () {
  "use strict";

  const base = window.EVA_PAPER_EXPERIMENTS;
  if (!base || !base.evaluateState || !base.fixedScore || !base.compareRankSequence) {
    throw new Error("paper-experiments-rmc-eligible.js requiere paper-experiments-fast.js");
  }

  const CRITERIA = [
    "poblacion", "costoOD", "oportunidades", "equidad", "continuidad",
    "demanda", "ciclistas", "fractal", "estudiantes", "prioridadGore",
    "costoInv", "seguridad", "monumentos", "intermodal", "factibilidad", "parques",
  ];

  const num = v => Number.isFinite(+v) ? +v : 0;
  const rawPortfolio = () => (window.FC_RAW && window.FC_RAW["Plan Maestro"]) || window.projectsFC;
  const normText = v => String(v == null ? "" : v).trim().toLowerCase();

  function isEligibleFeature(f) {
    const p = (f && f.properties) || {};
    const escala = normText(p.escala);
    return escala === "comunal" || escala === "intercomunal";
  }

  function eligibleIdSet() {
    return new Set((rawPortfolio().features || []).filter(isEligibleFeature).map(f => f.properties && f.properties.id));
  }

  function projectGeom(id) {
    return (rawPortfolio().features || []).find(f => f.properties && f.properties.id === id);
  }

  function projectProps(id) {
    const f = projectGeom(id);
    return (f && f.properties) || {};
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

  function makeEligibleScales(enriched, eligibleIds, lockedIds) {
    const locked = lockedIds || new Set();
    const rows = (enriched || []).filter(p => eligibleIds.has(p.id) && !locked.has(p.id));
    return {
      reference: "eligible-CI",
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
    return makeEligibleScales(state.enriched, eligibleIds || eligibleIdSet(), new Set());
  }

  function rankEligibleFromState(state, weights, scales, eligibleIds, lockedIds) {
    const locked = lockedIds || new Set();
    return (state.enriched || [])
      .filter(p => eligibleIds.has(p.id) && !locked.has(p.id))
      .map(p => ({ ...p, score: base.fixedScore(p, weights || {}, scales) }))
      .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));
  }

  function evaluateEligibleFixed(lockedGeoms, weights, params, scales, rootConfig, eligibleIds) {
    setRoot(rootConfig);
    const state = base.evaluateState(lockedGeoms || [], weights || {}, params || {});
    const lockedIds = new Set((lockedGeoms || []).map(f => f.properties && f.properties.id));
    return {
      ...state,
      ranked: rankEligibleFromState(state, weights, scales, eligibleIds, lockedIds),
    };
  }

  function stepRecord(step, p, score, lockedGeoms, params) {
    const comp = window.ENGINE.buildComponents(window.existingFC, lockedGeoms, num(params.connectTol) || 150);
    const props = projectProps(p.id);
    return {
      step,
      id: p.id,
      nombre: p.nombre,
      escala: props.escala || p.escala || null,
      score: +num(score).toFixed(6),
      poblacion_marginal: num(p.poblacion),
      poblacion_beneficiada: num(p.pobBeneficiada),
      demanda_habilitada: num(p.demandaHabilitada),
      ciclistas_inducidos: num(p.ciclistasInducidos),
      componentes_unidos: num(p.componentesUnidos),
      componentes_red: comp.count,
      costo_mclp: num(p.costo),
      grado_dendritico: p.gradoSeparacion == null ? null : num(p.gradoSeparacion),
      score_dendritico: num(p.scorePrioridad),
    };
  }

  async function sequentialEligibleFixed(weights, opts) {
    opts = opts || {};
    const params = { ...(window.PARAM_DEFAULTS || {}), perfil: "general", segKSI: false, ...(opts.params || {}) };
    const rootConfig = opts.rootConfig || null;
    const eligibleIds = opts.eligibleIds || eligibleIdSet();
    const scales = opts.scales || fixedReferenceEligible(params, rootConfig, eligibleIds);
    const maxSteps = Math.min(opts.maxSteps || 20, eligibleIds.size);
    const budget = opts.budget == null ? Infinity : +opts.budget;
    const lockedGeoms = [];
    const order = [];
    let usedBudget = 0;

    for (let step = 1; step <= maxSteps; step++) {
      const { ranked } = evaluateEligibleFixed(lockedGeoms, weights, params, scales, rootConfig, eligibleIds);
      let chosen = null;
      for (const p of ranked) {
        if (usedBudget + num(p.costo) <= budget) { chosen = p; break; }
      }
      if (!chosen) break;
      const geom = projectGeom(chosen.id);
      if (!geom) break;
      lockedGeoms.push(geom);
      usedBudget += num(chosen.costo);
      const rec = stepRecord(step, chosen, chosen.score, lockedGeoms, params);
      rec.cum_poblacion_marginal = num((order.at(-1) || {}).cum_poblacion_marginal) + rec.poblacion_marginal;
      rec.cum_demanda_habilitada = num((order.at(-1) || {}).cum_demanda_habilitada) + rec.demanda_habilitada;
      rec.cum_ciclistas_inducidos = num((order.at(-1) || {}).cum_ciclistas_inducidos) + rec.ciclistas_inducidos;
      rec.cum_costo_mclp = usedBudget;
      order.push(rec);
      if (window.evaYield) await window.evaYield();
    }
    return { order, params, weights: { ...weights }, scales: { ...scales }, normalization: "fixed-G0-eligible-CI", rootConfig };
  }

  function staticEligibleFixed(weights, params, rootConfig, scales, eligibleIds) {
    const ids = eligibleIds || eligibleIdSet();
    const sc = scales || fixedReferenceEligible(params, rootConfig, ids);
    const state = evaluateEligibleFixed([], weights, params, sc, rootConfig, ids);
    return state.ranked.map((p, i) => ({
      rank: i + 1,
      id: p.id,
      nombre: p.nombre,
      escala: projectProps(p.id).escala || p.escala || null,
      score: +num(p.score).toFixed(6),
      poblacion_marginal: num(p.poblacion),
      demanda_habilitada: num(p.demandaHabilitada),
      componentes_unidos: num(p.componentesUnidos),
      grado_dendritico: p.gradoSeparacion == null ? null : num(p.gradoSeparacion),
      score_dendritico: num(p.scorePrioridad),
    }));
  }

  async function sequentialEligibleOperational(weights, opts) {
    opts = opts || {};
    const params = { ...(window.PARAM_DEFAULTS || {}), perfil: "general", segKSI: false, ...(opts.params || {}) };
    const rootConfig = opts.rootConfig || null;
    const eligibleIds = opts.eligibleIds || eligibleIdSet();
    const maxSteps = Math.min(opts.maxSteps || 20, eligibleIds.size);
    const lockedGeoms = [];
    const order = [];

    for (let step = 1; step <= maxSteps; step++) {
      setRoot(rootConfig);
      const state = base.evaluateState(lockedGeoms, weights, params);
      const lockedIds = new Set(lockedGeoms.map(f => f.properties && f.properties.id));
      const activeScales = makeEligibleScales(state.enriched, eligibleIds, lockedIds);
      const ranked = rankEligibleFromState(state, weights, activeScales, eligibleIds, lockedIds);
      const chosen = ranked[0];
      if (!chosen) break;
      const geom = projectGeom(chosen.id);
      if (!geom) break;
      lockedGeoms.push(geom);
      order.push(stepRecord(step, chosen, chosen.score, lockedGeoms, params));
      if (window.evaYield) await window.evaYield();
    }
    return { order, params, weights: { ...weights }, normalization: "active-set-eligible-CI", rootConfig };
  }

  function jaccard(a, b) {
    const A = new Set(a), B = new Set(b);
    let inter = 0;
    for (const x of A) if (B.has(x)) inter++;
    const u = new Set([...A, ...B]).size;
    return u ? inter / u : null;
  }

  function compareSequences(aRows, bRows, ks) {
    const pseudo = (aRows || []).map((r, i) => ({ id: r.id, rank: i + 1 }));
    return base.compareRankSequence(pseudo, bRows || [], ks).map(x => ({ ...x, reference: "A", comparison: "B" }));
  }

  function robustFrequency(runs, k) {
    const count = new Map();
    for (const run of runs) {
      (run.order || []).slice(0, k).forEach(r => count.set(r.id, (count.get(r.id) || 0) + 1));
    }
    const n = runs.length || 1;
    return Array.from(count, ([id, c]) => ({ id, frecuencia: c / n, apariciones: c, escenarios: n }))
      .sort((a, b) => b.frecuencia - a.frecuencia || String(a.id).localeCompare(String(b.id)));
  }

  function couplingSummary(pairs, thresholds) {
    const directed = [];
    for (const r of pairs || []) {
      directed.push(num(r.interaction_p_on_q));
      directed.push(num(r.interaction_q_on_p));
    }
    const abs = directed.map(Math.abs);
    const signedMean = directed.length ? directed.reduce((a, b) => a + b, 0) / directed.length : null;
    const out = {
      directed_interactions: directed.length,
      K_mean_abs_interaction: abs.length ? abs.reduce((a, b) => a + b, 0) / abs.length : null,
      signed_mean_interaction: signedMean,
      positive_interactions: directed.filter(v => v > 0).length,
      negative_interactions: directed.filter(v => v < 0).length,
      zero_interactions: directed.filter(v => v === 0).length,
    };
    for (const eps of (thresholds || [0.005, 0.01, 0.025, 0.05])) {
      out[`Q_eps_${String(eps).replace('.', '_')}`] = abs.length ? abs.filter(v => v >= eps).length / abs.length : null;
    }
    return out;
  }

  async function orderEffectEligible(staticRows, weights, params, rootConfig, scales, eligibleIds, topN, delta) {
    const selected = (staticRows || []).slice(0, topN || 20);
    const d = delta == null ? 1 : +delta;
    const s0 = new Map(selected.map(r => [r.id, num(r.score)]));
    const after = new Map();

    for (let i = 0; i < selected.length; i++) {
      const p = selected[i];
      console.log(`[paper-rmc] order ${i + 1}/${selected.length}: ${p.id}`);
      const geom = projectGeom(p.id);
      if (!geom) continue;
      const state = evaluateEligibleFixed([geom], weights, params, scales, rootConfig, eligibleIds);
      after.set(p.id, new Map(state.ranked.map(q => [q.id, num(q.score)])));
      if (window.evaYield) await window.evaYield();
    }

    const pairs = [];
    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        const p = selected[i], q = selected[j];
        const sp = s0.get(p.id), sq = s0.get(q.id);
        const sqAfterP = after.get(p.id) && after.get(p.id).get(q.id);
        const spAfterQ = after.get(q.id) && after.get(q.id).get(p.id);
        if (sqAfterP == null || spAfterQ == null) continue;
        const vpq = sp + d * sqAfterP;
        const vqp = sq + d * spAfterQ;
        pairs.push({
          p_id: p.id, p_nombre: p.nombre,
          q_id: q.id, q_nombre: q.nombre,
          score_p_G0: sp, score_q_G0: sq,
          score_q_after_p: sqAfterP, score_p_after_q: spAfterQ,
          interaction_p_on_q: sqAfterP - sq,
          interaction_q_on_p: spAfterQ - sp,
          V_pq: vpq, V_qp: vqp,
          delta_order: vpq - vqp,
          abs_delta_order: Math.abs(vpq - vqp),
        });
      }
    }
    pairs.sort((a, b) => b.abs_delta_order - a.abs_delta_order);
    return {
      normalization: "fixed-G0-eligible-CI",
      scenario: "ponderacion_rmc",
      top_n: selected.length,
      delta: d,
      projects: selected.map(x => ({ id: x.id, nombre: x.nombre, escala: x.escala, static_rank: x.rank, score: x.score })),
      pairs,
      coupling: couplingSummary(pairs),
    };
  }

  async function policySensitivity(params, rootConfig, scales, eligibleIds, maxSteps) {
    const scenarios = (window.EVA_SCENARIOS || []).filter(s => s && s.weights);
    const runs = [];
    for (let i = 0; i < scenarios.length; i++) {
      const s = scenarios[i];
      console.log(`[paper-rmc] policy ${i + 1}/${scenarios.length}: ${s.nombre}`);
      const seq = await sequentialEligibleFixed({ ...s.weights }, {
        params, rootConfig, scales, eligibleIds, maxSteps: maxSteps || 10,
      });
      runs.push({ key: s.key, nombre: s.nombre, order: seq.order });
    }
    const ref = runs.find(r => r.key === "ponderacion_rmc") || runs[0] || { order: [] };
    return {
      reference_scenario: "ponderacion_rmc",
      normalization: "fixed-G0-eligible-CI",
      runs,
      pairwise_vs_rmc: runs.map(run => ({
        key: run.key,
        nombre: run.nombre,
        jaccard_top10: jaccard(ref.order.slice(0, 10).map(x => x.id), run.order.slice(0, 10).map(x => x.id)),
      })),
      robust_top10: robustFrequency(runs, 10),
    };
  }

  async function runCorrected(opts) {
    opts = opts || {};
    const params = { ...(window.PARAM_DEFAULTS || {}), perfil: "general", segKSI: false };
    const defaultRoot = base.rootCfg("Alameda", 100, 0.5);
    const eligibleIds = eligibleIdSet();
    const rmc = { ...((window.EVA_SCENARIO_MAP.ponderacion_rmc || {}).weights || {}) };
    const balance = { ...((window.EVA_SCENARIO_MAP.balanceado || {}).weights || {}) };
    const dendriticWeights = { ...((window.EVA_SCENARIO_MAP.fractal_alameda || {}).weights || rmc) };
    const scalesEligible = fixedReferenceEligible(params, defaultRoot, eligibleIds);

    const scaleCounts = {};
    for (const f of (rawPortfolio().features || [])) {
      const key = String((f.properties || {}).escala || "Sin escala");
      scaleCounts[key] = (scaleCounts[key] || 0) + 1;
    }

    const result = {
      generated_at: new Date().toISOString(),
      versions: { ...(window.EVA_VERSION || {}) },
      correction: {
        primary_scenario: "ponderacion_rmc",
        eligible_scales: ["Comunal", "Intercomunal"],
        excluded_scales: ["Metropolitano"],
        met_projects_are_candidates: false,
        met_projects_in_normalization_reference: false,
        note: "Los corredores MET se excluyen del conjunto factible y de los máximos de normalización de la cartera priorizable. La red existente y las capas de contexto permanecen sin cambios.",
      },
      counts: {
        projects_total: (rawPortfolio().features || []).length,
        projects_eligible: eligibleIds.size,
        projects_excluded: (rawPortfolio().features || []).length - eligibleIds.size,
        by_scale: scaleCounts,
        existing: (window.existingFC.features || []).length,
        od_hex: (window.populationFC.features || []).length,
      },
      normalization_reference: scalesEligible,
    };

    console.log("[paper-rmc] A · contraste principal RMC, C/I, escala fija G0");
    const staticRmc = staticEligibleFixed(rmc, params, defaultRoot, scalesEligible, eligibleIds);
    const seqRmc = await sequentialEligibleFixed(rmc, {
      params, rootConfig: defaultRoot, scales: scalesEligible, eligibleIds,
      maxSteps: opts.mainSteps || 30,
    });
    result.primary = {
      scenario: "ponderacion_rmc",
      universe: "Comunal+Intercomunal",
      normalization: "fixed-G0-eligible-CI",
      static: staticRmc,
      sequential: seqRmc.order,
      comparison: base.compareRankSequence(staticRmc, seqRmc.order),
    };

    console.log("[paper-rmc] A1 · sensibilidad de normalización elegible");
    const seqOper = await sequentialEligibleOperational(rmc, {
      params, rootConfig: defaultRoot, eligibleIds, maxSteps: opts.mainSteps || 30,
    });
    result.normalization_sensitivity = {
      fixed_sequence: seqRmc.order,
      operational_sequence: seqOper.order,
      comparison: compareSequences(seqRmc.order, seqOper.order),
    };

    console.log("[paper-rmc] A2 · efecto de orden RMC, C/I");
    result.order_effect = await orderEffectEligible(
      staticRmc, rmc, params, defaultRoot, scalesEligible, eligibleIds,
      opts.orderEffectTopN || 20,
      opts.orderEffectDelta == null ? 1 : opts.orderEffectDelta
    );

    console.log("[paper-rmc] B · sensibilidad a raíces dendríticas, C/I");
    const roots = base.chooseSpatialRoots(opts.rootCount || 6);
    const rootRuns = [];
    for (let i = 0; i < roots.length; i++) {
      const r = roots[i];
      console.log(`[paper-rmc] root ${i + 1}/${roots.length}: ${r.name}`);
      const seq = await sequentialEligibleFixed(dendriticWeights, {
        params,
        rootConfig: base.rootCfg(r.name, 100, 0.5),
        scales: scalesEligible,
        eligibleIds,
        maxSteps: opts.rootSteps || 10,
      });
      rootRuns.push({ root: r, order: seq.order });
    }
    const rootRef = rootRuns[0] || { order: [] };
    result.root_sensitivity = {
      scenario: "fractal_alameda",
      universe: "Comunal+Intercomunal",
      roots,
      runs: rootRuns,
      pairwise_vs_default: rootRuns.map(run => ({
        root: run.root.name,
        jaccard_top10: jaccard(rootRef.order.slice(0, 10).map(x => x.id), run.order.slice(0, 10).map(x => x.id)),
      })),
      robust_top10: robustFrequency(rootRuns, 10),
    };

    console.log("[paper-rmc] C · sensibilidad tau × alpha, C/I");
    const taus = opts.taus || [50, 75, 100, 150];
    const alphas = opts.alphas || [0.35, 0.50, 0.65, 0.80];
    const taRuns = [];
    for (const tau of taus) for (const alpha of alphas) {
      console.log(`[paper-rmc] tau=${tau} alpha=${alpha}`);
      const seq = await sequentialEligibleFixed(dendriticWeights, {
        params,
        rootConfig: base.rootCfg("Alameda", tau, alpha),
        scales: scalesEligible,
        eligibleIds,
        maxSteps: opts.tauAlphaSteps || 10,
      });
      taRuns.push({ tau, alpha, order: seq.order });
    }
    result.tau_alpha_sensitivity = {
      scenario: "fractal_alameda",
      universe: "Comunal+Intercomunal",
      runs: taRuns,
      robust_top10: robustFrequency(taRuns, 10),
    };

    console.log("[paper-rmc] D · sensibilidad de preferencias con referencia RMC");
    result.weight_sensitivity = await policySensitivity(
      params, defaultRoot, scalesEligible, eligibleIds, opts.weightSteps || 10
    );

    console.log("[paper-rmc] E · diseño factorial 2x2 W × elegibilidad");
    // Celdas all-project usan las funciones del experimento previo y su propia referencia G0.
    const allScales = base.fixedReference(params, defaultRoot);
    const allBalance = await base.sequentialFixed(balance, {
      params, rootConfig: defaultRoot, scales: allScales, maxSteps: opts.factorialSteps || 30,
    });
    const allRmc = await base.sequentialFixed(rmc, {
      params, rootConfig: defaultRoot, scales: allScales, maxSteps: opts.factorialSteps || 30,
    });
    const eligibleBalance = await sequentialEligibleFixed(balance, {
      params, rootConfig: defaultRoot, scales: scalesEligible, eligibleIds, maxSteps: opts.factorialSteps || 30,
    });
    const eligibleRmc = seqRmc;

    const cells = {
      balance_all: allBalance.order,
      rmc_all: allRmc.order,
      balance_eligible: eligibleBalance.order,
      rmc_eligible: eligibleRmc.order,
    };
    const comparisons = [];
    const pairs = [
      ["balance_all", "rmc_all", "efecto_W_con_todos"],
      ["balance_all", "balance_eligible", "efecto_elegibilidad_con_balanceado"],
      ["rmc_all", "rmc_eligible", "efecto_elegibilidad_con_RMC"],
      ["balance_eligible", "rmc_eligible", "efecto_W_en_CI"],
      ["balance_all", "rmc_eligible", "cambio_total_diseno"],
    ];
    for (const [a, b, label] of pairs) {
      for (const row of compareSequences(cells[a], cells[b], [5, 10, 20, 30])) {
        comparisons.push({ label, from: a, to: b, ...row });
      }
    }
    result.factorial_2x2 = { cells, comparisons };

    result.robust_core = {
      roots_top10_ge_08: result.root_sensitivity.robust_top10.filter(x => x.frecuencia >= 0.8),
      tau_alpha_top10_ge_08: result.tau_alpha_sensitivity.robust_top10.filter(x => x.frecuencia >= 0.8),
      policy_top10_ge_08: result.weight_sensitivity.robust_top10.filter(x => x.frecuencia >= 0.8),
    };

    setRoot(defaultRoot);
    console.log("[paper-rmc] Experimento correctivo completado");
    return result;
  }

  window.EVA_PAPER_EXPERIMENTS.runRmcEligible = runCorrected;
  window.EVA_PAPER_EXPERIMENTS.sequentialEligibleFixed = sequentialEligibleFixed;
  window.EVA_PAPER_EXPERIMENTS.staticEligibleFixed = staticEligibleFixed;
})();
