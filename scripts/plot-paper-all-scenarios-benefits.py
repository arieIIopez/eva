#!/usr/bin/env python3
"""Figuras reproducibles para el experimento EDTR de 12 escenarios EVA.

Lee results/paper-all-scenarios-benefits/ y genera figuras separadas:
- matriz 124 proyectos x 12 escenarios;
- posiciones de proyectos robustos/polarizados;
- frontera población-habilitación OD;
- saturación práctica conjunta al 95%.

No construye un metarranking normativo: la matriz se ordena sólo para visualización
por mediana de posición y las métricas de robustez se reportan explícitamente.
"""
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt

BASE = Path("results/paper-all-scenarios-benefits")
OUT = BASE / "figures"
OUT.mkdir(parents=True, exist_ok=True)

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

rank = pd.read_csv(BASE / "project_rank_matrix_12_scenarios.csv")
summary = pd.read_csv(BASE / "scenario_benefit_summary.csv")

# 1) Matriz completa 124 x 12 (suplemento).
rank_cols = [f"seq_{key}" for key, _ in SCENARIOS]
rank_plot = rank.sort_values(["rank_median", "rank_mean", "rank_range"]).reset_index(drop=True)
fig, ax = plt.subplots(figsize=(11, 25))
im = ax.imshow(rank_plot[rank_cols].to_numpy(float), aspect="auto")
ax.set_xticks(range(len(SCENARIOS)))
ax.set_xticklabels([label for _, label in SCENARIOS], rotation=40, ha="right")
ax.set_yticks(range(len(rank_plot)))
ax.set_yticklabels(rank_plot["id"], fontsize=6)
ax.set_xlabel("Escenario predefinido EVA")
ax.set_ylabel("Ciclovías, ordenadas por mediana de posición")
ax.set_title("Posición de las 124 ciclovías en los 12 escenarios")
cbar = fig.colorbar(im, ax=ax, fraction=0.025, pad=0.02)
cbar.set_label("Posición en la secuencia (1 = mayor prioridad)")
fig.tight_layout()
fig.savefig(OUT / "rank_matrix_124x12.png", dpi=240, bbox_inches="tight")
plt.close(fig)

# 2) Proyectos robustos y polarizados para figura principal.
robust = rank.sort_values(["top10_count", "rank_median", "rank_range"], ascending=[False, True, True]).head(6)
polar = rank.sort_values(["rank_range", "rank_sd"], ascending=[False, False]).head(6)
ids = list(dict.fromkeys(list(robust["id"]) + list(polar["id"])))
sel = rank.set_index("id").loc[ids].reset_index()
fig, ax = plt.subplots(figsize=(12.5, 7.2))
x = list(range(len(SCENARIOS)))
for _, r in sel.iterrows():
    y = [r[f"seq_{key}"] for key, _ in SCENARIOS]
    ax.plot(x, y, marker="o", linewidth=1.2, label=f"{r['id']} · {r['nombre']}")
ax.set_xticks(x)
ax.set_xticklabels([label for _, label in SCENARIOS], rotation=35, ha="right")
ax.set_ylabel("Posición en la secuencia (1 = mayor prioridad)")
ax.set_xlabel("Escenario predefinido EVA")
ax.set_ylim(125, 0)
ax.set_yticks([1, 10, 20, 30, 50, 75, 100, 124])
ax.grid(True, alpha=0.25)
ax.legend(loc="upper left", bbox_to_anchor=(1.01, 1), fontsize=8, frameon=False)
fig.tight_layout()
fig.savefig(OUT / "rank_robust_polarized.png", dpi=240, bbox_inches="tight")
plt.close(fig)

# 3) Frontera de Pareto población - conexión funcional.
for c in ["area_population_person_stage", "area_demand_trip_stage"]:
    summary[c] = pd.to_numeric(summary[c])
front = []
for i, a in summary.iterrows():
    dominated = False
    for j, b in summary.iterrows():
        if i == j:
            continue
        if (b.area_population_person_stage >= a.area_population_person_stage and
            b.area_demand_trip_stage >= a.area_demand_trip_stage and
            (b.area_population_person_stage > a.area_population_person_stage or
             b.area_demand_trip_stage > a.area_demand_trip_stage)):
            dominated = True
            break
    if not dominated:
        front.append(i)
fig, ax = plt.subplots(figsize=(9, 6.5))
for _, r in summary.iterrows():
    xval = r.area_population_person_stage / 1_000_000
    yval = r.area_demand_trip_stage / 1_000_000
    ax.scatter(xval, yval, s=55)
    ax.annotate(r.scenario_label, (xval, yval), xytext=(5, 4), textcoords="offset points", fontsize=8)
f = summary.loc[front].sort_values("area_population_person_stage")
ax.plot(f.area_population_person_stage / 1_000_000,
        f.area_demand_trip_stage / 1_000_000,
        marker="o", linewidth=1.4)
ax.set_xlabel("Captura acumulada de población (millones persona-etapa)")
ax.set_ylabel("Captura acumulada de habilitación OD (millones viaje-etapa)")
ax.set_title("Frontera población-conexión funcional entre escenarios EVA")
ax.grid(True, alpha=0.25)
fig.tight_layout()
fig.savefig(OUT / "pareto_population_od.png", dpi=240, bbox_inches="tight")
plt.close(fig)

# 4) Saturación práctica conjunta 95%.
summary["joint_95_step"] = summary[["population_95_step", "demand_95_step"]].max(axis=1)
s = summary.sort_values("joint_95_step")
fig, ax = plt.subplots(figsize=(11.5, 5.8))
x = list(range(len(s)))
ax.plot(x, s["population_95_step"], marker="o", label="95% población")
ax.plot(x, s["demand_95_step"], marker="o", label="95% habilitación OD")
ax.plot(x, s["joint_95_step"], marker="o", linewidth=2, label="95% conjunto")
ax.set_xticks(x)
ax.set_xticklabels(s["scenario_label"], rotation=40, ha="right")
ax.set_ylabel("Etapa de implementación")
ax.set_xlabel("Escenario predefinido EVA")
ax.set_title("Etapa en que se captura el 95% del resultado final")
ax.grid(True, alpha=0.25)
ax.legend(frameon=False)
fig.tight_layout()
fig.savefig(OUT / "saturation_95.png", dpi=240, bbox_inches="tight")
plt.close(fig)

print(f"Figuras generadas en {OUT}")
