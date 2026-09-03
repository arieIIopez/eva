import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.EVA_EXPERIMENT_BASE_URL || 'http://127.0.0.1:8080/experiments/runner-od-first-only.html';
const outDir = path.resolve('results/paper-od-first-only');
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
  if (t.startsWith('[paper-od-fast]') || msg.type() === 'error') console.log(t);
});
page.on('pageerror', err => console.error('[pageerror]', err));

try {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__EVA_EXPERIMENT_READY || window.__EVA_EXPERIMENT_ERROR, null, { timeout: 180000 });
  const err = await page.evaluate(() => window.__EVA_EXPERIMENT_ERROR || null);
  if (err) throw new Error(err);

  const result = await page.evaluate(async () => window.EVA_PAPER_EXPERIMENTS.runODFirstOnly({ epsilon: 0, fullDemandReference: 871511 }));
  await fs.writeFile(path.join(outDir, 'summary.json'), JSON.stringify(result, null, 2), 'utf8');
  await csv('od_first_sequence.csv', result.rows);
  await csv('remaining_projects.csv', result.remaining_project_ids.map(id => ({ id })));
  await csv('od_first_summary.csv', [result.summary]);

  const readme = `# EVA · OD-first · suficiencia funcional\n\n` +
    `Generado: ${result.generated_at}\n\n` +
    `La política OD-first selecciona en cada estado la alternativa con mayor ΔD_t, donde ΔD_t es el número de viajes OD que no eran viables en G_t y pasan a serlo después de incorporar el proyecto. Si todas las alternativas tienen ΔD_t=0, se prueba exhaustivamente una habilitación de un paso. Si ninguna alternativa cero habilita una ganancia positiva en el estado siguiente, la secuencia se detiene.\n\n` +
    `La referencia de demanda final es 871.511 viajes/día, observada en las corridas completas RMC y Balanceado. El experimento es voraz y no garantiza óptimo global; su punto de detención es condicional a habilitación OD y a una profundidad de un paso.\n`;
  await fs.writeFile(path.join(outDir, 'README.md'), readme, 'utf8');

  console.log('OD_FIRST_ONLY_SUMMARY', JSON.stringify(result.summary));
} finally {
  await browser.close();
}
