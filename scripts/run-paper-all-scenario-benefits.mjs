import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.EVA_EXPERIMENT_BASE_URL || 'http://127.0.0.1:8080/experiments/runner-all-scenario-benefits.html';
const outDir = path.resolve('results/paper-all-scenario-benefits');
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
page.setDefaultTimeout(120 * 60 * 1000);
page.on('console', msg => { const t = msg.text(); if (t.startsWith('[all-W-benefits]') || msg.type() === 'error') console.log(t); });
page.on('pageerror', err => console.error('[pageerror]', err));

try {
  console.log(`Opening ${baseUrl}`);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__EVA_EXPERIMENT_READY || window.__EVA_EXPERIMENT_ERROR, null, { timeout: 180000 });
  const bootError = await page.evaluate(() => window.__EVA_EXPERIMENT_ERROR || null);
  if (bootError) throw new Error(bootError);

  const result = await page.evaluate(async () => window.EVA_PAPER_EXPERIMENTS.runAllScenarioBenefits({}));

  await fs.writeFile(path.join(outDir, 'summary.json'), JSON.stringify(result, null, 2), 'utf8');
  await fs.writeFile(path.join(outDir, 'normalization_reference.json'), JSON.stringify(result.normalization_reference, null, 2), 'utf8');
  await writeCsv('scenario_summaries.csv', result.summaries);
  await writeCsv('project_rank_matrix.csv', result.ranking_matrix);
  await writeCsv('pairwise_rank_comparison.csv', result.pairwise_rank_comparison);
  await writeCsv('observed_benefit_envelope.csv', result.observed_benefit_envelope);

  for (const run of result.runs || []) {
    await writeCsv(`${run.key}_initial_ranking.csv`, run.initial_ranking);
    await writeCsv(`${run.key}_sequence_benefits.csv`, run.rows);
    await fs.writeFile(path.join(outDir, `${run.key}_weights.json`), JSON.stringify(run.weights, null, 2), 'utf8');
  }

  const scenarios = (result.design.scenarios || []).map(s => `- ${s.label} (${s.key})`).join('\n');
  const readme = `# EVA · posiciones y curvas de beneficio en todos los escenarios preestablecidos\n\n` +
    `Generado: ${result.generated_at}\n\n` +
    `- Universo modelado: ${result.design.modeled_projects}.\n` +
    `- Conjunto factible: ${result.design.eligible_projects} proyectos Comunales + Intercomunales.\n` +
    `- Escenarios evaluados: ${result.design.scenario_count}.\n` +
    `- Normalización: fija en G0 sobre el mismo conjunto elegible.\n\n` +
    `## Escenarios\n${scenarios}\n\n` +
    `## Beneficios comparados\n` +
    `1. Población marginal: población que gana acceso en cada estado.\n` +
    `2. Conexión funcional: viajes OD nuevos viables (demandaHabilitada).\n` +
    `3. Conexión estructural: reducción del número de componentes de la red.\n\n` +
    `project_rank_matrix.csv contiene la posición secuencial y el ranking G0 de cada proyecto en cada escenario, junto con rango, media, desviación y frecuencia Top-10/20/30.\n\n` +
    `scenario_summaries.csv contiene áreas bajo las curvas e índices de captura temprana, además del último paso con ganancia observada de población, demanda o conectividad estructural.\n\n` +
    `Advertencia: el último paso con ganancia observada es descriptivo de cada trayectoria y no prueba optimalidad global ni inexistencia de secuencias habilitantes alternativas.\n`;
  await fs.writeFile(path.join(outDir, 'README.md'), readme, 'utf8');

  console.log('ALL_SCENARIO_BENEFITS_SUMMARY', JSON.stringify({
    design: result.design,
    summaries: result.summaries,
    top_robust_projects: (result.ranking_matrix || []).slice(0, 20)
  }));
} finally {
  await browser.close();
}
