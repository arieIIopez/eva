/* ============================================================
   EvaCiclo · datos
   - Cartera real: GORE PMC Comunal/Intercomunal/Metropolitana (120 ejes)
   - Red existente y población: SINTÉTICAS hasta que el usuario provea
============================================================ */

const STGO_CENTER = [-70.6483, -33.4569];

/* ============================================================
   RED EXISTENTE (placeholder hasta que loadData() la reemplace)
============================================================ */
function line(coords) {
  const out = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const [a, b] = [coords[i], coords[i + 1]];
    out.push(a);
    const steps = 3;
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      const jx = (Math.sin(i * 2.3 + s) * 0.0008);
      const jy = (Math.cos(i * 1.7 + s) * 0.0006);
      out.push([a[0] + (b[0] - a[0]) * t + jx, a[1] + (b[1] - a[1]) * t + jy]);
    }
  }
  out.push(coords[coords.length - 1]);
  return out;
}

// Capa inicial vacía — se sobreescribe con la real al cargar
let existingFC = { type: "FeatureCollection", features: [] };
const EXISTING_RAW = [];

/* ============================================================
   POBLACIóN OD
   - Se carga dinámicamente desde data/od_hex.geojson
   - 1.589 hexágonos de ~600m con población + flujos OD agregados
============================================================ */
let populationFC = { type: "FeatureCollection", features: [] };
let TOTAL_POB = 0;
let POB_BASE = 0;

/* ============================================================
   CARTERA REAL — carga async desde data/proyectos_pmc.geojson
============================================================ */

// Helpers
function extractFirstCoord(geom) {
  if (geom.type === "LineString") return geom.coordinates[0];
  if (geom.type === "MultiLineString") return geom.coordinates[0][0];
  return null;
}

window.PROJECTS = [];
window.projectsFC = { type: "FeatureCollection", features: [] };
window.existingFC = existingFC;
window.EXISTING_COUNT = 0;
window.EXISTING_KM = 0;

/* ============================================================
   PRIORIDAD DE INVERSIÓN GORE POR COMUNA
   Ranking de inversión comunal del Gobierno Regional (CLP).
   cat_inv → score: Alta 1.0 · Media alta 0.75 · Media 0.5 ·
   Media baja 0.25 · Baja 0. Comunas sin ranking → 0.5 (neutro).
============================================================ */
const GORE_INV_RAW = [
  [13130, "San Miguel", 19909886000, "Media alta"],
  [13118, "Macul", 14217665930, "Media"],
  [13119, "Maipú", 21806128000, "Alta"],
  [13123, "Providencia", 1302895000, "Baja"],
  [13131, "San Ramón", 11773103000, "Media"],
  [13120, "Ñuñoa", 13747607000, "Media"],
  [13102, "Cerrillos", 12480854000, "Media"],
  [13113, "La Reina", 7855043000, "Media baja"],
  [13105, "El Bosque", 17957894529, "Media alta"],
  [13108, "Independencia", 10148295000, "Media baja"],
  [13117, "Lo Prado", 18445373000, "Media alta"],
  [13127, "Recoleta", 9723992284, "Media baja"],
  [13128, "Renca", 22414113000, "Alta"],
  [13124, "Pudahuel", 5456381000, "Media baja"],
  [13107, "Huechuraba", 11889695671, "Media"],
  [13112, "La Pintana", 10246383044, "Media baja"],
  [13126, "Quinta Normal", 27236048000, "Alta"],
  [13111, "La Granja", 22806057480, "Alta"],
  [13201, "Puente Alto", 8736739000, "Media baja"],
  [13132, "Vitacura", 0, "Baja"],
  [13125, "Quilicura", 2847570000, "Baja"],
  [13101, "Santiago", 13625741643, "Media"],
  [13104, "Conchalí", 22816090000, "Alta"],
  [13109, "La Cisterna", 6345575000, "Media baja"],
  [13106, "Estación Central", 14424015000, "Media"],
  [13401, "San Bernardo", 15370002000, "Media"],
  [13115, "Lo Barnechea", 0, "Baja"],
  [13103, "Cerro Navia", 19208270000, "Media alta"],
  [13116, "Lo Espejo", 22136857000, "Alta"],
  [13110, "La Florida", 9728007000, "Media baja"],
  [13129, "San Joaquín", 10098176000, "Media baja"],
  [13121, "Pedro Aguirre Cerda", 13169088594, "Media"],
  [13114, "Las Condes", 0, "Baja"],
  [13122, "Peñalolén", 16630048000, "Media alta"],
];
const GORE_CAT_SCORE = { "Alta": 1, "Media alta": 0.75, "Media": 0.5, "Media baja": 0.25, "Baja": 0 };

