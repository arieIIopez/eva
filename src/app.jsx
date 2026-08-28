/* ============================================================
   EvaCiclo · App principal
============================================================ */

function App() {
  // ---- Layer visibility ----
  const [layersOn, setLayersOn] = useState({
    existente: true,
    proyectos: true,
    poblacionDots: true,
    poblacionHeat: false,
    educacion: false,
    siniestros: false,
    monumentos: false,
    ferias: false,
    metro: false,
    parques: false,
    pbici: false,
    comunas: false,
    otras: false,
    proyectosMetro: true,
    proyectosInter: true,
    proyectosComunal: true,
    existCiclovia: true, existSmp: true, existCicloparque: true,
    sinFatal: true, sinGrave: true, sinLesion: true, sinDanios: true,
    monHistorico: true, monZona: true, monSantuario: true,
    ferCruza: true, ferCoincide: true, ferParalela: true, ferSin: true,
  });
  const toggleLayer = k => setLayersOn(s => ({ ...s, [k]: !s[k] }));

  // ---- OSM ----
  const [osmLayers, setOsmLayers] = useState(window.OSM_LAYERS);
  const toggleOsm = k => setOsmLayers(s => s.map(l => l.key === k ? { ...l, enabled: !l.enabled } : l));

  // ---- Parámetros ----
  const [params, setParams] = useState(window.DEFAULT_PARAMS);
  const setParam = (k, v) => setParams(s => ({ ...s, [k]: v }));

  // ---- Pesos multicriterio + escenario ----
  const [weights, setWeights] = useState(
    (window.EVA_SCENARIO_MAP && window.EVA_SCENARIO_MAP["balanceado"] && { ...window.EVA_SCENARIO_MAP["balanceado"].weights })
    || window.DEFAULT_WEIGHTS
  );
  const [scenarioKey, setScenarioKey] = useState("balanceado");
  const [modo, setModo] = useState("multicriterio");
  const [showComp, setShowComp] = useState(false); // comparador de proyectos
  const setWeight = (k, v) => {
    setWeights(s => ({ ...s, [k]: v }));
    setScenarioKey(null); // ajuste manual ⇒ deja de ser un escenario predefinido
    setModo("multicriterio");
  };
  const applyScenario = (key) => {
    if (key === "personalizado" || !key) { setScenarioKey(null); return; }
    const sc = window.EVA_SCENARIO_MAP && window.EVA_SCENARIO_MAP[key];
    if (!sc) return;
    setWeights({ ...sc.weights });
    setScenarioKey(key);
    setModo("multicriterio");
  };

  // Modo de priorización: criterio único (peso 100/0) o multicriterio ponderado
  const applyModo = (k) => {
    setModo(k);
    if (k === "multicriterio") {
      const sc = window.EVA_SCENARIO_MAP && window.EVA_SCENARIO_MAP["balanceado"];
      if (sc) { setWeights({ ...sc.weights }); setScenarioKey("balanceado"); }
      window.evaLog && window.evaLog("info", "[ui] Modo de priorización: multicriterio ponderado (escenario Balanceado)");
      return;
    }
    const w = Object.fromEntries(Object.keys(window.DEFAULT_WEIGHTS).map(key => [key, key === k ? 100 : 0]));
    setWeights(w);
    setScenarioKey(null);
    window.evaLog && window.evaLog("info", `[ui] Modo de priorización: criterio único «${k}» (peso 100%)`);
  };

  // ---- Comuna filter ----
  const [filterComuna, setFilterComuna] = useState("Todas");
  // ---- Grupo territorial (provincia / Gran Santiago) ----
  const [filterGrupo, setFilterGrupo] = useState(null);

  // ---- Categoría de cartera (Plan Maestro / Otras carteras) ----
  const [categoria, setCategoria] = useState("Plan Maestro");

  // ---- Vista de conectividad fractal (red dendrítica desde la Alameda) ----
  const [fractalView, setFractalView] = useState(false);

  // ---- Redes aisladas (netview) ----
  const [netActive, setNetActive] = useState(false);
  const [netDist, setNetDist] = useState(1000);
  const [netResult, setNetResult] = useState(null);
  useEffect(() => {
    if (!netActive) return;
    setNetResult(null);
    const t = setTimeout(() => {
      try { setNetResult(window.computeNetView(netDist)); }
      catch (e) { console.error("netview", e); }
    }, 250);
    return () => clearTimeout(t);
  }, [netActive, netDist]);
  const netView = { active: netActive, dist: netDist, result: netResult };

  // ---- Selección ----
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [selectedHex, setSelectedHex] = useState(null);
  const [hexMode, setHexMode] = useState("dest"); // dest = destinos del hex | orig = orígenes hacia su comuna

  // ---- Priorización secuencial ----
  const [lockedIds, setLockedIds] = useState([]);
  const [running, setRunning] = useState(false);
  const [scenarioWith, setScenarioWith] = useState(false);

  // ---- Live projects: REEVALUADOS contra red base + lockedGeoms ----
  const [liveProjects, setLiveProjects] = useState(() => window.PROJECTS || []);
  const [coverage, setCoverage] = useState(() => window.COVERAGE_BY_COMUNA || {});
  const [reevalTick, setReevalTick] = useState(0);
  // Tick de recálculo del modelo de elección modal (supuestos del logit)
  const [demTick, setDemTick] = useState(0);
  useEffect(() => {
    const fn = () => setDemTick(t => t + 1);
    window.addEventListener("eva:demanda-apply", fn);
    return () => window.removeEventListener("eva:demanda-apply", fn);
  }, []);

  useEffect(() => {
    // Construir lockedGeoms desde projectsFC + lockedIds
    if (!window.ENGINE || !window.existingFC) return;
    // Universo activo según la categoría de cartera seleccionada
    const rawFC = (window.FC_RAW && window.FC_RAW[categoria]) || window.projectsFC;
    if (!rawFC) return;
    const lockedGeoms = lockedIds
      .map(id => rawFC.features.find(f => f.properties.id === id))
      .filter(Boolean);
    const { enriched, coverage: cov } = (function() {
      window.ENGINE.setHabThreshold((params.habThreshold || 40) / 100);
      return window.ENGINE.run(
        window.existingFC,
        rawFC,
        window.populationFC,
        params,
        lockedGeoms
      );
    })();
    // Modelo de elección modal (logit): P(bici) por hex + ciclistas inducidos por proyecto.
    // Escenario = red base + proyectos priorizados (lockedGeoms).
    if (window.DEMANDA_MODAL) {
      try {
        const dm = window.DEMANDA_MODAL.computeAll(window.existingFC, rawFC, window.populationFC, lockedGeoms);
        const maxCicl = Math.max(1, ...dm.map(d => d.ciclistasInducidos || 0));
        dm.forEach((d, i) => {
          Object.assign(enriched[i], d);
          if (enriched[i].norm) enriched[i].norm.ciclistas = (d.ciclistasInducidos || 0) / maxCicl;
        });
      } catch (e) { console.error("demanda modal:", e); }
    }
    // Conectividad fractal incremental: la raíz = Alameda + priorizados (lockedGeoms).
    // Al priorizar un eje, los que se le aproximan suben de grado en el recalculo.
    if (window.FRACTAL) {
      try {
        const fr = window.FRACTAL.computeForApp(rawFC, lockedGeoms);
        fr.forEach((d, i) => {
          if (!enriched[i]) return;
          enriched[i].gradoSeparacion = d.gradoSeparacion;
          enriched[i].scorePrioridad = d.scorePrioridad;
          if (enriched[i].norm) enriched[i].norm.fractal = d._fractalNorm;
          // Reflejar en la geometría del mapa (vista de conectividad fractal)
          const gf = rawFC.features[i];
          if (gf && gf.properties) {
            gf.properties.gradoSeparacion = d.gradoSeparacion;
            gf.properties.scorePrioridad = d.scorePrioridad;
          }
        });
        window.FRACTAL_DIST = fr.reduce((acc, d) => {
          const k = d.gradoSeparacion == null ? "aislado" : d.gradoSeparacion;
          acc[k] = (acc[k] || 0) + 1; return acc;
        }, {});
      } catch (e) { console.error("fractal:", e); }
    }
    // Reconstruir projectsFC (geometría + props enriquecidas) del universo activo
    window.projectsFC = {
      type: "FeatureCollection",
      features: rawFC.features.map((f, i) => ({
        type: "Feature",
        geometry: f.geometry,
        properties: enriched[i] || f.properties,
      })),
    };
    setLiveProjects(enriched);
    setCoverage(cov);
    window.PROJECTS = enriched;
    window.COVERAGE_BY_COMUNA = cov;
    window.POB_BASE = window.populationFC.features
      .filter(f => f.properties.conectada)
      .reduce((a, f) => a + (+f.properties.pob || 0), 0);
    // Re-inferir comunas faltantes: el motor reconstruye las propiedades desde FC_RAW
    if (window.evaCompleteComunas) { try { window.evaCompleteComunas(); } catch (e) { console.error("comuna completion:", e); } }
    setReevalTick(t => t + 1);
  }, [categoria, lockedIds, demTick, params.distOrigen, params.distDestino, params.habThreshold, params.connectTol, params.costoPorKm, params.segKSI, params.porcProtegido, params.aproxFinal, params.tiempoMax, params.velRef, params.perfil]);

  // Al cambiar de categoría, limpiar priorizados y selección (universo distinto)
  useEffect(() => {
    setLockedIds([]);
    setSelected(null);
  }, [categoria]);

  // ---- Compute ranking from weights + liveProjects ----
  const ranking = useMemo(() => {
    const totalW = (Object.values(weights).reduce((a, b) => a + b, 0) - (weights.monumentos || 0)) || 1;
    const scored = liveProjects.map(p => {
      const score =
        weights.poblacion * (p.norm?.poblacion || 0) +
        weights.costoOD * (p.norm?.costoOD || 0) +
        weights.oportunidades * (p.norm?.oportunidades || 0) +
        weights.equidad * (p.norm?.equidad || 0) +
        (weights.prioridadGore || 0) * (p.norm?.prioridadGore || 0) +
        weights.continuidad * (p.norm?.continuidad || 0) +
        weights.demanda * (p.norm?.demanda || 0) +
        (weights.estudiantes || 0) * (p.norm?.estudiantes || 0) +
        (weights.seguridad || 0) * (p.norm?.seguridad || 0) +
        (weights.monumentos || 0) * (p.norm?.monumentos || 0) +
        (weights.intermodal || 0) * (p.norm?.intermodal || 0) +
        (weights.factibilidad || 0) * (p.norm?.factibilidad || 0) +
        (weights.parques || 0) * (p.norm?.parques || 0) +
        (weights.ciclistas || 0) * (p.norm?.ciclistas || 0) +
        (weights.fractal || 0) * (p.norm?.fractal || 0) +
        weights.costoInv * (p.norm?.costoInv || 0);
      return { ...p, score: score / totalW };
    });
    // Lockados primero (orden de lock); resto por score desc
    const lockedFirst = lockedIds.map((id, i) => {
      const proj = scored.find(p => p.id === id);
      return proj ? { ...proj, rank: i + 1, _locked: true } : null;
    }).filter(Boolean);
    const rest = scored
      .filter(p => !lockedIds.includes(p.id))
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...p, rank: lockedFirst.length + i + 1 }));
    return [...lockedFirst, ...rest];
  }, [weights, lockedIds, liveProjects]);

  // ---- KPIs ----
  const baseKPIs = useMemo(() => {
    return {
      pobBase: window.POB_BASE || 0,
      pobBaseOrig: window.POB_BASE_ORIG || 0,
      totalPob: window.TOTAL_POB || 0,
      kmExistente: window.EXISTING_KM || 0,
      ejesExistente: window.EXISTING_COUNT || 0,
    };
  }, [reevalTick]);

  // ---- Acciones ----
  const lockProject = id => {
    setLockedIds(ids => ids.includes(id) ? ids : [...ids, id]);
  };
  const unlockProject = id => {
    setLockedIds(ids => ids.filter(x => x !== id));
  };

  // ---- Invalidación del solver: ¿la config cambió desde el último cálculo? ----
  // ---- Solver secuencial completo (asíncrono, con log en terminal) ----
  const [solveResult, setSolveResult] = useState(null);
  const [solving, setSolving] = useState(false);
  const solvingRef = useRef(false);
  const solveFull = useCallback(async (opts) => {
    if (!window.ENGINE || !window.projectsFC || solvingRef.current) return;
    solvingRef.current = true;
    setSolving(true);
    window.evaLog && window.evaLog("info", "[ui] Solver lanzado desde panel de priorización");
    try {
      window.ENGINE.setHabThreshold((params.habThreshold || 40) / 100);
      const res = await window.ENGINE.runSequentialFull(
        window.existingFC, window.projectsFC, window.populationFC,
        params, weights, opts || {}
      );
      setSolveResult(res);
      // firma de configuración con la que se calculó (para invalidación posterior)
      res._configHash = window.evaConfigHash
        ? window.evaConfigHash(params, weights, { escenario: scenarioKey, locked: res.order.map(o => o.id) })
        : null;
      setLockedIds(res.order.map(o => o.id));
      return res;
    } finally {
      solvingRef.current = false;
      setSolving(false);
    }
  }, [params, weights]);

  // ---- Invalidación del solver: ¿la config cambió desde el último cálculo? ----
  const solveStale = useMemo(() => {
    if (!solveResult || !solveResult._configHash || !window.evaConfigHash) return false;
    const now = window.evaConfigHash(params, weights, { escenario: scenarioKey, locked: lockedIds });
    return now !== solveResult._configHash;
  }, [solveResult, params, weights, scenarioKey, lockedIds]);

  // ---- Simulación secuencial ----
  // En cada tick, agrega el proyecto de MAYOR SCORE actual (reevaluado contra red+lockeds)
  // Como liveProjects se actualiza vía useEffect cuando lockedIds cambia, basta con
  // leer window.PROJECTS (mutado por el motor) en cada tick.
  const runTimerRef = useRef(null);
  const runSequential = useCallback(() => {
    if (running) {
      setRunning(false);
      if (runTimerRef.current) clearInterval(runTimerRef.current);
      return;
    }
    setRunning(true);
    runTimerRef.current = setInterval(() => {
      setLockedIds(prev => {
        const totalW = (Object.values(weights).reduce((a, b) => a + b, 0) - (weights.monumentos || 0)) || 1;
        const scored = (window.PROJECTS || [])
          .filter(p => !prev.includes(p.id))
          .map(p => ({
            id: p.id,
            score: (
              weights.poblacion * (p.norm?.poblacion || 0) +
              weights.costoOD * (p.norm?.costoOD || 0) +
              weights.oportunidades * (p.norm?.oportunidades || 0) +
              weights.equidad * (p.norm?.equidad || 0) +
              (weights.prioridadGore || 0) * (p.norm?.prioridadGore || 0) +
              weights.continuidad * (p.norm?.continuidad || 0) +
              weights.demanda * (p.norm?.demanda || 0) +
              (weights.estudiantes || 0) * (p.norm?.estudiantes || 0) +
              (weights.seguridad || 0) * (p.norm?.seguridad || 0) +
              (weights.monumentos || 0) * (p.norm?.monumentos || 0) +
              (weights.intermodal || 0) * (p.norm?.intermodal || 0) +
              (weights.factibilidad || 0) * (p.norm?.factibilidad || 0) +
              (weights.parques || 0) * (p.norm?.parques || 0) +
              (weights.ciclistas || 0) * (p.norm?.ciclistas || 0) +
              (weights.fractal || 0) * (p.norm?.fractal || 0) +
              weights.costoInv * (p.norm?.costoInv || 0)
            ) / totalW
          }))
          .sort((a, b) => b.score - a.score);
        if (!scored.length || scored[0].score <= 0) {
          clearInterval(runTimerRef.current);
          setRunning(false);
          return prev;
        }
        return [...prev, scored[0].id];
      });
    }, 1500);
  }, [running, weights]);

  useEffect(() => () => { if (runTimerRef.current) clearInterval(runTimerRef.current); }, []);

  // ---- Paneles colapsables ----
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="app">
      <Header
        onComparador={() => setShowComp(true)}
        onReport={() => window.EVA_REPORT && window.EVA_REPORT({
          ranking: (window.EVA_ACTIVE_RANK_FILTER && window.EVA_ACTIVE_RANK_FILTER.filtered) || ranking,
          escalaFiltro: (window.EVA_ACTIVE_RANK_FILTER && window.EVA_ACTIVE_RANK_FILTER.escala) || "Todas",
          weights, lockedIds, categoria,
          scenarioName: (window.EVA_SCENARIO_MAP && window.EVA_SCENARIO_MAP[scenarioKey] && window.EVA_SCENARIO_MAP[scenarioKey].nombre) || "Personalizado",
        })}
        onExport={() => window.dispatchEvent(new CustomEvent("eva:tab", { detail: "exp" }))}
      />
      {showComp && window.EvaComparador && <window.EvaComparador ranking={ranking} onClose={() => setShowComp(false)} />}

      <div
        className={
          "app-body" +
          (leftOpen ? "" : " left-closed") +
          (rightOpen ? "" : " right-closed")
        }
      >
        <LeftPanel
          layersOn={layersOn} onToggleLayer={toggleLayer}
          osmLayers={osmLayers} onToggleOsm={toggleOsm}
          params={params} onParamChange={setParam}
          filterComuna={filterComuna} onFilterComuna={c => { setFilterComuna(c); if (c !== "Todas") setFilterGrupo(null); }}
          filterGrupo={filterGrupo} onFilterGrupo={g => { setFilterGrupo(g); setFilterComuna("Todas"); }}
          categoria={categoria} onCategoria={setCategoria}
          modo={modo} onApplyModo={applyModo}
          netView={netView} onNetActive={setNetActive} onNetDist={setNetDist}
          fractalView={fractalView} onFractalView={setFractalView}
          lockedIds={lockedIds} onLockProject={lockProject} onUnlockProject={unlockProject} ranking={ranking}
        />
        <MapView
          layersOn={layersOn}
          selectedId={selected}
          onSelect={(id) => { setSelected(id); setSelectedHex(null); }}
          hoveredId={hovered}
          onHover={(id) => setHovered(id)}
          lockedIds={lockedIds}
          scenarioWith={scenarioWith}
          selectedHexId={selectedHex}
          onSelectHex={(id) => { setSelectedHex(id); setSelected(null); }}
          hexMode={hexMode}
          filterComuna={filterComuna}
          categoria={categoria}
          filterGrupo={filterGrupo}
          reevalTick={reevalTick}
          netView={netView}
          fractalView={fractalView}
          layoutTick={(leftOpen ? 1 : 0) + (rightOpen ? 2 : 0)}
        />
        <RightPanel
          weights={weights} onWeightChange={setWeight}
          params={params} onParamChange={setParam}
          selected={selected} onSelect={setSelected}
          onHover={setHovered}
          lockedIds={lockedIds}
          onLock={lockProject} onUnlock={unlockProject}
          onRunSequential={runSequential}
          running={running}
          ranking={ranking}
          baseKPIs={baseKPIs}
          scenarioWith={scenarioWith}
          onScenarioToggle={setScenarioWith}
          selectedHex={selectedHex}
          onClearHex={() => setSelectedHex(null)}
          hexMode={hexMode}
          onHexMode={setHexMode}
          onSolveFull={solveFull}
          solveResult={solveResult}
          solving={solving}
          solveStale={solveStale}
          scenarioKey={scenarioKey}
          onScenario={applyScenario}
        />

        <button
          className="panel-collapse left"
          style={{ left: leftOpen ? "320px" : "0px" }}
          onClick={() => setLeftOpen(o => !o)}
          title={leftOpen ? "Ocultar panel de capas" : "Mostrar panel de capas"}
        >
          <Ico name={leftOpen ? "chevLeft" : "chevRight"} />
        </button>
        <button
          className="panel-collapse right"
          style={{ right: rightOpen ? "400px" : "0px" }}
          onClick={() => setRightOpen(o => !o)}
          title={rightOpen ? "Ocultar panel de resultados" : "Mostrar panel de resultados"}
        >
          <Ico name={rightOpen ? "chevRight" : "chevLeft"} />
        </button>
      </div>
      <TerminalWindow />
    </div>
  );
}

