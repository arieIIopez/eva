import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.EVA_EXPERIMENT_BASE_URL || 'http://127.0.0.1:8080/experiments/runner-lookahead-depth2.html';
const outDir = path.resolve('results/paper-lookahead-depth2');
const baselineSourcePath = path.resolve('results/paper-full-portfolio-scenarios/summary.json');
await fs.mkdir(outDir, { recursive: true });

function esc(v) {
  if (v == null) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}
async function csv(name, rows) {
  rows = rows || [];
  if (!rows.length) return fs.writeFile(path.join(outDir, name), '', 'utf8');
  const keys = [...rows.reduce((s, r) => (Object.keys(r).forEach(k => s.add(k)), s), new Set())];
  await fs.writeFile(path.join(outDir, name), [keys.join(','), ...rows.map(r => keys.map(k => esc(r[k])).join(','))].join('\n') + '\n', 'utf8');
}
function compare(seqA, seqB, key) {
  if (seqA.length !== seqB.length) throw new Error(`Baseline/depth2 length mismatch for ${key}: ${seqA.length} vs ${seqB.length}`);
  const rb = new Map(seqB.map((x, i) => [x, i + 1]));
  const disp = seqA.map((x, i) => {
    if (!rb.has(x)) throw new Error(`Project ${x} from baseline missing in depth2 sequence ${key}`);
    return Math.abs(i + 1 - rb.get(x));
  });
  let first = 0;
  for (let i = 0; i < seqA.length; i++) if (seqA[i] !== seqB[i]) { first = i + 1; break; }
  const jac = k => {
    const A = new Set(seqA.slice(0, k)), B = new Set(seqB.slice(0, k));
    let n = 0;
    for (const x of A) if (B.has(x)) n++;
    return n / new Set([...A, ...B]).size;
  };
  return {
    scenario: key,
    first_divergence_step: first,
    mean_abs_displacement: disp.reduce((a, b) => a + b, 0) / disp.length,
    max_abs_displacement: Math.max(...disp),
    jaccard_top_10: jac(10),
    jaccard_top_20: jac(20),
    jaccard_top_30: jac(30),
    jaccard_top_50: jac(50),
    jaccard_top_100: jac(100),
    jaccard_top_124: jac(124)
  };
}
function improvement(key, g, l) {
  const fields = [
    'cumulative_eval_rmc', 'cumulative_eval_balanceado', 'cumulative_eval_logit',
    'cumulative_own_score', 'cumulative_own_score_discounted',
    'mean_components', 'integrated_component_reduction',
    'cumulative_population', 'cumulative_demand', 'cumulative_cyclists'
  ];
  const o = { scenario: key };
  for (const f of fields) {
    o[`greedy_${f}`] = g[f];
    o[`depth2_${f}`] = l[f];
    o[`delta_${f}`] = Number(l[f]) - Number(g[f]);
    o[`pct_${f}`] = Number(g[f]) ? 100 * (Number(l[f]) - Number(g[f])) / Math.abs(Number(g[f])) : null;
  }
  return o;
}
function trajectoryAreas(rows) {
  const sum = key => rows.reduce((acc, row) => acc + Number(row[key] || 0), 0);
  return {
    area_population: sum('cum_population'),
    area_demand: sum('cum_demand'),
    area_cyclists: sum('cum_cyclists')
  };
}

