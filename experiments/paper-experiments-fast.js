/* Fast-path for purely dendritic experiments used by the paper CI.
   It preserves the full EVA engine for the multicriteria and relational
   baselines, but avoids running the complete OD/accessibility engine when
   the experimental score is exclusively the dendritic criterion. */
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

  function robustFrequency(runs, k) {
    const count = new Map();
    for (const run of runs) {
      (run.order || []).slice(0, k).forEach(r => count.set(r.id, (count.get(r.id) || 0) + 1));
    }
    const n = runs.length || 1;
    return Array.from(count, ([id, c]) => ({ id, frecuencia: c / n, apariciones: c, escenarios: n }))
      .sort((a, b) => b.frecuencia - a.frecuencia || String(a.id).localeCompare(String(b.id)));
  }

  async function runAllFast(opts) {
    opts = opts || {};
    const balance = { ...(window.EVA_SCENARIO_MAP.balanceado.weights || {}) };
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

    console.log("[paper] A/4 · ranking estático vs. secuencial");
    const staticRows = base.staticRanking(balance, { params, rootConfig: defaultRoot });
    const seqBalance = await base.sequential(balance, { params, rootConfig: defaultRoot, maxSteps: opts.mainSteps || 30 });
    result.static_vs_sequential = {
      static: staticRows,
      sequential: seqBalance.order,
      comparison: base.compareStaticSequential(staticRows, seqBalance.order),
    };

    console.log("[paper] B/4 · raíces dendríticas (fast-path)");
    const roots = base.chooseSpatialRoots(opts.rootCount || 6);
    const rootRuns = [];
    for (let i = 0; i < roots.length; i++) {
      const r = roots[i];
      console.log(`[paper] B/4 · ${i + 1}/${roots.length} ${r.name}`);
      const seq = await topologySequential(base.rootCfg(r.name, 100, 0.5), opts.rootSteps || 10);
      rootRuns.push({ root: r, order: seq.order });
    }
    const ref = rootRuns[0] || { order: [] };
    result.root_sensitivity = {
      roots,
      runs: rootRuns,
      pairwise_vs_default: rootRuns.map(run => ({
        root: run.root.name,
        jaccard_top10: jaccard(ref.order.slice(0, 10).map(x => x.id), run.order.slice(0, 10).map(x => x.id)),
      })),
      robust_top10: robustFrequency(rootRuns, 10),
    };

    console.log("[paper] C/4 · tau × alpha (fast-path)");
    const taus = opts.taus || [50, 75, 100, 150];
    const alphas = opts.alphas || [0.35, 0.50, 0.65, 0.80];
    const taRuns = [];
    for (const tau of taus) for (const alpha of alphas) {
      console.log(`[paper] C/4 · tau=${tau} alpha=${alpha}`);
      const seq = await topologySequential(base.rootCfg("Alameda", tau, alpha), opts.tauAlphaSteps || 10);
      taRuns.push({ tau, alpha, order: seq.order });
    }
    result.tau_alpha_sensitivity = { runs: taRuns, robust_top10: robustFrequency(taRuns, 10) };

    console.log("[paper] D/4 · baselines relacionales");
    const baselineKeys = opts.baselineKeys || ["poblacion", "demanda", "equidad", "continuidad", "costoInv"];
    const baselines = [];
    for (const key of baselineKeys) {
      console.log(`[paper] D/4 · ${key}`);
      const seq = await base.sequential(base.oneCriterion(key), { params, rootConfig: defaultRoot, maxSteps: opts.baselineSteps || 20 });
      baselines.push({ criterion: key, order: seq.order });
    }
    const dend = await topologySequential(defaultRoot, opts.baselineSteps || 20);
    baselines.push({ criterion: "fractal", order: dend.order });
    result.baselines = baselines;

    result.robust_core = {
      roots_top10: result.root_sensitivity.robust_top10.filter(x => x.frecuencia >= 0.8),
      tau_alpha_top10: result.tau_alpha_sensitivity.robust_top10.filter(x => x.frecuencia >= 0.8),
    };

    window.FRACTAL.setRootConfig(defaultRoot);
    console.log("[paper] Experimentos completados");
    return result;
  }

  window.EVA_PAPER_EXPERIMENTS.runAll = runAllFast;
  window.EVA_PAPER_EXPERIMENTS.topologySequential = topologySequential;
})();
