/* ============================================================
   EvaCiclo · Right Panel — KPIs, ranking multicriterio, ficha
============================================================ */

function RightPanel({
  weights, onWeightChange,
  params, onParamChange,
  selected, onSelect,
  lockedIds, onLock, onUnlock, onRunSequential,
  running,
  ranking, baseKPIs,
  scenarioWith, onScenarioToggle,
  onHover,
  selectedHex, onClearHex,
  hexMode, onHexMode,
  onSolveFull, solveResult, solving, solveStale,
  scenarioKey, onScenario,
}) {
  const [tab, setTab] = useState(selected ? "ficha" : "diag");
  const [showRankNotice, setShowRankNotice] = useState(false);
  const rankNoticeShown = useRef(false);

  // Botón «Exportar» del header (y otros): cambio de pestaña vía evento global
  useEffect(() => {
    const h = (e) => { if (e.detail) setTab(e.detail); };
    window.addEventListener("eva:tab", h);
    return () => window.removeEventListener("eva:tab", h);
  }, []);

  // auto-switch to ficha when a project is selected
  useEffect(() => {
    if (selected) setTab("ficha");
  }, [selected]);

  // auto-switch to hex view when a hex is selected
  useEffect(() => {
    if (selectedHex) setTab("hex");
  }, [selectedHex]);

  return (
    <aside className="panel panel-right">
      <KpiStrip kpis={baseKPIs} lockedIds={lockedIds} ranking={ranking} />
      <Tabs
        tabs={[
          { key: "diag",   ph: "FASE 1·2", label: "Diagnóstico" },
          { key: "rank",   ph: "FASE 3",   label: "Ranking" },
          { key: "ficha",  ph: "DETALLE",  label: "Ficha" },
          { key: "hex",    ph: "OD",       label: "Hex" },
          { key: "dem",    ph: "FASE 4",   label: "Demanda" },
          { key: "anal",   ph: "AUDIT",    label: "Análisis" },
          { key: "exp",    ph: "FASE 5",   label: "Exportar" },
        ]}
        active={tab}
        onChange={k => { setTab(k); if (k === "rank" && !rankNoticeShown.current) { rankNoticeShown.current = true; setShowRankNotice(true); } }}
      />

      {showRankNotice && (
        <div className="info-scrim" onClick={() => setShowRankNotice(false)}>
          <div className="info-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="info-modal-h">
              <div className="info-modal-title">Aviso</div>
            </div>
            <div className="info-modal-body">
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)" }}>
                Esta plataforma fue desarrollada por la División de Infraestructura y Transporte del Gobierno Regional de Santiago con el propósito de apoyar la evaluación y priorización de ciclovías mediante un análisis multicriterio aplicado a distintos escenarios.
              </p>
              <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)" }}>
                Los resultados, escenarios y niveles de priorización generados por esta herramienta son de carácter referencial y no constituyen necesariamente la evaluación, priorización ni posición oficial del Gobierno Regional de Santiago.
              </p>
              <button className="btn btn-primary" style={{ marginTop: 16, width: "100%" }} onClick={() => setShowRankNotice(false)}>Aceptar</button>
            </div>
          </div>
        </div>
      )}

      <div className="panel-scroll">
        {tab === "diag"  && <DiagTab baseKPIs={baseKPIs} ranking={ranking} lockedIds={lockedIds} scenarioWith={scenarioWith} onScenarioToggle={onScenarioToggle} />}
        {tab === "rank"  && (
          <RankTab
            weights={weights} onWeightChange={onWeightChange}
            params={params} onParamChange={onParamChange}
            ranking={ranking} lockedIds={lockedIds}
            selected={selected} onSelect={onSelect} onHover={onHover}
            onLock={onLock} onUnlock={onUnlock}
            onRunSequential={onRunSequential} running={running}
            onSolveFull={onSolveFull} solveResult={solveResult} solving={solving} solveStale={solveStale}
            scenarioKey={scenarioKey} onScenario={onScenario}
          />
        )}
        {tab === "ficha" && <FichaTab selected={selected} ranking={ranking} onSelect={onSelect} onLock={onLock} lockedIds={lockedIds} weights={weights} />}
        {tab === "hex"   && <HexTab selectedHex={selectedHex} onClear={onClearHex} mode={hexMode} onMode={onHexMode} />}
        {tab === "dem"   && <DemandaTab ranking={ranking} />}
        {tab === "anal"  && <AnalisisTab weights={weights} solveResult={solveResult} lockedIds={lockedIds} onSelect={onSelect} />}
        {tab === "exp"   && <ExportTab ranking={ranking} lockedIds={lockedIds} params={params} weights={weights} solveResult={solveResult} solveStale={solveStale} scenarioKey={scenarioKey} />}
      </div>
    </aside>
  );
}

/* ===================== Hex tab: detalle de población OD ===================== */
function HexTab({ selectedHex, onClear, mode, onMode }) {
  if (!selectedHex) {
    return (
      <div className="empty" style={{ paddingTop: 56 }}>
        <div className="empty-icon"><Ico name="target" className="ico" /></div>
        <div className="empty-title">Selecciona una zona de población</div>
        <div className="empty-hint">Activa la capa <b>Población OD</b> en el panel izquierdo y haz clic sobre un punto en el mapa para ver cuántas personas viven ahí y hacia dónde se dirigen sus viajes.</div>
      </div>
    );
  }
  const hex = window.populationFC.features.find(h => h.properties.id === selectedHex);
  if (!hex) return null;
  const p = hex.properties;
  const com = window.OD_COMUNAS_MAP.get(p.comuna);
  const comName = com ? com.name : ("Comuna " + p.comuna);
  const cov = window.COVERAGE_BY_COMUNA && window.COVERAGE_BY_COMUNA[p.comuna];

  const dests = [];
  for (let i = 1; i <= 10; i++) {
    const code = p["d" + i];
    const v = p["d" + i + "v"];
    if (!code || !v) continue;
    const c = window.OD_COMUNAS_MAP.get(code);
    dests.push({
      rank: i, code, v,
      name: c ? c.name : ("Comuna " + code),
      coverage: window.COVERAGE_BY_COMUNA[code] || 0,
    });
  }
  const sumTop = dests.reduce((a, d) => a + d.v, 0);
  const otros = Math.max(0, (p.flow || 0) - sumTop);

  return (
    <>
      <div className="ficha-header">
        <div className="ficha-eyebrow">
          <span>Zona de población OD</span>
          <span className="ficha-id">· hex {p.id}</span>
          <button className="hdr-btn" style={{ marginLeft: "auto", padding: "2px 6px", fontSize: 11 }} onClick={onClear}>Limpiar</button>
        </div>
        <div className="ficha-name">{comName}</div>
        <div className="ficha-locale">Centroide · hex de ≈600 m</div>
        <div className="tag-list" style={{ marginTop: 10 }}>
          <span className={"tag " + (p.conectada ? "good" : "warn")}>
            {p.conectada ? "✓ Atendida hoy" : "✕ No atendida hoy"}
          </span>
          <span className={"tag " + (p.vEdu ? "good" : "")} style={!p.vEdu ? { background: "oklch(0.96 0.04 25)", color: "var(--bad)", borderColor: "oklch(0.85 0.08 25)" } : undefined}>
            {p.vEdu ? `✓ Ed. superior alcanzable (${fmtMM(p.matAcc || 0)} matr.)` : "✕ Sin sede ed. superior alcanzable"}
          </span>
          <span className="tag" title={((window.MANZ_BY_HEX && window.MANZ_BY_HEX.get(p.id)) || []).slice(0, 12).join(" · ")}>{p.n} manzanas agregadas</span>
          {cov != null && <span className="tag">Cobertura comunal {(cov*100).toFixed(0)}%</span>}
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric">
          <div className="metric-k">Personas (censo 24)</div>
          <div className="metric-v">{fmtN(p.per || 0)}</div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>{fmtN(p.hom || 0)} H · {fmtN(p.muj || 0)} M</div>
        </div>
        <div className="metric">
          <div className="metric-k">Ocupados</div>
          <div className="metric-v">{fmtN(p.pob)}</div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>generan el vector OD laboral</div>
        </div>
        <div className="metric">
          <div className="metric-k">Estudiantes</div>
          <div className="metric-v">{fmtN((p.estM || 0) + (p.estS || 0))}</div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>{fmtN(p.estM || 0)} media · {fmtN(p.estS || 0)} superior</div>
        </div>
        <div className="metric">
          <div className="metric-k">Viajes/día totales</div>
          <div className="metric-v">{fmtN(p.flow)}</div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>OD laboral del hex</div>
        </div>
        <div className="metric">
          <div className="metric-k">P(bici) · modelo logit</div>
          <div className="metric-v">{p.pBici != null ? (p.pBici * 100).toFixed(1) : "—"}<span className="u">%</span></div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>
            {p.pBiciEsc != null && p.pBiciEsc > (p.pBici || 0) + 1e-6
              ? `con escenario: ${(p.pBiciEsc * 100).toFixed(1)}%`
              : p.shareObs != null
                ? `share observado: ${(p.shareObs * 100).toFixed(1)}%`
                : `${(p.km500 || 0).toFixed(1)} km de ciclovía en 500 m`}
          </div>
        </div>
        <div className="metric">
          <div className="metric-k">Ciclistas estimados</div>
          <div className="metric-v" style={{ color: "var(--good)" }}>{fmtN(Math.round(p.ciclistasBase || 0))}<span className="u">/día</span></div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>
            {(p.dCicl || 0) > 0.5 ? `escenario suma +${fmtN(Math.round(p.dCicl))}` : "ocupados × P(bici)"}
          </div>
        </div>
      </div>

      {window.MANZ_BY_HEX && window.MANZ_BY_HEX.get(p.id) && (
        <div style={{ padding: "8px 16px 0", fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--ink-3)", lineHeight: 1.6 }}>
          MANZENT: {window.MANZ_BY_HEX.get(p.id).slice(0, 6).join(" · ")}
          {window.MANZ_BY_HEX.get(p.id).length > 6 ? ` · +${window.MANZ_BY_HEX.get(p.id).length - 6} más` : ""}
          {p.escModelo != null ? ` — esc. ${p.escModelo.toFixed(1)} años · |Δh| ${Math.round(p.altModelo)} m (muestra del modelo)` : ""}
        </div>
      )}

      <div style={{ display: "flex", gap: 6, padding: "12px 16px 0" }}>
        <button
          className={"hdr-btn" + (mode !== "orig" ? " primary" : "")}
          style={{ flex: 1, justifyContent: "center" }}
          onClick={() => onMode("dest")}
        >
          Destinos de sus viajes
        </button>
        <button
          className={"hdr-btn" + (mode === "orig" ? " primary" : "")}
          style={{ flex: 1, justifyContent: "center" }}
          onClick={() => onMode("orig")}
        >
          Orígenes que llegan aquí
        </button>
      </div>

      {mode !== "orig" && (
      <Section title="Top destinos de viaje" desc="Hacia dónde se dirigen los viajes que se originan en esta zona. La línea curva en el mapa muestra el deseo de viaje; el grosor indica el volumen.">
        {dests.length === 0 && (
          <div className="empty-hint">Sin viajes registrados desde este hex.</div>
        )}
        {dests.map(d => {
          const viable = p["v" + d.rank] === true;
          return (
          <div key={d.code} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 999, background: "var(--accent-deep)", color: "white",
                  fontSize: 10, fontWeight: 700, display: "grid", placeItems: "center",
                  fontFamily: "var(--font-mono)",
                }}>{d.rank}</span>
                <span style={{ fontWeight: 600, fontSize: 12.5, color: "var(--ink-0)" }}>{d.name}</span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--ink-0)" }}>
                {fmtN(d.v)} <span style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 500 }}>v/d</span>
              </span>
            </div>
            <div className="justify-bar">
              <div style={{ width: (d.v / Math.max(1, dests[0].v) * 100) + "%" }}></div>
            </div>
            <div style={{ fontSize: 10.5, color: viable ? "var(--good)" : "var(--bad)", marginTop: 3, fontFamily: "var(--font-mono)" }}>
              {viable
                ? `✓ Viaje viable: misma subred conecta origen y destino`
                : `✕ Sin ruta: ninguna subred accesible llega a este destino`
              }
            </div>
          </div>
        );})}
        {otros > 0 && (
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8, fontFamily: "var(--font-mono)" }}>
            + {fmtN(otros)} v/d a otros destinos (no en top 10)
          </div>
        )}
      </Section>
      )}

      {mode === "orig" && <HexOrigenes p={p} comName={comName} />}

      <Section title="¿Qué significa esto?" desc="Para evaluar si una ciclovía sirve a esta zona.">
        <p style={{ margin: 0, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.55 }}>
          Un viaje es <b>viable</b> cuando una misma subred ciclable conecta el origen (≤{window.DEFAULT_PARAMS.distOrigen} m)
          con la comuna destino. Los destinos en <span style={{ color: "var(--bad)", fontWeight: 600 }}>rojo</span> requieren
          o bien extender la red hacia ellos, o bien <b>unir subredes inconexas</b> — ese es justamente el aporte
          que el motor mide al evaluar cada ciclovía proyectada.
        </p>
      </Section>
    </>
  );
}

