/* ============================================================
   EvaCiclo · Terminal flotante estilo macOS + logger global
   ----
   - window.evaLog(level, msg): logger central (ring buffer +
     CustomEvent "eva-log"). Niveles: info, ok, warn, error,
     step, data, sys.
   - Espeja console.log/warn/error y errores globales.
   - <TerminalWindow />: ventana flotante oscura translúcida,
     arrastrable, redimensionable, minimizable (semáforo OSX).
============================================================ */

(function initLogger() {
  const MAX = 3000;
  const buf = [];
  window.__evaLogBuf = buf;

  let seq = 0;
  window.evaLog = function (level, msg) {
    const e = { id: ++seq, t: Date.now(), level: level || "info", msg: String(msg) };
    buf.push(e);
    if (buf.length > MAX) buf.splice(0, buf.length - MAX);
    try { window.dispatchEvent(new CustomEvent("eva-log", { detail: e })); } catch (_) {}
  };

  // Espejar console (sin recursión: evaLog no usa console)
  const origLog = console.log.bind(console);
  const origWarn = console.warn.bind(console);
  const origError = console.error.bind(console);
  const fmt = (args) => args.map(a => {
    if (typeof a === "string") return a;
    try { return JSON.stringify(a); } catch (_) { return String(a); }
  }).join(" ");
  console.log = (...args) => { origLog(...args); window.evaLog("sys", fmt(args)); };
  console.warn = (...args) => { origWarn(...args); window.evaLog("warn", fmt(args)); };
  console.error = (...args) => { origError(...args); window.evaLog("error", fmt(args)); };

  window.addEventListener("error", (e) => {
    window.evaLog("error", `Excepción: ${e.message} (${e.filename ? e.filename.split("/").pop() : "?"}:${e.lineno || "?"})`);
  });
  window.addEventListener("unhandledrejection", (e) => {
    window.evaLog("error", "Promesa rechazada: " + (e.reason && e.reason.message ? e.reason.message : String(e.reason)));
  });

  window.evaLog("sys", "Logger inicializado · EVA terminal v1");
})();

/* Cede el hilo al navegador para que la UI pinte y no se congele */
window.evaYield = function () {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => setTimeout(resolve, 0));
    } else setTimeout(resolve, 0);
  });
};

/* ============================================================
   Componente TerminalWindow
============================================================ */
function TerminalWindow() {
  const { useState, useEffect, useRef, useCallback } = React;

  const LS_KEY = "evaciclo_term_v1";
  const saved = (() => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (_) { return {}; } })();

  const [closed, setClosed] = useState(saved.closed ?? false);
  const [minimized, setMinimized] = useState(saved.minimized ?? false);
  const [maximized, setMaximized] = useState(false);
  const [pos, setPos] = useState(saved.pos || null);   // null = anclado abajo-derecha
  const [size, setSize] = useState(saved.size || { w: 520, h: 280 });
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);

  const bodyRef = useRef(null);
  const stickBottom = useRef(true);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const rootRef = useRef(null);

  // persistir estado
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ closed, minimized, pos, size })); } catch (_) {}
  }, [closed, minimized, pos, size]);

  // suscripción al log (throttle por frame)
  useEffect(() => {
    let raf = 0;
    const h = () => {
      if (paused) return;
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; setTick(t => t + 1); });
    };
    window.addEventListener("eva-log", h);
    return () => { window.removeEventListener("eva-log", h); if (raf) cancelAnimationFrame(raf); };
  }, [paused]);

  // autoscroll
  useEffect(() => {
    const el = bodyRef.current;
    if (el && stickBottom.current) el.scrollTop = el.scrollHeight;
  }, [tick, minimized, maximized]);

  const onBodyScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    stickBottom.current = (el.scrollHeight - el.scrollTop - el.clientHeight) < 30;
  };

  // ---- drag ----
  const onTitleDown = (e) => {
    if (e.target.closest(".term-light")) return;
    const root = rootRef.current;
    const rect = root.getBoundingClientRect();
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId);
    const move = (ev) => {
      if (!dragRef.current) return;
      const x = Math.min(Math.max(0, ev.clientX - dragRef.current.dx), window.innerWidth - 120);
      const y = Math.min(Math.max(0, ev.clientY - dragRef.current.dy), window.innerHeight - 40);
      setPos({ x, y });
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // ---- resize ----
  const onResizeDown = (e) => {
    e.preventDefault(); e.stopPropagation();
    const rect = rootRef.current.getBoundingClientRect();
    resizeRef.current = { x0: e.clientX, y0: e.clientY, w0: rect.width, h0: rect.height };
    if (!pos) setPos({ x: rect.left, y: rect.top }); // desanclar para que crezca hacia abajo-derecha
    const move = (ev) => {
      if (!resizeRef.current) return;
      const w = Math.max(360, resizeRef.current.w0 + (ev.clientX - resizeRef.current.x0));
      const h = Math.max(140, resizeRef.current.h0 + (ev.clientY - resizeRef.current.y0));
      setSize({ w, h });
    };
    const up = () => {
      resizeRef.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const clearLog = () => {
    window.__evaLogBuf.length = 0;
    window.evaLog("sys", "Log limpiado");
  };

  if (closed) {
    return (
      <button className="term-reopen" onClick={() => { setClosed(false); setMinimized(false); }} title="Abrir terminal de proceso">
        <span className="term-reopen-dot"></span> Terminal
      </button>
    );
  }

  const lines = window.__evaLogBuf.slice(-500);
  const fmtT = (t) => {
    const d = new Date(t);
    const p = (n, l = 2) => String(n).padStart(l, "0");
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
  };

  const style = {};
  if (maximized) {
    Object.assign(style, { left: "8vw", top: "10vh", right: "auto", bottom: "auto", width: "84vw", height: "76vh" });
  } else {
    style.width = size.w + "px";
    style.height = minimized ? "auto" : size.h + "px";
    if (pos) { style.left = pos.x + "px"; style.top = pos.y + "px"; style.right = "auto"; style.bottom = "auto"; }
  }

  return (
    <div ref={rootRef} className={"term" + (minimized ? " term-min" : "")} style={style}>
      <div className="term-title" onPointerDown={onTitleDown}>
        <div className="term-lights">
          <button className="term-light red" title="Cerrar" onClick={() => setClosed(true)}></button>
          <button className="term-light yellow" title="Minimizar" onClick={() => setMinimized(m => !m)}></button>
          <button className="term-light green" title="Agrandar" onClick={() => { setMaximized(m => !m); setMinimized(false); }}></button>
        </div>
        <span className="term-name">eva — proceso de cálculo</span>
        <div className="term-actions">
          <button className="term-act" onClick={() => setPaused(p => !p)} title={paused ? "Reanudar" : "Pausar"}>{paused ? "▶" : "⏸"}</button>
          <button className="term-act" onClick={clearLog} title="Limpiar">⌫</button>
        </div>
      </div>
      {!minimized && (
        <>
          <div className="term-body" ref={bodyRef} onScroll={onBodyScroll}>
            {lines.map(l => (
              <div key={l.id} className={"term-line lv-" + l.level}>
                <span className="term-t">{fmtT(l.t)}</span>
                <span className="term-msg">{l.msg}</span>
              </div>
            ))}
            <div className="term-cursor">▌</div>
          </div>
          <div className="term-resize" onPointerDown={onResizeDown}></div>
        </>
      )}
    </div>
  );
}

window.TerminalWindow = TerminalWindow;
