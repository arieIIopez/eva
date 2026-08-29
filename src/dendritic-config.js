/* ============================================================
   EVA · Configuración de raíz dendrítica
   ------------------------------------------------------------
   Extiende el criterio dendrítico sin alterar su formulación base:
   - Alameda se conserva como raíz predeterminada.
   - La raíz puede cambiarse a cualquier eje de la red existente.
   - Opcionalmente la raíz se expande al componente existente conectado.
   - La selección forma parte de la firma de configuración.
   - El solver secuencial recalcula conectividad dendrítica y elección
     modal en cada iteración, de modo que ambos criterios sean realmente
     dependientes del estado de la red.

   Esta capa se carga después de engine.jsx y fractal.js.
============================================================ */
(function () {
  "use strict";

  if (!window.FRACTAL || !window.ENGINE) {
    console.error("[dendrítico] FRACTAL/ENGINE no disponibles al cargar configuración");
    return;
  }

  const KX = 92.6, KY = 111; // km por grado, aproximación local RM

  const DEFAULT_CONFIG = Object.freeze({
    source: "existing",
    rootValue: "Alameda",
    rootLabel: "Alameda",
    matchMode: "contains",
    expandConnected: true,
    includeMatchingProjects: true,
    toleranceM: 100,
    alpha: 0.5,
  });

  let rootConfig = { ...DEFAULT_CONFIG };
  window.EVA_DENDRITIC_ROOT_CONFIG = { ...rootConfig };

  const clean = (s) => String(s == null ? "" : s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  function labelExisting(f) {
    const p = (f && f.properties) || {};
    return p.eje || p.nombre || p.name || p.id || "";
  }

  function labelProject(f) {
    const p = (f && f.properties) || {};
    return p.nombre || p.eje || p.name || p.id || "";
  }

  function matches(value, target, mode) {
    const a = clean(value), b = clean(target);
    if (!a || !b) return false;
    return mode === "exact" ? a === b : a.includes(b);
  }

  /* ---------- geometría: misma convención que fractal.js ---------- */
  function segsOf(geom) {
    if (!geom) return [];
    const lines = geom.type === "LineString" ? [geom.coordinates]
      : geom.type === "MultiLineString" ? geom.coordinates : [];
    const out = [];
    for (const line of lines)
      for (let i = 0; i < line.length - 1; i++) out.push([line[i], line[i + 1]]);
    return out;
  }

  function bboxOf(segs, padKm) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of segs) for (const p of s) {
      if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1];
    }
    const px = padKm / KX, py = padKm / KY;
    return [x0 - px, y0 - py, x1 + px, y1 + py];
  }

  const bboxOverlap = (a, b) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];

  function ptSegKm(p, s) {
    const ax = (s[0][0] - p[0]) * KX, ay = (s[0][1] - p[1]) * KY;
    const bx = (s[1][0] - p[0]) * KX, by = (s[1][1] - p[1]) * KY;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    const cx = ax + t * dx, cy = ay + t * dy;
    return Math.sqrt(cx * cx + cy * cy);
  }

  const orient = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);

  function segCross(a, b) {
    const o1 = orient(a[0], a[1], b[0]), o2 = orient(a[0], a[1], b[1]);
    const o3 = orient(b[0], b[1], a[0]), o4 = orient(b[0], b[1], a[1]);
    return o1 * o2 < 0 && o3 * o4 < 0;
  }

  function connected(segsA, segsB, tolKm) {
    for (const a of segsA) for (const b of segsB) {
      if (segCross(a, b)) return true;
      if (ptSegKm(a[0], b) <= tolKm || ptSegKm(a[1], b) <= tolKm ||
          ptSegKm(b[0], a) <= tolKm || ptSegKm(b[1], a) <= tolKm) return true;
    }
    return false;
  }

  /*
     Construye R0 desde cualquier eje existente elegido por el usuario.
     Si expandConnected=true, R0 incluye todo el componente construido
     alcanzable desde la semilla con la tolerancia dendrítica vigente.
  */
  function rootFromExisting(existingFC, cfg) {
    const feats = (existingFC && existingFC.features) || [];
    const tolKm = (cfg.toleranceM || 100) / 1000;
    const nodes = feats.map(f => {
      const segs = segsOf(f.geometry);
      return { segs, box: segs.length ? bboxOf(segs, tolKm) : null, inRoot: false };
    });

    // limpiar marcas de una selección anterior
    feats.forEach(f => {
      if (f.properties) f.properties._fractalRaiz = 0;
    });

    let frontier = [];
    feats.forEach((f, i) => {
      if (matches(labelExisting(f), cfg.rootValue, cfg.matchMode)) {
        nodes[i].inRoot = true;
        frontier.push(nodes[i]);
      }
    });

    // si el texto configurado no encuentra semilla, volver de forma segura
    // al caso predeterminado Alameda para no producir una raíz vacía silenciosa.
    if (!frontier.length && clean(cfg.rootValue) !== "alameda") {
      feats.forEach((f, i) => {
        if (matches(labelExisting(f), "Alameda", "contains")) {
          nodes[i].inRoot = true;
          frontier.push(nodes[i]);
        }
      });
      window.evaLog && window.evaLog("warn", `[dendrítico] raíz «${cfg.rootLabel || cfg.rootValue}» no encontrada; se usa Alameda como respaldo`);
    }

    if (cfg.expandConnected !== false) {
      while (frontier.length) {
        const next = [];
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          if (n.inRoot || !n.box) continue;
          for (const fr of frontier) {
            if (!bboxOverlap(n.box, fr.box)) continue;
            if (connected(n.segs, fr.segs, tolKm)) {
              n.inRoot = true;
              next.push(n);
              break;
            }
          }
        }
        frontier = next;
      }
    }

    const root = {
      type: "FeatureCollection",
      features: feats.filter((f, i) => {
        if (f.properties) f.properties._fractalRaiz = nodes[i].inRoot ? 1 : 0;
        return nodes[i].inRoot;
      }),
    };
    window.FRACTAL_RAIZ_EXISTENTE = root.features.length;
    return root;
  }

  function matchingProjectRootIndexes(rawFC, cfg, lockedGeoms) {
    const feats = (rawFC && rawFC.features) || [];
    const lockedIds = new Set((lockedGeoms || []).map(f => f && f.properties && f.properties.id));
    const out = new Set();

    feats.forEach((f, i) => {
      const p = f.properties || {};
      if (lockedIds.has(p.id)) out.add(i);
      if (cfg.includeMatchingProjects !== false && matches(labelProject(f), cfg.rootValue, "contains")) out.add(i);
    });
    return Array.from(out);
  }

  const originalComputeForApp = window.FRACTAL.computeForApp;

  function computeForAppConfigurable(rawFC, lockedGeoms, opts) {
    opts = opts || {};
    const cfg = {
      ...rootConfig,
      ...(opts.rootConfig || {}),
    };
    if (opts.toleranciaM != null) cfg.toleranceM = opts.toleranciaM;
    if (opts.factorAtenuacion != null) cfg.alpha = opts.factorAtenuacion;

    // Primera versión de la interfaz: raíz elegible entre ejes existentes.
    // La API queda preparada para futuras raíces múltiples/proyectadas.
    const rootFC = rootFromExisting(window.existingFC, cfg);
    const idxRaicesExtra = matchingProjectRootIndexes(rawFC, cfg, lockedGeoms);

    const res = window.FRACTAL.calcularPrioridadFractal(rootFC, rawFC, {
      toleranciaM: cfg.toleranceM,
      factorAtenuacion: cfg.alpha,
      baseScore: 100,
      raicesExtra: lockedGeoms || [],
      idxRaicesExtra,
    });

    window.FRACTAL_ROOT_ACTIVE = {
      ...cfg,
      existingRootFeatures: (rootFC.features || []).length,
      projectRootFeatures: idxRaicesExtra.length,
    };

    return res.features.map(f => ({
      gradoSeparacion: f.properties.gradoSeparacion,
      scorePrioridad: f.properties.scorePrioridad,
      _fractalNorm: (f.properties.scorePrioridad || 0) / 100,
    }));
  }

  window.FRACTAL.computeForAppLegacy = originalComputeForApp;
  window.FRACTAL.computeForApp = computeForAppConfigurable;
  window.FRACTAL.raizDesdeSemillas = rootFromExisting;
  window.FRACTAL.getRootConfig = () => ({ ...rootConfig });
  window.FRACTAL.setRootConfig = function (patch) {
    rootConfig = { ...rootConfig, ...(patch || {}) };
    rootConfig.toleranceM = Math.max(1, +rootConfig.toleranceM || 100);
    rootConfig.alpha = Math.max(0.01, Math.min(0.99, +rootConfig.alpha || 0.5));
    window.EVA_DENDRITIC_ROOT_CONFIG = { ...rootConfig };
    window.evaLog && window.evaLog("info", `[dendrítico] raíz = ${rootConfig.rootLabel || rootConfig.rootValue} · componente conectado ${rootConfig.expandConnected === false ? "no" : "sí"} · τ=${rootConfig.toleranceM}m · α=${rootConfig.alpha}`);
    window.dispatchEvent(new CustomEvent("eva:dendritic-root-change", { detail: { ...rootConfig } }));
    // app.jsx ya escucha este evento para forzar una reevaluación completa.
    window.dispatchEvent(new CustomEvent("eva:demanda-apply"));
    refreshControl();
    return { ...rootConfig };
  };
  window.FRACTAL.resetRootConfig = () => window.FRACTAL.setRootConfig({ ...DEFAULT_CONFIG });

  /* ---------- incorporar raíz a la firma reproducible ---------- */
  if (window.evaConfigHash && !window.__EVA_DENDRITIC_HASH_PATCHED) {
    const baseHash = window.evaConfigHash;
    window.evaConfigHash = function (params, weights, extra) {
      return baseHash(params, weights, {
        ...(extra || {}),
        dendriticRoot: { ...rootConfig },
      });
    };
    window.__EVA_DENDRITIC_HASH_PATCHED = true;
  }

  /* ---------- solver secuencial con recálculo de criterios dinámicos ---------- */
  if (!window.__EVA_DENDRITIC_SOLVER_PATCHED) {
    const baseSolver = window.ENGINE.runSequentialFull;
    window.ENGINE.runSequentialFullLegacy = baseSolver;

    window.ENGINE.runSequentialFull = async function (existingFC, projectsFC, populationFC, params, weights, opts) {
      opts = opts || {};
      const LOG = (lvl, m) => window.evaLog && window.evaLog(lvl, m);
      const t0 = performance.now();
      const maxSteps = opts.maxSteps || projectsFC.features.length;
      const budget = opts.budget || Infinity;
      const onProgress = opts.onProgress || (() => {});
      const totalW = (Object.values(weights || {}).reduce((a, b) => a + (+b || 0), 0) - (+weights.monumentos || 0)) || 1;

      function scoreOf(p) {
        const n = p.norm || {};
        return (
          (+weights.poblacion || 0) * (n.poblacion || 0) +
          (+weights.costoOD || 0) * (n.costoOD || 0) +
          (+weights.oportunidades || 0) * (n.oportunidades || 0) +
          (+weights.equidad || 0) * (n.equidad || 0) +
          (+weights.prioridadGore || 0) * (n.prioridadGore || 0) +
          (+weights.continuidad || 0) * (n.continuidad || 0) +
          (+weights.demanda || 0) * (n.demanda || 0) +
          (+weights.estudiantes || 0) * (n.estudiantes || 0) +
          (+weights.seguridad || 0) * (n.seguridad || 0) +
          (+weights.monumentos || 0) * (n.monumentos || 0) +
          (+weights.intermodal || 0) * (n.intermodal || 0) +
          (+weights.factibilidad || 0) * (n.factibilidad || 0) +
          (+weights.parques || 0) * (n.parques || 0) +
          (+weights.ciclistas || 0) * (n.ciclistas || 0) +
          (+weights.fractal || 0) * (n.fractal || 0) +
          (+weights.costoInv || 0) * (n.costoInv || 0)
        ) / totalW;
      }

      const order = [];
      const lockedGeoms = [];
      let usedBudget = 0, cumPob = 0, cumDemHab = 0, cumPobBenef = 0;

      LOG("info", `[solver] versión estado-dependiente · raíz dendrítica «${rootConfig.rootLabel || rootConfig.rootValue}» · recálculo modal+dendrítico por iteración`);

      for (let step = 0; step < maxSteps; step++) {
        const tStep = performance.now();
        LOG("step", `[solver] ─ iteración ${step + 1}/${maxSteps}: reevaluando ${projectsFC.features.length - lockedGeoms.length} candidatos contra base + ${lockedGeoms.length} priorizados…`);

        const runRes = window.ENGINE.run(existingFC, projectsFC, populationFC, params, lockedGeoms);
        const enriched = runRes.enriched;

        // Elección modal dependiente del estado: recalcular contra base + priorizados.
        if (window.DEMANDA_MODAL) {
          try {
            const dm = window.DEMANDA_MODAL.computeAll(existingFC, projectsFC, populationFC, lockedGeoms);
            const maxCicl = Math.max(1, ...dm.map(d => d.ciclistasInducidos || 0));
            dm.forEach((d, i) => {
              if (!enriched[i]) return;
              Object.assign(enriched[i], d);
              if (enriched[i].norm) enriched[i].norm.ciclistas = (d.ciclistasInducidos || 0) / maxCicl;
            });
          } catch (e) {
            LOG("warn", `[solver] recálculo modal omitido en iteración ${step + 1}: ${e.message}`);
          }
        }

        // Coherencia dendrítica dependiente del estado y de la raíz seleccionada.
        if (window.FRACTAL) {
          try {
            const fr = window.FRACTAL.computeForApp(projectsFC, lockedGeoms);
            fr.forEach((d, i) => {
              if (!enriched[i]) return;
              enriched[i].gradoSeparacion = d.gradoSeparacion;
              enriched[i].scorePrioridad = d.scorePrioridad;
              if (enriched[i].norm) enriched[i].norm.fractal = d._fractalNorm;
            });
          } catch (e) {
            LOG("warn", `[solver] recálculo dendrítico omitido en iteración ${step + 1}: ${e.message}`);
          }
        }

        const lockedIds = new Set(lockedGeoms.map(f => f.properties.id));
        const candidates = enriched
          .filter(p => !lockedIds.has(p.id))
          .map(p => ({ p, score: scoreOf(p) }))
          .filter(c => c.p.poblacion > 0 || c.p.demandaHabilitada > 0 || c.score > 0)
          .sort((a, b) => b.score - a.score);

        if (!candidates.length) {
          LOG("warn", `[solver] sin candidatos con aporte positivo · deteniendo en paso ${step + 1}`);
          break;
        }

        let chosen = null;
        for (const c of candidates) {
          if (usedBudget + (c.p.costo || 0) <= budget) { chosen = c; break; }
        }
        if (!chosen) {
          LOG("warn", `[solver] presupuesto agotado en paso ${step + 1} · $${usedBudget.toLocaleString("es-CL")} M usados`);
          break;
        }

        const geom = projectsFC.features.find(f => f.properties.id === chosen.p.id);
        if (!geom) {
          LOG("warn", `[solver] geometría no encontrada para ${chosen.p.id}; deteniendo`);
          break;
        }

        lockedGeoms.push(geom);
        usedBudget += chosen.p.costo || 0;
        cumPob += chosen.p.poblacion || 0;
        cumDemHab += chosen.p.demandaHabilitada || 0;
        cumPobBenef += chosen.p.pobBeneficiada || 0;

        order.push({
          step: step + 1,
          id: chosen.p.id,
          nombre: chosen.p.nombre,
          score: +chosen.score.toFixed(4),
          pobMarginal: chosen.p.poblacion,
          pobBeneficiada: chosen.p.pobBeneficiada,
          demandaHab: chosen.p.demandaHabilitada,
          compUnidos: chosen.p.componentesUnidos,
          gradoDendritico: chosen.p.gradoSeparacion,
          scoreDendritico: chosen.p.scorePrioridad,
          ciclistasInducidos: chosen.p.ciclistasInducidos || 0,
          cumPob,
          cumDemHab,
          cumBudget: usedBudget,
        });

        LOG("ok", `[solver] ✓ paso ${step + 1}: ${chosen.p.id} ${chosen.p.nombre} · score ${chosen.score.toFixed(4)} · grado dendrítico ${chosen.p.gradoSeparacion == null ? "aislado" : chosen.p.gradoSeparacion}`);
        onProgress({ step: step + 1, total: maxSteps, chosen: chosen.p.id, cumPob, cumDemHab });
        if (window.evaYield) await window.evaYield();
      }

      const dt = ((performance.now() - t0) / 1000).toFixed(1);
      LOG("ok", `━━━ SOLVER COMPLETO ━━━ ${order.length} pasos en ${dt}s · raíz «${rootConfig.rootLabel || rootConfig.rootValue}» · pob marginal total ${cumPob.toLocaleString("es-CL")} · demanda habilitada ${Math.round(cumDemHab).toLocaleString("es-CL")} v/d · inversión $${usedBudget.toLocaleString("es-CL")} M`);
      return {
        order,
        totalPob: cumPob,
        totalDemHab: cumDemHab,
        totalPobBenef: cumPobBenef,
        totalBudget: usedBudget,
        dendriticRoot: { ...rootConfig },
      };
    };

    window.__EVA_DENDRITIC_SOLVER_PATCHED = true;
  }

  /* ---------- UI autónoma: selector de raíz sin acoplarse a React ---------- */
  function existingRootOptions() {
    const feats = (window.existingFC && window.existingFC.features) || [];
    const names = Array.from(new Set(feats.map(labelExisting).filter(Boolean)))
      .sort((a, b) => String(a).localeCompare(String(b), "es", { sensitivity: "base" }));
    return names;
  }

  function ensureStyles() {
    if (document.getElementById("eva-dendritic-root-style")) return;
    const style = document.createElement("style");
    style.id = "eva-dendritic-root-style";
    style.textContent = `
      #eva-dendritic-root-control{position:fixed;left:340px;bottom:18px;z-index:1200;font-family:Public Sans,system-ui,sans-serif}
      #eva-dendritic-root-control .dr-btn{border:1px solid var(--line-strong,#cbd5e1);background:var(--surface,#fff);color:var(--ink-1,#172033);border-radius:8px;padding:8px 10px;font-size:11px;font-weight:600;box-shadow:0 4px 16px rgba(0,0,0,.12);cursor:pointer;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      #eva-dendritic-root-control .dr-pop{display:none;position:absolute;left:0;bottom:40px;width:330px;background:var(--surface,#fff);border:1px solid var(--line-strong,#cbd5e1);border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.18);padding:12px;color:var(--ink-1,#172033)}
      #eva-dendritic-root-control.open .dr-pop{display:block}
      #eva-dendritic-root-control .dr-title{font-size:12px;font-weight:700;margin-bottom:4px}
      #eva-dendritic-root-control .dr-desc{font-size:10.5px;line-height:1.45;color:var(--ink-3,#667085);margin-bottom:10px}
      #eva-dendritic-root-control label{display:block;font-size:10px;font-weight:600;margin:8px 0 4px}
      #eva-dendritic-root-control select,#eva-dendritic-root-control input[type=number]{width:100%;box-sizing:border-box;border:1px solid var(--line,#d0d5dd);border-radius:6px;background:var(--surface,#fff);color:var(--ink-1,#172033);padding:7px;font:inherit;font-size:11px}
      #eva-dendritic-root-control .dr-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
      #eva-dendritic-root-control .dr-check{display:flex;gap:7px;align-items:flex-start;font-size:10.5px;font-weight:400;line-height:1.35;margin-top:8px}
      #eva-dendritic-root-control .dr-actions{display:flex;gap:6px;margin-top:10px}
      #eva-dendritic-root-control .dr-actions button{flex:1;border:1px solid var(--line-strong,#cbd5e1);border-radius:6px;padding:7px;background:var(--surface,#fff);cursor:pointer;font-size:10.5px}
      #eva-dendritic-root-control .dr-actions button.primary{background:#1d3a8a;color:#fff;border-color:#1d3a8a}
    `;
    document.head.appendChild(style);
  }

  function mountControl() {
    if (document.getElementById("eva-dendritic-root-control")) return;
    ensureStyles();
    const wrap = document.createElement("div");
    wrap.id = "eva-dendritic-root-control";
    wrap.innerHTML = `
      <button type="button" class="dr-btn" title="Configurar raíz del crecimiento dendrítico">Raíz dendrítica: <span data-role="current">Alameda</span> ▾</button>
      <div class="dr-pop">
        <div class="dr-title">Raíz de crecimiento dendrítico</div>
        <div class="dr-desc">Alameda es el caso predeterminado, pero la secuencia puede iniciarse desde cualquier eje existente. Cambiar la raíz fuerza una reevaluación completa.</div>
        <label for="dr-root-select">Eje raíz</label>
        <select id="dr-root-select"></select>
        <label class="dr-check"><input id="dr-expand" type="checkbox" checked><span>Expandir la raíz a toda la red existente conectada al eje seleccionado.</span></label>
        <label class="dr-check"><input id="dr-projects" type="checkbox" checked><span>Incluir proyectos de la cartera cuyo nombre corresponda al mismo eje.</span></label>
        <div class="dr-row">
          <div><label for="dr-tol">Tolerancia τ (m)</label><input id="dr-tol" type="number" min="25" max="500" step="25" value="100"></div>
          <div><label for="dr-alpha">Atenuación α</label><input id="dr-alpha" type="number" min="0.05" max="0.95" step="0.05" value="0.5"></div>
        </div>
        <div class="dr-actions"><button type="button" data-role="reset">Restablecer</button><button type="button" class="primary" data-role="apply">Aplicar y recalcular</button></div>
      </div>`;
    document.body.appendChild(wrap);

    wrap.querySelector(".dr-btn").addEventListener("click", () => {
      wrap.classList.toggle("open");
      populateControl();
    });
    wrap.querySelector('[data-role="apply"]').addEventListener("click", () => {
      const sel = wrap.querySelector("#dr-root-select");
      const value = sel.value || "Alameda";
      window.FRACTAL.setRootConfig({
        source: "existing",
        rootValue: value,
        rootLabel: value,
        matchMode: value === "Alameda" ? "contains" : "exact",
        expandConnected: wrap.querySelector("#dr-expand").checked,
        includeMatchingProjects: wrap.querySelector("#dr-projects").checked,
        toleranceM: +wrap.querySelector("#dr-tol").value || 100,
        alpha: +wrap.querySelector("#dr-alpha").value || 0.5,
      });
      wrap.classList.remove("open");
    });
    wrap.querySelector('[data-role="reset"]').addEventListener("click", () => {
      window.FRACTAL.resetRootConfig();
      populateControl();
    });
    document.addEventListener("click", (ev) => {
      if (!wrap.contains(ev.target)) wrap.classList.remove("open");
    });
    populateControl();
  }

  function populateControl() {
    const wrap = document.getElementById("eva-dendritic-root-control");
    if (!wrap) return;
    const select = wrap.querySelector("#dr-root-select");
    const names = existingRootOptions();
    if (select && names.length) {
      const current = rootConfig.rootValue;
      select.innerHTML = "";
      names.forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        if (clean(name) === clean(current) || (clean(current) === "alameda" && clean(name).includes("alameda"))) opt.selected = true;
        select.appendChild(opt);
      });
    }
    const current = wrap.querySelector('[data-role="current"]');
    if (current) current.textContent = rootConfig.rootLabel || rootConfig.rootValue;
    const exp = wrap.querySelector("#dr-expand"); if (exp) exp.checked = rootConfig.expandConnected !== false;
    const pro = wrap.querySelector("#dr-projects"); if (pro) pro.checked = rootConfig.includeMatchingProjects !== false;
    const tol = wrap.querySelector("#dr-tol"); if (tol) tol.value = rootConfig.toleranceM;
    const alp = wrap.querySelector("#dr-alpha"); if (alp) alp.value = rootConfig.alpha;
  }

  function refreshControl() { populateControl(); }

  // app carga los datos de forma asíncrona; esperar hasta que existan ejes.
  function mountWhenReady(attempt) {
    attempt = attempt || 0;
    if (window.existingFC && window.existingFC.features && window.existingFC.features.length) {
      mountControl();
      return;
    }
    if (attempt < 120) setTimeout(() => mountWhenReady(attempt + 1), 250);
  }

  setTimeout(() => mountWhenReady(0), 0);
  window.addEventListener("eva:dendritic-root-change", refreshControl);
})();