window.loadProjects = async function() {
  const LOG = (lvl, m) => window.evaLog && window.evaLog(lvl, m);
  const tL0 = performance.now();
  LOG("step", "[datos] Cargando capas: cartera PMC, red SECTRA, población OD, diccionario, educación superior, siniestros ciclistas…");
  // URLs (con fallback para modo standalone via window.__resources)
  const R = window.__resources || {};
  const urls = {
    proyectos: R.proyectosPmc    || "data/proyectos_pmc.geojson",
    existente: R.cicloviasExistentes || "data/ciclovias_existentes.geojson",
    od:        R.odHex            || "data/od_hex.geojson",
    odDict:    R.odComunas        || "data/od_comunas.json",
    edu:       R.educacionSuperior || "data/educacion_superior.geojson",
    siniestros:R.siniestros       || "data/siniestros.geojson",
    monumentos:R.monumentos       || "data/monumentos.geojson",
    ferias:    R.ferias           || "data/ferias.geojson",
    metro:     R.metro            || "data/metro.geojson",
    busStops:  R.busStops         || "data/paraderos_bus.json",
    otras:     R.otrasCarteras     || "data/otras_carteras.geojson",
    parques:   R.parques           || "data/parques.geojson",
    manzanas:  R.manzanasPorHex    || "data/manzanas_por_hex.json",
    varsModelo: R.variablesModeloHex || "data/variables_modelo_hex.json",
    comunas:   R.comunasRM         || "data/comunas_rm.geojson",
  };
  // Carga PARALELA
  const [pResp, eResp, oResp, dResp, eduResp, sResp, mResp, fResp, mtResp, bsResp, ocResp, pqResp, mzResp, vmResp, cmResp] = await Promise.all([
    fetch(urls.proyectos),
    fetch(urls.existente),
    fetch(urls.od),
    fetch(urls.odDict),
    fetch(urls.edu),
    fetch(urls.siniestros),
    fetch(urls.monumentos),
    fetch(urls.ferias),
    fetch(urls.metro),
    fetch(urls.busStops),
    fetch(urls.otras),
    fetch(urls.parques),
    fetch(urls.manzanas),
    fetch(urls.varsModelo),
    fetch(urls.comunas),
  ]);
  const fc = await pResp.json();
  const existing = await eResp.json();
  const odFC = await oResp.json();
  const odDict = await dResp.json();
  const eduFC = await eduResp.json();
  const sinFC = await sResp.json();
  const monFC = await mResp.json();
  const ferFC = await fResp.json();
  const metroFC = await mtResp.json();
  const busData = await bsResp.json();
  const otrasFC = await ocResp.json();
  const parquesFC = await pqResp.json();
  const mzData = await mzResp.json();
  const vmData = await vmResp.json();
  const comunasFC = await cmResp.json();

  // ---- Límites comunales oficiales (Región Metropolitana) ----
  // Fuente: capa provista por el usuario (shapefile regional, EPSG:32719),
  // reproyectada a WGS84. Habilita overlay punto-en-polígono real para
  // completar comunas faltantes (reemplaza la aproximación por vecino OD
  // más cercano) y una capa visible de límites comunales.
  window.COMUNAS_FC = comunasFC;
  // Grupos territoriales: provincias (desde la capa oficial) + Gran Santiago (INE:
  // provincia de Santiago + San Bernardo + Puente Alto).
  const provGroups = {};
  for (const f of (comunasFC.features || [])) {
    const prov = (f.properties.PROVINCIA || "").trim();
    if (!prov) continue;
    const nombre = prov.charAt(0) + prov.slice(1).toLowerCase();
    (provGroups[nombre] = provGroups[nombre] || []).push(f.properties.COMUNA);
  }
  provGroups["Gran Santiago"] = [
    ...(provGroups["Santiago"] || []),
    "COLINA", "LAMPA", "PUENTE ALTO", "SAN BERNARDO",
    "CALERA DE TANGO", "PADRE HURTADO", "PEÑAFLOR", "TALAGANTE",
  ];
  window.GRUPOS_TERRITORIALES = provGroups;
  if (window.evaLog) window.evaLog("info", `[datos] límites comunales: ${(comunasFC.features || []).length} comunas (RM)`);

  // ---- Variables del modelo logit por hexágono ----
  // Join id_manzana→MANZENT (diccionario xlsx)→hex: escolaridad media y
  // desnivel |Δh| reales de la muestra de estimación, ponderados por ocupados.
  window.VARS_MODELO_HEX = (vmData && vmData.hexes) || {};
  if (window.evaLog) window.evaLog("info", `[datos] variables del modelo logit: ${Object.keys(window.VARS_MODELO_HEX).length.toLocaleString("es-CL")} hexágonos con escolaridad y desnivel observados (resto usa constantes RM)`);

  // ---- Diccionario de manzanas: MANZENT por hexágono ----
  // Recupera la identidad censal (código MANZENT) de las 66.873 manzanas que
  // alimentan los centroides OD, asignadas a su hexágono de agregación. Habilita
  // joins a nivel de manzana (censo 2024, modelos de transporte) y trazabilidad.
  window.MANZ_BY_HEX_RAW = mzData;
  window.MANZ_BY_HEX = new Map(Object.entries((mzData && mzData.hexes) || {}));
  window.MANZ_TOTAL = [...window.MANZ_BY_HEX.values()].reduce((a, l) => a + l.length, 0);
  if (window.evaLog) window.evaLog("info", `[datos] diccionario de manzanas: ${window.MANZ_TOTAL.toLocaleString("es-CL")} MANZENT asignadas a ${window.MANZ_BY_HEX.size.toLocaleString("es-CL")} hexágonos`);

  // ---- Sedes de educación superior (polos de atracción) ----
  window.EDU_FC = eduFC;
  window.EDU_SEDES = eduFC.features;
  window.EDU_TOTAL_MAT = eduFC.features.reduce((a, f) => a + (+f.properties.matricula || 0), 0);

  // ---- Siniestros ciclistas (CONASET 2020–2024) ----
  // Puntos de siniestros con participación de bicicletas. Severidad ponderada
  // (peso = 6·fallecidos + 3·graves + 2·menos graves + 1·leves, mín 1) alimenta
  // el criterio «Seguridad vial» del motor: un proyecto que recorre un corredor
  // con alta siniestralidad ciclista puntúa alto en seguridad.
  window.SINIESTROS_FC = sinFC;
  (function aggregateSiniestros() {
    const fs = sinFC.features || [];
    const byYear = {}, byComuna = {};
    let fall = 0, grav = 0, meng = 0, leve = 0, peso = 0;
    const sevCount = { fatal: 0, grave: 0, lesion: 0, danios: 0 };
    for (const f of fs) {
      const p = f.properties || {};
      fall += +p.fall || 0; grav += +p.grav || 0; meng += +p.meng || 0; leve += +p.leve || 0;
      peso += +p.peso || 0;
      if (p.severidad && sevCount[p.severidad] != null) sevCount[p.severidad]++;
      if (p.anio != null) byYear[p.anio] = (byYear[p.anio] || 0) + 1;
      const c = p.cut || "s_i";
      if (!byComuna[c]) byComuna[c] = { n: 0, peso: 0, fall: 0, grav: 0, nombre: p.comuna };
      byComuna[c].n++; byComuna[c].peso += +p.peso || 0; byComuna[c].fall += +p.fall || 0; byComuna[c].grav += +p.grav || 0;
    }
    window.SIN_TOTAL = fs.length;
    window.SIN_VICTIMS = { fall, grav, meng, leve };
    window.SIN_PESO_TOTAL = peso;
    window.SIN_BY_YEAR = byYear;
    window.SIN_BY_COMUNA = byComuna;
    window.SIN_SEV_COUNT = sevCount;
    window.SIN_YEARS = Object.keys(byYear).map(Number).filter(n => !isNaN(n)).sort();
    if (window.evaLog) window.evaLog("info", `[datos] siniestros ciclistas: ${fs.length} eventos ${window.SIN_YEARS[0] || ""}–${window.SIN_YEARS[window.SIN_YEARS.length - 1] || ""} · ${fall} fallecidos · ${grav} graves · peso severidad ${peso}`);
  })();

  // ---- Monumentos nacionales (CMN) ----
  // Capa de contexto patrimonial: criterio NEUTRO por defecto (peso 0). Se asocia a
  // cada proyecto por proximidad (≤300 m); el usuario puede darle peso negativo
  // (evitar) o positivo (acercar/conectar) en el panel de Ranking.
  window.MON_FC = monFC;
  (function aggregateMonumentos() {
    const fs = monFC.features || [];
    const byCat = {}, byComuna = {};
    for (const f of fs) {
      const p = f.properties || {};
      const cat = p.categoria || "Monumento";
      byCat[cat] = (byCat[cat] || 0) + 1;
      const c = p.comuna || "s_i";
      byComuna[c] = (byComuna[c] || 0) + 1;
    }
    window.MON_TOTAL = fs.length;
    window.MON_BY_CAT = byCat;
    window.MON_BY_COMUNA = byComuna;
    if (window.evaLog) window.evaLog("info", `[datos] monumentos nacionales: ${fs.length} puntos · ${Object.keys(byCat).length} categorías`);
  })();

  // ---- Ferias libres y persas (capa de contexto / compatibilidad de uso) ----
  // Segmentos de calle donde se instalan ferias en días determinados. Capa
  // INFORMATIVA: NO entra al motor de cálculo ni al puntaje. Cada proyecto
  // identifica cuántas ferias cruza su tramo y en qué días operan, para evaluar
  // compatibilidad de uso del espacio vial al diseñar la ciclovía.
  window.FERIAS_FC = ferFC;
  (function aggregateFerias() {
    const fs = ferFC.features || [];
    const byTipo = {}, byComuna = {}, byDay = {};
    const DAY_ORDER = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
    let puestos = 0;
    for (const f of fs) {
      const p = f.properties || {};
      byTipo[p.tipo || "Feria"] = (byTipo[p.tipo || "Feria"] || 0) + 1;
      byComuna[p.comuna || "s_i"] = (byComuna[p.comuna || "s_i"] || 0) + 1;
      puestos += +p.puestos || 0;
      for (const d of (p.dias || [])) byDay[d] = (byDay[d] || 0) + 1;
    }
    window.FER_TOTAL = fs.length;
    window.FER_BY_TIPO = byTipo;
    window.FER_BY_COMUNA = byComuna;
    window.FER_BY_DAY = DAY_ORDER.filter(d => byDay[d]).map(d => [d, byDay[d]]);
    window.FER_PUESTOS = puestos;
    if (window.evaLog) window.evaLog("info", `[datos] ferias libres: ${fs.length} ferias · ${Object.keys(byComuna).length} comunas · ${puestos.toLocaleString("es-CL")} puestos`);
  })();

  // ---- Clasificación ferias vs red ciclable existente ----
  // Relación espacial de cada feria con la red: cruza (intersecta un eje),
  // coincide (mismo eje, ≤20 m y paralela), paralela (≤80 m y mismo rumbo),
  // o sin ciclovía cercana. Alimenta color/leyenda/toggles de la capa.
  (function classifyFerias() {
    const linesOf = g => !g ? [] : g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : [];
    const KX = 92.6, KY = 111; // km por grado
    const exSegs = [];
    for (const f of existing.features || [])
      for (const line of linesOf(f.geometry))
        for (let i = 0; i < line.length - 1; i++) exSegs.push([line[i], line[i + 1]]);
    const CELL = 0.004;
    const grid = new Map();
    exSegs.forEach((s, idx) => {
      const x0 = Math.floor(Math.min(s[0][0], s[1][0]) / CELL), x1 = Math.floor(Math.max(s[0][0], s[1][0]) / CELL);
      const y0 = Math.floor(Math.min(s[0][1], s[1][1]) / CELL), y1 = Math.floor(Math.max(s[0][1], s[1][1]) / CELL);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
        const k = x + "|" + y;
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(idx);
      }
    });
    const orient = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    const intersects = (a, b) => {
      const o1 = orient(a[0], a[1], b[0]), o2 = orient(a[0], a[1], b[1]);
      const o3 = orient(b[0], b[1], a[0]), o4 = orient(b[0], b[1], a[1]);
      return (o1 * o2 < 0) && (o3 * o4 < 0);
    };
    const ptSegKm = (p, s) => {
      const ax = (s[0][0] - p[0]) * KX, ay = (s[0][1] - p[1]) * KY;
      const bx = (s[1][0] - p[0]) * KX, by = (s[1][1] - p[1]) * KY;
      const dx = bx - ax, dy = by - ay;
      const len2 = dx * dx + dy * dy;
      const t = len2 > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
      const cx = ax + t * dx, cy = ay + t * dy;
      return Math.sqrt(cx * cx + cy * cy);
    };
    const angOf = s => Math.atan2((s[1][1] - s[0][1]) * KY, (s[1][0] - s[0][0]) * KX);
    const angDiff = (a, b) => {
      let d = Math.abs(a - b) % Math.PI;
      if (d > Math.PI / 2) d = Math.PI - d;
      return d * 180 / Math.PI;
    };
    const counts = { cruza: 0, coincide: 0, paralela: 0, sin: 0 };
    for (const f of ferFC.features || []) {
      let crossed = false, distPar = Infinity;
      for (const line of linesOf(f.geometry)) {
        for (let i = 0; i < line.length - 1; i++) {
          const seg = [line[i], line[i + 1]];
          const mid = [(seg[0][0] + seg[1][0]) / 2, (seg[0][1] + seg[1][1]) / 2];
          const gx = Math.floor(mid[0] / CELL), gy = Math.floor(mid[1] / CELL);
          const seen = new Set();
          for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
            for (const idx of grid.get((gx + dx) + "|" + (gy + dy)) || []) {
              if (seen.has(idx)) continue;
              seen.add(idx);
              const ex = exSegs[idx];
              if (intersects(seg, ex)) { crossed = true; continue; }
              const d = Math.min(ptSegKm(mid, ex), ptSegKm(ex[0], [seg[0], seg[1]]), ptSegKm(ex[1], [seg[0], seg[1]]));
              if (d <= 0.08 && angDiff(angOf(seg), angOf(ex)) <= 30) distPar = Math.min(distPar, d);
            }
          }
        }
      }
      const rel = crossed ? "cruza" : distPar <= 0.02 ? "coincide" : distPar <= 0.08 ? "paralela" : "sin";
      f.properties.relCiclovia = rel;
      counts[rel]++;
    }
    window.FER_REL_COUNTS = counts;
    if (window.evaLog) window.evaLog("info", `[datos] ferias vs red ciclable: ${counts.cruza} cruzan · ${counts.coincide} sobre el eje · ${counts.paralela} paralelas · ${counts.sin} sin ciclovía cercana`);
  })();

  // ---- Transporte público GTFS (dos perspectivas) ----
  //  1) Paraderos de bus: NUBE de puntos (no se visualiza). Se cuenta cuántos
  //     cruza cada eje → indicador de COMPLEJIDAD de diseño (más paraderos = más
  //     conflictos de sección/parada). Informativo, no altera el score.
  //  2) Estaciones de Metro: HOTSPOTS intermodales. Un eje que toca/conecta una
  //     estación aporta a la intermodalidad bici-metro → criterio puntuable.
  window.METRO_FC = metroFC;
  window.METRO_TOTAL = (metroFC.features || []).length;
  window.BUS_STOPS = (busData && busData.coords) || [];
  window.BUS_TOTAL = window.BUS_STOPS.length;
  if (window.evaLog) window.evaLog("info", `[datos] GTFS: ${window.METRO_TOTAL} estaciones de metro (hotspots intermodales) · ${window.BUS_TOTAL.toLocaleString("es-CL")} paraderos de bus (conteo por eje)`);

  // ---- Parques y áreas verdes (atractores ponderados por tamaño) ----
  // Polígonos reducidos a centroide + radio efectivo (√(sup/π)). Operan como
  // hotspots atractores de viajes: un eje que toca/bordea un parque grande aporta
  // más a la conectividad recreativa que uno junto a una plaza pequeña.
  window.PARQUES_FC = parquesFC;
  window.PARQUES_TOTAL = (parquesFC.features || []).length;
  window.PARQUES_SUP_TOTAL = (parquesFC.features || []).reduce((a, f) => a + (+f.properties.sup_m2 || 0), 0);
  if (window.evaLog) window.evaLog("info", `[datos] parques: ${window.PARQUES_TOTAL} áreas verdes · ${(window.PARQUES_SUP_TOTAL/1e6).toFixed(1)} km²`);

  // ---- Población OD real ----
  window.populationFC = odFC;
  window.TOTAL_POB = odFC.features.reduce((a, f) => a + (+f.properties.pob || 0), 0);
  window.TOTAL_PER = odFC.features.reduce((a, f) => a + (+f.properties.per || 0), 0);
  window.TOTAL_EST = odFC.features.reduce((a, f) => a + (+f.properties.estM || 0) + (+f.properties.estS || 0), 0);
  window.POB_BASE = odFC.features.filter(f => f.properties.conectada).reduce((a, f) => a + (+f.properties.pob || 0), 0);
  window.OD_COMUNAS = odDict.comunas;
  window.OD_COMUNAS_MAP = new Map(odDict.comunas.map(c => [c.code, c]));

  // Índice prioridad GORE: código interno de comuna → {score, cat, inv}
  const goreByCut = new Map(GORE_INV_RAW.map(r => [r[0], r]));
  const gorePrior = new Map();
  odDict.comunas.forEach(c => {
    const row = goreByCut.get(+c.cut);
    if (row) gorePrior.set(c.code, { score: GORE_CAT_SCORE[row[3]] ?? 0.5, cat: row[3], inv: row[2] });
  });
  window.GORE_PRIOR = gorePrior; // comunas sin ranking: ausentes → 0.5 neutro en el motor
  window.OD_FLOW_BY_COMUNA = odDict.flowByCommune;
  window.OD_TOTAL_FLOW = odDict.totals.flow;

  // ---- Red existente real ----
  window.existingFC = existing;
  // IDs internos únicos: conserva id_original, crea id_interno único (req §4)
  (function assignInternalIds() {
    const seen = new Map();
    existing.features.forEach((f, i) => {
      const orig = f.properties.id != null ? String(f.properties.id) : ("idx" + i);
      const n = (seen.get(orig) || 0) + 1; seen.set(orig, n);
      f.properties.id_original = orig;
      f.properties.id_interno = `red_${orig}_${String(n).padStart(3, "0")}`;
      f.properties.id_duplicado_original = n > 1;
      // usar id_interno como identificador operativo del feature
      f.properties.id = f.properties.id_interno;
    });
    const dupOrig = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);
    window.EXISTING_DUP_ORIG = dupOrig;
    if (window.evaLog) window.evaLog(dupOrig.length ? "warn" : "info", `[datos] red existente: ${existing.features.length} ejes · IDs internos únicos asignados · ${dupOrig.length} id_original duplicado(s) ${dupOrig.length ? "(" + dupOrig.join(", ") + ")" : ""}`);
  })();
  window.EXISTING_COUNT = existing.features.length;
  window.EXISTING_KM = existing.features.reduce((a, f) => a + (+f.properties.km || 0), 0);
  // Conteos por tipo / cartera para panel
  const tipoCount = {};
  const carteraCount = {};
  const comunaCount = {};
  existing.features.forEach(f => {
    const tn = f.properties.tipoNorm || "otro";
    tipoCount[tn] = (tipoCount[tn] || 0) + 1;
    const c = f.properties.cartera || "s_i";
    carteraCount[c] = (carteraCount[c] || 0) + 1;
    const co = f.properties.comuna || "s_i";
    comunaCount[co] = (comunaCount[co] || 0) + (+f.properties.km || 0);
  });
  window.EXISTING_TIPO = tipoCount;
  window.EXISTING_CARTERA = carteraCount;
  window.EXISTING_COMUNA_KM = comunaCount;

  // ---- Motor de evaluación real ----
  // Categorías de cartera evaluables por separado (misma metodología, presupuestos y
  // responsables distintos). Plan Maestro (GORE PMC) es la cartera por defecto; Otras
  // carteras (Municipios, MOP, MTT, MINVU, Privados/IMIV) se evalúan como categoría aparte.
  fc.features.forEach(f => {
    if (!f.properties.categoria) f.properties.categoria = "Plan Maestro";
    if (!f.properties.cartera) f.properties.cartera = (f.properties.origen === "Ejes priorizados GORE") ? "Ejes priorizados GORE" : "GORE PMC";
  });
  window.FC_RAW = { "Plan Maestro": fc, "Otras carteras": otrasFC };
  window.OTRAS_TOTAL = (otrasFC.features || []).length;
  (function aggregateOtras() {
    const byCart = {}; let km = 0;
    for (const f of (otrasFC.features || [])) { const p = f.properties; byCart[p.cartera] = (byCart[p.cartera] || 0) + 1; km += +p.km || 0; }
    window.OTRAS_BY_CARTERA = byCart;
    window.OTRAS_KM = km;
    if (window.evaLog) window.evaLog("info", `[datos] otras carteras: ${window.OTRAS_TOTAL} proyectos · ${Object.keys(byCart).length} instituciones · ${km.toFixed(0)} km`);
  })();

  const { enriched, coverage, totalByComuna, centroids } = window.ENGINE.run(
    existing, fc, odFC, window.DEFAULT_PARAMS
  );

  // ---- Modelo de elección modal (logit bici) ----
  // Aplica el modelo estimado «ciclo_todo_chile 41» a cada hex y proyecto:
  // P(bici) base y ciclistas inducidos por proyecto (Δ km_ciclovías_500m).
  if (window.DEMANDA_MODAL) {
    try {
      const dm = window.DEMANDA_MODAL.computeAll(existing, fc, odFC, []);
      const maxCicl = Math.max(1, ...dm.map(d => d.ciclistasInducidos || 0));
      dm.forEach((d, i) => {
        Object.assign(enriched[i], d);
        if (enriched[i].norm) enriched[i].norm.ciclistas = (d.ciclistasInducidos || 0) / maxCicl;
      });
    } catch (e) { console.error("demanda modal:", e); }
  }
  // Conectividad fractal (red dendrítica desde la Alameda): carga inicial sin priorizados
  if (window.FRACTAL) {
    try {
      const fr = window.FRACTAL.computeForApp(fc, []);
      fr.forEach((d, i) => {
        enriched[i].gradoSeparacion = d.gradoSeparacion;
        enriched[i].scorePrioridad = d.scorePrioridad;
        if (enriched[i].norm) enriched[i].norm.fractal = d._fractalNorm;
      });
    } catch (e) { console.error("fractal:", e); }
  }

  const ps = enriched;
  window.PROJECTS = ps;
  window.projectsFC = {
    type: "FeatureCollection",
    features: fc.features.map((f, i) => ({
      type: "Feature",
      geometry: f.geometry,
      properties: ps[i] || f.properties,
    }))
  };
  window.COVERAGE_BY_COMUNA = coverage;
  window.TOTAL_BY_COMUNA = totalByComuna;
  window.COMUNA_CENTROIDS = centroids;

  // ---- Índices para vista "orígenes → este destino" ----
  // HEX_BY_ID: acceso rápido a cada hex. INCOMING_BY_COMUNA: para cada comuna
  // destino, lista de hexes de origen con su flujo (del vector disperso dv).
  window.HEX_BY_ID = new Map(odFC.features.map(f => [f.properties.id, f]));
  const incoming = new Map();   // code → [{hexId, flow, comunaOrigen}]
  const incomingTot = new Map(); // code → total v/d
  for (const f of odFC.features) {
    const dv = f.properties.dv || {};
    for (const [codeStr, v] of Object.entries(dv)) {
      const code = +codeStr;
      if (!incoming.has(code)) incoming.set(code, []);
      incoming.get(code).push({ hexId: f.properties.id, flow: v, comunaOrigen: f.properties.comuna });
      incomingTot.set(code, (incomingTot.get(code) || 0) + v);
    }
  }
  for (const list of incoming.values()) list.sort((a, b) => b.flow - a.flow);
  window.INCOMING_BY_COMUNA = incoming;
  window.INCOMING_TOTAL_BY_COMUNA = incomingTot;

  // Agregación por comuna de origen (simétrico a la vista de destinos)
  const incomingComunas = new Map(); // destCode → [{code, flow}] ordenado desc
  for (const [destCode, list] of incoming.entries()) {
    const byOrig = new Map();
    for (const o of list) {
      if (o.comunaOrigen == null) continue;
      byOrig.set(o.comunaOrigen, (byOrig.get(o.comunaOrigen) || 0) + o.flow);
    }
    const arr = [...byOrig.entries()]
      .map(([code, flow]) => ({ code, flow: Math.round(flow * 10) / 10 }))
      .sort((a, b) => b.flow - a.flow);
    incomingComunas.set(destCode, arr);
  }
  window.INCOMING_COMUNAS_BY_COMUNA = incomingComunas;

  // Recapturar la línea base DESPUÉS de la primera corrida del motor:
  // el motor recomputa los flags `conectada` con su propio modelo (componentes,
  // sampleo), por lo que esta es la referencia correcta para el acumulado.
  window.POB_BASE = odFC.features.filter(f => f.properties.conectada).reduce((a, f) => a + (+f.properties.pob || 0), 0);
  window.POB_BASE_ORIG = window.POB_BASE;

  // bounding box for fit
  let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
  function visit(c) {
    if (typeof c[0] === "number") {
      mnx = Math.min(mnx, c[0]); mxx = Math.max(mxx, c[0]);
      mny = Math.min(mny, c[1]); mxy = Math.max(mxy, c[1]);
    } else c.forEach(visit);
  }
  fc.features.forEach(f => visit(f.geometry.coordinates));
  window.CARTERA_BOUNDS = [[mnx, mny], [mxx, mxy]];

  // Derived comunas list (de comunas reales en la cartera)
  // Unificación canónica: las fuentes mezclan variantes con/sin tilde
  // ("CONCHALI" vs "CONCHALÍ"). Se normaliza por clave sin diacríticos y se
  // prefiere la forma acentuada (sembrada desde el diccionario OD) como display.
  const stripAcc = s => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const COM_ALIAS = { "PAC": "PEDRO AGUIRRE CERDA", "P.A.C.": "PEDRO AGUIRRE CERDA", "P.A.C": "PEDRO AGUIRRE CERDA", "SAN BERNADO": "SAN BERNARDO" }; // siglas y errores de tipeo en algunas fuentes
  const comKey = s => {
    const k = stripAcc(String(s).trim()).toUpperCase();
    return COM_ALIAS[k] || k;
  };
  const comVariants = new Map(); // clave sin tilde → display canónico (MAYÚSCULA con tilde)
  const considerCom = tok => {
    tok = String(tok || "").trim().toUpperCase();
    if (!tok) return;
    const k = comKey(tok);
    const cur = comVariants.get(k);
    const hasAcc = tok !== stripAcc(tok);
    const curAcc = cur ? cur !== stripAcc(cur) : false;
    if (!cur || (hasAcc && !curAcc)) comVariants.set(k, tok);
  };
  // Semilla autoritativa: nombres del diccionario OD (traen tildes correctas)
  (odDict.comunas || []).forEach(c => considerCom(c.name));
  // Luego, variantes presentes en las carteras
  const allFeats = Object.values(window.FC_RAW || {}).flatMap(c => c.features || []);
  for (const f of allFeats) {
    if (f.properties.comunas) String(f.properties.comunas).split(/\s*[-,·]\s*/).forEach(considerCom);
  }
  const canonComunas = str => String(str || "")
    .split(/\s*[-,·]\s*/)
    .map(t => { t = t.trim(); if (!t) return ""; return comVariants.get(comKey(t)) || t.toUpperCase(); })
    .filter(Boolean)
    .join(" · ");
  // Reescribir en datos crudos (persistente ante re-runs del motor) y en PROJECTS
  for (const f of allFeats) {
    if (f.properties.comunas) f.properties.comunas = canonComunas(f.properties.comunas);
  }
  ps.forEach(p => { if (p.comunas) p.comunas = canonComunas(p.comunas); });
  window.CANON_COMUNA = canonComunas; // para inferencias posteriores
  const comSet = new Set();
  ps.forEach(p => {
    if (!p.comunas) return;
    String(p.comunas).split(/\s*[·]\s*/).forEach(c => c && comSet.add(c.trim()));
  });
  window.COMUNAS = ["Todas", ...[...comSet].sort((a, b) => a.localeCompare(b, "es"))];
  const LOGend = (lvl, m) => window.evaLog && window.evaLog(lvl, m);
  LOGend("ok", `[datos] Capas listas en ${(performance.now() - tL0).toFixed(0)} ms · ${window.PROJECTS.length} proyectos · ${window.EXISTING_COUNT} ejes existentes (${(window.EXISTING_KM || 0).toFixed(0)} km) · ${window.populationFC.features.length} hexes (${(window.TOTAL_POB || 0).toLocaleString("es-CL")} hab) · ${(window.EDU_SEDES || []).length} sedes ed. superior · ${window.SIN_TOTAL || 0} siniestros ciclistas · ${window.MON_TOTAL || 0} monumentos · ${window.FER_TOTAL || 0} ferias · ${window.METRO_TOTAL || 0} estaciones metro · ${(window.BUS_TOTAL || 0).toLocaleString("es-CL")} paraderos`);
  LOGend("data", `[datos] cobertura base: ${(window.POB_BASE || 0).toLocaleString("es-CL")} hab conectados (${(((window.POB_BASE || 0) / (window.TOTAL_POB || 1)) * 100).toFixed(1)}%) · flujos OD ${(window.OD_TOTAL_FLOW || 0).toLocaleString("es-CL")} v/d · prioridad GORE: ${window.GORE_PRIOR ? window.GORE_PRIOR.size : 0} comunas`);
};

