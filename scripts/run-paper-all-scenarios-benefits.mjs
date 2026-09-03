import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.EVA_EXPERIMENT_BASE_URL || 'http://127.0.0.1:8080/experiments/runner-all-scenarios-benefits.html';
const outDir = path.resolve('results/paper-all-scenarios-benefits');
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
page.setDefaultTimeout(180 * 60 * 1000);
page.on('console', msg => {
  const t = msg.text();
  if (t.startsWith('[paper-all-W]') || msg.type() === 'error') console.log(t);
});
page.on('pageerror', err => console.error('[pageerror]', err));

try {
  console.log(`Opening ${baseUrl}`);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__EVA_EXPERIMENT_READY || window.__EVA_EXPERIMENT_ERROR, null, { timeout: 180000 });
  const bootError = await page.evaluate(() => window.__EVA_EXPERIMENT_ERROR || null);
  if (bootError) throw new Error(bootError);

  const result = await page.evaluate(async () => window.EVA_PAPER_EXPERIMENTS.runAllScenarioBenefits());

  await fs.writeFile(path.join(outDir, 'summary.json'), JSON.stringify(result, null, 2), 'utf8');
  await fs.writeFile(path.join(outDir, 'normalization_reference.json'), JSON.stringify(result.normalization_reference, null, 2), 'utf8');
  await writeCsv('scenario_benefit_summary.csv', result.summaries);
  await writeCsv('project_rank_matrix_12_scenarios.csv', result.rank_matrix);
  await writeCsv('pareto_population_connection.csv', result.pareto_population_demand);

  for (const run of result.runs || []) {
    await writeCsv(`${run.key}_initial_ranking.csv`, run.initial_ranking);
    await writeCsv(`${run.key}_full_sequence.csv`, run.rows);
    await fs.writeFile(path.join(outDir, `${run.key}_weights.json`), JSON.stringify(run.weights, null, 2), 'utf8');
  }

  const readme = `# EVA · 12 escenarios · posiciones, beneficios y saturación\n\n` +
    `Generado: ${result.generated_at}\n\n` +
    `- Universo modelado: ${result.design.modeled_projects}.\n` +
    `- Conjunto factible: ${result.design.eligible_projects} proyectos Comunales + Intercomunales.\n` +
    `- Escenarios predefinidos ejecutados: ${result.design.scenarios.length}.\n` +
    `- Normalización: fija en G0 sobre el mismo conjunto elegible.\n` +
    `- Beneficios comunes observados: población marginal, demanda OD habilitada y reducción de componentes.\n\n` +
    `## Interpretación\n\n` +
    `Como todos los escenarios ejecutan la misma cartera completa, el estado final converge. La comparación relevante es el orden y la captura temprana de beneficios. Los hitos 50/75/90/95/99% permiten identificar rendimientos decrecientes y saturación práctica sin afirmar que un proyecto tardío carezca de otros beneficios.\n\n` +
    `Archivos principales: scenario_benefit_summary.csv, project_rank_matrix_12_scenarios.csv, pareto_population_connection.csv y un *_full_sequence.csv por escenario.\n`;
  await fs.writeFile(path.join(outDir, 'README.md'), readme, 'utf8');

  console.log('ALL_SCENARIOS_BENEFITS_SUMMARY', JSON.stringify({
    design: result.design,
    summaries: result.summaries,
    pareto_population_demand: result.pareto_population_demand
  }));
} finally {
  await browser.close();
}
