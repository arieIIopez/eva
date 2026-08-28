/* ============================================================
   EVA · Conectividad fractal (red dendrítica) — window.FRACTAL
   ------------------------------------------------------------
   Prioriza proyectos según su distancia TOPOLÓGICA a un eje raíz
   (Avenida Alameda: ciclovía existente «Alameda» + proyecto
   ALAMEDA TRAMO 3), imitando el crecimiento de una red dendrítica
   o de drenaje (orden de Strahler invertido):

     grado 0 : la raíz misma (Alameda + priorizados)
     grado 1 : proyectos que TOCAN o se APROXIMAN a la raíz
     grado 2 : proyectos que tocan a los de grado 1
     grado n : … atenuación geométrica
     aislado : no alcanza la red por ningún camino → score 0

     Score = BASE · FACTOR^(grado − 1)      (grado ≥ 1)
     Score = BASE                            (grado 0, raíz)

   LÓGICA INCREMENTAL (fractal por etapas): cada proyecto PRIORIZADO
   (candado) se funde con la raíz antes del BFS. Al priorizar una
   ciclovía, en el siguiente recálculo las que se aproximan a ella
   pasan a grado 1 — la red «crece» desde la Alameda como un río
   que va sumando afluentes. La app recalcula esto automáticamente
   en cada cambio de priorización.

   SOBRE LA CONECTIVIDAD GEOMÉTRICA (equivalente a turf):
   Los trazos reales casi nunca se intersectan de forma exacta: dos
   ejes que «se tocan» en terreno suelen quedar separados por 1–80 m
   de dibujo (extremos que no cierran, offsets de digitalización).
   En vez de exigir turf.intersect (que solo detecta cruces exactos),
   usamos una TOLERANCIA DE SNAPPING: dos ejes se consideran
   conectados si (a) algún par de segmentos se cruza (test exacto de
   orientación, equivalente a turf.lineIntersect), o (b) la distancia
   mínima entre segmentos es ≤ toleranciaM (equivalente a
   turf.distance / turf.pointToLineDistance con umbral). El default
   (100 m) es coherente con los umbrales de aproximación ya usados
   en EVA (p. ej. ferias paralelas ≤ 80 m, metro ≤ 250 m).
============================================================ */
(function () {
  const KX = 92.6, KY = 111; // km por grado (lon, lat) ≈ Santiago

  /* ---------- utilidades geométricas ---------- */
  // Extrae todos los segmentos [a,b] de una geometría (Line/MultiLine)
  function segsOf(geom) {
    if (!geom) return [];
    const lines = geom.type === "LineString" ? [geom.coordinates]
      : geom.type === "MultiLineString" ? geom.coordinates : [];
    const out = [];
    for (const line of lines)
      for (let i = 0; i < line.length - 1; i++) out.push([line[i], line[i + 1]]);
    return out;
  }
  // Bounding box expandible (prefiltro barato antes de medir distancias)
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
  // Distancia punto→segmento en km (proyección local plana)
  function ptSegKm(p, s) {
    const ax = (s[0][0] - p[0]) * KX, ay = (s[0][1] - p[1]) * KY;
    const bx = (s[1][0] - p[0]) * KX, by = (s[1][1] - p[1]) * KY;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    const cx = ax + t * dx, cy = ay + t * dy;
    return Math.sqrt(cx * cx + cy * cy);
  }
  // Cruce exacto de segmentos (test de orientación; equivale a turf.lineIntersect)
  const orient = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  function segCross(a, b) {
    const o1 = orient(a[0], a[1], b[0]), o2 = orient(a[0], a[1], b[1]);
    const o3 = orient(b[0], b[1], a[0]), o4 = orient(b[0], b[1], a[1]);
    return o1 * o2 < 0 && o3 * o4 < 0;
  }
  // ¿Dos conjuntos de segmentos están conectados (cruce o distancia ≤ tol)?
  function conectados(segsA, segsB, tolKm) {
    for (const a of segsA) for (const b of segsB) {
      if (segCross(a, b)) return true; // intersección real
      // snapping: mínima distancia entre extremos y segmentos
      if (ptSegKm(a[0], b) <= tolKm || ptSegKm(a[1], b) <= tolKm ||
          ptSegKm(b[0], a) <= tolKm || ptSegKm(b[1], a) <= tolKm) return true;
    }
    return false;
  }

  /* ============================================================
     API PRINCIPAL
     calcularPrioridadFractal(ejePrincipalGeoJSON, proyectosGeoJSON, opts)
     → devuelve un FeatureCollection NUEVO con gradoSeparacion y
       scorePrioridad añadidos a las properties de cada proyecto.
     opts: { toleranciaM = 100, factorAtenuacion = 0.5, baseScore = 100,
             raicesExtra = [features priorizadas que se funden a la raíz] }
  ============================================================ */
  function calcularPrioridadFractal(ejePrincipalGeoJSON, proyectosGeoJSON, opts) {
    opts = opts || {};
    const tolKm = (opts.toleranciaM != null ? opts.toleranciaM : 100) / 1000;
    const factor = opts.factorAtenuacion != null ? opts.factorAtenuacion : 0.5;
    const base = opts.baseScore != null ? opts.baseScore : 100;

    // Raíz (grado 0): eje principal + raíces extra (priorizados → fractal incremental)
    const rootSegs = [];
    for (const f of (ejePrincipalGeoJSON.features || [])) rootSegs.push(...segsOf(f.geometry));
    for (const f of (opts.raicesExtra || [])) rootSegs.push(...segsOf(f.geometry));
    const rootBox = rootSegs.length ? bboxOf(rootSegs, tolKm) : null;

    // Nodos de la red: cada proyecto con sus segmentos + bbox
    const feats = proyectosGeoJSON.features || [];
    const nodes = feats.map(f => {
      const segs = segsOf(f.geometry);
      return { segs, box: segs.length ? bboxOf(segs, tolKm) : null, grado: null };
    });
    const idxRaicesExtra = new Set(opts.idxRaicesExtra || []);

    // PASO 1+2: BFS desde la raíz. Frontera inicial = raíz; en cada onda,
    // los proyectos aún sin grado que conectan con la frontera reciben grado n.
    let frontera = rootBox ? [{ segs: rootSegs, box: rootBox }] : [];
    nodes.forEach((n, i) => { if (idxRaicesExtra.has(i)) n.grado = 0; }); // priorizados = raíz
    let grado = 0;
    while (frontera.length) {
      grado++;
      const nueva = [];
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.grado != null || !n.box) continue;
        for (const fr of frontera) {
          if (!bboxOverlap(n.box, fr.box)) continue; // prefiltro barato
          if (conectados(n.segs, fr.segs, tolKm)) { n.grado = grado; nueva.push(n); break; }
        }
      }
      frontera = nueva; // la siguiente onda parte de los recién conectados
    }

    // PASO 3: score con atenuación geométrica; aislados = 0
    return {
      type: "FeatureCollection",
      features: feats.map((f, i) => {
        const g = nodes[i].grado;
        const score = g == null ? 0 : g === 0 ? base : base * Math.pow(factor, g - 1);
        return {
          type: "Feature",
          geometry: f.geometry,
          properties: Object.assign({}, f.properties, {
            gradoSeparacion: g,                          // null = aislado
            scorePrioridad: Math.round(score * 10) / 10, // 0…base
          }),
        };
      }),
    };
  }

  /* ------------------------------------------------------------
     Raíz ampliada por la RED EXISTENTE: la ciclovía de la Alameda no
     está aislada — se conecta a otras ciclovías ya construidas, y esas
     a otras. Todo lo YA CONSTRUIDO que alcanza la Alameda por la red
     forma parte del tronco (grado 0): un proyecto que toca cualquiera
     de esas ciclovías está tocando la red de la Alameda.
     BFS sobre la red existente antes de evaluar los proyectos.
  ------------------------------------------------------------ */
  function raizDesdeRedExistente(existentesFC, tolKm) {
    const feats = (existentesFC && existentesFC.features) || [];
    const nodes = feats.map(f => {
      const segs = segsOf(f.geometry);
      return { segs, box: segs.length ? bboxOf(segs, tolKm) : null, inRoot: false };
    });
    // Semilla: los ejes cuyo nombre contiene «Alameda»
    let frontera = [];
    feats.forEach((f, i) => {
      if (/alameda/i.test(String(f.properties && f.properties.eje || ""))) {
        nodes[i].inRoot = true;
        frontera.push(nodes[i]);
      }
    });
    // Propagación por contacto entre ciclovías existentes
    while (frontera.length) {
      const nueva = [];
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.inRoot || !n.box) continue;
        for (const fr of frontera) {
          if (!bboxOverlap(n.box, fr.box)) continue;
          if (conectados(n.segs, fr.segs, tolKm)) { n.inRoot = true; nueva.push(n); break; }
        }
      }
      frontera = nueva;
    }
    return {
      type: "FeatureCollection",
      features: feats.filter((f, i) => {
        // Marca para que el mapa pueda destacar el tronco completo
        if (f.properties) f.properties._fractalRaiz = nodes[i].inRoot ? 1 : 0;
        return nodes[i].inRoot;
      }),
    };
  }

  /* ------------------------------------------------------------
     Integración EVA: raíz = toda la RED EXISTENTE conectada a la
     Avenida Alameda + proyecto ALAMEDA TRAMO 3 + geometrías
     priorizadas (lockedGeoms → fractal incremental).
     Devuelve un array alineado con rawFC.features para fundir en
     las properties enriquecidas del ranking.
  ------------------------------------------------------------ */
  function computeForApp(rawFC, lockedGeoms, opts) {
    opts = opts || {};
    const tolM = opts.toleranciaM != null ? opts.toleranciaM : 100;
    // La raíz es la Alameda MÁS toda la red construida que la alcanza
    const eje = raizDesdeRedExistente(window.existingFC, tolM / 1000);
    window.FRACTAL_RAIZ_EXISTENTE = (eje.features || []).length;
    const feats = rawFC.features || [];
    const lockedIds = new Set((lockedGeoms || []).map(f => f.properties && f.properties.id));
    const idxRaicesExtra = [];
    feats.forEach((f, i) => {
      const p = f.properties || {};
      // El tramo 3 de la Alameda es parte de la raíz por definición
      if (/alameda/i.test(String(p.nombre || "")) || lockedIds.has(p.id)) idxRaicesExtra.push(i);
    });
    const res = calcularPrioridadFractal(eje, rawFC, {
      toleranciaM: tolM,
      factorAtenuacion: 0.5,
      baseScore: 100,
      raicesExtra: lockedGeoms || [],
      idxRaicesExtra,
    });
    return res.features.map(f => ({
      gradoSeparacion: f.properties.gradoSeparacion,
      scorePrioridad: f.properties.scorePrioridad,
      _fractalNorm: (f.properties.scorePrioridad || 0) / 100,
    }));
  }

  /* ------------------------------------------------------------
     EJEMPLO DE USO — colorear tramos por prioridad en el mapa
     ------------------------------------------------------------
     const resultado = FRACTAL.calcularPrioridadFractal(ejeFC, proyectosFC);
     // 1) Recorrer el resultado:
     for (const f of resultado.features) {
       console.log(f.properties.id, "grado:", f.properties.gradoSeparacion,
                   "score:", f.properties.scorePrioridad);
     }
     // 2) Pintar en Mapbox GL — actualizar la fuente y usar la expresión:
     map.getSource("proyectos").setData(resultado);
     map.setPaintProperty("proyectos", "line-color", FRACTAL.colorExpression());
  ------------------------------------------------------------ */
  function colorExpression() {
    // Rampa raíz→afluentes: rojo intenso (grado 1) → naranjo → ámbar → gris (aislado)
    return [
      "case",
      ["==", ["coalesce", ["get", "gradoSeparacion"], -1], -1], "#b7c0ca", // aislado
      ["==", ["get", "gradoSeparacion"], 0], "#1d3a8a",  // tronco: existente + priorizados
      ["==", ["get", "gradoSeparacion"], 1], "#c62828",  // toca el tronco
      ["==", ["get", "gradoSeparacion"], 2], "#e0561d",  // segundo orden
      ["==", ["get", "gradoSeparacion"], 3], "#e8a13c",  // tercer orden
      "#d4c48f",                                          // órdenes lejanos
    ];
  }

  window.FRACTAL = { calcularPrioridadFractal, computeForApp, colorExpression, raizDesdeRedExistente };
})();
