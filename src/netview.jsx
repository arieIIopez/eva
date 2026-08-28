/* ============================================================
   EvaCiclo · NetView — visualización de redes aisladas
   ----
   Calcula los componentes conexos de la red EXISTENTE a una
   distancia de conexión variable (100 m – 5 km) y detecta qué
   proyectos de la cartera interconectan redes hoy inconexas.
============================================================ */

// Paleta categórica para subredes (ordenadas por tamaño, km desc)
const NET_PALETTE = [
  "#2563ad", // azul
  "#e05d27", // naranjo
  "#2f9e62", // verde
  "#c93a3a", // rojo
  "#8456c8", // violeta
  "#11a2b8", // cian
  "#c98a1f", // ámbar
  "#d8569b", // magenta
  "#5b6ee1", // índigo
  "#0e7d6a", // teal oscuro
  "#97a224", // oliva
  "#a16a3f", // café
  "#7c4d9e", // púrpura
  "#4a8f2f", // verde hoja
];
const NET_GRAY = "#b3bac4"; // subredes menores

/**
 * Calcula componentes de la red existente a distancia `dist` (m)
 * y marca cada proyecto con cuántas subredes interconecta.
 * Muta:
 *  - window.existingFC features → properties.comp (id de subred)
 *  - window.projectsFC features → properties.connects (nº subredes que une)
 */
window.computeNetView = function (dist) {
  const E = window.ENGINE;
  if (!E || !E.buildComponents) return null;
  const t0 = performance.now();

  // Paso de muestreo adaptativo: a mayor distancia de conexión, menor precisión
  // necesaria (el costo crece con dist² si el paso es fijo → 14s a 5 km).
  const step = Math.max(120, dist / 4);

  const net = E.buildComponents(window.existingFC, [], dist, step);

  // km por componente + marcar features
  const kmByComp = new Array(net.count).fill(0);
  window.existingFC.features.forEach((f, i) => {
    const c = net.comp[i];
    f.properties.comp = c;
    kmByComp[c] += (+f.properties.km || 0);
  });

  // ordenar por km desc → asignar colores
  const comps = kmByComp
    .map((km, id) => ({ id, km: +km.toFixed(1), feats: net.sizes[id] }))
    .sort((a, b) => b.km - a.km);
  const colorByComp = new Map();
  comps.forEach((c, i) => {
    colorByComp.set(c.id, i < NET_PALETTE.length ? NET_PALETTE[i] : NET_GRAY);
    c.color = colorByComp.get(c.id);
    c.rank = i + 1;
  });

  // proyectos: subredes que toca a ≤ dist
  const connectors = [];
  const KX = 92.6, KY = 111;
  const dM = (a, b) => {
    const dx = (b[0] - a[0]) * KX * 1000, dy = (b[1] - a[1]) * KY * 1000;
    return Math.sqrt(dx * dx + dy * dy);
  };
  for (const f of window.projectsFC.features) {
    let ps = [];
    E.sampleGeometry(f.geometry, step, ps);
    // decimación equivalente (geometrías densas en vértices)
    if (step > 130 && ps.length > 2) {
      const dec = [ps[0]];
      let last = ps[0];
      for (let i = 1; i < ps.length - 1; i++) {
        if (dM(last, ps[i]) >= step) { dec.push(ps[i]); last = ps[i]; }
      }
      dec.push(ps[ps.length - 1]);
      ps = dec;
    }
    const touched = new Set();
    for (const [lng, lat] of ps) {
      for (const K of E.compsNear(lng, lat, net.sgrid, dist)) touched.add(K);
    }
    f.properties.connects = touched.size;
    if (touched.size >= 2) {
      // km total de las subredes que une (valor de red)
      const kmUnidos = [...touched].reduce((a, K) => a + kmByComp[K], 0);
      connectors.push({
        id: f.properties.id,
        nombre: f.properties.nombre,
        comuna: f.properties.comuna,
        connects: touched.size,
        comps: [...touched],
        kmUnidos: +kmUnidos.toFixed(1),
      });
    }
  }
  connectors.sort((a, b) => b.connects - a.connects || b.kmUnidos - a.kmUnidos);

  const dt = (performance.now() - t0).toFixed(0);
  console.log(`[netview] dist=${dist}m → ${net.count} subredes · ${connectors.length} proyectos conectores · ${dt}ms`);

  return {
    dist,
    count: net.count,
    comps,            // [{id, km, feats, color, rank}] orden km desc
    colorByComp,      // Map compId → color
    connectors,       // proyectos que unen ≥2 subredes
  };
};

Object.assign(window, { NET_PALETTE, NET_GRAY });