/* ============================================================
   PARÁMETROS Y PESOS
============================================================ */
const DEFAULT_PARAMS = {
  // Parámetros ACTIVOS: derivados de PARAM_SCHEMA (fuente única de verdad)
  ...(window.PARAM_DEFAULTS || { distOrigen: 700, distDestino: 700, connectTol: 150, habThreshold: 40, costoPorKm: 100 }),
  // Perfil de usuario: 'general' (solo red de bajo estrés) · 'experto' (toda la red)
  perfil: "general",
  // Criterio Seguridad vial: false = todos los siniestros · true = solo fatales+graves (KSI)
  segKSI: false,
};

// Pesos iniciales = escenario «Balanceado» (homologado: los 15 criterios
// ponderables con peso no nulo). Debe coincidir con EVA_SCENARIOS.balanceado
// para que la etiqueta del escenario inicial sea veraz en los reportes.
const DEFAULT_WEIGHTS = {
  poblacion: 14,
  costoOD: 10,
  oportunidades: 6,
  equidad: 12,
  continuidad: 12,
  demanda: 12,
  ciclistas: 10,
  fractal: 6,
  estudiantes: 5,
  prioridadGore: 10,
  costoInv: 6,
  seguridad: 5,
  monumentos: 0,
  intermodal: 8,
  factibilidad: 8,
  parques: 6,
};

