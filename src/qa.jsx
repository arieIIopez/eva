/* ============================================================
   EVA · Módulo de Control de Calidad de Datos (QA)
   ------------------------------------------------------------
   window.EVA_QA()        → objeto reporte
   window.exportQA("json"|"csv")
   Conteos por identificador único (Set) para no duplicar.
============================================================ */

(function () {
  const RM_BBOX = { minLng: -71.7, maxLng: -69.8, minLat: -34.4, maxLat: -32.9 };

  function inBBox(lng, lat) {
    return lng >= RM_BBOX.minLng && lng <= RM_BBOX.maxLng && lat >= RM_BBOX.minLat && lat <= RM_BBOX.maxLat;
  }

  function lineCoords(geom) {
    if (!geom) return [];
    if (geom.type === "LineString") return geom.coordinates;
    if (geom.type === "MultiLineString") return geom.coordinates.flat();
    return [];
  }

  function geomKm(geom) {
    const KX = 92.6, KY = 111;
    let km = 0;
    const segs = geom && geom.type === "MultiLineString" ? geom.coordinates : (geom ? [geom.coordinates] : []);
    for (const seg of segs) {
      for (let i = 0; i < seg.length - 1; i++) {
        const dx = (seg[i + 1][0] - seg[i][0]) * KX;
        const dy = (seg[i + 1][1] - seg[i][1]) * KY;
        km += Math.sqrt(dx * dx + dy * dy);
      }
    }
    return km;
  }

  function dupIds(arr, getId) {
    const seen = new Set(), dup = new Set();
    for (const x of arr) {
      const id = getId(x);
      if (id == null) continue;
      if (seen.has(id)) dup.add(id); else seen.add(id);
    }
    return [...dup];
  }

  window.EVA_QA = function () {
    const t0 = performance.now();
    const projects = window.PROJECTS || [];
    const projFC = window.projectsFC ? window.projectsFC.features : [];
    const existFC = window.existingFC ? window.existingFC.features : [];
    const hexes = window.populationFC ? window.populationFC.features : [];
    // EDU_SEDES son features GeoJSON: los atributos viven en .properties
    const sedes = (window.EDU_SEDES || []).map(s => s.properties ? s.properties : s);
    const comunas = window.OD_COMUNAS || [];

    // ---- Totales (conteo por id único) ----
    const projIds = new Set(projects.map(p => p.id));
    const hexIds = new Set(hexes.map(h => h.properties.id));
    const sedeIds = new Set(sedes.map(s => s.id != null ? s.id : (s.inst + "|" + s.sede)));

    const kmCartera = projects.reduce((a, p) => a + (+p.km || 0), 0);
    const pobTotal = hexes.reduce((a, h) => a + (+h.properties.pob || 0), 0);
    const odTotal = window.OD_TOTAL_FLOW || hexes.reduce((a, h) => {
      const dv = h.properties.dv; return a + (dv ? Object.values(dv).reduce((x, y) => x + (+y || 0), 0) : 0);
    }, 0);
    const matriculaTotal = window.EDU_TOTAL_MAT != null ? window.EDU_TOTAL_MAT : sedes.reduce((a, s) => a + (+s.matricula || 0), 0);

    // Población por comuna (código) desde los hexes — fuente única para QA
    const pobByComuna = {};
    for (const h of hexes) {
      const c = h.properties.comuna;
      if (c == null) continue;
      pobByComuna[c] = (pobByComuna[c] || 0) + (+h.properties.pob || 0);
    }

    // ---- Problemas ----
    const sinComuna = projects.filter(p => !p.comunas || String(p.comunas).trim() === "").map(p => p.id);
    // Con overlay contra límites oficiales la comuna deja de ser una aproximación:
    // solo advierte si la asignación vino del respaldo (vecino OD más cercano).
    const comunaInferida = projects.filter(p => p._comunaFuente === "inferida" && p.fuente_comuna !== "overlay_limites_oficiales").map(p => p.id);
    const comunaOficial = projects.filter(p => p.fuente_comuna === "overlay_limites_oficiales").map(p => p.id);
    const lenCero = projects.filter(p => (+p.km || 0) <= 0).map(p => p.id);
    const costoCero = projects.filter(p => (+p.costo || 0) <= 0).map(p => p.id);

    // geometrías vacías / inválidas / fuera de bbox
    let geomVacias = 0, geomInvalidas = 0, fueraBBox = 0;
    let difLongitud = []; // |km geométrico − km declarado| > 10%
    for (const f of projFC) {
      const cs = lineCoords(f.geometry);
      if (!cs.length) { geomVacias++; continue; }
      const bad = cs.some(c => !Array.isArray(c) || c.length < 2 || isNaN(c[0]) || isNaN(c[1]));
      if (bad) { geomInvalidas++; continue; }
      if (cs.some(c => !inBBox(c[0], c[1]))) fueraBBox++;
      const gkm = geomKm(f.geometry);
      const dkm = +f.properties.km || 0;
      if (dkm > 0 && Math.abs(gkm - dkm) / dkm > 0.10) {
        difLongitud.push({ id: f.properties.id, declarado_km: +dkm.toFixed(2), geometrico_km: +gkm.toFixed(2), dif_pct: +((gkm - dkm) / dkm * 100).toFixed(1) });
      }
    }

    const hexSinPob = hexes.filter(h => (+h.properties.pob || 0) <= 0).length;
    const hexSinOD = hexes.filter(h => { const dv = h.properties.dv; return !dv || Object.keys(dv).length === 0; }).length;
    const sedesSinMat = sedes.filter(s => (+s.matricula || 0) <= 0).length;

    const comunasSinPob = comunas.filter(c => !(pobByComuna[c.code] > 0)).map(c => c.name || c.code);
    const cov = window.COVERAGE_BY_COMUNA || {};
    const comunasSinCobertura = comunas.filter(c => cov[c.code] == null).map(c => c.name || c.code);

    // duplicados
    const dups = {
      proyectos: dupIds(projects, p => p.id),
      existentes: dupIds(existFC, f => f.properties && (f.properties.id != null ? f.properties.id : f.properties.OBJECTID)),
      hexes: dupIds(hexes, h => h.properties.id),
      sedes: dupIds(sedes, s => s.id != null ? s.id : (s.inst + "|" + s.sede)),
      comunas: dupIds(comunas, c => c.code),
    };

    const report = {
      _provenance: window.evaProvenance ? window.evaProvenance(window.DEFAULT_PARAMS, window.DEFAULT_WEIGHTS) : {},
      totales: {
        proyectos: projIds.size,
        km_cartera: +kmCartera.toFixed(1),
        ejes_existentes: window.EXISTING_COUNT || existFC.length,
        km_red_existente: +(window.EXISTING_KM || 0).toFixed(1),
        hexes_OD: hexIds.size,
        poblacion_total: pobTotal,
        viajes_OD_total: Math.round(odTotal),
        sedes_educacion_superior: sedeIds.size,
        matricula_total: matriculaTotal,
        comunas: comunas.length,
        siniestros_ciclistas: window.SIN_TOTAL || 0,
        siniestros_fallecidos: (window.SIN_VICTIMS || {}).fall || 0,
        siniestros_graves: (window.SIN_VICTIMS || {}).grav || 0,
        monumentos_nacionales: window.MON_TOTAL || 0,
        ferias_libres: window.FER_TOTAL || 0,
        estaciones_metro: window.METRO_TOTAL || 0,
        paraderos_bus: window.BUS_TOTAL || 0,
        parques: window.PARQUES_TOTAL || 0,
      },
      problemas: {
        proyectos_sin_comuna: sinComuna,
        proyectos_comuna_inferida: comunaInferida,
        proyectos_comuna_asignada_limites_oficiales: comunaOficial,
        proyectos_longitud_cero: lenCero,
        proyectos_costo_cero: costoCero,
        ids_internos_duplicados: dups,
        ids_originales_duplicados_red_existente: window.EXISTING_DUP_ORIG || [],
        geometrias_vacias: geomVacias,
        geometrias_invalidas: geomInvalidas,
        coordenadas_fuera_area: fueraBBox,
        hexes_sin_poblacion: hexSinPob,
        hexes_sin_vector_OD: hexSinOD,
        sedes_sin_matricula: sedesSinMat,
        comunas_sin_poblacion: comunasSinPob,
        comunas_sin_cobertura: comunasSinCobertura,
        diferencia_longitud_geom_vs_declarada: difLongitud,
      },
      ms: +(performance.now() - t0).toFixed(0),
    };

    // resumen de severidad — ids_originales duplicados NO son críticos si hay id_interno único
    const pr = report.problemas;
    const totalDupsInternos = Object.values(dups).reduce((a, x) => a + x.length, 0);
    const criticos = pr.geometrias_invalidas + pr.proyectos_longitud_cero.length + totalDupsInternos + pr.proyectos_sin_comuna.length;
    const advertencias = pr.proyectos_comuna_inferida.length + pr.ids_originales_duplicados_red_existente.length + pr.coordenadas_fuera_area + pr.diferencia_longitud_geom_vs_declarada.length;
    report.resumen = {
      issues_criticos: criticos,
      issues_advertencia: advertencias,
      ok: criticos === 0,
      estado: criticos > 0 ? "NO CONFORME" : (advertencias > 0 ? "CONFORME CON ADVERTENCIAS" : "CONFORME"),
    };

    if (window.evaLog) {
      const r = report.resumen;
      window.evaLog(r.ok ? "ok" : "error",
        `[QA] ${r.estado} · ${report.totales.proyectos} proyectos · ${report.totales.sedes_educacion_superior} sedes · ${r.issues_criticos} crítico(s) · ${r.issues_advertencia} advertencia(s) (${report.ms} ms)`);
    }
    return report;
  };

  function qaToCSV(rep) {
    const rows = [["seccion", "campo", "valor"]];
    Object.entries(rep.totales).forEach(([k, v]) => rows.push(["totales", k, v]));
    Object.entries(rep.problemas).forEach(([k, v]) => {
      const val = Array.isArray(v) ? (v.length + (v.length ? " · " + v.slice(0, 20).map(x => typeof x === "object" ? x.id : x).join("; ") : "")) : (typeof v === "object" ? JSON.stringify(v) : v);
      rows.push(["problemas", k, val]);
    });
    Object.entries(rep.resumen).forEach(([k, v]) => rows.push(["resumen", k, v]));
    Object.entries(rep._provenance).forEach(([k, v]) => rows.push(["procedencia", k, v]));
    return "\uFEFF" + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  }

  window.exportQA = function (fmt) {
    const rep = window.EVA_QA();
    const stamp = new Date().toISOString().slice(0, 10);
    const content = fmt === "csv" ? qaToCSV(rep) : JSON.stringify(rep, null, 2);
    const blob = new Blob([content], { type: fmt === "csv" ? "text/csv;charset=utf-8" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `EVA_QA_${stamp}.${fmt === "csv" ? "csv" : "json"}`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
    return rep;
  };

  /* ============================================================
     COMPLETAR COMUNAS FALTANTES (req 2.4) — inferencia espacial
     Para proyectos con campo `comunas` nulo/vacío: muestrea puntos
     sobre la geometría, asigna la comuna del hex OD más cercano,
     y guarda comunas intersectadas, comuna principal, % por comuna
     y la fuente (declarada vs inferida).
  ============================================================ */
  window.evaCompleteComunas = function () {
    const projects = window.PROJECTS || [];
    const projFC = window.projectsFC ? window.projectsFC.features : [];
    const hexes = window.populationFC ? window.populationFC.features : [];
    const comunaName = new Map((window.OD_COMUNAS || []).map(c => [c.code, c.name]));

    // ---- Overlay punto-en-polígono contra límites comunales oficiales (RM) ----
    // Fuente primaria de verdad cuando la capa está disponible; el vecino OD
    // más cercano queda como respaldo solo para tramos fuera de la RM o si la
    // capa no cargó.
    function pointInRing(pt, ring) {
      let inside = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
        const intersect = ((yi > pt[1]) !== (yj > pt[1])) &&
          (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    }
    function pointInPolygon(pt, poly) {
      if (!pointInRing(pt, poly[0])) return false;
      for (let k = 1; k < poly.length; k++) if (pointInRing(pt, poly[k])) return false;
      return true;
    }
    function comunaOficialAt(lng, lat) {
      const fc = window.COMUNAS_FC;
      if (!fc || !fc.features) return null;
      const pt = [lng, lat];
      for (const f of fc.features) {
        const g = f.geometry;
        if (!g) continue;
        if (g.type === "Polygon") { if (pointInPolygon(pt, g.coordinates)) return f.properties.COMUNA; }
        else if (g.type === "MultiPolygon") { for (const poly of g.coordinates) if (pointInPolygon(pt, poly)) return f.properties.COMUNA; }
      }
      return null;
    }

    if (!hexes.length) return { inferidos: 0 };

    // grilla espacial de hexes para vecino más cercano
    const CELL = 0.01; // ~1.1 km
    const grid = new Map();
    const key = (gx, gy) => gx + "|" + gy;
    for (const h of hexes) {
      const [lng, lat] = h.geometry.coordinates;
      const gx = Math.floor(lng / CELL), gy = Math.floor(lat / CELL);
      const k = key(gx, gy);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(h);
    }
    function nearestComuna(lng, lat) {
      const gx = Math.floor(lng / CELL), gy = Math.floor(lat / CELL);
      let best = null, bestD = Infinity;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        const arr = grid.get(key(gx + dx, gy + dy));
        if (!arr) continue;
        for (const h of arr) {
          const [hl, ht] = h.geometry.coordinates;
          const d = (hl - lng) * (hl - lng) + (ht - lat) * (ht - lat);
          if (d < bestD) { bestD = d; best = h.properties.comuna; }
        }
      }
      return best;
    }
    function coordsOf(geom) {
      if (!geom) return [];
      if (geom.type === "LineString") return geom.coordinates;
      if (geom.type === "MultiLineString") return geom.coordinates.flat();
      return [];
    }

    let inferidos = 0;
    for (const p of projects) {
      const declarada = p.comunas && String(p.comunas).trim() !== "" && p._comunaFuente !== "inferida" && p.fuente_comuna !== "overlay_automatico";
      if (declarada) {
        p._comunaFuente = "original"; p.comuna_inferida = false; p.fuente_comuna = "original";
        continue;
      }
      const geom = (projFC.find(f => f.properties.id === p.id) || {}).geometry;
      const cs = coordsOf(geom);
      if (!cs.length) continue;
      // recorrer la línea acumulando longitud por comuna del hex más cercano a cada segmento
      const KX = 92.6, KY = 111;
      const lenByComuna = new Map();
      let totalLen = 0;
      for (let i = 0; i < cs.length - 1; i++) {
        const a = cs[i], b = cs[i + 1];
        const segKm = Math.sqrt(((b[0] - a[0]) * KX) ** 2 + ((b[1] - a[1]) * KY) ** 2);
        if (segKm <= 0) continue;
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const oficial = comunaOficialAt(mid[0], mid[1]);
        if (oficial) {
          lenByComuna.set("OFICIAL:" + oficial, (lenByComuna.get("OFICIAL:" + oficial) || 0) + segKm);
          totalLen += segKm;
          continue;
        }
        const c = nearestComuna(mid[0], mid[1]);
        if (c == null) continue;
        lenByComuna.set(c, (lenByComuna.get(c) || 0) + segKm);
        totalLen += segKm;
      }
      if (!lenByComuna.size || totalLen <= 0) continue;
      const sorted = [...lenByComuna.entries()].sort((a, b) => b[1] - a[1]);
      let nombres = sorted.map(([code]) => typeof code === "string" && code.startsWith("OFICIAL:") ? code.slice(8) : (comunaName.get(code) || ("Comuna " + code)));
      if (window.CANON_COMUNA) nombres = nombres.map(n => window.CANON_COMUNA(n) || n);
      p.comunas = nombres.join(" · ");
      p.comunas_intersectadas = nombres;
      p.comuna_principal = nombres[0];
      p.longitud_por_comuna = sorted.map(([code, km], i) => ({ comuna: nombres[i], km: +km.toFixed(2) }));
      p.porcentaje_longitud_por_comuna = sorted.map(([code, km], i) => ({ comuna: nombres[i], pct: +(km / totalLen * 100).toFixed(1) }));
      p.comunasDetalle = p.porcentaje_longitud_por_comuna.map(x => ({ nombre: x.comuna, pct: x.pct }));
      p.comuna_inferida = true;
      p._comunaFuente = "inferida";
      p.fuente_comuna = window.COMUNAS_FC ? "overlay_limites_oficiales" : "overlay_automatico";
      p.advertencia_comuna = window.COMUNAS_FC
        ? "Comuna(s) inferida(s) por overlay punto-en-polígono con los límites comunales oficiales (RM)."
        : "Comuna(s) inferida(s) por overlay con la grilla OD (vecino más cercano por segmento); aproximación, no overlay con límites administrativos oficiales.";
      const fc = projFC.find(f => f.properties.id === p.id);
      if (fc) { fc.properties.comunas = p.comunas; fc.properties.comuna_principal = p.comuna_principal; fc.properties.fuente_comuna = p.fuente_comuna; }
      // Persistir en los datos crudos: el motor se re-ejecuta desde FC_RAW al cambiar
      // categoría/parámetros y reconstruye las propiedades — sin esto, la inferencia se pierde.
      for (const cat of Object.values(window.FC_RAW || {})) {
        const rf = (cat.features || []).find(f => f.properties.id === p.id);
        if (rf) { rf.properties.comunas = p.comunas; rf.properties.comuna_principal = p.comuna_principal; rf.properties.fuente_comuna = p.fuente_comuna; rf.properties._comunaFuente = "inferida"; }
      }
      inferidos++;
    }
    if (window.evaLog) window.evaLog(inferidos ? "ok" : "info", `[datos] comunas completadas: ${inferidos} proyectos (${window.COMUNAS_FC ? "overlay punto-en-polígono con límites comunales oficiales" : "vecino OD más cercano"})`);
    return { inferidos };
  };
})();
