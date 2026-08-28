/* ============================================================
   EvaCiclo · UI primitives compartidas
============================================================ */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ---------- Icons (line-based, sober) ---------- */
function Ico({ name, className = "ico" }) {
  const paths = {
    layers: <><polygon points="12,3 21,8 12,13 3,8" /><polyline points="3,12 12,17 21,12" /><polyline points="3,16 12,21 21,16" /></>,
    upload: <><path d="M12 16V4" /><polyline points="7,9 12,4 17,9" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>,
    download: <><path d="M12 4v12" /><polyline points="7,11 12,16 17,11" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>,
    play: <polygon points="6,4 20,12 6,20" fill="currentColor" stroke="none" />,
    pause: <><rect x="6" y="4" width="4" height="16" fill="currentColor" stroke="none" /><rect x="14" y="4" width="4" height="16" fill="currentColor" stroke="none" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
    map: <><polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></>,
    bike: <><circle cx="6" cy="16" r="4" /><circle cx="18" cy="16" r="4" /><path d="M6 16l5-8h4l3 8" /><path d="M11 8l-2 -4h-2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16" y2="16" /></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
    minus: <line x1="5" y1="12" x2="19" y2="12" />,
    chevDown: <polyline points="6,9 12,15 18,9" />,
    chevRight: <polyline points="9,6 15,12 9,18" />,
    chevLeft: <polyline points="15,6 9,12 15,18" />,
    info: <><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><circle cx="12" cy="8" r="0.5" fill="currentColor" /></>,
    check: <polyline points="4,12 10,18 20,6" />,
    file: <><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="14,3 14,9 20,9" /></>,
    refresh: <><polyline points="22,4 22,10 16,10" /><path d="M20.4 15a8 8 0 1 1-2.1-9" /></>,
    zap: <polygon points="13,2 4,14 12,14 11,22 20,10 12,10" />,
    network: <><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /><path d="M7.5 7.5L10.5 10.5M16.5 7.5L13.5 10.5M7.5 16.5L10.5 13.5M16.5 16.5L13.5 13.5" /></>,
    chart: <><polyline points="3,17 9,11 13,15 21,7" /><polyline points="21,12 21,7 16,7" /></>,
    flag: <><path d="M4 21V4h12l-2 4 2 4H4" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" className={className}>
      {paths[name]}
    </svg>
  );
}

/* ---------- Section heading ---------- */
function Section({ title, meta, desc, children, action, infoKey }) {
  return (
    <div className="section">
      <div className="section-h">
        <div className="section-title">{title}{infoKey && <InfoButton k={infoKey} />}</div>
        {action || (meta && <div className="section-meta">{meta}</div>)}
      </div>
      {desc && <div className="section-desc">{desc}</div>}
      {children}
    </div>
  );
}

/* ---------- Layer toggle row ---------- */
function LayerRow({ swatch, label, count, on, onToggle, swatchStyle = {}, swatchClass = "", infoKey }) {
  return (
    <div className={"layer-row" + (on ? "" : " disabled")} onClick={onToggle}>
      <div className={"checkbox" + (on ? " checked" : "")}></div>
      <div className={"layer-swatch " + swatchClass} style={swatchStyle}></div>
      <div className="layer-label">{label}{infoKey && <InfoButton k={infoKey} />}</div>
      {count != null && <div className="layer-count">{count}</div>}
    </div>
  );
}

/* ---------- Number formatting ---------- */
function fmtN(n, digits = 0) {
  if (n == null || isNaN(n)) return "—";
  return n.toLocaleString("es-CL", { maximumFractionDigits: digits });
}
function fmtPct(n, digits = 0) {
  if (n == null || isNaN(n)) return "—";
  return (n * 100).toFixed(digits) + "%";
}
function fmtMM(n) {
  if (n == null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " M";
  if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + " mil";
  return fmtN(n);
}

/* ---------- Slider with label ---------- */
function SliderField({ label, value, min, max, step = 1, unit = "", onChange, accent = false, infoKey, disabled = false, badge }) {
  return (
    <div className="field" style={disabled ? { opacity: 0.55 } : null}>
      <div className="field-label">
        <span>
          {label}{infoKey && <InfoButton k={infoKey} />}
          {badge && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "oklch(0.5 0.12 80)", background: "oklch(0.95 0.05 85)", border: "1px solid oklch(0.85 0.08 85)", borderRadius: 3, padding: "0 5px" }}>{badge}</span>}
        </span>
        <span className="field-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        className={"slider" + (accent ? " accent" : "")}
        min={min} max={max} step={step} value={value}
        disabled={disabled}
        onChange={e => !disabled && onChange(Number(e.target.value))}
      />
    </div>
  );
}

/* ---------- Tabs ---------- */
function Tabs({ tabs, active, onChange }) {
  return (
    <div className="panel-tabs">
      {tabs.map(t => (
        <button
          key={t.key}
          className={"panel-tab" + (active === t.key ? " active" : "")}
          onClick={() => onChange(t.key)}
        >
          <span className="ph">{t.ph}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { Ico, Section, LayerRow, fmtN, fmtPct, fmtMM, SliderField, Tabs });
