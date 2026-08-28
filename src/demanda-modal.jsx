/* ============================================================
   EvaCiclo · Demanda modal — modelo de elección discreta (logit binario)
   Fuente: estimación Biogeme «ciclo_todo_chile» (modelo 41), logit
   bici vs. no-bici para el viaje al trabajo, a nivel de manzana censal
   (117.072 manzanas, todo Chile, ponderado por ocupados).

   Coeficientes aplicados al contexto RM (ciudad grande, valle central,
   clima no lluvioso-frío): large=1, mid=0, rainy_cold=0.

     V_bici = ASC + (β_dist + β_dist_large)·dist_km
              + β_alt·|Δh| + β_educ·escolaridad + β_ciclo·km_ciclovías_500m
     P(bici) = 1 / (1 + e^(−V_bici))

   Variables por hexágono (recalculadas con datos de la plataforma):
   - dist_km: distancia media ponderada del vector OD laboral del hex
     a los centroides de sus comunas destino.
   - km_ciclovías_500m: km de red ciclable (existente + escenario) a
     ≤500 m del centroide del hex. ES LA PALANCA DE POLÍTICA: cada
     proyecto evaluado la incrementa en los hexes de su corredor.
   - |Δh| y escolaridad: constantes de calibración RM (medias ponderadas
     de la muestra de estimación: 40.5 m y 13.0 años), editables en Tweaks.
============================================================ */

