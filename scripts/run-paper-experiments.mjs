import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.EVA_EXPERIMENT_BASE_URL || 'http://127.0.0.1:8080/experiments/runner.html';
const outDir = path.resolve('results/paper-experiments');
await fs.mkdir(outDir, { recursive: true });

function csvEscape(value) {
  if (value == null) return '';
  const s = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

async function writeCsv(file, rows) {
  if (!rows.length) {
    await fs.writeFile(path.join(outDir, file), '', 'utf8');
    return;
  }
  const keys = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach(k => set.add(k));
    return set;
  }, new Set()));
  const text = [keys.join(','), ...rows.map(r => keys.map(k => csvEscape(r[k])).join(','))].join('\n') + '\n';
  await fs.writeFile(path.join(outDir, file), text, 'utf8');
}

async function exportRankSequence(prefix, block) {
  const staticMap = new Map((block.static || []).map(r => [r.id, r]));
  const seqMap = new Map((block.sequential || []).map(r => [r.id, r]));
  const ids = Array.from(new Set([...staticMap.keys(), ...seqMap.keys()]));
  await writeCsv(`${prefix}.csv`, ids.map(id => {
    const s = staticMap.get(id) || {};
    const q = seqMap.get(id) || {};
    return {
      id,
      nombre: s.nombre || q.nombre || '',
      static_rank: s.rank,
      static_score: s.score,
      sequential_step: q.step,
      sequential_score: q.score,
      rank_delta_static_minus_sequential: q.step != null && s.rank != null ? s.rank - q.step : '',
      poblacion_marginal_step: q.poblacion_marginal,
      demanda_habilitada_step: q.demanda_habilitada,
      ciclistas_inducidos_step: q.ciclistas_inducidos,
      componentes_red_step: q.componentes_red,
      costo_mclp_step: q.costo_mclp,
      grado_dendritico_step: q.grado_dendritico,
    };
  }));
  await writeCsv(`${prefix}_metrics.csv`, block.comparison || []);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(60 * 60 * 1000);
page.on('console', msg => {
  const txt = msg.text();
  if (txt.startsWith('[paper]') || msg.type() === 'error') console.log(txt);
});
page.on('pageerror', err => console.error('[pageerror]', err));

try {
  console.log(`Opening ${baseUrl}`);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__EVA_EXPERIMENT_READY || window.__EVA_EXPERIMENT_ERROR, null, { timeout: 180000 });
  const bootError = await page.evaluate(() => window.__EVA_EXPERIMENT_ERROR || null);
  if (bootError) throw new Error(bootError);

  const result = await page.evaluate(async () => {
    return await window.EVA_PAPER_EXPERIMENTS.runAll({
      mainSteps: 30,
      orderEffectTopN: 20,
      orderEffectDelta: 1,
      rootCount: 6,
      rootSteps: 10,
      tauAlphaSteps: 10,
      baselineSteps: 20,
      weightSteps: 10,
    });
  });

  await fs.writeFile(path.join(outDir, 'summary.json'), JSON.stringify(result, null, 2), 'utf8');

  // Primary scientific contrast: fixed G0 normalization.
  await exportRankSequence('static_vs_sequential_fixed', result.static_vs_sequential);
  // Backwards-compatible aliases for analysis scripts.
  await exportRankSequence('static_vs_sequential', result.static_vs_sequential);

  // Operational EVA contrast, where maxima are recomputed over active projects.
  await exportRankSequence('static_vs_sequential_operational', result.operational_static_vs_sequential || { static: [], sequential: [], comparison: [] });
  await writeCsv('fixed_vs_operational_sequence_metrics.csv', (result.normalization_sensitivity && result.normalization_sensitivity.fixed_vs_operational_sequence) || []);
  await fs.writeFile(path.join(outDir, 'normalization_reference.json'), JSON.stringify(result.normalization_reference || {}, null, 2), 'utf8');

  await writeCsv('order_effect_pairs_fixed.csv', (result.order_effect && result.order_effect.pairs) || []);
  await writeCsv('order_effect_projects_fixed.csv', (result.order_effect && result.order_effect.projects) || []);
  await writeCsv('order_effect_coupling_fixed.csv', result.order_effect && result.order_effect.coupling ? [result.order_effect.coupling] : []);
  // Backwards-compatible aliases.
  await writeCsv('order_effect_pairs.csv', (result.order_effect && result.order_effect.pairs) || []);
  await writeCsv('order_effect_projects.csv', (result.order_effect && result.order_effect.projects) || []);

  const rootRows = [];
  for (const run of result.root_sensitivity.runs) {
    for (const row of run.order) rootRows.push({ root: run.root.name, root_km: run.root.km, ...row });
  }
  await writeCsv('root_sensitivity.csv', rootRows);
  await writeCsv('root_sensitivity_pairwise.csv', result.root_sensitivity.pairwise_vs_default);
  await writeCsv('root_robust_top10.csv', result.root_sensitivity.robust_top10);

  const taRows = [];
  for (const run of result.tau_alpha_sensitivity.runs) {
    for (const row of run.order) taRows.push({ tau_m: run.tau, alpha: run.alpha, ...row });
  }
  await writeCsv('tau_alpha_sensitivity.csv', taRows);
  await writeCsv('tau_alpha_robust_top10.csv', result.tau_alpha_sensitivity.robust_top10);

  const baselineRows = [];
  for (const run of result.baselines) {
    for (const row of run.order) baselineRows.push({ baseline: run.criterion, normalization: run.normalization, ...row });
  }
  await writeCsv('baselines.csv', baselineRows);

  const weightRows = [];
  for (const run of (result.weight_sensitivity && result.weight_sensitivity.runs) || []) {
    for (const row of run.order) weightRows.push({ scenario_key: run.key, scenario_name: run.nombre, ...row });
  }
  await writeCsv('weight_sensitivity.csv', weightRows);
  await writeCsv('weight_sensitivity_pairwise.csv', (result.weight_sensitivity && result.weight_sensitivity.pairwise_vs_balanceado) || []);
  await writeCsv('weight_robust_top10.csv', (result.weight_sensitivity && result.weight_sensitivity.robust_top10) || []);

  const primary = result.static_vs_sequential.comparison || [];
  const operational = (result.operational_static_vs_sequential && result.operational_static_vs_sequential.comparison) || [];
  const k20 = primary.find(x => x.k === 20) || primary.at(-1) || {};
  const op20 = operational.find(x => x.k === 20) || operational.at(-1) || {};
  const norm20 = ((result.normalization_sensitivity && result.normalization_sensitivity.fixed_vs_operational_sequence) || []).find(x => x.k === 20) || {};
  const rootRobust = result.robust_core.roots_top10 || [];
  const taRobust = result.robust_core.tau_alpha_top10 || [];
  const policyRobust = result.robust_core.policy_scenarios_top10 || [];
  const orderPairs = (result.order_effect && result.order_effect.pairs) || [];
  const maxOrder = orderPairs.length ? orderPairs.reduce((a, b) => b.abs_delta_order > a.abs_delta_order ? b : a, orderPairs[0]) : null;
  const coupling = (result.order_effect && result.order_effect.coupling) || {};

  const readme = `# Resultados reproducibles para el paper\n\n` +
    `Generado: ${result.generated_at}\n\n` +
    `- Motor: ${result.versions.ENGINE_VERSION}\n` +
    `- Metodología: ${result.versions.METHODOLOGY_VERSION}\n` +
    `- Datos: ${result.versions.DATA_VERSION}\n` +
    `- Proyectos: ${result.counts.projects}\n` +
    `- Red existente: ${result.counts.existing} ejes\n` +
    `- Hexágonos OD: ${result.counts.od_hex}\n\n` +
    `## Contraste principal: estado con normalización fija en G0\n\n` +
    `Para k=${k20.k ?? '—'}: Jaccard Top-k=${k20.jaccard_top_k == null ? '—' : k20.jaccard_top_k.toFixed(3)}, Spearman=${k20.spearman_rank == null ? '—' : k20.spearman_rank.toFixed(3)}, Kendall tau=${k20.kendall_tau == null ? '—' : k20.kendall_tau.toFixed(3)}, desplazamiento medio=${k20.desplazamiento_medio == null ? '—' : k20.desplazamiento_medio.toFixed(2)}.\n\n` +
    `## Contraste operacional\n\n` +
    `Para k=${op20.k ?? '—'}: Jaccard Top-k=${op20.jaccard_top_k == null ? '—' : op20.jaccard_top_k.toFixed(3)}. La diferencia entre la secuencia fija y la operacional tiene Jaccard Top-k=${norm20.jaccard_top_k == null ? '—' : norm20.jaccard_top_k.toFixed(3)} para k=${norm20.k ?? '—'}.\n\n` +
    `## Efecto de orden con escalas G0\n\n` +
    (maxOrder ? `Mayor |Δ_ord| dentro del subconjunto evaluado: ${maxOrder.abs_delta_order.toFixed(6)} para ${maxOrder.p_id} ↔ ${maxOrder.q_id}.\n` : `Sin pares calculados.\n`) +
    `Interacción media absoluta C=${coupling.C_mean_abs_interaction == null ? '—' : coupling.C_mean_abs_interaction.toFixed(6)} sobre ${coupling.directed_interactions ?? 0} interacciones dirigidas.\n\n` +
    `## Robustez Top-10\n\n` +
    `- Frecuencia >=0,8 al variar raíces bajo escenario dendrítico multicriterio: ${rootRobust.length} proyectos.\n` +
    `- Frecuencia >=0,8 al variar tau y alpha bajo escenario dendrítico multicriterio: ${taRobust.length} proyectos.\n` +
    `- Frecuencia >=0,8 entre escenarios de política pública W: ${policyRobust.length} proyectos.\n\n` +
    `La prueba principal fija las escalas de normalización en G0. Esta decisión evita atribuir al estado de la red cambios que sólo provienen de retirar del conjunto activo el proyecto que define el máximo de un criterio. La sensibilidad de alpha se evalúa dentro de un score multicriterio, ya que en un ranking puramente dendrítico alpha es una transformación monótona de la distancia topológica. Estos resultados describen la aplicación EVA; no constituyen validación empírica del marco en otros modos de transporte.\n`;
  await fs.writeFile(path.join(outDir, 'README.md'), readme, 'utf8');

  console.log('PAPER_EXPERIMENT_SUMMARY', JSON.stringify({
    versions: result.versions,
    counts: result.counts,
    fixed_comparison: primary,
    operational_comparison: operational,
    fixed_vs_operational: (result.normalization_sensitivity && result.normalization_sensitivity.fixed_vs_operational_sequence) || [],
    order_effect: {
      top_n: result.order_effect && result.order_effect.top_n,
      coupling,
      max_abs_delta_order: maxOrder && maxOrder.abs_delta_order,
      max_pair: maxOrder && [maxOrder.p_id, maxOrder.q_id],
    },
    selected_roots: result.root_sensitivity.roots.map(r => r.name),
    robust_roots_top10: rootRobust,
    robust_tau_alpha_top10: taRobust,
    robust_policy_scenarios_top10: policyRobust,
    weight_pairwise_vs_balanceado: (result.weight_sensitivity && result.weight_sensitivity.pairwise_vs_balanceado) || [],
  }));
} finally {
  await browser.close();
}
