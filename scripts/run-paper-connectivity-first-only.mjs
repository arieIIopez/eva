import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.EVA_EXPERIMENT_BASE_URL || 'http://127.0.0.1:8080/experiments/runner-connectivity-first-only.html';
const outDir = path.resolve('results/paper-connectivity-first-only');
await fs.mkdir(outDir, { recursive: true });

function esc(v) {
  if (v == null) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}
async function csv(name, rows) {
  const safe = rows || [];
  if (!safe.length) return fs.writeFile(path.join(outDir, name), '', 'utf8');
  const keys = [...safe.reduce((set, row) => { Object.keys(row).forEach(k => set.add(k)); return set; }, new Set())];
  const text = [keys.join(','), ...safe.map(r => keys.map(k => esc(r[k])).join(','))].join('\n') + '\n';
  await fs.writeFile(path.join(outDir, name), text, 'utf8');
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(120 * 60 * 1000);
page.on('console', msg => {
  const t = msg.text();
  if (t.startsWith('[paper-connectivity-first]') || msg.type() === 'error') console.log(t);
});
page.on('pageerror', err => console.error('[pageerror]', err));

try {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__EVA_EXPERIMENT_READY || window.__EVA_EXPERIMENT_ERROR, null, { timeout: 180000 });
  const err = await page.evaluate(() => window.__EVA_EXPERIMENT_ERROR || null);
  if (err) throw new Error(err);

  const result = await page.evaluate(async () => window.EVA_PAPER_EXPERIMENTS.runConnectivityFirstOnly({ epsilon: 0, fullReductionReference: 36 }));
  await fs.writeFile(path.join(outDir, 'summary.json'), JSON.stringify(result, null, 2), 'utf8');
  await csv('connectivity_first_sequence.csv', result.rows);
  await csv('remaining_projects.csv', result.remaining_project_ids.map(id => ({ id })));
  await csv('connectivity_first_summary.csv', [result.summary]);

  const readme = `# EVA · Connectivity-first · suficiencia topológica\n\n` +
    `Generado: ${result.generated_at}\n\n` +
    `La política Connectivity-first selecciona en cada estado la alternativa con mayor reducción inmediata del número de componentes de la red. Cuando ninguna alternativa reduce componentes, se prueba exhaustivamente si una intervención sin ganancia inmediata permite que un segundo proyecto produzca una reducción neta positiva respecto del estado original. Si no existe reducción directa ni habilitación neta a dos proyectos, la secuencia se detiene.\n\n` +
    `La referencia de reducción total es 36 componentes (141→105), observada al ejecutar la cartera completa. El experimento es voraz y no garantiza óptimo global; la suficiencia es condicional a conectividad topológica y a una habilitación de un paso.\n`;
  await fs.writeFile(path.join(outDir, 'README.md'), readme, 'utf8');

  console.log('CONNECTIVITY_FIRST_ONLY_SUMMARY', JSON.stringify(result.summary));
} finally {
  await browser.close();
}