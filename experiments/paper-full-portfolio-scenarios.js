/* ============================================================
   EVA · Experimento EDTR: cartera completa C/I y tres escenarios W
   ------------------------------------------------------------
   Ejecuta las 124 ciclovías Comunales + Intercomunales hasta agotar
   el conjunto factible, bajo tres ponderaciones:
   - Ponderación RMC
   - Balanceado
   - Logit (alias experimental del escenario ciclistas_biogeme)

   Todas las corridas comparten:
   - mismo conjunto factible P^f;
   - misma red base;
   - misma estrategia topológica y parámetros;
   - normalización fija en G0 sobre las 124 alternativas elegibles.

   La comparación entre escenarios NO interpreta los puntajes propios de
   cada W como una escala normativa común. Se reportan:
   1) diferencias de orden;
   2) métricas físicas/estructurales comunes;
   3) evaluación cruzada: cada trayectoria se puntúa también con los otros W.
============================================================ */
(function () {
  "use strict";

  const base = window.EVA_PAPER_EXPERIMENTS;
  if (!base || !base.evaluateState || !base.fixedScore || !base.rootCfg) {
    throw new Error("paper-full-portfolio-scenarios.js requiere paper-experiments-fast.js");
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

  function initialRanking(weights, params, scales, rootConfig, eligibleIds) {
    const state = evaluateEligibleFixed([], weights, params, scales, rootConfig, eligibleIds);
    return state.ranked.map((p, i) => ({
      rank: i + 1,
      id: p.id,
      nombre: p.nombre,
      escala: projectProps(p.id).escala || p.escala || null,
      score: num(p.score),
      costo_mclp: num(p.costo),
    }));
  }

  function scenarioDefinitions() {
    const map = window.EVA_SCENARIO_MAP || {};
    const defs = [
      { key: "ponderacion_rmc", label: "RMC", sourceKey: "ponderacion_rmc" },
      { key: "balanceado", label: "Balanceado", sourceKey: "balanceado" },
      { key: "logit", label: "Logit (Biogeme)", sourceKey: "ciclistas_biogeme" },
    ];
    return defs.map(d => {
      const src = map[d.sourceKey];
      if (!src || !src.weights) throw new Error(`Escenario EVA no disponible: ${d.sourceKey}`);
      return { ...d, sourceName: src.nombre, weights: { ...src.weights } };
    });
  }

  function crossScores(project, evaluators, scales) {
    const out = {};
    for (const ev of evaluators) out[ev.key] = base.fixedScore(project, ev.weights, scales);
    return out;
  }

  async function simulateFullScenario(def, evaluators, params, scales, rootConfig, eligibleIds, discount) {
    const lockedGeoms = [];
    const rows = [];
    const initialRows = initialRanking(def.weights, params, scales, rootConfig, eligibleIds);
    const initialMap = new Map(initialRows.map(r => [r.id, r]));
    const n = eligibleIds.size;

    for (let step = 1; step <= n; step++) {
      const state = evaluateEligibleFixed(lockedGeoms, def.weights, params, scales, rootConfig, eligibleIds);
      const chosen = state.ranked[0];
      if (!chosen) break;

      const geom = projectGeom(chosen.id);
      if (!geom) throw new Error(`No se encontró geometría para ${chosen.id}`);
      const initial = initialMap.get(chosen.id);
      const xscore = crossScores(chosen, evaluators, scales);
      lockedGeoms.push(geom);
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
        current_rank_before_build: 1,
        own_score: num(chosen.score),
        initial_own_score: initial ? num(initial.score) : null,
        delta_own_score_vs_G0: initial ? num(chosen.score) - num(initial.score) : null,
        score_eval_rmc: num(xscore.ponderacion_rmc),
        score_eval_balanceado: num(xscore.balanceado),
        score_eval_logit: num(xscore.logit),
        poblacion_marginal: num(chosen.poblacion),
        poblacion_beneficiada: num(chosen.pobBeneficiada),
        demanda_habilitada: num(chosen.demandaHabilitada),
        ciclistas_inducidos: num(chosen.ciclistasInducidos),
        componentes_unidos: num(chosen.componentesUnidos),
        componentes_red: componentsCount(lockedGeoms, params),
        costo_mclp: num(chosen.costo),
      };

      row.cum_cost_mclp = num(prev.cum_cost_mclp) + row.costo_mclp;
      row.cum_population = num(prev.cum_population) + row.poblacion_marginal;
      row.cum_demand = num(prev.cum_demand) + row.demanda_habilitada;
      row.cum_cyclists = num(prev.cum_cyclists) + row.ciclistas_inducidos;
      row.cum_own_score = num(prev.cum_own_score) + row.own_score;
      row.cum_own_score_discounted = num(prev.cum_own_score_discounted) + Math.pow(discount, step - 1) * row.own_score;
      row.cum_eval_rmc = num(prev.cum_eval_rmc) + row.score_eval_rmc;
      row.cum_eval_balanceado = num(prev.cum_eval_balanceado) + row.score_eval_balanceado;
      row.cum_eval_logit = num(prev.cum_eval_logit) + row.score_eval_logit;
      rows.push(row);

      if (step % 10 === 0 || step === 1 || step === n) {
        console.log(`[paper-full-W] ${def.label}: ${step}/${n} · ${chosen.id}`);
      }
      if (window.evaYield) await window.evaYield();
    }

    return {
      key: def.key,
      label: def.label,
      source_key: def.sourceKey,
      source_name: def.sourceName,
      weights: def.weights,
      initial_ranking: initialRows,
      rows,
      sequence: rows.map(r => r.id),
    };
  }

  function rankMap(ids) {
    return new Map(ids.map((id, i) => [id, i + 1]));
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

  function kendall(idsA, rankB) {
    let concord = 0, discord = 0;
    for (let i = 0; i < idsA.length; i++) {
      for (let j = i + 1; j < idsA.length; j++) {
        const ri = rankB.get(idsA[i]), rj = rankB.get(idsA[j]);
        if (ri == null || rj == null || ri === rj) continue;
        if (ri < rj) concord++; else discord++;
      }
    }
    const den = concord + discord;
    return den ? (concord - discord) / den : null;
  }

  function jaccardTop(idsA, idsB, k) {
    const A = new Set(idsA.slice(0, k));
    const B = new Set(idsB.slice(0, k));
    let inter = 0;
    for (const id of A) if (B.has(id)) inter++;
    const union = new Set([...A, ...B]).size;
    return union ? inter / union : null;
  }

  function compareOrders(nameA, idsA, nameB, idsB, ks) {
    const rA = rankMap(idsA), rB = rankMap(idsB);
    const common = idsA.filter(id => rB.has(id));
    const x = common.map(id => rA.get(id));
    const y = common.map(id => rB.get(id));
    const disp = common.map(id => Math.abs(rA.get(id) - rB.get(id)));
    const row = {
      scenario_a: nameA,
      scenario_b: nameB,
      common_projects: common.length,
      spearman_full: pearson(x, y),
      kendall_full: kendall(idsA.filter(id => rB.has(id)), rB),
      mean_abs_displacement: disp.length ? disp.reduce((a, b) => a + b, 0) / disp.length : null,
      max_abs_displacement: disp.length ? Math.max(...disp) : null,
      first_divergence_step: null,
    };
    const n = Math.min(idsA.length, idsB.length);
    for (let i = 0; i < n; i++) {
      if (idsA[i] !== idsB[i]) { row.first_divergence_step = i + 1; break; }
    }
    if (row.first_divergence_step == null && idsA.length === idsB.length) row.first_divergence_step = 0;
    for (const k of ks) if (k <= n) row[`jaccard_top_${k}`] = jaccardTop(idsA, idsB, k);
    return row;
  }

  function staticVsSequential(run, ks) {
    const staticIds = run.initial_ranking.map(r => r.id);
    const seqIds = run.sequence;
    return compareOrders(`${run.key}_static_G0`, staticIds, `${run.key}_sequential`, seqIds, ks);
  }

  function pathSummary(run, initialComponents) {
    const rows = run.rows;
    const last = rows.at(-1) || {};
    const meanComponents = rows.length ? rows.reduce((s, r) => s + num(r.componentes_red), 0) / rows.length : null;
    const integratedReduction = rows.reduce((s, r) => s + (initialComponents - num(r.componentes_red)), 0);
    return {
      scenario: run.key,
      scenario_label: run.label,
      steps: rows.length,
      final_cost_mclp: num(last.cum_cost_mclp),
      final_components: num(last.componentes_red),
      mean_components: meanComponents,
      integrated_component_reduction: integratedReduction,
      cumulative_population: num(last.cum_population),
      cumulative_demand: num(last.cum_demand),
      cumulative_cyclists: num(last.cum_cyclists),
      cumulative_own_score: num(last.cum_own_score),
      cumulative_own_score_discounted: num(last.cum_own_score_discounted),
      cumulative_eval_rmc: num(last.cum_eval_rmc),
      cumulative_eval_balanceado: num(last.cum_eval_balanceado),
      cumulative_eval_logit: num(last.cum_eval_logit),
    };
  }

  function budgetCheckpoint(run, budget, initialComponents) {
    const feasible = run.rows.filter(r => num(r.cum_cost_mclp) <= budget + 1e-9);
    const r = feasible.at(-1);
    if (!r) return {
      scenario: run.key, scenario_label: run.label, budget_mclp: budget,
      step: 0, cum_cost_mclp: 0, components: initialComponents,
      cum_population: 0, cum_demand: 0, cum_cyclists: 0,
      cum_eval_rmc: 0, cum_eval_balanceado: 0, cum_eval_logit: 0,
    };
    return {
      scenario: run.key,
      scenario_label: run.label,
      budget_mclp: budget,
      step: r.step,
      cum_cost_mclp: r.cum_cost_mclp,
      components: r.componentes_red,
      cum_population: r.cum_population,
      cum_demand: r.cum_demand,
      cum_cyclists: r.cum_cyclists,
      cum_eval_rmc: r.cum_eval_rmc,
      cum_eval_balanceado: r.cum_eval_balanceado,
      cum_eval_logit: r.cum_eval_logit,
    };
  }

  function budgetComparison(runs, fractions, initialComponents) {
    const totals = runs.map(r => num((r.rows.at(-1) || {}).cum_cost_mclp));
    const commonTotal = Math.min(...totals);
    const rows = [];
    for (const f of fractions) {
      const budget = commonTotal * f;
      for (const run of runs) {
        rows.push({ budget_fraction: f, ...budgetCheckpoint(run, budget, initialComponents) });
      }
    }
    return rows;
  }

  function robustCore(runs, k) {
    const counts = new Map();
    for (const run of runs) {
      for (const id of run.sequence.slice(0, k)) counts.set(id, (counts.get(id) || 0) + 1);
    }
    return Array.from(counts, ([id, appearances]) => ({
      k,
      id,
      nombre: projectProps(id).nombre || projectProps(id).eje || id,
      appearances,
      frequency: appearances / runs.length,
      in_rmc: runs.find(r => r.key === "ponderacion_rmc")?.sequence.slice(0, k).includes(id) || false,
      in_balanceado: runs.find(r => r.key === "balanceado")?.sequence.slice(0, k).includes(id) || false,
      in_logit: runs.find(r => r.key === "logit")?.sequence.slice(0, k).includes(id) || false,
    })).sort((a, b) => b.frequency - a.frequency || String(a.id).localeCompare(String(b.id)));
  }

  function crossEvaluationMatrix(runs) {
    const out = [];
    const evalKeys = [
      ["ponderacion_rmc", "cum_eval_rmc"],
      ["balanceado", "cum_eval_balanceado"],
      ["logit", "cum_eval_logit"],
    ];
    for (const [evalKey, field] of evalKeys) {
      const vals = runs.map(run => ({ run, value: num((run.rows.at(-1) || {})[field]) }));
      const best = Math.max(...vals.map(v => v.value));
      for (const v of vals) {
        out.push({
          evaluator: evalKey,
          generated_by: v.run.key,
          cumulative_cross_score: v.value,
          relative_to_best_for_evaluator: best ? v.value / best : null,
          gap_to_best: best - v.value,
        });
      }
    }
    return out;
  }

  async function runFullPortfolioScenarios(opts) {
    opts = opts || {};
    const discount = opts.discount == null ? 0.95 : +opts.discount;
    const params = { ...(window.PARAM_DEFAULTS || {}), perfil: "general", segKSI: false };
    const rootConfig = base.rootCfg("Alameda", 100, 0.5);
    const eligibleIds = eligibleIdSet();
    const scenarios = scenarioDefinitions();
    const scales = fixedReferenceEligible(params, rootConfig, eligibleIds);
    const initialComponents = componentsCount([], params);
    const runs = [];

    console.log(`[paper-full-W] Inicio · ${eligibleIds.size} proyectos elegibles × ${scenarios.length} escenarios`);
    for (const def of scenarios) {
      console.log(`[paper-full-W] Escenario ${def.label}`);
      runs.push(await simulateFullScenario(def, scenarios, params, scales, rootConfig, eligibleIds, discount));
    }

    const ks = (opts.ks || [10, 20, 30, 50, 75, 100, 124]).filter(k => k <= eligibleIds.size);
    const pairwise = [];
    for (let i = 0; i < runs.length; i++) {
      for (let j = i + 1; j < runs.length; j++) {
        pairwise.push(compareOrders(runs[i].key, runs[i].sequence, runs[j].key, runs[j].sequence, ks));
      }
    }

    const staticSequential = runs.map(run => staticVsSequential(run, ks));
    const summaries = runs.map(run => pathSummary(run, initialComponents));
    const budget = budgetComparison(
      runs,
      opts.budgetFractions || [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1],
      initialComponents
    );
    const cores = [10,20,30,50].filter(k => k <= eligibleIds.size).flatMap(k => robustCore(runs, k));
    const cross = crossEvaluationMatrix(runs);

    const finalIds = runs.map(r => new Set(r.sequence));
    const sameFinalSet = finalIds.every(s => s.size === eligibleIds.size && [...eligibleIds].every(id => s.has(id)));
    const finalCosts = summaries.map(s => s.final_cost_mclp);
    const sameFinalCost = Math.max(...finalCosts) - Math.min(...finalCosts) < 1e-6;
    const finalComponents = summaries.map(s => s.final_components);
    const sameFinalComponents = Math.max(...finalComponents) === Math.min(...finalComponents);

    const result = {
      generated_at: new Date().toISOString(),
      versions: { ...(window.EVA_VERSION || {}) },
      design: {
        experiment: "full eligible portfolio, three policy-weight scenarios",
        modeled_projects: (rawPortfolio().features || []).length,
        eligible_projects: eligibleIds.size,
        eligible_scales: ["Comunal", "Intercomunal"],
        scenarios: scenarios.map(s => ({ key: s.key, label: s.label, source_key: s.sourceKey, source_name: s.sourceName, weights: s.weights })),
        normalization: "fixed-G0-eligible-CI",
        root: rootConfig,
        discount_per_step: discount,
        score_comparability_note: "Los puntajes propios de cada W no se comparan directamente como si compartieran una misma escala normativa. Para comparar trayectorias se usan métricas comunes y una matriz de evaluación cruzada.",
      },
      normalization_reference: scales,
      initial_components: initialComponents,
      invariants: {
        every_run_contains_all_eligible_projects: sameFinalSet,
        same_final_cost: sameFinalCost,
        same_final_components: sameFinalComponents,
        final_costs_mclp: finalCosts,
        final_components: finalComponents,
      },
      summaries,
      static_vs_sequential: staticSequential,
      pairwise_scenario_order_comparison: pairwise,
      budget_checkpoints: budget,
      robust_core: cores,
      cross_evaluation_matrix: cross,
      runs,
    };

    setRoot(rootConfig);
    console.log("[paper-full-W] Experimento completo terminado");
    return result;
  }

  window.EVA_PAPER_EXPERIMENTS.runFullPortfolioScenarios = runFullPortfolioScenarios;
})();
