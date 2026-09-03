#!/usr/bin/env python3
"""Post-process EVA's 12 predefined scenario experiment.

Inputs are produced by scripts/run-paper-all-scenarios-benefits.mjs.
Outputs make project rank sensitivity, benefit frontiers and practical
saturation directly auditable and usable in the EDTR manuscript.

No third-party Python dependencies are required.
"""
from __future__ import annotations

import csv
import html
import math
from pathlib import Path
from statistics import mean, median, pstdev

OUT = Path("results/paper-all-scenarios-benefits")

SCENARIOS = [
    ("ponderacion_rmc", "RMC"),
    ("balanceado", "Balanceado"),
    ("equidad", "Equidad"),
    ("demanda", "Demanda"),
    ("ciclistas_biogeme", "Logit"),
    ("fractal_alameda", "Fractal"),
    ("continuidad", "Continuidad"),
    ("eficiencia", "Eficiencia"),
    ("educacion", "Educación"),
    ("integracion", "Integración"),
    ("seguridad", "Seguridad"),
    ("intermodal", "Intermodal"),
]


def f(v, default=0.0):
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def i(v, default=0):
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return default


def read_csv(path: Path):
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        return list(csv.DictReader(fh))


def write_csv(path: Path, rows):
    rows = list(rows)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    keys = []
    seen = set()
    for row in rows:
        for k in row:
            if k not in seen:
                keys.append(k)
                seen.add(k)
    with path.open("w", encoding="utf-8", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=keys)
        w.writeheader()
        w.writerows(rows)


def load_runs():
    runs = {}
    for key, label in SCENARIOS:
        p = OUT / f"{key}_full_sequence.csv"
        if not p.exists():
            raise FileNotFoundError(f"Missing scenario output: {p}")
        rows = read_csv(p)
        runs[key] = {"label": label, "rows": rows}
    return runs


def build_rank_long(matrix_rows):
    out = []
    for row in matrix_rows:
        ranks = []
        for key, label in SCENARIOS:
            rank = i(row.get(f"seq_{key}"), 0)
            if rank:
                ranks.append(rank)
                out.append({
                    "id": row.get("id", ""),
                    "nombre": row.get("nombre", ""),
                    "escala": row.get("escala", ""),
                    "scenario": key,
                    "scenario_label": label,
                    "rank": rank,
                })
        if not ranks:
            continue
    return out


def build_rank_variability(matrix_rows):
    rows = []
    for row in matrix_rows:
        ranks = [i(row.get(f"seq_{key}"), 0) for key, _ in SCENARIOS]
        ranks = [x for x in ranks if x > 0]
        if not ranks:
            continue
        rec = {
            "id": row.get("id", ""),
            "nombre": row.get("nombre", ""),
            "escala": row.get("escala", ""),
            "rank_min": min(ranks),
            "rank_max": max(ranks),
            "rank_range": max(ranks) - min(ranks),
            "rank_mean": mean(ranks),
            "rank_median": median(ranks),
            "rank_sd": pstdev(ranks),
            "top10_count": sum(x <= 10 for x in ranks),
            "top20_count": sum(x <= 20 for x in ranks),
            "top30_count": sum(x <= 30 for x in ranks),
        }
        best_idx = min(range(len(SCENARIOS)), key=lambda idx: i(row.get(f"seq_{SCENARIOS[idx][0]}"), 9999))
        worst_idx = max(range(len(SCENARIOS)), key=lambda idx: i(row.get(f"seq_{SCENARIOS[idx][0]}"), -1))
        rec["best_scenario"] = SCENARIOS[best_idx][0]
        rec["best_scenario_label"] = SCENARIOS[best_idx][1]
        rec["worst_scenario"] = SCENARIOS[worst_idx][0]
        rec["worst_scenario_label"] = SCENARIOS[worst_idx][1]
        rows.append(rec)
    return sorted(rows, key=lambda r: (-f(r["rank_range"]), -f(r["rank_sd"]), f(r["rank_mean"])))


