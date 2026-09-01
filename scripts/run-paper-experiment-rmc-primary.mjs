import { chromium } from 'playwright';

const baseUrl = process.env.EVA_EXPERIMENT_BASE_URL || 'http://127.0.0.1:8080/experiments/runner-rmc-eligible.html';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
page.setDefaultTimeout(60 * 60 * 1000);
page.on('console', msg => {
  const txt = msg.text();
  if (txt.startsWith('[paper-primary]') || msg.type() === 'error') console.log(txt);
});
page.on('pageerror', err => console.error('[pageerror]', err));

try {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__EVA_EXPERIMENT_READY || window.__EVA_EXPERIMENT_ERROR, null, { timeout: 180000 });
  const bootError = await page.evaluate(() => window.__EVA_EXPERIMENT_ERROR || null);
  if (bootError) throw new Error(bootError);

  const result = await page.evaluate(async () => {
    const exp = window.EVA_PAPER_EXPERIMENTS;
    const weights = { ...(window.EVA_SCENARIO_MAP.ponderacion_rmc.weights || {}) };
    const params = { ...(window.PARAM_DEFAULTS || {}), perfil: 'general', segKSI: false };
    const root = exp.rootCfg('Alameda', 100, 0.5);
    console.log('[paper-primary] static RMC + C/I');
    const staticRows = exp.staticEligibleFixed(weights, params, root);
    console.log('[paper-primary] sequential RMC + C/I');
    const seq = await exp.sequentialEligibleFixed(weights, { params, rootConfig: root, maxSteps: 30 });
    const comparison = exp.compareRankSequence(staticRows, seq.order, [5,10,15,20,30]);
    const features = ((window.FC_RAW && window.FC_RAW['Plan Maestro']) || window.projectsFC).features || [];
    const eligible = features.filter(f => {
      const e = String((f.properties || {}).escala || '').trim().toLowerCase();
      return e === 'comunal' || e === 'intercomunal';
    });
    const byScale = {};
    for (const f of features) {
      const e = String((f.properties || {}).escala || 'Sin escala');
      byScale[e] = (byScale[e] || 0) + 1;
    }
    return {
      versions: { ...(window.EVA_VERSION || {}) },
      counts: { total: features.length, eligible: eligible.length, excluded: features.length - eligible.length, by_scale: byScale },
      comparison,
      static_top30: staticRows.slice(0,30).map(x => ({rank:x.rank,id:x.id,nombre:x.nombre,escala:x.escala,score:x.score})),
      sequential_top30: seq.order.slice(0,30).map(x => ({step:x.step,id:x.id,nombre:x.nombre,escala:x.escala,score:x.score})),
      normalization_reference: seq.scales,
    };
  });

  console.log('RMC_PRIMARY_SUMMARY', JSON.stringify(result));
} finally {
  await browser.close();
}

// Trigger marker: 2026-09-01 RMC+C/I primary correction.
