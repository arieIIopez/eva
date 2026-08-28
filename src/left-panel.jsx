/* ============================================================
   EvaCiclo · Left Panel — capas, carga, OSM, parámetros
============================================================ */

function LeftPanel({
  layersOn, onToggleLayer,
  osmLayers, onToggleOsm,
  params, onParamChange,
  filterGrupo, onFilterGrupo,
  filterComuna, onFilterComuna,
  categoria, onCategoria,
  modo, onApplyModo,
  netView, onNetActive, onNetDist,
  fractalView, onFractalView, lockedIds, onLockProject, onUnlockProject, ranking,
}) {
  const [section, setSection] = useState("capas"); // capas | datos | osm | parametros

  return (
    <aside className="panel panel-left">
      <Tabs
        tabs={[
          { key: "capas", ph: "VISUAL", label: "Capas" },
          { key: "datos", ph: "FASE 1", label: "Datos" },
          { key: "osm", ph: "FASE 2", label: "OSM / Red" },
          { key: "parametros", ph: "FASE 3", label: "Umbrales" },
        ]}
        active={section}
        onChange={setSection}
      />

      <div className="panel-scroll">
        {section === "capas" && <CapasSection layersOn={layersOn} onToggleLayer={onToggleLayer} filterComuna={filterComuna} onFilterComuna={onFilterComuna} filterGrupo={filterGrupo} onFilterGrupo={onFilterGrupo} categoria={categoria} onCategoria={onCategoria} netView={netView} onNetActive={onNetActive} onNetDist={onNetDist} fractalView={fractalView} onFractalView={onFractalView} lockedIds={lockedIds} onLockProject={onLockProject} onUnlockProject={onUnlockProject} ranking={ranking} />}
        {section === "datos" && <DatosSection />}
        {section === "osm" && <OsmSection osmLayers={osmLayers} onToggleOsm={onToggleOsm} />}
        {section === "parametros" && <ParametrosSection params={params} onParamChange={onParamChange} modo={modo} onApplyModo={onApplyModo} />}
      </div>

      <div className="panel-foot">
        <span>Sesión #2026-021</span>
        <span>v0.4 · prototipo</span>
      </div>
    </aside>
  );
}