def stage_rows(runs):
    finals = {}
    for key, data in runs.items():
        last = data["rows"][-1]
        finals[key] = {
            "population": f(last.get("cum_population")),
            "demand": f(last.get("cum_demand")),
            "components": f(last.get("reduccion_componentes_acumulada")),
        }

    out = []
    max_steps = max(len(data["rows"]) for data in runs.values())
    for step in range(1, max_steps + 1):
        candidates = []
        for key, data in runs.items():
            if step > len(data["rows"]):
                continue
            row = data["rows"][step - 1]
            fin = finals[key]
            pn = f(row.get("cum_population")) / fin["population"] if fin["population"] else 0
            dn = f(row.get("cum_demand")) / fin["demand"] if fin["demand"] else 0
            cn = f(row.get("reduccion_componentes_acumulada")) / fin["components"] if fin["components"] else 0
            joint_pd = (pn + dn) / 2
            joint_pdc = (pn + dn + cn) / 3
            candidates.append({
                "step": step,
                "scenario": key,
                "scenario_label": data["label"],
                "population_norm": pn,
                "demand_norm": dn,
                "components_norm": cn,
                "joint_population_demand": joint_pd,
                "joint_population_demand_components": joint_pdc,
                "cum_population": f(row.get("cum_population")),
                "cum_demand": f(row.get("cum_demand")),
                "component_reduction": f(row.get("reduccion_componentes_acumulada")),
            })
        if not candidates:
            continue
        bp = max(candidates, key=lambda x: x["population_norm"])
        bd = max(candidates, key=lambda x: x["demand_norm"])
        bc = max(candidates, key=lambda x: x["components_norm"])
        bj = max(candidates, key=lambda x: x["joint_population_demand"])
        bj3 = max(candidates, key=lambda x: x["joint_population_demand_components"])
        out.append({
            "step": step,
            "best_population_scenario": bp["scenario"],
            "best_population_label": bp["scenario_label"],
            "best_population_share": bp["population_norm"],
            "best_demand_scenario": bd["scenario"],
            "best_demand_label": bd["scenario_label"],
            "best_demand_share": bd["demand_norm"],
            "best_components_scenario": bc["scenario"],
            "best_components_label": bc["scenario_label"],
            "best_components_share": bc["components_norm"],
            "best_joint_pd_scenario": bj["scenario"],
            "best_joint_pd_label": bj["scenario_label"],
            "best_joint_pd_index": bj["joint_population_demand"],
            "best_joint_pdc_scenario": bj3["scenario"],
            "best_joint_pdc_label": bj3["scenario_label"],
            "best_joint_pdc_index": bj3["joint_population_demand_components"],
        })
    return out


def saturation_long(summary_rows):
    out = []
    for row in summary_rows:
        for metric, prefix in [
            ("Población marginal acumulada", "population"),
            ("Conexión OD / demanda habilitada", "demand"),
            ("Conectividad topológica / reducción de componentes", "components"),
        ]:
            for pct in (50, 75, 90, 95, 99):
                out.append({
                    "scenario": row["scenario"],
                    "scenario_label": row["scenario_label"],
                    "metric": metric,
                    "threshold_pct": pct,
                    "step": row.get(f"{prefix}_{pct}_step", ""),
                })
    return out


def svg_escape(s):
    return html.escape(str(s or ""), quote=True)


def svg_rank_heatmap(matrix_rows, path: Path):
    # Full 124 × 12 matrix for supplementary/interactive inspection.
    rows = sorted(matrix_rows, key=lambda r: f(r.get("rank_mean"), 9999))
    cell_w, cell_h = 58, 20
    left, top, right = 250, 150, 30
    width = left + len(SCENARIOS) * cell_w + right
    height = top + len(rows) * cell_h + 45
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
             '<rect width="100%" height="100%" fill="white"/>',
             '<style>text{font-family:Arial,Helvetica,sans-serif;fill:#111}.small{font-size:10px}.row{font-size:9px}.head{font-size:10px;font-weight:600}</style>']
    # Headers rotated for compactness.
    for c, (_, label) in enumerate(SCENARIOS):
        x = left + c * cell_w + cell_w / 2
        y = top - 8
        parts.append(f'<text class="head" x="{x}" y="{y}" text-anchor="start" transform="rotate(-55 {x} {y})">{svg_escape(label)}</text>')
    for r_idx, row in enumerate(rows):
        y = top + r_idx * cell_h
        name = f'{row.get("id", "")} · {row.get("nombre", "")}'
        parts.append(f'<text class="row" x="{left-8}" y="{y+14}" text-anchor="end">{svg_escape(name[:42])}</text>')
        for c, (key, _) in enumerate(SCENARIOS):
            rank = i(row.get(f"seq_{key}"), 0)
            # dark for high priority; light for late positions
            q = (rank - 1) / 123 if rank else 1
            shade = int(40 + 205 * q)
            x = left + c * cell_w
            parts.append(f'<rect x="{x}" y="{y}" width="{cell_w-1}" height="{cell_h-1}" fill="rgb({shade},{shade},{shade})"/>')
            color = "white" if shade < 120 else "black"
            parts.append(f'<text class="small" x="{x+cell_w/2}" y="{y+14}" text-anchor="middle" fill="{color}" style="fill:{color}">{rank}</text>')
    parts.append('</svg>')
    path.write_text("\n".join(parts), encoding="utf-8")


