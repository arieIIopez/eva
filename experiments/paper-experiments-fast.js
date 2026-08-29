/* Methodological extensions for the paper CI.
   ------------------------------------------------------------
   The operational EVA engine normalizes several criteria against the
   maximum among currently active projects. That convention is useful in
   the application, but it can confound a scientific state-dependence test:
   removing the project that defines a maximum changes the denominator even
   when raw attributes do not change.

   This layer therefore provides TWO sequential evaluations:
   1) operational: EVA's active-set normalization;
   2) fixed-reference: criteria are scaled once at G0 and those scales are
      preserved during the sequence. Divergence R0 -> fixed-reference can be
      attributed to recalculated raw/state-dependent attributes rather than
      mechanically changing normalization denominators.

   The layer also computes pairwise order effects with fixed-reference
   scaling, coupling diagnostics, policy-weight sensitivity, and corrected
   dendritic sensitivity. A pure dendritic fast-path is retained only for
   the unidimensional dendritic baseline.
*/
(function () {
  "use strict";
  const base = window.EVA_PAPER_EXPERIMENTS;
  if (!base || !window.FRACTAL) return;

  const CRITERIA = [
    "poblacion", "costoOD", "oportunidades", "equidad", "continuidad",
    "demanda", "ciclistas", "fractal", "estudiantes", "prioridadGore",
    "costoInv", "seguridad", "monumentos", "intermodal", "factibilidad", "parques",
  ];

  const num = v => Number.isFinite(+v) ? +v : 0;
  const rawPortfolio = () => (window.FC_RAW && window.FC_RAW["Plan Maestro"]) || window.projectsFC;

  function totalWeight(weights) {
    return (Object.values(weights || {}).reduce((a, b) => a + num(b), 0) - num(weights && weights.monumentos)) || 1;
  }

  function max1(rows, fn) {
    return Math.max(1, ...rows.map(r => num(fn(r))));
  }

  function makeFixedScales(enriched) {
    const rows = (enriched || []).filter(p => !p._isLocked);
    return {
      reference: "G0",
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
      // EVA's dendritic norm is defined against the theoretical BASE=100,
      // not against the active candidate maximum. Preserve that convention.
      fractalBase: 100,
    };
  }

  function fixedNorm(p, scales) {
    const s = scales;
    return {
      poblacion: num(p.poblacion) / s.poblacion,
      costoOD: Math.abs(num(p.costoOD)) / s.costoOD,
      oportunidades: num(p.oportunidades) / s.oportunidades,
      equidad: num(p.equidad),
      continuidad: num(p.continuidad),
      demanda: num(p.demandaHabilitada) / s.demanda,
      ciclistas: num(p.ciclistasInducidos) / s.ciclistas,
      fractal: num(p.scorePrioridad) / s.fractalBase,
      estudiantes: num(p.estudiantes) / s.estudiantes,
      prioridadGore: p.prioridadGore == null ? 0.5 : num(p.prioridadGore),
      costoInv: 1 - num(p.costo) / s.costo,
      seguridad: num(p.siniestrosPeso) / s.seguridad,
      monumentos: num(p.monumentos) / s.monumentos,
      intermodal: num(p.metroEstaciones) / s.intermodal,
      factibilidad: num(p.numPistas) / s.factibilidad,
      parques: num(p.parquesSup) / s.parques,
    };
  }

  function fixedScore(p, weights, scales) {
    const n = fixedNorm(p, scales);
    const tw = totalWeight(weights);
    let score = 0;
    for (const k of CRITERIA) score += num(weights && weights[k]) * num(n[k]);
    return score / tw;
  }

  function allCriteriaWeights() {
    return Object.fromEntries(CRITERIA.map(k => [k, k === "monumentos" ? 0 : 1]));
  }

  function setRoot(rootConfig) {
    if (rootConfig && window.FRACTAL && window.FRACTAL.setRootConfig) window.FRACTAL.setRootConfig(rootConfig);
  }

  function fixedReference(params, rootConfig) {
    setRoot(rootConfig);
    // Force calculation of both dynamic criteria at G0 so their reference
    // scales are available even when a later policy scenario gives them 0.
    const state = base.evaluateState([], allCriteriaWeights(), params);
    return makeFixedScales(state.enriched);
  }

  function evaluateStateFixed(lockedGeoms, weights, params, scales, rootConfig) {
    setRoot(rootConfig);
    const state = base.evaluateState(lockedGeoms || [], weights || {}, params || {});
    const lockedIds = new Set((lockedGeoms || []).map(f => f.properties && f.properties.id));
    const ranked = state.enriched
      .filter(p => !lockedIds.has(p.id))
      .map(p => ({ ...p, score: fixedScore(p, weights || {}, scales) }))
      .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));
    return { ...state, ranked };
  }

  function projectGeom(id) {
    return rawPortfolio().features.find(f => f.properties && f.properties.id === id);
  }

  function fixedStepRecord(step, p, score, lockedGeoms, params) {
    const comp = window.ENGINE.buildComponents(
      window.existingFC,
      lockedGeoms,
      num(params.connectTol) || 150
    );
    return {
      step,
      id: p.id,
      nombre: p.nombre,
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

  async function sequentialFixed(weights, opts) {
    opts = opts || {};
    const params = { ...(window.PARAM_DEFAULTS || {}), perfil: "general", segKSI: false, ...(opts.params || {}) };
    const rootConfig = opts.rootConfig || null;
    const rawFC = rawPortfolio();
    const maxSteps = Math.min(opts.maxSteps || 20, rawFC.features.length);
    const budget = opts.budget == null ? Infinity : +opts.budget;
    const scales = opts.scales || fixedReference(params, rootConfig);
    const lockedGeoms = [];
    const order = [];
    let usedBudget = 0;

    for (let step = 1; step <= maxSteps; step++) {
      const { ranked } = evaluateStateFixed(lockedGeoms, weights, params, scales, rootConfig);
      let chosen = null;
      for (const p of ranked) {
        if (usedBudget + num(p.costo) <= budget) { chosen = p; break; }
      }
      if (!chosen) break;
      const geom = projectGeom(chosen.id);
      if (!geom) break;
      lockedGeoms.push(geom);
      usedBudget += num(chosen.costo);
      const rec = fixedStepRecord(step, chosen, chosen.score, lockedGeoms, params);
      rec.cum_poblacion_marginal = num((order.at(-1) || {}).cum_poblacion_marginal) + rec.poblacion_marginal;
      rec.cum_demanda_habilitada = num((order.at(-1) || {}).cum_demanda_habilitada) + rec.demanda_habilitada;
      rec.cum_ciclistas_inducidos = num((order.at(-1) || {}).cum_ciclistas_inducidos) + rec.ciclistas_inducidos;
      rec.cum_costo_mclp = usedBudget;
      order.push(rec);
      if (window.evaYield) await window.evaYield();
    }
    return { order, params, weights: { ...weights }, scales: { ...scales }, normalization: "fixed-G0", rootConfig };
  }

  function staticRankingFixed(weights, params, rootConfig, scales) {
    const sc = scales || fixedReference(params, rootConfig);
    const state = evaluateStateFixed([], weights, params, sc, rootConfig);
    return state.ranked.map((p, i) => ({
      rank: i + 1,
      id: p.id,
      nombre: p.nombre,
      score: +num(p.score).toFixed(6),
      poblacion_marginal: num(p.poblacion),
      demanda_habilitada: num(p.demandaHabilitada),
      componentes_unidos: num(p.componentesUnidos),
      grado_dendritico: p.gradoSeparacion == null ? null : num(p.gradoSeparacion),
      score_dendritico: num(p.scorePrioridad),
    }));
  }

  async function topologySequential(rootConfig, maxSteps) {
    const rawFC = rawPortfolio();
    const lockedGeoms = [];
    const order = [];
    window.FRACTAL.setRootConfig(rootConfig);

    for (let step = 1; step <= Math.min(maxSteps || 10, rawFC.features.length); step++) {
      const fr = window.FRACTAL.computeForApp(rawFC, lockedGeoms);
      const lockedIds = new Set(lockedGeoms.map(f => f.properties && f.properties.id));
      const ranked = fr.map((d, i) => {
        const f = rawFC.features[i];
        const p = f.properties || {};
        return {
          i,
          id: p.id,
          nombre: p.nombre || p.eje || p.id,
          costo: num(p.costo),
          score: num(d._fractalNorm),
          grado: d.gradoSeparacion,
          scoreD: num(d.scorePrioridad),
        };
      }).filter(x => !lockedIds.has(x.id))
        .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));

      const chosen = ranked[0];
      if (!chosen) break;
      lockedGeoms.push(rawFC.features[chosen.i]);
      order.push({
        step,
        id: chosen.id,
        nombre: chosen.nombre,
        score: +chosen.score.toFixed(6),
        poblacion_marginal: 0,
        poblacion_beneficiada: 0,
        demanda_habilitada: 0,
        ciclistas_inducidos: 0,
        componentes_unidos: 0,
        componentes_red: null,
        costo_mclp: chosen.costo,
        grado_dendritico: chosen.grado == null ? null : num(chosen.grado),
        score_dendritico: chosen.scoreD,
      });
      if (window.evaYield) await window.evaYield();
    }
    return { order, rootConfig: window.FRACTAL.getRootConfig() };
  }

  function jaccard(a, b) {
    const A = new Set(a), B = new Set(b);
    let inter = 0;
    for (const x of A) if (B.has(x)) inter++;
    const u = new Set([...A, ...B]).size;
    return u ? inter / u : null;
  }

  function pearson(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return null;
    const mx = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const my = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - mx, dy = y[i] - my;
      sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
    }
    const den = Math.sqrt(sxx * syy);
    return den > 0 ? sxy / den : null;
  }

  function kendallTau(seqIds, referenceRank) {
    let concord = 0, discord = 0;
    for (let i = 0; i < seqIds.length; i++) {
      for (let j = i + 1; j < seqIds.length; j++) {
        const ri = referenceRank.get(seqIds[i]), rj = referenceRank.get(seqIds[j]);
        if (ri == null || rj == null || ri === rj) continue;
        if (ri < rj) concord++; else discord++;
      }
    }
    const den = concord + discord;
    return den ? (concord - discord) / den : null;
  }

  function compareRankSequence(referenceRows, seqRows, ks) {
    const referenceRank = new Map(referenceRows.map(r => [r.id, r.rank]));
    const referenceIds = referenceRows.map(r => r.id);
    const seqIds = seqRows.map(r => r.id);
    return (ks || [5, 10, 15, 20, 30]).filter(k => k <= seqIds.length).map(k => {
      const S = seqIds.slice(0, k);
      const orderedRef = [...S].sort((a, b) => referenceRank.get(a) - referenceRank.get(b));
      const restrictedRefRank = new Map(orderedRef.map((id, i) => [id, i + 1]));
      const x = S.map((_, i) => i + 1);
      const y = S.map(id => restrictedRefRank.get(id));
      const topReference = new Set(referenceIds.slice(0, k));
      const disp = S.map((id, i) => Math.abs((referenceRank.get(id) || 0) - (i + 1)));
      return {
        k,
        jaccard_top_k: jaccard(referenceIds.slice(0, k), S),
        spearman_rank: pearson(x, y),
        kendall_tau: kendallTau(S, referenceRank),
        desplazamiento_medio: disp.reduce((a, b) => a + b, 0) / disp.length,
        desplazamiento_maximo: Math.max(...disp),
        coincidencias_top_k: S.filter(id => topReference.has(id)).length,
      };
    });
  }

  function compareSequences(aRows, bRows, ks) {
    const aIds = aRows.map(r => r.id), bIds = bRows.map(r => r.id);
    const rankA = new Map(aIds.map((id, i) => [id, i + 1]));
    const pseudoRef = aIds.map((id, i) => ({ id, rank: i + 1 }));
    return compareRankSequence(pseudoRef, bRows, ks).map(x => ({ ...x, reference: "A", comparison: "B" }));
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
    const C = abs.length ? abs.reduce((a, b) => a + b, 0) / abs.length : null;
    const out = { directed_interactions: directed.length, C_mean_abs_interaction: C };
    for (const eps of (thresholds || [0.005, 0.01, 0.025, 0.05])) {
      out[`D_eps_${String(eps).replace('.', '_')}`] = abs.length ? abs.filter(v => v >= eps).length / abs.length : null;
    }
    return out;
  }

  async function orderEffectMatrixFixed(staticRows, weights, params, rootConfig, scales, topN, delta) {
    const selected = staticRows.slice(0, topN || 20);
    const d = delta == null ? 1 : +delta;
    setRoot(rootConfig);

    const s0 = new Map(selected.map(r => [r.id, num(r.score)]));
    const after = new Map();
    for (let i = 0; i < selected.length; i++) {
      const p = selected[i];
      console.log(`[paper] A2 · efecto de orden fijo ${i + 1}/${selected.length}: fijando ${p.id}`);
      const geom = projectGeom(p.id);
      if (!geom) continue;
      const state = evaluateStateFixed([geom], weights, params, scales, rootConfig);
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
          p_id: p.id,
          p_nombre: p.nombre,
          q_id: q.id,
          q_nombre: q.nombre,
          score_p_G0: sp,
          score_q_G0: sq,
          score_q_after_p: sqAfterP,
          score_p_after_q: spAfterQ,
          interaction_p_on_q: sqAfterP - sq,
          interaction_q_on_p: spAfterQ - sp,
          V_pq: vpq,
          V_qp: vqp,
          delta_order: vpq - vqp,
          abs_delta_order: Math.abs(vpq - vqp),
        });
      }
    }
    pairs.sort((a, b) => b.abs_delta_order - a.abs_delta_order);
    return {
      normalization: "fixed-G0",
      top_n: selected.length,
      delta: d,
      projects: selected.map(x => ({ id: x.id, nombre: x.nombre, static_rank: x.rank, score: x.score })),
      pairs,
      coupling: couplingSummary(pairs),
    };
  }

  async function scenarioSensitivityFixed(params, rootConfig, scales, maxSteps) {
    const scenarios = (window.EVA_SCENARIOS || []).filter(s => s && s.weights);
    const runs = [];
    for (let i = 0; i < scenarios.length; i++) {
      const s = scenarios[i];
      console.log(`[paper] E/5 · escenario W ${i + 1}/${scenarios.length}: ${s.nombre}`);
      const seq = await sequentialFixed({ ...s.weights }, {
        params, rootConfig, scales, maxSteps: maxSteps || 10,
      });
      runs.push({ key: s.key, nombre: s.nombre, order: seq.order });
    }
    const ref = runs.find(r => r.key === "balanceado") || runs[0] || { order: [] };
    return {
      normalization: "fixed-G0",
      runs,
      pairwise_vs_balanceado: runs.map(run => ({
        key: run.key,
        nombre: run.nombre,
        jaccard_top10: jaccard(ref.order.slice(0, 10).map(x => x.id), run.order.slice(0, 10).map(x => x.id)),
      })),
      robust_top10: robustFrequency(runs, 10),
    };
  }

  async function runAllFixed(opts) {
    opts = opts || {};
    const balance = { ...(window.EVA_SCENARIO_MAP.balanceado.weights || {}) };
    const dendriticWeights = { ...((window.EVA_SCENARIO_MAP.fractal_alameda || {}).weights || balance) };
    const params = { ...(window.PARAM_DEFAULTS || {}), perfil: "general", segKSI: false };
    const defaultRoot = base.rootCfg("Alameda", 100, 0.5);
    const scales = fixedReference(params, defaultRoot);

    const result = {
      generated_at: new Date().toISOString(),
      versions: { ...(window.EVA_VERSION || {}) },
      counts: {
        projects: (rawPortfolio().features || []).length,
        existing: (window.existingFC.features || []).length,
        od_hex: (window.populationFC.features || []).length,
      },
      normalization_reference: scales,
      methodological_note: "Resultados computacionales del motor EVA. La prueba principal fija las escalas de normalización en G0 para aislar el efecto de estado; la secuencia operacional se conserva como contraste separado. La aplicación empírica no implica validación del marco en otros modos de transporte.",
    };

    console.log("[paper] A/5 · estático vs. secuencial con normalización fija G0");
    const staticFixed = staticRankingFixed(balance, params, defaultRoot, scales);
    const seqFixed = await sequentialFixed(balance, { params, rootConfig: defaultRoot, scales, maxSteps: opts.mainSteps || 30 });
    result.static_vs_sequential = {
      normalization: "fixed-G0",
      static: staticFixed,
      sequential: seqFixed.order,
      comparison: compareRankSequence(staticFixed, seqFixed.order),
    };

    console.log("[paper] A1b/5 · secuencia operacional para contraste de normalización");
    const staticOperational = base.staticRanking(balance, { params, rootConfig: defaultRoot });
    const seqOperational = await base.sequential(balance, { params, rootConfig: defaultRoot, maxSteps: opts.mainSteps || 30 });
    result.operational_static_vs_sequential = {
      normalization: "active-set",
      static: staticOperational,
      sequential: seqOperational.order,
      comparison: compareRankSequence(staticOperational, seqOperational.order),
    };
    result.normalization_sensitivity = {
      fixed_vs_operational_sequence: compareSequences(seqFixed.order, seqOperational.order),
    };

    console.log("[paper] A2/5 · matriz pareada de efecto de orden con normalización fija");
    result.order_effect = await orderEffectMatrixFixed(
      staticFixed, balance, params, defaultRoot, scales,
      opts.orderEffectTopN || 20,
      opts.orderEffectDelta == null ? 1 : opts.orderEffectDelta
    );

    console.log("[paper] B/5 · sensibilidad a raíz con normalización fija");
    const roots = base.chooseSpatialRoots(opts.rootCount || 6);
    const rootRuns = [];
    for (let i = 0; i < roots.length; i++) {
      const r = roots[i];
      console.log(`[paper] B/5 · ${i + 1}/${roots.length} ${r.name}`);
      const seq = await sequentialFixed(dendriticWeights, {
        params,
        rootConfig: base.rootCfg(r.name, 100, 0.5),
        scales,
        maxSteps: opts.rootSteps || 10,
      });
      rootRuns.push({ root: r, order: seq.order });
    }
    const ref = rootRuns[0] || { order: [] };
    result.root_sensitivity = {
      normalization: "fixed-G0",
      design: "escenario fractal_alameda con raíz variable; demás pesos y escalas G0 constantes",
      roots,
      runs: rootRuns,
      pairwise_vs_default: rootRuns.map(run => ({
        root: run.root.name,
        jaccard_top10: jaccard(ref.order.slice(0, 10).map(x => x.id), run.order.slice(0, 10).map(x => x.id)),
      })),
      robust_top10: robustFrequency(rootRuns, 10),
    };

    console.log("[paper] C/5 · tau × alpha con normalización fija");
    const taus = opts.taus || [50, 75, 100, 150];
    const alphas = opts.alphas || [0.35, 0.50, 0.65, 0.80];
    const taRuns = [];
    for (const tau of taus) for (const alpha of alphas) {
      console.log(`[paper] C/5 · tau=${tau} alpha=${alpha}`);
      const seq = await sequentialFixed(dendriticWeights, {
        params,
        rootConfig: base.rootCfg("Alameda", tau, alpha),
        scales,
        maxSteps: opts.tauAlphaSteps || 10,
      });
      taRuns.push({ tau, alpha, order: seq.order });
    }
    result.tau_alpha_sensitivity = {
      normalization: "fixed-G0",
      design: "escenario fractal_alameda; raíz Alameda; tau y alpha variables; escalas G0 constantes",
      runs: taRuns,
      robust_top10: robustFrequency(taRuns, 10),
    };

    console.log("[paper] D/5 · baselines relacionales");
    const baselineKeys = opts.baselineKeys || ["poblacion", "demanda", "equidad", "continuidad", "costoInv"];
    const baselines = [];
    for (const key of baselineKeys) {
      console.log(`[paper] D/5 · ${key}`);
      const seq = await sequentialFixed(base.oneCriterion(key), {
        params, rootConfig: defaultRoot, scales, maxSteps: opts.baselineSteps || 20,
      });
      baselines.push({ criterion: key, normalization: "fixed-G0", order: seq.order });
    }
    const dend = await topologySequential(defaultRoot, opts.baselineSteps || 20);
    baselines.push({ criterion: "fractal", normalization: "intrinsic-0-1", order: dend.order });
    result.baselines = baselines;

    console.log("[paper] E/5 · sensibilidad a preferencias W con escalas fijas");
    result.weight_sensitivity = await scenarioSensitivityFixed(params, defaultRoot, scales, opts.weightSteps || 10);

    result.robust_core = {
      roots_top10: result.root_sensitivity.robust_top10.filter(x => x.frecuencia >= 0.8),
      tau_alpha_top10: result.tau_alpha_sensitivity.robust_top10.filter(x => x.frecuencia >= 0.8),
      policy_scenarios_top10: result.weight_sensitivity.robust_top10.filter(x => x.frecuencia >= 0.8),
    };

    window.FRACTAL.setRootConfig(defaultRoot);
    console.log("[paper] Experimentos completados");
    return result;
  }

  window.EVA_PAPER_EXPERIMENTS.runAll = runAllFixed;
  window.EVA_PAPER_EXPERIMENTS.topologySequential = topologySequential;
  window.EVA_PAPER_EXPERIMENTS.fixedReference = fixedReference;
  window.EVA_PAPER_EXPERIMENTS.fixedNorm = fixedNorm;
  window.EVA_PAPER_EXPERIMENTS.fixedScore = fixedScore;
  window.EVA_PAPER_EXPERIMENTS.sequentialFixed = sequentialFixed;
  window.EVA_PAPER_EXPERIMENTS.orderEffectMatrixFixed = orderEffectMatrixFixed;
  window.EVA_PAPER_EXPERIMENTS.compareRankSequence = compareRankSequence;
  window.EVA_PAPER_EXPERIMENTS.scenarioSensitivityFixed = scenarioSensitivityFixed;
})();
