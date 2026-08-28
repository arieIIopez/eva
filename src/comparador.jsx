/* ============================================================
   EvaCiclo · Comparador de proyectos — hasta 4 lado a lado
   Modal sobre la app. Expuesto como window.EvaComparador.
============================================================ */

function EvaComparador({ ranking, onClose }) {
  const [ids, setIds] = React.useState(() => ranking.slice(0, 2).map(p => p.id));
  const [query, setQuery] = React.useState("");

  const sel = ids.map(id => ranking.find(p => p.id === id)).filter(Boolean);
  const candidates = query.trim()
    ? ranking.filter(p =>
        !ids.includes(p.id) &&
        (p.id + " " + (p.nombre || "") + " " + (p.comunas || "")).toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const fmtN = n => (+n || 0).toLocaleString("es-CL");
  const fmtMM = n => { n = +n || 0; return n >= 1e6 ? (n / 1e6).toFixed(2) + " M" : n >= 1e3 ? (n / 1e3).toFixed(1) + " mil" : String(Math.round(n)); };

  const ROWS = [
    { k: "score", label: "Score multicriterio", get: p => (p.score || 0), fmt: v => (v * 100).toFixed(1), hi: true },
    { k: "km", label: "Longitud (km)", get: p => +p.km || 0, fmt: v => v.toFixed(1) },
    { k: "costo", label: "Inversión (M$)", get: p => +p.costo || 0, fmt: v => fmtN(Math.round(v)), inverse: true },
    { k: "poblacion", label: "Población marginal", get: p => +p.poblacion || 0, fmt: fmtMM },
    { k: "demanda", label: "Demanda OD (viajes/día)", get: p => +p.demandaHabilitada || 0, fmt: fmtMM },
    { k: "ciclistas", label: "Ciclistas inducidos (logit)", get: p => +p.ciclistasInducidos || 0, fmt: fmtN },
    { k: "estudiantes", label: "Estudiantes", get: p => +p.estudiantes || 0, fmt: fmtMM },
    { k: "continuidad", label: "Componentes unidos", get: p => +p.componentesUnidos || 0, fmt: fmtN },
    { k: "equidad", label: "Equidad territorial", get: p => +p.equidad || 0, fmt: v => (v * 100).toFixed(0) + "%" },
    { k: "seguridad", label: "Siniestros en corredor", get: p => +p.siniestros || 0, fmt: fmtN },
    { k: "metro", label: "Estaciones de Metro", get: p => +p.metroEstaciones || 0, fmt: fmtN },
    { k: "parques", label: "Parques conectados (ha)", get: p => +p.parquesHa || 0, fmt: v => fmtN(Math.round(v)) },
    { k: "paraderos", label: "Paraderos de bus", get: p => +p.paraderosBus || 0, fmt: fmtN },
    { k: "ferias", label: "Ferias libres", get: p => +p.ferias || 0, fmt: fmtN },
    { k: "monumentos", label: "Zonas de monumentos", get: p => +p.monumentos || 0, fmt: fmtN },
    { k: "pistas", label: "Pistas (ancho de vía)", get: p => +p.numPistas || 0, fmt: v => v.toFixed(1) },
    { k: "pend", label: "Pendiente media (%)", get: p => +p.pendMedia || 0, fmt: v => v.toFixed(1) + "%", inverse: true },
    { k: "cpb", label: "Costo por beneficiario ($)", get: p => (p.poblacion > 0 ? (p.costo || 0) * 1e6 / p.poblacion : 0), fmt: v => v > 0 ? fmtN(Math.round(v)) : "—", inverse: true },
  ];

  function exportCSV() {
    const rows = [["metrica", ...sel.map(p => p.id)].join(",")];
    rows.push(["nombre", ...sel.map(p => `"${(p.nombre || "").replace(/"/g, '""')}"`)].join(","));
    for (const r of ROWS) rows.push([`"${r.label}"`, ...sel.map(p => r.get(p))].join(","));
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `EVA_comparacion_${sel.map(p => p.id).join("_")}.csv`;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
  }

  return (
    <div className="comp-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="comp-modal">
        <div className="comp-head">
          <div>
            <div className="comp-kicker">Comparador de proyectos</div>
            <div className="comp-sub">Hasta 4 proyectos lado a lado · barras relativas al mejor valor de la selección</div>
          </div>
          <button className="hdr-btn" onClick={onClose}>✕ Cerrar</button>
        </div>

        <div className="comp-picker">
          {sel.map(p => (
            <span key={p.id} className="comp-chip">
              <b>{p.id}</b>&nbsp;{(p.nombre || "").slice(0, 22)}
              <button onClick={() => setIds(ids.filter(x => x !== p.id))} title="Quitar">✕</button>
            </span>
          ))}
          {ids.length < 4 && (
            <span className="comp-add">
              <input
                className="input"
                placeholder="Agregar proyecto (nombre, código o comuna)…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {candidates.length > 0 && (
                <div className="comp-drop">
                  {candidates.map(p => (
                    <button key={p.id} onClick={() => { setIds([...ids, p.id]); setQuery(""); }}>
                      <b>{p.id}</b> {(p.nombre || "").slice(0, 34)} <span>{(p.comunas || "").split("·")[0]}</span>
                    </button>
                  ))}
                </div>
              )}
            </span>
          )}
        </div>

        {sel.length >= 2 ? (
          <div className="comp-body">
            <table className="comp-table">
              <thead>
                <tr>
                  <th></th>
                  {sel.map(p => (
                    <th key={p.id}>
                      <div className="comp-pname"><b>{p.id}</b> · {(p.nombre || "").slice(0, 26)}</div>
                      <div className="comp-pmeta">{p.escala}{p.categoria === "Otras carteras" ? " · " + (p.cartera || "") : ""}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(r => {
                  const vals = sel.map(p => r.get(p));
                  const best = r.inverse
                    ? Math.min(...vals.filter(v => v > 0).concat([Infinity]))
                    : Math.max(...vals);
                  const maxAbs = Math.max(...vals.map(Math.abs), 1e-9);
                  return (
                    <tr key={r.k} className={r.hi ? "hi" : ""}>
                      <td className="comp-metric">{r.label}</td>
                      {sel.map((p, i) => {
                        const v = vals[i];
                        const isBest = sel.length > 1 && (r.inverse ? (v > 0 && v === best) : (v === best && v > 0));
                        return (
                          <td key={p.id}>
                            <div className={"comp-val" + (isBest ? " best" : "")}>{r.fmt(v)}{isBest ? " ★" : ""}</div>
                            <div className="comp-bar"><div style={{ width: (Math.abs(v) / maxAbs * 100).toFixed(0) + "%", background: r.inverse ? "#8a93a0" : "#b3541e" }}></div></div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="comp-empty">Agrega al menos 2 proyectos para comparar.</div>
        )}

        <div className="comp-foot">
          <span className="comp-note">★ mejor valor de la selección (en costo, pendiente y costo/beneficiario gana el menor).</span>
          <button className="hdr-btn" disabled={sel.length < 2} onClick={exportCSV}>⬇ Exportar comparación (CSV)</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { EvaComparador });