/* ===================== KPI strip ===================== */
function KpiStrip({ kpis, lockedIds, ranking }) {
  // marginal acumulado real = pob base actual − pob base sin proyectos
  const margAdded = Math.max(0, (kpis.pobBase || 0) - (kpis.pobBaseOrig || 0));
  return (
    <div className="kpi-strip">
      <div className="kpi">
        <div className="kpi-k">Pob. atendida base<InfoButton k="kpi_pobBase" /></div>
        <div className="kpi-v">{fmtN(kpis.pobBase)}</div>
        <div className="kpi-delta" style={{ color: "var(--ink-3)" }}>{fmtPct(kpis.pobBase / kpis.totalPob, 1)} del total</div>
      </div>
      <div className="kpi">
        <div className="kpi-k">Brecha<InfoButton k="kpi_brecha" /></div>
        <div className="kpi-v">{fmtN(kpis.totalPob - kpis.pobBase)}</div>
        <div className="kpi-delta" style={{ color: "var(--bad)" }}>no atendida</div>
      </div>
      <div className="kpi">
        <div className="kpi-k">Red base<InfoButton k="kpi_red" /></div>
        <div className="kpi-v">{kpis.kmExistente.toFixed(0)}<span style={{fontSize:10,marginLeft:2,color:"var(--ink-3)"}}>km</span></div>
        <div className="kpi-delta" style={{ color: "var(--ink-3)" }}>{kpis.ejesExistente} ejes SECTRA</div>
      </div>
      <div className="kpi">
        <div className="kpi-k">Marginal acum.<InfoButton k="kpi_marginal" /></div>
        <div className="kpi-v">+{fmtMM(margAdded)}</div>
        <div className="kpi-delta">{lockedIds.length} priorizado{lockedIds.length===1?"":"s"}</div>
      </div>
      <div className="kpi">
        <div className="kpi-k">Ciclistas/día<InfoButton k="mod_logit" /></div>
        <div className="kpi-v">{fmtN(window.CICLISTAS_BASE || 0)}</div>
        <div className="kpi-delta" style={{ color: "var(--ink-3)" }}>P̄(bici) {((window.PBICI_MEDIA || 0) * 100).toFixed(1)}% · logit</div>
      </div>
      <div className="kpi">
        <div className="kpi-k">Inducidos esc.<InfoButton k="mod_logit" /></div>
        <div className="kpi-v" style={(window.CICLISTAS_DELTA || 0) > 0 ? { color: "var(--good)" } : null}>+{fmtN(window.CICLISTAS_DELTA || 0)}</div>
        <div className="kpi-delta" style={{ color: "var(--ink-3)" }}>{lockedIds.length ? "con priorizados" : "sin priorizados"}</div>
      </div>
    </div>
  );
}

