import { chromium } from 'playwright';

const baseUrl = process.env.EVA_DIAGNOSTIC_BASE_URL || 'http://127.0.0.1:8080/experiments/runner.html';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  page.on('console', msg => console.log(`[browser:${msg.type()}] ${msg.text()}`));
  console.log(`Opening ${baseUrl}`);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => window.__EVA_EXPERIMENT_READY || window.__EVA_EXPERIMENT_ERROR, null, { timeout: 120000 });
  const err = await page.evaluate(() => window.__EVA_EXPERIMENT_ERROR || null);
  if (err) throw new Error(err);

  const result = await page.evaluate(() => {
    const norm = v => String(v == null ? '' : v).trim().toLowerCase();
    const rawExisting = window.__EVA_EXISTING_RAW_EXPERIMENT || window.existingFC;
    const effectiveExisting = window.existingFC;
    const rawPortfolio = (window.FC_RAW && window.FC_RAW['Plan Maestro']) || window.projectsFC;
    const eligible = {
      type: 'FeatureCollection',
      features: (rawPortfolio.features || []).filter(f => {
        const e = norm(f && f.properties && f.properties.escala);
        return e === 'comunal' || e === 'intercomunal';
      })
    };
    const tol = Number((window.PARAM_DEFAULTS || {}).connectTol) || 150;
    const build = (base, extra) => window.ENGINE.buildComponents(base, extra || [], tol).count;
    const excluded = (rawExisting.features || []).filter(f => !(effectiveExisting.features || []).includes(f));
    const excludedByType = {};
    for (const f of excluded) {
      const t = norm(f && f.properties && f.properties.tipoNorm) || '(sin tipo)';
      excludedByType[t] = (excludedByType[t] || 0) + 1;
    }
    return {
      tolerance_m: tol,
      raw_existing_count: (rawExisting.features || []).length,
      effective_existing_count: (effectiveExisting.features || []).length,
      excluded_existing_count: excluded.length,
      excluded_by_type: excludedByType,
      eligible_project_count: eligible.features.length,
      initial_components_raw: build(rawExisting, []),
      final_components_raw: build(rawExisting, eligible.features),
      initial_components_effective: build(effectiveExisting, []),
      final_components_effective: build(effectiveExisting, eligible.features),
      reduction_raw: build(rawExisting, []) - build(rawExisting, eligible.features),
      reduction_effective: build(effectiveExisting, []) - build(effectiveExisting, eligible.features),
      network_metadata: window.EVA_EXPERIMENT_NETWORK || null,
    };
  });
  console.log('EVA_EFFECTIVE_NETWORK_DIAGNOSTIC ' + JSON.stringify(result));
} finally {
  await browser.close();
}
