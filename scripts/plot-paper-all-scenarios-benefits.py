#!/usr/bin/env python3
"""Figuras reproducibles para el experimento EDTR de 12 escenarios EVA.

Lee results/paper-all-scenarios-benefits/ y genera figuras separadas:
- matriz 124 proyectos x 12 escenarios;
- posiciones de proyectos robustos/polarizados;
- frontera población-habilitación OD;
- saturación práctica conjunta al 95%;
- curvas exactas de captura conjunta y punto de rodilla endógeno;
- frontera tridimensional población + OD + consolidación topológica.

No construye un metarranking normativo. La matriz se ordena sólo para visualización
por mediana de posición y la robustez se reporta mediante rango y frecuencia Top-k.
El punto de rodilla es un diagnóstico geométrico descriptivo: máximo alejamiento de
la curva conjunta normalizada respecto de la diagonal temporal. No constituye un
óptimo económico ni una regla universal de detención.
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
robust = rank.sort_values(
    ["top10_count", "rank_median", "rank_range"],
    ascending=[False, True, True],
).head(6)
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
for c in [
    "area_population_person_stage",
    "area_demand_trip_stage",
    "area_component_reduction_stage",
]:
    summary[c] = pd.to_numeric(summary[c])

front2 = []
for i, a in summary.iterrows():
    dominated = False
    for j, b in summary.iterrows():
        if i == j:
            continue
        if (
            b.area_population_person_stage >= a.area_population_person_stage
            and b.area_demand_trip_stage >= a.area_demand_trip_stage
            and (
                b.area_population_person_stage > a.area_population_person_stage
                or b.area_demand_trip_stage > a.area_demand_trip_stage
            )
        ):
            dominated = True
            break
    if not dominated:
        front2.append(i)

fig, ax = plt.subplots(figsize=(9, 6.5))
for _, r in summary.iterrows():
    xval = r.area_population_person_stage / 1_000_000
    yval = r.area_demand_trip_stage / 1_000_000
    ax.scatter(xval, yval, s=55)
    ax.annotate(r.scenario_label, (xval, yval), xytext=(5, 4), textcoords="offset points", fontsize=8)
f = summary.loc[front2].sort_values("area_population_person_stage")
ax.plot(
    f.area_population_person_stage / 1_000_000,
    f.area_demand_trip_stage / 1_000_000,
    marker="o",
    linewidth=1.4,
)
ax.set_xlabel("Captura acumulada de población (millones persona-etapa)")
ax.set_ylabel("Captura acumulada de habilitación OD (millones viaje-etapa)")
ax.set_title("Frontera población-conexión funcional entre escenarios EVA")
ax.grid(True, alpha=0.25)
fig.tight_layout()
fig.savefig(OUT / "pareto_population_od.png", dpi=240, bbox_inches="tight")
plt.close(fig)

# 4) Frontera tridimensional de resultados físicos comparables.
front3 = []
metrics3 = [
    "area_population_person_stage",
    "area_demand_trip_stage",
    "area_component_reduction_stage",
]
for i, a in summary.iterrows():
    dominated = False
    for j, b in summary.iterrows():
        if i == j:
            continue
        weakly_better = all(float(b[m]) >= float(a[m]) for m in metrics3)
        strictly_better = any(float(b[m]) > float(a[m]) for m in metrics3)
        if weakly_better and strictly_better:
            dominated = True
            break
    if not dominated:
        front3.append(i)

front3_df = summary.loc[front3, ["scenario", "scenario_label"] + metrics3].copy()
front3_df.to_csv(BASE / "pareto_population_od_topology.csv", index=False)

# 5) Saturación práctica conjunta al 95%.
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

# 6) Curvas exactas de captura conjunta población-OD y punto de rodilla.
# C_J(t)=min(P_t/P_H, D_t/D_H): fracción que ha sido capturada simultáneamente
# en ambas dimensiones. La rodilla se define como max_t[C_J(t)-t/n].
knee_rows = []
curve_by_key = {}
for key, label in SCENARIOS:
    seq = pd.read_csv(BASE / f"{key}_full_sequence.csv")
    n = len(seq)
    final_p = float(seq["cum_population"].iloc[-1])
    final_d = float(seq["cum_demand"].iloc[-1])
    pfrac = seq["cum_population"].astype(float) / final_p if final_p > 0 else 0.0
    dfrac = seq["cum_demand"].astype(float) / final_d if final_d > 0 else 0.0
    joint = pd.concat([pfrac, dfrac], axis=1).min(axis=1).cummax()
    temporal = seq["step"].astype(float) / float(n)
    distance = joint - temporal
    knee_idx = distance.idxmax()
    knee_step = int(seq.loc[knee_idx, "step"])
    joint_at_knee = float(joint.loc[knee_idx])
    p_at_knee = float(pfrac.loc[knee_idx])
    d_at_knee = float(dfrac.loc[knee_idx])

    last_p = int(seq.loc[seq["poblacion_marginal"].astype(float) > 0, "step"].max()) if (seq["poblacion_marginal"].astype(float) > 0).any() else 0
    last_d = int(seq.loc[seq["demanda_habilitada"].astype(float) > 0, "step"].max()) if (seq["demanda_habilitada"].astype(float) > 0).any() else 0
    last_any = max(last_p, last_d)

    knee_rows.append({
        "scenario": key,
        "scenario_label": label,
        "knee_step": knee_step,
        "joint_capture_at_knee": joint_at_knee,
        "population_capture_at_knee": p_at_knee,
        "demand_capture_at_knee": d_at_knee,
        "joint_remaining_after_knee": 1.0 - joint_at_knee,
        "joint_90_step": int(seq.loc[joint >= 0.90, "step"].iloc[0]),
        "joint_95_step": int(seq.loc[joint >= 0.95, "step"].iloc[0]),
        "joint_99_step": int(seq.loc[joint >= 0.99, "step"].iloc[0]),
        "last_population_gain_step": last_p,
        "last_demand_gain_step": last_d,
        "last_any_population_or_od_gain_step": last_any,
        "zero_gain_tail_starts_after_step": last_any if last_any < n else None,
    })
    curve_by_key[key] = pd.DataFrame({
        "step": seq["step"].astype(int),
        "population_fraction": pfrac,
        "demand_fraction": dfrac,
        "joint_fraction": joint,
    })

knee = pd.DataFrame(knee_rows).sort_values("knee_step")
knee.to_csv(BASE / "joint_capture_knee_summary.csv", index=False)

# Figura principal sugerida: sólo escenarios no dominados en las tres dimensiones.
front3_keys = set(front3_df["scenario"])
fig, ax = plt.subplots(figsize=(9.4, 6.0))
for key, label in SCENARIOS:
    if key not in front3_keys:
        continue
    c = curve_by_key[key]
    kr = knee[knee["scenario"] == key].iloc[0]
    ax.plot(c["step"], 100 * c["joint_fraction"], linewidth=1.8, label=label)
    ax.scatter([kr["knee_step"]], [100 * kr["joint_capture_at_knee"]], s=48)
ax.axhline(95, linestyle="--", linewidth=1)
ax.axhline(99, linestyle=":", linewidth=1)
ax.set_xlabel("Número de ciclovías implementadas")
ax.set_ylabel("Población y habilitación OD capturadas simultáneamente (%)")
ax.set_title("Captura conjunta y rendimientos decrecientes en perfiles no dominados")
ax.set_xlim(0, max(len(c) for c in curve_by_key.values()))
ax.set_ylim(0, 101)
ax.grid(True, alpha=0.25)
ax.legend(frameon=False)
fig.tight_layout()
fig.savefig(OUT / "joint_capture_curves_pareto3d_knee.png", dpi=240, bbox_inches="tight")
plt.close(fig)

# Figura suplementaria: rodilla endógena y umbral normativo 95% en los 12 escenarios.
k = knee.sort_values("knee_step")
fig, ax = plt.subplots(figsize=(11.5, 5.8))
x = list(range(len(k)))
ax.plot(x, k["knee_step"], marker="o", label="Rodilla endógena")
ax.plot(x, k["joint_95_step"], marker="o", label="95% conjunto")
ax.set_xticks(x)
ax.set_xticklabels(k["scenario_label"], rotation=40, ha="right")
ax.set_ylabel("Etapa de implementación")
ax.set_xlabel("Escenario predefinido EVA")
ax.set_title("Saturación empírica y normativa de la trayectoria población-OD")
ax.grid(True, alpha=0.25)
ax.legend(frameon=False)
fig.tight_layout()
fig.savefig(OUT / "knee_vs_joint95_12_scenarios.png", dpi=240, bbox_inches="tight")
plt.close(fig)

print(f"Figuras generadas en {OUT}")
print(f"Diagnóstico de rodilla: {BASE / 'joint_capture_knee_summary.csv'}")
print(f"Frontera 3D: {BASE / 'pareto_population_od_topology.csv'}")