/* ===================== Diagnóstico ===================== */
function DiagTab({ baseKPIs, ranking, lockedIds, scenarioWith, onScenarioToggle }) {
  const carteraPop = ranking.reduce((a, r) => a + r.poblacion, 0);

  // Cobertura por comuna con datos OD reales + delta proyectado
  const cob = useMemo(() => {
    const totalByCom = window.TOTAL_BY_COMUNA || {};
    const covByCom = window.COVERAGE_BY_COMUNA || {};
    const addByCom = {};
    if (lockedIds.length > 0) {
      const newHexIds = new Set();
      lockedIds.forEach(id => {
        const p = window.PROJECTS.find(x => x.id === id);
        if (p && p._hexNew) p._hexNew.forEach(h => newHexIds.add(h));
      });
      for (const f of window.populationFC.features) {
        if (newHexIds.has(f.properties.id)) {
          const c = f.properties.comuna || "_";
          addByCom[c] = (addByCom[c] || 0) + (+f.properties.pob || 0);
        }
      }
    }
    const rows = (window.OD_COMUNAS || []).map(c => {
      const total = totalByCom[c.code] || 0;
      const baseConn = (covByCom[c.code] || 0) * total;
      const added = addByCom[c.code] || 0;
      const projConn = Math.min(total, baseConn + added);
      return {
        code: c.code, name: c.name,
        total, baseConn, projConn,
        baseCov: total ? baseConn / total : 0,
        projCov: total ? projConn / total : 0,
        delta: total ? (projConn - baseConn) / total : 0,
      };
    }).filter(r => r.total > 0);
    rows.sort((a, b) => a.baseCov - b.baseCov);
    return rows;
  }, [lockedIds]);
  const [comView, setComView] = useState("top12"); // "top12" | "gs" | "all"
  const granSantiagoSet = useMemo(() => {
    const list = (window.GRUPOS_TERRITORIALES && window.GRUPOS_TERRITORIALES["Gran Santiago"]) || [];
    const norm = s => String(s || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return new Set(list.map(norm));
  }, []);
  const norm = s => String(s || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cobGS = cob.filter(c => granSantiagoSet.has(norm(c.name)));
  const cobVisible = comView === "all" ? cob : comView === "gs" ? cobGS : cobGS.slice(0, 12);

  return (
    <>
      <Section title="Escenario activo" desc="Compara el escenario base contra el escenario con proyectos priorizados.">
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className={"hdr-btn" + (!scenarioWith ? " primary" : "")}
            style={{ flex: 1, justifyContent: "center" }}
            onClick={() => onScenarioToggle(false)}
          >
            Red base
          </button>
          <button
            className={"hdr-btn" + (scenarioWith ? " primary" : "")}
            style={{ flex: 1, justifyContent: "center" }}
            onClick={() => onScenarioToggle(true)}
          >
            Base + Cartera
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 11.5 }}>
          <span style={{ color: "var(--ink-3)" }}>Población alcanzable</span>
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-0)", fontWeight: 600 }}>
            {fmtN(baseKPIs.pobBase)} → {fmtN(baseKPIs.pobBase + (scenarioWith ? carteraPop : 0))}
            {scenarioWith && <span style={{ color: "var(--good)", marginLeft: 6 }}>+{fmtN(carteraPop)}</span>}
          </span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11.5 }}>
          <span style={{ color: "var(--ink-3)" }}>Viajes OD viables hoy (top-10 destinos)</span>
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-0)", fontWeight: 600 }}>
            {fmtN(window.VIABLE_FLOW_BASE || 0)} / {fmtN(window.TOTAL_FLOW_TOP3 || 0)}
            <span style={{ color: "var(--ink-3)", marginLeft: 6 }}>
              ({window.TOTAL_FLOW_TOP3 ? ((window.VIABLE_FLOW_BASE / window.TOTAL_FLOW_TOP3) * 100).toFixed(0) : 0}%)
            </span>
          </span>
        </div>
      </Section>

      <Section title="Curva de beneficio acumulado" infoKey="sec_curva" desc="Población marginal añadida al incorporar proyectos en orden de ranking.">
        <BenefitCurve ranking={ranking} lockedCount={lockedIds.length} />
      </Section>

      <Section
        title="Cobertura por comuna"
        meta={`${cobVisible.length} de ${cob.length} comunas · ord. por brecha`}
        desc={lockedIds.length > 0
          ? "Cobertura actual (color) y proyectada con proyectos priorizados (delta en azul)."
          : "% de población con acceso a red ciclable (≤700m). Las menos cubiertas concentran el potencial de impacto."}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {cobVisible.map(c => (
            <div key={c.code} style={{ display: "grid", gridTemplateColumns: "120px 1fr 70px", gap: 8, alignItems: "center", fontSize: 11.5 }}>
              <span style={{ color: "var(--ink-2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={c.name}>{c.name}</span>
              <div style={{ position: "relative", height: 6, background: "var(--bg-2)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0, width: (c.baseCov * 100) + "%",
                  background: c.baseCov > 0.5 ? "var(--good)" : c.baseCov > 0.25 ? "var(--warn)" : "var(--bad)"
                }}></div>
                {c.delta > 0 && (
                  <div style={{
                    position: "absolute", left: (c.baseCov*100)+"%", top: 0, bottom: 0,
                    width: (c.delta * 100) + "%",
                    background: "var(--primary)", opacity: 0.65
                  }}></div>
                )}
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, textAlign: "right" }}>
                {(c.baseCov*100).toFixed(0)}%
                {c.delta > 0 && <span style={{ color: "var(--primary)", marginLeft: 3 }}>+{(c.delta*100).toFixed(0)}</span>}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {comView !== "gs" && (
            <button className="hdr-btn" style={{ flex: 1, justifyContent: "center", marginTop: 10, whiteSpace: "nowrap" }} onClick={() => setComView("gs")}>
              Ver Gran Santiago (40)
            </button>
          )}
          {comView !== "all" ? (
            <button className="hdr-btn" style={{ flex: 1, justifyContent: "center", marginTop: 10, whiteSpace: "nowrap" }} onClick={() => setComView("all")}>
              Ver Región (52)
            </button>
          ) : (
            <button className="hdr-btn" style={{ flex: 1, justifyContent: "center", marginTop: 10, whiteSpace: "nowrap" }} onClick={() => setComView("top12")}>
              Mostrar menos
            </button>
          )}
        </div>
      </Section>

      <Section title="Composición de la red base" desc="Por tipo de infraestructura (SECTRA dic-25).">
        <div className="justify-list">
          {Object.entries(window.EXISTING_TIPO || {}).map(([k, v]) => {
            const total = Object.values(window.EXISTING_TIPO).reduce((a, b) => a + b, 0);
            const labels = { ciclovia: "Ciclovía", smp: "Senda multipropósito", cicloparque: "Cicloparque", piloto: "Piloto/temporal", zona30: "Zona 30", otro: "Sin información" };
            return (
              <div key={k} className="justify-row">
                <span className="justify-k">{labels[k] || k}</span>
                <div className="justify-bar"><div style={{ width: ((v / total) * 100) + "%" }}></div></div>
                <span className="justify-v">{v}</span>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}

/* ---------- Curva acumulada (SVG) ---------- */
function BenefitCurve({ ranking, lockedCount }) {
  const w = 360, h = 130, pad = { t: 8, r: 8, b: 20, l: 36 };
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const series = useMemo(() => {
    let cum = 0;
    return ranking.map((r, i) => {
      cum += r.poblacion;
      return { i: i + 1, name: r.id, v: cum };
    });
  }, [ranking]);
  const maxV = series.length ? series[series.length - 1].v : 1;
  const x = i => pad.l + (i / Math.max(1, ranking.length)) * innerW;
  const y = v => pad.t + innerH - (v / maxV) * innerH;
  const path = ["M", x(0), y(0)].concat(series.flatMap(s => ["L", x(s.i), y(s.v)])).join(" ");
  const area = path + ` L ${x(series.length)} ${pad.t + innerH} L ${x(0)} ${pad.t + innerH} Z`;
  // Etiquetas X: máximo ~6 ticks equiespaciados (evita solapamiento con carteras grandes)
  const xStep = Math.max(1, Math.ceil(series.length / 6));
  const xTicks = series.filter((s, i) => i % xStep === 0 || i === series.length - 1);

  return (
    <div className="curve-wrap">
      <svg viewBox={`0 0 ${w} ${h}`} className="curve-svg">
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line key={t} x1={pad.l} x2={pad.l + innerW}
            y1={pad.t + t * innerH} y2={pad.t + t * innerH}
            stroke="oklch(0.93 0.01 250)" strokeWidth="1" />
        ))}
        {/* y axis labels */}
        {[0, 0.5, 1].map(t => (
          <text key={t} x={pad.l - 6} y={pad.t + (1 - t) * innerH + 3}
            fontSize="9" textAnchor="end" fill="oklch(0.55 0.01 250)" fontFamily="var(--font-mono)">
            {fmtMM(Math.round(maxV * t))}
          </text>
        ))}
        {/* area */}
        <path d={area} fill="oklch(0.42 0.13 250 / 0.1)" />
        <path d={path} fill="none" stroke="oklch(0.42 0.13 250)" strokeWidth="2" strokeLinejoin="round" />
        {/* points */}
        {series.map((s, i) => (
          <g key={s.name}>
            <circle cx={x(s.i)} cy={y(s.v)} r={i < lockedCount ? 4 : 2.5}
              fill={i < lockedCount ? "oklch(0.42 0.13 250)" : "white"}
              stroke="oklch(0.42 0.13 250)" strokeWidth="1.5" />
          </g>
        ))}
        {/* x axis */}
        {xTicks.map(s => (
          <g key={s.name}>
            <line x1={x(s.i)} x2={x(s.i)} y1={pad.t + innerH} y2={pad.t + innerH + 4}
              stroke="oklch(0.78 0.01 250)" strokeWidth="1" />
            <text x={x(s.i)} y={h - 4}
              fontSize="9" textAnchor="middle" fill="oklch(0.55 0.01 250)" fontFamily="var(--font-mono)">
              {s.name}
            </text>
          </g>
        ))}
      </svg>
      <div className="curve-legend">
        <span><i className="dot" style={{ background: "oklch(0.42 0.13 250)" }}></i> Beneficio acumulado (personas)</span>
        <span><i className="dot" style={{ background: "white", border: "1.5px solid oklch(0.42 0.13 250)", height: 6, width: 6, borderRadius: "50%" }}></i> Pendiente</span>
      </div>
    </div>
  );
}

/* ===================== Ranking + Multicriterio ===================== */
function RankTab({ weights, onWeightChange, params, onParamChange, ranking, lockedIds, selected, onSelect, onHover, onLock, onUnlock, onRunSequential, running, onSolveFull, solveResult, solving, solveStale, scenarioKey, onScenario }) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);

  const [search, setSearch] = useState("");
  const [macro, setMacro] = useState("Todas");
  const [escala, setEscala] = useState("Todas");
  const [budget, setBudget] = useState(0); // M$ — 0 = sin filtro

  const filtered = useMemo(() => {
    return ranking.filter(p => {
      if (macro !== "Todas" && p.macrozona !== macro) return false;
      if (escala !== "Todas") {
        if (escala === "Comunal e Intercomunal") { if (p.escala !== "Comunal" && p.escala !== "Intercomunal") return false; }
        else if (p.escala !== escala) return false;
      }
      if (search && !(`${p.nombre} ${p.id} ${p.comunas||""}`).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [ranking, search, macro, escala]);

  useEffect(() => {
    window.EVA_ACTIVE_RANK_FILTER = { filtered, escala, macro, search };
  }, [filtered, escala, macro, search]);

  // Modo presupuesto: greedy en orden de score, suma costos hasta llegar a budget
  const budgetSelection = useMemo(() => {
    if (!budget) return null;
    let used = 0;
    const ids = [];
    let pob = 0, dem = 0;
    for (const p of ranking) {
      if (lockedIds.includes(p.id)) continue; // los lockados ya están comprometidos
      if (used + p.costo <= budget) {
        used += p.costo;
        ids.push(p.id);
        pob += p.poblacion || 0;
        dem += p.demandaHabilitada || 0;
      }
    }
    return { ids: new Set(ids), used, pob, dem };
  }, [budget, ranking, lockedIds]);

  const totalCostoCartera = useMemo(() =>
    ranking.reduce((a, p) => a + (p.costo || 0), 0), [ranking]);

  const criterios = [
    { k: "poblacion", label: "Población marginal" },
    { k: "costoOD", label: "Reducción costo OD" },
    { k: "oportunidades", label: "Hexes beneficiados" },
    { k: "equidad", label: "Equidad territorial" },
    { k: "prioridadGore", label: "Prioridad inversión GORE" },
    { k: "continuidad", label: "Continuidad / interconexión" },
    { k: "demanda", label: "Demanda OD habilitada" },
    { k: "ciclistas", label: "Ciclistas inducidos (logit)" },
    { k: "fractal", label: "Conectividad fractal (Alameda)" },
    { k: "estudiantes", label: "Generación estudiantil" },
    { k: "seguridad", label: "Siniestralidad prevenible" },
    { k: "intermodal", label: "Intermodalidad bici-metro" },
    { k: "parques", label: "Atractor de parques" },
    { k: "factibilidad", label: "Factibilidad (ancho de v\u00eda)" },
    { k: "costoInv", label: "Eficiencia económica" },
  ];

  return (
    <>
      <Section
        title="Escenario de ponderación"
        infoKey="sec_escenarios"
        desc="Configuraciones predefinidas de pesos. Al elegir uno se cargan sus ponderaciones; si ajustas un peso manualmente, el escenario pasa a «personalizado»."
      >
        <select
          className="select"
          value={scenarioKey || "personalizado"}
          onChange={e => onScenario && onScenario(e.target.value)}
        >
          <option value="personalizado">Personalizado</option>
          {(window.EVA_SCENARIOS || []).map(s => (
            <option key={s.key} value={s.key}>{s.nombre}</option>
          ))}
        </select>
        {scenarioKey && window.EVA_SCENARIO_MAP[scenarioKey] && (
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.5 }}>
            {window.EVA_SCENARIO_MAP[scenarioKey].desc}
            {window.EVA_SCENARIO_MAP[scenarioKey].sinDatos && (
              <div className="assumption" style={{ margin: "8px 0 0" }}>
                <b>Sin datos de seguridad:</b> este escenario aún no incorpora siniestralidad real; aproxima con población y continuidad.
              </div>
            )}
          </div>
        )}
      </Section>

      <Section
        title="Ponderaciones multicriterio"
        infoKey="sec_score"
        meta={`Σ ${total}`}
        desc="P_p = Σ w_i · indicador_i. Ajusta para ver el ranking recalcularse en vivo."
      >
        {criterios.map(c => (
          <SliderField
            key={c.k}
            infoKey={"crit_" + c.k}
            label={c.label}
            value={weights[c.k]}
            min={0} max={50} step={1}
            onChange={v => onWeightChange(c.k, v)}
          />
        ))}
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <div className="field-label" style={{ marginBottom: 6 }}>
            <span>Siniestralidad considerada<InfoButton k="seg_modo" /></span>
            <span style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>seguridad vial</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className={"hdr-btn" + (!(params && params.segKSI) ? " primary" : "")}
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => onParamChange && onParamChange("segKSI", false)}
            >Todos</button>
            <button
              className={"hdr-btn" + ((params && params.segKSI) ? " primary" : "")}
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => onParamChange && onParamChange("segKSI", true)}
            >Solo fatales + graves</button>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.45 }}>
            Cada siniestro se pondera por severidad × <b>tratabilidad</b> (cuánto lo evita una ciclovía segregada) × cercanía a la traza. KSI restringe a corredores con fallecidos o lesionados graves.
          </div>
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <div className="field-label" style={{ marginBottom: 6 }}>
            <span>Monumentos nacionales<InfoButton k="crit_monumentos" /></span>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: (weights.monumentos||0) < 0 ? "var(--bad)" : (weights.monumentos||0) > 0 ? "var(--good)" : "var(--ink-3)" }}>
              {(weights.monumentos||0) > 0 ? "+" + (weights.monumentos||0) : (weights.monumentos||0)}
            </span>
          </div>
          <input type="range" min={-50} max={50} step={1} value={weights.monumentos||0}
            onChange={e => onWeightChange("monumentos", +e.target.value)}
            style={{ width: "100%", accentColor: (weights.monumentos||0) < 0 ? "#c0392b" : (weights.monumentos||0) > 0 ? "#1e8a5b" : "#9aa0a8" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>
            <span>← Evitar</span><span>Neutro</span><span>Conectar →</span>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.45 }}>
            Dato de contexto patrimonial. <b>Neutro (0)</b> no afecta el ranking; negativo penaliza proyectos cercanos a monumentos, positivo los favorece (asociación ≤300 m de la traza).
          </div>
        </div>
      </Section>

      <Section
        title="Priorización secuencial"
        infoKey="sec_secuencial"
        desc="Cada proyecto incorporado se suma a la red base y el resto se reevalúa contra esa nueva condición."
        action={
          <button className={"hdr-btn"} onClick={() => lockedIds.forEach(id => onUnlock(id))}>
            <Ico name="refresh" /> Reset
          </button>
        }
      >
        <button
          className="run-btn"
          style={{ background: "var(--primary-deep)", marginBottom: 8 }}
          onClick={() => !solving && onSolveFull && onSolveFull()}
          disabled={solving}
        >
          <Ico name="zap" className="ico" style={{ stroke: "white" }} /> {solving ? "Calculando… (ver terminal)" : (solveResult ? "Recalcular orden óptimo" : "Calcular orden óptimo completo")}
        </button>
        {solveStale && (
          <div className="assumption" style={{ margin: "0 0 8px", background: "oklch(0.96 0.06 30)", borderColor: "oklch(0.8 0.12 30)", borderLeftColor: "oklch(0.6 0.18 30)", color: "oklch(0.4 0.12 30)" }}>
            <b>⚠ Priorización desactualizada:</b> la priorización secuencial fue calculada con una configuración anterior (parámetros, pesos o escenario cambiaron). Recalcule para exportar resultados consistentes.
          </div>
        )}
        <button
          className={"run-btn" + (running ? " stop" : "")}
          onClick={onRunSequential}
        >
          {running
            ? <><Ico name="pause" className="ico" style={{ stroke: "white" }} /> Pausar simulación</>
            : <><Ico name="play" className="ico" style={{ stroke: "white", fill: "white" }} /> Simular paso a paso</>
          }
          <span className="iter">{lockedIds.length} / {ranking.length}</span>
        </button>
        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.5 }}>
          <b>Orden óptimo</b>: resuelve las {ranking.length} iteraciones de golpe (greedy secuencial). <b>Paso a paso</b>: anima la incorporación una a una.
        </div>
        {solveResult && solveResult.order && solveResult.order.length > 0 && (
          <div style={{ background: "var(--primary-soft)", padding: "10px 12px", borderRadius: "var(--r-sm)", marginTop: 10 }}>
            <div style={{ fontSize: 10, color: "var(--primary-deep)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600, marginBottom: 6 }}>
              Orden de construcción calculado
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11.5 }}>
              <div>
                <div style={{ color: "var(--ink-3)", fontSize: 10 }}>Proyectos</div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--primary-deep)", fontSize: 15 }}>{solveResult.order.length}</div>
              </div>
              <div>
                <div style={{ color: "var(--ink-3)", fontSize: 10 }}>Inversión total</div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--primary-deep)", fontSize: 15 }}>${fmtN(solveResult.totalBudget)} M</div>
              </div>
              <div>
                <div style={{ color: "var(--ink-3)", fontSize: 10 }}>Pob. marginal total</div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--primary-deep)", fontSize: 14 }}>{fmtMM(solveResult.totalPob)}</div>
              </div>
              <div>
                <div style={{ color: "var(--ink-3)", fontSize: 10 }}>Demanda habilitada</div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--primary-deep)", fontSize: 14 }}>{fmtMM(solveResult.totalDemHab)}</div>
              </div>
            </div>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.45 }}>
              El ranking abajo refleja el orden óptimo. El n.º indica la posición en la secuencia de construcción.
            </div>
          </div>
        )}
      </Section>

      <Section
        title="Modo presupuesto"
        meta={budget > 0 ? `$${fmtN(budget)} M` : "sin filtro"}
        desc="Selecciona automáticamente los proyectos del ranking que caben en un presupuesto."
        action={budget > 0 && (
          <button className="hdr-btn" onClick={() => setBudget(0)}>
            <Ico name="refresh" /> Limpiar
          </button>
        )}
      >
        <SliderField
          infoKey="um_costoPorKm"
          label="Costo por kilómetro"
          value={params ? (params.costoPorKm || 100) : 100}
          min={1}
          max={5000}
          step={1}
          unit=" M/km"
          onChange={v => onParamChange && onParamChange("costoPorKm", v)}
        />
        <div style={{ fontSize: 10.5, color: "var(--ink-3)", margin: "-4px 0 12px", fontFamily: "var(--font-mono)" }}>
          Costo total = longitud × {fmtN(params ? (params.costoPorKm || 100) : 100)} M/km · cartera completa ≈ ${fmtN(totalCostoCartera)} M
        </div>
        <SliderField
          infoKey="um_presupuesto"
          label="Presupuesto disponible"
          value={budget}
          min={0}
          max={Math.ceil(totalCostoCartera / 1000) * 1000}
          step={500}
          unit=" M"
          onChange={setBudget}
        />
        {budgetSelection && budgetSelection.ids.size > 0 && (
          <div style={{ background: "var(--primary-soft)", padding: "10px 12px", borderRadius: "var(--r-sm)", marginTop: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11.5 }}>
              <div>
                <div style={{ color: "var(--ink-3)", fontSize: 10 }}>Proyectos</div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--primary-deep)", fontSize: 16 }}>{budgetSelection.ids.size}</div>
              </div>
              <div>
                <div style={{ color: "var(--ink-3)", fontSize: 10 }}>Presupuesto usado</div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--primary-deep)", fontSize: 16 }}>${fmtN(budgetSelection.used)} M</div>
              </div>
              <div>
                <div style={{ color: "var(--ink-3)", fontSize: 10 }}>Pob. marginal</div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--primary-deep)", fontSize: 14 }}>{fmtMM(budgetSelection.pob)}</div>
              </div>
              <div>
                <div style={{ color: "var(--ink-3)", fontSize: 10 }}>Demanda habilitada</div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--primary-deep)", fontSize: 14 }}>{fmtMM(budgetSelection.dem)} v/d</div>
              </div>
            </div>
            <button
              className="hdr-btn primary"
              style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
              onClick={() => budgetSelection.ids.forEach(id => onLock(id))}
            >
              <Ico name="check" /> Priorizar estos {budgetSelection.ids.size} proyectos
            </button>
          </div>
        )}
      </Section>

      <div style={{ background: "var(--bg-0)", borderBottom: "1px solid var(--line)", padding: "10px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div className="section-title">Ranking activo</div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{filtered.length} / {ranking.length}</div>
        </div>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", pointerEvents: "none" }}>
            <Ico name="search" className="ico" />
          </span>
          <input
            className="input"
            style={{ paddingLeft: 28 }}
            placeholder="Buscar por nombre, código o comuna…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
          {window.MACROZONAS.map(m => (
            <button
              key={m}
              onClick={() => setMacro(m)}
              className="tag"
              style={{
                cursor: "pointer",
                background: macro === m ? "var(--primary-soft)" : "var(--bg-1)",
                color: macro === m ? "var(--primary-deep)" : "var(--ink-2)",
                borderColor: macro === m ? "var(--primary)" : "var(--line)",
                fontWeight: macro === m ? 600 : 500,
              }}
            >{m}</button>
          ))}
        </div>
        <select className="select" value={escala} onChange={e => setEscala(e.target.value)} style={{ fontSize: 11.5 }}>
          {window.ESCALAS.map(e => <option key={e} value={e}>Escala: {e}</option>)}
        </select>
      </div>

      <div className="rank-list">
        {filtered.length === 0 && (
          <div className="empty" style={{ padding: 32 }}>
            <div className="empty-title">Sin resultados</div>
            <div className="empty-hint">Ajusta búsqueda o filtros.</div>
          </div>
        )}
        {filtered.map(p => {
          const locked = lockedIds.includes(p.id);
          const inBudget = budgetSelection && budgetSelection.ids.has(p.id);
          const pos = p.rank;
          return (
            <div
              key={p.id}
              className={"rank-item" + (selected === p.id ? " selected" : "") + (locked ? " locked" : "") + (inBudget ? " in-budget" : "")}
              onClick={() => onSelect(p.id)}
              onMouseEnter={() => onHover(p.id)}
              onMouseLeave={() => onHover(null)}
            >
              <div className="rank-pos">
                {locked
                  ? <Ico name="check" className="ico" style={{ stroke: "var(--good)", strokeWidth: 2.5 }} />
                  : <span className="num">{pos.toString().padStart(3, "0")}</span>}
              </div>
              <div className="rank-body">
                <div className="rank-name">{p.nombre}</div>
                <div className="rank-sub">
                  <span>{p.id}</span>
                  <span>·</span>
                  <span>{p.escala}</span>
                  <span>·</span>
                  <span><b>{fmtN(p.poblacion)}</b> pers.</span>
                  <span>·</span>
                  <span>{(+p.km).toFixed(2)} km</span>
                </div>
                <div className="rank-bar"><div style={{ width: (p.score * 100).toFixed(0) + "%" }}></div></div>
              </div>
              <div className="rank-score">
                {p.score.toFixed(2)}
                <span className="delta">+{fmtMM(p.poblacion)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ===================== Ficha proyecto ===================== */
function FichaTab({ selected, ranking, onSelect, onLock, lockedIds, weights }) {
  if (!selected) {
    return (
      <div className="empty" style={{ paddingTop: 56 }}>
        <div className="empty-icon"><Ico name="bike" className="ico" /></div>
        <div className="empty-title">Selecciona un proyecto</div>
        <div className="empty-hint">Haz clic sobre una ciclovía proyectada en el mapa, o sobre una fila del ranking, para ver su ficha técnica.</div>
      </div>
    );
  }
  const p = ranking.find(r => r.id === selected);
  if (!p) return null;
  const locked = lockedIds.includes(p.id);

  // contributing factors
  const contribs = [
    { k: "Población", v: p.norm.poblacion },
    { k: "Reducción costo OD", v: p.norm.costoOD },
    { k: "Oportunidades", v: p.norm.oportunidades },
    { k: "Equidad", v: p.norm.equidad },
    { k: "Prioridad GORE", v: p.norm.prioridadGore != null ? p.norm.prioridadGore : 0.5 },
    { k: "Continuidad", v: p.norm.continuidad },
    { k: "Demanda", v: p.norm.demanda },
    { k: "Seguridad vial", v: p.norm.seguridad != null ? p.norm.seguridad : 0 },
    { k: "Intermodalidad", v: p.norm.intermodal != null ? p.norm.intermodal : 0 },
    { k: "Parques", v: p.norm.parques != null ? p.norm.parques : 0 },
    { k: "Factibilidad", v: p.norm.factibilidad != null ? p.norm.factibilidad : 0 },
    { k: "Eficiencia", v: p.norm.costoInv },
  ].sort((a, b) => b.v - a.v);

  return (
    <>
      <div className="ficha-header">
        <div className="ficha-eyebrow">
          <span>Proyecto {p.escala}</span><span className="ficha-id">· {p.id}</span>
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", color: "var(--primary-deep)" }}>#{p.rank}</span>
          <button
            className="ficha-deselect"
            onClick={() => onSelect && onSelect(null)}
            title="Deseleccionar ciclovía"
            aria-label="Deseleccionar ciclovía"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
          </button>
        </div>
        <div className="ficha-name">{p.nombre}</div>
        <div className="ficha-locale">{p.comunas || p.macrozona || "—"}</div>
        <div className="tag-list" style={{ marginTop: 10 }}>
          {p.categoria === "Otras carteras"
            ? <span className="tag" style={{ background: "oklch(0.95 0.04 300)", color: "#6b4ea8", borderColor: "oklch(0.85 0.06 300)" }}>Otras carteras · {p.cartera || "s/i"}</span>
            : <span className="tag">{p.macrozona}</span>}
          <span className="tag">{(+p.km).toFixed(2)} km</span>
          {p.n_priori != null && <span className="tag">Prioridad GORE #{p.n_priori}</span>}
          {p.anteproyec && <span className={"tag " + (p.anteproyec === "APROBADO" ? "good" : p.anteproyec.includes("RECHAZ") ? "" : "warn")} style={p.anteproyec.includes("RECHAZ") ? { background: "oklch(0.96 0.04 25)", color: "var(--bad)", borderColor: "oklch(0.85 0.08 25)" } : undefined}>{p.anteproyec}</span>}
          {locked && <span className="tag good">✓ Priorizado</span>}
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric">
          <div className="metric-k">Población marginal</div>
          <div className="metric-v">{fmtN(p.poblacion)}</div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>{p.poblacion > 0 ? "gana acceso a red" : (p.poblacionAlcance > 0 ? "corredor ya cubierto — ver interconexión" : "gana acceso a red")}</div>
        </div>
        <div className="metric">
          <div className="metric-k">Pob. beneficiada OD</div>
          <div className="metric-v" style={{ color: "var(--good)" }}>{fmtN(p.pobBeneficiada || 0)}</div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>viajes nuevos viables (incl. interconexión)</div>
        </div>
        <div className="metric">
          <div className="metric-k">Demanda habilitada</div>
          <div className="metric-v">{fmtN(p.demandaHabilitada || 0)}<span className="u">viajes/día</span></div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>origen→destino por la misma subred</div>
        </div>
        <div className="metric">
          <div className="metric-k">Ciclistas inducidos (logit)</div>
          <div className="metric-v" style={{ color: "var(--good)" }}>{fmtN(p.ciclistasInducidos || 0)}<span className="u">/día</span></div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>elección modal · {fmtN(p.hexModal || 0)} hex en el corredor</div>
        </div>
        <div className="metric">
          <div className="metric-k">Componentes que une</div>
          <div className="metric-v" style={{ color: p.componentesUnidos >= 2 ? "var(--good)" : "var(--ink-0)" }}>{p.componentesUnidos ?? "—"}</div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>{p.componentesUnidos >= 2 ? "conector de subredes" : p.componentesUnidos === 1 ? "extiende una subred" : "aislado de la red"}</div>
        </div>
        <div className="metric">
          <div className="metric-k">Estudiantes beneficiados</div>
          <div className="metric-v">{fmtN(p.estudiantes || 0)}</div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>{fmtN(p.estudiantesM || 0)} media (proximidad) · {fmtN(p.estudiantesS || 0)} superior→sedes</div>
        </div>
        <div className="metric">
          <div className="metric-k">Costo total*</div>
          <div className="metric-v">${fmtN(p.costo)}<span className="u">M</span></div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>${(p.costo / p.km).toFixed(0)} M/km</div>
        </div>
        <div className="metric">
          <div className="metric-k">Costo/persona beneficiada*</div>
          <div className="metric-v">${(p.poblacion + (p.pobBeneficiada||0)) > 0 ? fmtN((p.costo * 1e6) / (p.poblacion + (p.pobBeneficiada||0))) : "—"}</div>
        </div>
        <div className="metric">
          <div className="metric-k">Equidad territorial</div>
          <div className="metric-v">{(p.equidad*100).toFixed(0)}<span className="u">%</span></div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>en comunas bajo mediana</div>
        </div>
        <div className="metric">
          <div className="metric-k">Siniestralidad en corredor</div>
          <div className="metric-v" style={{ color: (p.siniestros||0) > 0 ? "#b3122b" : "var(--ink-0)" }}>{fmtN(p.siniestros || 0)}</div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>{fmtN(p.siniestrosFall || 0)}F · {fmtN(p.siniestrosGrav || 0)}G · {fmtN(p.siniestrosLeve || 0)}L · {((p.siniestrosPrevPct||0)*100).toFixed(0)}% prevenible (≤100 m)</div>
        </div>
        <div className="metric">
          <div className="metric-k">Monumentos nacionales</div>
          <div className="metric-v" style={{ color: (p.monumentos||0) > 0 ? "#0f7d8c" : "var(--ink-0)" }}>{fmtN(p.monumentos || 0)}</div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>{(p.monumentos||0) > 0 ? `m\u00e1s cercano a ${fmtN(p.monumentosProx||0)} m (\u2264300 m)` : "ninguno a \u2264300 m"}</div>
        </div>
        <div className="metric">
          <div className="metric-k">Ferias libres en el tramo</div>
          <div className="metric-v" style={{ color: (p.ferias||0) > 0 ? "#c2348b" : "var(--ink-0)" }}>{fmtN(p.ferias || 0)}</div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>{(p.ferias||0) > 0 ? `d\u00edas: ${p.feriasDiasAbbr || "\u2014"}` : "ninguna en el tramo"}</div>
        </div>
        <div className="metric">
          <div className="metric-k">Intermodalidad Metro</div>
          <div className="metric-v" style={{ color: (p.metroEstaciones||0) > 0 ? "#d6461e" : "var(--ink-0)" }}>{fmtN(p.metroEstaciones || 0)}</div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>{(p.metroEstaciones||0) > 0 ? `estaci\u00f3n m\u00e1s cercana a ${fmtN(p.metroProx||0)} m (\u2264250 m)` : "no conecta estaciones (\u2264250 m)"}</div>
        </div>
        <div className="metric">
          <div className="metric-k">Parques (atractor)</div>
          <div className="metric-v" style={{ color: (p.parques||0) > 0 ? "#2f8f4e" : "var(--ink-0)" }}>{fmtN(p.parques || 0)}</div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>{(p.parques||0) > 0 ? `${(p.parquesHa||0).toLocaleString("es-CL")} ha conectadas` : "ninguno junto al eje"}</div>
        </div>
        <div className="metric">
          <div className="metric-k">Paraderos de bus</div>
          <div className="metric-v">{fmtN(p.paraderosBus || 0)}</div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>en el eje · indicador de complejidad</div>
        </div>
        <div className="metric">
          <div className="metric-k">Pistas (ancho de vía)</div>
          <div className="metric-v" style={{ color: (p.numPistas||0) >= 3 ? "var(--good)" : "var(--ink-0)" }}>{(p.numPistas||0).toFixed(1)}</div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>{(p.numPistas||0) >= 3 ? "v\u00eda ancha · obra m\u00e1s factible" : (p.numPistas||0) >= 2 ? "v\u00eda media" : "v\u00eda angosta · obra m\u00e1s compleja"}</div>
        </div>
        <div className="metric">
          <div className="metric-k">Pendiente media</div>
          <div className="metric-v" style={{ color: (p.pendMedia||0) > 5 ? "#b3122b" : (p.pendMedia||0) > 3 ? "#c2511c" : "var(--ink-0)" }}>{(p.pendMedia||0).toFixed(1)}<span className="u">%</span></div>
          <div className="metric-trend" style={{ color: "var(--ink-3)" }}>{"máx "}{(p.pendMax||0).toFixed(1)}%{(p.pctLenPend5||0) > 0 ? ` · ${(p.pctLenPend5||0).toFixed(0)}% del eje >5%` : ""}</div>
        </div>
      </div>

      {p.poblacion === 0 && (p.componentesUnidos || 0) >= 2 && (p.pobBeneficiada || 0) > 0 && (
        <div className="assumption" style={{ margin: "0 16px 8px", borderLeft: "3px solid var(--good)", background: "oklch(0.97 0.03 155)", padding: "8px 10px" }}>
          <b>El aporte de este proyecto es de interconexión, no de acceso nuevo.</b> Su corredor ya está cubierto por acceso a la red (por eso la población marginal es 0), pero <b>une {p.componentesUnidos} tramos inconexos</b>: habilita {fmtN(p.demandaHabilitada || 0)} viajes/día origen–destino y beneficia a {fmtN(p.pobBeneficiada || 0)} personas cuyos viajes se vuelven viables al conectar esas subredes.
        </div>
      )}
      {(p.metroEstaciones || 0) > 0 && (p.metroNombres || []).length > 0 && (
        <div className="assumption" style={{ margin: "0 16px 6px", borderLeft: "3px solid #d6461e", background: "oklch(0.97 0.03 40)", padding: "8px 10px" }}>
          <b>Hotspot intermodal ({fmtN(p.metroEstaciones)} {(p.metroEstaciones||0) === 1 ? "estación" : "estaciones"} de Metro):</b> {(p.metroNombres || []).join(" · ")}{(p.metroEstaciones || 0) > (p.metroNombres || []).length ? "…" : ""}. Habilita el viaje combinado bici+metro (primer/último kilómetro).
        </div>
      )}
      {(p.monumentos || 0) > 0 && (p.monumentosNombres || []).length > 0 && (
        <div className="assumption" style={{ margin: "0 16px 6px" }}>
          <b>Patrimonio cercano ({fmtN(p.monumentos)}):</b> {(p.monumentosNombres || []).join(" · ")}{(p.monumentos || 0) > (p.monumentosNombres || []).length ? "…" : ""}
        </div>
      )}
      {(p.ferias || 0) > 0 && (p.feriasNombres || []).length > 0 && (
        <div className="assumption" style={{ margin: "0 16px 6px" }}>
          <b>Ferias en el tramo ({fmtN(p.ferias)}{p.feriasDiasAbbr ? `, ${p.feriasDiasAbbr}` : ""}):</b> {(p.feriasNombres || []).join(" · ")}{(p.ferias || 0) > (p.feriasNombres || []).length ? "…" : ""}
        </div>
      )}
      <Section title="Trazabilidad del ranking" infoKey="sec_score" desc="Aporte normalizado por criterio al puntaje multicriterio.">
        <div className="justify-list">
          {contribs.map(c => (
            <div key={c.k} className="justify-row">
              <span className="justify-k">{c.k}</span>
              <div className="justify-bar"><div style={{ width: (c.v * 100).toFixed(0) + "%" }}></div></div>
              <span className="justify-v">{(c.v).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Justificación técnica">
        <p style={{ margin: 0, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.55 }}>
          El proyecto <b style={{ color: "var(--ink-0)" }}>{p.nombre}</b> ({p.escala}, {(+p.km).toFixed(2)} km en {p.macrozona})
          {p.componentesUnidos >= 2
            ? <> actúa como <b style={{ color: "var(--good)" }}>conector de {p.componentesUnidos} subredes inconexas</b>,</>
            : p.componentesUnidos === 1 ? <> extiende una subred existente,</> : <> se emplaza aislado de la red actual,</>}
          {" "}otorga acceso nuevo a <b style={{ color: "var(--ink-0)" }}>{fmtN(p.poblacion)} personas</b> y
          habilita <b style={{ color: "var(--ink-0)" }}>{fmtN(p.demandaHabilitada || 0)} viajes/día</b> que antes no
          podían completarse por red ciclable — beneficiando en total a {fmtN(p.pobBeneficiada || 0)} personas,
          incluidas las ya conectadas cuyo destino se vuelve alcanzable por la fusión de subredes.
          Su puntaje multicriterio se explica en {((contribs[0].v / contribs.reduce((a,c)=>a+c.v,0)) * 100).toFixed(0)}%
          por <b style={{ color: "var(--ink-0)" }}>{contribs[0].k.toLowerCase()}</b>.
        </p>
        <div className="assumption" style={{ margin: "10px 0 0" }}>
          <b>Cálculo:</b> motor v{window.EVA_VERSION ? window.EVA_VERSION.ENGINE_VERSION : "3"} por componentes conexos sobre {window.populationFC.features.length} hexes OD,
          {" "}{window.EXISTING_COUNT} ejes SECTRA y {window.NET_COMPONENTS_COUNT || "—"} subredes. Costo total
          se mantiene como estimación por km hasta integrar el detalle financiero.
        </div>
      </Section>

      {(() => {
        const exp = window.evaExplainScore ? window.evaExplainScore(p, weights || window.DEFAULT_WEIGHTS, ranking) : null;
        if (!exp) return null;
        return (
          <Section title="Explicación del resultado" infoKey="sec_score" desc="Lectura legible y exportable de por qué el proyecto ocupa esta posición.">
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--ink-1)", lineHeight: 1.55 }}>{exp.explicacion}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {exp.fortalezas.length > 0 && (
                <div style={{ flex: "1 1 45%", minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--good)", marginBottom: 4 }}>Fortalezas</div>
                  {exp.fortalezas.map(f => <div key={f} style={{ fontSize: 11.5, color: "var(--ink-2)" }}>· {f}</div>)}
                </div>
              )}
              {exp.debilidades.length > 0 && (
                <div style={{ flex: "1 1 45%", minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--bad)", marginBottom: 4 }}>Debilidades</div>
                  {exp.debilidades.map(d => <div key={d} style={{ fontSize: 11.5, color: "var(--ink-2)" }}>· {d}</div>)}
                </div>
              )}
            </div>
            {exp.depende_de_un_criterio && (
              <div className="assumption" style={{ margin: "10px 0 0" }}>
                <b>Sensibilidad:</b> la posición de este proyecto depende fuertemente de un solo criterio. Cambiar su peso puede alterar significativamente su ranking.
              </div>
            )}
          </Section>
        );
      })()}

      <Section title="Acciones">
        <button
          className="hdr-btn"
          style={{
            width: "100%", justifyContent: "center", marginBottom: 6, padding: "10px 12px",
            background: "linear-gradient(135deg, #2f74ff, #12a5b8)", color: "white",
            border: "none", boxShadow: "0 5px 16px rgba(47,116,255,.3)", fontWeight: 600,
          }}
          onClick={() => window.EVA_FLYOVER && window.EVA_FLYOVER(p.id)}
          title="Sobrevuelo cinematográfico del trazado + Google Earth 3D"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flex: "none" }}><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.6 2.6 4 5.7 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.7-4-9s1.4-6.4 4-9z"></path></svg>
          {" "}Vuelo de pájaro 3D
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="hdr-btn primary"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={() => onLock(p.id)}
            disabled={locked}
          >
            <Ico name="check" /> {locked ? "Ya priorizado" : "Incorporar a red base"}
          </button>
          <button className="hdr-btn" onClick={() => window.EVA_FICHA_PDF && window.EVA_FICHA_PDF(p.id)}><Ico name="download" /> Ficha PDF</button>
        </div>
      </Section>
    </>
  );
}

/* ===================== Demanda (Fase 4) ===================== */
function DemandaTab({ ranking }) {
  const totalDem = ranking.reduce((a, p) => a + p.demanda, 0);
  const totalHab = ranking.reduce((a, p) => a + (p.demandaHabilitada || 0), 0);
  const topLogit = [...ranking].sort((a, b) => (b.ciclistasInducidos || 0) - (a.ciclistasInducidos || 0)).slice(0, 6);
  return (
    <>
      <Section title="Ciclistas inducidos — modelo de elección modal" infoKey="mod_logit" desc="Logit binario bici vs. no-bici estimado sobre 117.072 manzanas censales (Biogeme, «ciclo_todo_chile 41»). Cada proyecto aumenta los km de ciclovía a 500 m de los hexes de su corredor → sube P(bici) → ciclistas nuevos = ocupados × ΔP.">
        <div className="metric-grid" style={{ marginLeft: -16, marginRight: -16 }}>
          <div className="metric"><div className="metric-k">Ciclistas/día · red actual</div><div className="metric-v">{fmtN(window.CICLISTAS_BASE || 0)}</div></div>
          <div className="metric"><div className="metric-k">P̄(bici) regional</div><div className="metric-v">{((window.PBICI_MEDIA || 0) * 100).toFixed(2)}%</div></div>
          <div className="metric"><div className="metric-k">Δ escenario priorizado</div><div className="metric-v" style={{ color: "var(--good)" }}>+{fmtN(window.CICLISTAS_DELTA || 0)}</div></div>
          <div className="metric"><div className="metric-k">Share observado (muestra)</div><div className="metric-v">4.03%</div></div>
        </div>
        <div style={{ marginTop: 10 }}>
          {topLogit.map((p, i) => (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "20px 1fr 60px", gap: 8, padding: "6px 0", fontSize: 12, borderBottom: "1px solid var(--bg-2)" }}>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-3)" }}>{(i + 1).toString().padStart(2, "0")}</span>
              <span style={{ color: "var(--ink-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</span>
              <span style={{ fontFamily: "var(--font-mono)", textAlign: "right", fontWeight: 600, color: "var(--good)" }}>+{fmtN(p.ciclistasInducidos || 0)}</span>
            </div>
          ))}
        </div>
        <div className="assumption" style={{ margin: "10px 0 0" }}>
          <b>Transferencia de modelo:</b> coeficientes estimados a nivel nacional aplicados al contexto RM (ciudad grande, valle central). Distancia OD y km de ciclovía se recalculan por hex; escolaridad (13.0 años) y desnivel (40.5 m) son constantes de calibración editables en Tweaks.
        </div>
      </Section>

      <Section title="Demanda OD potencial habilitada" infoKey="crit_demanda" desc="Viajes OD laborales (censo 2024) que pasan de inviables a viables por red ciclable con cada proyecto. Es demanda POTENCIAL habilitada, no uso efectivo: no hay modelo de elección modal ni viajes observados.">
        <div className="metric-grid" style={{ marginLeft: -16, marginRight: -16 }}>
          <div className="metric"><div className="metric-k">OD habilitada (cartera)</div><div className="metric-v">{fmtN(totalHab)}<span className="u">v/d</span></div></div>
          <div className="metric"><div className="metric-k">OD total en hexes con proyecto</div><div className="metric-v">{fmtN(totalDem)}<span className="u">v/d</span></div></div>
          <div className="metric"><div className="metric-k">OD regional total</div><div className="metric-v">{fmtN(window.OD_TOTAL_FLOW || 0)}<span className="u">v/d</span></div></div>
          <div className="metric"><div className="metric-k">% OD habilitable</div><div className="metric-v">{window.OD_TOTAL_FLOW ? (totalHab / window.OD_TOTAL_FLOW * 100).toFixed(1) : "—"}%</div></div>
        </div>
        <div className="assumption" style={{ margin: "10px 0 0" }}>
          <b>Potencial, no efectivo:</b> estas cifras son viajes <i>habilitados</i> por la infraestructura (origen y destino conectables por la misma subred). La conversión a viajes ciclistas efectivos se estima con el modelo de elección modal de la sección anterior.
        </div>
      </Section>

      <Section title="Top tramos por OD habilitada">
        {[...ranking].sort((a,b) => (b.demandaHabilitada||0) - (a.demandaHabilitada||0)).slice(0, 6).map((p, i) => (
          <div key={p.id} style={{ display: "grid", gridTemplateColumns: "20px 1fr 60px", gap: 8, padding: "6px 0", fontSize: 12, borderBottom: "1px solid var(--bg-2)" }}>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-3)" }}>{(i+1).toString().padStart(2,"0")}</span>
            <span style={{ color: "var(--ink-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nombre}</span>
            <span style={{ fontFamily: "var(--font-mono)", textAlign: "right", fontWeight: 600, color: "var(--ink-0)" }}>{fmtN(p.demandaHabilitada || 0)}</span>
          </div>
        ))}
      </Section>

      <div className="assumption">
        <b>Demanda potencial habilitada vs. inducida.</b> La OD habilitada proviene del vector laboral del censo 2024 (viajes que pasan a ser viables); los ciclistas inducidos aplican el logit estimado (β_ciclo = +0.13 por km en 500 m, t = 13.7) para estimar cuántos ocupados cambian efectivamente a bici. Ninguna incluye motivos estudio, compras ni salud.
      </div>
    </>
  );
}

/* ===================== Análisis (Sensibilidad + Carteras) ===================== */
function AnalisisTab({ weights, solveResult, lockedIds, onSelect }) {
  const [sens, setSens] = useState(null);
  const [sensP, setSensP] = useState(null);
  const [carts, setCarts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pProg, setPProg] = useState(null);

  const runSens = () => {
    setBusy(true);
    setTimeout(() => { setSens(window.evaSensitivity(window.PROJECTS, weights)); setBusy(false); }, 30);
  };
  const runSensParam = async () => {
    if (busy) return;
    setBusy(true); setPProg({ done: 0, total: 15 });
    try {
      const res = await window.evaSensitivityParam(window.DEFAULT_PARAMS, weights, (d, t) => setPProg({ done: d, total: t }));
      setSensP(res);
    } finally { setBusy(false); setPProg(null); }
  };
  const runCarts = () => {
    setBusy(true);
    setTimeout(() => { setCarts(window.evaCarteras(window.PROJECTS, weights, solveResult, lockedIds)); setBusy(false); }, 30);
  };

  const claseColor = { robusto: "var(--good)", sensible: "var(--bad)", intermedio: "var(--warn)" };

  return (
    <>
      <Section
        title="Sensibilidad de pesos"
        infoKey="sec_sensibilidad"
        desc="Re-evalúa el ranking bajo los 8 escenarios predefinidos + perturbaciones ±50% de cada peso (no re-corre el motor). Identifica proyectos robustos vs sensibles a la PONDERACIÓN."
        action={<button className="hdr-btn" onClick={runSens}><Ico name="refresh" /> {sens ? "Recalcular" : "Ejecutar"}</button>}
      >
        {!sens && <div className="empty-hint">Pulsa «Ejecutar» para correr el análisis de sensibilidad sobre {(window.PROJECTS || []).length} proyectos.</div>}
        {sens && (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <div className="kpi" style={{ flex: 1, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 4 }}>
                <div className="kpi-k">Escenarios</div><div className="kpi-v">{sens.escenarios}</div>
              </div>
              <div className="kpi" style={{ flex: 1, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 4 }}>
                <div className="kpi-k" style={{ color: "var(--good)" }}>Robustos</div><div className="kpi-v">{sens.robustos.length}</div>
              </div>
              <div className="kpi" style={{ flex: 1, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 4 }}>
                <div className="kpi-k" style={{ color: "var(--bad)" }}>Sensibles</div><div className="kpi-v">{sens.sensibles.length}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "22px 1fr 42px 50px 48px", gap: 6, fontSize: 9.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.04em", padding: "0 0 4px", borderBottom: "1px solid var(--line)" }}>
              <span>#</span><span>Proyecto</span><span style={{ textAlign: "right" }}>Prom</span><span style={{ textAlign: "center" }}>Rango</span><span style={{ textAlign: "right" }}>Top10</span>
            </div>
            {sens.rows.slice(0, 25).map(r => (
              <div key={r.id} onClick={() => onSelect && onSelect(r.id)}
                style={{ display: "grid", gridTemplateColumns: "22px 1fr 42px 50px 48px", gap: 6, alignItems: "center", fontSize: 11.5, padding: "5px 0", borderBottom: "1px solid var(--bg-2)", cursor: "pointer" }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-3)" }}>{r.rankPromedio}</span>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 999, background: claseColor[r.clase], marginRight: 6 }}></span>
                  {r.nombre}
                  {r.depende_de_un_criterio && <span title="Depende de un solo criterio" style={{ color: "var(--warn)", marginLeft: 4 }}>⚠</span>}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", textAlign: "right", fontWeight: 600 }}>{r.promedio}</span>
                <span style={{ fontFamily: "var(--font-mono)", textAlign: "center", color: "var(--ink-3)" }}>{r.mejor}–{r.peor}</span>
                <span style={{ fontFamily: "var(--font-mono)", textAlign: "right", color: r.freq_top10 >= 80 ? "var(--good)" : "var(--ink-2)" }}>{r.freq_top10}%</span>
              </div>
            ))}
            <button className="hdr-btn" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={() => window.exportSensibilidadCSV(sens)}>
              <Ico name="download" /> Exportar sensibilidad (CSV)
            </button>
          </>
        )}
      </Section>

      <Section
        title="Sensibilidad paramétrica (motor)"
        infoKey="sec_sensibilidad"
        desc="Re-corre el MOTOR variando acceso origen/destino (500/700/1000 m), tolerancia de empalme (50/150/300 m), cobertura mínima (20/40/60%) y costo (80/100/150 MCLP/km). 15 corridas; toma ~20–40 s."
        action={<button className="hdr-btn" onClick={runSensParam} disabled={busy}><Ico name="refresh" /> {busy && pProg ? `${pProg.done}/${pProg.total}` : (sensP ? "Recalcular" : "Ejecutar")}</button>}
      >
        {!sensP && !pProg && <div className="empty-hint">Pulsa «Ejecutar» para la sensibilidad paramétrica real (re-corre el motor por cada valor).</div>}
        {pProg && <div className="empty-hint">Corriendo el motor… {pProg.done}/{pProg.total} (ver terminal)</div>}
        {sensP && (
          <>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <div className="kpi" style={{ flex: 1, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 4 }}>
                <div className="kpi-k">Corridas</div><div className="kpi-v">{sensP.corridas}</div>
              </div>
              <div className="kpi" style={{ flex: 1, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 4 }}>
                <div className="kpi-k" style={{ color: "var(--good)" }}>Robustos</div><div className="kpi-v">{sensP.robustos.length}</div>
              </div>
              <div className="kpi" style={{ flex: 1, padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 4 }}>
                <div className="kpi-k" style={{ color: "var(--bad)" }}>Sensibles</div><div className="kpi-v">{sensP.sensibles.length}</div>
              </div>
            </div>
            {sensP.rows.slice(0, 15).map(r => (
              <div key={r.id} onClick={() => onSelect && onSelect(r.id)}
                style={{ display: "grid", gridTemplateColumns: "22px 1fr 42px 50px 48px", gap: 6, alignItems: "center", fontSize: 11.5, padding: "5px 0", borderBottom: "1px solid var(--bg-2)", cursor: "pointer" }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-3)" }}>{r.rankPromedio}</span>
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: 999, background: r.clase === "robusto" ? "var(--good)" : r.clase === "sensible" ? "var(--bad)" : "var(--warn)", marginRight: 6 }}></span>
                  {r.nombre}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", textAlign: "right", fontWeight: 600 }}>{r.promedio}</span>
                <span style={{ fontFamily: "var(--font-mono)", textAlign: "center", color: "var(--ink-3)" }}>{r.mejor}–{r.peor}</span>
                <span style={{ fontFamily: "var(--font-mono)", textAlign: "right", color: r.freq_top10 >= 80 ? "var(--good)" : "var(--ink-2)" }}>{r.freq_top10}%</span>
              </div>
            ))}
            <button className="hdr-btn" style={{ width: "100%", justifyContent: "center", marginTop: 10 }} onClick={() => window.exportSensibilidadCSV(sensP)}>
              <Ico name="download" /> Exportar sensibilidad paramétrica (CSV)
            </button>
          </>
        )}
      </Section>

      <Section
        title="Comparación de carteras"
        infoKey="sec_carteras"
        desc="Compara carteras alternativas. Población y beneficiados se calculan como UNIÓN de hexágonos (sin doble conteo); demanda y matrícula son Σ marginal (cota superior)."
        action={<button className="hdr-btn" onClick={runCarts}><Ico name="refresh" /> {carts ? "Recalcular" : "Ejecutar"}</button>}
      >
        {!carts && <div className="empty-hint">Pulsa «Ejecutar» para comparar carteras (top-N por criterio, secuencial y selección manual).</div>}
        {carts && (
          <>
            {carts.carteras.map(c => (
              <div key={c.nombre} style={{ border: "1px solid var(--line)", borderRadius: 4, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 12.5, color: "var(--ink-0)" }}>{c.nombre}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-3)" }}>{c.n} proyectos · {c.km} km</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px 12px", fontSize: 11 }}>
                  <Kv k="Inversión" v={`$${fmtN(c.inversion_MCLP)} M`} />
                  <Kv k="Comunas destino" v={c.comunas_destino} />
                  <Kv k="Pob. acceso (unión)" v={fmtN(c.pob_acceso_union)} />
                  <Kv k="Pob. benef. (unión)" v={fmtN(c.pob_beneficiada_union)} />
                  <Kv k="Demanda hab. (Σ)" v={fmtN(c.demanda_habilitada_sum)} />
                  <Kv k="Matrícula (Σ)" v={fmtN(c.matricula_sum)} />
                  <Kv k="Equidad prom." v={c.equidad_prom} />
                  <Kv k="Continuidad prom." v={c.continuidad_prom} />
                </div>
              </div>
            ))}
            <button className="hdr-btn" style={{ width: "100%", justifyContent: "center" }} onClick={() => window.exportCarterasCSV(carts)}>
              <Ico name="download" /> Exportar carteras (CSV)
            </button>
          </>
        )}
      </Section>
    </>
  );
}

function Kv({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
      <span style={{ color: "var(--ink-3)" }}>{k}</span>
      <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-0)", fontWeight: 600 }}>{v}</span>
    </div>
  );
}

/* ===================== Exportar (Fase 5) ===================== */
function ExportTab({ ranking, lockedIds, params, weights, solveResult, solveStale, scenarioKey }) {
  // Parámetros y pesos EFECTIVOS de la sesión (no los por defecto): clave para reproducibilidad.
  const liveParams = params || window.DEFAULT_PARAMS;
  const liveWeights = weights || window.DEFAULT_WEIGHTS;

  const dl = (filename, content, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  };

  const prov = () => (window.evaProvenance ? window.evaProvenance(liveParams, liveWeights, { escenario: scenarioKey || null }) : {});

  const exportRankingCSV = () => {
    const cols = ["rank","id","nombre","escala","macrozona","comunas","km",
      "costo_total_MCLP","costo_unitario_MCLP_km",
      "pob_marginal","pob_beneficiada","demanda_OD_total","demanda_OD_habilitada",
      "estudiantes","equidad_0a1","continuidad_0a1","prioridad_GORE_0a1","hexes_beneficiados",
      "componentes_unidos","siniestros_corredor","siniestros_peso","fallecidos_corredor","graves_corredor","leves_corredor","siniestros_prev_pct","monumentos_corredor","monumento_cercano_m","ferias_tramo","ferias_dias","paraderos_bus","metro_estaciones","metro_cercano_m","num_pistas","pend_media_pct","pend_max_pct","parques_conectados","parques_ha","score","priorizado"];
    const rows = [cols.join(",")];
    ranking.forEach(p => {
      const vals = [
        p.rank, p.id,
        `"${(p.nombre || "").replace(/"/g, '""')}"`,
        p.escala || "", p.macrozona || "",
        `"${(p.comunas || "").replace(/"/g, '""')}"`,
        (+p.km).toFixed(2),
        p.costo,
        (liveParams.costoPorKm || 100),
        p.poblacion,
        p.pobBeneficiada || 0,
        p.demanda,
        p.demandaHabilitada || 0,
        p.estudiantes || 0,
        p.equidad.toFixed(3),
        p.continuidad.toFixed(3),
        (p.prioridadGore != null ? p.prioridadGore : 0.5).toFixed(3),
        p.oportunidades,
        p.componentesUnidos || 0,
        p.siniestros || 0,
        p.siniestrosPeso || 0,
        p.siniestrosFall || 0,
        p.siniestrosGrav || 0,
        p.siniestrosLeve || 0,
        (p.siniestrosPrevPct || 0).toFixed(3),
        p.monumentos || 0,
        p.monumentosProx == null ? "" : p.monumentosProx,
        p.ferias || 0,
        (p.feriasDias || []).join("|"),
        p.paraderosBus || 0,
        p.metroEstaciones || 0,
        p.metroProx == null ? "" : p.metroProx,
        (p.numPistas || 0).toFixed(2),
        (p.pendMedia || 0).toFixed(2),
        (p.pendMax || 0).toFixed(2),
        p.parques || 0,
        (p.parquesHa || 0).toFixed(1),
        (p.score || 0).toFixed(4),
        lockedIds.includes(p.id) ? "SI" : "NO",
      ];
      rows.push(vals.join(","));
    });
    // cabecera de procedencia como comentarios CSV
    const head = Object.entries(prov()).map(([k, v]) => `# ${k}: ${v}`).join("\n");
    dl(`EVA_ranking_${dateStamp()}.csv`, "\uFEFF" + head + "\n" + rows.join("\n"), "text/csv;charset=utf-8");
  };

  const exportCarteraGeoJSON = () => {
    const fc = {
      type: "FeatureCollection",
      name: "EVA_cartera_priorizada",
      _provenance: prov(),
      features: ranking.map(p => {
        const orig = window.projectsFC.features.find(f => f.properties.id === p.id);
        const exp = window.evaExplainScore ? window.evaExplainScore(p, liveWeights, ranking) : null;
        return {
          type: "Feature",
          geometry: orig ? orig.geometry : null,
          properties: {
            rank: p.rank, id: p.id, nombre: p.nombre,
            escala: p.escala, macrozona: p.macrozona, comunas: p.comunas,
            km: +p.km,
            costo_total_MCLP: p.costo,
            costo_unitario_MCLP_km: liveParams.costoPorKm || 100,
            pob_marginal: p.poblacion,
            pob_beneficiada: p.pobBeneficiada || 0,
            demanda_OD_total: p.demanda,
            demanda_OD_habilitada: p.demandaHabilitada || 0,
            estudiantes: p.estudiantes || 0,
            equidad: p.equidad,
            continuidad: p.continuidad,
            prioridad_GORE: p.prioridadGore != null ? p.prioridadGore : 0.5,
            hexes_beneficiados: p.oportunidades,
            componentes_unidos: p.componentesUnidos || 0,
            siniestros_corredor: p.siniestros || 0,
            siniestros_peso: p.siniestrosPeso || 0,
            fallecidos_corredor: p.siniestrosFall || 0,
            graves_corredor: p.siniestrosGrav || 0,
            leves_corredor: p.siniestrosLeve || 0,
            siniestros_prev_pct: +(p.siniestrosPrevPct || 0).toFixed(3),
            monumentos_corredor: p.monumentos || 0,
            monumento_cercano_m: p.monumentosProx == null ? null : p.monumentosProx,
            ferias_tramo: p.ferias || 0,
            ferias_dias: (p.feriasDias || []).join("|"),
            paraderos_bus: p.paraderosBus || 0,
            metro_estaciones: p.metroEstaciones || 0,
            metro_cercano_m: p.metroProx == null ? null : p.metroProx,
            num_pistas: +(p.numPistas || 0).toFixed(2),
            pend_media_pct: +(p.pendMedia || 0).toFixed(2),
            pend_max_pct: +(p.pendMax || 0).toFixed(2),
            parques_conectados: p.parques || 0,
            parques_ha: +(p.parquesHa || 0).toFixed(1),
            score: +(p.score || 0).toFixed(4),
            priorizado: lockedIds.includes(p.id) ? 1 : 0,
            explicacion: exp ? exp.explicacion : "",
          }
        };
      }).filter(f => f.geometry)
    };
    dl(`EVA_cartera_priorizada_${dateStamp()}.geojson`, JSON.stringify(fc, null, 2), "application/geo+json");
  };

  const exportPoblacionGeoJSON = () => {
    const fc = {
      type: "FeatureCollection",
      name: "EVA_poblacion_OD",
      _provenance: prov(),
      features: window.populationFC.features.map(f => ({
        type: "Feature",
        geometry: f.geometry,
        properties: { ...f.properties }
      }))
    };
    dl(`EVA_poblacion_OD_${dateStamp()}.geojson`, JSON.stringify(fc), "application/geo+json");
  };

  // SESIÓN COMPLETA Y REPRODUCIBLE — params/weights EFECTIVOS + versiones + hashes + bruto/normalizado
  const exportSesionJSON = () => {
    const qa = window.EVA_QA ? window.EVA_QA() : null;
    const payload = {
      _provenance: prov(),
      escenario: scenarioKey || "personalizado",
      formula_continuidad: (window.EVA_VERSION && window.EVA_VERSION.CONTINUITY_FORMULA) || "min(1, K_p / 4)",
      prueba_doble_conteo: window.EVA_TEST_DOUBLE_COUNTING ? window.EVA_TEST_DOUBLE_COUNTING() : null,
      estado_qa: qa ? qa.resumen.estado : "no disponible",
      qa: qa,
      priorizacion_secuencial_desactualizada: !!solveStale,
      parametros_efectivos: liveParams,
      parametros_por_defecto: window.DEFAULT_PARAMS,
      pesos_efectivos: liveWeights,
      pesos_por_defecto: window.DEFAULT_WEIGHTS,
      parametros_activos_en_motor: ["distOrigen", "distDestino", "connectTol", "habThreshold", "costoPorKm", "segKSI"],
      parametros_en_desarrollo: ["porcProtegido", "aproxFinal", "tiempoMax", "perfilUsuario", "velocidadReferencia"],
      proyectos_priorizados: lockedIds,
      priorizacion_secuencial: solveResult ? {
        orden: solveResult.order,
        pob_marginal_total: solveResult.totalPob,
        demanda_habilitada_total: solveResult.totalDemHab,
        inversion_total_MCLP: solveResult.totalBudget,
      } : null,
      kpis: {
        pob_total: window.TOTAL_POB,
        pob_base: window.POB_BASE,
        pob_base_original: window.POB_BASE_ORIG,
        ejes_existentes: window.EXISTING_COUNT,
        km_existentes: window.EXISTING_KM,
        viajes_OD_total: window.OD_TOTAL_FLOW,
        componentes_red: window.NET_COMPONENTS_COUNT,
      },
      cobertura_actual_por_comuna: window.COVERAGE_BY_COMUNA,
      advertencias_metodologicas: [
        "Distancia de acceso modelada como euclidiana (no por red caminable/ciclable).",
        "Destino OD resuelto a nivel comunal (no desagregado por equipamiento).",
        "Costo total = longitud × costo unitario; no incorpora ingeniería de detalle.",
        "Demanda = viajes OD habilitados, no usuarios esperados (no hay modelo de elección modal).",
        "Estudiantes considerados como generación de viajes potencial; sin destino OD asignado.",
        "Siniestralidad: el criterio de seguridad vial pondera los siniestros ciclistas (CONASET 2020–2024) del corredor (≤100 m) por severidad × tratabilidad (cuánto los mitiga una ciclovía segregada) × cercanía a la traza; es un proxy de peligrosidad PREVENIBLE observada, no una predicción del efecto causal de la obra. La tratabilidad y el modo KSI son reglas expertas, no calibradas con estudios antes-después.",
      ],
      ranking: ranking.map(p => ({
        rank: p.rank, id: p.id, nombre: p.nombre,
        score: +(p.score || 0).toFixed(4),
        bruto: {
          poblacion: p.poblacion, pobBeneficiada: p.pobBeneficiada || 0,
          costoOD: p.costoOD, oportunidades: p.oportunidades,
          equidad: p.equidad, continuidad: p.continuidad,
          demanda: p.demanda, demandaHabilitada: p.demandaHabilitada || 0,
          estudiantes: p.estudiantes || 0, prioridadGore: p.prioridadGore,
          siniestros: p.siniestros || 0, siniestrosPeso: p.siniestrosPeso || 0,
          fallecidosCorredor: p.siniestrosFall || 0, gravesCorredor: p.siniestrosGrav || 0,
          levesCorredor: p.siniestrosLeve || 0, prevPct: p.siniestrosPrevPct || 0,
          monumentos: p.monumentos || 0, monumentoCercanoM: p.monumentosProx,
          ferias: p.ferias || 0, feriasDias: p.feriasDias || [],
          paraderosBus: p.paraderosBus || 0, metroEstaciones: p.metroEstaciones || 0, metroCercanoM: p.metroProx,
          numPistas: p.numPistas || 0, pendMedia: p.pendMedia || 0, pendMax: p.pendMax || 0,
          parques: p.parques || 0, parquesHa: p.parquesHa || 0,
          costo_total_MCLP: p.costo, km: +p.km, componentesUnidos: p.componentesUnidos || 0,
        },
        normalizado: p.norm || {},
        explicacion: window.evaExplainScore ? window.evaExplainScore(p, liveWeights, ranking) : null,
        priorizado: lockedIds.includes(p.id),
      })),
    };
    dl(`EVA_sesion_${dateStamp()}.json`, JSON.stringify(payload, null, 2), "application/json");
  };

  // PRIORIZACIÓN SECUENCIAL — orden de construcción recomendado (CSV)
  const exportSecuencialCSV = () => {
    if (!solveResult || !solveResult.order || !solveResult.order.length) {
      window.evaLog && window.evaLog("warn", "[export] No hay priorización secuencial: ejecuta 'Calcular orden óptimo completo' primero.");
      alert("Primero ejecuta «Calcular orden óptimo completo» en la pestaña Ranking.");
      return;
    }
    if (solveStale) {
      const cont = confirm("⚠ La priorización secuencial fue calculada con una configuración anterior (parámetros/pesos/escenario cambiaron).\n\nRecomendado: recalcular en la pestaña Ranking antes de exportar.\n\n¿Exportar de todas formas el resultado desactualizado?");
      if (!cont) return;
    }
    const cols = ["paso","id","nombre","comunas","km","costo_total_MCLP","score","pob_marginal","pob_beneficiada","demanda_OD_habilitada","componentes_unidos","pob_acum","demanda_acum","inversion_acum_MCLP"];
    const rows = [cols.join(",")];
    solveResult.order.forEach(o => {
      rows.push([
        o.step, o.id, `"${(o.nombre || "").replace(/"/g, '""')}"`,
        `"${(o.comunas || "").replace(/"/g, '""')}"`,
        (+o.km).toFixed(2), o.costo, (o.score || 0).toFixed(4),
        o.pobMarginal, o.pobBeneficiada || 0, Math.round(o.demandaHab || 0),
        o.compUnidos || 0, o.cumPob, Math.round(o.cumDemHab), o.cumBudget,
      ].join(","));
    });
    const head = Object.entries(prov()).map(([k, v]) => `# ${k}: ${v}`).join("\n");
    dl(`EVA_priorizacion_secuencial_${dateStamp()}.csv`, "\uFEFF" + head + "\n" + rows.join("\n"), "text/csv;charset=utf-8");
  };

  const items = [
    {
      fmt: "CSV", desc: "Tabla de ranking con indicadores y puntaje",
      file: `EVA_ranking_${dateStamp()}.csv`,
      size: `${(ranking.length * 0.18).toFixed(0)} KB`,
      action: exportRankingCSV
    },
    {
      fmt: "GeoJSON", desc: "Cartera priorizada con geometría e indicadores",
      file: `EVA_cartera_priorizada_${dateStamp()}.geojson`,
      size: `${(ranking.length * 1.5).toFixed(0)} KB`,
      action: exportCarteraGeoJSON
    },
    {
      fmt: "GeoJSON", desc: "Población OD con flag de conectividad",
      file: `EVA_poblacion_OD_${dateStamp()}.geojson`,
      size: `${Math.round(window.populationFC.features.length * 0.24)} KB`,
      action: exportPoblacionGeoJSON
    },
    {
      fmt: "JSON", desc: "Sesión reproducible: parámetros y pesos efectivos + versiones + hashes + ranking bruto/normalizado",
      file: `EVA_sesion_${dateStamp()}.json`,
      size: "—",
      action: exportSesionJSON
    },
    {
      fmt: "CSV", desc: "Priorización secuencial: orden de construcción recomendado",
      file: `EVA_priorizacion_secuencial_${dateStamp()}.csv`,
      size: solveResult ? `${solveResult.order.length} pasos` : "requiere solver",
      action: exportSecuencialCSV
    },
    {
      fmt: "JSON", desc: "Control de calidad de datos (QA): totales, duplicados, geometrías, comunas",
      file: `EVA_QA_${dateStamp()}.json`,
      size: "—",
      action: () => window.exportQA("json")
    },
    {
      fmt: "CSV", desc: "Control de calidad de datos (QA) en formato tabular",
      file: `EVA_QA_${dateStamp()}.csv`,
      size: "—",
      action: () => window.exportQA("csv")
    },
  ];

  return (
    <>
      <Section title="Exportar resultados" desc="Descarga las salidas técnicas del análisis con los parámetros y proyectos priorizados actuales.">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {items.map(it => (
            <div key={it.fmt + it.file} style={{ display: "flex", gap: 10, padding: "10px 12px", border: "1px solid var(--line)", borderRadius: "var(--r-sm)", background: "white" }}>
              <div style={{ width: 38, textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, background: "var(--primary-soft)", color: "var(--primary-deep)", padding: "3px 0", borderRadius: 3 }}>
                  {it.fmt}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-0)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.file}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{it.desc}</div>
              </div>
              <div style={{ alignSelf: "center", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-3)" }}>{it.size}</span>
                <button className="hdr-btn primary" onClick={it.action} title="Descargar"><Ico name="download" /></button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Estado de la sesión">
        <div className="justify-list" style={{ fontSize: 11.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-2)" }}>Escenario activo</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-1)" }}>{scenarioKey || "personalizado"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-2)" }}>Proyectos priorizados</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-1)" }}>{lockedIds.length} / {ranking.length}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-2)" }}>Cobertura base actual</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-1)" }}>{((window.POB_BASE / window.TOTAL_POB) * 100).toFixed(1)}%</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-2)" }}>Hash de configuración</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-1)" }}>{window.evaConfigHash ? window.evaConfigHash(liveParams, liveWeights, { escenario: scenarioKey }) : "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-2)" }}>Hash de datos</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-1)" }}>{window.evaDataHash ? window.evaDataHash() : "—"}</span>
          </div>
        </div>
      </Section>

      <Section title="Versión y control de calidad" desc="Toda exportación incluye estas versiones y un reporte QA verificable.">
        <div className="justify-list" style={{ fontSize: 11.5, marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--ink-2)" }}>Motor / Datos / Metodología</span>
            <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-1)" }}>
              v{window.EVA_VERSION.ENGINE_VERSION} · {window.EVA_VERSION.DATA_VERSION} · v{window.EVA_VERSION.METHODOLOGY_VERSION}
            </span>
          </div>
        </div>
        {(() => {
          const qa = window.EVA_QA ? window.EVA_QA() : null;
          if (!qa) return null;
          const est = qa.resumen.estado;
          const color = est === "CONFORME" ? "var(--good)" : est === "NO CONFORME" ? "var(--bad)" : "var(--warn)";
          const bg = est === "CONFORME" ? "oklch(0.96 0.04 150)" : est === "NO CONFORME" ? "oklch(0.96 0.05 25)" : "oklch(0.97 0.05 85)";
          return (
            <div style={{ background: bg, border: `1px solid ${color}`, borderRadius: 6, padding: "10px 12px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 12.5, color }}>QA: {est}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-2)" }}>{qa.resumen.issues_criticos} crít · {qa.resumen.issues_advertencia} adv</span>
              </div>
              <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
                {qa.totales.proyectos} proy · {qa.problemas.proyectos_sin_comuna.length} sin comuna · {qa.problemas.proyectos_comuna_inferida.length} inferidas · {Object.values(qa.problemas.ids_internos_duplicados).reduce((a,x)=>a+x.length,0)} dup. internos
              </div>
            </div>
          );
        })()}
        <div style={{ display: "flex", gap: 6 }}>
          <button className="hdr-btn" style={{ flex: 1, justifyContent: "center" }} onClick={() => window.exportQA("json")}>
            <Ico name="download" /> QA JSON
          </button>
          <button className="hdr-btn" style={{ flex: 1, justifyContent: "center" }} onClick={() => window.exportQA("csv")}>
            <Ico name="download" /> QA CSV
          </button>
        </div>
      </Section>
    </>
  );
}