def svg_rank_volatility(variability, path: Path, n=30):
    rows = variability[:n]
    width, height = 980, 80 + n * 24
    left, right, top = 300, 40, 45
    plot_w = width - left - right
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
             '<rect width="100%" height="100%" fill="white"/>',
             '<style>text{font-family:Arial,Helvetica,sans-serif;fill:#111}.label{font-size:11px}.tick{font-size:10px}.title{font-size:15px;font-weight:600}</style>',
             '<text class="title" x="20" y="24">Ciclovías más sensibles al escenario de priorización</text>']
    for tick in (1, 20, 40, 60, 80, 100, 124):
        x = left + (tick - 1) / 123 * plot_w
        parts.append(f'<line x1="{x}" y1="{top}" x2="{x}" y2="{height-25}" stroke="#ddd"/>')
        parts.append(f'<text class="tick" x="{x}" y="{height-8}" text-anchor="middle">{tick}</text>')
    for idx, row in enumerate(rows):
        y = top + idx * 24 + 10
        x1 = left + (f(row["rank_min"]) - 1) / 123 * plot_w
        x2 = left + (f(row["rank_max"]) - 1) / 123 * plot_w
        xm = left + (f(row["rank_mean"]) - 1) / 123 * plot_w
        label = f'{row["id"]} · {row["nombre"]}'
        parts.append(f'<text class="label" x="{left-10}" y="{y+4}" text-anchor="end">{svg_escape(label[:46])}</text>')
        parts.append(f'<line x1="{x1}" y1="{y}" x2="{x2}" y2="{y}" stroke="#555" stroke-width="2"/>')
        parts.append(f'<circle cx="{xm}" cy="{y}" r="4" fill="#111"/>')
    parts.append('</svg>')
    path.write_text("\n".join(parts), encoding="utf-8")


def svg_frontier(summary_rows, path: Path):
    width, height = 850, 620
    left, right, top, bottom = 95, 45, 50, 85
    xvals = [f(r["population_early_capture_index"]) for r in summary_rows]
    yvals = [f(r["demand_early_capture_index"]) for r in summary_rows]
    xmin, xmax = min(xvals) - .005, max(xvals) + .005
    ymin, ymax = min(yvals) - .005, max(yvals) + .005
    def X(x): return left + (x-xmin)/(xmax-xmin)*(width-left-right)
    def Y(y): return top + (ymax-y)/(ymax-ymin)*(height-top-bottom)
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
             '<rect width="100%" height="100%" fill="white"/>',
             '<style>text{font-family:Arial,Helvetica,sans-serif;fill:#111}.label{font-size:11px}.axis{font-size:12px}.title{font-size:16px;font-weight:600}</style>',
             '<text class="title" x="20" y="25">Captura temprana de población y conexión OD</text>']
    parts.append(f'<line x1="{left}" y1="{height-bottom}" x2="{width-right}" y2="{height-bottom}" stroke="#111"/>')
    parts.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{height-bottom}" stroke="#111"/>')
    for r in summary_rows:
        x = X(f(r["population_early_capture_index"]))
        y = Y(f(r["demand_early_capture_index"]))
        label = r["scenario_label"]
        parts.append(f'<circle cx="{x}" cy="{y}" r="5" fill="#222"/>')
        parts.append(f'<text class="label" x="{x+7}" y="{y-5}">{svg_escape(label)}</text>')
    parts.append(f'<text class="axis" x="{(left+width-right)/2}" y="{height-24}" text-anchor="middle">Índice de captura temprana de población I_P →</text>')
    parts.append(f'<text class="axis" x="22" y="{(top+height-bottom)/2}" text-anchor="middle" transform="rotate(-90 22 {(top+height-bottom)/2})">Índice de captura temprana de conexión OD I_D →</text>')
    parts.append('</svg>')
    path.write_text("\n".join(parts), encoding="utf-8")


def main():
    matrix_path = OUT / "project_rank_matrix_12_scenarios.csv"
    summary_path = OUT / "scenario_benefit_summary.csv"
    if not matrix_path.exists():
        raise FileNotFoundError(matrix_path)
    matrix = read_csv(matrix_path)
    summary = read_csv(summary_path)
    runs = load_runs()

    long_rank = build_rank_long(matrix)
    variability = build_rank_variability(matrix)
    best_stage = stage_rows(runs)
    saturation = saturation_long(summary)

    write_csv(OUT / "project_rank_long_12_scenarios.csv", long_rank)
    write_csv(OUT / "project_rank_variability.csv", variability)
    write_csv(OUT / "best_scenario_by_stage.csv", best_stage)
    write_csv(OUT / "saturation_thresholds_long.csv", saturation)

    svg_rank_heatmap(matrix, OUT / "figure_rank_heatmap_124x12.svg")
    svg_rank_volatility(variability, OUT / "figure_rank_volatility_top30.svg")
    svg_frontier(summary, OUT / "figure_population_connection_frontier.svg")

    print("Cross-scenario analysis written to", OUT)


if __name__ == "__main__":
    main()
