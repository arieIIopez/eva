import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.EVA_EXPERIMENT_BASE_URL || 'http://127.0.0.1:8080/experiments/runner-full-portfolio-scenarios.html';
const outDir = path.resolve('results/paper-full-portfolio-scenarios');
await fs.mkdir(outDir, { recursive: true });

function csvEscape(value) {
  if (value == null) return '';
  const s = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}
async function writeCsv(file, rows) {
  const safe = rows || [];
  if (!safe.length) return fs.writeFile(path.join(outDir, file), '', 'utf8');
  const keys = Array.from(safe.reduce((set, row) => { Object.keys(row).forEach(k => set.add(k)); return set; }, new Set()));
  const text = [keys.join(','), ...safe.map(r => keys.map(k => csvEscape(r[k])).join(','))].join('\n') + '\n';
  await fs.writeFile(path.join(outDir, file), text, 'utf8');
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(90 * 60 * 1000);
page.on('console', msg => { const t = msg.text(); if (t.startsWith('[paper-full-W]') || msg.type() === 'error') console.log(t); });
page.on('pageerror', err => console.error('[pageerror]', err));

try {
  console.log(`Opening ${baseUrl}`);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__EVA_EXPERIMENT_READY || window.__EVA_EXPERIMENT_ERROR, null, { timeout: 180000 });
  const bootError = await page.evaluate(() => window.__EVA_EXPERIMENT_ERROR || null);
  if (bootError) throw new Error(bootError);

  const result = await page.evaluate(async () => window.EVA_PAPER_EXPERIMENTS.runFullPortfolioScenarios({
    discount: 0.95,
    ks: [10,20,30,50,75,100,124],
    budgetFractions: [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1]
  }));

  await fs.writeFile(path.join(outDir, 'summary.json'), JSON.stringify(result, null, 2), 'utf8');
  await fs.writeFile(path.join(outDir, 'normalization_reference.json'), JSON.stringify(result.normalization_reference, null, 2), 'utf8');
  await writeCsv('scenario_summaries.csv', result.summaries);
  await writeCsv('static_vs_sequential.csv', result.static_vs_sequential);
  await writeCsv('pairwise_scenario_order_comparison.csv', result.pairwise_scenario_order_comparison);
  await writeCsv('budget_checkpoints.csv', result.budget_checkpoints);
  await writeCsv('robust_core.csv', result.robust_core);
  await writeCsv('cross_evaluation_matrix.csv', result.cross_evaluation_matrix);

  for (const run of result.runs || []) {
    await writeCsv(`${run.key}_initial_ranking.csv`, run.initial_ranking);
    await writeCsv(`${run.key}_full_sequence.csv`, run.rows);
    await fs.writeFile(path.join(outDir, `${run.key}_weights.json`), JSON.stringify(run.weights, null, 2), 'utf8');
  }

  const readme = `# EVA · cartera completa C/I · RMC vs Balanceado vs Logit\n\n` +
    `Generado: ${result.generated_at}\n\n` +
    `- Universo modelado: ${result.design.modeled_projects}.\n` +
    `- Conjunto factible: ${result.design.eligible_projects} proyectos Comunales + Intercomunales.\n` +
    `- Cada escenario ejecuta los ${result.design.eligible_projects} proyectos completos.\n` +
    `- Escenarios: RMC, Balanceado y Logit (escenario EVA ciclistas_biogeme; logit binario estimado con Biogeme).\n` +
    `- Normalización: fija en G0 sobre el mismo conjunto elegible.\n` +
    `- Invariantes: mismo conjunto final=${result.invariants.every_run_contains_all_eligible_projects}; mismo costo final=${result.invariants.same_final_cost}; mismos componentes finales=${result.invariants.same_final_components}.\n\n` +
    `## Regla de comparación\n\n` +
    `Los puntajes propios de RMC, Balanceado y Logit no se comparan directamente como una escala normativa común. Se comparan órdenes, métricas estructurales/físicas y una matriz de evaluación cruzada: cada trayectoria es evaluada bajo cada uno de los tres vectores W.\n\n` +
    `Archivos principales: scenario_summaries.csv, static_vs_sequential.csv, pairwise_scenario_order_comparison.csv, budget_checkpoints.csv, robust_core.csv y cross_evaluation_matrix.csv.\n`;
  await fs.writeFile(path.join(outDir, 'README.md'), readme, 'utf8');

  console.log('FULL_PORTFOLIO_SCENARIOS_SUMMARY', JSON.stringify({
    design: result.design,
    invariants: result.invariants,
    summaries: result.summaries,
    static_vs_sequential: result.static_vs_sequential,
    pairwise: result.pairwise_scenario_order_comparison,
    cross_evaluation_matrix: result.cross_evaluation_matrix
  }));
} finally {
  await browser.close();
}