const DEMANDA_MODAL = (function () {
  // Coeficientes estimados (robust t-stat entre paréntesis, todos p<0.001)
  const COEF = {
    ASC: -1.39,          // (−17.5)
    B_dist: -0.0267,     // (−6.2)  por km
    B_dist_large: -0.0819, // (−25) interacción ciudad grande
    B_alt: -0.00778,     // (−23.2) por m de desnivel absoluto
    B_educ: -0.0786,     // (−13.0) por año de escolaridad media
    B_ciclo: 0.13,       // (+13.7) por km de ciclovía en 500 m
  };
  // Constantes de calibración (muestra RM/ciudades grandes de valle central)
  const CAL = { escolaridad: 13.0, absAltura: 40.5, distMedia: 8.37, km500Media: 1.92, shareObs: 0.0403 };

  // Parámetros vivos (Tweaks)
  let P = { bCiclo: COEF.B_ciclo, ascAjuste: 0, escolaridad: CAL.escolaridad, absAltura: CAL.absAltura, radio: 500 };
  function setParams(np) { Object.assign(P, np); }
  function getParams() { return { ...P }; }

  /* ===== Geometría (idéntica convención que el motor) ===== */
  const KX = 92.8, KY = 111.3;      // km por grado en RM
  const CELL_DEG = 0.006;           // ~600 m
  function gridKey(lng, lat) { return Math.floor(lng / CELL_DEG) + "," + Math.floor(lat / CELL_DEG); }
  function neighborCells(lng, lat, dMeters) {
    const r = Math.ceil((dMeters / 1000 / Math.min(KX, KY)) / CELL_DEG) + 1;
    const cx = Math.floor(lng / CELL_DEG), cy = Math.floor(lat / CELL_DEG);
    const cells = [];
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) cells.push((cx + dx) + "," + (cy + dy));
    return cells;
  }
  function distMeters(lng1, lat1, lng2, lat2) {
    const dx = (lng2 - lng1) * KX * 1000, dy = (lat2 - lat1) * KY * 1000;
    return Math.sqrt(dx * dx + dy * dy);
  }
  // Muestrea una geometría lineal en puntos {x, y, km} que conservan la longitud real
  function sampleLine(coords, stepMeters, out) {
    for (let i = 0; i < coords.length - 1; i++) {
      const a = coords[i], b = coords[i + 1];
      const L = distMeters(a[0], a[1], b[0], b[1]);
      const n = Math.max(1, Math.round(L / stepMeters));
      const kmEach = L / n / 1000;
      for (let s = 0; s < n; s++) {
        const t = (s + 0.5) / n;
        out.push({ x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, km: kmEach });
      }
    }
  }
  function sampleGeometry(g, stepMeters, out) {
    if (!g) return;
    if (g.type === "LineString") sampleLine(g.coordinates, stepMeters, out);
    else if (g.type === "MultiLineString") g.coordinates.forEach(ls => sampleLine(ls, stepMeters, out));
  }
  function buildNetGrid(features, stepMeters) {
    const grid = new Map();
    const samples = [];
    for (const f of features) sampleGeometry(f.geometry, stepMeters || 60, samples);
    for (const s of samples) {
      const k = gridKey(s.x, s.y);
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(s);
    }
    return grid;
  }
  // km de red a ≤ radio de un punto
  function kmNear(grid, lng, lat, radio) {
    let km = 0;
    for (const k of neighborCells(lng, lat, radio)) {
      const cell = grid.get(k);
      if (!cell) continue;
      for (const s of cell) if (distMeters(lng, lat, s.x, s.y) <= radio) km += s.km;
    }
    return km;
  }

  /* ===== Variables por hex ===== */
  // Distancia media al trabajo: promedio ponderado del vector OD del hex
  // hacia los centroides de sus comunas destino (mín. 1 km intra-zona).
  function hexDistKm(h) {
    const pr = h.properties;
    if (pr._distKm != null) return pr._distKm;
    const cents = window.COMUNA_CENTROIDS || {};
    const [x, y] = h.geometry.coordinates;
    const dv = pr.dv || {};
    let num = 0, den = 0;
    for (const [code, v] of Object.entries(dv)) {
      const c = cents[+code];
      if (!c || !v) continue;
      const d = Math.max(1, distMeters(x, y, c[0], c[1]) / 1000);
      num += v * d; den += v;
    }
    pr._distKm = den > 0 ? num / den : CAL.distMedia;
    return pr._distKm;
  }
  function utilidad(distKm, km500, esc, alt) {
    return COEF.ASC + P.ascAjuste
      + (COEF.B_dist + COEF.B_dist_large) * distKm
      + COEF.B_alt * (alt != null ? alt : P.absAltura)
      + COEF.B_educ * (esc != null ? esc : P.escolaridad)
      + P.bCiclo * km500;
  }
  const logit = v => 1 / (1 + Math.exp(-v));

  /* ===== Cálculo principal =====
     - Por hex: P(bici) con red base y con escenario (base + priorizados).
     - Por proyecto: Δciclistas = Σ_h ocupados_h · [P(km500+aporte) − P(km500)].
     Devuelve un array alineado con projectsFC.features. */
  function computeAll(existingFC, projectsFC, populationFC, lockedGeoms) {
    const t0 = performance.now();
    const hexes = (populationFC && populationFC.features) || [];
    if (!hexes.length || !existingFC) return [];
    const locked = lockedGeoms || [];
    const baseGrid = buildNetGrid(existingFC.features);
    const escGrid = locked.length ? buildNetGrid([...existingFC.features, ...locked]) : baseGrid;

    let totB = 0, totE = 0, pobT = 0, nVars = 0;
    const VH = window.VARS_MODELO_HEX || {};
    for (const h of hexes) {
      const [x, y] = h.geometry.coordinates;
      const pr = h.properties;
      const d = hexDistKm(h);
      const vh = VH[pr.id];
      const esc = vh ? vh.esc : null, alt = vh ? vh.alt : null;
      if (vh) nVars++;
      pr.escModelo = esc; pr.altModelo = alt; pr.shareObs = vh ? vh.shareObs : null;
      const kmB = kmNear(baseGrid, x, y, P.radio);
      const pB = logit(utilidad(d, kmB, esc, alt));
      const kmE = locked.length ? kmNear(escGrid, x, y, P.radio) : kmB;
      const pE = locked.length ? logit(utilidad(d, kmE, esc, alt)) : pB;
      pr.km500 = Math.round(kmB * 100) / 100;
      pr.km500Esc = Math.round(kmE * 100) / 100;
      pr.pBici = pB; pr.pBiciEsc = pE;
      pr.ciclistasBase = (pr.pob || 0) * pB;
      pr.dCicl = (pr.pob || 0) * (pE - pB);
      totB += (pr.pob || 0) * pB; totE += (pr.pob || 0) * pE; pobT += (pr.pob || 0);
    }
    window.CICLISTAS_BASE = Math.round(totB);
    window.CICLISTAS_ESC = Math.round(totE);
    window.CICLISTAS_DELTA = Math.round(totE - totB);
    window.PBICI_MEDIA = pobT ? totB / pobT : 0;

    // Grilla espacial de hexes para asociarlos a proyectos
    const hgrid = new Map();
    hexes.forEach((h, i) => {
      const [x, y] = h.geometry.coordinates;
      const k = gridKey(x, y);
      if (!hgrid.has(k)) hgrid.set(k, []);
      hgrid.get(k).push(i);
    });

    const out = ((projectsFC && projectsFC.features) || []).map(f => {
      const samples = [];
      sampleGeometry(f.geometry, 60, samples);
      const cand = new Set();
      for (const s of samples) {
        for (const k of neighborCells(s.x, s.y, P.radio)) {
          const cell = hgrid.get(k);
          if (cell) for (const i of cell) cand.add(i);
        }
      }
      let delta = 0, nHex = 0, dPmax = 0;
      for (const i of cand) {
        const h = hexes[i];
        const [x, y] = h.geometry.coordinates;
        const pr = h.properties;
        let add = 0;
        for (const s of samples) if (distMeters(x, y, s.x, s.y) <= P.radio) add += s.km;
        if (add <= 0) continue;
        const p1 = logit(utilidad(hexDistKm(h), (pr.km500Esc != null ? pr.km500Esc : pr.km500) + add, pr.escModelo, pr.altModelo));
        const dP = p1 - (pr.pBiciEsc != null ? pr.pBiciEsc : pr.pBici);
        if (dP <= 0) continue;
        delta += (pr.pob || 0) * dP;
        nHex++;
        if (dP > dPmax) dPmax = dP;
      }
      return { ciclistasInducidos: Math.round(delta), hexModal: nHex, dPbiciMax: dPmax };
    });

    if (window.evaLog) window.evaLog("data",
      `[demanda modal] logit bici: P̄(bici) base ${(window.PBICI_MEDIA * 100).toFixed(2)}% · ${window.CICLISTAS_BASE.toLocaleString("es-CL")} ciclistas/día base · ${nVars} hexes con variables observadas` +
      (locked.length ? ` · escenario +${window.CICLISTAS_DELTA.toLocaleString("es-CL")}` : "") +
      ` · ${out.length} proyectos evaluados (${(performance.now() - t0).toFixed(0)} ms)`);
    return out;
  }

  return { setParams, getParams, computeAll, COEF, CAL };
})();
window.DEMANDA_MODAL = DEMANDA_MODAL;

