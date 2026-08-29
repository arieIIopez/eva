/* Methodological extensions for the paper CI.
   The full EVA engine is preserved whenever a topological parameter must
   interact with the multicriteria score. A pure dendritic fast-path is kept
   only for the unidimensional dendritic baseline. This layer also computes
   a pairwise order-effect matrix and corrects Spearman correlation by
   re-ranking the common project subset. */
(function () {
  "use strict";
  const base = window.EVA_PAPER_EXPERIMENTS;
  if (!base || !window.FRACTAL) return;

  const num = v => Number.isFinite(+v) ? +v : 0;
  const rawPortfolio = () => (window.FC_RAW && window.FC_RAW["Plan Maestro"]) || window.projectsFC;

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

  function kendallTau(seqIds, staticRank) {
    let concord = 0, discord = 0;
    for (let i = 0; i < seqIds.length; i++) {
      for (let j = i + 1; j < seqIds.length; j++) {
        const ri = staticRank.get(seqIds[i]), rj = staticRank.get(seqIds[j]);
        if (ri == null || rj == null || ri === rj) continue;
        if (ri < rj) concord++; else discord++;
      }
    }
    const den = concord + discord;
    return den ? (concord - discord) / den : null;
  }

  function compareStaticSequentialCorrect(staticRows, seqRows, ks) {
    const staticRank = new Map(staticRows.map(r => [r.id, r.rank]));
    const staticIds = staticRows.map(r => r.id);
    const seqIds = seqRows.map(r => r.id);
    return (ks || [5, 10, 15, 20, 30]).filter(k => k <= seqIds.length).map(k => {
      const S = seqIds.slice(0, k);
      // Spearman requires ranks within the same object set; gaps in the full
      // static ranking are therefore compressed before Pearson correlation.
      const orderedByStatic = [...S].sort((a, b) => staticRank.get(a) - staticRank.get(b));
      const restrictedStaticRank = new Map(orderedByStatic.map((id, i) => [id, i + 1]));
      const x = S.map((_, i) => i + 1);
      const y = S.map(id => restrictedStaticRank.get(id));
      const topStatic = new Set(staticIds.slice(0, k));
      const disp = S.map((id, i) => Math.abs((staticRank.get(id) || 0) - (i + 1)));
      return {
        k,
        jaccard_top_k: jaccard(staticIds.slice(0, k), S),
        spearman_rank: pearson(x, y),
        kendall_tau: kendallTau(S, staticRank),
        desplazamiento_medio: disp.reduce((a, b) => a + b, 0) / disp.length,
        desplazamiento_maximo: Math.max(...disp),
        coincidencias_top_k: S.filter(id => topStatic.has(id)).length,
      };
    });
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

  async function orderEffectMatrix(staticRows, weights, params, rootConfig, topN, delta) {
    const rawFC = rawPortfolio();
    const selected = staticRows.slice(0, topN || 8);
    const d = delta == null ? 1 : +delta;
    window.FRACTAL.setRootConfig(rootConfig);

    const s0 = new Map(selected.map(r => [r.id, num(r.score)]));
    const after = new Map();

    // One state evaluation per selected project is enough to recover every
    // pairwise p→q effect; no N² engine evaluations are required.
    for (let i = 0; i < selected.length; i++) {
      const p = selected[i];
      console.log(`[paper] A2 · efecto de orden ${i + 1}/${selected.length}: fijando ${p.id}`);
      const geom = rawFC.features.find(f => f.properties && f.properties.id === p.id);
      if (!geom) continue;
      const state = base.evaluateState([geom], weights, params);
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
    return { top_n: selected.length, delta: d, projects: selected.map(x => ({ id: x.id, nombre: x.nombre, static_rank: x.rank, score: x.score })), pairs };
  }

  async function scenarioSensitivity(params, rootConfig, maxSteps) {
    const scenarios = (window.EVA_SCENARIOS || []).filter(s => s && s.weights);
    const runs = [];
    for (let i = 0; i < scenarios.length; i++) {
      const s = scenarios[i];
      console.log(`[paper] E/5 · escenario W ${i + 1}/${scenarios.length}: ${s.nombre}`);
      const seq = await base.sequential({ ...s.weights }, {
        params,
        rootConfig,
        maxSteps: maxSteps || 10,
      });
      runs.push({ key: s.key, nombre: s.nombre, order: seq.order });
    }
    const ref = runs.find(r => r.key === "balanceado") || runs[0] || { order: [] };
    return {
      runs,
      pairwise_vs_balanceado: runs.map(run => ({
        key: run.key,
        nombre: run.nombre,
        jaccard_top10: jaccard(ref.order.slice(0, 10).map(x => x.id), run.order.slice(0, 10).map(x => x.id)),
      })),
      robust_top10: robustFrequency(runs, 10),
    };
  }

  async function runAllFast(opts) {
    opts = opts || {};
    const balance = { ...(window.EVA_SCENARIO_MAP.balanceado.weights || {}) };
    const dendriticWeights = { ...((window.EVA_SCENARIO_MAP.fractal_alameda || {}).weights || balance) };
    const params = { ...(window.PARAM_DEFAULTS || {}), perfil: "general", segKSI: false };
    const defaultRoot = base.rootCfg("Alameda", 100, 0.5);

    const result = {
      generated_at: new Date().toISOString(),
      versions: { ...(window.EVA_VERSION || {}) },
      counts: {
        projects: (rawPortfolio().features || []).length,
        existing: (window.existingFC.features || []).length,
        od_hex: (window.populationFC.features || []).length,
      },
      methodological_note: "Resultados computacionales del motor EVA. La aplicación empírica no implica validación del marco en otros modos de transporte.",
    };

    console.log("[paper] A/5 · ranking estático vs. secuencial");
    const staticRows = base.staticRanking(balance, { params, rootConfig: defaultRoot });
    const seqBalance = await base.sequential(balance, { params, rootConfig: defaultRoot, maxSteps: opts.mainSteps || 30 });
    result.static_vs_sequential = {
      static: staticRows,
      sequential: seqBalance.order,
      comparison: compareStaticSequentialCorrect(staticRows, seqBalance.order),
    };

    console.log("[paper] A2/5 · matriz pareada de efecto de orden");
    result.order_effect = await orderEffectMatrix(
      staticRows, balance, params, defaultRoot,
      opts.orderEffectTopN || 8,
      opts.orderEffectDelta == null ? 1 : opts.orderEffectDelta
    );

    console.log("[paper] B/5 · sensibilidad a la raíz bajo escenario dendrítico multicriterio");
    const roots = base.chooseSpatialRoots(opts.rootCount || 6);
    const rootRuns = [];
    for (let i = 0; i < roots.length; i++) {
      const r = roots[i];
      console.log(`[paper] B/5 · ${i + 1}/${roots.length} ${r.name}`);
      const seq = await base.sequential(dendriticWeights, {
        params,
        rootConfig: base.rootCfg(r.name, 100, 0.5),
        maxSteps: opts.rootSteps || 10,
      });
      rootRuns.push({ root: r, order: seq.order });
    }
    const ref = rootRuns[0] || { order: [] };
    result.root_sensitivity = {
      design: "escenario fractal_alameda con raíz variable; el resto de los pesos se mantiene constante",
      roots,
      runs: rootRuns,
      pairwise_vs_default: rootRuns.map(run => ({
        root: run.root.name,
        jaccard_top10: jaccard(ref.order.slice(0, 10).map(x => x.id), run.order.slice(0, 10).map(x => x.id)),
      })),
      robust_top10: robustFrequency(rootRuns, 10),
    };

    console.log("[paper] C/5 · tau × alpha bajo escenario dendrítico multicriterio");
    const taus = opts.taus || [50, 75, 100, 150];
    const alphas = opts.alphas || [0.35, 0.50, 0.65, 0.80];
    const taRuns = [];
    for (const tau of taus) for (const alpha of alphas) {
      console.log(`[paper] C/5 · tau=${tau} alpha=${alpha}`);
      // alpha is only ordinally relevant when the dendritic score competes
      // with other criteria. Therefore this block intentionally uses the
      // full multicriteria scenario rather than the pure topology fast-path.
      const seq = await base.sequential(dendriticWeights, {
        params,
        rootConfig: base.rootCfg("Alameda", tau, alpha),
        maxSteps: opts.tauAlphaSteps || 10,
      });
      taRuns.push({ tau, alpha, order: seq.order });
    }
    result.tau_alpha_sensitivity = {
      design: "escenario fractal_alameda; raíz Alameda; tau y alpha variables",
      runs: taRuns,
      robust_top10: robustFrequency(taRuns, 10),
    };

    console.log("[paper] D/5 · baselines relacionales");
    const baselineKeys = opts.baselineKeys || ["poblacion", "demanda", "equidad", "continuidad", "costoInv"];
    const baselines = [];
    for (const key of baselineKeys) {
      console.log(`[paper] D/5 · ${key}`);
      const seq = await base.sequential(base.oneCriterion(key), { params, rootConfig: defaultRoot, maxSteps: opts.baselineSteps || 20 });
      baselines.push({ criterion: key, order: seq.order });
    }
    const dend = await topologySequential(defaultRoot, opts.baselineSteps || 20);
    baselines.push({ criterion: "fractal", order: dend.order });
    result.baselines = baselines;

    console.log("[paper] E/5 · sensibilidad a preferencias W");
    result.weight_sensitivity = await scenarioSensitivity(params, defaultRoot, opts.weightSteps || 10);

    result.robust_core = {
      roots_top10: result.root_sensitivity.robust_top10.filter(x => x.frecuencia >= 0.8),
      tau_alpha_top10: result.tau_alpha_sensitivity.robust_top10.filter(x => x.frecuencia >= 0.8),
      policy_scenarios_top10: result.weight_sensitivity.robust_top10.filter(x => x.frecuencia >= 0.8),
    };

    window.FRACTAL.setRootConfig(defaultRoot);
    console.log("[paper] Experimentos completados");
    return result;
  }

  window.EVA_PAPER_EXPERIMENTS.runAll = runAllFast;
  window.EVA_PAPER_EXPERIMENTS.topologySequential = topologySequential;
  window.EVA_PAPER_EXPERIMENTS.orderEffectMatrix = orderEffectMatrix;
  window.EVA_PAPER_EXPERIMENTS.compareStaticSequentialCorrect = compareStaticSequentialCorrect;
  window.EVA_PAPER_EXPERIMENTS.scenarioSensitivity = scenarioSensitivity;
})();
