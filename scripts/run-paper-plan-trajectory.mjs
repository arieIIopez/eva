import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.EVA_EXPERIMENT_BASE_URL || 'http://127.0.0.1:8080/experiments/runner-plan-trajectory.html';
const outDir = path.resolve('results/paper-plan-trajectory');
await fs.mkdir(outDir, { recursive: true });

function csvEscape(value) {
  if (value == null) return '';
  const s = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

async function writeCsv(file, rows) {
  const safe = rows || [];
  if (!safe.length) {
    await fs.writeFile(path.join(outDir, file), '', 'utf8');
    return;
  }
  const keys = Array.from(safe.reduce((set, row) => {
    Object.keys(row).forEach(k => set.add(k));
    return set;
  }, new Set()));
  const text = [keys.join(','), ...safe.map(r => keys.map(k => csvEscape(r[k])).join(','))].join('\n') + '\n';
  await fs.writeFile(path.join(outDir, file), text, 'utf8');
}

function byStrategy(summary, name) {
  return (summary || []).find(r => r.strategy === name) || {};
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(60 * 60 * 1000);
page.on('console', msg => {
  const txt = msg.text();
  if (txt.startsWith('[paper-trajectory]') || msg.type() === 'error') console.log(txt);
});
page.on('pageerror', err => console.error('[pageerror]', err));

try {
  console.log(`Opening ${baseUrl}`);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__EVA_EXPERIMENT_READY || window.__EVA_EXPERIMENT_ERROR, null, { timeout: 180000 });
  const bootError = await page.evaluate(() => window.__EVA_EXPERIMENT_ERROR || null);
  if (bootError) throw new Error(bootError);

  const result = await page.evaluate(async () => {
    return await window.EVA_PAPER_EXPERIMENTS.runPlanTrajectory({
      steps: 30,
      discount: 0.95,
      transitionTopN: 40,
    });
  });

  await fs.writeFile(path.join(outDir, 'summary.json'), JSON.stringify(result, null, 2), 'utf8');
  await fs.writeFile(path.join(outDir, 'normalization_reference.json'), JSON.stringify(result.normalization_reference || {}, null, 2), 'utf8');

  await writeCsv('initial_ranking.csv', result.initial_ranking);

  const e1 = result.experiment_1_order_only;
  await writeCsv('order_only_static_trajectory.csv', e1.static.rows);
  await writeCsv('order_only_eva_trajectory.csv', e1.adaptive.rows);
  await writeCsv('order_only_step_comparison.csv', e1.step_comparison);
  await writeCsv('order_only_budget_comparison.csv', e1.budget_comparison);
  await writeCsv('order_only_summary.csv', e1.summaries);
  await writeCsv('order_only_static_transition_effects.csv', e1.static.transitions);
  await writeCsv('order_only_eva_transition_effects.csv', e1.adaptive.transitions);

  const e2 = result.experiment_2_adaptive_plan;
  await writeCsv('adaptive_open_trajectory.csv', e2.adaptive.rows);
  await writeCsv('adaptive_open_candidate_panel.csv', e2.adaptive.panel);
  await writeCsv('adaptive_open_transition_effects.csv', e2.adaptive.transitions);
  await writeCsv('adaptive_open_project_evolution.csv', e2.project_evolution);
  await writeCsv('adaptive_open_transition_summary.csv', [e2.transition_summary]);
  await writeCsv('adaptive_open_complementarity_signals.csv', e2.strongest_complementarity_signals);
  await writeCsv('adaptive_open_substitution_signals.csv', e2.strongest_substitution_signals);
  await writeCsv('adaptive_open_summary.csv', [e2.summary]);

  const staticSummary = byStrategy(e1.summaries, 'static_fixed_set');
  const evaFixedSummary = byStrategy(e1.summaries, 'eva_adaptive_fixed_set');
  const scoreDelta = (evaFixedSummary.cumulative_realized_eva_score ?? 0) - (staticSummary.cumulative_realized_eva_score ?? 0);
  const discountedDelta = (evaFixedSummary.discounted_eva_score ?? 0) - (staticSummary.discounted_eva_score ?? 0);
  const componentAreaDelta = (evaFixedSummary.integrated_component_reduction ?? 0) - (staticSummary.integrated_component_reduction ?? 0);

  const entered = e2.projects_entering_vs_initial_topN || [];
  const displaced = e2.projects_displaced_from_initial_topN || [];
  const strongestPos = (e2.strongest_complementarity_signals || [])[0] || null;
  const strongestNeg = (e2.strongest_substitution_signals || [])[0] || null;

  const readme = `# EVA · experimento de trayectoria de implementación\n\n` +
    `Generado: ${result.generated_at}\n\n` +
    `## Pregunta metodológica\n\n` +
    `Los planes maestros suelen comparar una condición base G0 con un horizonte GH en que la cartera está implementada. Este experimento evalúa también la trayectoria G0→G1→…→GH y pregunta si el orden de entrada de los proyectos altera el valor capturado durante la implementación y la prioridad de los proyectos restantes.\n\n` +
    `## Diseño\n\n` +
    `- Escenario: Ponderación RMC.\n` +
    `- Normalización: referencia fija G0 sobre proyectos Comunales + Intercomunales.\n` +
    `- Universo modelado: ${result.design.modeled_projects}; elegibles: ${result.design.eligible_projects}.\n` +
    `- Horizonte experimental: ${result.design.fixed_plan_size} proyectos.\n` +
    `- Descuento por etapa para valor decisional temprano: δ=${result.design.discount_per_step}.\n` +
    `- El puntaje acumulado EVA es un valor decisional multicriterio; no debe interpretarse como bienestar monetario.\n\n` +
    `## Experimento 1 · mismo plan final, distinto orden\n\n` +
    `Se comparan (a) el orden estático inicial y (b) un reordenamiento EVA que en cada etapa selecciona el proyecto con mayor valoración actual, pero restringido exactamente al mismo Top-${result.design.fixed_plan_size} inicial. Ambos recorridos deben terminar con el mismo conjunto de proyectos.\n\n` +
    `- Mismo conjunto final: ${e1.same_final_project_set}.\n` +
    `- Mismo número final de componentes: ${e1.same_final_component_count} (${e1.final_static_components} vs ${e1.final_adaptive_components}).\n` +
    `- Diferencia de valor EVA acumulado, adaptativo−estático: ${scoreDelta.toFixed(6)}.\n` +
    `- Diferencia de valor EVA descontado (δ=${result.design.discount_per_step}): ${discountedDelta.toFixed(6)}.\n` +
    `- Diferencia en reducción integrada de componentes, adaptativo−estático: ${componentAreaDelta.toFixed(3)}.\n\n` +
    `La tabla order_only_budget_comparison.csv compara ambas trayectorias con presupuestos equivalentes, evitando atribuir a la secuencia diferencias producidas sólo por el costo de los proyectos.\n\n` +
    `## Experimento 2 · plan adaptativo abierto\n\n` +
    `EVA reevalúa los ${result.design.eligible_projects} proyectos elegibles después de cada intervención. A diferencia del experimento 1, la composición del Top-${result.design.fixed_plan_size} puede cambiar.\n\n` +
    `- Proyectos que entran respecto del Top-${result.design.fixed_plan_size} inicial: ${entered.length}: ${entered.join(', ') || 'ninguno'}.\n` +
    `- Proyectos inicialmente Top-${result.design.fixed_plan_size} desplazados: ${displaced.length}: ${displaced.join(', ') || 'ninguno'}.\n` +
    `- Efectos dirigidos observados entre transiciones: ${e2.transition_summary.directed_transition_effects}; positivos=${e2.transition_summary.positive}; negativos=${e2.transition_summary.negative}.\n` +
    `- Magnitud media absoluta del efecto de una intervención sobre proyectos restantes: ${e2.transition_summary.mean_abs?.toFixed(6) ?? '—'}.\n` +
    (strongestPos ? `- Señal positiva más intensa: ${strongestPos.source_id} → ${strongestPos.target_id}, Δscore=${strongestPos.delta_score.toFixed(6)}.\n` : '') +
    (strongestNeg ? `- Señal negativa más intensa: ${strongestNeg.source_id} → ${strongestNeg.target_id}, Δscore=${strongestNeg.delta_score.toFixed(6)}.\n` : '') +
    `\n## Lectura metodológica\n\n` +
    `El experimento 1 aísla el efecto del orden: mismo conjunto final y, por construcción, misma red al completar los ${result.design.fixed_plan_size} proyectos; cualquier diferencia acumulada antes del horizonte proviene de la trayectoria. El experimento 2 agrega adaptación de cartera y permite observar proyectos que ganan o pierden prioridad a medida que cambia la red. Los efectos negativos se interpretan como señales de sustitución o pérdida de necesidad relativa, no como prueba automática de que un proyecto deba eliminarse. Los positivos se interpretan como señales de complementariedad o habilitación.\n`;

  await fs.writeFile(path.join(outDir, 'README.md'), readme, 'utf8');

  console.log('PLAN_TRAJECTORY_SUMMARY', JSON.stringify({
    design: result.design,
    order_only: {
      same_final_project_set: e1.same_final_project_set,
      same_final_component_count: e1.same_final_component_count,
      summaries: e1.summaries,
      score_delta: scoreDelta,
      discounted_delta: discountedDelta,
      integrated_component_reduction_delta: componentAreaDelta,
    },
    adaptive_open: {
      entering: entered,
      displaced,
      summary: e2.summary,
      transition_summary: e2.transition_summary,
      strongest_positive: strongestPos,
      strongest_negative: strongestNeg,
    }
  }));
} finally {
  await browser.close();
}