/* ---------- Header ---------- */
function Header({ onComparador, onReport, onExport }) {
  return (
    <header className="hdr">
      <div className="hdr-brand">
        <img className="hdr-brand-mark" src={(window.__resources && window.__resources.logoGore) || "assets/logo_gore.svg"} alt="GORE Santiago" />
        <div>
          <div className="hdr-brand-name">EVA</div>
          <div className="hdr-brand-sub">Evaluador de ciclovías proyectadas</div>
        </div>
      </div>
      <div className="hdr-title">
        <span className="hdr-title-main">Evaluación y priorización de infraestructura ciclista</span>
        <span className="hdr-pill">motor v{window.EVA_VERSION ? window.EVA_VERSION.ENGINE_VERSION : "3"}</span>
        <span className="hdr-title-meta">datos {window.EVA_VERSION ? window.EVA_VERSION.DATA_VERSION : "—"} · metodología v{window.EVA_VERSION ? window.EVA_VERSION.METHODOLOGY_VERSION : "—"}</span>
      </div>
      <div className="hdr-actions">
        <button className="hdr-btn" onClick={onComparador}><Ico name="map" /> <span>Comparador</span></button>
        <button className="hdr-btn" onClick={onReport}><Ico name="chart" /> <span>Reportes</span></button>
        <button className="hdr-btn primary" onClick={onExport}><Ico name="download" /> <span>Exportar</span></button>
        <div className="hdr-user">
          <div className="hdr-avatar">AR</div>
          <span>Analista RM</span>
        </div>
      </div>
    </header>
  );
}

// Bootstrap async: cargar capas reales + logo + delay mínimo, luego montar app
(async function init() {
  const minDelay = new Promise(r => setTimeout(r, 3000));
  const loadLogo = Promise.resolve();
  try {
    await Promise.all([
      window.loadProjects(),
      loadLogo,
      minDelay,
    ]);
    // Completar comunas faltantes por inferencia espacial (req 2.4)
    if (window.evaCompleteComunas) { try { window.evaCompleteComunas(); } catch (e) { console.error("comuna completion:", e); } }
  } catch (e) {
    console.error("init failed:", e);
  }
  // Fade-out del boot screen
  const boot = document.querySelector(".boot");
  if (boot) {
    boot.style.transition = "opacity 350ms";
    boot.style.opacity = "0";
    setTimeout(() => boot.remove(), 350);
  }
  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
})();
