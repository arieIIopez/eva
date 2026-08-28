/* ============================================================
   EvaCiclo · Reportes imprimibles (PDF vía diálogo de impresión)
   - window.EVA_REPORT(opts)     → reporte ejecutivo de la cartera
   - window.EVA_FICHA_PDF(id)    → ficha individual de proyecto
   Ambos abren una ventana con documento imprimible y lanzan print().
============================================================ */
(function () {
  "use strict";

  const CRIT_LABELS = {
    poblacion: "Población marginal", costoOD: "Costo percibido", oportunidades: "Oportunidades",
    equidad: "Equidad territorial", continuidad: "Continuidad de red", demanda: "Demanda OD",
    estudiantes: "Generación estudiantil", prioridadGore: "Prioridad GORE", seguridad: "Seguridad vial",
    monumentos: "Monumentos nacionales", intermodal: "Intermodalidad bici-metro",
    ciclistas: "Ciclistas inducidos (logit)", fractal: "Conectividad fractal (Alameda)",
    factibilidad: "Factibilidad (ancho vía)", parques: "Atractor de parques", costoInv: "Eficiencia económica",
  };

  const fmtN = n => (+n || 0).toLocaleString("es-CL");
  const fmtMM = n => { n = +n || 0; return n >= 1e6 ? (n / 1e6).toFixed(2) + " M" : n >= 1e3 ? (n / 1e3).toFixed(1) + " mil" : String(Math.round(n)); };
  const esc = s => String(s == null ? "—" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const hoy = () => new Date().toLocaleDateString("es-CL", { year: "numeric", month: "long", day: "numeric" });

  const BASE_CSS = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Segoe UI", system-ui, -apple-system, sans-serif; color: #16202c; font-size: 11.5px; line-height: 1.5; padding: 34px 40px; }
    h1 { font-size: 21px; letter-spacing: -0.02em; margin-bottom: 2px; }
    h2 { font-size: 13.5px; margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 1.5px solid #16202c; text-transform: uppercase; letter-spacing: 0.06em; }
    .meta { color: #5a6673; font-size: 10.5px; }
    .kicker { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #8a4a24; font-weight: 700; margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th { text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #5a6673; padding: 4px 6px; border-bottom: 1px solid #c9d2dc; }
    td { padding: 4px 6px; border-bottom: 1px solid #e7ecf1; font-variant-numeric: tabular-nums; }
    tr:nth-child(even) td { background: #f7f9fb; }
    .num { text-align: right; }
    .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 8px; }
    .kpi { border: 1px solid #d8dfe7; border-radius: 6px; padding: 8px 10px; }
    .kpi .k { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #5a6673; }
    .kpi .v { font-size: 17px; font-weight: 700; margin-top: 2px; }
    .bar { height: 7px; background: #edf1f5; border-radius: 4px; overflow: hidden; }
    .bar > div { height: 100%; background: #b3541e; border-radius: 4px; }
    .foot { margin-top: 28px; padding-top: 10px; border-top: 1px solid #c9d2dc; color: #5a6673; font-size: 9.5px; display: flex; justify-content: space-between; }
    .warn { background: #fdf6ee; border: 1px solid #ecd9c2; border-radius: 6px; padding: 8px 10px; margin-top: 8px; font-size: 10.5px; }
    .tag { display: inline-block; padding: 2px 8px; border: 1px solid #c9d2dc; border-radius: 20px; font-size: 9.5px; margin-right: 4px; }
    .pcard { display: none; }
    @media print { body { padding: 0; } .no-print { display: none; } }
    @page { margin: 10mm 8mm; size: landscape; }
    .rank-wide th, .rank-wide td { font-size: 8.3px; padding: 3px 4px; white-space: nowrap; }
    .rank-wide th.crit, .rank-wide td.crit { background: #f4f7fa; }
    .rank-wide th.crit { font-size: 7.5px; white-space: normal; min-width: 44px; }
  `;

  function openDoc(title, bodyHtml) {
    const w = window.open("", "_blank");
    if (!w) { window.evaLog && window.evaLog("warn", "[reportes] ventana bloqueada por el navegador — permite pop-ups para imprimir"); return; }
    w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${BASE_CSS}</style></head><body>${bodyHtml}
      <script>window.addEventListener("load",function(){setTimeout(function(){window.print();},350);});<\/script></body></html>`);
    w.document.close();
  }

  function headerHtml(subtitle) {
    const v = window.EVA_VERSION || {};
    return `
      <div class="kicker">EVA · Evaluador de infraestructura ciclista · Región Metropolitana</div>
      <h1>${esc(subtitle)}</h1>
      <div class="meta">${hoy()} · motor v${esc(v.ENGINE_VERSION)} · datos ${esc(v.DATA_VERSION)} · metodología v${esc(v.METHODOLOGY_VERSION)}</div>`;
  }

  const FOOT = `<div class="foot"><span>Elaborado por División de Infraestructura y Transporte · GORE RM</span><span>Documento generado automáticamente por EVA — los resultados son apoyo a la decisión, no sustituyen evaluación de ingeniería de detalle.</span></div>`;

  /* ============================================================
     REPORTE EJECUTIVO
  ============================================================ */
  window.EVA_REPORT = function (opts) {
    opts = opts || {};
    const ranking = opts.ranking || window.PROJECTS || [];
    const weights = opts.weights || window.DEFAULT_WEIGHTS || {};
    const lockedIds = opts.lockedIds || [];
    const categoria = opts.categoria || "Plan Maestro";
    const scenarioName = opts.scenarioName || "Personalizado";

    const kmTot = ranking.reduce((a, p) => a + (+p.km || 0), 0);
    const invTot = ranking.reduce((a, p) => a + (+p.costo || 0), 0);
    const top = ranking.slice(0, 50);
    const qa = window.EVA_QA ? window.EVA_QA() : null;

    // Los 15 criterios ponderables (monumentos es informativo: excluido del score)
    const CRIT_KEYS = Object.keys(CRIT_LABELS).filter(k => k !== "monumentos");
    const totalW = CRIT_KEYS.reduce((a, k) => a + (+weights[k] || 0), 0) || 1;

    const pesosRows = CRIT_KEYS
      .sort((a, b) => (+weights[b] || 0) - (+weights[a] || 0))
      .map(k => {
        const v = +weights[k] || 0;
        return `<tr><td>${esc(CRIT_LABELS[k])}</td><td class="num">${v}</td><td class="num">${(v / totalW * 100).toFixed(1)}%</td></tr>`;
      }).join("");

    const rankRows = top.map((p, i) => `
      <tr>
        <td>${i + 1}</td><td><b>${esc(p.id)}</b></td><td>${esc(p.nombre)}</td>
        <td>${esc(p.escala)}</td><td>${esc(p.comunas || p.macrozona || "—")}</td>
        <td class="num">${(+p.km || 0).toFixed(2)}</td>
        <td class="num">${fmtN(Math.round(p.costo || 0))}</td>
        <td class="num">${fmtN(Math.round((p.costo || 0) / (p.km || 1)))}</td>
        <td class="num"><b>${((p.score || 0) * 100).toFixed(1)}</b></td>
        <td class="num">${fmtN(p.poblacion)}</td>
        <td class="num">${fmtN(p.pobBeneficiada || 0)}</td>
        <td class="num">${fmtN(p.demandaHabilitada || 0)}</td>
        <td class="num">${fmtN(p.ciclistasInducidos || 0)}</td>
        <td class="num">${p.componentesUnidos ?? "—"}</td>
        <td class="num">${fmtN(p.estudiantes || 0)}</td>
        <td class="num">${(p.poblacion + (p.pobBeneficiada||0)) > 0 ? fmtN(Math.round((p.costo * 1e6) / (p.poblacion + (p.pobBeneficiada||0)))) : "—"}</td>
        <td class="num">${((p.equidad||0) * 100).toFixed(0)}%</td>
        <td class="num">${fmtN(p.siniestros || 0)}</td>
        <td class="num">${((p.siniestrosPrevPct||0) * 100).toFixed(0)}%</td>
        <td class="num">${fmtN(p.monumentos || 0)}</td>
        <td class="num">${fmtN(p.ferias || 0)}</td>
        <td class="num">${fmtN(p.metroEstaciones || 0)}</td>
        <td class="num">${fmtN(p.parques || 0)}</td>
        <td class="num">${(p.parquesHa||0).toLocaleString("es-CL")}</td>
        <td class="num">${fmtN(p.paraderosBus || 0)}</td>
        <td class="num">${(p.numPistas||0).toFixed(1)}</td>
        <td class="num">${(p.pendMedia||0).toFixed(1)}%</td>
        <td class="num">${(p.pendMax||0).toFixed(1)}%</td>
        <td class="num">${p.n_priori != null ? "#" + p.n_priori : "—"}</td>
        <td>${esc(p.anteproyec || "—")}</td>
        <td>${lockedIds.includes(p.id) ? "✔" : ""}</td>
        ${CRIT_KEYS.map(k => `<td class="num crit">${(((p.norm && p.norm[k]) || 0) * 100).toFixed(0)}</td>`).join("")}
      </tr>`).join("");

    const prior = ranking.filter(p => lockedIds.includes(p.id));
    const priorHtml = prior.length ? `
      <h2>Proyectos priorizados (${prior.length})</h2>
      <table><thead><tr><th>Código</th><th>Nombre</th><th class="num">km</th><th class="num">Inversión (M$)</th></tr></thead>
      <tbody>${prior.map(p => `<tr><td><b>${esc(p.id)}</b></td><td>${esc(p.nombre)}</td><td class="num">${(+p.km || 0).toFixed(1)}</td><td class="num">${fmtN(Math.round(p.costo || 0))}</td></tr>`).join("")}</tbody></table>` : "";



    const qaHtml = qa ? `
      <h2>Control de calidad de datos</h2>
      <div class="kpis">
        <div class="kpi"><div class="k">Estado</div><div class="v" style="font-size:13px">${esc(qa.resumen.estado)}</div></div>
        <div class="kpi"><div class="k">Issues críticos</div><div class="v">${qa.resumen.issues_criticos}</div></div>
        <div class="kpi"><div class="k">Advertencias</div><div class="v">${qa.resumen.issues_advertencia}</div></div>
        <div class="kpi"><div class="k">Comunas inferidas</div><div class="v">${(qa.problemas.proyectos_comuna_inferida || []).length}</div></div>
      </div>` : "";

    openDoc("EVA — Reporte ejecutivo", `
      ${headerHtml("Reporte ejecutivo de priorización")}
      <h2>Alcance</h2>
      <div class="kpis">
        <div class="kpi"><div class="k">Cartera</div><div class="v" style="font-size:13px">${esc(categoria)}</div></div>
        <div class="kpi"><div class="k">Proyectos evaluados</div><div class="v">${ranking.length}</div></div>
        <div class="kpi"><div class="k">Kilómetros</div><div class="v">${kmTot.toFixed(0)} km</div></div>
        <div class="kpi"><div class="k">Inversión estimada</div><div class="v">${fmtMM(invTot)}$</div></div>
      </div>
      <h2>Escenario de ponderación: ${esc(scenarioName)}</h2>
      <table style="max-width:520px"><thead><tr><th>Criterio</th><th class="num">Peso</th><th class="num">% del total</th></tr></thead><tbody>${pesosRows}</tbody></table>
      <div class="warn">Los 15 criterios ponderables se consideran en todos los escenarios. «Monumentos nacionales» se reporta como capa informativa y no entra en el score.</div>
      <h2>Ranking multicriterio${opts.escalaFiltro && opts.escalaFiltro !== "Todas" ? ` — Escala: ${esc(opts.escalaFiltro)}` : ""} — Top ${top.length}</h2>
      <table class="rank-wide"><thead><tr>
        <th>#</th><th>Código</th><th>Nombre</th><th>Escala</th><th>Comuna</th>
        <th class="num">km</th><th class="num">Inversión M$</th><th class="num">M$/km</th><th class="num">Score ×100</th>
        <th class="num">Pob. marginal</th><th class="num">Pob. benef. OD</th><th class="num">Demanda hab.</th><th class="num">Ciclistas induc.</th>
        <th class="num">Comp. une</th><th class="num">Estudiantes</th><th class="num">$/pers. benef.</th><th class="num">Equidad</th>
        <th class="num">Siniestros</th><th class="num">Prevenible</th><th class="num">Monumentos</th><th class="num">Ferias</th>
        <th class="num">Metro</th><th class="num">Parques</th><th class="num">Ha parques</th><th class="num">Paraderos</th>
        <th class="num">Pistas</th><th class="num">Pend. media</th><th class="num">Pend. máx</th><th class="num">Prior. GORE</th><th>Anteproy.</th><th>Prior.</th>
        ${CRIT_KEYS.map(k => `<th class="num crit">${esc(CRIT_LABELS[k])}<br><span style="font-weight:400;font-size:7.5px">peso ${+weights[k] || 0}</span></th>`).join("")}
      </tr></thead>
      <tbody>${rankRows}</tbody></table>
      ${priorHtml}
      ${qaHtml}
      <div class="warn"><b>Advertencias metodológicas.</b> Distancias de acceso euclidianas (no por red); destino OD a nivel comunal; siniestralidad histórica como proxy de peligrosidad; costos paramétricos por km. El detalle completo está en las fichas metodológicas de la aplicación.</div>
      ${FOOT}`);
    window.evaLog && window.evaLog("ok", `[reportes] Reporte ejecutivo generado · ${ranking.length} proyectos · escenario ${scenarioName}`);
  };

  /* ============================================================
     FICHA DE PROYECTO EN PDF
  ============================================================ */
  window.EVA_FICHA_PDF = function (pid) {
    const p = (window.PROJECTS || []).find(x => x.id === pid);
    if (!p) return;
    const pos = (window.PROJECTS || []).slice().sort((a, b) => (b.score || 0) - (a.score || 0)).findIndex(x => x.id === pid) + 1;

    const norm = p.norm || {};
    const critRows = Object.entries(CRIT_LABELS)
      .filter(([k]) => norm[k] != null && k !== "monumentos")
      .map(([k, lab]) => {
        const v = Math.max(0, Math.min(1, +norm[k] || 0));
        return `<tr><td style="width:200px">${esc(lab)}</td><td><div class="bar"><div style="width:${(v * 100).toFixed(0)}%"></div></div></td><td class="num" style="width:52px">${(v * 100).toFixed(0)}</td></tr>`;
      }).join("");

    const met = [
      ["Población marginal habilitada", fmtMM(p.poblacion) + " hab"],
      ["Demanda OD habilitada", fmtMM(p.demandaHabilitada) + " viajes/día"],
      ["Estudiantes (generación)", fmtMM(p.estudiantes)],
      ["Componentes de red unidos", fmtN(p.componentesUnidos)],
      ["Equidad territorial", ((p.equidad || 0) * 100).toFixed(0) + "%"],
      ["Siniestros en corredor (≤100 m)", fmtN(p.siniestros) + " · " + fmtN(p.siniestrosFall || 0) + " fallecidos · " + fmtN(p.siniestrosGrav || 0) + " graves"],
      ["Estaciones de Metro conectadas", fmtN(p.metroEstaciones) + (p.metroNombres && p.metroNombres.length ? " (" + p.metroNombres.join(", ") + ")" : "")],
      ["Paraderos de bus en el eje", fmtN(p.paraderosBus)],
      ["Parques conectados", fmtN(p.parques) + " · " + fmtN(p.parquesHa || 0) + " ha"],
      ["Ferias libres en el trazado", fmtN(p.ferias) + (p.feriasDiasAbbr ? " (" + p.feriasDiasAbbr + ")" : "")],
      ["Zonas de monumentos (≤150 m)", fmtN(p.monumentos)],
      ["Pistas (ancho de vía)", (+p.numPistas || 0).toFixed(1)],
      ["Pendiente media / máxima", (+p.pendMedia || 0).toFixed(1) + "% / " + (+p.pendMax || 0).toFixed(1) + "%"],
    ].map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">${v}</td></tr>`).join("");

    openDoc("EVA — Ficha " + p.id, `
      ${headerHtml("Ficha de proyecto — " + p.id)}
      <div style="margin-top:10px">
        <span class="tag"><b>${esc(p.nombre)}</b></span>
        <span class="tag">${esc(p.escala)}</span>
        <span class="tag">${(+p.km || 0).toFixed(2)} km</span>
        <span class="tag">${esc(p.comunas)}</span>
        ${p.categoria === "Otras carteras" ? `<span class="tag">Otras carteras · ${esc(p.cartera)}</span>` : ""}
        ${p.anteproyec ? `<span class="tag">${esc(p.anteproyec)}</span>` : ""}
      </div>
      <div class="kpis" style="margin-top:14px">
        <div class="kpi"><div class="k">Posición en ranking</div><div class="v">#${pos} <span style="font-size:10px;color:#5a6673">de ${(window.PROJECTS || []).length}</span></div></div>
        <div class="kpi"><div class="k">Score multicriterio</div><div class="v">${((p.score || 0) * 100).toFixed(1)}</div></div>
        <div class="kpi"><div class="k">Inversión estimada</div><div class="v">${fmtN(Math.round(p.costo || 0))} M$</div></div>
        <div class="kpi"><div class="k">Costo por beneficiario</div><div class="v">${p.poblacion > 0 ? fmtN(Math.round((p.costo || 0) * 1e6 / p.poblacion)) + " $" : "—"}</div></div>
      </div>
      <h2>Métricas del proyecto</h2>
      <table>${met}</table>
      <h2>Aporte normalizado por criterio (0–100, relativo a la cartera)</h2>
      <table>${critRows}</table>
      <div class="warn"><b>Nota.</b> Los valores normalizados son relativos a la cartera evaluada (máximo = 100). Cifras de beneficio bajo los parámetros vigentes del motor; ver fichas metodológicas en la aplicación.</div>
      ${FOOT}`);
    window.evaLog && window.evaLog("ok", `[reportes] Ficha PDF generada: ${p.id} · ${p.nombre}`);
  };
})();
