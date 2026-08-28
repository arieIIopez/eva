/* ============================================================
   EvaCiclo · Motor de evaluación v3 — modelo origen-destino por componentes
   ----
   La red ciclable se modela como COMPONENTES CONEXOS (subredes).
   Un viaje hex→comuna es VIABLE solo si algún componente accesible
   desde el origen (≤distOrigen) también sirve al destino (cubre
   ≥habThreshold% de la población de la comuna a ≤distDestino).

   El aporte de un proyecto tiene DOS fuentes:
   a) Población marginal: hexes sin acceso que ganan acceso (buffer)
   b) Beneficio de interconexión: al fusionar componentes inconexos,
      viajes de población YA conectada se vuelven viables porque
      su componente ahora alcanza la comuna destino.
============================================================ */

const ENGINE = (function () {

  let HAB_THRESHOLD = 0.4; // % de pob de la comuna destino que un componente debe cubrir
  function setHabThreshold(t) { HAB_THRESHOLD = t; }

  /* ===== Geometría / grillas ===== */
  const CELL_DEG = 0.005; // ~500m
  const KX = 92.6, KY = 111; // km por grado en RM
  const SIN_RADIUS = 100; // m — corredor de influencia para siniestralidad ciclista (criterio Seguridad vial)
  const MON_RADIUS = 300; // m — radio de asociación de monumentos nacionales al corredor (criterio contextual)
  const FER_RADIUS = 80;  // m — radio de asociación de ferias libres al corredor (capa informativa, no afecta score)
  const BUS_RADIUS = 40;  // m — paradero de bus asignado al eje (indicador de complejidad, no afecta score)
  const METRO_RADIUS = 250; // m — estación de metro conectada por el eje (intermodalidad bici-metro)
  const PARK_BUFFER = 150;  // m — holgura sobre el radio del parque para considerarlo conectado por el eje

  function gridKey(lng, lat) {
    return Math.floor(lng / CELL_DEG) + "," + Math.floor(lat / CELL_DEG);
  }
  function neighborCells(lng, lat, dMeters) {
    const r = Math.ceil((dMeters / 1000 / Math.min(KX, KY)) / CELL_DEG) + 1;
    const cx = Math.floor(lng / CELL_DEG), cy = Math.floor(lat / CELL_DEG);
    const cells = [];
    for (let dx = -r; dx <= r; dx++)
      for (let dy = -r; dy <= r; dy++)
        cells.push((cx + dx) + "," + (cy + dy));
    return cells;
  }
  function distMeters(lng1, lat1, lng2, lat2) {
    const dx = (lng2 - lng1) * KX * 1000;
    const dy = (lat2 - lat1) * KY * 1000;
    return Math.sqrt(dx * dx + dy * dy);
  }
  function sampleLine(coords, stepMeters, out) {
    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i], b = coords[i + 1];
      const len = distMeters(a[0], a[1], b[0], b[1]);
      const steps = Math.max(1, Math.ceil(len / stepMeters));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
  }
  function sampleGeometry(g, stepMeters, out) {
    if (!g) return;
    if (g.type === "LineString") sampleLine(g.coordinates, stepMeters, out);
    else if (g.type === "MultiLineString") g.coordinates.forEach(ls => sampleLine(ls, stepMeters, out));
  }
  function setIntersects(a, b) {
    for (const x of a) if (b.has(x)) return true;
    return false;
  }

  /* ===== Componentes conexos de la red (union-find espacial) ===== */
  function buildComponents(existingFC, extraFeatures, connectTol, sampleStepOpt) {
    const feats = [...existingFC.features, ...(extraFeatures || [])];
    const sampleStep = sampleStepOpt || 120;
    const samplesByFeat = feats.map(f => {
      const s = [];
      sampleGeometry(f.geometry, sampleStep, s);
      // Decimación: sampleLine emite ≥2 puntos por segmento, así que en
      // geometrías densas en vértices el nº de muestras no baja con el paso.
      // Para pasos gruesos (netview con distancias grandes) re-espaciamos.
      if (sampleStep > 130 && s.length > 2) {
        const dec = [s[0]];
        let last = s[0];
        for (let i = 1; i < s.length - 1; i++) {
          if (distMeters(last[0], last[1], s[i][0], s[i][1]) >= sampleStep) {
            dec.push(s[i]); last = s[i];
          }
        }
        dec.push(s[s.length - 1]);
        return dec;
      }
      return s;
    });

    // union-find sobre índices de feature
    const parent = feats.map((_, i) => i);
    function find(i) { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; }
    function union(a, b) { a = find(a); b = find(b); if (a !== b) parent[b] = a; }

    // grilla de samples con featIdx
    const fgrid = new Map();
    samplesByFeat.forEach((ss, fi) => {
      for (const s of ss) {
        const k = gridKey(s[0], s[1]);
        if (!fgrid.has(k)) fgrid.set(k, []);
        fgrid.get(k).push([s[0], s[1], fi]);
      }
    });

    // unir features cuyos samples se acercan a ≤ connectTol
    samplesByFeat.forEach((ss, fi) => {
      for (const s of ss) {
        for (const k of neighborCells(s[0], s[1], connectTol)) {
          const cell = fgrid.get(k);
          if (!cell) continue;
          for (const [x, y, fj] of cell) {
            if (fj === fi || find(fi) === find(fj)) continue;
            if (distMeters(s[0], s[1], x, y) <= connectTol) union(fi, fj);
          }
        }
      }
    });

    // remapear componentes a ids 0..n-1
    const idMap = new Map();
    let n = 0;
    const comp = feats.map((_, i) => {
      const root = find(i);
      if (!idMap.has(root)) idMap.set(root, n++);
      return idMap.get(root);
    });

    // grilla de samples con compId (para consultas de acceso)
    const sgrid = new Map();
    samplesByFeat.forEach((ss, fi) => {
      const c = comp[fi];
      for (const s of ss) {
        const k = gridKey(s[0], s[1]);
        if (!sgrid.has(k)) sgrid.set(k, []);
        sgrid.get(k).push([s[0], s[1], c]);
      }
    });

    // tamaño (en features) por componente
    const sizes = new Array(n).fill(0);
    comp.forEach(c => sizes[c]++);

    return { count: n, comp, sgrid, sizes };
  }

  // Componentes a ≤ d metros de un punto
  function compsNear(lng, lat, sgrid, d) {
    const out = new Set();
    for (const k of neighborCells(lng, lat, d)) {
      const cell = sgrid.get(k);
      if (!cell) continue;
      for (const [x, y, c] of cell) {
        if (out.has(c)) continue;
        if (distMeters(lng, lat, x, y) <= d) out.add(c);
      }
    }
    return out;
  }

  /* ===== Agregados por comuna ===== */
  function coverageByComuna(populationFC) {
    const tot = {}, conn = {};
    for (const h of populationFC.features) {
      const com = h.properties.comuna || "_";
      const pob = +h.properties.pob || 0;
      tot[com] = (tot[com] || 0) + pob;
      if (h.properties.conectada) conn[com] = (conn[com] || 0) + pob;
    }
    const cov = {};
    Object.keys(tot).forEach(c => { cov[c] = tot[c] > 0 ? (conn[c] || 0) / tot[c] : 0; });
    return { totalByComuna: tot, connByComuna: conn, coverage: cov };
  }

  function centroidByComuna(populationFC) {
    const acc = {};
    for (const h of populationFC.features) {
      const com = h.properties.comuna;
      if (com == null) continue;
      const pob = +h.properties.pob || 1;
      const [lng, lat] = h.geometry.coordinates;
      if (!acc[com]) acc[com] = { lng: 0, lat: 0, w: 0 };
      acc[com].lng += lng * pob;
      acc[com].lat += lat * pob;
      acc[com].w += pob;
    }
    const out = {};
    Object.entries(acc).forEach(([com, v]) => { out[com] = [v.lng / v.w, v.lat / v.w]; });
    return out;
  }

  /* ============================================================
     MAIN — evalúa la cartera completa contra (red base + lockeds)
  ============================================================ */
  function run(existingFC, projectsFC, populationFC, params, lockedGeoms) {
    const t0 = performance.now();
    const LOG = (lvl, m) => window.evaLog && window.evaLog(lvl, m);
    const distO = params.distOrigen || 700;
    const distD = params.distDestino || 700;
    const connectTol = params.connectTol || 150;
    const ksiOnly = !!(params && params.segKSI); // seguridad vial: solo fatales+graves (KSI) vs todos
    // --- Umbrales de comportamiento ciclista (v3.11) ---
    const porcProt = (params.porcProtegido || 0) / 100;   // % protegido mínimo de la subred (0 = sin exigencia)
    const aproxFinal = params.aproxFinal || 0;            // m sin infraestructura aceptados al final del viaje
    const distDeff = distD + aproxFinal;                  // radio efectivo de acceso destino
    const tiempoMax = params.tiempoMax || 0;              // min (0 = sin límite)
    const velRef = params.velRef || 15;                   // km/h
    const maxKmOD = tiempoMax > 0 ? (velRef * tiempoMax) / 60 : Infinity;
    const perfil = params.perfil || "general";            // general: solo red de bajo estrés · experto: toda la red
    // Perfil de usuario: el ciclista general no usa infraestructura piloto/zona30/otra
    const ALTO_ESTRES = new Set(["piloto", "zona30", "otro"]);
    const effExisting = perfil === "experto" ? existingFC : {
      type: "FeatureCollection",
      features: existingFC.features.filter(f => !ALTO_ESTRES.has(f.properties.tipoNorm)),
    };
    const excludedByProfile = existingFC.features.length - effExisting.features.length;
    LOG("step", `[motor] Evaluación de cartera · acceso origen ≤${distO}m · destino ≤${distDeff}m${aproxFinal ? ` (incl. ${aproxFinal}m aprox. final)` : ""} · empalme ≤${connectTol}m · perfil ${perfil}${excludedByProfile ? ` (excluye ${excludedByProfile} ejes de alto estrés)` : ""}${maxKmOD < Infinity ? ` · viaje máx ${maxKmOD.toFixed(1)}km (${tiempoMax}min @${velRef}km/h)` : ""}${porcProt ? ` · ≥${params.porcProtegido}% protegido` : ""} · ${(lockedGeoms||[]).length} priorizados en base`);

    // 1) Componentes conexos de la red efectiva (base según perfil + priorizados)
    let tp = performance.now();
    const net = buildComponents(effExisting, lockedGeoms || [], connectTol);
    window.NET_COMPONENTS_COUNT = net.count;
    LOG("data", `[motor] red efectiva: ${effExisting.features.length + (lockedGeoms||[]).length} ejes → ${net.count} componentes conexos (${(performance.now()-tp).toFixed(0)} ms)`);

    // 1b) % protegido por componente (criterio de calidad del viaje).
    //     Protegido = ciclovía, cicloparque, senda multipropósito y proyectos nuevos.
    //     Si porcProtegido > 0, los componentes bajo el umbral NO habilitan beneficios
    //     (siguen existiendo para continuidad/empalme).
    const compOK = new Array(net.count).fill(true);
    if (porcProt > 0) {
      const PROT = new Set(["ciclovia", "cicloparque", "smp"]);
      const protKm = new Array(net.count).fill(0), totKm = new Array(net.count).fill(0);
      const allFeats = [...effExisting.features, ...(lockedGeoms || [])];
      allFeats.forEach((f, i) => {
        const K = net.comp[i];
        const km = +f.properties.km || 0;
        totKm[K] += km;
        const tn = f.properties.tipoNorm;
        if (f.properties.kind === "proyecto" || !tn || PROT.has(tn)) protKm[K] += km;
      });
      let failed = 0;
      for (let K = 0; K < net.count; K++) {
        compOK[K] = totKm[K] > 0 ? (protKm[K] / totKm[K]) >= porcProt : true;
        if (!compOK[K]) failed++;
      }
      if (failed) LOG("data", `[motor] % protegido: ${failed}/${net.count} componentes bajo el umbral ${params.porcProtegido}% → no habilitan beneficios`);
    }
    const filterOK = (set) => {
      if (porcProt <= 0) return set;
      const out = new Set();
      set.forEach(K => { if (compOK[K]) out.add(K); });
      return out;
    };

    const hexes = populationFC.features;

    // 2) Acceso por hex (componentes ≤ distO) y flag conectada
    tp = performance.now();
    const hexAccess = new Map();
    let hexConn = 0;
    for (const h of hexes) {
      const [lng, lat] = h.geometry.coordinates;
      const acc = filterOK(compsNear(lng, lat, net.sgrid, distO));
      hexAccess.set(h.properties.id, acc);
      h.properties.conectada = acc.size > 0;
      if (acc.size > 0) hexConn++;
    }
    LOG("data", `[motor] acceso origen: ${hexConn}/${hexes.length} hexes conectados a ≥ 1 componente (${(performance.now()-tp).toFixed(0)} ms)`);

    // 3) Población total por comuna + servicio por componente
    //    served[K][comuna] = pob de esa comuna a ≤distD del componente K
    const totalByCom = {};
    hexes.forEach(h => {
      const c = h.properties.comuna || "_";
      totalByCom[c] = (totalByCom[c] || 0) + (+h.properties.pob || 0);
    });
    // served[K][com] = pob agregada (para serves base, 1 componente: sin doble conteo)
    // servedHexes[K][com] = Set(hexId) único que el componente K sirve en la comuna c
    //   ⇒ permite fusionar componentes por UNIÓN de hexes únicos (sin doble conteo).
    const served = Array.from({ length: net.count }, () => ({}));
    const servedHexes = Array.from({ length: net.count }, () => ({}));
    const pobById = new Map();
    for (const h of hexes) {
      const [lng, lat] = h.geometry.coordinates;
      const accD = filterOK(compsNear(lng, lat, net.sgrid, distDeff));
      const com = h.properties.comuna || "_";
      const pob = +h.properties.pob || 0;
      const id = h.properties.id;
      pobById.set(id, pob);
      for (const K of accD) {
        served[K][com] = (served[K][com] || 0) + pob;
        if (!servedHexes[K][com]) servedHexes[K][com] = new Set();
        servedHexes[K][com].add(id);
      }
    }
    const serves = (K, c) => {
      const tot = totalByCom[c];
      if (!tot) return false;
      return (served[K][c] || 0) >= HAB_THRESHOLD * tot;
    };

    // 3b) Matrícula de educación superior alcanzable por componente (≤ distD de la sede)
    //     Sin doble conteo: cada componente guarda el CONJUNTO de sedes (por id) que alcanza.
    const eduSedes = window.EDU_SEDES || [];
    const sedeId = (s, i) => (s.properties && s.properties.id != null) ? s.properties.id : ("sede" + i);
    const matOf = {};
    eduSedes.forEach((s, i) => { matOf[sedeId(s, i)] = +s.properties.matricula || 0; });
    const eduByComp = Array.from({ length: net.count }, () => new Set()); // K → Set(sedeId)
    eduSedes.forEach((s, i) => {
      const [lng, lat] = s.geometry.coordinates;
      const mat = matOf[sedeId(s, i)];
      if (!mat) return;
      for (const K of filterOK(compsNear(lng, lat, net.sgrid, distDeff))) eduByComp[K].add(sedeId(s, i));
    });
    const matEdu = eduByComp.map(set => { let m = 0; set.forEach(id => m += matOf[id] || 0); return m; });

    // 4) Viabilidad base de cada viaje (hex → top-10 comunas destino)
    //    Viable si ∃ componente accesible desde el hex que sirva al destino
    //    y el viaje cabe en el presupuesto de tiempo (dist. hex→destino ≤ velRef·tiempoMax)
    const centroids = centroidByComuna(populationFC);
    const withinTime = (h, c) => {
      if (maxKmOD === Infinity) return true;
      const ct = centroids[c];
      if (!ct) return true;
      const [hl, ht] = h.geometry.coordinates;
      return distMeters(hl, ht, ct[0], ct[1]) / 1000 <= maxKmOD;
    };
    let viableFlowBase = 0;
    let totalFlowAll = 0;
    const NDEST = 10;
    const baseViable = new Map();
    for (const h of hexes) {
      const acc = hexAccess.get(h.properties.id);
      const v = new Array(NDEST).fill(false);
      for (let i = 1; i <= NDEST; i++) {
        const c = h.properties["d" + i];
        const val = h.properties["d" + i + "v"] || 0;
        if (c == null || !val) continue;
        totalFlowAll += val;
        if (!withinTime(h, c)) continue; // fuera del presupuesto de tiempo
        for (const K of acc) {
          if (serves(K, c)) { v[i - 1] = true; break; }
        }
        if (v[i - 1]) viableFlowBase += val;
      }
      baseViable.set(h.properties.id, v);
      // exponer en propiedades para la UI (tab Hex)
      for (let i = 1; i <= NDEST; i++) h.properties["v" + i] = v[i - 1];
      // ¿alguna subred accesible alcanza una sede de educación superior?
      let vEdu = false; const hexSedes = new Set();
      for (const K of acc) { if (eduByComp[K].size) { vEdu = true; eduByComp[K].forEach(id => hexSedes.add(id)); } }
      let matAcc = 0; hexSedes.forEach(id => matAcc += matOf[id] || 0);
      h.properties.vEdu = vEdu;
      h.properties.matAcc = matAcc;
    }
    window.VIABLE_FLOW_BASE = Math.round(viableFlowBase);
    window.TOTAL_FLOW_TOP3 = Math.round(totalFlowAll);

    // 5) Cobertura por comuna (para equidad y UI)
    const cov = coverageByComuna(populationFC);
    const covs = Object.values(cov.coverage).sort((a, b) => a - b);
    const median = covs.length ? covs[Math.floor(covs.length / 2)] : 0.5;

    // 6) Índice: componente → hexes con acceso (para evaluar interconexión)
    const compHexes = Array.from({ length: net.count }, () => []);
    for (const h of hexes) {
      for (const K of hexAccess.get(h.properties.id)) compHexes[K].push(h);
    }

    // 7) Grilla de hexes para buffers de proyecto
    const pobGrid = new Map();
    for (const h of hexes) {
      const c = h.geometry.coordinates;
      const k = gridKey(c[0], c[1]);
      if (!pobGrid.has(k)) pobGrid.set(k, []);
      pobGrid.get(k).push(h);
    }

    // 7b) Grilla de siniestros ciclistas (criterio Seguridad vial)
    //     Cada punto trae un peso por severidad (6·fall+3·grav+2·meng+1·leve, mín 1).
    const sinFeats = (window.SINIESTROS_FC && window.SINIESTROS_FC.features) || [];
    const sinGrid = new Map();
    for (const s of sinFeats) {
      const c = s.geometry && s.geometry.coordinates;
      if (!c) continue;
      const k = gridKey(c[0], c[1]);
      if (!sinGrid.has(k)) sinGrid.set(k, []);
      sinGrid.get(k).push(s);
    }

    // 7c) Grilla de monumentos nacionales (criterio contextual, neutro por defecto)
    const monFeats = (window.MON_FC && window.MON_FC.features) || [];
    const monGrid = new Map();
    for (const s of monFeats) {
      const c = s.geometry && s.geometry.coordinates;
      if (!c) continue;
      const k = gridKey(c[0], c[1]);
      if (!monGrid.has(k)) monGrid.set(k, []);
      monGrid.get(k).push(s);
    }

    // 7d) Grilla de ferias libres (capa informativa). Son segmentos de calle
    //     (MultiLineString): se densifican en puntos cada ~25 m para indexarlos en
    //     la grilla y poder medir si el corredor del proyecto cruza la feria.
    const ferFeats = (window.FERIAS_FC && window.FERIAS_FC.features) || [];
    const ferGrid = new Map();
    (function buildFerGrid() {
      for (const f of ferFeats) {
        const g = f.geometry;
        if (!g || !g.coordinates) continue;
        const lines = g.type === "MultiLineString" ? g.coordinates
                    : g.type === "LineString" ? [g.coordinates] : [];
        const samples = [];
        for (const line of lines) {
          for (let i = 0; i < line.length; i++) {
            samples.push(line[i]);
            if (i < line.length - 1) {
              const a = line[i], b = line[i + 1];
              const segM = distMeters(a[0], a[1], b[0], b[1]);
              const steps = Math.floor(segM / 25);
              for (let s = 1; s <= steps; s++) {
                const t = s / (steps + 1);
                samples.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
              }
            }
          }
        }
        f._samples = samples;
        for (const sp of samples) {
          const k = gridKey(sp[0], sp[1]);
          if (!ferGrid.has(k)) ferGrid.set(k, []);
          ferGrid.get(k).push(f);
        }
      }
    })();

    // 7e) Grilla de paraderos de bus (nube de puntos GTFS) — conteo por eje (complejidad)
    const busPts = (window.BUS_STOPS) || [];
    const busGrid = new Map();
    for (let bi = 0; bi < busPts.length; bi++) {
      const c = busPts[bi];
      const k = gridKey(c[0], c[1]);
      if (!busGrid.has(k)) busGrid.set(k, []);
      busGrid.get(k).push(bi);
    }

    // 7f) Grilla de estaciones de metro — hotspots intermodales
    const metroFeats = (window.METRO_FC && window.METRO_FC.features) || [];
    const metroGrid = new Map();
    for (const s of metroFeats) {
      const c = s.geometry && s.geometry.coordinates;
      if (!c) continue;
      const k = gridKey(c[0], c[1]);
      if (!metroGrid.has(k)) metroGrid.set(k, []);
      metroGrid.get(k).push(s);
    }

    // 7g) Grilla de parques — atractores ponderados por tamaño (centroide + radio efectivo)
    const parkFeats = (window.PARQUES_FC && window.PARQUES_FC.features) || [];
    const parkGrid = new Map();
    let parkMaxReach = 0;
    for (const s of parkFeats) {
      const c = s.geometry && s.geometry.coordinates;
      if (!c) continue;
      const k = gridKey(c[0], c[1]);
      if (!parkGrid.has(k)) parkGrid.set(k, []);
      parkGrid.get(k).push(s);
      const reach = (+s.properties.rad_m || 0) + PARK_BUFFER;
      if (reach > parkMaxReach) parkMaxReach = reach;
    }

    const lockedIdSet = new Set((lockedGeoms || []).map(f => f.properties.id));

    /* ===== Evaluación de un proyecto ===== */
    function evalProject(feat) {
      const ps = [];
      sampleGeometry(feat.geometry, 100, ps);

      // Componentes que el proyecto TOCA (≤ connectTol) → fusión
      const touched = new Set();
      for (const [lng, lat] of ps) {
        for (const K of compsNear(lng, lat, net.sgrid, connectTol)) touched.add(K);
      }

      // Hexes en buffer del proyecto (acceso de origen y servicio de destino)
      const hexNearO = new Set(); // ≤ distO (ganan acceso)
      const hexNearD = new Set(); // ≤ distD (el proyecto sirve su comuna)
      const dMax = Math.max(distO, distDeff);
      const seen = new Set();
      for (const [lng, lat] of ps) {
        for (const k of neighborCells(lng, lat, dMax)) {
          const cell = pobGrid.get(k);
          if (!cell) continue;
          for (const h of cell) {
            const id = h.properties.id;
            if (seen.has(id)) continue;
            const c = h.geometry.coordinates;
            const d = distMeters(lng, lat, c[0], c[1]);
            if (d <= distO) hexNearO.add(h);
            if (d <= distDeff) hexNearD.add(h);
            if (d <= Math.min(distO, distDeff)) seen.add(id); // ya clasificado en ambos
          }
        }
      }

      // Servicio del componente FUSIONADO = UNIÓN de hexes únicos (sin doble conteo).
      // Para cada comuna, unimos los Set(hexId) de los componentes tocados + los hexes
      // del buffer destino del propio proyecto, y sumamos pob sobre hexes ÚNICOS.
      const mergedHexes = {};   // comuna → Set(hexId)
      for (const K of touched) {
        for (const [c, set] of Object.entries(servedHexes[K])) {
          if (!mergedHexes[c]) mergedHexes[c] = new Set();
          for (const id of set) mergedHexes[c].add(id);
        }
      }
      for (const h of hexNearD) {
        const c = h.properties.comuna || "_";
        if (!mergedHexes[c]) mergedHexes[c] = new Set();
        mergedHexes[c].add(h.properties.id);
      }
      const mServed = {};       // comuna → pob única servida (métrica derivada)
      for (const [c, set] of Object.entries(mergedHexes)) {
        let s = 0; for (const id of set) s += pobById.get(id) || 0;
        mServed[c] = s;
      }
      const servesMerged = (c) => {
        const tot = totalByCom[c];
        if (!tot) return false;
        // población ÚNICA (no puede exceder el total real de la comuna) ≥ umbral
        return (mServed[c] || 0) >= HAB_THRESHOLD * tot;
      };

      // Matrícula alcanzable por la red fusionada: UNIÓN de sedes (por id) de los
      // componentes tocados + sedes ≤distD del trazado del proyecto (sin doble conteo).
      const sedeSet = new Set();
      for (const K of touched) eduByComp[K].forEach(id => sedeSet.add(id));
      eduSedes.forEach((s, i) => {
        const sid = sedeId(s, i);
        if (sedeSet.has(sid) || !matOf[sid]) return;
        const [slng, slat] = s.geometry.coordinates;
        for (const [lng, lat] of ps) {
          if (distMeters(lng, lat, slng, slat) <= distDeff) { sedeSet.add(sid); break; }
        }
      });
      let matEduMerged = 0; sedeSet.forEach(id => matEduMerged += matOf[id] || 0);
      const eduOK = matEduMerged > 0;

      // Candidatos a beneficio: hexes en buffer + hexes de los componentes fusionados
      const cand = new Set(hexNearO);
      for (const K of touched) for (const h of compHexes[K]) cand.add(h);

      let pobReached = 0, pobNew = 0, flowReached = 0, flowNew = 0;
      let estMNew = 0;  // estudiantes media que ganan acceso (generación de proximidad)
      let estSNew = 0;  // estudiantes superiores con viaje a sede habilitado (atracción)
      let flowEnabled = 0;      // viajes NUEVOS viables (la métrica OD central)
      let pobBenef = 0;         // pob con ≥1 viaje nuevo viable (incluye interconexión)
      let benefHexes = 0;
      let potentialFlow = 0;    // viajes no-viables-antes en el área de influencia
      const macroNewCount = {};
      const destReached = {};

      for (const h of cand) {
        const id = h.properties.id;
        const pob = +h.properties.pob || 0;
        const fl = +h.properties.flow || 0;
        const inBufferO = hexNearO.has(h);
        const acc = hexAccess.get(id);
        const touchesMerged = inBufferO || setIntersects(acc, touched);

        if (inBufferO) {
          pobReached += pob;
          flowReached += fl;
          if (!h.properties.conectada) {
            pobNew += pob;
            flowNew += fl;
            estMNew += (+h.properties.estM || 0);
          }
        }

        if (!touchesMerged) continue;

        // Estudiantes superiores: viaje a sede habilitado (antes sin sede alcanzable, ahora sí)
        if (eduOK && !h.properties.vEdu) {
          estSNew += (+h.properties.estS || 0);
        }

        const bv = baseViable.get(id);
        let gained = 0;
        for (let i = 1; i <= NDEST; i++) {
          const c = h.properties["d" + i];
          const val = h.properties["d" + i + "v"] || 0;
          if (c == null || !val) continue;
          if (bv[i - 1]) continue;          // ya era viable
          potentialFlow += val;
          if (servesMerged(c)) {            // ahora SÍ es viable vía red fusionada
            gained += val;
            destReached[c] = (destReached[c] || 0) + val;
          }
        }
        if (gained > 0) {
          flowEnabled += gained;
          pobBenef += pob;
          benefHexes += 1;
          const com = h.properties.comuna || "_";
          macroNewCount[com] = (macroNewCount[com] || 0) + pob;
        }
      }

      // Siniestralidad PREVENIBLE intervenida por el proyecto (criterio Seguridad vial).
      // Para cada siniestro único a ≤ SIN_RADIUS de la traza se toma su distancia MÍNIMA al
      // eje y se pondera por severidad × tratabilidad × decaimiento de distancia:
      //  · severidad: peso CONASET (6F+3G+2M+1L) o, en modo KSI, solo 6F+3G.
      //  · tratabilidad (τ, pre-calculada): cuánto mitiga ese tipo/causa/ubicación una
      //    ciclovía segregada (0.15–1). Convierte «daño cercano» en «daño prevenible».
      //  · decaimiento: 1 sobre la traza → 0.2 en el borde del buffer (evita el bleed de
      //    siniestros de calles paralelas).
      let sinCount = 0, sinFall = 0, sinGrav = 0, sinLeve = 0;
      let sinPeso = 0, sinPesoBruto = 0, sinPesoPrev = 0;
      if (sinFeats.length) {
        const minDist = new Map(); // id → { d, s } con la distancia mínima a la traza
        for (const [lng, lat] of ps) {
          for (const k of neighborCells(lng, lat, SIN_RADIUS)) {
            const cell = sinGrid.get(k);
            if (!cell) continue;
            for (const s of cell) {
              const c = s.geometry.coordinates;
              const d = distMeters(lng, lat, c[0], c[1]);
              if (d > SIN_RADIUS) continue;
              const id = s.properties.id;
              const prev = minDist.get(id);
              if (!prev || d < prev.d) minDist.set(id, { d, s });
            }
          }
        }
        for (const { d, s } of minDist.values()) {
          const sp = s.properties;
          const fall = +sp.fall || 0, grav = +sp.grav || 0, meng = +sp.meng || 0, leve = +sp.leve || 0;
          const treat = sp.treat != null ? +sp.treat : 0.6;
          const decay = 1 - 0.8 * (d / SIN_RADIUS);              // 1.0 (traza) → 0.2 (borde)
          const sevFull = +sp.peso || 1;                          // severidad CONASET total
          const sevW = ksiOnly ? (6 * fall + 3 * grav) : sevFull; // énfasis KSI opcional
          sinCount++;
          sinFall += fall; sinGrav += grav; sinLeve += meng + leve;
          sinPeso += sevW * treat * decay;                        // valor del criterio (mode-aware)
          sinPesoBruto += sevFull * decay;                        // exposición sin tratabilidad
          sinPesoPrev += sevFull * treat * decay;                 // exposición prevenible
        }
      }
      const sinPrevPct = sinPesoBruto > 0 ? sinPesoPrev / sinPesoBruto : 0;

      // Monumentos nacionales asociados al corredor (criterio contextual, peso neutro
      // por defecto). Cuenta monumentos únicos a ≤ MON_RADIUS de la traza; guarda el más
      // cercano y hasta 3 nombres distintos (del más cercano hacia afuera) para la ficha.
      let monCount = 0, monProx = null;
      const monNombres = [];
      if (monFeats.length) {
        const monMin = new Map(); // id → { d, s }
        for (const [lng, lat] of ps) {
          for (const k of neighborCells(lng, lat, MON_RADIUS)) {
            const cell = monGrid.get(k);
            if (!cell) continue;
            for (const s of cell) {
              const c = s.geometry.coordinates;
              const d = distMeters(lng, lat, c[0], c[1]);
              if (d > MON_RADIUS) continue;
              const id = s.properties.id;
              const prev = monMin.get(id);
              if (!prev || d < prev.d) monMin.set(id, { d, s });
            }
          }
        }
        monCount = monMin.size;
        const sorted = [...monMin.values()].sort((a, b) => a.d - b.d);
        if (sorted.length) monProx = sorted[0].d;
        for (const { s } of sorted) {
          const nm = s.properties.nombre;
          if (nm && !monNombres.includes(nm)) monNombres.push(nm);
          if (monNombres.length >= 3) break;
        }
      }

      // Ferias libres que cruza el corredor del proyecto (≤ FER_RADIUS de la traza).
      // Capa INFORMATIVA: no afecta el puntaje. Cuenta ferias únicas y agrega los
      // días en que operan (unión) para evaluar compatibilidad de uso del espacio.
      let ferCount = 0, ferPuestos = 0;
      const ferNombres = [];
      const ferDiasSet = {};
      const DAY_ORDER = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
      const DAY_ABBR = { Lunes: "Lun", Martes: "Mar", Miercoles: "Mi\u00e9", Jueves: "Jue", Viernes: "Vie", Sabado: "S\u00e1b", Domingo: "Dom" };
      if (ferFeats.length) {
        const ferSeen = new Set();
        const ferMin = new Map(); // id → distancia mínima (para ordenar nombres)
        for (const [lng, lat] of ps) {
          for (const k of neighborCells(lng, lat, FER_RADIUS)) {
            const cell = ferGrid.get(k);
            if (!cell) continue;
            for (const f of cell) {
              const id = f.properties.id;
              let dmin = ferMin.has(id) ? ferMin.get(id) : Infinity;
              for (const sp of f._samples) {
                const d = distMeters(lng, lat, sp[0], sp[1]);
                if (d < dmin) dmin = d;
              }
              if (dmin <= FER_RADIUS) {
                if (!ferSeen.has(id)) {
                  ferSeen.add(id);
                  ferCount++;
                  ferPuestos += +f.properties.puestos || 0;
                  for (const d of (f.properties.dias || [])) ferDiasSet[d] = true;
                }
                ferMin.set(id, dmin);
              }
            }
          }
        }
        const ordered = [...ferSeen].map(id => {
          const f = ferFeats.find(x => x.properties.id === id);
          return { id, d: ferMin.get(id), nombre: f && f.properties.nombre };
        }).sort((a, b) => a.d - b.d);
        for (const o of ordered) {
          if (o.nombre && !ferNombres.includes(o.nombre)) ferNombres.push(o.nombre);
          if (ferNombres.length >= 3) break;
        }
      }
      const ferDias = DAY_ORDER.filter(d => ferDiasSet[d]);
      const ferDiasAbbr = ferDias.map(d => DAY_ABBR[d]).join(", ");

      // Paraderos de bus en el eje (≤ BUS_RADIUS). Conteo único → indicador de complejidad.
      let busCount = 0;
      if (busPts.length) {
        const busSeen = new Set();
        for (const [lng, lat] of ps) {
          for (const k of neighborCells(lng, lat, BUS_RADIUS)) {
            const cell = busGrid.get(k);
            if (!cell) continue;
            for (const bi of cell) {
              if (busSeen.has(bi)) continue;
              const c = busPts[bi];
              if (distMeters(lng, lat, c[0], c[1]) <= BUS_RADIUS) busSeen.add(bi);
            }
          }
        }
        busCount = busSeen.size;
      }

      // Estaciones de metro conectadas por el eje (≤ METRO_RADIUS) → intermodalidad bici-metro.
      let metroCount = 0, metroProx = null;
      const metroNombres = [];
      if (metroFeats.length) {
        const metroMin = new Map(); // id → { d, s }
        for (const [lng, lat] of ps) {
          for (const k of neighborCells(lng, lat, METRO_RADIUS)) {
            const cell = metroGrid.get(k);
            if (!cell) continue;
            for (const s of cell) {
              const c = s.geometry.coordinates;
              const d = distMeters(lng, lat, c[0], c[1]);
              if (d > METRO_RADIUS) continue;
              const id = s.properties.id;
              const prev = metroMin.get(id);
              if (!prev || d < prev.d) metroMin.set(id, { d, s });
            }
          }
        }
        metroCount = metroMin.size;
        const sorted = [...metroMin.values()].sort((a, b) => a.d - b.d);
        if (sorted.length) metroProx = sorted[0].d;
        for (const { s } of sorted) {
          const nm = s.properties.nombre;
          if (nm && !metroNombres.includes(nm)) metroNombres.push(nm);
          if (metroNombres.length >= 4) break;
        }
      }

      // Parques conectados por el eje (dist a la traza ≤ radio del parque + PARK_BUFFER).
      // Atractor ponderado por tamaño: el valor es la suma de superficies (m²) de los
      // parques que el eje toca o bordea. Nombres ordenados por tamaño (mayor primero).
      let parkCount = 0, parkSup = 0;
      const parkNombres = [];
      if (parkFeats.length) {
        const parkMin = new Map(); // id → { d, s }
        for (const [lng, lat] of ps) {
          for (const k of neighborCells(lng, lat, parkMaxReach)) {
            const cell = parkGrid.get(k);
            if (!cell) continue;
            for (const s of cell) {
              const c = s.geometry.coordinates;
              const d = distMeters(lng, lat, c[0], c[1]);
              const reach = (+s.properties.rad_m || 0) + PARK_BUFFER;
              if (d > reach) continue;
              const id = s.properties.id != null ? s.properties.id : s.properties.nombre;
              const prev = parkMin.get(id);
              if (!prev || d < prev.d) parkMin.set(id, { d, s });
            }
          }
        }
        parkCount = parkMin.size;
        for (const { s } of parkMin.values()) parkSup += +s.properties.sup_m2 || 0;
        const bySize = [...parkMin.values()].sort((a, b) => (+b.s.properties.sup_m2 || 0) - (+a.s.properties.sup_m2 || 0));
        for (const { s } of bySize) {
          const nm = s.properties.nombre;
          if (nm && !parkNombres.includes(nm)) parkNombres.push(nm);
          if (parkNombres.length >= 3) break;
        }
      }

      // Continuidad v3.2.2: saturación en 4 componentes (coherente con la ficha: K_p/4).
      // 0 tocados = aislado (0) · 1 = extiende red (0.25) · 2 = 0.50 · ≥4 = conector pleno (1.0)
      const continuidad = Math.min(1, touched.size / 4);
      window.EVA_CONTINUITY_FORMULA = "min(1, K_p / 4)";

      return {
        pobReached: Math.round(pobReached),
        pobNew: Math.round(pobNew),
        flowReached: Math.round(flowReached),
        flowNew: Math.round(flowNew),
        flowEnabled: Math.round(flowEnabled),
        potentialFlow: Math.round(potentialFlow),
        pobBenef: Math.round(pobBenef),
        benefHexes,
        estMNew: Math.round(estMNew),
        estSNew: Math.round(estSNew),
        matEduMerged: Math.round(matEduMerged),
        componentesUnidos: touched.size,
        continuidad: +continuidad.toFixed(3),
        siniestros: sinCount,
        siniestrosPeso: +sinPeso.toFixed(2),
        siniestrosFall: sinFall,
        siniestrosGrav: sinGrav,
        siniestrosLeve: sinLeve,
        siniestrosPrevPct: +sinPrevPct.toFixed(3),
        monumentos: monCount,
        monumentosProx: monProx == null ? null : Math.round(monProx),
        monumentosNombres: monNombres,
        ferias: ferCount,
        feriasPuestos: ferPuestos,
        feriasDias: ferDias,
        feriasDiasAbbr: ferDiasAbbr,
        feriasNombres: ferNombres,
        paraderosBus: busCount,
        metroEstaciones: metroCount,
        metroProx: metroProx == null ? null : Math.round(metroProx),
        metroNombres,
        parques: parkCount,
        parquesSup: +parkSup.toFixed(0),
        parquesHa: +(parkSup / 1e4).toFixed(1),
        parquesNombres: parkNombres,
        macroNewCount,
        destReached,
        reachedAll: new Set([...hexNearO].map(h => h.properties.id)),
        reachedNew: new Set([...hexNearO].filter(h => !h.properties.conectada).map(h => h.properties.id)),
        benefIds: new Set([...cand].filter(h => {
          const bv = baseViable.get(h.properties.id);
          if (!bv) return false;
          const acc = hexAccess.get(h.properties.id);
          const touches = hexNearO.has(h) || setIntersects(acc, touched);
          if (!touches) return false;
          for (let i = 1; i <= NDEST; i++) {
            const c = h.properties["d" + i];
            const val = h.properties["d" + i + "v"] || 0;
            if (c == null || !val || bv[i - 1]) continue;
            if (servesMerged(c)) return true;
          }
          return false;
        }).map(h => h.properties.id)),
      };
    }

    /* ===== Loop principal ===== */
    const EMPTY = {
      pobReached: 0, pobNew: 0, flowReached: 0, flowNew: 0,
      flowEnabled: 0, potentialFlow: 0, pobBenef: 0, benefHexes: 0,
      estMNew: 0, estSNew: 0, matEduMerged: 0,
      componentesUnidos: 0, continuidad: 1,
      siniestros: 0, siniestrosPeso: 0, siniestrosFall: 0, siniestrosGrav: 0, siniestrosLeve: 0, siniestrosPrevPct: 0,
      monumentos: 0, monumentosProx: null, monumentosNombres: [],
      ferias: 0, feriasPuestos: 0, feriasDias: [], feriasDiasAbbr: "", feriasNombres: [],
      paraderosBus: 0, metroEstaciones: 0, metroProx: null, metroNombres: [],
      numPistas: 0, pendMedia: 0, pendMax: 0, pctLenPend5: 0,
      parques: 0, parquesSup: 0, parquesHa: 0, parquesNombres: [],
      macroNewCount: {}, destReached: {},
      reachedAll: new Set(), reachedNew: new Set(), benefIds: new Set(),
    };

    const enriched = [];
    for (const f of projectsFC.features) {
      const isLocked = lockedIdSet.has(f.properties.id);
      const m = isLocked ? EMPTY : evalProject(f);

      // Equidad: % de pob beneficiada en comunas bajo la mediana de cobertura
      let eqNum = 0, eqDen = 0;
      Object.entries(m.macroNewCount).forEach(([com, pob]) => {
        eqDen += pob;
        if ((cov.coverage[com] || 0) < median) eqNum += pob;
      });
      const equidadReal = eqDen > 0 ? eqNum / eqDen : 0.5;

      // Prioridad GORE: promedio ponderado (por pob. nueva beneficiada) del
      // score de prioridad de inversión comunal. Sin beneficiarios → neutro 0.5.
      let pgNum = 0, pgDen = 0;
      Object.entries(m.macroNewCount).forEach(([com, pob]) => {
        const g = window.GORE_PRIOR && window.GORE_PRIOR.get(+com);
        pgNum += pob * (g ? g.score : 0.5);
        pgDen += pob;
      });
      const prioridadGore = pgDen > 0 ? pgNum / pgDen : 0.5;

      // Tasa de habilitación: viajes habilitados / potencial habilitable
      const habRate = m.potentialFlow > 0 ? m.flowEnabled / m.potentialFlow : 0;
      const costoODReal = -Math.round(habRate * 30);

      // Costo total = longitud × costo por km (editable; default 100 M/km)
      const costoPorKm = params.costoPorKm || 100;
      const costoTotal = Math.round((+f.properties.km || 0) * costoPorKm);

      enriched.push({
        ...f.properties,
        costo: costoTotal,                      // km × costoPorKm (editable)
        poblacion: m.pobNew,                    // pob marginal (gana acceso)
        poblacionAlcance: m.pobReached,         // pob total en buffer
        pobBeneficiada: m.pobBenef,             // pob con viajes nuevos viables (incl. interconexión)
        demanda: m.flowNew,                     // flujo bruto de hexes nuevos
        demandaAlcance: m.flowReached,
        demandaHabilitada: m.flowEnabled,       // viajes NUEVOS viables origen→destino
        estudiantesM: m.estMNew,                // estudiantes ed. media que ganan acceso (proximidad)
        estudiantesS: m.estSNew,                // estudiantes superiores con viaje a sede habilitado
        matriculaAlcanzable: m.matEduMerged,    // matrícula alcanzable vía red fusionada
        estudiantes: m.estMNew + m.estSNew,     // criterio de generación estudiantil
        oportunidades: m.benefHexes,            // hexes beneficiados
        componentesUnidos: m.componentesUnidos,
        continuidad: m.continuidad,
        siniestros: m.siniestros,                // n.º de siniestros ciclistas en el corredor
        siniestrosPeso: m.siniestrosPeso,        // severidad × tratabilidad × decaimiento (criterio)
        siniestrosFall: m.siniestrosFall,        // fallecidos en el corredor
        siniestrosGrav: m.siniestrosGrav,        // graves en el corredor
        siniestrosLeve: m.siniestrosLeve,        // lesionados leves/menos graves en el corredor
        siniestrosPrevPct: m.siniestrosPrevPct,  // % prevenible (tratabilidad media ponderada)
        monumentos: m.monumentos,                // n.º de monumentos nacionales a ≤300 m de la traza
        monumentosProx: m.monumentosProx,        // distancia (m) al monumento más cercano
        monumentosNombres: m.monumentosNombres,  // hasta 3 nombres (del más cercano)
        ferias: m.ferias,                        // n.º de ferias libres que cruza el tramo
        feriasPuestos: m.feriasPuestos,          // total de puestos en esas ferias
        feriasDias: m.feriasDias,                // días (unión) en que operan
        feriasDiasAbbr: m.feriasDiasAbbr,        // días abreviados para la ficha
        feriasNombres: m.feriasNombres,          // hasta 3 nombres de feria
        paraderosBus: m.paraderosBus,            // n.º de paraderos de bus en el eje (complejidad)
        metroEstaciones: m.metroEstaciones,      // n.º de estaciones de metro conectadas (intermodalidad)
        metroProx: m.metroProx,                  // distancia (m) a la estación más cercana del eje
        metroNombres: m.metroNombres,            // hasta 4 nombres de estación
        numPistas: +f.properties.numPistas || 0,       // pistas por eje (ancho vía → factibilidad)
        pendMedia: +f.properties.pendMedia || 0,       // pendiente media % (costo percibido)
        pendMax: +f.properties.pendMax || 0,           // pendiente máxima %
        pctLenPend5: +f.properties.pctLenPend5 || 0,   // % de longitud sobre 5%
        parques: m.parques,                            // n.º de parques conectados por el eje
        parquesSup: m.parquesSup,                      // superficie total conectada (m²) — atractor
        parquesHa: m.parquesHa,                        // superficie total conectada (ha)
        parquesNombres: m.parquesNombres,              // hasta 3 parques mayores conectados
        equidad: +equidadReal.toFixed(3),
        prioridadGore: +prioridadGore.toFixed(3),
        costoOD: costoODReal,
        _hexReached: [...m.reachedAll],
        _hexNew: [...m.reachedNew],
        _hexBenef: [...m.benefIds],
        _destReached: m.destReached,
        _real: true,
        _isLocked: isLocked,
      });
    }

    // Normalización multicriterio sobre proyectos activos
    const active = enriched.filter(p => !p._isLocked);
    const maxes = {
      poblacion:     Math.max(1, ...active.map(p => p.poblacion)),
      costoOD:       Math.max(1, ...active.map(p => Math.abs(p.costoOD))),
      oportunidades: Math.max(1, ...active.map(p => p.oportunidades)),
      demanda:       Math.max(1, ...active.map(p => p.demandaHabilitada || 0)),
      estudiantes:   Math.max(1, ...active.map(p => p.estudiantes || 0)),
      seguridad:     Math.max(1, ...active.map(p => p.siniestrosPeso || 0)),
      monumentos:    Math.max(1, ...active.map(p => p.monumentos || 0)),
      intermodal:    Math.max(1, ...active.map(p => p.metroEstaciones || 0)),
      factibilidad:  Math.max(1, ...active.map(p => p.numPistas || 0)),
      parques:       Math.max(1, ...active.map(p => p.parquesSup || 0)),
      costo:         Math.max(1, ...active.map(p => p.costo)),
    };
    enriched.forEach(p => {
      p.norm = {
        poblacion:     p.poblacion / maxes.poblacion,
        costoOD:       Math.abs(p.costoOD) / maxes.costoOD,
        oportunidades: p.oportunidades / maxes.oportunidades,
        demanda:       (p.demandaHabilitada || 0) / maxes.demanda,
        estudiantes:   (p.estudiantes || 0) / maxes.estudiantes,
        seguridad:     (p.siniestrosPeso || 0) / maxes.seguridad,
        monumentos:    (p.monumentos || 0) / maxes.monumentos,
        intermodal:    (p.metroEstaciones || 0) / maxes.intermodal,
        factibilidad:  (p.numPistas || 0) / maxes.factibilidad,
        parques:       (p.parquesSup || 0) / maxes.parques,
        equidad:       p.equidad,
        prioridadGore: p.prioridadGore != null ? p.prioridadGore : 0.5,
        continuidad:   p.continuidad,
        costoInv:      1 - (p.costo / maxes.costo),
      };
    });

    const dt = (performance.now() - t0).toFixed(0);
    LOG("ok", `[motor] evaluación completa: ${enriched.length} proyectos puntuados en ${dt} ms`);
    return { enriched, coverage: cov.coverage, totalByComuna: cov.totalByComuna, centroids };
  }

  /* ============================================================
     Solver secuencial completo (greedy iterativo, ASÍNCRONO)
     Cede el hilo entre iteraciones para que la UI no se congele
     y el terminal muestre el progreso en vivo.
  ============================================================ */
  async function runSequentialFull(existingFC, projectsFC, populationFC, params, weights, opts) {
    opts = opts || {};
    const LOG = (lvl, m) => window.evaLog && window.evaLog(lvl, m);
    const maxSteps = opts.maxSteps || projectsFC.features.length;
    const budget = opts.budget || Infinity;
    const onProgress = opts.onProgress || (() => {});
    const t0 = performance.now();

    LOG("step", `━━━ SOLVER SECUENCIAL ━━━ ${projectsFC.features.length} proyectos candidatos · máx ${maxSteps} pasos · presupuesto ${budget === Infinity ? "ilimitado" : "$" + budget.toLocaleString("es-CL") + " M"}`);
    LOG("info", `[solver] pesos: ${Object.entries(weights).map(([k, v]) => k + "=" + v).join(" · ")}`);

    const totalW = (Object.values(weights).reduce((a, b) => a + b, 0) - (weights.monumentos || 0)) || 1;
    const scoreOf = (p) => (
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
    ) / totalW;

    const order = [];
    const lockedGeoms = [];
    let usedBudget = 0, cumPob = 0, cumDemHab = 0, cumPobBenef = 0;

    for (let step = 0; step < maxSteps; step++) {
      const tStep = performance.now();
      LOG("step", `[solver] ─ iteración ${step + 1}/${maxSteps}: reevaluando ${projectsFC.features.length - lockedGeoms.length} candidatos contra base + ${lockedGeoms.length} priorizados…`);

      const { enriched } = run(existingFC, projectsFC, populationFC, params, lockedGeoms);
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

      // top 3 del paso para trazabilidad
      candidates.slice(0, 3).forEach((c, i) => {
        LOG("data", `[solver]   ${i + 1}° ${c.p.id} ${c.p.nombre} · score ${c.score.toFixed(4)} · pob +${(c.p.poblacion || 0).toLocaleString("es-CL")} · OD hab +${Math.round(c.p.demandaHabilitada || 0).toLocaleString("es-CL")} v/d · une ${c.p.componentesUnidos || 0} comp.`);
      });

      let chosen = null;
      for (const c of candidates) {
        if (usedBudget + (c.p.costo || 0) <= budget) { chosen = c; break; }
        LOG("warn", `[solver]   ${c.p.id} excede presupuesto restante ($${(budget - usedBudget).toLocaleString("es-CL")} M) · saltando`);
      }
      if (!chosen) {
        LOG("warn", `[solver] presupuesto agotado en paso ${step + 1} · $${usedBudget.toLocaleString("es-CL")} M usados`);
        break;
      }

      const geom = projectsFC.features.find(f => f.properties.id === chosen.p.id);
      lockedGeoms.push(geom);
      usedBudget += chosen.p.costo || 0;
      cumPob += chosen.p.poblacion || 0;
      cumDemHab += chosen.p.demandaHabilitada || 0;
      cumPobBenef += chosen.p.pobBeneficiada || 0;

      order.push({
        step: step + 1,
        id: chosen.p.id,
        nombre: chosen.p.nombre,
        escala: chosen.p.escala,
        macrozona: chosen.p.macrozona,
        comunas: chosen.p.comunas,
        km: +chosen.p.km,
        costo: chosen.p.costo,
        score: +chosen.score.toFixed(4),
        pobMarginal: chosen.p.poblacion,
        pobBeneficiada: chosen.p.pobBeneficiada,
        demandaHab: chosen.p.demandaHabilitada,
        compUnidos: chosen.p.componentesUnidos,
        cumPob, cumDemHab, cumBudget: usedBudget,
      });

      LOG("ok", `[solver] ✓ paso ${step + 1}: ${chosen.p.id} ${chosen.p.nombre} elegido e incorporado a la red base (${(performance.now() - tStep).toFixed(0)} ms) · acumulado: ${cumPob.toLocaleString("es-CL")} pob marginal · ${Math.round(cumDemHab).toLocaleString("es-CL")} v/d habilitados`);

      onProgress({ step: step + 1, total: maxSteps, chosen: chosen.p.id, cumPob, cumDemHab });

      // ceder el hilo: la UI pinta, el terminal avanza, el navegador no se congela
      if (window.evaYield) await window.evaYield();
    }

    const dt = ((performance.now() - t0) / 1000).toFixed(1);
    LOG("ok", `━━━ SOLVER COMPLETO ━━━ ${order.length} pasos en ${dt}s · pob marginal total ${cumPob.toLocaleString("es-CL")} · demanda habilitada ${Math.round(cumDemHab).toLocaleString("es-CL")} v/d · inversión $${usedBudget.toLocaleString("es-CL")} M`);
    return { order, totalPob: cumPob, totalDemHab: cumDemHab, totalPobBenef: cumPobBenef, totalBudget: usedBudget };
  }

  return { run, coverageByComuna, setHabThreshold, runSequentialFull, buildComponents, compsNear, sampleGeometry };
})();

window.ENGINE = ENGINE;