/* ---------- Capas ---------- */
function CapasSection({ layersOn, onToggleLayer, filterComuna, onFilterComuna, filterGrupo, onFilterGrupo, categoria, onCategoria, netView, onNetActive, onNetDist, fractalView, onFractalView, lockedIds, onLockProject, onUnlockProject, ranking }) {
  return (
    <>
      <FractalViewSection fractalView={fractalView} onFractalView={onFractalView} lockedIds={lockedIds} onLockProject={onLockProject} onUnlockProject={onUnlockProject} ranking={ranking} />
      <NetViewSection netView={netView} onNetActive={onNetActive} onNetDist={onNetDist} />
      <Section title="Visibilidad de capas" desc="Activa o desactiva capas en el mapa.">
        <LayerRow
          on={layersOn.existente}
          onToggle={() => onToggleLayer("existente")}
          infoKey="capa_existente"
          swatchClass="line"
          swatchStyle={{ background: "oklch(0.32 0.14 250)" }}
          label="Red ciclable existente"
          count={`${window.EXISTING_COUNT} ejes · ${(window.EXISTING_KM||0).toFixed(0)} km`}
        />
        {layersOn.existente && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, margin: "0 0 8px 22px" }}>
            <LayerRow on={layersOn.existCiclovia !== false} onToggle={() => onToggleLayer("existCiclovia")} swatchClass="line" swatchStyle={{ background: "#1d3a8a" }} label="Ciclovía" count={`${(window.EXISTING_TIPO || {}).ciclovia || 0}`} />
            <LayerRow on={layersOn.existSmp !== false} onToggle={() => onToggleLayer("existSmp")} swatchClass="line" swatchStyle={{ background: "#4a72c8" }} label="Senda multipropósito" count={`${(window.EXISTING_TIPO || {}).smp || 0}`} />
            <LayerRow on={layersOn.existCicloparque !== false} onToggle={() => onToggleLayer("existCicloparque")} swatchClass="line" swatchStyle={{ background: "#2f8769" }} label="Cicloparque" count={`${(window.EXISTING_TIPO || {}).cicloparque || 0}`} />
          </div>
        )}
        <LayerRow
          on={layersOn.proyectos}
          onToggle={() => onToggleLayer("proyectos")}
          infoKey="capa_proyectos"
          swatchClass="dotted"
          label="Ciclovías proyectadas"
          count={`${window.PROJECTS.length}`}
        />
        {layersOn.proyectos && categoria !== "Otras carteras" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, margin: "0 0 8px 22px" }}>
            <LayerRow
              on={layersOn.proyectosMetro !== false}
              onToggle={() => onToggleLayer("proyectosMetro")}
              swatchClass="dotted"
              swatchStyle={{ borderColor: "#a8421d" }}
              label="Metropolitana"
              count={`${(window.PROJECTS || []).filter(p => p.escala === "Metropolitana").length}`}
            />
            <LayerRow
              on={layersOn.proyectosInter !== false}
              onToggle={() => onToggleLayer("proyectosInter")}
              swatchClass="dotted"
              swatchStyle={{ borderColor: "#d9731e" }}
              label="Intercomunal"
              count={`${(window.PROJECTS || []).filter(p => p.escala === "Intercomunal").length}`}
            />
            <LayerRow
              on={layersOn.proyectosComunal !== false}
              onToggle={() => onToggleLayer("proyectosComunal")}
              swatchClass="dotted"
              swatchStyle={{ borderColor: "#e8a33c" }}
              label="Comunal"
              count={`${(window.PROJECTS || []).filter(p => p.escala === "Comunal").length}`}
            />
          </div>
        )}
        <LayerRow
          on={layersOn.poblacionDots}
          onToggle={() => onToggleLayer("poblacionDots")}
          infoKey="capa_od"
          swatchClass="dot"
          swatchStyle={{ background: "oklch(0.68 0.17 55)" }}
          label="Población OD (centroides)"
          count={`${window.populationFC.features.length}`}
        />
        <LayerRow
          on={layersOn.poblacionHeat}
          onToggle={() => onToggleLayer("poblacionHeat")}
          infoKey="capa_heat"
          swatchClass="dot"
          swatchStyle={{ background: "linear-gradient(45deg, oklch(0.7 0.05 240), oklch(0.6 0.16 50))", borderRadius: 6 }}
          label="Heatmap demanda potencial"
          count="OD"
        />
        <LayerRow
          on={layersOn.pbici}
          onToggle={() => onToggleLayer("pbici")}
          infoKey="capa_pbici"
          swatchClass="dot"
          swatchStyle={{ background: "linear-gradient(45deg, #31418f, #1e8a6e, #f0b429, #d6461e)" }}
          label="P(bici) modelo logit"
          count={`P̄ ${((window.PBICI_MEDIA || 0) * 100).toFixed(1)}%`}
        />
        <LayerRow
          on={layersOn.educacion}
          onToggle={() => onToggleLayer("educacion")}
          infoKey="capa_edu"
          swatchClass="dot"
          swatchStyle={{ background: "#7c3aed" }}
          label="Sedes educación superior"
          count={`${(window.EDU_SEDES || []).length}`}
        />
        <LayerRow
          on={layersOn.siniestros}
          onToggle={() => onToggleLayer("siniestros")}
          infoKey="capa_siniestros"
          swatchClass="dot"
          swatchStyle={{ background: "#b3122b" }}
          label="Siniestros ciclistas 2020–2024"
          count={`${fmtN(window.SIN_TOTAL || 0)}`}
        />
        {layersOn.siniestros && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, margin: "0 0 8px 22px" }}>
            <LayerRow on={layersOn.sinFatal !== false} onToggle={() => onToggleLayer("sinFatal")} swatchClass="dot" swatchStyle={{ background: "#b3122b" }} label="Con fallecido(s)" count={`${(window.SIN_SEV_COUNT || {}).fatal || 0}`} />
            <LayerRow on={layersOn.sinGrave !== false} onToggle={() => onToggleLayer("sinGrave")} swatchClass="dot" swatchStyle={{ background: "#e0561d" }} label="Lesionado grave" count={`${(window.SIN_SEV_COUNT || {}).grave || 0}`} />
            <LayerRow on={layersOn.sinLesion !== false} onToggle={() => onToggleLayer("sinLesion")} swatchClass="dot" swatchStyle={{ background: "#e8a13c" }} label="Lesionados / leves" count={`${(window.SIN_SEV_COUNT || {}).lesion || 0}`} />
            <LayerRow on={layersOn.sinDanios !== false} onToggle={() => onToggleLayer("sinDanios")} swatchClass="dot" swatchStyle={{ background: "#9aa6b2" }} label="Solo daños" count={`${(window.SIN_SEV_COUNT || {}).danios || 0}`} />
          </div>
        )}
        <LayerRow
          on={layersOn.monumentos}
          onToggle={() => onToggleLayer("monumentos")}
          infoKey="capa_monumentos"
          swatchClass="dot"
          swatchStyle={{ background: "#0f7d8c" }}
          label="Monumentos nacionales"
          count={`${fmtN(window.MON_TOTAL || 0)}`}
        />
        {layersOn.monumentos && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, margin: "0 0 8px 22px" }}>
            <LayerRow on={layersOn.monHistorico !== false} onToggle={() => onToggleLayer("monHistorico")} swatchClass="dot" swatchStyle={{ background: "#0f7d8c" }} label="Monumento Histórico" count={`${(window.MON_BY_CAT || {})["Monumento Histórico"] || 0}`} />
            <LayerRow on={layersOn.monZona !== false} onToggle={() => onToggleLayer("monZona")} swatchClass="dot" swatchStyle={{ background: "#b3801a" }} label="Zona Típica o Pintoresca" count={`${(window.MON_BY_CAT || {})["Zona Típica o Pintoresca"] || 0}`} />
            <LayerRow on={layersOn.monSantuario !== false} onToggle={() => onToggleLayer("monSantuario")} swatchClass="dot" swatchStyle={{ background: "#2f8f4e" }} label="Santuario de la Naturaleza" count={`${(window.MON_BY_CAT || {})["Santuario de la Naturaleza"] || 0}`} />
          </div>
        )}
        <LayerRow
          on={layersOn.ferias}
          onToggle={() => onToggleLayer("ferias")}
          infoKey="capa_ferias"
          swatchClass="line"
          swatchStyle={{ background: "#c2348b" }}
          label="Ferias libres y persas"
          count={`${fmtN(window.FER_TOTAL || 0)}`}
        />
        {layersOn.ferias && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, margin: "0 0 8px 22px" }}>
            <LayerRow on={layersOn.ferCruza !== false} onToggle={() => onToggleLayer("ferCruza")} swatchClass="line" swatchStyle={{ background: "#c2348b" }} label="Cruza una ciclovía" count={`${(window.FER_REL_COUNTS || {}).cruza || 0}`} />
            <LayerRow on={layersOn.ferCoincide !== false} onToggle={() => onToggleLayer("ferCoincide")} swatchClass="line" swatchStyle={{ background: "#8f1d5e" }} label="Sobre el mismo eje" count={`${(window.FER_REL_COUNTS || {}).coincide || 0}`} />
            <LayerRow on={layersOn.ferParalela !== false} onToggle={() => onToggleLayer("ferParalela")} swatchClass="line" swatchStyle={{ background: "#e06fae" }} label="Paralela a ciclovía" count={`${(window.FER_REL_COUNTS || {}).paralela || 0}`} />
            <LayerRow on={layersOn.ferSin !== false} onToggle={() => onToggleLayer("ferSin")} swatchClass="line" swatchStyle={{ background: "#b8a0ad" }} label="Sin ciclovía cercana" count={`${(window.FER_REL_COUNTS || {}).sin || 0}`} />
          </div>
        )}
        <LayerRow
          on={layersOn.metro}
          onToggle={() => onToggleLayer("metro")}
          infoKey="capa_metro"
          swatchClass="dot"
          swatchStyle={{ background: "#d6461e" }}
          label="Estaciones de Metro"
          count={`${fmtN(window.METRO_TOTAL || 0)}`}
        />
        <LayerRow
          on={layersOn.parques}
          onToggle={() => onToggleLayer("parques")}
          infoKey="capa_parques"
          swatchClass="dot"
          swatchStyle={{ background: "#2f8f4e" }}
          label="Parques y áreas verdes"
          count={`${fmtN(window.PARQUES_TOTAL || 0)}`}
        />
        <LayerRow
          on={layersOn.otras}
          onToggle={() => onToggleLayer("otras")}
          swatchClass="dotted"
          swatchStyle={{ borderColor: "#6b4ea8" }}
          label="Otras carteras (referencia)"
          count={`${fmtN(window.OTRAS_TOTAL || 0)} · ${(window.OTRAS_KM || 0).toFixed(0)} km`}
        />
        <LayerRow
          on={layersOn.comunas}
          onToggle={() => onToggleLayer("comunas")}
          infoKey="capa_comunas"
          swatchClass="line"
          swatchStyle={{ background: "#8a93a6" }}
          label="Límites comunales"
          count={`${fmtN((window.COMUNAS_FC && window.COMUNAS_FC.features || []).length)} comunas`}
        />
      </Section>

      <Section title="Filtros territoriales">
        <div className="field">
          <div className="field-label">
            <span>Categoría de cartera</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              className={"hdr-btn" + (categoria === "Plan Maestro" ? " primary" : "")}
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => onCategoria && onCategoria("Plan Maestro")}
            >Plan Maestro</button>
            <button
              className={"hdr-btn" + (categoria === "Otras carteras" ? " primary" : "")}
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => onCategoria && onCategoria("Otras carteras")}
            >Otras carteras</button>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.45 }}>
            {categoria === "Plan Maestro"
              ? `Cartera GORE PMC (${(window.FC_RAW && window.FC_RAW["Plan Maestro"] ? window.FC_RAW["Plan Maestro"].features.length : 0)} ejes). Se prioriza y evalúa esta cartera.`
              : `Municipios, MOP, MTT, MINVU y Privados/IMIV (${fmtN(window.OTRAS_TOTAL || 0)} ejes · ${(window.OTRAS_KM||0).toFixed(0)} km). Otros responsables y presupuestos; se evalúa como categoría aparte.`}
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <div className="field-label">
            <span>Comuna</span>
          </div>
          <select className="select" value={filterComuna} onChange={e => onFilterComuna(e.target.value)}>
            {window.COMUNAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <div className="field-label">
            <span>Provincia / agrupación</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["Gran Santiago", ...Object.keys(window.GRUPOS_TERRITORIALES || {}).filter(g => g !== "Gran Santiago").sort((a, b) => a.localeCompare(b, "es"))].map(g => (
              <button
                key={g}
                className={"hdr-btn" + (filterGrupo === g ? " primary" : "")}
                style={{ fontSize: 11 }}
                onClick={() => onFilterGrupo && onFilterGrupo(filterGrupo === g ? null : g)}
              >{g}</button>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.45 }}>
            {filterGrupo
              ? `Mostrando proyectos en ${filterGrupo} (${(window.GRUPOS_TERRITORIALES && window.GRUPOS_TERRITORIALES[filterGrupo] || []).length} comunas). Click nuevamente para quitar.`
              : "Filtra los proyectos del mapa por provincia o por el Gran Santiago (32 comunas de la provincia de Santiago + Colina, Lampa, Puente Alto, San Bernardo, Calera de Tango, Padre Hurtado, Peñaflor y Talagante). Excluyente con el filtro por comuna."}
          </div>
        </div>
      </Section>
    </>
  );
}

