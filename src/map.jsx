/* ============================================================
   EvaCiclo · MapView — Mapbox GL JS wrapper
   NOTA: Mapbox GL JS 3.x no parsea oklch() en paint properties.
   Todos los colores aquí van en hex/rgba.
============================================================ */

/* ⚠️ SEGURIDAD — TOKEN MAPBOX
   Este token público está embebido en el cliente (inevitable en una app
   estática sin backend). ANTES DE PRODUCCIÓN INSTITUCIONAL debe:
   1) Restringirse por dominio (URL allowlist) en la cuenta Mapbox.
   2) Limitarse a los scopes mínimos (styles:read, tiles:read).
   3) Idealmente, servir tiles tras un proxy/backend del GORE.
   Un token público sin restricción de dominio NO debe considerarse
   apto para despliegue productivo. */
const MAPBOX_TOKEN = window.EVA_MAPBOX_TOKEN || "";

// Paleta del mapa (hex equivalentes de los tokens CSS)
const C = {
  primaryDeep: "#1d3a8a",
  primary:     "#2d54b8",
  primaryMid:  "#4a72c8",
  accent:      "#d97942",
  accentDeep:  "#c95a25",
  accentLight: "#e89366",
  accentDot:   "#e08947",
  white:       "#ffffff",
};

