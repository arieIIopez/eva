/* ============================================================
   EvaCiclo · Vuelo de pájaro sobre el trazado
   - Sobrevuelo cinematográfico in-app (cámara Mapbox siguiendo la traza,
     con ruta iluminada y "cometa" de posición)
   - Salto a Google Earth Web en el punto y rumbo actuales del vuelo
============================================================ */
(function () {
  "use strict";

  /* ---------- geo helpers ---------- */
  const R = 6371000;
  const rad = d => d * Math.PI / 180;
  function distM(a, b) {
    const dLat = rad(b[1] - a[1]), dLon = rad(b[0] - a[0]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  function bearingDeg(a, b) {
    const y = Math.sin(rad(b[0] - a[0])) * Math.cos(rad(b[1]));
    const x = Math.cos(rad(a[1])) * Math.sin(rad(b[1])) - Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(rad(b[0] - a[0]));
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
  function lerpAngle(a, b, t) {
    let d = ((b - a + 540) % 360) - 180;
    return (a + d * t + 360) % 360;
  }
  const easeInOut = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

  function earthUrl(lat, lng, heading, distV) {
    return "https://earth.google.com/web/@" + lat.toFixed(6) + "," + lng.toFixed(6) +
      ",600a," + Math.round(distV) + "d,65y," + ((heading + 360) % 360).toFixed(1) + "h,0t,0r";
  }

  /* Vista satelital exclusiva del modo pájaro (se retira al finalizar) */
  const SAT_LAYER = "fly-sat";
  function addSatellite(map) {
    if (!map.getSource(SAT_LAYER)) {
      map.addSource(SAT_LAYER, { type: "raster", url: "mapbox://mapbox.satellite", tileSize: 256 });
    }
    if (!map.getLayer(SAT_LAYER)) {
      map.addLayer({
        id: SAT_LAYER, type: "raster", source: SAT_LAYER,
        paint: { "raster-opacity": 0, "raster-opacity-transition": { duration: 1400, delay: 0 } },
      });
    }
    // fundido de entrada
    requestAnimationFrame(() => { try { map.setPaintProperty(SAT_LAYER, "raster-opacity", 1); } catch (e) {} });
  }

  /* Terreno 3D exclusivo del modo pájaro: DEM + exageración moderada.
     Se activa al iniciar el vuelo y se retira al finalizar (el modo normal
     del evaluador permanece plano, que es lo correcto para análisis 2D). */
  const DEM_SRC = "fly-dem";
  function addTerrain(map) {
    try {
      if (!map.getSource(DEM_SRC)) {
        map.addSource(DEM_SRC, { type: "raster-dem", url: "mapbox://mapbox.mapbox-terrain-dem-v1", tileSize: 512, maxzoom: 14 });
      }
      map.setTerrain({ source: DEM_SRC, exaggeration: 1.35 });
      if (!map.getFog()) {
        map.setFog({ range: [0.6, 9], color: "#dfe8f2", "horizon-blend": 0.18, "high-color": "#b8cbe0", "star-intensity": 0 });
      }
    } catch (e) { window.evaLog && window.evaLog("warn", "[vuelo] terreno 3D no disponible: " + e.message); }
  }
  function removeTerrain(map) {
    try {
      map.setTerrain(null);
      map.setFog(null);
      if (map.getSource(DEM_SRC)) map.removeSource(DEM_SRC);
    } catch (e) {}
  }

  /* ---------- estilos (una vez) ---------- */
  function injectCSS() {
    if (document.getElementById("eva-fly-css")) return;
    const css = document.createElement("style");
    css.id = "eva-fly-css";
    css.textContent = `
      .fly-bar{position:absolute;left:0;right:0;height:64px;z-index:40;pointer-events:none;opacity:0;transition:opacity .8s ease}
      .fly-bar.top{top:0;background:linear-gradient(to bottom,rgba(6,9,15,.72),transparent)}
      .fly-bar.bottom{bottom:0;background:linear-gradient(to top,rgba(6,9,15,.72),transparent)}
      .fly-bar.on{opacity:1}
      .fly-card{position:absolute;left:50%;bottom:22px;transform:translateX(-50%) translateY(24px);z-index:41;
        width:340px;padding:10px 12px 11px;border-radius:12px;
        background:rgba(12,17,26,.84);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
        border:1px solid rgba(255,255,255,.12);box-shadow:0 14px 40px rgba(0,0,0,.4);
        color:#eef2f7;font-family:inherit;opacity:0;transition:opacity .6s ease,transform .6s cubic-bezier(.2,.9,.25,1)}
      .fly-card.on{opacity:1;transform:translateX(-50%) translateY(0)}
      .fly-kicker{display:flex;align-items:center;gap:7px;font-size:9px;letter-spacing:.12em;text-transform:uppercase;color:#8fb4ff;font-weight:600;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;flex:1}
      .fly-kicker .pulse{width:7px;height:7px;border-radius:50%;background:#5ea0ff;box-shadow:0 0 0 0 rgba(94,160,255,.6);animation:flyPulse 1.6s infinite}
      @keyframes flyPulse{0%{box-shadow:0 0 0 0 rgba(94,160,255,.55)}70%{box-shadow:0 0 0 9px rgba(94,160,255,0)}100%{box-shadow:0 0 0 0 rgba(94,160,255,0)}}
      .fly-head{display:flex;align-items:center;gap:8px;margin-bottom:7px}
      .fly-x{width:22px;height:22px;flex:none;display:grid;place-items:center;border-radius:6px;border:1px solid rgba(255,255,255,.16);
        background:rgba(255,255,255,.07);color:#dfe6ef;cursor:pointer;font-size:11px;line-height:1;transition:background .15s}
      .fly-x:hover{background:rgba(255,255,255,.16)}
      .fly-name{font-size:12.5px;font-weight:600;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0 0 7px}
      .fly-track{height:4px;border-radius:3px;background:rgba(255,255,255,.12);overflow:hidden}
      .fly-fill{height:100%;width:0%;border-radius:3px;background:linear-gradient(90deg,#3d7bff,#39c0d4,#37d391);transition:width .12s linear}
      .fly-stats{display:flex;justify-content:space-between;font-size:9.5px;color:#93a0b3;margin:5px 0 7px;font-variant-numeric:tabular-nums}
      .fly-ctrl{display:flex;align-items:center;gap:8px;margin-bottom:0}
      .fly-speed{flex:1;display:flex;align-items:center;gap:8px}
      .fly-speed input[type=range]{flex:1;-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;background:rgba(255,255,255,.18);outline:none;cursor:pointer}
      .fly-speed input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;border-radius:50%;background:#fff;border:2.5px solid #2f74ff;box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:grab}
      .fly-speed input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#fff;border:2.5px solid #2f74ff;cursor:grab}
      .fly-kmh{min-width:52px;text-align:right;font-size:10px;font-weight:700;color:#dfe6ef;font-variant-numeric:tabular-nums}
      .fly-dir{display:flex;align-items:center;justify-content:center;gap:5px;padding:5px 9px;border-radius:7px;font-size:10.5px;font-weight:600;
        cursor:pointer;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:#dfe6ef;transition:all .18s ease;white-space:nowrap}
      .fly-dir:hover{background:rgba(255,255,255,.14)}
      .fly-dir svg{width:12px;height:12px;transition:transform .3s ease}
      .fly-dir.back svg{transform:scaleX(-1)}
      .fly-btn.earth{background:linear-gradient(135deg,#2f74ff,#12a5b8);border-color:transparent;color:white;box-shadow:0 6px 18px rgba(47,116,255,.35)}
      .fly-btn.earth:hover{filter:brightness(1.1);box-shadow:0 8px 22px rgba(47,116,255,.5)}
      .fly-btn svg{width:14px;height:14px;flex:none}
    `;
    document.head.appendChild(css);
  }

  const GLOBE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 4 5.7 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.7-4-9s1.4-6.4 4-9z"/></svg>';

  let S = null; // estado del vuelo activo

  function cleanup(restoreCamera) {
    if (!S) return;
    cancelAnimationFrame(S.raf);
    const map = S.map;
    // fundido de salida del satélite, luego retirar la capa
    try {
      if (map.getLayer(SAT_LAYER)) {
        map.setPaintProperty(SAT_LAYER, "raster-opacity", 0);
        setTimeout(() => {
          try {
            if (map.getLayer(SAT_LAYER)) map.removeLayer(SAT_LAYER);
            if (map.getSource(SAT_LAYER)) map.removeSource(SAT_LAYER);
          } catch (e) {}
        }, 1500);
      }
    } catch (e) {}
    removeTerrain(map);
    ["fly-route-glow", "fly-route-core", "fly-comet-halo", "fly-comet"].forEach(id => { if (map.getLayer(id)) map.removeLayer(id); });
    ["fly-route", "fly-comet-src"].forEach(id => { if (map.getSource(id)) map.removeSource(id); });
    S.dom.forEach(el => el.remove());
    if (restoreCamera && S.prev) {
      map.easeTo({ center: S.prev.center, zoom: S.prev.zoom, pitch: S.prev.pitch, bearing: S.prev.bearing, duration: 1600, essential: true });
    }
    S = null;
  }

  window.EVA_FLYOVER = function (pid) {
    const map = window.EVA_MAP;
    if (!map) { window.evaLog && window.evaLog("warn", "[vuelo] mapa no disponible"); return; }
    if (S) cleanup(false);

    const f = ((window.projectsFC || {}).features || []).find(x => x.properties.id === pid);
    if (!f) return;
    const p = f.properties;

    // --- traza → path continuo remuestreado cada ~12 m ---
    // Los tramos del MultiLineString pueden venir desordenados: se encadenan de
    // forma greedy (uniendo extremos más cercanos) para que el vuelo recorra la
    // línea de punta a punta, comenzando SIEMPRE por un extremo real.
    const lines = f.geometry.type === "MultiLineString" ? f.geometry.coordinates : [f.geometry.coordinates];
    const segs = lines.filter(l => l && l.length > 1).map(l => l.map(c => [c[0], c[1]]));
    if (!segs.length) return;
    const chain = [segs.shift()];
    while (segs.length) {
      const head = chain[0][0], tail = chain[chain.length - 1][chain[chain.length - 1].length - 1];
      let best = { d: Infinity, i: -1, where: "tail", rev: false };
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i], a = s[0], b = s[s.length - 1];
        const cands = [
          { d: distM(tail, a), where: "tail", rev: false },
          { d: distM(tail, b), where: "tail", rev: true },
          { d: distM(head, b), where: "head", rev: false },
          { d: distM(head, a), where: "head", rev: true },
        ];
        for (const c of cands) if (c.d < best.d) best = { ...c, i };
      }
      const s = segs.splice(best.i, 1)[0];
      if (best.rev) s.reverse();
      if (best.where === "tail") chain.push(s); else chain.unshift(s);
    }
    const raw = [];
    for (const l of chain) for (const c of l) raw.push(c);
    if (raw.length < 2) return;
    const path = [raw[0]];
    for (let i = 1; i < raw.length; i++) {
      const d = distM(raw[i - 1], raw[i]);
      const steps = Math.max(1, Math.round(d / 12));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        path.push([raw[i - 1][0] + (raw[i][0] - raw[i - 1][0]) * t, raw[i - 1][1] + (raw[i][1] - raw[i - 1][1]) * t]);
      }
    }
    const cum = [0];
    for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + distM(path[i - 1], path[i]));
    const totalM = cum[cum.length - 1];
    const pointAt = (d) => {
      if (d <= 0) return path[0];
      if (d >= totalM) return path[path.length - 1];
      let lo = 0, hi = cum.length - 1;
      while (lo < hi - 1) { const mid = (lo + hi) >> 1; if (cum[mid] <= d) lo = mid; else hi = mid; }
      const t = (d - cum[lo]) / Math.max(1e-6, cum[hi] - cum[lo]);
      return [path[lo][0] + (path[hi][0] - path[lo][0]) * t, path[lo][1] + (path[hi][1] - path[lo][1]) * t];
    };

    injectCSS();
    const wrap = document.querySelector(".map-wrap") || document.body;

    // --- vista satelital exclusiva del vuelo ---
    addSatellite(map);
    addTerrain(map);

    // --- ruta iluminada + cometa ---
    map.addSource("fly-route", { type: "geojson", data: { type: "Feature", geometry: f.geometry, properties: {} } });
    map.addLayer({ id: "fly-route-glow", type: "line", source: "fly-route",
      paint: { "line-color": "#3d9bff", "line-width": 12, "line-opacity": 0.32, "line-blur": 6 } });
    map.addLayer({ id: "fly-route-core", type: "line", source: "fly-route",
      paint: { "line-color": "#bfe0ff", "line-width": 3.2, "line-opacity": 0.95 } });
    map.addSource("fly-comet-src", { type: "geojson", data: { type: "Feature", geometry: { type: "Point", coordinates: path[0] }, properties: {} } });
    map.addLayer({ id: "fly-comet-halo", type: "circle", source: "fly-comet-src",
      paint: { "circle-radius": 16, "circle-color": "#5ea0ff", "circle-opacity": 0.25, "circle-blur": 1 } });
    map.addLayer({ id: "fly-comet", type: "circle", source: "fly-comet-src",
      paint: { "circle-radius": 6, "circle-color": "#ffffff", "circle-stroke-width": 2.5, "circle-stroke-color": "#2f74ff" } });

    // --- UI ---
    const mk = (html) => { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; };
    const barT = mk('<div class="fly-bar top"></div>');
    const barB = mk('<div class="fly-bar bottom"></div>');
    const card = mk(`
      <div class="fly-card" title="Rueda del mouse: acercar / alejar">
        <div class="fly-head">
          <div class="fly-kicker"><span class="pulse"></span> Vuelo de pájaro</div>
          <button class="fly-x" title="Finalizar vuelo">✕</button>
        </div>
        <div class="fly-name">${(p.nombre || "Ciclovía").toString().replace(/</g, "&lt;")}</div>
        <div class="fly-track"><div class="fly-fill"></div></div>
        <div class="fly-stats"><span class="fly-kmDone">0.00 km</span><span class="fly-pct">0%</span></div>
        <div class="fly-ctrl">
          <div class="fly-speed">
            <input type="range" class="fly-vel" min="10" max="500" step="10" value="50" title="Velocidad" />
            <span class="fly-kmh">50 km/h</span>
          </div>
          <button class="fly-dir" title="Cambiar sentido del recorrido">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            <span class="fly-dir-label">Ida</span>
          </button>
        </div>
      </div>`);
    wrap.appendChild(barT); wrap.appendChild(barB); wrap.appendChild(card);
    requestAnimationFrame(() => { barT.classList.add("on"); barB.classList.add("on"); card.classList.add("on"); });

    const fill = card.querySelector(".fly-fill");
    const kmDoneEl = card.querySelector(".fly-kmDone");
    const pctEl = card.querySelector(".fly-pct");
    const kickerEl = card.querySelector(".fly-kicker");

    S = {
      map, raf: 0, dom: [barT, barB, card],
      prev: { center: map.getCenter(), zoom: map.getZoom(), pitch: map.getPitch(), bearing: map.getBearing() },
      curPos: path[0], curBearing: bearingDeg(path[0], pointAt(Math.min(120, totalM))),
      // recorrido SIEMPRE desde un extremo de la línea, a velocidad real controlable
      dist: 0,          // posición a lo largo de la traza (m)
      dir: 1,           // 1 = ida (desde el extremo inicial) · -1 = vuelta
      speedKmh: 50,     // velocidad de crucero por defecto
      lastT: 0,
    };

    // --- controles: velocidad y sentido ---
    const velEl = card.querySelector(".fly-vel");
    const kmhEl = card.querySelector(".fly-kmh");
    velEl.addEventListener("input", () => {
      S.speedKmh = +velEl.value;
      kmhEl.textContent = S.speedKmh + " km/h";
    });
    const dirBtn = card.querySelector(".fly-dir");
    const dirLabel = card.querySelector(".fly-dir-label");
    dirBtn.addEventListener("click", () => {
      S.dir = -S.dir;
      dirBtn.classList.toggle("back", S.dir < 0);
      dirLabel.textContent = S.dir > 0 ? "Ida" : "Vuelta";
      kickerEl.innerHTML = '<span class="pulse"></span> Vuelo de p\u00e1jaro \u00b7 ' + (S.dir > 0 ? "ida" : "vuelta");
    });

    card.querySelector(".fly-x").addEventListener("click", () => cleanup(true));

    window.evaLog && window.evaLog("info", `[vuelo] Iniciando sobrevuelo de ${p.id} · ${p.nombre} (${(totalM / 1000).toFixed(2)} km) desde el extremo inicial · 50 km/h`);

    // --- fase 1: aproximación cinematográfica al extremo inicial de la traza ---
    const startBrg = S.curBearing;
    map.easeTo({ center: path[0], zoom: 15.6, pitch: 62, bearing: startBrg, duration: 2400, essential: true });

    // --- fase 2: sobrevuelo a velocidad real (km/h), sentido y zoom controlables ---
    // El zoom NO se fija por frame: la rueda del mouse acerca/aleja libremente.
    const t0 = performance.now() + 2500;
    function frame(now) {
      if (!S) return;
      if (now < t0) { S.raf = requestAnimationFrame(frame); return; }
      if (!S.lastT) S.lastT = now;
      const dt = Math.min(0.1, (now - S.lastT) / 1000); // s (protegido contra pestañas en pausa)
      S.lastT = now;
      S.dist = Math.max(0, Math.min(totalM, S.dist + S.dir * (S.speedKmh / 3.6) * dt));
      const d = S.dist;
      const pos = pointAt(d);
      const aheadD = S.dir > 0 ? Math.min(totalM, d + 140) : Math.max(0, d - 140);
      const ahead = pointAt(aheadD);
      const tgt = distM(pos, ahead) > 4 ? bearingDeg(pos, ahead) : S.curBearing;
      S.curBearing = lerpAngle(S.curBearing, tgt, 0.06);
      S.curPos = pos;
      map.jumpTo({ center: pos, pitch: 62, bearing: S.curBearing }); // sin zoom: lo maneja la rueda
      map.getSource("fly-comet-src").setData({ type: "Feature", geometry: { type: "Point", coordinates: pos }, properties: {} });
      const pct = totalM > 0 ? d / totalM : 0;
      fill.style.width = (pct * 100).toFixed(1) + "%";
      kmDoneEl.textContent = (d / 1000).toFixed(2) + " km";
      pctEl.textContent = Math.round(pct * 100) + "%";
      const atEnd = (S.dir > 0 && d >= totalM) || (S.dir < 0 && d <= 0);
      if (atEnd) {
        kickerEl.innerHTML = '<span class="pulse" style="background:#37d391"></span> ' + (S.dir > 0 ? "Extremo final alcanzado \u00b7 pulsa \u201cVuelta\u201d para regresar" : "Extremo inicial \u00b7 pulsa \u201cIda\u201d para avanzar");
      }
      S.raf = requestAnimationFrame(frame); // el vuelo sigue vivo: cambiar sentido lo reanuda
    }
    S.raf = requestAnimationFrame(frame);
  };
})();