/* ---------- Datos cargados (Fase 1) ---------- */
function DatosSection() {
  const [restrictedLayer, setRestrictedLayer] = React.useState(null);
  const files = [
    { name: "PMC_Comunales_Intercomunales_0526.geojson", size: "247 KB", count: `${window.PROJECTS.length} proyectos`, kind: "Cartera GORE PMC", src: () => window.projectsFC },
    { name: "Ciclovias_existentes_SECTRA_dic25.geojson", size: "3.0 MB", count: `${window.EXISTING_COUNT} ejes · ${(window.EXISTING_KM||0).toFixed(0)} km`, kind: "Red base SECTRA", src: () => window.existingFC },
    { name: "centroides_manzanas_OD.geojson", size: "676 KB", count: `${window.populationFC.features.length} hex · ${fmtMM(window.TOTAL_PER || 0)} hab`, kind: "Población OD + censo 24 (hex 600m)", src: () => window.populationFC },
    { name: "educacion_superior_sedes.geojson", size: "70 KB", count: `${(window.EDU_SEDES||[]).length} sedes · ${fmtMM(window.EDU_TOTAL_MAT || 0)} matr.`, kind: "Polos de atracción estudiantil", src: () => window.EDU_FC },
    { name: "siniestros_bicicleta_2020_2024_RM.geojson", size: "1.5 MB", count: `${fmtN(window.SIN_TOTAL || 0)} siniestros · ${fmtN((window.SIN_VICTIMS||{}).fall || 0)} fallecidos`, kind: "Siniestralidad ciclista (CONASET)", src: () => window.SINIESTROS_FC },
    { name: "monumentos_nacionales_RM.geojson", size: "98 KB", count: `${fmtN(window.MON_TOTAL || 0)} puntos · ${Object.keys(window.MON_BY_CAT||{}).length} categorías`, kind: "Monumentos nacionales (CMN)", src: () => window.MON_FC },
    { name: "ferias_libres_persas_RM.geojson", size: "169 KB", count: `${fmtN(window.FER_TOTAL || 0)} ferias · ${Object.keys(window.FER_BY_COMUNA||{}).length} comunas`, kind: "Ferias libres y persas", src: () => window.FERIAS_FC },
    { name: "estaciones_metro.geojson", size: "19 KB", count: `${fmtN(window.METRO_TOTAL || 0)} estaciones`, kind: "Metro (hotspots intermodales)", src: () => window.METRO_FC },
    { name: "parques_areas_verdes_RM.geojson", size: "158 KB", count: `${fmtN(window.PARQUES_TOTAL || 0)} parques · ${((window.PARQUES_SUP_TOTAL||0)/1e6).toFixed(1)} km²`, kind: "Parques (atractores por tamaño)", src: () => window.PARQUES_FC },
    { name: "paraderos_bus_GTFS.json", size: "283 KB", count: `${fmtN(window.BUS_TOTAL || 0)} paraderos`, kind: "Paraderos de bus (conteo por eje)", src: () => ({ type: "FeatureCollection", features: (window.BUS_STOPS||[]).map((c,i) => ({ type: "Feature", properties: { idx: i }, geometry: { type: "Point", coordinates: c } })) }) },
    { name: "manzanas_por_hex.json", size: "1.1 MB", count: `${fmtN(window.MANZ_TOTAL || 0)} MANZENT · ${fmtN((window.MANZ_BY_HEX && window.MANZ_BY_HEX.size) || 0)} hex`, kind: "Diccionario de manzanas censales", src: () => window.MANZ_BY_HEX_RAW },
    { name: "variables_modelo_hex.json", size: "62 KB", count: `${fmtN(Object.keys(window.VARS_MODELO_HEX || {}).length)} hex con datos`, kind: "Escolaridad y desnivel del modelo (por hex)", restricted: true, infoKey: "mod_logit" },
    { name: "comunas_rm.geojson", size: "3,3 MB", count: `${fmtN((window.COMUNAS_FC && window.COMUNAS_FC.features || []).length)} comunas`, kind: "Límites comunales oficiales (RM)", src: () => window.COMUNAS_FC },
    { name: "ciclo_todo_chile_41 (Biogeme)", size: "8 parámetros", count: `117.072 manzanas · P̄(bici) ${((window.PBICI_MEDIA || 0) * 100).toFixed(1)}%`, kind: "Modelo de elección modal (logit)", restricted: true, infoKey: "mod_logit" },
  ];

  function downloadLayer(f) {
    try {
      const fc = f.src && f.src();
      if (!fc || (!fc.features && !fc.hexes && !fc.coeficientes)) { window.evaLog && window.evaLog("warn", `[descarga] capa no disponible: ${f.name}`); return; }
      const blob = new Blob([JSON.stringify(fc)], { type: "application/geo+json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = f.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      window.evaLog && window.evaLog("ok", `[descarga] ${f.name} · ${(fc.features && fc.features.length) || (fc.hexes && Object.keys(fc.hexes).length) || 1} entidades`);
    } catch (err) {
      window.evaLog && window.evaLog("err", `[descarga] error en ${f.name}: ${err.message}`);
    }
  }

  return (
    <>
      <Section title="Capas cargadas" meta="9/9" desc="Capas requeridas por el motor de conectividad (Fase 1) más siniestralidad, monumentos, ferias, transporte público y parques. Descarga cada capa en GeoJSON.">
        {files.map(f => (
          <div key={f.name} className="upload-loaded" style={{ marginBottom: 6 }}>
            <span className="dot" style={{ background: "var(--good)" }}></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}{f.infoKey && <InfoButton k={f.infoKey} />}</div>
              <div className="meta">{f.kind} · {f.count}</div>
            </div>
            <span className="meta" style={{ flexShrink: 0 }}>{f.size}</span>
            {f.restricted ? (
              <button
                className="icon-btn"
                title="Capa de uso restringido — ver información"
                aria-label="Capa de uso restringido — ver información"
                onClick={() => setRestrictedLayer(f.name)}
                style={{ flexShrink: 0, marginLeft: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, padding: 0, border: "1px solid var(--line)", borderRadius: "var(--r-sm)", background: "var(--surface)", color: "var(--ink-3)", cursor: "pointer" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>
              </button>
            ) : (
              <button
                className="icon-btn"
                title={`Descargar ${f.name}`}
                aria-label={`Descargar ${f.name}`}
                onClick={() => downloadLayer(f)}
                style={{ flexShrink: 0, marginLeft: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, padding: 0, border: "1px solid var(--line-strong)", borderRadius: "var(--r-sm)", background: "var(--surface)", color: "var(--ink-2)", cursor: "pointer" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path></svg>
              </button>
            )}
          </div>
        ))}
      </Section>

      {restrictedLayer && (
        <div className="info-scrim" onClick={() => setRestrictedLayer(null)}>
          <div className="info-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="info-modal-h">
              <div className="info-modal-title">Capa de uso restringido</div>
              <button className="info-close" onClick={() => setRestrictedLayer(null)} title="Cerrar">✕</button>
            </div>
            <div className="info-modal-body">
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--ink-2)" }}>
                La capa <b style={{ color: "var(--ink-1)" }}>{restrictedLayer}</b> no está disponible para descarga.
              </p>
            </div>
          </div>
        </div>
      )}

      <Section title="Resumen de la red base" desc="SECTRA dic 2025.">
        <div className="metric-grid" style={{ marginLeft: -16, marginRight: -16 }}>
          <div className="metric"><div className="metric-k">Ejes existentes</div><div className="metric-v">{window.EXISTING_COUNT}</div></div>
          <div className="metric"><div className="metric-k">Km construidos</div><div className="metric-v">{(window.EXISTING_KM||0).toFixed(0)}</div></div>
          <div className="metric"><div className="metric-k">Ciclovías</div><div className="metric-v">{(window.EXISTING_TIPO||{}).ciclovia || 0}</div></div>
          <div className="metric"><div className="metric-k">SMP + Cicloparques</div><div className="metric-v">{((window.EXISTING_TIPO||{}).smp || 0) + ((window.EXISTING_TIPO||{}).cicloparque || 0)}</div></div>
        </div>
      </Section>

      <Section title="Resumen de la cartera proyectada" desc="PMC GORE · mayo 2026.">
        <div className="metric-grid" style={{ marginLeft: -16, marginRight: -16 }}>
          <div className="metric"><div className="metric-k">Proyectos</div><div className="metric-v">{window.PROJECTS.length}</div></div>
          <div className="metric"><div className="metric-k">Total km</div><div className="metric-v">{window.PROJECTS.reduce((a,p)=>a+(+p.km||0),0).toFixed(0)}</div></div>
          <div className="metric"><div className="metric-k">Comunales</div><div className="metric-v">{window.PROJECTS.filter(p=>p.escala==="Comunal").length}</div></div>
          <div className="metric"><div className="metric-k">Intercomunales</div><div className="metric-v">{window.PROJECTS.filter(p=>p.escala==="Intercomunal").length}</div></div>
        </div>
      </Section>

      <Section title="Resumen de población OD" desc="Manzanas censales con vector de viajes laborales a 52 comunas + variables censo 2024.">
        <div className="metric-grid" style={{ marginLeft: -16, marginRight: -16 }}>
          <div className="metric"><div className="metric-k">Personas (censo 24)</div><div className="metric-v">{fmtMM(window.TOTAL_PER || 0)}</div></div>
          <div className="metric"><div className="metric-k">Ocupados (gen. OD)</div><div className="metric-v">{fmtMM(window.TOTAL_POB)}</div></div>
          <div className="metric"><div className="metric-k">Estudiantes</div><div className="metric-v">{fmtMM(window.TOTAL_EST || 0)}</div></div>
          <div className="metric"><div className="metric-k">Viajes OD/día</div><div className="metric-v">{fmtMM(window.OD_TOTAL_FLOW)}</div></div>
        </div>
      </Section>

      <Section title="Resumen de siniestralidad ciclista" desc="Siniestros con participación de bicicletas (CONASET 2020–2024). La severidad ponderada (6·fallecidos + 3·graves + 2·menos graves + 1·leves) alimenta el escenario «Seguridad vial».">
        <div className="metric-grid" style={{ marginLeft: -16, marginRight: -16 }}>
          <div className="metric"><div className="metric-k">Siniestros</div><div className="metric-v">{fmtN(window.SIN_TOTAL || 0)}</div></div>
          <div className="metric"><div className="metric-k">Fallecidos</div><div className="metric-v" style={{ color: "#b3122b" }}>{fmtN((window.SIN_VICTIMS||{}).fall || 0)}</div></div>
          <div className="metric"><div className="metric-k">Lesionados graves</div><div className="metric-v">{fmtN((window.SIN_VICTIMS||{}).grav || 0)}</div></div>
          <div className="metric"><div className="metric-k">Período</div><div className="metric-v" style={{ fontSize: 15 }}>{(window.SIN_YEARS||[])[0] || "—"}–{(window.SIN_YEARS||[])[(window.SIN_YEARS||[]).length-1] || "—"}</div></div>
        </div>
        <div className="section-title" style={{ margin: "14px 0 8px", fontSize: 10 }}>Comunas con mayor siniestralidad (ponderada por severidad)</div>
        <div className="justify-list">
          {Object.entries(window.SIN_BY_COMUNA || {})
            .sort((a, b) => b[1].peso - a[1].peso)
            .slice(0, 6)
            .map(([cut, v]) => {
              const max = Math.max(1, ...Object.values(window.SIN_BY_COMUNA || {}).map(x => x.peso));
              return (
                <div key={cut} className="justify-row">
                  <span className="justify-k" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.nombre || cut}</span>
                  <div className="justify-bar"><div style={{ width: (v.peso / max * 100) + "%", background: "#c2511c" }}></div></div>
                  <span className="justify-v">{fmtN(v.n)}</span>
                </div>
              );
            })}
        </div>
        <div className="assumption" style={{ margin: "10px 0 0" }}>
          Activa la capa <b>Siniestros ciclistas</b> en la pestaña Capas para verlos en el mapa, y usa el escenario <b>Seguridad vial</b> en el panel de Ranking para priorizar según estos datos.
        </div>
      </Section>

      <Section title="Resumen de monumentos nacionales" desc="Puntos de Monumentos Nacionales (CMN). Capa de contexto patrimonial: criterio NEUTRO por defecto, con opción de evitar (−) o conectar (+) en el panel de Ranking.">
        <div className="metric-grid" style={{ marginLeft: -16, marginRight: -16 }}>
          <div className="metric"><div className="metric-k">Monumentos</div><div className="metric-v">{fmtN(window.MON_TOTAL || 0)}</div></div>
          <div className="metric"><div className="metric-k">Categorías</div><div className="metric-v">{Object.keys(window.MON_BY_CAT||{}).length}</div></div>
        </div>
        <div className="justify-list" style={{ marginTop: 10 }}>
          {Object.entries(window.MON_BY_CAT || {}).sort((a, b) => b[1] - a[1]).map(([cat, n]) => {
            const max = Math.max(1, ...Object.values(window.MON_BY_CAT || {}));
            return (
              <div key={cat} className="justify-row">
                <span className="justify-k" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cat}</span>
                <div className="justify-bar"><div style={{ width: (n / max * 100) + "%", background: "#0f7d8c" }}></div></div>
                <span className="justify-v">{fmtN(n)}</span>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Resumen de ferias libres" desc="Tramos de calle donde operan ferias libres y persas. Capa INFORMATIVA: no altera el motor de cálculo. Cada proyecto identifica cuántas ferias cruza su tramo y en qué días operan, para evaluar compatibilidad de uso del espacio vial.">
        <div className="metric-grid" style={{ marginLeft: -16, marginRight: -16 }}>
          <div className="metric"><div className="metric-k">Ferias</div><div className="metric-v">{fmtN(window.FER_TOTAL || 0)}</div></div>
          <div className="metric"><div className="metric-k">Comunas</div><div className="metric-v">{Object.keys(window.FER_BY_COMUNA||{}).length}</div></div>
          <div className="metric"><div className="metric-k">Puestos (aprox.)</div><div className="metric-v">{fmtMM(window.FER_PUESTOS || 0)}</div></div>
          <div className="metric"><div className="metric-k">Tipos</div><div className="metric-v" style={{ fontSize: 13 }}>{Object.keys(window.FER_BY_TIPO||{}).length}</div></div>
        </div>
        <div className="section-title" style={{ margin: "14px 0 8px", fontSize: 10 }}>Instalaciones por día de la semana</div>
        <div className="justify-list">
          {(window.FER_BY_DAY || []).map(([dia, n]) => {
            const max = Math.max(1, ...(window.FER_BY_DAY || []).map(x => x[1]));
            return (
              <div key={dia} className="justify-row">
                <span className="justify-k" style={{ whiteSpace: "nowrap" }}>{dia}</span>
                <div className="justify-bar"><div style={{ width: (n / max * 100) + "%", background: "#c2348b" }}></div></div>
                <span className="justify-v">{fmtN(n)}</span>
              </div>
            );
          })}
        </div>
        <div className="assumption" style={{ margin: "10px 0 0" }}>
          Activa la capa <b>Ferias libres</b> en la pestaña Capas para verlas en el mapa. En la ficha de cada proyecto se indica cuántas ferias cruza su tramo y en qué días.
        </div>
      </Section>

      <Section title="Resumen de transporte público" desc="GTFS Santiago. Dos perspectivas: las estaciones de Metro son hotspots intermodales (criterio de intermodalidad bici-metro), y los paraderos de bus se cuentan por eje como indicador de complejidad de diseño.">
        <div className="metric-grid" style={{ marginLeft: -16, marginRight: -16 }}>
          <div className="metric"><div className="metric-k">Estaciones de Metro</div><div className="metric-v" style={{ color: "#d6461e" }}>{fmtN(window.METRO_TOTAL || 0)}</div></div>
          <div className="metric"><div className="metric-k">Paraderos de bus</div><div className="metric-v">{fmtN(window.BUS_TOTAL || 0)}</div></div>
        </div>
        <div className="assumption" style={{ margin: "10px 0 0" }}>
          Las <b>estaciones de Metro</b> se muestran como hotspots en el mapa (capa Estaciones de Metro) y alimentan el escenario <b>Intermodalidad bici-metro</b> del Ranking. Los <b>paraderos de bus</b> no se dibujan: se cuentan por eje y aparecen en la ficha de cada proyecto como indicador de complejidad.
        </div>
      </Section>
    </>
  );
}

/* ---------- OSM (Fase 2) ---------- */
function OsmSection({ osmLayers, onToggleOsm }) {
  const [overpass, setOverpass] = useState({
    status: "idle",   // idle | loading | done | error
    msg: "",
    counts: null,     // { cycleway, highway_primary, highway_residential, ... }
    bbox: null,
    fetchedAt: null,
  });

  // Factores costo percibido — editables, gatillan recálculo
  const [factors, setFactors] = useState({
    segregada: 0.85,
    primaria: 1.30,
    pendiente: 1.20,
    cruce: 1.15,
  });
  const [costEstim, setCostEstim] = useState(null); // estimación del costo percibido prom de la cartera

  // RM bbox (lat_min, lng_min, lat_max, lng_max) — recortado para no exceder Overpass
  const RM_BBOX = [-33.7, -71.0, -33.25, -70.45];

  const fetchOverpass = async () => {
    setOverpass({ status: "loading", msg: "Conectando con Overpass API…", counts: null, bbox: RM_BBOX });
    // Query: trae cycleway / highway por tipo, con conteo
    const [s, w, n, e] = RM_BBOX;
    const q = `
[out:json][timeout:60];
(
  way["highway"="cycleway"](${s},${w},${n},${e});
  way["cycleway"](${s},${w},${n},${e});
  way["highway"="primary"](${s},${w},${n},${e});
  way["highway"="secondary"](${s},${w},${n},${e});
  way["highway"="residential"](${s},${w},${n},${e});
  way["highway"="tertiary"](${s},${w},${n},${e});
);
out tags geom 6000;`;

    try {
      const t0 = performance.now();
      setOverpass(s => ({ ...s, msg: "Descargando red OSM de la RM (puede tomar 30-90s)…" }));
      const resp = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(q),
      });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();
      const dt = ((performance.now() - t0) / 1000).toFixed(1);

      // Contar por tipo
      const counts = { cycleway: 0, primary: 0, secondary: 0, residential: 0, tertiary: 0, other: 0 };
      let total = 0;
      for (const el of data.elements || []) {
        const tags = el.tags || {};
        total++;
        if (tags.highway === "cycleway" || tags.cycleway) counts.cycleway++;
        else if (tags.highway === "primary") counts.primary++;
        else if (tags.highway === "secondary") counts.secondary++;
        else if (tags.highway === "residential") counts.residential++;
        else if (tags.highway === "tertiary") counts.tertiary++;
        else counts.other++;
      }
      counts.total = total;

      window.OSM_DATA = { counts, fetchedAt: new Date(), durationSec: +dt };
      setOverpass({
        status: "done",
        msg: `${fmtN(total)} ways en ${dt}s`,
        counts,
        bbox: RM_BBOX,
        fetchedAt: new Date(),
      });
      recomputeCostoPercibido(counts, factors);
    } catch (err) {
      setOverpass(s => ({ ...s, status: "error", msg: "Error: " + err.message }));
    }
  };

  // Recalcula un proxy de "costo percibido promedio" cuando se cambian factores
  const recomputeCostoPercibido = (counts, f) => {
    if (!counts) return;
    // Costo percibido promedio (por km) = mezcla ponderada de factores según mix OSM
    const total = counts.total || 1;
    const wPrim = counts.primary / total;
    const wRes = (counts.residential + counts.tertiary) / total;
    const wCycle = counts.cycleway / total;
    const c = wPrim * f.primaria + wRes * 1.0 + wCycle * f.segregada;
    // Aplica modificador adicional de pendiente/cruce promedio
    const cFinal = c * 0.6 + (f.pendiente * 0.2) + (f.cruce * 0.2);
    setCostEstim(cFinal);
  };

  const updateFactor = (k, v) => {
    const next = { ...factors, [k]: v };
    setFactors(next);
    if (overpass.counts) recomputeCostoPercibido(overpass.counts, next);
  };

  return (
    <>
      <Section
        title="Fuente OpenStreetMap"
        desc="Extracto Overpass procesado a grafo dirigido. Atributos OSM utilizados como impedancia y oportunidades."
      >
        <div className="upload-loaded" style={{ marginBottom: 10 }}>
          <span className="dot" style={{
            background: overpass.status === "done" ? "var(--good)" :
                        overpass.status === "loading" ? "var(--warn)" :
                        overpass.status === "error" ? "var(--bad)" : "var(--ink-4)",
            animation: overpass.status === "loading" ? "pulse 1.2s infinite" : "none",
          }}></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Overpass API · RM bbox
            </div>
            <div className="meta">
              {overpass.status === "done"
                ? `${fmtN(overpass.counts.total)} ways · ${overpass.fetchedAt.toLocaleTimeString("es-CL")}`
                : overpass.status === "loading" ? overpass.msg
                : overpass.status === "error" ? overpass.msg
                : "Pendiente · presiona para cargar"}
            </div>
          </div>
        </div>

        {overpass.status !== "done" && (
          <button
            className={"hdr-btn primary"}
            style={{ width: "100%", justifyContent: "center" }}
            onClick={fetchOverpass}
            disabled={overpass.status === "loading"}
          >
            <Ico name="network" /> {overpass.status === "loading" ? "Descargando…" : "Cargar red OSM"}
          </button>
        )}

        {overpass.status === "done" && (
          <>
            <div className="section-title" style={{ marginTop: 12, marginBottom: 6, fontSize: 10 }}>
              Conteo por tipo de vía
            </div>
            <div className="justify-list">
              {[
                ["cycleway", "Ciclovías OSM", "var(--good)"],
                ["primary", "Avenidas primarias", "var(--bad)"],
                ["secondary", "Secundarias", "var(--warn)"],
                ["tertiary", "Terciarias", "var(--ink-3)"],
                ["residential", "Residenciales", "var(--primary)"],
                ["other", "Otras", "var(--ink-4)"],
              ].map(([k, l, color]) => {
                const v = overpass.counts[k] || 0;
                const pct = overpass.counts.total ? v / overpass.counts.total : 0;
                return (
                  <div key={k} className="justify-row">
                    <span className="justify-k" style={{ color }}>{l}</span>
                    <div className="justify-bar"><div style={{ width: (pct * 100) + "%", background: color }}></div></div>
                    <span className="justify-v">{fmtN(v)}</span>
                  </div>
                );
              })}
            </div>
            <button className="hdr-btn" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={fetchOverpass}>
              <Ico name="refresh" /> Actualizar
            </button>
          </>
        )}
      </Section>

      <Section title="Costo percibido" infoKey="sec_costoPercibido" desc="Multiplicadores sobre longitud real. C_a = L · F_infra · F_jerarquía · F_pendiente · F_cruce.">
        <SliderField infoKey="cp_segregada" label="Bonif. ciclovía segregada" value={factors.segregada} min={0.5} max={1} step={0.05} onChange={v => updateFactor("segregada", v)} />
        <SliderField infoKey="cp_primaria" label="Penal. avenida primaria" value={factors.primaria} min={1} max={2} step={0.05} onChange={v => updateFactor("primaria", v)} />
        <SliderField infoKey="cp_pendiente" label="Penal. pendiente >5%" value={factors.pendiente} min={1} max={1.8} step={0.05} onChange={v => updateFactor("pendiente", v)} />
        <SliderField infoKey="cp_cruce" label="Penal. cruce crítico" value={factors.cruce} min={1} max={1.6} step={0.05} onChange={v => updateFactor("cruce", v)} />

        {costEstim != null && (
          <div style={{ background: "var(--primary-soft)", padding: "10px 12px", borderRadius: "var(--r-sm)", marginTop: 10 }}>
            <div style={{ fontSize: 10, color: "var(--primary-deep)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600 }}>Costo percibido promedio</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--primary-deep)", marginTop: 2 }}>
              {costEstim.toFixed(3)} <span style={{ fontSize: 10, fontWeight: 500, color: "var(--ink-3)" }}>· longitud × factor</span>
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
              Sobre la red OSM cargada. {costEstim < 1 ? "Predomina infraestructura favorable." : "Predomina red con penalizaciones."}
            </div>
          </div>
        )}
        {!overpass.counts && (
          <div className="assumption" style={{ margin: "10px 0 0" }}>
            <b>Necesitas cargar OSM primero</b> para que los factores se apliquen al cálculo del costo percibido sobre la red real.
          </div>
        )}
      </Section>

      <Section title="Diagnóstico de red base">
        <div className="metric-grid" style={{ marginLeft: -16, marginRight: -16 }}>
          <div className="metric"><div className="metric-k">Ejes existentes</div><div className="metric-v">{window.EXISTING_COUNT}</div></div>
          <div className="metric"><div className="metric-k">Km</div><div className="metric-v">{(window.EXISTING_KM||0).toFixed(0)}</div></div>
          <div className="metric"><div className="metric-k">Componentes conexos</div><div className="metric-v">{window.NET_COMPONENTS_COUNT || "—"}</div></div>
          <div className="metric"><div className="metric-k">Comunas</div><div className="metric-v">{Object.keys(window.EXISTING_COMUNA_KM || {}).length}</div></div>
        </div>
        <div className="assumption" style={{ margin: "10px 0 0" }}>
          La red base está fragmentada en <b>{window.NET_COMPONENTS_COUNT || "—"} subredes inconexas</b>. Un viaje solo es viable si origen y destino acceden a la misma subred — por eso las ciclovías que unen componentes tienen valor de interconexión.
        </div>
      </Section>
    </>
  );
}

/* ---------- Parámetros (Fase 3 / criterios) ---------- */
function DemandaModeloSection() {
  const [t, setTweak] = window.useDemandaParams();
  return (
    <Section
      title="Modelo de demanda · supuestos"
      infoKey="sec_demandaSupuestos"
      desc="Coeficientes del logit bici (ciclo_todo_chile 41, Biogeme). Modificar solo para análisis de sensibilidad; los cambios reevaluan los ciclistas inducidos de todos los proyectos."
    >
      <SliderField label="β ciclovías (por km en 500 m)" value={+t.dm_bCiclo} min={0} max={0.3} step={0.005}
                   onChange={v => setTweak("dm_bCiclo", v)} />
      <SliderField label="Ajuste de calibración (ASC)" value={+t.dm_ascAjuste} min={-1} max={1} step={0.05}
                   onChange={v => setTweak("dm_ascAjuste", v)} />
      <SliderField label="Escolaridad media (respaldo)" value={+t.dm_escolaridad} min={8} max={16} step={0.1} unit=" años"
                   onChange={v => setTweak("dm_escolaridad", v)} />
      <SliderField label="Desnivel medio |Δh| (respaldo)" value={+t.dm_absAltura} min={0} max={150} step={2.5} unit=" m"
                   onChange={v => setTweak("dm_absAltura", v)} />
      <SliderField label="Radio de influencia" value={+t.dm_radio} min={300} max={800} step={50} unit=" m"
                   onChange={v => setTweak("dm_radio", v)} />
      <button
        className="btn btn-ghost"
        style={{ marginTop: 8, width: "100%" }}
        onClick={() => setTweak({ dm_bCiclo: 0.13, dm_ascAjuste: 0, dm_escolaridad: 13, dm_absAltura: 40.5, dm_radio: 500 })}
      >Restaurar coeficientes estimados</button>
    </Section>
  );
}

function ParametrosSection({ params, onParamChange, modo, onApplyModo }) {
  return (
    <>
      <Section title="Umbrales de beneficio" desc="Una unidad poblacional se considera beneficiada cuando se cumplen las condiciones activas (Vega, Greene & Ortúzar, 2024). Todos los parámetros disparan reevaluación del motor.">
        <SliderField
          infoKey="um_distOrigen"
          label="Acceso origen a red"
          value={params.distOrigen} min={200} max={1500} step={50} unit=" m"
          onChange={v => onParamChange("distOrigen", v)}
        />
        <SliderField
          infoKey="um_distDestino"
          label="Acceso destino a red"
          value={params.distDestino} min={200} max={1500} step={50} unit=" m"
          onChange={v => onParamChange("distDestino", v)}
        />
        <SliderField
          infoKey="um_connectTol"
          label="Tolerancia de empalme entre ejes"
          value={params.connectTol} min={50} max={500} step={25} unit=" m"
          onChange={v => onParamChange("connectTol", v)}
        />
        <SliderField
          infoKey="um_habThreshold"
          label="Cobertura mínima destino"
          value={params.habThreshold} min={0} max={100} step={5} unit="%"
          onChange={v => onParamChange("habThreshold", v)}
        />
        <SliderField
          infoKey="um_porcProtegido"
          label="% protegido mínimo del viaje"
          value={params.porcProtegido || 0} min={0} max={100} step={5} unit="%"
          onChange={v => onParamChange("porcProtegido", v)}
        />
        <SliderField
          infoKey="um_aproxFinal"
          label="Aproximación final sin infraestructura"
          value={params.aproxFinal || 0} min={0} max={1500} step={50} unit=" m"
          onChange={v => onParamChange("aproxFinal", v)}
        />
        <SliderField
          infoKey="um_tiempoMax"
          label="Tiempo máximo de viaje"
          value={params.tiempoMax || 0} min={0} max={120} step={5} unit=" min"
          onChange={v => onParamChange("tiempoMax", v)}
        />
        <div className="assumption" style={{ margin: "10px 0 0" }}>
          <b>Todos los parámetros están activos.</b> % protegido exige calidad de infraestructura en la subred del viaje; aproximación final amplía el acceso a destino; tiempo máximo (con la velocidad de referencia) descarta pares origen-destino demasiado lejanos. Valor 0 = sin exigencia/límite.
        </div>
      </Section>

      <Section title="Comportamiento del ciclista" infoKey="sec_perfil">
        <div className="field">
          <div className="field-label"><span>Perfil de usuario</span></div>
          <select className="select" value={params.perfil || "general"} onChange={e => onParamChange("perfil", e.target.value)}>
            <option value="general">Ciclista general (solo red de bajo estrés)</option>
            <option value="experto">Experto (usa toda la red, incl. pilotos y zonas 30)</option>
          </select>
          <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.45 }}>
            {params.perfil === "experto"
              ? "La red base incluye los 601 ejes catastrados, incluidas ciclovías piloto, zonas 30 y tramos sin clasificar."
              : "La red base excluye ciclovías piloto/temporales, zonas 30 y tramos sin clasificar (infraestructura de mayor estrés o transitoria)."}
          </div>
        </div>
        <div className="field" style={{ marginTop: 10 }}>
          <div className="field-label"><span>Velocidad de referencia</span></div>
          <select className="select" value={String(params.velRef || 15)} onChange={e => onParamChange("velRef", +e.target.value)}>
            <option value="12">12 km/h (urbano denso)</option>
            <option value="15">15 km/h (estándar)</option>
            <option value="18">18 km/h (segregada)</option>
            <option value="20">20 km/h (experto)</option>
          </select>
          <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.45 }}>
            Convierte el tiempo máximo de viaje en radio máximo origen-destino{(params.tiempoMax || 0) > 0 ? ` (actual: ${(((params.velRef || 15) * params.tiempoMax) / 60).toFixed(1)} km)` : " (sin efecto mientras el tiempo máximo sea 0)"}.
          </div>
        </div>
      </Section>

      <Section title="Modo de priorización" infoKey="sec_modo">
        <div className="field">
          <div className="field-label"><span>Criterio activo</span></div>
          <select className="select" value={modo || "multicriterio"} onChange={e => onApplyModo && onApplyModo(e.target.value)}>
            <option value="multicriterio">Multicriterio ponderado</option>
            <option value="poblacion">Solo población marginal</option>
            <option value="costoOD">Solo reducción costo OD</option>
            <option value="equidad">Solo equidad territorial</option>
            <option value="continuidad">Solo continuidad de red</option>
            <option value="demanda">Solo demanda OD habilitada</option>
            <option value="ciclistas">Solo ciclistas inducidos (logit)</option>
            <option value="fractal">Solo conectividad fractal (Alameda)</option>
            <option value="seguridad">Solo seguridad vial</option>
            <option value="intermodal">Solo intermodalidad bici-metro</option>
            <option value="costoInv">Solo eficiencia económica</option>
          </select>
          <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.45 }}>
            {modo && modo !== "multicriterio"
              ? "Ranking por criterio único: el criterio elegido pesa 100% y el resto 0. Los pesos del panel Ranking se actualizan en consecuencia."
              : "Ranking por suma ponderada de todos los criterios según los pesos del panel Ranking (escenarios o ajuste manual)."}
          </div>
        </div>
      </Section>

      <DemandaModeloSection />
    </>
  );
}

