#!/usr/bin/env python3
"""Build monotonic practical-saturation products for the 12 EVA scenarios.

Saturation is defined on cumulative population coverage and cumulative OD-trip
enablement only. Topological component reduction is deliberately excluded from
this joint curve because component count can be non-monotonic when an isolated
new segment is created before it is connected later.
"""
from __future__ import annotations

import csv
import html
from pathlib import Path

OUT = Path("results/paper-all-scenarios-benefits")
SCENARIOS = [
    ("ponderacion_rmc", "RMC"), ("balanceado", "Balanceado"),
    ("equidad", "Equidad"), ("demanda", "Demanda potencial"),
    ("ciclistas_biogeme", "Logit / Biogeme"),
    ("fractal_alameda", "Dendrítica Alameda"),
    ("continuidad", "Continuidad"), ("eficiencia", "Eficiencia"),
    ("educacion", "Educación superior"), ("integracion", "Integración"),
    ("seguridad", "Seguridad"), ("intermodal", "Intermodalidad"),
]
THRESHOLDS = (0.50, 0.75, 0.90, 0.95, 0.99)


def num(v):
    try: return float(v)
    except (TypeError, ValueError): return 0.0


def read_csv(path):
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def write_csv(path, rows):
    rows = list(rows)
    if not rows:
        path.write_text("", encoding="utf-8"); return
    keys = list(rows[0])
    with path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=keys); w.writeheader(); w.writerows(rows)


def esc(s): return html.escape(str(s), quote=True)


def main():
    runs = {}
    for key, label in SCENARIOS:
        rows = read_csv(OUT / f"{key}_full_sequence.csv")
        fp = num(rows[-1]["cum_population"])
        fd = num(rows[-1]["cum_demand"])
        curve = []
        for r in rows:
            p = num(r["cum_population"]) / fp if fp else 0.0
            d = num(r["cum_demand"]) / fd if fd else 0.0
            # Conservative joint capture: both outcomes have reached this share.
            curve.append({
                "step": int(float(r["step"])),
                "population_share": p,
                "od_share": d,
                "joint_share": min(p, d),
            })
        runs[key] = {"label": label, "curve": curve}

    threshold_rows = []
    for key, data in runs.items():
        rec = {"scenario": key, "scenario_label": data["label"]}
        for threshold in THRESHOLDS:
            hit = next((x["step"] for x in data["curve"] if x["joint_share"] >= threshold - 1e-12), None)
            rec[f"joint_{round(threshold*100)}_step"] = hit
        threshold_rows.append(rec)
    write_csv(OUT / "saturation_population_od_thresholds.csv", threshold_rows)

    # Long curve for external plotting/reproducibility.
    long_rows = []
    for key, data in runs.items():
        for x in data["curve"]:
            long_rows.append({"scenario": key, "scenario_label": data["label"], **x})
    write_csv(OUT / "saturation_population_od_curve.csv", long_rows)

    # Dependency-free SVG suitable for manuscript/repository.
    W, H = 980, 640
    L, R, T, B = 85, 35, 45, 75
    pw, ph = W-L-R, H-T-B
    def X(step): return L + (step-1)/123*pw
    def Y(value): return T + (1-value)*ph
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
        '<rect width="100%" height="100%" fill="white"/>',
        '<style>text{font-family:Arial,Helvetica,sans-serif;fill:#111}.title{font-size:16px;font-weight:600}.axis{font-size:12px}.tick{font-size:10px}.leg{font-size:10px}</style>',
        '<text class="title" x="20" y="25">Rendimientos decrecientes: población marginal + conexión funcional OD</text>',
    ]
    # Grid and axes.
    for val in (0, .25, .5, .75, .9, .95, .99, 1):
        y = Y(val)
        dash = ' stroke-dasharray="5,4"' if val == .95 else ''
        parts.append(f'<line x1="{L}" y1="{y:.1f}" x2="{W-R}" y2="{y:.1f}" stroke="#ddd"{dash}/>')
        parts.append(f'<text class="tick" x="{L-8}" y="{y+4:.1f}" text-anchor="end">{val:.2f}</text>')
    for step in (1, 20, 40, 60, 80, 100, 124):
        x = X(step)
        parts.append(f'<line x1="{x:.1f}" y1="{T}" x2="{x:.1f}" y2="{H-B}" stroke="#eee"/>')
        parts.append(f'<text class="tick" x="{x:.1f}" y="{H-B+18}" text-anchor="middle">{step}</text>')
    parts.append(f'<line x1="{L}" y1="{H-B}" x2="{W-R}" y2="{H-B}" stroke="#111"/>')
    parts.append(f'<line x1="{L}" y1="{T}" x2="{L}" y2="{H-B}" stroke="#111"/>')

    # Use grayscale/dash combinations so the figure remains publication-safe in B/W.
    dash_patterns = ["", "7,3", "3,3", "10,3,2,3", "2,2", "12,4", "5,2,1,2", "1,3", "8,2", "4,4", "9,2,2,2", "6,2,1,2,1,2"]
    shades = [20, 45, 70, 95, 120, 145, 170, 65, 105, 135, 35, 155]
    legend_x, legend_y = 665, 72
    for idx, (key, data) in enumerate(runs.items()):
        pts = ' '.join(f'{X(x["step"]):.1f},{Y(x["joint_share"]):.1f}' for x in data["curve"])
        dash = dash_patterns[idx]
        dash_attr = f' stroke-dasharray="{dash}"' if dash else ''
        shade = shades[idx]
        parts.append(f'<polyline points="{pts}" fill="none" stroke="rgb({shade},{shade},{shade})" stroke-width="1.7"{dash_attr}/>')
        ly = legend_y + idx*18
        parts.append(f'<line x1="{legend_x}" y1="{ly}" x2="{legend_x+28}" y2="{ly}" stroke="rgb({shade},{shade},{shade})" stroke-width="2"{dash_attr}/>')
        parts.append(f'<text class="leg" x="{legend_x+34}" y="{ly+4}">{esc(data["label"])}</text>')

    parts.append(f'<text class="axis" x="{L+pw/2:.1f}" y="{H-18}" text-anchor="middle">Número de ciclovías incorporadas</text>')
    cy = T+ph/2
    parts.append(f'<text class="axis" x="20" y="{cy:.1f}" text-anchor="middle" transform="rotate(-90 20 {cy:.1f})">Fracción conjunta capturada = min(C_P, C_D)</text>')
    parts.append('</svg>')
    (OUT / "figure_saturation_population_od.svg").write_text("\n".join(parts), encoding="utf-8")

    print("Wrote monotonic population+OD saturation analysis")


if __name__ == "__main__":
    main()