function MapView({
  layersOn,
  selectedId,
  onSelect,
  lockedIds,
  hoveredId,
  onHover,
  scenarioWith,
  selectedHexId,
  onSelectHex,
  hexMode,
  filterComuna,
  categoria,
  filterGrupo,
  netView,
  fractalView,
  layoutTick,
  reevalTick,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const roRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [legendMin, setLegendMin] = useState(false);
  // Escalas visibles en la vista fractal (las controla el panel izquierdo)
  const [fracEscalaTick, setFracEscalaTick] = useState(0);
  useEffect(() => {
    const h = () => setFracEscalaTick(t => t + 1);
    window.addEventListener("eva:fractal-escalas", h);
    return () => window.removeEventListener("eva:fractal-escalas", h);
  }, []);

  // init map once
  useEffect(() => {
    if (mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: window.STGO_CENTER,
      zoom: 11.2,
      pitch: 0,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");

    // Redimensionar el canvas cuando el contenedor cambia de tamaño
    // (colapso de paneles laterales): sin esto queda una franja gris.
    const wrap = containerRef.current.parentElement;
    let resizeTimer = 0, resizeUntil = 0;
    const pump = () => {
      map.resize();
      if (performance.now() < resizeUntil) {
        resizeTimer = setTimeout(pump, 40);
      } else resizeTimer = 0;
    };
    const ro = new ResizeObserver(() => {
      map.resize(); // inmediato
      // y seguir bombeando ~400ms para acompañar la transición de 240ms
      resizeUntil = performance.now() + 400;
      if (!resizeTimer) resizeTimer = setTimeout(pump, 40);
    });
    ro.observe(wrap);
    roRef.current = ro;

    map.on("load", () => {
      window.EVA_MAP = map; // expuesto para el módulo de vuelo de pájaro (flyover)
      map.addSource("existente", { type: "geojson", data: window.existingFC });
      map.addSource("proyectos", { type: "geojson", data: window.projectsFC || { type: "FeatureCollection", features: [] } });
      map.addSource("poblacion", { type: "geojson", data: window.populationFC });
      map.addSource("educacion", { type: "geojson", data: window.EDU_FC || { type: "FeatureCollection", features: [] } });
      map.addSource("siniestros", { type: "geojson", data: window.SINIESTROS_FC || { type: "FeatureCollection", features: [] } });
      map.addSource("monumentos", { type: "geojson", data: window.MON_FC || { type: "FeatureCollection", features: [] } });
      map.addSource("ferias", { type: "geojson", data: window.FERIAS_FC || { type: "FeatureCollection", features: [] } });
      map.addSource("metro", { type: "geojson", data: window.METRO_FC || { type: "FeatureCollection", features: [] } });
      map.addSource("parques", { type: "geojson", data: window.PARQUES_FC || { type: "FeatureCollection", features: [] } });
      map.addSource("comunas", { type: "geojson", data: window.COMUNAS_FC || { type: "FeatureCollection", features: [] } });
      map.addSource("otras", { type: "geojson", data: (window.FC_RAW && window.FC_RAW["Otras carteras"]) || { type: "FeatureCollection", features: [] } });

      // ---- Población heatmap ----
      map.addLayer({
        id: "pob-heat",
        type: "heatmap",
        source: "poblacion",
        layout: { visibility: "none" },
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "pob"], 0, 0, 3000, 0.4, 10000, 0.75, 25000, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 9, 1.1, 14, 3],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,0,0)",
            0.15, "rgba(45,84,184,0.25)",
            0.4, "rgba(74,114,200,0.5)",
            0.65, "rgba(232,163,60,0.65)",
            0.85, "rgba(217,115,30,0.78)",
            1, "rgba(168,66,29,0.88)"
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 18, 12, 30, 14, 48],
          "heatmap-opacity": 0.9,
        }
      });

      // ---- Población dots (escala con población del hex) ----
      map.addLayer({
        id: "pob-dots",
        type: "circle",
        source: "poblacion",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["get", "pob"],
            0, 1.5,
            1000, 3,
            5000, 6,
            15000, 10,
            30000, 14
          ],
          "circle-color": ["case", ["get", "conectada"], C.primary, C.accentDot],
          "circle-opacity": 0.55,
          "circle-stroke-width": 0.5,
          "circle-stroke-color": C.white,
        }
      });

      // ---- P(bici) modelo logit (elección modal) ----
      // Color = probabilidad de elegir bici al trabajo (escenario si hay priorizados);
      // anillo naranjo = el escenario aumenta ciclistas en ese hex.
      map.addLayer({
        id: "pbici-dots",
        type: "circle",
        source: "poblacion",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["get", "pob"],
            0, 2, 1000, 3.5, 5000, 6.5, 15000, 10, 30000, 14
          ],
          "circle-color": [
            "interpolate", ["linear"], ["coalesce", ["get", "pBiciEsc"], ["get", "pBici"], 0],
            0.01, "#31418f",
            0.03, "#1e8a6e",
            0.05, "#f0b429",
            0.09, "#d6461e"
          ],
          "circle-opacity": 0.8,
          "circle-stroke-width": ["case", [">", ["coalesce", ["get", "dCicl"], 0], 0.5], 1.6, 0],
          "circle-stroke-color": "#d6461e",
        }
      });
      map.on("mouseenter", "pbici-dots", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "pbici-dots", () => { map.getCanvas().style.cursor = ""; });
      map.on("click", "pbici-dots", (e) => {
        const f = e.features && e.features[0];
        if (!f || !onSelectHexRef.current) return;
        onSelectHexRef.current(f.properties.id);
      });

      // ---- Hexes alcanzados por proyecto seleccionado ----
      map.addLayer({
        id: "pob-reached-new",
        type: "circle",
        source: "poblacion",
        filter: ["in", ["get", "id"], ["literal", []]],
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["get", "pob"],
            0, 4, 1000, 7, 5000, 11, 15000, 16, 30000, 22
          ],
          "circle-color": C.accentDeep,
          "circle-opacity": 0.7,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": C.white,
        }
      });
      map.addLayer({
        id: "pob-reached-old",
        type: "circle",
        source: "poblacion",
        filter: ["in", ["get", "id"], ["literal", []]],
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["get", "pob"],
            0, 3, 1000, 5, 5000, 8, 15000, 12, 30000, 16
          ],
          "circle-color": C.primary,
          "circle-opacity": 0.4,
          "circle-stroke-width": 1,
          "circle-stroke-color": C.white,
        }
      });

      // ---- Hexes beneficiados por interconexión (viajes nuevos viables) ----
      map.addLayer({
        id: "pob-benef",
        type: "circle",
        source: "poblacion",
        filter: ["in", ["get", "id"], ["literal", []]],
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["get", "pob"],
            0, 3.5, 1000, 6, 5000, 9, 15000, 13, 30000, 18
          ],
          "circle-color": "#1e8a6e",
          "circle-opacity": 0.65,
          "circle-stroke-width": 1.2,
          "circle-stroke-color": C.white,
        }
      });

      // Tooltips de hexes alcanzados
      map.on("mouseenter", "pob-reached-new", () => { map.getCanvas().style.cursor = "help"; });
      map.on("mouseleave", "pob-reached-new", () => { map.getCanvas().style.cursor = ""; });

      // Click en hex de población → selección
      map.on("mouseenter", "pob-dots", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "pob-dots", () => { map.getCanvas().style.cursor = ""; });
      map.on("click", "pob-dots", (e) => {
        const f = e.features && e.features[0];
        if (!f || !onSelectHexRef.current) return;
        onSelectHexRef.current(f.properties.id);
      });
      map.on("click", "pob-reached-new", (e) => {
        const f = e.features && e.features[0];
        if (!f || !onSelectHexRef.current) return;
        onSelectHexRef.current(f.properties.id);
      });

      // ---- Líneas de deseo desde hex seleccionado a sus destinos ----
      map.addSource("desire-lines", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "desire-lines-casing",
        type: "line",
        source: "desire-lines",
        layout: { "line-cap": "round" },
        paint: {
          "line-color": C.white,
          "line-width": 5,
          "line-opacity": 0.9,
        }
      });
      map.addLayer({
        id: "desire-lines",
        type: "line",
        source: "desire-lines",
        layout: { "line-cap": "round" },
        paint: {
          "line-color": C.accentDeep,
          "line-width": ["interpolate", ["linear"], ["get", "rank"], 1, 4.5, 5, 2.5, 10, 1.3],
          "line-opacity": ["interpolate", ["linear"], ["get", "rank"], 1, 0.9, 5, 0.65, 10, 0.4],
        }
      });

      // Marcadores de origen y destino
      map.addSource("desire-points", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "desire-dest",
        type: "circle",
        source: "desire-points",
        filter: ["==", ["get", "role"], "dest"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "flow"], 0, 6, 50, 10, 200, 16, 1000, 24],
          "circle-color": C.accentDeep,
          "circle-opacity": 0.85,
          "circle-stroke-width": 2,
          "circle-stroke-color": C.white,
        }
      });
      map.addLayer({
        id: "desire-origin",
        type: "circle",
        source: "desire-points",
        filter: ["==", ["get", "role"], "origin"],
        paint: {
          "circle-radius": 10,
          "circle-color": "#1d3a8a",
          "circle-opacity": 0.95,
          "circle-stroke-width": 2.5,
          "circle-stroke-color": C.white,
        }
      });
      map.addLayer({
        id: "desire-dest-label",
        type: "symbol",
        source: "desire-points",
        filter: ["==", ["get", "role"], "dest"],
        layout: {
          "text-field": ["get", "label"],
          "text-size": 11,
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-offset": [0, 1.4],
          "text-anchor": "top",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#3a4a5e",
          "text-halo-color": C.white,
          "text-halo-width": 2.5,
        }
      });

      // ---- Siniestros ciclistas: heatmap de densidad (overview) ----
      map.addLayer({
        id: "sin-heat",
        type: "heatmap",
        source: "siniestros",
        layout: { visibility: "none" },
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "peso"], 0, 0.35, 6, 0.8, 18, 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 9, 0.7, 14, 2.2],
          "heatmap-color": [
            "interpolate", ["linear"], ["heatmap-density"],
            0, "rgba(0,0,0,0)",
            0.2, "rgba(245,205,120,0.35)",
            0.45, "rgba(232,140,50,0.55)",
            0.7, "rgba(214,70,30,0.72)",
            1, "rgba(150,12,40,0.86)"
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 9, 12, 14, 30],
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0.85, 13.5, 0.4, 15, 0],
        }
      });

      // ---- Siniestros ciclistas: puntos por severidad (detalle) ----
      map.addLayer({
        id: "sin-dots",
        type: "circle",
        source: "siniestros",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"],
            11, ["match", ["get", "severidad"], "fatal", 3.5, "grave", 2.6, 1.5],
            14, ["match", ["get", "severidad"], "fatal", 7, "grave", 5.5, 3.8],
            16, ["match", ["get", "severidad"], "fatal", 11, "grave", 9, 6.5]
          ],
          "circle-color": ["match", ["get", "severidad"],
            "fatal", "#b3122b", "grave", "#e0561d", "lesion", "#e8a13c", "#9aa6b2"],
          "circle-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0.18, 13, 0.6, 15, 0.88],
          "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 11, 0, 14, 0.8],
          "circle-stroke-color": "#ffffff",
        }
      });
      map.on("mouseenter", "sin-dots", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "sin-dots", () => { map.getCanvas().style.cursor = ""; });
      map.on("click", "sin-dots", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const p = f.properties;
        const sevLabel = { fatal: "Con fallecido(s)", grave: "Con lesionado grave", lesion: "Con lesionados", danios: "Solo da\u00f1os" }[p.severidad] || "Siniestro";
        const sevColor = { fatal: "#b3122b", grave: "#c2511c", lesion: "#9c7016", danios: "#5a6470" }[p.severidad] || "#5a6470";
        const node = document.createElement("div");
        node.className = "popup";
        node.innerHTML = `
          <div class="popup-h">
            <span class="popup-tag" style="background:${sevColor}22;color:${sevColor}">${sevLabel} \u00b7 ${p.anio || ""}</span>
            <span class="popup-name">${(p.tipo || "Siniestro ciclista").toString().replace(/</g, "&lt;")}</span>
          </div>
          <div class="popup-body">
            <div class="popup-metric"><div class="k">Lugar</div><div class="v">${(p.lugar || "\u2014").toString().replace(/</g, "&lt;")}</div></div>
            <div class="popup-metric"><div class="k">Comuna</div><div class="v">${(p.comuna || "\u2014").toString().replace(/</g, "&lt;")}</div></div>
            <div class="popup-metric"><div class="k">Causa</div><div class="v">${(p.causa || "\u2014").toString().replace(/</g, "&lt;")}</div></div>
            <div class="popup-metric"><div class="k">V\u00edctimas</div><div class="v">${(+p.fall||0)} fall \u00b7 ${(+p.grav||0)} grav \u00b7 ${(+p.meng||0)+(+p.leve||0)} leves</div></div>
          </div>`;
        new mapboxgl.Popup({ closeButton: true, offset: 10 }).setLngLat(e.lngLat).setDOMContent(node).addTo(map);
      });

      // ---- Monumentos nacionales (capa de contexto patrimonial) ----
      map.addLayer({
        id: "mon-dots",
        type: "circle",
        source: "monumentos",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 13, 5, 16, 8],
          "circle-color": ["match", ["get", "categoria"],
            "Monumento Histórico", "#0f7d8c",
            "Zona Típica o Pintoresca", "#b3801a",
            "Santuario de la Naturaleza", "#2f8f4e",
            "#0f7d8c"],
          "circle-opacity": 0.85,
          "circle-stroke-width": 1.2,
          "circle-stroke-color": "#ffffff",
        }
      });
      map.on("mouseenter", "mon-dots", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "mon-dots", () => { map.getCanvas().style.cursor = ""; });
      map.on("click", "mon-dots", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const p = f.properties;
        const node = document.createElement("div");
        node.className = "popup";
        node.innerHTML = `
          <div class="popup-h">
            <span class="popup-tag" style="background:#0f7d8c22;color:#0b5e6a">${(p.categoria || "Monumento Nacional").toString().replace(/</g, "&lt;")}</span>
            <span class="popup-name">${(p.nombre || "Monumento Nacional").toString().replace(/</g, "&lt;")}</span>
          </div>
          <div class="popup-body">
            <div class="popup-metric"><div class="k">Comuna</div><div class="v">${(p.comuna || "\u2014").toString().replace(/</g, "&lt;")}</div></div>
            <div class="popup-metric"><div class="k">Tipo</div><div class="v">${(p.tipo || "\u2014").toString().replace(/</g, "&lt;")}</div></div>
            ${p.comp ? `<div class="popup-metric"><div class="k">Componente</div><div class="v">${p.comp.toString().replace(/</g, "&lt;")}</div></div>` : ""}
          </div>`;
        new mapboxgl.Popup({ closeButton: true, offset: 10 }).setLngLat(e.lngLat).setDOMContent(node).addTo(map);
      });

      // ---- Ferias libres (capa de contexto / compatibilidad de uso del espacio) ----
      map.addLayer({
        id: "fer-line",
        type: "line",
        source: "ferias",
        layout: { visibility: "none", "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["match", ["get", "relCiclovia"],
            "cruza", "#c2348b",
            "coincide", "#8f1d5e",
            "paralela", "#e06fae",
            "#b8a0ad"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 3, 13, 6, 16, 11],
          "line-opacity": 0.85,
        }
      });
      map.on("mouseenter", "fer-line", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "fer-line", () => { map.getCanvas().style.cursor = ""; });
      map.on("click", "fer-line", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const p = f.properties;
        const horario = (p.inicio && p.levante) ? `${p.inicio}\u2013${p.levante}` : "\u2014";
        const node = document.createElement("div");
        node.className = "popup";
        node.innerHTML = `
          <div class="popup-h">
            <span class="popup-tag" style="background:#c2348b22;color:#9c2270">${(p.tipo || "Feria").toString().replace(/</g, "&lt;")} \u00b7 ${(p.diasTexto || p.diasAbbr || "").toString().replace(/</g, "&lt;")}</span>
            <span class="popup-name">${(p.nombre || "Feria libre").toString().replace(/</g, "&lt;")}</span>
          </div>
          <div class="popup-body">
            <div class="popup-metric"><div class="k">Ubicaci\u00f3n</div><div class="v">${(p.ubic || "\u2014").toString().replace(/</g, "&lt;")}</div></div>
            <div class="popup-metric"><div class="k">Comuna</div><div class="v">${(p.comuna || "\u2014").toString().replace(/</g, "&lt;")}</div></div>
            <div class="popup-metric"><div class="k">Horario</div><div class="v">${horario}</div></div>
            ${p.puestos ? `<div class="popup-metric"><div class="k">Puestos</div><div class="v">${p.puestos}</div></div>` : ""}
          </div>`;
        new mapboxgl.Popup({ closeButton: true, offset: 10 }).setLngLat(e.lngLat).setDOMContent(node).addTo(map);
      });

      // ---- Estaciones de Metro (hotspots intermodales) ----
      map.addLayer({
        id: "metro-halo",
        type: "circle",
        source: "metro",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 6, 13, 11, 16, 18],
          "circle-color": "#e8541b",
          "circle-opacity": 0.14,
        }
      });
      map.addLayer({
        id: "metro-dot",
        type: "circle",
        source: "metro",
        layout: { visibility: "none" },
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 13, 5, 16, 7],
          "circle-color": "#d6461e",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        }
      });
      map.on("mouseenter", "metro-dot", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "metro-dot", () => { map.getCanvas().style.cursor = ""; });
      map.on("click", "metro-dot", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const p = f.properties;
        const node = document.createElement("div");
        node.className = "popup";
        node.innerHTML = `
          <div class="popup-h">
            <span class="popup-tag" style="background:#d6461e22;color:#b3391a">Estaci\u00f3n de Metro</span>
            <span class="popup-name">${(p.nombre || "Metro").toString().replace(/</g, "&lt;")}</span>
          </div>
          <div class="popup-body">
            <div class="popup-metric"><div class="k">Rol</div><div class="v">Hotspot intermodal bici\u2013metro</div></div>
          </div>`;
        new mapboxgl.Popup({ closeButton: true, offset: 10 }).setLngLat(e.lngLat).setDOMContent(node).addTo(map);
      });

      // ---- Parques (atractores ponderados por tamaño) ----
      map.addLayer({
        id: "parques",
        type: "circle",
        source: "parques",
        layout: { visibility: "none" },
        paint: {
          // radio del símbolo ∝ tamaño del parque (sup_ha), acotado
          "circle-radius": ["interpolate", ["linear"], ["zoom"],
            11, ["interpolate", ["linear"], ["get", "sup_ha"], 0, 2.5, 20, 6, 200, 12],
            15, ["interpolate", ["linear"], ["get", "sup_ha"], 0, 5, 20, 12, 200, 26]
          ],
          "circle-color": "#2f8f4e",
          "circle-opacity": 0.38,
          "circle-stroke-width": 0,
        }
      });
      map.on("mouseenter", "parques", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "parques", () => { map.getCanvas().style.cursor = ""; });
      map.on("click", "parques", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const p = f.properties;
        const node = document.createElement("div");
        node.className = "popup";
        node.innerHTML = `
          <div class="popup-h">
            <span class="popup-tag" style="background:#2f8f4e22;color:#1e6b38">Parque · atractor</span>
            <span class="popup-name">${(p.nombre || "Parque").toString().replace(/</g, "&lt;")}</span>
          </div>
          <div class="popup-body">
            <div class="popup-metric"><div class="k">Superficie</div><div class="v">${(+p.sup_ha||0).toLocaleString("es-CL")} ha</div></div>
            <div class="popup-metric"><div class="k">Comuna</div><div class="v">${(p.comuna || "\u2014").toString().replace(/</g, "&lt;")}</div></div>
          </div>`;
        new mapboxgl.Popup({ closeButton: true, offset: 10 }).setLngLat(e.lngLat).setDOMContent(node).addTo(map);
      });

      // ---- Otras carteras (referencia: MOP, MINVU, MTT, municipios, privados) ----
      map.addLayer({
        id: "otras",
        type: "line",
        source: "otras",
        layout: { visibility: "none", "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#6b4ea8",
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1.2, 13, 2.4, 16, 4],
          "line-opacity": 0.75,
          "line-dasharray": [2, 1.5],
        }
      });

      // ---- Límites comunales (RM) ----
      map.addLayer({
        id: "comunas-line",
        type: "line",
        source: "comunas",
        layout: { visibility: "none", "line-join": "round" },
        paint: { "line-color": "#8a93a6", "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.8, 14, 1.8], "line-opacity": 0.85 }
      });
      map.addLayer({
        id: "comunas-label",
        type: "symbol",
        source: "comunas",
        layout: {
          visibility: "none",
          "text-field": ["get", "COMUNA"],
          "text-size": 11,
          "text-transform": "uppercase",
          "text-letter-spacing": 0.04,
        },
        paint: { "text-color": "#5b6472", "text-halo-color": "#ffffff", "text-halo-width": 1.4 }
      });

      // ---- Red existente casing ----
      map.addLayer({
        id: "existente-casing",
        type: "line",
        source: "existente",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": C.white,
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2.4, 13, 4.2, 15, 6.5],
          "line-opacity": 0.85,
        }
      });

      // ---- Red existente ----
      map.addLayer({
        id: "existente",
        type: "line",
        source: "existente",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": [
            "match", ["get", "tipoNorm"],
            "ciclovia",   "#1d3a8a",
            "smp",        "#4a72c8",
            "cicloparque","#2f8769",
            "zona30",     "#7a8a9c",
            "piloto",     "#7396d6",
            "#5a7fc2"
          ],
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.3, 13, 2.6, 15, 4.2],
          "line-opacity": 0.95,
        }
      });

      // ---- Proyectos casing ----
      map.addLayer({
        id: "proyectos-casing",
        type: "line",
        source: "proyectos",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": C.white,
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 4, 15, 9],
          "line-opacity": 0.9,
        }
      });

      // ---- Proyectos dashed (no incorporados) ----
      // Color sutil por escala: Metropolitana más saturado, Comunal más tenue
      map.addLayer({
        id: "proyectos",
        type: "line",
        source: "proyectos",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": [
            "case", ["==", ["get", "categoria"], "Otras carteras"], "#6b4ea8",
            ["match", ["get", "escala"],
              "Metropolitana", "#a8421d",
              "Intercomunal", "#d9731e",
              "#e8a33c"]
          ],
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            10, ["match", ["get", "escala"], "Metropolitana", 3.2, "Intercomunal", 2.6, 2.0],
            15, ["match", ["get", "escala"], "Metropolitana", 6.5, "Intercomunal", 5.5, 4.8]
          ],
          "line-dasharray": [2, 1.4],
        }
      });

      // ---- Selección ----
      map.addLayer({
        id: "proyectos-sel",
        type: "line",
        source: "proyectos",
        filter: ["==", ["get", "id"], "__none__"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": C.accentDeep,
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 4.5, 15, 8.5],
        }
      });

      // ---- Hover ----
      map.addLayer({
        id: "proyectos-hover",
        type: "line",
        source: "proyectos",
        filter: ["==", ["get", "id"], "__none__"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": C.accentLight,
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 3.2, 15, 7],
          "line-opacity": 0.8,
        }
      });

      // ---- Locked (priorizados, ya incorporados a la base) ----
      map.addLayer({
        id: "proyectos-locked",
        type: "line",
        source: "proyectos",
        filter: ["in", ["get", "id"], ["literal", []]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": C.primary,
          "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2, 15, 5],
        }
      });

      // ---- Sedes de educación superior (polos de atracción) ----
      map.addLayer({
        id: "edu-sedes",
        type: "circle",
        source: "educacion",
        paint: {
          "circle-radius": [
            "interpolate", ["linear"], ["get", "matricula"],
            0, 3, 2000, 5, 8000, 8, 20000, 12, 40000, 16
          ],
          "circle-color": "#7c3aed",
          "circle-opacity": 0.75,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": C.white,
        }
      });
      map.on("mouseenter", "edu-sedes", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "edu-sedes", () => { map.getCanvas().style.cursor = ""; });
      map.on("click", "edu-sedes", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;
        const p = f.properties;
        const node = document.createElement("div");
        node.className = "popup";
        node.innerHTML = `
          <div class="popup-h">
            <span class="popup-tag" style="background:#ede9fe;color:#6d28d9">${(p.tipo || "").replace(/</g,"&lt;")}</span>
            <span class="popup-name">${(p.inst || "").replace(/</g,"&lt;")}</span>
          </div>
          <div class="popup-body">
            <div class="popup-metric"><div class="k">Sede</div><div class="v">${(p.sede || "—").replace(/</g,"&lt;")}</div></div>
            <div class="popup-metric"><div class="k">Matrícula 2025</div><div class="v">${fmtN(+p.matricula || 0)}</div></div>
            <div class="popup-metric"><div class="k">Comuna</div><div class="v">${p.comuna || "—"}</div></div>
          </div>`;
        new mapboxgl.Popup({ closeButton: true, offset: 12 })
          .setLngLat(e.lngLat).setDOMContent(node).addTo(map);
      });

      // ---- Interactions ----
      map.on("mouseenter", "proyectos", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "proyectos", () => { map.getCanvas().style.cursor = ""; });

      map.on("click", "proyectos", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;
        if (onSelectRef.current) onSelectRef.current(f.properties.id);
      });

      map.on("mousemove", "proyectos", (e) => {
        const f = e.features && e.features[0];
        if (!f) return;
        if (onHoverRef.current) onHoverRef.current(f.properties.id, e.lngLat);
      });
      map.on("mouseleave", "proyectos", () => {
        if (onHoverRef.current) onHoverRef.current(null);
      });

      setLoaded(true);
    });
  }, []);

  // refs for callbacks
  const onSelectRef = useRef(onSelect);
  const onHoverRef = useRef(onHover);
  const onSelectHexRef = useRef(onSelectHex);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => { onHoverRef.current = onHover; }, [onHover]);
  useEffect(() => { onSelectHexRef.current = onSelectHex; }, [onSelectHex]);

  // Líneas de deseo desde el hex seleccionado
  useEffect(() => {
    if (!loaded) return;
    const map = mapRef.current;
    const linesSrc = map.getSource("desire-lines");
    const ptsSrc = map.getSource("desire-points");
    if (!linesSrc || !ptsSrc) return;
    if (!selectedHexId) {
      linesSrc.setData({ type: "FeatureCollection", features: [] });
      ptsSrc.setData({ type: "FeatureCollection", features: [] });
      return;
    }
    const hex = window.populationFC.features.find(h => h.properties.id === selectedHexId);
    if (!hex) return;
    const [olng, olat] = hex.geometry.coordinates;

    // Construir pares según modo: destinos del hex, u orígenes hacia su comuna
    const ds = [];
    if (hexMode === "orig") {
      const code = hex.properties.comuna;
      const list = (window.INCOMING_COMUNAS_BY_COMUNA && window.INCOMING_COMUNAS_BY_COMUNA.get(code)) || [];
      list.slice(0, 10).forEach((o, i) => {
        const centroid = window.COMUNA_CENTROIDS && window.COMUNA_CENTROIDS[o.code];
        if (!centroid) return;
        const c = window.OD_COMUNAS_MAP.get(o.code);
        ds.push({ rank: i + 1, code: o.code, name: c ? c.name : ("Comuna " + o.code), flow: o.flow, lng: centroid[0], lat: centroid[1] });
      });
    } else {
      for (let i = 1; i <= 10; i++) {
        const code = hex.properties["d" + i];
        const v = hex.properties["d" + i + "v"];
        if (!code || !v) continue;
        const centroid = window.COMUNA_CENTROIDS && window.COMUNA_CENTROIDS[code];
        if (!centroid) continue;
        const c = window.OD_COMUNAS_MAP.get(code);
        const name = c ? c.name : ("Comuna " + code);
        ds.push({ rank: i, code, name, flow: v, lng: centroid[0], lat: centroid[1] });
      }
    }

    const lineFeatures = ds.map(d => {
      // En modo orígenes la curva va del origen al hex; en destinos, del hex al destino
      const [alng, alat] = hexMode === "orig" ? [d.lng, d.lat] : [olng, olat];
      const [blng, blat] = hexMode === "orig" ? [olng, olat] : [d.lng, d.lat];
      const midLng = (alng + blng) / 2;
      const midLat = (alat + blat) / 2;
      const dx = blng - alng, dy = blat - alat;
      const len = Math.sqrt(dx*dx + dy*dy);
      const px = -dy / (len || 1), py = dx / (len || 1);
      const k = 0.18 * len;
      const ctrl = [midLng + px * k, midLat + py * k];
      const coords = [];
      const N = 32;
      for (let s = 0; s <= N; s++) {
        const t = s / N;
        const x = (1-t)*(1-t)*alng + 2*(1-t)*t*ctrl[0] + t*t*blng;
        const y = (1-t)*(1-t)*alat + 2*(1-t)*t*ctrl[1] + t*t*blat;
        coords.push([x, y]);
      }
      return {
        type: "Feature",
        properties: { rank: d.rank, flow: d.flow, name: d.name },
        geometry: { type: "LineString", coordinates: coords }
      };
    });
    linesSrc.setData({ type: "FeatureCollection", features: lineFeatures });

    const pointFeatures = [
      { type: "Feature", properties: { role: "origin" }, geometry: { type: "Point", coordinates: [olng, olat] } },
      ...ds.map(d => ({
        type: "Feature",
        properties: { role: "dest", flow: d.flow, label: d.name },
        geometry: { type: "Point", coordinates: [d.lng, d.lat] }
      }))
    ];
    ptsSrc.setData({ type: "FeatureCollection", features: pointFeatures });
  }, [loaded, selectedHexId, hexMode]);

  // Resize explícito cuando cambia el layout de paneles (colapso/expansión).
  // No dependemos solo del ResizeObserver: bombeamos con timers durante la
  // transición de 240ms para que el canvas siga al contenedor sin franja gris.
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    map.resize();
    const t0 = performance.now();
    const iv = setInterval(() => {
      map.resize();
      if (performance.now() - t0 > 500) clearInterval(iv);
    }, 40);
    return () => clearInterval(iv);
  }, [layoutTick]);

  // Refresh poblacion source cuando reevalúa el motor (cambian umbrales/lockeds)
  useEffect(() => {
    if (!loaded) return;
    const map = mapRef.current;
    const src = map.getSource("poblacion");
    if (src) src.setData(window.populationFC);
    const psrc = map.getSource("proyectos");
    if (psrc && window.projectsFC) psrc.setData(window.projectsFC);
  }, [loaded, reevalTick]);

  // Filtro territorial: ocultar proyectos cuya comuna no coincide
  useEffect(() => {
    if (!loaded) return;
    const map = mapRef.current;
    const locked = lockedIds && lockedIds.length ? lockedIds : [];
    const grupo = filterGrupo && window.GRUPOS_TERRITORIALES && window.GRUPOS_TERRITORIALES[filterGrupo];
    const escalasOn = ["Metropolitana", "Intercomunal", "Comunal"].filter(e =>
      e === "Metropolitana" ? layersOn.proyectosMetro !== false :
      e === "Intercomunal" ? layersOn.proyectosInter !== false :
      layersOn.proyectosComunal !== false
    );
    const escalaFilter = ["any",
      ["!", ["in", ["get", "escala"], ["literal", ["Metropolitana", "Intercomunal", "Comunal"]]]],
      ["in", ["get", "escala"], ["literal", escalasOn]]
    ];
    if ((!filterComuna || filterComuna === "Todas") && !grupo) {
      map.setFilter("proyectos", ["all", ["!", ["in", ["get", "id"], ["literal", locked]]], escalaFilter]);
      map.setFilter("proyectos-casing", ["all", ["!", ["in", ["get", "id"], ["literal", locked]]], escalaFilter]);
      return;
    }
    // Filtro por comuna única o por grupo territorial (provincia / Gran Santiago)
    const terr = grupo
      ? ["any", ...grupo.map(c => ["in", c.toLowerCase(), ["downcase", ["to-string", ["get", "comunas"]]]])]
      : ["in", filterComuna.toLowerCase(), ["downcase", ["to-string", ["get", "comunas"]]]];
    map.setFilter("proyectos", ["all", ["!", ["in", ["get", "id"], ["literal", locked]]], terr, escalaFilter]);
    map.setFilter("proyectos-casing", ["all", ["!", ["in", ["get", "id"], ["literal", locked]]], terr, escalaFilter]);
  }, [loaded, filterComuna, filterGrupo, lockedIds, layersOn.proyectosMetro, layersOn.proyectosInter, layersOn.proyectosComunal]);

  // Layer visibility
  useEffect(() => {
    if (!loaded) return;
    const map = mapRef.current;
    const setVis = (id, v) => map.getLayer(id) && map.setLayoutProperty(id, "visibility", v ? "visible" : "none");
    setVis("existente", layersOn.existente);
    setVis("existente-casing", layersOn.existente);
    setVis("proyectos", layersOn.proyectos);
    setVis("proyectos-casing", layersOn.proyectos);
    setVis("proyectos-sel", layersOn.proyectos);
    setVis("proyectos-hover", layersOn.proyectos);
    setVis("proyectos-locked", layersOn.proyectos);
    setVis("pob-heat", layersOn.poblacionHeat);
    setVis("pob-dots", layersOn.poblacionDots);
    setVis("pbici-dots", layersOn.pbici);
    setVis("edu-sedes", layersOn.educacion);
    setVis("sin-heat", layersOn.siniestros);
    setVis("sin-dots", layersOn.siniestros);
    setVis("mon-dots", layersOn.monumentos);
    setVis("fer-line", layersOn.ferias);
    setVis("metro-halo", layersOn.metro);
    setVis("metro-dot", layersOn.metro);
    setVis("parques", layersOn.parques);
    setVis("comunas-line", layersOn.comunas);
    setVis("comunas-label", layersOn.comunas);
    setVis("otras", layersOn.otras);

    // ---- Sub-filtros por subcapa ----
    const on = k => layersOn[k] !== false;
    // Red existente por tipo (otros tipos: siempre visibles)
    const exTipos = [];
    if (on("existCiclovia")) exTipos.push("ciclovia");
    if (on("existSmp")) exTipos.push("smp");
    if (on("existCicloparque")) exTipos.push("cicloparque");
    const exFilter = ["any",
      ["!", ["in", ["get", "tipoNorm"], ["literal", ["ciclovia", "smp", "cicloparque"]]]],
      ["in", ["get", "tipoNorm"], ["literal", exTipos]]
    ];
    map.setFilter("existente", exFilter);
    map.setFilter("existente-casing", exFilter);
    // Siniestros por severidad
    const sevs = [];
    if (on("sinFatal")) sevs.push("fatal");
    if (on("sinGrave")) sevs.push("grave");
    if (on("sinLesion")) sevs.push("lesion");
    if (on("sinDanios")) sevs.push("danios");
    const sinFilter = ["in", ["coalesce", ["get", "severidad"], "danios"], ["literal", sevs]];
    map.setFilter("sin-dots", sinFilter);
    map.setFilter("sin-heat", sinFilter);
    // Monumentos por categoría
    const cats = [];
    if (on("monHistorico")) cats.push("Monumento Histórico");
    if (on("monZona")) cats.push("Zona Típica o Pintoresca");
    if (on("monSantuario")) cats.push("Santuario de la Naturaleza");
    map.setFilter("mon-dots", ["in", ["coalesce", ["get", "categoria"], "Monumento Histórico"], ["literal", cats]]);
    // Ferias por relación con la red ciclable
    const rels = [];
    if (on("ferCruza")) rels.push("cruza");
    if (on("ferCoincide")) rels.push("coincide");
    if (on("ferParalela")) rels.push("paralela");
    if (on("ferSin")) rels.push("sin");
    map.setFilter("fer-line", ["in", ["coalesce", ["get", "relCiclovia"], "sin"], ["literal", rels]]);
  }, [loaded, layersOn]);

  // Selected filter
  useEffect(() => {
    if (!loaded) return;
    const map = mapRef.current;
    map.setFilter("proyectos-sel", ["==", ["get", "id"], selectedId || "__none__"]);

    // Hexes alcanzados por el proyecto seleccionado
    const sel = selectedId ? window.PROJECTS.find(p => p.id === selectedId) : null;
    const newIds = sel && sel._hexNew ? sel._hexNew : [];
    const allIds = sel && sel._hexReached ? sel._hexReached : [];
    const benefIds = sel && sel._hexBenef ? sel._hexBenef.filter(id => !newIds.includes(id)) : [];
    const oldIds = allIds.filter(id => !newIds.includes(id) && !benefIds.includes(id));
    map.setFilter("pob-reached-new", ["in", ["get", "id"], ["literal", newIds]]);
    map.setFilter("pob-reached-old", ["in", ["get", "id"], ["literal", oldIds]]);
    map.setFilter("pob-benef", ["in", ["get", "id"], ["literal", benefIds]]);
  }, [loaded, selectedId]);

  // Hover filter
  useEffect(() => {
    if (!loaded) return;
    const map = mapRef.current;
    map.setFilter("proyectos-hover", ["==", ["get", "id"], hoveredId || "__none__"]);
  }, [loaded, hoveredId]);

  // Locked: solo aplica al layer de proyectos-locked.
  // Los filtros de "proyectos" y "proyectos-casing" los maneja el useEffect
  // de filterComuna (que combina filtro territorial + exclusión de lockeds).
  useEffect(() => {
    if (!loaded) return;
    const map = mapRef.current;
    const locked = lockedIds && lockedIds.length ? lockedIds : [];
    map.setFilter("proyectos-locked", ["in", ["get", "id"], ["literal", locked]]);
  }, [loaded, lockedIds]);

  // Escenario / vista de subredes (prioridad: netview > escenario > default)
  useEffect(() => {
    if (!loaded) return;
    const map = mapRef.current;
    const nv = netView || {};

    if (nv.active && nv.result && nv.result.comps.length) {
      // refrescar data con properties.comp / connects ya mutados
      map.getSource("existente").setData(window.existingFC);
      map.getSource("proyectos").setData(window.projectsFC);

      // existente coloreado por subred
      const expr = ["match", ["get", "comp"]];
      nv.result.comps.forEach((c, i) => {
        if (i < window.NET_PALETTE.length) expr.push(c.id, c.color);
      });
      expr.push(window.NET_GRAY);
      map.setPaintProperty("existente", "line-color", expr);
      map.setPaintProperty("existente", "line-width", ["interpolate", ["linear"], ["zoom"], 10, 2.2, 13, 3.8, 15, 5.5]);
      map.setPaintProperty("existente", "line-opacity", 1);

      // proyectos: conectores destacados en negro, resto atenuado
      map.setPaintProperty("proyectos", "line-color", [
        "case", [">=", ["coalesce", ["get", "connects"], 0], 2],
        "#1a1d24",
        "#c0c6cf"
      ]);
      map.setPaintProperty("proyectos", "line-width", [
        "interpolate", ["linear"], ["zoom"],
        10, ["case", [">=", ["coalesce", ["get", "connects"], 0], 2], 3.4, 1.6],
        15, ["case", [">=", ["coalesce", ["get", "connects"], 0], 2], 7, 3.6]
      ]);
      map.setPaintProperty("proyectos", "line-dasharray", [2, 1.2]);
      return;
    }

    // ---- Vista de conectividad fractal (red dendrítica desde la Alameda) ----
    if (fractalView) {
      const fe = window.FRACTAL_ESCALAS || { metro: false, local: true };
      const escVis = [
        "case",
        ["==", ["get", "escala"], "Metropolitana"], fe.metro ? 1 : 0,
        fe.local ? 1 : 0
      ];
      map.getSource("existente").setData(window.existingFC);
      map.getSource("proyectos").setData(window.projectsFC);
      // Red base atenuada; el eje raíz (Alameda) destacado en granate
      map.setPaintProperty("existente", "line-color", [
        "case", ["==", ["coalesce", ["get", "_fractalRaiz"], 0], 1], "#1d3a8a", "#cbd3dc"
      ]);
      map.setPaintProperty("existente", "line-width", [
        "interpolate", ["linear"], ["zoom"],
        10, ["case", ["==", ["coalesce", ["get", "_fractalRaiz"], 0], 1], 3.2, 1.2],
        15, ["case", ["==", ["coalesce", ["get", "_fractalRaiz"], 0], 1], 7, 2.6]
      ]);
      map.setPaintProperty("existente", "line-opacity", [
        "case", ["==", ["coalesce", ["get", "_fractalRaiz"], 0], 1], 1, 0.3
      ]);
      // Proyectos por grado de separación topológica
      map.setPaintProperty("proyectos", "line-color", window.FRACTAL ? window.FRACTAL.colorExpression() : "#c62828");
      map.setPaintProperty("proyectos", "line-width", [
        "interpolate", ["linear"], ["zoom"],
        10, ["match", ["coalesce", ["get", "gradoSeparacion"], -1], 0, 5, 1, 4.6, 1.2],
        15, ["match", ["coalesce", ["get", "gradoSeparacion"], -1], 0, 10, 1, 9.5, 2.4]
      ]);
      map.setPaintProperty("proyectos", "line-dasharray", [1, 0]);
      map.setPaintProperty("proyectos", "line-opacity", [
        "*", escVis,
        ["case",
          ["==", ["coalesce", ["get", "gradoSeparacion"], -1], 0], 0.9,
          ["==", ["get", "gradoSeparacion"], 1], 1,
          0.15
        ]
      ]);
      // Distinción de jerarquía: las metropolitanas llevan orla oscura (troncal);
      // comunales e intercomunales van sin orla (afluentes). Solo en grado 1.
      map.setPaintProperty("proyectos-casing", "line-color", [
        "case", ["all", ["==", ["get", "escala"], "Metropolitana"], ["==", ["get", "gradoSeparacion"], 1]], "#1a1d24", "rgba(0,0,0,0)"
      ]);
      map.setPaintProperty("proyectos-casing", "line-width", [
        "interpolate", ["linear"], ["zoom"],
        10, ["case", ["all", ["==", ["get", "escala"], "Metropolitana"], ["==", ["get", "gradoSeparacion"], 1]], 7.5, 0],
        15, ["case", ["all", ["==", ["get", "escala"], "Metropolitana"], ["==", ["get", "gradoSeparacion"], 1]], 14, 0]
      ]);
      map.setPaintProperty("proyectos-casing", "line-opacity", ["*", escVis, 0.85]);
      return;
    }
    map.setPaintProperty("proyectos", "line-opacity", 1);
    map.setPaintProperty("proyectos-casing", "line-color", C.white);
    map.setPaintProperty("proyectos-casing", "line-width", ["interpolate", ["linear"], ["zoom"], 10, 4, 15, 9]);
    map.setPaintProperty("proyectos-casing", "line-opacity", 0.9);

    // restaurar existente por tipo
    map.setPaintProperty("existente", "line-color", [
      "match", ["get", "tipoNorm"],
      "ciclovia",   "#1d3a8a",
      "smp",        "#4a72c8",
      "cicloparque","#2f8769",
      "zona30",     "#7a8a9c",
      "piloto",     "#7396d6",
      "#5a7fc2"
    ]);
    map.setPaintProperty("existente", "line-width", ["interpolate", ["linear"], ["zoom"], 10, 1.3, 13, 2.6, 15, 4.2]);
    map.setPaintProperty("existente", "line-opacity", 0.95);

    // restaurar proyectos según escenario
    map.setPaintProperty("proyectos", "line-width", [
      "interpolate", ["linear"], ["zoom"],
      10, ["match", ["get", "escala"], "Metropolitana", 3.2, "Intercomunal", 2.6, 2.0],
      15, ["match", ["get", "escala"], "Metropolitana", 6.5, "Intercomunal", 5.5, 4.8]
    ]);
    if (scenarioWith) {
      map.setPaintProperty("proyectos", "line-dasharray", [1, 0]);
      map.setPaintProperty("proyectos", "line-color", C.primary);
    } else {
      map.setPaintProperty("proyectos", "line-dasharray", [2, 1.4]);
      map.setPaintProperty("proyectos", "line-color", [
        "case", ["==", ["get", "categoria"], "Otras carteras"], "#6b4ea8",
        ["match", ["get", "escala"],
        "Metropolitana", "#a8421d",
        "Intercomunal", "#d9731e",
        "#e8a33c"
      ]]);
    }
  }, [loaded, scenarioWith, fractalView, fracEscalaTick, reevalTick, netView && netView.active, netView && netView.result]);

  const fitCartera = () => {
    if (mapRef.current && window.CARTERA_BOUNDS) {
      mapRef.current.fitBounds(window.CARTERA_BOUNDS, { padding: 60, duration: 800, maxZoom: 12 });
    }
  };

  // Hover popup
  useEffect(() => {
    if (!loaded) return;
    const map = mapRef.current;
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
    if (!hoveredId) return;
    const p = window.PROJECTS.find(x => x.id === hoveredId);
    if (!p) return;
    const mid = [p.centerLng, p.centerLat];
    const escalaTag = (p.escala || "").toUpperCase();
    const node = document.createElement("div");
    node.className = "popup";
    node.innerHTML = `
      <div class="popup-h">
        <span class="popup-tag">${escalaTag || "PROYECTO"} · ${p.id}</span>
        <span class="popup-name">${(p.nombre || "").toString().replace(/</g, "&lt;")}</span>
      </div>
      <div class="popup-body">
        <div class="popup-metric"><div class="k">Población marginal</div><div class="v">${fmtN(p.poblacion)}</div></div>
        <div class="popup-metric"><div class="k">Pob. beneficiada OD</div><div class="v">${fmtN(p.pobBeneficiada || 0)}</div></div>
        <div class="popup-metric"><div class="k">Demanda habilitada</div><div class="v">${fmtN(p.demandaHabilitada || 0)} v/d</div></div>
        <div class="popup-metric"><div class="k">Componentes que une</div><div class="v">${p.componentesUnidos ?? "—"}</div></div>
        <div class="popup-metric"><div class="k">Longitud</div><div class="v">${(+p.km).toFixed(2)} km</div></div>
        <div class="popup-metric"><div class="k">Equidad</div><div class="v">${(p.equidad*100).toFixed(0)}%</div></div>
      </div>
    `;
    popupRef.current = new mapboxgl.Popup({ closeButton: false, offset: 14 })
      .setLngLat(mid).setDOMContent(node).addTo(map);
  }, [loaded, hoveredId]);

  // Fly to selected
  useEffect(() => {
    if (!loaded || !selectedId) return;
    const p = window.PROJECTS.find(x => x.id === selectedId);
    if (!p) return;
    const mid = [p.centerLng, p.centerLat];
    mapRef.current.easeTo({ center: mid, zoom: Math.max(mapRef.current.getZoom(), 13), duration: 600 });
  }, [loaded, selectedId]);

  // Fit to cartera at load
  useEffect(() => {
    if (!loaded || !window.CARTERA_BOUNDS) return;
    mapRef.current.fitBounds(window.CARTERA_BOUNDS, { padding: 60, duration: 800, maxZoom: 12 });
  }, [loaded]);

  const zoom = (dz) => mapRef.current && mapRef.current.zoomTo(mapRef.current.getZoom() + dz);

  return (
    <div className="map-wrap">
      <div className="map-canvas" ref={containerRef} />

      <div className="map-chrome map-status">
        <span className="label">Escenario:</span>
        <span className="num">{scenarioWith ? "Base + Cartera completa" : (lockedIds.length ? `Base + ${lockedIds.length} priorizado${lockedIds.length>1?"s":""}` : "Red base")}</span>
        <span className="label">·</span>
        <span className="num">Santiago RM · 2026</span>
      </div>

      <div className="map-chrome map-tools">
        <button className="map-tool">
          <Ico name="search" /> Buscar dirección
        </button>
        <button className="map-tool" onClick={fitCartera}>
          <Ico name="target" /> Ajustar a cartera
        </button>
      </div>

      <div className="map-chrome map-zoom">
        <button onClick={() => zoom(1)} title="Acercar"><Ico name="plus" /></button>
        <button onClick={() => zoom(-1)} title="Alejar"><Ico name="minus" /></button>
      </div>

      <div className="map-bottom-left">
      <div className={"map-chrome map-legend" + (legendMin ? " minimized" : "")}>
        <div className="map-legend-bar">
          <span className="map-legend-title">Leyenda</span>
          <button
            className="map-legend-toggle"
            onClick={() => setLegendMin(m => !m)}
            title={legendMin ? "Expandir leyenda" : "Minimizar leyenda"}
            aria-label={legendMin ? "Expandir leyenda" : "Minimizar leyenda"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {legendMin ? <path d="M7 14l5-5 5 5"></path> : <path d="M7 10l5 5 5-5"></path>}
            </svg>
          </button>
        </div>
        {!legendMin && (
        <div className="map-legend-body">
        {fractalView ? (
          <>
            <div className="map-legend-h">Conectividad fractal · raíz Alameda</div>
            <div className="map-legend-row">
              <div className="layer-swatch line" style={{ background: "#1d3a8a" }}></div>
              <span>Tronco · red existente conectada a la Alameda {window.FRACTAL_RAIZ_EXISTENTE ? `(${window.FRACTAL_RAIZ_EXISTENTE} ejes)` : ""}</span>
            </div>
            <div className="map-legend-row">
              <div className="layer-swatch line" style={{ background: "#c62828" }}></div>
              <span>Grado 1 · toca la raíz {window.FRACTAL_DIST && window.FRACTAL_DIST[1] != null ? `(${window.FRACTAL_DIST[1]})` : ""}</span>
            </div>
            <div className="map-legend-row">
              <div className="layer-swatch line" style={{ background: "#e0561d", opacity: 0.15 }}></div>
              <span>Grado 2+ y aislados · atenuados</span>
            </div>
            <div className="map-legend-h" style={{ marginTop: 10 }}>Jerarquía del eje</div>
            <div className="map-legend-row">
              <div className="layer-swatch line" style={{ background: "#c62828", boxShadow: "0 0 0 2px #1a1d24" }}></div>
              <span>Metropolitana (orla oscura)</span>
            </div>
            <div className="map-legend-row">
              <div className="layer-swatch line" style={{ background: "#c62828" }}></div>
              <span>Comunal / Intercomunal (sin orla)</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.45, maxWidth: 230 }}>
              Al priorizar un eje se funde con la raíz: sus vecinos suben a grado 1 y la red crece como afluentes de un río.
            </div>
          </>
        ) : netView && netView.active && netView.result ? (
          <>
            <div className="map-legend-h">Subredes aisladas · ≤ {netView.dist} m</div>
            {netView.result.comps.slice(0, 8).map(c => (
              <div className="map-legend-row" key={c.id}>
                <div className="layer-swatch line" style={{ background: c.color }}></div>
                <span>Subred {c.rank} · {fmtN(c.km)} km</span>
              </div>
            ))}
            {netView.result.comps.length > 8 && (
              <div className="map-legend-row">
                <div className="layer-swatch line" style={{ background: window.NET_GRAY }}></div>
                <span>Subredes menores ({netView.result.comps.length - 8})</span>
              </div>
            )}
            <div className="map-legend-h" style={{ marginTop: 10 }}>Cartera</div>
            <div className="map-legend-row">
              <div className="layer-swatch dotted" style={{ borderColor: "#1a1d24" }}></div>
              <span>Proyecto conector (une ≥2 subredes)</span>
            </div>
            <div className="map-legend-row">
              <div className="layer-swatch dotted" style={{ borderColor: "#c0c6cf" }}></div>
              <span>Proyecto no conector</span>
            </div>
          </>
        ) : (
          <>
        {layersOn && layersOn.existente && (
          <>
        <div className="map-legend-h">Red base existente</div>
        {layersOn.existCiclovia !== false && (
        <div className="map-legend-row">
          <div className="layer-swatch line" style={{ background: "#1d3a8a" }}></div>
          <span>Ciclovía</span>
        </div>
        )}
        {layersOn.existSmp !== false && (
        <div className="map-legend-row">
          <div className="layer-swatch line" style={{ background: "#4a72c8" }}></div>
          <span>Senda multipropósito</span>
        </div>
        )}
        {layersOn.existCicloparque !== false && (
        <div className="map-legend-row">
          <div className="layer-swatch line" style={{ background: "#2f8769" }}></div>
          <span>Cicloparque</span>
        </div>
        )}
          </>
        )}
        {layersOn && layersOn.proyectos && categoria === "Otras carteras" && (
          <>
        <div className="map-legend-h" style={{ marginTop: 10 }}>Cartera proyectada</div>
        <div className="map-legend-row">
          <div className="layer-swatch dotted" style={{ borderColor: "#6b4ea8" }}></div>
          <span>Otras carteras · MOP · MINVU · MTT · municipios · privados</span>
        </div>
          </>
        )}
        {layersOn && layersOn.proyectos && categoria !== "Otras carteras" && (
          <>
        <div className="map-legend-h" style={{ marginTop: 10 }}>Cartera proyectada</div>
        {layersOn.proyectosMetro !== false && (
        <div className="map-legend-row">
          <div className="layer-swatch dotted" style={{ borderColor: "#a8421d" }}></div>
          <span>Metropolitana</span>
        </div>
        )}
        {layersOn.proyectosInter !== false && (
        <div className="map-legend-row">
          <div className="layer-swatch dotted" style={{ borderColor: "#d9731e" }}></div>
          <span>Intercomunal</span>
        </div>
        )}
        {layersOn.proyectosComunal !== false && (
        <div className="map-legend-row">
          <div className="layer-swatch dotted" style={{ borderColor: "#e8a33c" }}></div>
          <span>Comunal</span>
        </div>
        )}
          </>
        )}
        {layersOn && layersOn.educacion && (
        <div className="map-legend-row">
          <div className="layer-swatch dot" style={{ background: "#7c3aed" }}></div>
          <span>Sede ed. superior (ø ∝ matrícula)</span>
        </div>
        )}
        {layersOn && layersOn.otras && (
          <>
            <div className="map-legend-h" style={{ marginTop: 10 }}>Otras carteras (referencia)</div>
            <div className="map-legend-row">
              <div className="layer-swatch dotted" style={{ borderColor: "#6b4ea8" }}></div>
              <span>MOP · MINVU · MTT · municipios · privados</span>
            </div>
          </>
        )}
        {layersOn && layersOn.poblacionDots && (
          <>
            <div className="map-legend-h" style={{ marginTop: 10 }}>Población OD (centroides)</div>
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#2d54b8" }}></div>
              <span>Hex conectado a la red (ø ∝ población)</span>
            </div>
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#e08947" }}></div>
              <span>Hex sin acceso a la red</span>
            </div>
          </>
        )}
        {layersOn && layersOn.poblacionHeat && (
          <>
            <div className="map-legend-h" style={{ marginTop: 10 }}>Heatmap demanda potencial</div>
            <div className="map-legend-row">
              <div className="layer-swatch" style={{ width: 60, height: 8, borderRadius: 4, background: "linear-gradient(90deg, rgba(45,84,184,0.3), rgba(74,114,200,0.55), rgba(232,163,60,0.7), rgba(168,66,29,0.9))" }}></div>
              <span>Densidad de población: baja → alta</span>
            </div>
          </>
        )}
        {layersOn && layersOn.pbici && (
          <>
            <div className="map-legend-h" style={{ marginTop: 10 }}>P(bici) · modelo logit</div>
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#31418f" }}></div>
              <span>≤ 1% · propensión baja</span>
            </div>
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#1e8a6e" }}></div>
              <span>≈ 3%</span>
            </div>
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#f0b429" }}></div>
              <span>≈ 5%</span>
            </div>
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#d6461e" }}></div>
              <span>≥ 9% · propensión alta</span>
            </div>
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "transparent", border: "2px solid #d6461e", boxSizing: "border-box" }}></div>
              <span>Anillo: escenario suma ciclistas aquí</span>
            </div>
          </>
        )}
        {layersOn && layersOn.siniestros && (
          <>
            <div className="map-legend-h" style={{ marginTop: 10 }}>Siniestros ciclistas 2020–2024</div>
            {layersOn.sinFatal !== false && (
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#b3122b" }}></div>
              <span>Con fallecido(s)</span>
            </div>
            )}
            {layersOn.sinGrave !== false && (
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#e0561d" }}></div>
              <span>Lesionado grave</span>
            </div>
            )}
            {layersOn.sinLesion !== false && (
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#e8a13c" }}></div>
              <span>Lesionados / leves</span>
            </div>
            )}
            {layersOn.sinDanios !== false && (
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#9aa6b2" }}></div>
              <span>Solo daños</span>
            </div>
            )}
          </>
        )}
        {layersOn && layersOn.monumentos && (
          <>
            <div className="map-legend-h" style={{ marginTop: 10 }}>Monumentos nacionales</div>
            {layersOn.monHistorico !== false && (
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#0f7d8c" }}></div>
              <span>Monumento Histórico</span>
            </div>
            )}
            {layersOn.monZona !== false && (
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#b3801a" }}></div>
              <span>Zona Típica o Pintoresca</span>
            </div>
            )}
            {layersOn.monSantuario !== false && (
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#2f8f4e" }}></div>
              <span>Santuario de la Naturaleza</span>
            </div>
            )}
          </>
        )}
        {layersOn && layersOn.ferias && (
          <>
            <div className="map-legend-h" style={{ marginTop: 10 }}>Ferias libres vs red ciclable</div>
            {layersOn.ferCruza !== false && (
            <div className="map-legend-row">
              <div className="layer-swatch" style={{ background: "#c2348b", width: 16, height: 4, borderRadius: 2 }}></div>
              <span>Cruza una ciclovía</span>
            </div>
            )}
            {layersOn.ferCoincide !== false && (
            <div className="map-legend-row">
              <div className="layer-swatch" style={{ background: "#8f1d5e", width: 16, height: 4, borderRadius: 2 }}></div>
              <span>Sobre el mismo eje (≤20 m)</span>
            </div>
            )}
            {layersOn.ferParalela !== false && (
            <div className="map-legend-row">
              <div className="layer-swatch" style={{ background: "#e06fae", width: 16, height: 4, borderRadius: 2 }}></div>
              <span>Paralela a ciclovía (≤80 m)</span>
            </div>
            )}
            {layersOn.ferSin !== false && (
            <div className="map-legend-row">
              <div className="layer-swatch" style={{ background: "#b8a0ad", width: 16, height: 4, borderRadius: 2 }}></div>
              <span>Sin ciclovía cercana</span>
            </div>
            )}
          </>
        )}
        {layersOn && layersOn.metro && (
          <>
            <div className="map-legend-h" style={{ marginTop: 10 }}>Metro</div>
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#d6461e" }}></div>
              <span>Estación (hotspot intermodal)</span>
            </div>
          </>
        )}
        {layersOn && layersOn.parques && (
          <>
            <div className="map-legend-h" style={{ marginTop: 10 }}>Parques</div>
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#2f8f4e" }}></div>
              <span>Parque (ø ∝ superficie)</span>
            </div>
          </>
        )}
        {selectedId && (
          <>
            <div className="map-legend-h" style={{ marginTop: 10 }}>Impacto del proyecto seleccionado</div>
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#c95a25", boxShadow: "0 0 0 1px white" }}></div>
              <span>Gana acceso a red (marginal)</span>
            </div>
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#1e8a6e", boxShadow: "0 0 0 1px white" }}></div>
              <span>Beneficiado por interconexión</span>
            </div>
            <div className="map-legend-row">
              <div className="layer-swatch dot" style={{ background: "#2d54b8", boxShadow: "0 0 0 1px white" }}></div>
              <span>En buffer, ya atendido</span>
            </div>
          </>
        )}
          </>
        )}
        </div>
        )}
      </div>

      <div className="map-chrome map-scale">Elaborado por División de Infraestructura y Transportes GORE RM</div>
      </div>
    </div>
  );
}

window.MapView = MapView;