/* ---------- Conectividad fractal (red dendrítica desde la Alameda) ---------- */
function FractalViewSection({ fractalView, onFractalView, lockedIds, onLockProject, onUnlockProject, ranking }) {
  const GRADO_COLOR = { 0: "#1d3a8a", 1: "#c62828", 2: "#e0561d", 3: "#e8a13c" };
  const colorOf = g => g == null ? "#b7c0ca" : (GRADO_COLOR[g] || "#d4c48f");
  // Vista fractal: escalas visibles (metropolitanas apagadas por defecto)
  const [fracMetro, setFracMetro] = useState(false);
  const [fracLocal, setFracLocal] = useState(true);
  const rk = ranking || [];
  const locked = lockedIds || [];
  // Candidatos de grado 1: los que TOCAN la raíz actual (Alameda + priorizados),
  // ordenados por score del escenario vigente. Al priorizar uno, la raíz crece.
  const candidatosAll = rk.filter(p => p.gradoSeparacion === 1 && !locked.includes(p.id));
  const candMetro = candidatosAll.filter(p => p.escala === "Metropolitana");
  const candLocal = candidatosAll.filter(p => p.escala !== "Metropolitana");
  const dist = window.FRACTAL_DIST || {};
  const grados = [0, 1, 2, 3].filter(g => dist[g]);
  const lejanos = Object.keys(dist).filter(k => k !== "aislado" && +k >= 4).reduce((a, k) => a + dist[k], 0);

  React.useEffect(() => {
    window.FRACTAL_ESCALAS = { metro: fracMetro, local: fracLocal };
    window.dispatchEvent(new CustomEvent("eva:fractal-escalas"));
  }, [fracMetro, fracLocal]);

  return (
    <Section
      title="Conectividad fractal"
      infoKey="crit_fractal"
      meta={fractalView && candidatosAll.length ? `${candidatosAll.length} candidatos` : ""}
      desc="Colorea la cartera por su distancia topológica a la Avenida Alameda (raíz). Cada eje que priorizas se funde con la raíz, y sus vecinos pasan a grado 1: la red crece como afluentes de un río."
    >
      <button
        className={"hdr-btn" + (fractalView ? " primary" : "")}
        style={{ width: "100%", justifyContent: "center", marginBottom: 12 }}
        onClick={() => onFractalView(!fractalView)}
      >
        <Ico name="network" /> {fractalView ? "Vista fractal activa" : "Activar vista fractal"}
      </button>

      {fractalView && (
        <>
          <div className="section-title" style={{ margin: "0 0 8px", fontSize: 10 }}>Escalas visibles</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
            <label className="fractal-pick" style={{ cursor: "pointer" }}>
              <input type="checkbox" checked={fracMetro} onChange={e => setFracMetro(e.target.checked)} style={{ margin: 0, flexShrink: 0 }} />
              <i className="fp-sw" style={{ background: colorOf(1), boxShadow: "0 0 0 2px #1a1d24" }}></i>
              <b className="fp-name">Metropolitanas · troncales</b>
            </label>
            <label className="fractal-pick" style={{ cursor: "pointer" }}>
              <input type="checkbox" checked={fracLocal} onChange={e => setFracLocal(e.target.checked)} style={{ margin: 0, flexShrink: 0 }} />
              <i className="fp-sw" style={{ background: colorOf(1) }}></i>
              <b className="fp-name">Comunales e intercomunales</b>
            </label>
          </div>

          <div className="section-title" style={{ margin: "12px 0 8px", fontSize: 10 }}>Distribución por grado</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {grados.map(g => (
              <div key={g} style={{ display: "grid", gridTemplateColumns: "14px 1fr auto", gap: 8, alignItems: "center", fontSize: 11.5 }}>
                <span style={{ width: 14, height: 5, borderRadius: 2, background: colorOf(g) }}></span>
                <span style={{ color: "var(--ink-1)" }}>{g === 0 ? "Tronco (red existente + priorizados)" : `Grado ${g}`}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-2)" }}>{dist[g]}</span>
              </div>
            ))}
            {lejanos > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "14px 1fr auto", gap: 8, alignItems: "center", fontSize: 11.5 }}>
                <span style={{ width: 14, height: 5, borderRadius: 2, background: "#d4c48f" }}></span>
                <span style={{ color: "var(--ink-2)" }}>Grado 4+</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-2)" }}>{lejanos}</span>
              </div>
            )}
            {dist["aislado"] > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "14px 1fr auto", gap: 8, alignItems: "center", fontSize: 11.5 }}>
                <span style={{ width: 14, height: 5, borderRadius: 2, background: "#b7c0ca" }}></span>
                <span style={{ color: "var(--ink-3)" }}>Aislados</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-3)" }}>{dist["aislado"]}</span>
              </div>
            )}
          </div>

          <div className="section-title" style={{ margin: "14px 0 8px", fontSize: 10 }}>
            Siguiente a priorizar · grado 1
          </div>
          {candidatosAll.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--ink-3)", lineHeight: 1.5 }}>
              No hay ejes de grado 1 disponibles. Activa la vista o revisa el universo de cartera.
            </div>
          ) : (
            <>
              {candMetro.length > 0 && fracMetro && (
                <>
                  <div style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>
                    Metropolitanas · troncales ({candMetro.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                    {candMetro.map(p => (
                      <button
                        key={p.id}
                        className="fractal-pick"
                        title={`Priorizar ${p.nombre} — se funde con la raíz`}
                        onClick={() => onLockProject && onLockProject(p.id)}
                      >
                        <i className="fp-sw" style={{ background: colorOf(1), boxShadow: "0 0 0 2px #1a1d24" }}></i>
                        <b className="fp-name">{p.nombre}</b>
                        <em className="fp-score">{((p.score || 0) * 100).toFixed(0)}</em>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {candLocal.length > 0 && fracLocal && (
                <>
                  <div style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 6px" }}>
                    Comunales e intercomunales ({candLocal.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {candLocal.map(p => (
                      <button
                        key={p.id}
                        className="fractal-pick"
                        title={`Priorizar ${p.nombre} — se funde con la raíz`}
                        onClick={() => onLockProject && onLockProject(p.id)}
                      >
                        <i className="fp-sw" style={{ background: colorOf(1) }}></i>
                        <b className="fp-name">{p.nombre}</b>
                        <em className="fp-score">{((p.score || 0) * 100).toFixed(0)}</em>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {locked.length > 0 && (
            <>
              <div className="section-title" style={{ margin: "14px 0 8px", fontSize: 10 }}>
                Raíz ampliada · {locked.length} priorizado{locked.length === 1 ? "" : "s"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {locked.map(id => {
                  const p = rk.find(x => x.id === id);
                  return (
                    <button
                      key={id}
                      className="fractal-pick is-root"
                      title="Quitar de la priorización"
                      onClick={() => onUnlockProject && onUnlockProject(id)}
                    >
                      <i className="fp-sw" style={{ background: colorOf(0) }}></i>
                      <b className="fp-name">{p ? p.nombre : id}</b>
                      <em className="fp-x">✕</em>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </Section>
  );
}

/* ---------- Redes aisladas (componentes conexos a distancia variable) ---------- */
function NetViewSection({ netView, onNetActive, onNetDist }) {
  const r = netView.result;
  const active = netView.active;
  const topComps = r ? r.comps.slice(0, 10) : [];
  const restKm = r ? r.comps.slice(10).reduce((a, c) => a + c.km, 0) : 0;

  return (
    <Section
      title="Redes aisladas"
      infoKey="sec_redes"
      meta={active && r ? `${r.count} subredes` : ""}
      desc="Colorea la red existente según subredes inconexas entre sí. Dos ejes pertenecen a la misma subred si se aproximan a menos de la distancia de conexión."
    >
      <button
        className={"hdr-btn" + (active ? " primary" : "")}
        style={{ width: "100%", justifyContent: "center", marginBottom: 12 }}
        onClick={() => onNetActive(!active)}
      >
        <Ico name="network" /> {active ? "Vista de subredes activa" : "Activar vista de subredes"}
      </button>

      {active && (
        <>
          <SliderField
            label="Distancia de conexión"
            value={netView.dist} min={100} max={5000} step={100} unit=" m"
            onChange={onNetDist}
          />

          {!r && (
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
              Calculando subredes…
            </div>
          )}

          {r && (
            <>
              <div className="section-title" style={{ margin: "12px 0 8px", fontSize: 10 }}>
                Subredes principales (por km)
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {topComps.map(c => (
                  <div key={c.id} style={{ display: "grid", gridTemplateColumns: "14px 1fr auto auto", gap: 8, alignItems: "center", fontSize: 11.5 }}>
                    <span style={{ width: 14, height: 5, borderRadius: 2, background: c.color }}></span>
                    <span style={{ color: "var(--ink-1)", fontWeight: 500 }}>Subred {c.rank}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-2)", whiteSpace: "nowrap" }}>{fmtN(c.km, 1)} km</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-4)", fontSize: 10.5, whiteSpace: "nowrap" }}>{c.feats} ejes</span>
                  </div>
                ))}
                {r.comps.length > 10 && (
                  <div style={{ display: "grid", gridTemplateColumns: "14px 1fr auto", gap: 8, alignItems: "center", fontSize: 11 }}>
                    <span style={{ width: 14, height: 5, borderRadius: 2, background: "var(--line-strong)" }}></span>
                    <span style={{ color: "var(--ink-3)" }}>+ {r.comps.length - 10} subredes menores</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-3)", whiteSpace: "nowrap" }}>{fmtN(restKm, 1)} km</span>
                  </div>
                )}
              </div>

              <div className="section-title" style={{ margin: "14px 0 8px", fontSize: 10 }}>
                Proyectos que interconectan subredes
              </div>
              {r.connectors.length === 0 && (
                <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
                  Ningún proyecto une ≥2 subredes a esta distancia.
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {r.connectors.slice(0, 8).map(c => (
                  <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 11.5 }}>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700,
                      background: "var(--accent-soft)", color: "var(--accent-deep)",
                      padding: "1px 6px", borderRadius: 3, flexShrink: 0,
                    }}>{c.connects} redes</span>
                    <span style={{ flex: 1, color: "var(--ink-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nombre}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-3)", fontSize: 10.5, flexShrink: 0 }}>{fmtN(c.kmUnidos)} km</span>
                  </div>
                ))}
                {r.connectors.length > 8 && (
                  <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                    + {r.connectors.length - 8} proyectos conectores más
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </Section>
  );
}

window.LeftPanel = LeftPanel;