function dateStamp() {
  const d = new Date();
  return d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
}

/* ---------- Orígenes con destino en la comuna del hex ---------- */
function HexOrigenes({ p, comName }) {
  const code = p.comuna;
  const list = (window.INCOMING_COMUNAS_BY_COMUNA && window.INCOMING_COMUNAS_BY_COMUNA.get(code)) || [];
  const total = (window.INCOMING_TOTAL_BY_COMUNA && window.INCOMING_TOTAL_BY_COMUNA.get(code)) || 0;
  const top = list.slice(0, 10);
  const sumTop = top.reduce((a, o) => a + o.flow, 0);
  const maxFlow = top.length ? top[0].flow : 1;

  return (
    <Section
      title={"Orígenes → " + comName}
      meta={fmtN(total) + " v/d"}
      desc={"Desde qué comunas provienen los viajes laborales con destino en " + comName + ". El censo resuelve el destino a nivel comunal, por lo que estos viajes llegan a la comuna de este hex (no necesariamente al hex exacto)."}
    >
      {top.length === 0 && (
        <div className="empty-hint">Sin viajes registrados hacia esta comuna.</div>
      )}
      {top.map((o, i) => {
        const c = window.OD_COMUNAS_MAP.get(o.code);
        const oName = c ? c.name : ("Comuna " + o.code);
        return (
          <div key={o.code} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 18, height: 18, borderRadius: 999, background: "var(--primary)", color: "white",
                  fontSize: 10, fontWeight: 700, display: "grid", placeItems: "center",
                  fontFamily: "var(--font-mono)",
                }}>{i + 1}</span>
                <span style={{ fontWeight: 600, fontSize: 12.5, color: "var(--ink-0)" }}>{oName}</span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--ink-0)" }}>
                {fmtN(o.flow)} <span style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 500 }}>v/d</span>
              </span>
            </div>
            <div className="justify-bar">
              <div style={{ width: (o.flow / maxFlow * 100) + "%" }}></div>
            </div>
          </div>
        );
      })}
      {total - sumTop > 0 && (
        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8, fontFamily: "var(--font-mono)" }}>
          + {fmtN(total - sumTop)} v/d desde otras {fmtN(Math.max(0, list.length - 10))} comunas de origen
        </div>
      )}
    </Section>
  );
}

window.RightPanel = RightPanel;