const MACROZONAS = ["Todas", "CENTRO", "ORIENTE", "PONIENTE", "NORTE", "SUR", "SURORIENTE"];
const ESCALAS = ["Todas", "Comunal", "Intercomunal", "Metropolitana", "Comunal e Intercomunal"];

const OSM_LAYERS = [
  { key: "highway", label: "highway / cycleway", desc: "Red vial y ciclable", enabled: true, count: "12.847 arcos" },
  { key: "amenity", label: "amenity / shop / office", desc: "Destinos urbanos", enabled: true, count: "8.214 POIs" },
  { key: "transit", label: "public_transport", desc: "Paraderos y estaciones", enabled: false, count: "3.106 nodos" },
  { key: "surface", label: "surface / smoothness", desc: "Calidad de rodado", enabled: false, count: "6.302 atributos" },
  { key: "crossing", label: "crossing / barrier", desc: "Cruces críticos", enabled: false, count: "1.987 nodos" },
];

Object.assign(window, {
  STGO_CENTER,
  EXISTING_RAW, existingFC,
  populationFC, TOTAL_POB, POB_BASE,
  DEFAULT_PARAMS, DEFAULT_WEIGHTS,
  MACROZONAS, ESCALAS, OSM_LAYERS,
  COMUNAS: ["Todas"],
  OD_COMUNAS: [], OD_COMUNAS_MAP: new Map(),
  OD_FLOW_BY_COMUNA: [], OD_TOTAL_FLOW: 0,
  SINIESTROS_FC: { type: "FeatureCollection", features: [] },
  SIN_TOTAL: 0, SIN_PESO_TOTAL: 0, SIN_BY_YEAR: {}, SIN_BY_COMUNA: {},
  SIN_SEV_COUNT: { fatal: 0, grave: 0, lesion: 0, danios: 0 },
  SIN_VICTIMS: { fall: 0, grav: 0, meng: 0, leve: 0 }, SIN_YEARS: [],
  MON_FC: { type: "FeatureCollection", features: [] }, MON_TOTAL: 0, MON_BY_CAT: {}, MON_BY_COMUNA: {},
  FERIAS_FC: { type: "FeatureCollection", features: [] }, FER_TOTAL: 0, FER_BY_TIPO: {}, FER_BY_COMUNA: {}, FER_BY_DAY: [], FER_PUESTOS: 0,
  METRO_FC: { type: "FeatureCollection", features: [] }, METRO_TOTAL: 0, BUS_STOPS: [], BUS_TOTAL: 0,
  PARQUES_FC: { type: "FeatureCollection", features: [] }, PARQUES_TOTAL: 0, PARQUES_SUP_TOTAL: 0,
});