const baselineResult = JSON.parse(await fs.readFile(baselineSourcePath, 'utf8'));
if (!baselineResult?.invariants?.every_run_contains_all_eligible_projects || !baselineResult?.invariants?.same_final_components) {
  throw new Error('Authoritative full-portfolio baseline does not satisfy final-portfolio invariants');
}
const baseline = {
  source_generated_at: baselineResult.generated_at,
  source_commit: process.env.GITHUB_SHA || null,
  source_file: 'results/paper-full-portfolio-scenarios/summary.json',
  design: baselineResult.design,
  initial_components: baselineResult.initial_components
};
for (const key of ['ponderacion_rmc', 'balanceado', 'logit']) {
  const run = (baselineResult.runs || []).find(x => x.key === key);
  const summary = (baselineResult.summaries || []).find(x => x.scenario === key);
  if (!run?.rows?.length || !summary) throw new Error(`Missing authoritative greedy baseline for ${key}`);
  baseline[key] = {
    sequence: run.rows.map(r => r.id),
    summary: { ...summary, ...trajectoryAreas(run.rows) }
  };
}
await fs.writeFile(path.join(outDir, 'baseline-greedy.json'), JSON.stringify(baseline, null, 2), 'utf8');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(120 * 60 * 1000);
page.on('console', m => { const t = m.text(); if (t.startsWith('[paper-L2]') || m.type() === 'error') console.log(t); });
page.on('pageerror', e => console.error('[pageerror]', e));

try {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__EVA_EXPERIMENT_READY || window.__EVA_EXPERIMENT_ERROR, null, { timeout: 180000 });
  const err = await page.evaluate(() => window.__EVA_EXPERIMENT_ERROR || null);
  if (err) throw new Error(err);
  const result = await page.evaluate(async () => window.EVA_PAPER_EXPERIMENTS.runDepth2Only({ discount: 0.95, topK: 3 }));

  const comparisons = [], improvements = [], publicTrajectoryAreas = [];
  for (const run of result.runs) {
    const b = baseline[run.key];
    const ls = result.summaries.find(x => x.scenario === run.key);
    if (!b || !ls) throw new Error(`Missing baseline or depth2 summary for ${run.key}`);
    if (Number(b.summary.final_components) !== Number(ls.final_components)) {
      throw new Error(`Final-component mismatch for ${run.key}: greedy=${b.summary.final_components}, depth2=${ls.final_components}`);
    }
    comparisons.push(compare(b.sequence, run.sequence, run.key));
    improvements.push(improvement(run.key, b.summary, ls));
    const dAreas = trajectoryAreas(run.rows);
    publicTrajectoryAreas.push({
      scenario: run.key,
      greedy_area_population: b.summary.area_population,
      depth2_area_population: dAreas.area_population,
      pct_area_population: 100 * (dAreas.area_population - b.summary.area_population) / b.summary.area_population,
      greedy_area_demand: b.summary.area_demand,
      depth2_area_demand: dAreas.area_demand,
      pct_area_demand: 100 * (dAreas.area_demand - b.summary.area_demand) / b.summary.area_demand,
      greedy_area_cyclists: b.summary.area_cyclists,
      depth2_area_cyclists: dAreas.area_cyclists,
      pct_area_cyclists: 100 * (dAreas.area_cyclists - b.summary.area_cyclists) / b.summary.area_cyclists
    });
  }

  const merged = {
    ...result,
    baseline_source: {
      generated_at: baseline.source_generated_at,
      commit: baseline.source_commit,
      file: baseline.source_file,
      initial_components: baseline.initial_components
    },
    greedy_vs_depth2: comparisons,
    improvements,
    public_trajectory_areas: publicTrajectoryAreas
  };
  await fs.writeFile(path.join(outDir, 'summary-depth2.json'), JSON.stringify(merged, null, 2), 'utf8');
  await csv('depth2_summaries.csv', result.summaries);
  await csv('greedy_vs_depth2.csv', comparisons);
  await csv('depth2_improvements.csv', improvements);
  await csv('public_trajectory_areas.csv', publicTrajectoryAreas);
  for (const run of result.runs) await csv(`${run.key}_depth2_sequence.csv`, run.rows);

  console.log('LOOKAHEAD_DEPTH2_SUMMARY', JSON.stringify({
    design: result.design,
    baseline_source: merged.baseline_source,
    summaries: result.summaries,
    greedy_vs_depth2: comparisons,
    improvements,
    public_trajectory_areas: publicTrajectoryAreas
  }));
} finally {
  await browser.close();
}
