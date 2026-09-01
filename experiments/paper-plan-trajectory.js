/* ============================================================
   EVA · Experimento metodológico: trayectoria de implementación
   ------------------------------------------------------------
   Objetivo:
   evaluar una cartera de proyectos como una trayectoria entre G0 y GH,
   en lugar de observar sólo el ranking inicial o el estado final.

   Diseño principal:
   A) Orden estático sobre un conjunto fijo de N proyectos.
   B) Reordenamiento EVA del MISMO conjunto fijo de N proyectos.
      A y B terminan con exactamente los mismos proyectos, por lo que
      cualquier diferencia intermedia es un efecto puro del orden.
   C) EVA adaptativo abierto sobre todo el conjunto factible C/I.
      Permite que proyectos entren/salgan de la programación al cambiar Gt.

   Todas las comparaciones principales usan Ponderación RMC y referencia
   de normalización fija en G0 sobre proyectos Comunales + Intercomunales.
============================================================ */
(function () {
  "use strict";

  const base = window.EVA_PAPER_EXPERIMENTS;
  if (!base || !base.evaluateState || !base.fixedScore || !base.rootCfg) {
    throw new Error("paper-plan-trajectory.js requiere paper-experiments-fast.js");
  }

  const num = v => Number.isFinite(+v) ? +v : 0;
  const normText = v => String(v == null ? "" : v).trim().toLowerCase();
  const rawPortfolio = () => (window.FC_RAW && window.FC_RAW["Plan Maestro"]) || window.projectsFC;

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
    return new Set((rawPortfolio().features || []).filter(isEligibleFeature).map(f => f.properties && f.properties.id));
  }

  function setRoot(rootConfig) {
    if (rootConfig && window.FRACTAL && window.FRACTAL.setRootConfig) {
      window.FRACTAL.setRootConfig(rootConfig);
    }
  }

  function max1(rows, fn) {
    return Math.max(1, ...rows.map(r => num(fn(r))));
  }

  function allCriteriaWeights() {
    const keys = [
      "poblacion", "costoOD", "oportunidades", "equidad", "continuidad",
      "demanda", "ciclistas", "fractal", "estudiantes", "prioridadGore",
      "costoInv", "seguridad", "monumentos", "intermodal", "factibilidad", "parques",
    ];
    return Object.fromEntries(keys.map(k => [k, k === "monumentos" ? 0 : 1]));
  }

  function makeEligibleScales(enriched, eligibleIds) {
    const rows = (enriched || []).filter(p => eligibleIds.has(p.id));
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
    // Se calculan todos los criterios dinámicos en G0 aunque RMC asigne peso 0 a alguno.
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

  function setEquals(a, b) {
    if (a.size !== b.size) return false;
    for (const x of a) if (!b.has(x)) return false;
    return true;
  }

  function transitionRows(prevScores, currentRanked, sourceProject, transitionStep, strategy) {
    if (!prevScores || !sourceProject) return [];
    const current = new Map(currentRanked.map((p, i) => [p.id, { score: num(p.score), rank: i + 1, nombre: p.nombre }]));
    const out = [];
    for (const [id, before] of prevScores) {
      const after = current.get(id);
      if (!after) continue;
      const d = after.score - before.score;
      out.push({
        strategy,
        transition_step: transitionStep,
        source_id: sourceProject.id,
        source_nombre: sourceProject.nombre,
        target_id: id,
        target_nombre: after.nombre,
        score_before: before.score,
        score_after: after.score,
        delta_score: d,
        rank_before: before.rank,
        rank_after: after.rank,
        delta_rank_improvement: before.rank - after.rank,
        relation: d > 0 ? "complementarity_signal" : (d < 0 ? "substitution_signal" : "neutral"),
      });
    }
    return out;
  }

  function rowFromChoice(strategy, step, chosen, currentRank, initial, lockedAfter, params, prevRow, discount) {
    const props = projectProps(chosen.id);
    const rec = {
      strategy,
      step,
      id: chosen.id,
      nombre: chosen.nombre,
      escala: props.escala || chosen.escala || null,
      initial_rank: initial ? initial.rank : null,
      current_rank_before_build: currentRank,
      initial_score: initial ? num(initial.score) : null,
      realized_score: num(chosen.score),
      delta_score_vs_G0: initial ? num(chosen.score) - num(initial.score) : null,
      poblacion_marginal: num(chosen.poblacion),
      poblacion_beneficiada: num(chosen.pobBeneficiada),
      demanda_habilitada: num(chosen.demandaHabilitada),
      ciclistas_inducidos: num(chosen.ciclistasInducidos),
      componentes_unidos: num(chosen.componentesUnidos),
      componentes_red: componentsCount(lockedAfter, params),
      costo_mclp: num(chosen.costo),
      grado_dendritico: chosen.gradoSeparacion == null ? null : num(chosen.gradoSeparacion),
      score_dendritico: num(chosen.scorePrioridad),
    };
    rec.cum_realized_score = num(prevRow && prevRow.cum_realized_score) + rec.realized_score;
    rec.discounted_realized_score = Math.pow(discount, step - 1) * rec.realized_score;
    rec.cum_discounted_score = num(prevRow && prevRow.cum_discounted_score) + rec.discounted_realized_score;
    rec.cum_poblacion_marginal = num(prevRow && prevRow.cum_poblacion_marginal) + rec.poblacion_marginal;
    rec.cum_demanda_habilitada = num(prevRow && prevRow.cum_demanda_habilitada) + rec.demanda_habilitada;
    rec.cum_ciclistas_inducidos = num(prevRow && prevRow.cum_ciclistas_inducidos) + rec.ciclistas_inducidos;
    rec.cum_costo_mclp = num(prevRow && prevRow.cum_costo_mclp) + rec.costo_mclp;
    return rec;
  }

  async function simulatePolicy(opts) {
    const {
      strategy, mode, fixedOrder, candidateSet, weights, params, scales, rootConfig,
      eligibleIds, initialRows, maxSteps, discount,
    } = opts;
    const lockedGeoms = [];
    const lockedIds = new Set();
    const initialMap = new Map(initialRows.map(r => [r.id, r]));
    const rows = [];
    const panel = [];
    const transitions = [];
    let prevScores = null;
    let prevChosen = null;

    for (let step = 1; step <= maxSteps; step++) {
      const state = evaluateEligibleFixed(lockedGeoms, weights, params, scales, rootConfig, eligibleIds);
      if (prevScores && prevChosen) {
        transitions.push(...transitionRows(prevScores, state.ranked, prevChosen, step - 1, strategy));
      }

      let chosen = null;
      if (mode === "static") {
        const nextId = (fixedOrder || []).find(id => !lockedIds.has(id));
        if (nextId) chosen = state.ranked.find(p => p.id === nextId) || null;
      } else if (mode === "adaptive_fixed") {
        chosen = state.ranked.find(p => candidateSet && candidateSet.has(p.id)) || null;
      } else if (mode === "adaptive_open") {
        chosen = state.ranked[0] || null;
      }
      if (!chosen) break;

      const currentRank = state.ranked.findIndex(p => p.id === chosen.id) + 1;
      for (let i = 0; i < state.ranked.length; i++) {
        const p = state.ranked[i];
        const ini = initialMap.get(p.id);
        panel.push({
          strategy,
          step,
          id: p.id,
          nombre: p.nombre,
          initial_rank: ini ? ini.rank : null,
          current_rank: i + 1,
          delta_rank_improvement: ini ? ini.rank - (i + 1) : null,
          initial_score: ini ? num(ini.score) : null,
          current_score: num(p.score),
          delta_score_vs_G0: ini ? num(p.score) - num(ini.score) : null,
          selected_this_step: p.id === chosen.id,
          originally_in_fixed_topN: !!(candidateSet && candidateSet.has(p.id)),
        });
      }

      prevScores = new Map(state.ranked.map((p, i) => [p.id, { score: num(p.score), rank: i + 1 }]));
      prevChosen = { id: chosen.id, nombre: chosen.nombre };

      const geom = projectGeom(chosen.id);
      if (!geom) break;
      lockedGeoms.push(geom);
      lockedIds.add(chosen.id);
      const rec = rowFromChoice(
        strategy, step, chosen, currentRank, initialMap.get(chosen.id),
        lockedGeoms, params, rows.at(-1), discount
      );
      rows.push(rec);
      if (window.evaYield) await window.evaYield();
    }

    // Captura el efecto de la última transición sobre todos los proyectos que quedan.
    if (prevScores && prevChosen) {
      const finalState = evaluateEligibleFixed(lockedGeoms, weights, params, scales, rootConfig, eligibleIds);
      transitions.push(...transitionRows(prevScores, finalState.ranked, prevChosen, rows.length, strategy));
    }

    return {
      strategy,
      mode,
      rows,
      panel,
      transitions,
      final_ids: rows.map(r => r.id),
      final_components: rows.length ? rows.at(-1).componentes_red : componentsCount([], params),
      final_cost_mclp: rows.length ? rows.at(-1).cum_costo_mclp : 0,
    };
  }

  function pathSummary(run, initialComponents) {
    const rows = run.rows || [];
    const last = rows.at(-1) || {};
    const meanComponents = rows.length ? rows.reduce((s, r) => s + num(r.componentes_red), 0) / rows.length : null;
    const integratedReduction = rows.reduce((s, r) => s + (initialComponents - num(r.componentes_red)), 0);
    return {
      strategy: run.strategy,
      steps: rows.length,
      final_cost_mclp: num(last.cum_costo_mclp),
      cumulative_realized_eva_score: num(last.cum_realized_score),
      discounted_eva_score: num(last.cum_discounted_score),
      mean_network_components: meanComponents,
      integrated_component_reduction: integratedReduction,
      final_network_components: rows.length ? num(last.componentes_red) : initialComponents,
      cumulative_population_marginal: num(last.cum_poblacion_marginal),
      cumulative_demand_enabled: num(last.cum_demanda_habilitada),
      cumulative_induced_cyclists: num(last.cum_ciclistas_inducidos),
    };
  }

  function stepComparison(a, b) {
    const n = Math.min(a.rows.length, b.rows.length);
    const out = [];
    for (let i = 0; i < n; i++) {
      const x = a.rows[i], y = b.rows[i];
      out.push({
        step: i + 1,
        static_id: x.id,
        adaptive_id: y.id,
        static_cum_score: x.cum_realized_score,
        adaptive_cum_score: y.cum_realized_score,
        delta_cum_score_adaptive_minus_static: y.cum_realized_score - x.cum_realized_score,
        static_discounted_score: x.cum_discounted_score,
        adaptive_discounted_score: y.cum_discounted_score,
        delta_discounted_score: y.cum_discounted_score - x.cum_discounted_score,
        static_components: x.componentes_red,
        adaptive_components: y.componentes_red,
        delta_components_adaptive_minus_static: y.componentes_red - x.componentes_red,
        static_cum_cost: x.cum_costo_mclp,
        adaptive_cum_cost: y.cum_costo_mclp,
        static_cum_demand: x.cum_demanda_habilitada,
        adaptive_cum_demand: y.cum_demanda_habilitada,
        static_cum_population: x.cum_poblacion_marginal,
        adaptive_cum_population: y.cum_poblacion_marginal,
        static_cum_cyclists: x.cum_ciclistas_inducidos,
        adaptive_cum_cyclists: y.cum_ciclistas_inducidos,
      });
    }
    return out;
  }

  function budgetCheckpoints(a, b, fractions) {
    const total = Math.min(num(a.final_cost_mclp), num(b.final_cost_mclp));
    const checkpoint = (run, budget) => {
      const feasible = (run.rows || []).filter(r => num(r.cum_costo_mclp) <= budget + 1e-9);
      const r = feasible.at(-1);
      return r ? {
        step: r.step,
        cum_cost: r.cum_costo_mclp,
        cum_score: r.cum_realized_score,
        discounted_score: r.cum_discounted_score,
        components: r.componentes_red,
        cum_demand: r.cum_demanda_habilitada,
        cum_population: r.cum_poblacion_marginal,
        cum_cyclists: r.cum_ciclistas_inducidos,
      } : {
        step: 0, cum_cost: 0, cum_score: 0, discounted_score: 0,
        components: componentsCount([], (window.PARAM_DEFAULTS || {})),
        cum_demand: 0, cum_population: 0, cum_cyclists: 0,
      };
    };
    return (fractions || [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1]).map(f => {
      const budget = total * f;
      const x = checkpoint(a, budget), y = checkpoint(b, budget);
      return {
        budget_fraction: f,
        budget_mclp: budget,
        static_step: x.step,
        adaptive_step: y.step,
        static_cum_score: x.cum_score,
        adaptive_cum_score: y.cum_score,
        delta_cum_score: y.cum_score - x.cum_score,
        static_components: x.components,
        adaptive_components: y.components,
        delta_components: y.components - x.components,
        static_cum_demand: x.cum_demand,
        adaptive_cum_demand: y.cum_demand,
        static_cum_population: x.cum_population,
        adaptive_cum_population: y.cum_population,
        static_cum_cyclists: x.cum_cyclists,
        adaptive_cum_cyclists: y.cum_cyclists,
      };
    });
  }

  function projectEvolution(panel, selectedRows) {
    const selectedAt = new Map((selectedRows || []).map(r => [r.id, r.step]));
    const groups = new Map();
    for (const r of panel || []) {
      if (!groups.has(r.id)) groups.set(r.id, []);
      groups.get(r.id).push(r);
    }
    const out = [];
    for (const [id, rows] of groups) {
      rows.sort((a, b) => a.step - b.step);
      const dScores = rows.map(r => num(r.delta_score_vs_G0));
      const dRanks = rows.map(r => num(r.delta_rank_improvement));
      const ini = rows[0];
      const last = rows.at(-1);
      out.push({
        id,
        nombre: ini.nombre,
        initial_rank: ini.initial_rank,
        initial_score: ini.initial_score,
        selected_step: selectedAt.get(id) || null,
        observed_steps_before_selection_or_end: rows.length,
        max_score_increase_vs_G0: Math.max(...dScores),
        max_score_drop_vs_G0: Math.min(...dScores),
        best_rank_improvement: Math.max(...dRanks),
        worst_rank_change: Math.min(...dRanks),
        last_observed_rank: last.current_rank,
        last_observed_score: last.current_score,
        originally_in_fixed_topN: ini.originally_in_fixed_topN,
      });
    }
    return out.sort((a, b) => a.initial_rank - b.initial_rank);
  }

  function strongestTransitions(transitions, sign, n) {
    const rows = (transitions || []).filter(r => sign > 0 ? r.delta_score > 0 : r.delta_score < 0);
    rows.sort((a, b) => sign > 0 ? b.delta_score - a.delta_score : a.delta_score - b.delta_score);
    return rows.slice(0, n || 30);
  }

  function transitionSummary(transitions) {
    const vals = (transitions || []).map(r => num(r.delta_score));
    const abs = vals.map(Math.abs);
    return {
      directed_transition_effects: vals.length,
      positive: vals.filter(v => v > 0).length,
      negative: vals.filter(v => v < 0).length,
      zero: vals.filter(v => v === 0).length,
      mean_signed: vals.length ? vals.reduce((a,b) => a+b,0) / vals.length : null,
      mean_abs: abs.length ? abs.reduce((a,b) => a+b,0) / abs.length : null,
      q_abs_ge_0_005: abs.length ? abs.filter(v => v >= 0.005).length / abs.length : null,
      q_abs_ge_0_01: abs.length ? abs.filter(v => v >= 0.01).length / abs.length : null,
      q_abs_ge_0_025: abs.length ? abs.filter(v => v >= 0.025).length / abs.length : null,
      q_abs_ge_0_05: abs.length ? abs.filter(v => v >= 0.05).length / abs.length : null,
    };
  }

  async function runPlanTrajectory(opts) {
    opts = opts || {};
    const N = opts.steps || 30;
    const discount = opts.discount == null ? 0.95 : +opts.discount;
    const params = { ...(window.PARAM_DEFAULTS || {}), perfil: "general", segKSI: false };
    const rootConfig = base.rootCfg("Alameda", 100, 0.5);
    const eligibleIds = eligibleIdSet();
    const rmc = { ...((window.EVA_SCENARIO_MAP.ponderacion_rmc || {}).weights || {}) };
    const scales = fixedReferenceEligible(params, rootConfig, eligibleIds);
    const staticRows = initialRanking(rmc, params, scales, rootConfig, eligibleIds);
    const fixedIds = staticRows.slice(0, N).map(r => r.id);
    const fixedSet = new Set(fixedIds);
    const initialComponents = componentsCount([], params);

    console.log(`[paper-trajectory] A · orden estático, mismos ${N} proyectos`);
    const staticFixed = await simulatePolicy({
      strategy: "static_fixed_set", mode: "static", fixedOrder: fixedIds, candidateSet: fixedSet,
      weights: rmc, params, scales, rootConfig, eligibleIds, initialRows: staticRows,
      maxSteps: N, discount,
    });

    console.log(`[paper-trajectory] B · EVA reordena los mismos ${N} proyectos`);
    const adaptiveFixed = await simulatePolicy({
      strategy: "eva_adaptive_fixed_set", mode: "adaptive_fixed", candidateSet: fixedSet,
      weights: rmc, params, scales, rootConfig, eligibleIds, initialRows: staticRows,
      maxSteps: N, discount,
    });

    console.log(`[paper-trajectory] C · EVA abierto sobre ${eligibleIds.size} proyectos elegibles`);
    const adaptiveOpen = await simulatePolicy({
      strategy: "eva_adaptive_open", mode: "adaptive_open", candidateSet: fixedSet,
      weights: rmc, params, scales, rootConfig, eligibleIds, initialRows: staticRows,
      maxSteps: N, discount,
    });

    const fixedSameSet = setEquals(new Set(staticFixed.final_ids), new Set(adaptiveFixed.final_ids));
    const staticSet = new Set(staticFixed.final_ids);
    const openSet = new Set(adaptiveOpen.final_ids);
    const entered = adaptiveOpen.final_ids.filter(id => !staticSet.has(id));
    const displaced = staticFixed.final_ids.filter(id => !openSet.has(id));

    const fixedSummary = [pathSummary(staticFixed, initialComponents), pathSummary(adaptiveFixed, initialComponents)];
    const openSummary = pathSummary(adaptiveOpen, initialComponents);
    const fixedStepComparison = stepComparison(staticFixed, adaptiveFixed);
    const fixedBudgetComparison = budgetCheckpoints(staticFixed, adaptiveFixed);
    const openEvolution = projectEvolution(adaptiveOpen.panel, adaptiveOpen.rows);

    const result = {
      generated_at: new Date().toISOString(),
      versions: { ...(window.EVA_VERSION || {}) },
      design: {
        method: "EVA trajectory evaluation",
        scenario: "ponderacion_rmc",
        normalization: "fixed-G0-eligible-CI",
        modeled_projects: (rawPortfolio().features || []).length,
        eligible_projects: eligibleIds.size,
        fixed_plan_size: N,
        discount_per_step: discount,
        root: rootConfig,
        interpretation_note: "El puntaje acumulado es valor decisional EVA bajo la función multicriterio, no una medida monetaria de bienestar social.",
      },
      normalization_reference: scales,
      initial_components: initialComponents,
      initial_ranking: staticRows,
      experiment_1_order_only: {
        hypothesis: "Con el mismo conjunto final de proyectos, cambiar sólo el orden produce trayectorias intermedias distintas.",
        same_final_project_set: fixedSameSet,
        same_final_component_count: staticFixed.final_components === adaptiveFixed.final_components,
        final_static_components: staticFixed.final_components,
        final_adaptive_components: adaptiveFixed.final_components,
        static: staticFixed,
        adaptive: adaptiveFixed,
        summaries: fixedSummary,
        step_comparison: fixedStepComparison,
        budget_comparison: fixedBudgetComparison,
      },
      experiment_2_adaptive_plan: {
        hypothesis: "Al reevaluar toda la cartera, la trayectoria puede modificar también la composición de los proyectos seleccionados.",
        static_fixed_topN: staticFixed.final_ids,
        adaptive_open_topN: adaptiveOpen.final_ids,
        projects_entering_vs_initial_topN: entered,
        projects_displaced_from_initial_topN: displaced,
        common_projects: adaptiveOpen.final_ids.filter(id => staticSet.has(id)),
        adaptive: adaptiveOpen,
        summary: openSummary,
        project_evolution: openEvolution,
        transition_summary: transitionSummary(adaptiveOpen.transitions),
        strongest_complementarity_signals: strongestTransitions(adaptiveOpen.transitions, +1, opts.transitionTopN || 30),
        strongest_substitution_signals: strongestTransitions(adaptiveOpen.transitions, -1, opts.transitionTopN || 30),
      },
    };

    setRoot(rootConfig);
    console.log("[paper-trajectory] Experimento de trayectoria completado");
    return result;
  }

  window.EVA_PAPER_EXPERIMENTS.runPlanTrajectory = runPlanTrajectory;
})();
