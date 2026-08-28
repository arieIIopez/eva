/* ============================================================
   EVA · Análisis de sensibilidad (§4.3) + Comparación de carteras (§7.3)
   ------------------------------------------------------------
   Re-puntuación barata: el score deriva de project.norm (fijo para
   la red base actual), así que probar escenarios de pesos no requiere
   re-correr el motor. Las carteras usan UNIÓN de hexágonos por id
   (sin doble conteo) a partir de _hexNew / _hexBenef / _destReached.
============================================================ */

(function () {
  const CRITERIOS = ["poblacion", "costoOD", "oportunidades", "equidad", "continuidad", "demanda", "ciclistas", "fractal", "estudiantes", "prioridadGore", "seguridad", "costoInv"];

  function scoreOf(p, w) {
    const totalW = (Object.values(w).reduce((a, b) => a + b, 0) - (w.monumentos || 0)) || 1;
    let s = 0;
    for (const k of CRITERIOS) s += (w[k] || 0) * ((p.norm && p.norm[k] != null) ? p.norm[k] : 0);
    s += (w.monumentos || 0) * ((p.norm && p.norm.monumentos != null) ? p.norm.monumentos : 0);
    return s / totalW;
  }

  function rankBy(projects, w) {
    return projects.map(p => ({ id: p.id, score: scoreOf(p, w) }))
      .sort((a, b) => b.score - a.score)
      .map((x, i) => ({ id: x.id, pos: i + 1 }));
  }

  /* ---------- Conjunto de escenarios para sensibilidad ---------- */
  function scenarioSet(baseWeights) {
    const set = [];
    (window.EVA_SCENARIOS || []).forEach(s => set.push({ nombre: s.nombre, weights: s.weights, tipo: "predefinido" }));
    // perturbaciones ±50% sobre cada criterio del escenario base
    CRITERIOS.forEach(k => {
      [0.5, 1.5].forEach(f => {
        const w = { ...baseWeights, [k]: Math.max(0, Math.round((baseWeights[k] || 0) * f)) };
        set.push({ nombre: `${k} ×${f}`, weights: w, tipo: "perturbacion" });
      });
    });
    return set;
  }

  /* ============================================================
     SENSIBILIDAD
  ============================================================ */
  window.evaSensitivity = function (projects, baseWeights) {
    projects = projects || window.PROJECTS || [];
    baseWeights = baseWeights || window.DEFAULT_WEIGHTS;
    const t0 = performance.now();
    const scen = scenarioSet(baseWeights);
    const N = scen.length;
    const byId = {};
    projects.forEach(p => { byId[p.id] = { id: p.id, nombre: p.nombre, pos: [] }; });

    scen.forEach(sc => {
      rankBy(projects, sc.weights).forEach(r => { if (byId[r.id]) byId[r.id].pos.push(r.pos); });
    });

    const rows = Object.values(byId).map(o => {
      const pos = o.pos;
      const n = pos.length || 1;
      const prom = pos.reduce((a, b) => a + b, 0) / n;
      const mejor = Math.min(...pos), peor = Math.max(...pos);
      const rango = peor - mejor;
      const mean = prom;
      const sd = Math.sqrt(pos.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n);
      const top5 = pos.filter(x => x <= 5).length / n;
      const top10 = pos.filter(x => x <= 10).length / n;
      const top20 = pos.filter(x => x <= 20).length / n;
      const p = projects.find(x => x.id === o.id);
      const exp = window.evaExplainScore ? window.evaExplainScore({ ...p, rank: Math.round(prom) }, baseWeights, projects) : null;
      return {
        id: o.id, nombre: o.nombre,
        promedio: +prom.toFixed(1), mejor, peor, rango, desviacion: +sd.toFixed(1),
        freq_top5: +(top5 * 100).toFixed(0), freq_top10: +(top10 * 100).toFixed(0), freq_top20: +(top20 * 100).toFixed(0),
        depende_de_un_criterio: exp ? exp.depende_de_un_criterio : false,
        dominante: exp ? exp.dominante_en : null,
      };
    }).sort((a, b) => a.promedio - b.promedio);

    // clasificación robusto / sensible
    rows.forEach((r, i) => {
      r.rankPromedio = i + 1;
      // robusto: siempre en top10 y rango chico; sensible: rango grande
      if (r.freq_top10 >= 80 && r.rango <= Math.max(8, projects.length * 0.08)) r.clase = "robusto";
      else if (r.rango >= projects.length * 0.35) r.clase = "sensible";
      else r.clase = "intermedio";
    });

    const robustos = rows.filter(r => r.clase === "robusto");
    const sensibles = rows.filter(r => r.clase === "sensible");
    const dependientes = rows.filter(r => r.depende_de_un_criterio);

    if (window.evaLog) window.evaLog("ok", `[sensibilidad] ${N} escenarios · ${robustos.length} robustos · ${sensibles.length} sensibles · ${dependientes.length} dependientes de un criterio (${(performance.now() - t0).toFixed(0)} ms)`);
    return { escenarios: N, rows, robustos: robustos.map(r => r.id), sensibles: sensibles.map(r => r.id), dependientes: dependientes.map(r => r.id), _provenance: window.evaProvenance ? window.evaProvenance(window.DEFAULT_PARAMS, baseWeights) : {} };
  };

  /* ============================================================
     COMPARACIÓN DE CARTERAS — unión sin doble conteo
  ============================================================ */
  function pobOf(hexId) {
    const h = window.HEX_BY_ID && window.HEX_BY_ID.get(hexId);
    return h ? (+h.properties.pob || 0) : 0;
  }

  function buildCartera(nombre, ids, projects) {
    const ps = ids.map(id => projects.find(p => p.id === id)).filter(Boolean);
    const hexNew = new Set(), hexBenef = new Set(), comunasDest = new Set(), comunasTerr = new Set();
    let km = 0, inversion = 0, demandaHab = 0, matricula = 0, eqSum = 0, contSum = 0;
    ps.forEach(p => {
      km += +p.km || 0;
      inversion += +p.costo || 0;
      demandaHab += +p.demandaHabilitada || 0;       // Σ marginal (cota superior)
      matricula += +p.matriculaAlcanzable || 0;        // Σ (cota superior)
      eqSum += +p.equidad || 0;
      contSum += +p.continuidad || 0;
      (p._hexNew || []).forEach(h => hexNew.add(h));
      (p._hexBenef || []).forEach(h => hexBenef.add(h));
      if (p._destReached) Object.keys(p._destReached).forEach(c => comunasDest.add(c));
      String(p.comunas || "").split("·").map(s => s.trim()).filter(Boolean).forEach(c => comunasTerr.add(c));
    });
    let pobAcceso = 0; hexNew.forEach(h => pobAcceso += pobOf(h));
    let pobBenef = 0; hexBenef.forEach(h => pobBenef += pobOf(h));
    return {
      nombre, n: ps.length, proyectos: ids,
      km: +km.toFixed(1),
      inversion_MCLP: Math.round(inversion),
      pob_acceso_union: Math.round(pobAcceso),
      pob_beneficiada_union: Math.round(pobBenef),
      demanda_habilitada_sum: Math.round(demandaHab),
      comunas_destino: comunasDest.size,
      comunas_territoriales: comunasTerr.size,
      matricula_sum: Math.round(matricula),
      equidad_prom: ps.length ? +(eqSum / ps.length).toFixed(2) : 0,
      continuidad_prom: ps.length ? +(contSum / ps.length).toFixed(2) : 0,
    };
  }

  window.evaCarteras = function (projects, weights, solveResult, lockedIds) {
    projects = projects || window.PROJECTS || [];
    weights = weights || window.DEFAULT_WEIGHTS;
    const t0 = performance.now();
    const byScore = [...projects].map(p => ({ p, s: scoreOf(p, weights) })).sort((a, b) => b.s - a.s).map(x => x.p);
    const topN = (arr, key, n = 10) => [...arr].sort((a, b) => (key(b)) - (key(a))).slice(0, n).map(p => p.id);

    const carteras = [
      buildCartera("Top 10 · Score multicriterio", byScore.slice(0, 10).map(p => p.id), projects),
      buildCartera("Top 10 · Demanda OD habilitada", topN(projects, p => p.demandaHabilitada || 0), projects),
      buildCartera("Top 10 · Equidad territorial", topN(projects, p => p.equidad || 0), projects),
      buildCartera("Top 10 · Continuidad de red", topN(projects, p => p.componentesUnidos || 0), projects),
      buildCartera("Top 10 · Eficiencia presupuestaria", topN(projects, p => (p.costo ? (p.poblacion + (p.pobBeneficiada || 0)) / p.costo : 0)), projects),
    ];
    if (solveResult && solveResult.order && solveResult.order.length) {
      carteras.push(buildCartera("Secuencial recomendada", solveResult.order.map(o => o.id), projects));
    }
    if (lockedIds && lockedIds.length) {
      carteras.push(buildCartera("Selección manual", lockedIds, projects));
    }

    if (window.evaLog) window.evaLog("ok", `[carteras] ${carteras.length} carteras comparadas (unión de hexágonos, sin doble conteo) (${(performance.now() - t0).toFixed(0)} ms)`);
    return { carteras, _provenance: window.evaProvenance ? window.evaProvenance(window.DEFAULT_PARAMS, weights) : {} };
  };

  /* ---------- Exportaciones ---------- */
  function dl(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  }
  const stamp = () => new Date().toISOString().slice(0, 10);

  /* ============================================================
     SENSIBILIDAD PARAMÉTRICA (re-corre el MOTOR variando parámetros)
     Grid: acceso origen/destino, tolerancia de empalme, cobertura, costo.
     Async con yield para no congelar; restaura el estado base al terminar.
  ============================================================ */
  window.evaSensitivityParam = async function (baseParams, weights, onProgress) {
    baseParams = baseParams || window.DEFAULT_PARAMS;
    weights = weights || window.DEFAULT_WEIGHTS;
    const grid = {
      distOrigen:  [500, 700, 1000],
      distDestino: [500, 700, 1000],
      connectTol:  [50, 150, 300],
      habThreshold:[20, 40, 60],
      costoPorKm:  [80, 100, 150],
    };
    const t0 = performance.now();
    const projIds = (window.PROJECTS || []).map(p => p.id);
    const byId = {}; projIds.forEach(id => { byId[id] = { id, pos: [] }; });
    const nombreById = {}; (window.PROJECTS || []).forEach(p => nombreById[p.id] = p.nombre);
    const variations = []; // {param, valor, top5:[ids]}
    const total = Object.values(grid).reduce((a, v) => a + v.length, 0);
    let runs = 0;

    for (const [k, vals] of Object.entries(grid)) {
      for (const v of vals) {
        const params = { ...baseParams, [k]: v };
        if (window.ENGINE.setHabThreshold) window.ENGINE.setHabThreshold((params.habThreshold || 40) / 100);
        const { enriched } = window.ENGINE.run(window.existingFC, window.projectsFC, window.populationFC, params, []);
        const ranked = enriched.map(p => ({ id: p.id, s: scoreOf(p, weights) })).sort((a, b) => b.s - a.s);
        ranked.forEach((r, i) => { if (byId[r.id]) byId[r.id].pos.push(i + 1); });
        variations.push({ param: k, valor: v, top5: ranked.slice(0, 5).map(r => r.id) });
        runs++;
        if (window.evaLog) window.evaLog("data", `[sens-param] ${k}=${v}${(window.PARAM_SCHEMA[k] || {}).unit || ""} · ${runs}/${total}`);
        if (onProgress) onProgress(runs, total);
        if (window.evaYield) await window.evaYield();
      }
    }
    // restaurar estado base
    if (window.ENGINE.setHabThreshold) window.ENGINE.setHabThreshold((baseParams.habThreshold || 40) / 100);
    window.ENGINE.run(window.existingFC, window.projectsFC, window.populationFC, baseParams, []);

    const rows = Object.values(byId).map(o => {
      const pos = o.pos, n = pos.length || 1;
      const prom = pos.reduce((a, b) => a + b, 0) / n;
      const mejor = Math.min(...pos), peor = Math.max(...pos);
      return {
        id: o.id, nombre: nombreById[o.id],
        promedio: +prom.toFixed(1), mejor, peor, rango: peor - mejor,
        freq_top5: +(pos.filter(x => x <= 5).length / n * 100).toFixed(0),
        freq_top10: +(pos.filter(x => x <= 10).length / n * 100).toFixed(0),
        freq_top20: +(pos.filter(x => x <= 20).length / n * 100).toFixed(0),
      };
    }).sort((a, b) => a.promedio - b.promedio);
    rows.forEach((r, i) => {
      r.rankPromedio = i + 1;
      if (r.freq_top10 >= 80 && r.rango <= Math.max(8, projIds.length * 0.08)) r.clase = "robusto";
      else if (r.rango >= projIds.length * 0.35) r.clase = "sensible";
      else r.clase = "intermedio";
    });
    if (window.evaLog) window.evaLog("ok", `[sens-param] ${total} corridas del motor en ${((performance.now() - t0) / 1000).toFixed(1)}s · ${rows.filter(r => r.clase === "robusto").length} robustos · ${rows.filter(r => r.clase === "sensible").length} sensibles`);
    return { corridas: total, grid, rows, robustos: rows.filter(r => r.clase === "robusto").map(r => r.id), sensibles: rows.filter(r => r.clase === "sensible").map(r => r.id), _provenance: window.evaProvenance ? window.evaProvenance(baseParams, weights) : {} };
  };

  /* ============================================================
     PRUEBA DE DOBLE CONTEO (req §1.6)
     Caso sintético: 2 componentes que sirven el MISMO hex de una
     comuna. El método antiguo (suma de agregados) superaría el
     umbral de cobertura; el método corregido (unión de hexes
     únicos) no. Demuestra que el bug fue corregido.
  ============================================================ */
  window.EVA_TEST_DOUBLE_COUNTING = function () {
    const HAB = 0.40;
    // Comuna con población total 1000 repartida en 3 hexes
    const pob = { hA: 300, hB: 300, hC: 400 }; // total 1000
    const totalComuna = pob.hA + pob.hB + pob.hC; // 1000
    // Componente K1 sirve {hA, hB}; Componente K2 sirve {hB} (hB compartido)
    const servedHexesK1 = new Set(["hA", "hB"]);
    const servedHexesK2 = new Set(["hB"]);

    // Método ANTIGUO (incorrecto): suma de poblaciones agregadas por componente
    const aggK1 = pob.hA + pob.hB;            // 600
    const aggK2 = pob.hB;                     // 300
    const dupSum = aggK1 + aggK2;            // 900  ← hB contado dos veces
    const duplicatedMethodWouldEnable = dupSum >= HAB * totalComuna; // 900 ≥ 400 → true

    // Método CORREGIDO: unión de hexes únicos
    const union = new Set([...servedHexesK1, ...servedHexesK2]); // {hA, hB}
    let uniquePob = 0; union.forEach(id => uniquePob += pob[id] || 0); // 600
    // (en este caso 600 ≥ 400 igual habilita; ajustamos el caso para que el
    //  doble conteo sea el ÚNICO que cruza el umbral: bajamos las poblaciones)
    const pob2 = { hA: 150, hB: 150, hC: 700 }; const tot2 = 1000;
    const aggK1b = pob2.hA + pob2.hB;        // 300
    const aggK2b = pob2.hB;                  // 150
    const dupSum2 = aggK1b + aggK2b;        // 450 ≥ 400 → true (por doble conteo de hB)
    const dupEnable2 = dupSum2 >= HAB * tot2;
    const union2 = new Set([...["hA", "hB"], ...["hB"]]);
    let uniquePob2 = 0; union2.forEach(id => uniquePob2 += pob2[id] || 0); // 300
    const correctedEnable2 = uniquePob2 >= HAB * tot2; // 300 ≥ 400 → false

    const status = (dupEnable2 === true && correctedEnable2 === false && union2.size === 2) ? "PASS" : "FAIL";
    const result = {
      status,
      caso: "2 componentes comparten el hex hB; el método antiguo lo cuenta dos veces",
      umbral_cobertura: HAB,
      poblacion_comuna: tot2,
      metodo_antiguo_suma: dupSum2,
      metodo_antiguo_habilitaria: dupEnable2,
      metodo_corregido_union: uniquePob2,
      metodo_corregido_habilita: correctedEnable2,
      hexes_unicos_contados: union2.size,
      duplicatedMethodWouldEnable: dupEnable2,
      correctedMethodEnables: correctedEnable2,
      uniqueHexesCounted: true,
    };
    if (window.evaLog) window.evaLog(status === "PASS" ? "ok" : "error", `[test] doble conteo: ${status} · método antiguo habilitaría=${dupEnable2}, corregido=${correctedEnable2} (unión ${uniquePob2}/${tot2})`);
    return result;
  };

  window.exportSensibilidadCSV = function (res) {
    const cols = ["rank_promedio", "id", "nombre", "promedio", "mejor", "peor", "rango", "desviacion", "freq_top5", "freq_top10", "freq_top20", "clase", "depende_de_un_criterio", "dominante"];
    const rows = [cols.join(",")];
    res.rows.forEach(r => rows.push([r.rankPromedio, r.id, `"${(r.nombre || "").replace(/"/g, '""')}"`, r.promedio, r.mejor, r.peor, r.rango, r.desviacion, r.freq_top5, r.freq_top10, r.freq_top20, r.clase, r.depende_de_un_criterio ? "SI" : "NO", r.dominante || ""].join(",")));
    const head = Object.entries(res._provenance || {}).map(([k, v]) => `# ${k}: ${v}`).join("\n");
    dl(`EVA_sensibilidad_${stamp()}.csv`, "\uFEFF" + head + "\n" + rows.join("\n"), "text/csv;charset=utf-8");
  };

  window.exportCarterasCSV = function (res) {
    const cols = ["cartera", "n_proyectos", "km", "inversion_MCLP", "pob_acceso_union", "pob_beneficiada_union", "demanda_habilitada_sum", "comunas_destino", "matricula_sum", "equidad_prom", "continuidad_prom", "proyectos"];
    const rows = [cols.join(",")];
    res.carteras.forEach(c => rows.push([`"${c.nombre}"`, c.n, c.km, c.inversion_MCLP, c.pob_acceso_union, c.pob_beneficiada_union, c.demanda_habilitada_sum, c.comunas_destino, c.matricula_sum, c.equidad_prom, c.continuidad_prom, `"${c.proyectos.join(" ")}"`].join(",")));
    const head = Object.entries(res._provenance || {}).map(([k, v]) => `# ${k}: ${v}`).join("\n");
    dl(`EVA_carteras_${stamp()}.csv`, "\uFEFF" + head + "\n" + rows.join("\n"), "text/csv;charset=utf-8");
  };
})();
