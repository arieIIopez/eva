import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl=process.env.EVA_EXPERIMENT_BASE_URL||'http://127.0.0.1:8080/experiments/runner-population-saturation.html';
const outDir=path.resolve('results/paper-population-saturation');await fs.mkdir(outDir,{recursive:true});
function esc(v){if(v==null)return'';const s=typeof v==='object'?JSON.stringify(v):String(v);return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s;}
async function csv(name,rows){rows=rows||[];if(!rows.length)return fs.writeFile(path.join(outDir,name),'','utf8');const keys=[...rows.reduce((s,r)=>(Object.keys(r).forEach(k=>s.add(k)),s),new Set())];await fs.writeFile(path.join(outDir,name),[keys.join(','),...rows.map(r=>keys.map(k=>esc(r[k])).join(','))].join('\n')+'\n','utf8');}
const browser=await chromium.launch({headless:true});const page=await browser.newPage();page.setDefaultTimeout(120*60*1000);page.on('console',m=>{const t=m.text();if(t.startsWith('[paper-pop]')||m.type()==='error')console.log(t)});page.on('pageerror',e=>console.error('[pageerror]',e));
try{
 await page.goto(baseUrl,{waitUntil:'domcontentloaded',timeout:120000});await page.waitForFunction(()=>window.__EVA_EXPERIMENT_READY||window.__EVA_EXPERIMENT_ERROR,null,{timeout:180000});const err=await page.evaluate(()=>window.__EVA_EXPERIMENT_ERROR||null);if(err)throw new Error(err);
 const result=await page.evaluate(async()=>window.EVA_PAPER_EXPERIMENTS.runPopulationSaturation({epsilon:0}));
 await fs.writeFile(path.join(outDir,'summary.json'),JSON.stringify(result,null,2),'utf8');await csv('population_summaries.csv',result.summaries);
 for(const run of result.runs){await csv(`${run.key}_population_path.csv`,run.rows);if(run.remaining_project_ids)await csv(`${run.key}_remaining_projects.csv`,run.remaining_project_ids.map(id=>({id})));}
 const zeroDiagnostics=result.runs.filter(r=>r.key!=='population_first').flatMap(r=>r.rows.filter(x=>Number(x.poblacion_marginal)<=0));await csv('zero_population_diagnostics.csv',zeroDiagnostics);
 const pop=result.runs.find(r=>r.key==='population_first');await csv('population_first_sequence.csv',pop?pop.rows:[]);
 console.log('POPULATION_SATURATION_SUMMARY',JSON.stringify({design:result.design,full_population_reference:result.full_population_reference,summaries:result.summaries,population_first_stop:pop&&{stop_reason:pop.stop_reason,stop_state:pop.stop_state,remaining_projects:pop.remaining_project_ids.length}}));
}finally{await browser.close();}