/* ===== Tweaks: supuestos del modelo editables ===== */
const DEMANDA_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dm_bCiclo": 0.13,
  "dm_ascAjuste": 0,
  "dm_escolaridad": 13,
  "dm_absAltura": 40.5,
  "dm_radio": 500
}/*EDITMODE-END*/;

/* Sección integrada en la barra izquierda (pestaña Umbrales).
   Usa useTweaks para persistir; al cambiar, fija parámetros y notifica
   a App vía evento para reevaluar la demanda modal. */
function useDemandaParams() {
  const [t, setTweak] = useTweaks(DEMANDA_TWEAK_DEFAULTS);
  const first = React.useRef(true);
  React.useEffect(() => {
    DEMANDA_MODAL.setParams({
      bCiclo: +t.dm_bCiclo, ascAjuste: +t.dm_ascAjuste,
      escolaridad: +t.dm_escolaridad, absAltura: +t.dm_absAltura, radio: +t.dm_radio,
    });
    // En el montaje solo fija parámetros: el efecto de App ya recalcula al montar.
    if (first.current) { first.current = false; return; }
    window.dispatchEvent(new CustomEvent("eva:demanda-apply"));
  }, [t.dm_bCiclo, t.dm_ascAjuste, t.dm_escolaridad, t.dm_absAltura, t.dm_radio]);
  return [t, setTweak];
}
window.useDemandaParams = useDemandaParams;
