/* ============================================================
   EVA · Versionamiento interno y firmas de configuración
   ------------------------------------------------------------
   Fuente única de versión para interfaz, exportaciones y QA.
   Toda exportación DEBE incluir estas constantes para que una
   corrida sea reproducible y auditable.
============================================================ */

window.EVA_VERSION = {
  ENGINE_VERSION: "3.13.0",       // raíz dendrítica configurable + recálculo modal y dendrítico efectivo dentro del solver secuencial
  DATA_VERSION: "2026.08",        // + límites comunales oficiales RM (52 comunas, EPSG:32719→WGS84) y clasificación ferias vs red ciclable
  DATA_PROCESSING_VERSION: "2026.08-comunas-oficiales", // comuna por overlay punto-en-polígono contra límites oficiales (reemplaza vecino OD más cercano)
  METHODOLOGY_VERSION: "2.4.0",   // priorización secuencial estado-dependiente + raíz dendrítica parametrizable; 15 criterios ponderables activos
  CONTINUITY_FORMULA: "min(1, K_p / 4)",
  MODAL_CHOICE_MODEL: "ciclo_todo_chile 41 (logit binario, Biogeme)",
  FRACTAL_FORMULA: "Score = 100 · α^(g-1); g = saltos BFS a R_t; R_0 = eje raíz configurable + red existente conectada; R_t agrega priorizados; default τ=100 m, α=0.5; aislado = 0",
  BUILD_DATE: "2026-08-29",
};

/* ============================================================
   PARAM_SCHEMA — FUENTE ÚnICA DE VERDAD de los parámetros del motor
   La UI, la ficha metodológica y DEFAULT_PARAMS se derivan de aquí:
   ningún default se escribe a mano en textos sueltos.
============================================================ */
window.PARAM_SCHEMA = {
  distOrigen:  { label: "Acceso origen a red",      default: 700, unit: "m", min: 200, max: 1500, step: 50, active: true,
    description: "Distancia máxima desde la residencia (centroide del hex) a la red ciclable para considerar el origen con acceso.",
    engineUse: "compsNear(origen, distOrigen) — define hexes conectados y población con acceso." },
  distDestino: { label: "Acceso destino a red",     default: 700, unit: "m", min: 200, max: 1500, step: 50, active: true,
    description: "Distancia máxima entre la red y el destino del viaje (comuna destino o sede) para considerar el destino servido.",
    engineUse: "compsNear(destino, distDestino) + serves(K,c) — viabilidad OD y matrícula alcanzable." },
  connectTol:  { label: "Tolerancia de empalme",    default: 150, unit: "m", min: 50,  max: 500,  step: 25, active: true,
    description: "Separación máxima entre ejes para considerarlos en el mismo componente de red.",
    engineUse: "buildComponents(…, connectTol) — define los componentes conexos de la red." },
  habThreshold:{ label: "Cobertura mínima destino",  default: 40,  unit: "%", min: 0,   max: 100,  step: 5,  active: true,
    description: "% mínimo de la población de la comuna destino que una subred debe cubrir para 'servir' ese destino.",
    engineUse: "serves(K,c): pob_≤δD(K,c) / pob_c ≥ habThreshold." },
  costoPorKm:  { label: "Costo por kilómetro",       default: 100, unit: "MCLP/km", min: 1, max: 5000, step: 1, active: true,
    description: "Valor unitario de construcción aplicado a toda la cartera: costo total = longitud × este valor.",
    engineUse: "costoTotal = km × costoPorKm — criterio de eficiencia y restricción de presupuesto." },
  porcProtegido: { label: "% protegido mínimo del viaje", default: 0, unit: "%", min: 0, max: 100, step: 5, active: true,
    description: "Participación mínima de infraestructura ciclable dedicada (ciclovía, cicloparque, senda multipropósito) en la subred que sirve el viaje; las subredes bajo el umbral no habilitan beneficios (0 = sin exigencia).",
    engineUse: "compOK[K]: kmProtegido(K)/kmTotal(K) ≥ umbral — filtra componentes en acceso origen/destino." },
  aproxFinal:  { label: "Aproximación final sin infraestructura", default: 0, unit: "m", min: 0, max: 1500, step: 50, active: true,
    description: "Tramo final del viaje que se acepta recorrer sin infraestructura (calles locales) entre la red y el destino; se suma al radio de acceso destino.",
    engineUse: "distDeff = distDestino + aproxFinal — usado en serves(K,c), sedes y hexes destino." },
  tiempoMax:   { label: "Tiempo máximo de viaje",    default: 0, unit: "min", min: 0, max: 120, step: 5, active: true,
    description: "Duración máxima aceptable del viaje en bicicleta; pares origen-destino más lejanos que velRef·tiempoMax no cuentan como habilitables (0 = sin límite).",
    engineUse: "withinTime(hex, comuna): dist ≤ velRef · tiempoMax / 60 — gate de viabilidad OD." },
  velRef:      { label: "Velocidad de referencia",   default: 15, unit: "km/h", min: 12, max: 20, step: 1, active: true,
    description: "Velocidad media de pedaleo usada para convertir el tiempo máximo de viaje en radio máximo origen-destino.",
    engineUse: "maxKmOD = velRef × tiempoMax / 60 — solo actúa si tiempoMax > 0." },
};
/* defaults activos derivados del schema (para construir DEFAULT_PARAMS y validar) */
window.PARAM_DEFAULTS = Object.fromEntries(Object.entries(window.PARAM_SCHEMA).map(([k, v]) => [k, v.default]));

