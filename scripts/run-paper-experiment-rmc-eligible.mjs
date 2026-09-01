import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.EVA_EXPERIMENT_BASE_URL || 'http://127.0.0.1:8080/experiments/runner-rmc-eligible.html';
const outDir = path.resolve('results/paper-experiments-rmc-eligible');
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

function topIds(rows, k) {
  return (rows || []).slice(0, k).map(r => r.id);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(60 * 60 * 1000);
page.on('console', msg => {
  const txt = msg.text();
  if (txt.startsWith('[paper-rmc]') || msg.type() === 'error') console.log(txt);
});
page.on('pageerror', err => console.error('[pageerror]', err));

try {
  console.log(`Opening ${baseUrl}`);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__EVA_EXPERIMENT_READY || window.__EVA_EXPERIMENT_ERROR, null, { timeout: 180000 });
  const bootError = await page.evaluate(() => window.__EVA_EXPERIMENT_ERROR || null);
  if (bootError) throw new Error(bootError);

  const result = await page.evaluate(async () => {
    return await window.EVA_PAPER_EXPERIMENTS.runRmcEligible({
      mainSteps: 30,
      orderEffectTopN: 20,
      orderEffectDelta: 1,
      rootCount: 6,
      rootSteps: 10,
      tauAlphaSteps: 10,
      weightSteps: 10,
      factorialSteps: 30,
    });
  });

  await fs.writeFile(path.join(outDir, 'summary.json'), JSON.stringify(result, null, 2), 'utf8');
  await fs.writeFile(path.join(outDir, 'normalization_reference.json'), JSON.stringify(result.normalization_reference || {}, null, 2), 'utf8');

  await writeCsv('primary_static.csv', result.primary.static);
  await writeCsv('primary_sequential.csv', result.primary.sequential);
  await writeCsv('primary_metrics.csv', result.primary.comparison);
  await writeCsv('normalization_metrics.csv', result.normalization_sensitivity.comparison);
  await writeCsv('order_effect_projects.csv', result.order_effect.projects);
  await writeCsv('order_effect_pairs.csv', result.order_effect.pairs);
  await writeCsv('order_effect_coupling.csv', [result.order_effect.coupling]);
  await writeCsv('root_sensitivity_pairwise.csv', result.root_sensitivity.pairwise_vs_default);
  await writeCsv('root_robust_top10.csv', result.root_sensitivity.robust_top10);
  await writeCsv('tau_alpha_robust_top10.csv', result.tau_alpha_sensitivity.robust_top10);
  await writeCsv('weight_sensitivity_pairwise_vs_rmc.csv', result.weight_sensitivity.pairwise_vs_rmc);
  await writeCsv('weight_robust_top10.csv', result.weight_sensitivity.robust_top10);
  await writeCsv('factorial_2x2_comparisons.csv', result.factorial_2x2.comparisons);

  const rootRows = [];
  for (const run of result.root_sensitivity.runs) for (const row of run.order) rootRows.push({ root: run.root.name, ...row });
  await writeCsv('root_sensitivity.csv', rootRows);

  const taRows = [];
  for (const run of result.tau_alpha_sensitivity.runs) for (const row of run.order) taRows.push({ tau: run.tau, alpha: run.alpha, ...row });
  await writeCsv('tau_alpha_sensitivity.csv', taRows);

  const weightRows = [];
  for (const run of result.weight_sensitivity.runs) for (const row of run.order) weightRows.push({ scenario_key: run.key, scenario_name: run.nombre, ...row });
  await writeCsv('weight_sensitivity.csv', weightRows);

  const factorialRows = [];
  for (const [cell, rows] of Object.entries(result.factorial_2x2.cells)) {
    for (const row of rows) factorialRows.push({ cell, ...row });
  }
  await writeCsv('factorial_2x2_sequences.csv', factorialRows);

  const metric = k => (result.primary.comparison || []).find(x => x.k === k) || {};
  const m10 = metric(10), m20 = metric(20), m30 = metric(30);
  const coupling = result.order_effect.coupling || {};
  const maxPair = (result.order_effect.pairs || [])[0] || null;
  const balanceVsRmc = (result.weight_sensitivity.pairwise_vs_rmc || []).find(x => x.key === 'balanceado') || {};
  const rootJ = (result.root_sensitivity.pairwise_vs_default || []).map(x => x.jaccard_top10);
  const rootMin = rootJ.length ? Math.min(...rootJ) : null;
  const factorialTotal = (result.factorial_2x2.comparisons || []).filter(x => x.label === 'cambio_total_diseno');

  const readme = `# Experimento correctivo EDTR — RMC + universo priorizable C/I\n\n` +
    `Generado: ${result.generated_at}\n\n` +
    `## Diseño\n\n` +
    `- Escenario principal: Ponderación RMC.\n` +
    `- Elegibles: Comunal + Intercomunal.\n` +
    `- Excluidos del ranking y de la referencia de normalización: Metropolitano (MET).\n` +
    `- Proyectos totales: ${result.counts.projects_total}; elegibles: ${result.counts.projects_eligible}; excluidos: ${result.counts.projects_excluded}.\n\n` +
    `## Dependencia de estado\n\n` +
    `- k=10: Jaccard=${m10.jaccard_top_k?.toFixed(3) ?? '—'}, Spearman=${m10.spearman_rank?.toFixed(3) ?? '—'}, Kendall=${m10.kendall_tau?.toFixed(3) ?? '—'}, desplazamiento medio=${m10.desplazamiento_medio?.toFixed(2) ?? '—'}.\n` +
    `- k=20: Jaccard=${m20.jaccard_top_k?.toFixed(3) ?? '—'}, Spearman=${m20.spearman_rank?.toFixed(3) ?? '—'}, Kendall=${m20.kendall_tau?.toFixed(3) ?? '—'}, desplazamiento medio=${m20.desplazamiento_medio?.toFixed(2) ?? '—'}.\n` +
    `- k=30: Jaccard=${m30.jaccard_top_k?.toFixed(3) ?? '—'}, Spearman=${m30.spearman_rank?.toFixed(3) ?? '—'}, Kendall=${m30.kendall_tau?.toFixed(3) ?? '—'}, desplazamiento medio=${m30.desplazamiento_medio?.toFixed(2) ?? '—'}.\n\n` +
    `## Interacciones\n\n` +
    `K medio absoluto=${coupling.K_mean_abs_interaction?.toFixed(6) ?? '—'}; Q(0.01)=${coupling.Q_eps_0_01?.toFixed(3) ?? '—'}; positivas=${coupling.positive_interactions ?? 0}; negativas=${coupling.negative_interactions ?? 0}.\n` +
    (maxPair ? `Mayor |Δ_ord|=${maxPair.abs_delta_order.toFixed(6)}: ${maxPair.p_id} ↔ ${maxPair.q_id}.\n\n` : '\n') +
    `## Sensibilidad\n\n` +
    `- Balanceado vs RMC, Top-10 C/I: Jaccard=${balanceVsRmc.jaccard_top10?.toFixed(3) ?? '—'}.\n` +
    `- Mínimo Jaccard Top-10 entre raíces vs raíz por defecto: ${rootMin == null ? '—' : rootMin.toFixed(3)}.\n` +
    `- Núcleo robusto Top-10 (frecuencia >=0,8): raíces=${result.robust_core.roots_top10_ge_08.length}, tau×alpha=${result.robust_core.tau_alpha_top10_ge_08.length}, escenarios W=${result.robust_core.policy_top10_ge_08.length}.\n\n` +
    `## Diseño factorial 2x2\n\n` +
    factorialTotal.map(x => `- Cambio total Balanceado+todos → RMC+C/I, k=${x.k}: Jaccard=${x.jaccard_top_k.toFixed(3)}, Spearman=${x.spearman_rank.toFixed(3)}, desplazamiento medio=${x.desplazamiento_medio.toFixed(2)}.`).join('\n') + '\n';
  await fs.writeFile(path.join(outDir, 'README.md'), readme, 'utf8');

  console.log('RMC_ELIGIBLE_SUMMARY', JSON.stringify({
    versions: result.versions,
    counts: result.counts,
    primary_metrics: result.primary.comparison,
    normalization_metrics: result.normalization_sensitivity.comparison,
    order_effect: {
      coupling,
      max_pair: maxPair && {
        p_id: maxPair.p_id,
        q_id: maxPair.q_id,
        abs_delta_order: maxPair.abs_delta_order,
        interaction_p_on_q: maxPair.interaction_p_on_q,
        interaction_q_on_p: maxPair.interaction_q_on_p,
      },
    },
    top10_static: topIds(result.primary.static, 10),
    top10_sequential: topIds(result.primary.sequential, 10),
    roots_pairwise: result.root_sensitivity.pairwise_vs_default,
    policy_pairwise_vs_rmc: result.weight_sensitivity.pairwise_vs_rmc,
    robust_core: result.robust_core,
    factorial_comparisons: result.factorial_2x2.comparisons,
  }));
} finally {
  await browser.close();
}
