/* ============================================================
   EVA · Experimentos reproducibles para paper metodológico
   ------------------------------------------------------------
   Este módulo NO cambia el ranking operativo de la aplicación.
   Expone un laboratorio reproducible para estudiar:
   1) ranking estático vs. secuencial;
   2) sensibilidad a la raíz dendrítica;
   3) sensibilidad (tau, alpha);
   4) baselines unidimensionales.

   Salida: objetos JSON serializables que scripts externos pueden
   convertir a CSV/figuras sin depender de la interfaz React/Mapbox.
============================================================ */
(function () {
  "use strict";

  const CRITERIA = [
    "poblacion", "costoOD", "oportunidades", "equidad", "continuidad",
    "demanda", "ciclistas", "fractal", "estudiantes", "prioridadGore",
    "costoInv", "seguridad", "monumentos", "intermodal", "factibilidad", "parques",
  ];

  const KX = 92.6, KY = 111;

  function log(msg) {
    console.log(`[paper] ${msg}`);
    const el = document.getElementById("status");
    if (el) el.textContent = msg;
  }

  const num = v => Number.isFinite(+v) ? +v : 0;

  function paramsDefault() {
    return {
      ...(window.PARAM_DEFAULTS || {}),
      perfil: "general",
      segKSI: false,
    };
  }

  function zeroWeights() {
    return Object.fromEntries(CRITERIA.map(k => [k, 0]));
  }

  function oneCriterion(key) {
    return { ...zeroWeights(), [key]: 100 };
  }

  function totalWeight(weights) {
    return (Object.values(weights || {}).reduce((a, b) => a + num(b), 0) - num(weights && weights.monumentos)) || 1;
  }

  function scoreOf(p, weights) {
    const n = p.norm || {};
    const tw = totalWeight(weights);
    let s = 0;
    for (const k of CRITERIA) s += num(weights && weights[k]) * num(n[k]);
    return s / tw;
  }

  function rawPortfolio() {
    return (window.FC_RAW && window.FC_RAW["Plan Maestro"]) || window.projectsFC;
  }

  function setRootConfig(cfg) {
    if (!window.FRACTAL || !window.FRACTAL.setRootConfig || !cfg) return;
    window.FRACTAL.setRootConfig(cfg);
  }

  function computeDynamic(enriched, rawFC, lockedGeoms, weights) {
    if (num(weights && weights.ciclistas) > 0 && window.DEMANDA_MODAL) {
      const dm = window.DEMANDA_MODAL.computeAll(window.existingFC, rawFC, window.populationFC, lockedGeoms || []);
      const maxCicl = Math.max(1, ...dm.map(d => num(d.ciclistasInducidos)));
      dm.forEach((d, i) => {
        if (!enriched[i]) return;
        Object.assign(enriched[i], d);
        if (enriched[i].norm) enriched[i].norm.ciclistas = num(d.ciclistasInducidos) / maxCicl;
      });
    }

    if (num(weights && weights.fractal) > 0 && window.FRACTAL) {
      const fr = window.FRACTAL.computeForApp(rawFC, lockedGeoms || []);
      fr.forEach((d, i) => {
        if (!enriched[i]) return;
        enriched[i].gradoSeparacion = d.gradoSeparacion;
        enriched[i].scorePrioridad = d.scorePrioridad;
        if (enriched[i].norm) enriched[i].norm.fractal = num(d._fractalNorm);
      });
    }
  }

  function evaluateState(lockedGeoms, weights, params) {
    const rawFC = rawPortfolio();
    const runRes = window.ENGINE.run(
      window.existingFC,
      rawFC,
      window.populationFC,
      params || paramsDefault(),
      lockedGeoms || []
    );
    const enriched = runRes.enriched;
    computeDynamic(enriched, rawFC, lockedGeoms || [], weights || {});
    const lockedIds = new Set((lockedGeoms || []).map(f => f.properties && f.properties.id));
    const ranked = enriched
      .filter(p => !lockedIds.has(p.id))
      .map(p => ({ ...p, score: scoreOf(p, weights || {}) }))
      .sort((a, b) => b.score - a.score || String(a.id).localeCompare(String(b.id)));
    return { ranked, enriched, coverage: runRes.coverage };
  }

  function stepRecord(step, p, score, lockedGeoms, params) {
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

  async function sequential(weights, opts) {
    opts = opts || {};
    const params = { ...paramsDefault(), ...(opts.params || {}) };
    const rawFC = rawPortfolio();
    const maxSteps = Math.min(opts.maxSteps || 20, rawFC.features.length);
    const budget = opts.budget == null ? Infinity : +opts.budget;
    const lockedGeoms = [];
    const order = [];
    let usedBudget = 0;

    if (opts.rootConfig) setRootConfig(opts.rootConfig);

    for (let step = 1; step <= maxSteps; step++) {
      const { ranked } = evaluateState(lockedGeoms, weights, params);
      let chosen = null;
      for (const p of ranked) {
        if (usedBudget + num(p.costo) <= budget) { chosen = p; break; }
      }
      if (!chosen) break;
      const geom = rawFC.features.find(f => f.properties && f.properties.id === chosen.id);
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
    return { order, params, weights: { ...weights }, rootConfig: window.FRACTAL && window.FRACTAL.getRootConfig ? window.FRACTAL.getRootConfig() : null };
  }

  function staticRanking(weights, opts) {
    opts = opts || {};
    const params = { ...paramsDefault(), ...(opts.params || {}) };
    if (opts.rootConfig) setRootConfig(opts.rootConfig);
    const { ranked } = evaluateState([], weights, params);
    return ranked.map((p, i) => ({
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

  function pearson(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return null;
    const mx = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const my = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
    let nume = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) {
      const a = x[i] - mx, b = y[i] - my;
      nume += a * b; dx += a * a; dy += b * b;
    }
    const den = Math.sqrt(dx * dy);
    return den > 0 ? nume / den : null;
  }

  function kendallTau(seqIds, staticRankMap) {
    let concord = 0, discord = 0;
    for (let i = 0; i < seqIds.length; i++) {
      for (let j = i + 1; j < seqIds.length; j++) {
        const ri = staticRankMap.get(seqIds[i]);
        const rj = staticRankMap.get(seqIds[j]);
        if (ri == null || rj == null || ri === rj) continue;
        if (ri < rj) concord++; else discord++;
      }
    }
    const den = concord + discord;
    return den ? (concord - discord) / den : null;
  }

  function jaccard(a, b) {
    const A = new Set(a), B = new Set(b);
    let inter = 0;
    for (const x of A) if (B.has(x)) inter++;
    const uni = new Set([...A, ...B]).size;
    return uni ? inter / uni : null;
  }

  function compareStaticSequential(staticRows, seqRows, ks) {
    const staticRank = new Map(staticRows.map(r => [r.id, r.rank]));
    const staticIds = staticRows.map(r => r.id);
    const seqIds = seqRows.map(r => r.id);
    return (ks || [5, 10, 15, 20, 30]).filter(k => k <= seqIds.length).map(k => {
      const S = seqIds.slice(0, k);
      const x = S.map((_, i) => i + 1);
      const y = S.map(id => staticRank.get(id));
      const disp = S.map((id, i) => Math.abs((staticRank.get(id) || 0) - (i + 1)));
      return {
        k,
        jaccard_top_k: jaccard(staticIds.slice(0, k), S),
        spearman_rank: pearson(x, y),
        kendall_tau: kendallTau(S, staticRank),
        desplazamiento_medio: disp.reduce((a, b) => a + b, 0) / disp.length,
        desplazamiento_maximo: Math.max(...disp),
        coincidencias_top_k: S.filter(id => new Set(staticIds.slice(0, k)).has(id)).length,
      };
    });
  }

  function coordsOf(f) {
    const g = f && f.geometry;
    if (!g) return [];
    if (g.type === "LineString") return g.coordinates || [];
    if (g.type === "MultiLineString") return (g.coordinates || []).flat();
    return [];
  }

  function distKm(a, b) {
    const dx = (a[0] - b[0]) * KX, dy = (a[1] - b[1]) * KY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function rootGroups() {
    const groups = new Map();
    for (const f of (window.existingFC && window.existingFC.features || [])) {
      const p = f.properties || {};
      const name = String(p.eje || p.nombre || p.name || p.id || "").trim();
      if (!name) continue;
      const cs = coordsOf(f);
      if (!cs.length) continue;
      if (!groups.has(name)) groups.set(name, { name, km: 0, sx: 0, sy: 0, n: 0 });
      const g = groups.get(name);
      g.km += num(p.km);
      for (const c of cs) { g.sx += c[0]; g.sy += c[1]; g.n++; }
    }
    return Array.from(groups.values()).map(g => ({
      name: g.name,
      km: g.km,
      centroid: [g.sx / g.n, g.sy / g.n],
    }));
  }

  function chooseSpatialRoots(n) {
    n = n || 6;
    let groups = rootGroups().filter(g => g.km >= 1);
    if (groups.length < n) groups = rootGroups();
    const alamedaCandidates = groups.filter(g => /alameda/i.test(g.name)).sort((a, b) => b.km - a.km);
    const selected = [alamedaCandidates[0] || groups.sort((a, b) => b.km - a.km)[0]].filter(Boolean);
    while (selected.length < Math.min(n, groups.length)) {
      let best = null, bestD = -1;
      for (const g of groups) {
        if (selected.some(s => s.name === g.name)) continue;
        const d = Math.min(...selected.map(s => distKm(g.centroid, s.centroid)));
        // Pequeña preferencia por ejes de longitud suficiente sin dominar la dispersión espacial.
        const score = d * (1 + Math.min(0.25, g.km / 100));
        if (score > bestD) { bestD = score; best = g; }
      }
      if (!best) break;
      selected.push(best);
    }
    return selected;
  }

  function rootCfg(name, toleranceM, alpha) {
    return {
      source: "existing",
      rootValue: name,
      rootLabel: name,
      matchMode: /alameda/i.test(name) ? "contains" : "exact",
      expandConnected: true,
      includeMatchingProjects: true,
      toleranceM: toleranceM == null ? 100 : toleranceM,
      alpha: alpha == null ? 0.5 : alpha,
    };
  }

  function robustFrequency(runs, k) {
    const count = new Map();
    for (const run of runs) {
      const ids = (run.order || []).slice(0, k).map(r => r.id);
      ids.forEach(id => count.set(id, (count.get(id) || 0) + 1));
    }
    const n = runs.length || 1;
    return Array.from(count.entries())
      .map(([id, c]) => ({ id, frecuencia: c / n, apariciones: c, escenarios: n }))
      .sort((a, b) => b.frecuencia - a.frecuencia || String(a.id).localeCompare(String(b.id)));
  }

  async function runAll(opts) {
    opts = opts || {};
    const balance = { ...(window.EVA_SCENARIO_MAP.balanceado.weights || {}) };
    const topologyOnly = oneCriterion("fractal");
    const defaultRoot = rootCfg("Alameda", 100, 0.5);
    const params = paramsDefault();

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

    log("A/4 · ranking estático vs. secuencial (escenario Balanceado)");
    setRootConfig(defaultRoot);
    const staticRows = staticRanking(balance, { params, rootConfig: defaultRoot });
    const seqBalance = await sequential(balance, { params, rootConfig: defaultRoot, maxSteps: opts.mainSteps || 30 });
    result.static_vs_sequential = {
      static: staticRows,
      sequential: seqBalance.order,
      comparison: compareStaticSequential(staticRows, seqBalance.order),
    };

    log("B/4 · sensibilidad a raíces espacialmente diversas");
    const roots = chooseSpatialRoots(opts.rootCount || 6);
    const rootRuns = [];
    for (let i = 0; i < roots.length; i++) {
      const r = roots[i];
      log(`B/4 · raíz ${i + 1}/${roots.length}: ${r.name}`);
      const seq = await sequential(topologyOnly, {
        params,
        rootConfig: rootCfg(r.name, 100, 0.5),
        maxSteps: opts.rootSteps || 15,
      });
      rootRuns.push({ root: r, order: seq.order });
    }
    const baseRootRun = rootRuns[0];
    result.root_sensitivity = {
      roots,
      runs: rootRuns,
      pairwise_vs_default: rootRuns.map(run => ({
        root: run.root.name,
        jaccard_top10: jaccard((baseRootRun.order || []).slice(0, 10).map(x => x.id), (run.order || []).slice(0, 10).map(x => x.id)),
      })),
      robust_top10: robustFrequency(rootRuns.map(r => ({ order: r.order })), 10),
    };

    log("C/4 · sensibilidad dendrítica tau × alpha");
    const taus = opts.taus || [50, 75, 100, 150];
    const alphas = opts.alphas || [0.35, 0.50, 0.65, 0.80];
    const taRuns = [];
    for (const tau of taus) {
      for (const alpha of alphas) {
        log(`C/4 · tau=${tau} m · alpha=${alpha}`);
        const seq = await sequential(topologyOnly, {
          params,
          rootConfig: rootCfg("Alameda", tau, alpha),
          maxSteps: opts.tauAlphaSteps || 10,
        });
        taRuns.push({ tau, alpha, order: seq.order });
      }
    }
    result.tau_alpha_sensitivity = {
      runs: taRuns,
      robust_top10: robustFrequency(taRuns, 10),
    };

    log("D/4 · baselines unidimensionales");
    const baselineKeys = opts.baselineKeys || ["poblacion", "demanda", "equidad", "continuidad", "costoInv", "fractal"];
    const baselines = [];
    for (const key of baselineKeys) {
      log(`D/4 · baseline ${key}`);
      const seq = await sequential(oneCriterion(key), {
        params,
        rootConfig: defaultRoot,
        maxSteps: opts.baselineSteps || 20,
      });
      baselines.push({ criterion: key, order: seq.order });
    }
    result.baselines = baselines;

    result.robust_core = {
      roots_top10: result.root_sensitivity.robust_top10.filter(x => x.frecuencia >= 0.8),
      tau_alpha_top10: result.tau_alpha_sensitivity.robust_top10.filter(x => x.frecuencia >= 0.8),
    };

    setRootConfig(defaultRoot);
    log("Experimentos completados");
    return result;
  }

  window.EVA_PAPER_EXPERIMENTS = {
    runAll,
    sequential,
    staticRanking,
    evaluateState,
    compareStaticSequential,
    chooseSpatialRoots,
    oneCriterion,
    rootCfg,
  };
})();