/* djb2 — hash determinista corto (no criptográfico) para firmar
   configuraciones y datasets. Suficiente para trazabilidad. */
window.evaHash = function (obj) {
  const str = typeof obj === "string" ? obj : JSON.stringify(obj);
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return "h" + h.toString(16).padStart(8, "0");
};

/* Firma del dataset cargado: ahora incluye geometrías, vectores OD y
   matrículas, para detectar cambios relevantes (no solo conteos). */
window.evaDataHash = function () {
  try {
    const round = n => Math.round((+n || 0) * 1e5) / 1e5;
    // muestreo de geometrías de proyectos (primer y último vértice + km)
    const projGeom = (window.projectsFC ? window.projectsFC.features : []).map(f => {
      const g = f.geometry; let a = null, b = null;
      if (g) { const cs = g.type === "MultiLineString" ? g.coordinates.flat() : g.coordinates; if (cs && cs.length) { a = cs[0]; b = cs[cs.length - 1]; } }
      return [f.properties.id, round(f.properties.km), a ? [round(a[0]), round(a[1])] : 0, b ? [round(b[0]), round(b[1])] : 0];
    });
    const existGeom = (window.existingFC ? window.existingFC.features : []).map(f => [f.properties.id, round(f.properties.km)]);
    // OD: suma de flujo por hex (sensible a cambios de vectores) + población
    const hexes = window.populationFC ? window.populationFC.features : [];
    let odSum = 0, pobSum = 0;
    for (const h of hexes) { odSum += (+h.properties.flow || 0); pobSum += (+h.properties.pob || 0); }
    const edu = (window.EDU_SEDES || []).map(s => [(s.properties || s).id, round((s.properties || s).matricula)]);
    const parts = {
      proyectos: projGeom,
      existentes: existGeom.length,
      existHashKm: round((window.EXISTING_KM || 0)),
      hexes: hexes.length,
      odSum: Math.round(odSum),
      pobSum: Math.round(pobSum),
      edu,
      eduTotalMat: window.EDU_TOTAL_MAT || 0,
      comunas: window.OD_COMUNAS ? window.OD_COMUNAS.length : 0,
      v: window.EVA_VERSION,
    };
    return window.evaHash(parts);
  } catch (_) { return "h00000000"; }
};

/* Firma de la configuración efectiva (params + weights + escenario) */
window.evaConfigHash = function (params, weights, extra) {
  return window.evaHash({ params: params || {}, weights: weights || {}, extra: extra || null });
};

/* Bloque de procedencia estándar — se inserta en TODA exportación */
window.evaProvenance = function (params, weights, extra) {
  const v = window.EVA_VERSION;
  return {
    aplicacion: "EVA · Evaluador de ciclovías proyectadas",
    organismo: "Gobierno Regional Metropolitano de Santiago",
    engine_version: v.ENGINE_VERSION,
    data_version: v.DATA_VERSION,
    data_processing_version: v.DATA_PROCESSING_VERSION,
    methodology_version: v.METHODOLOGY_VERSION,
    continuity_formula: v.CONTINUITY_FORMULA,
    modal_choice_model: v.MODAL_CHOICE_MODEL,
    fractal_formula: v.FRACTAL_FORMULA,
    build_date: v.BUILD_DATE,
    exportado_en: new Date().toISOString(),
    data_hash: window.evaDataHash(),
    config_hash: window.evaConfigHash(params, weights, extra),
    unidad_monetaria: "MCLP (millones de pesos chilenos)",
    crs: "EPSG:4326 (WGS84)",
  };
};

if (window.evaLog) window.evaLog("sys", `EVA motor v${window.EVA_VERSION.ENGINE_VERSION} · datos ${window.EVA_VERSION.DATA_VERSION} · metodología v${window.EVA_VERSION.METHODOLOGY_VERSION}`);
