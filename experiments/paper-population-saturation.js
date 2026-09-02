/* EVA EDTR · población marginal, habilitación y detención endógena.
   Objetivo: evaluar trayectorias por población potencialmente beneficiada,
   no por costo. El costo se conserva sólo como atributo/restricción.

   El experimento hace dos cosas:
   1) Reproduce RMC, Balanceado y Logit y diagnostica, en cada estado,
      la población marginal elegida frente a la máxima población marginal
      disponible.
   2) Construye una política Population-first:
      - mientras exista un proyecto con DeltaP_t > epsilon, elige el de mayor
        población marginal directa;
      - si todas las DeltaP_t son cero, prueba exhaustivamente cada proyecto
        restante como puente de un paso. Se construye el proyecto cero sólo si
        genera DeltaP_{t+1}>epsilon en alguna alternativa restante;
      - si no existe beneficio directo ni habilitación poblacional de un paso,
        la secuencia se detiene.

   La habilitación se limita deliberadamente a un paso. Un proyecto clasificado
   como no habilitante en esta prueba puede tener valor por seguridad, equidad,
   redundancia u otros objetivos, o habilitación a mayor profundidad.
*/
(function(){
'use strict';
const base=window.EVA_PAPER_EXPERIMENTS;
if(!base||!base.evaluateState||!base.fixedScore||!base.rootCfg) throw new Error('requiere paper-experiments-fast.js');
const num=v=>Number.isFinite(+v)?+v:0;
const norm=v=>String(v==null?'':v).trim().toLowerCase();
const portfolio=()=> (window.FC_RAW&&window.FC_RAW['Plan Maestro'])||window.projectsFC;
const geom=id=>(portfolio().features||[]).find(f=>f.properties&&f.properties.id===id);
const props=id=>{const g=geom(id);return (g&&g.properties)||{};};
const CR=['poblacion','costoOD','oportunidades','equidad','continuidad','demanda','ciclistas','fractal','estudiantes','prioridadGore','costoInv','seguridad','monumentos','intermodal','factibilidad','parques'];
function eligibleIds(){return new Set((portfolio().features||[]).filter(f=>['comunal','intercomunal'].includes(norm(f.properties&&f.properties.escala))).map(f=>f.properties.id));}
function rootSet(r){if(r&&window.FRACTAL&&window.FRACTAL.setRootConfig)window.FRACTAL.setRootConfig(r);}
function allWeights(){return Object.fromEntries(CR.map(k=>[k,k==='monumentos'?0:1]));}
function max1(a,f){return Math.max(1,...a.map(x=>num(f(x))));}
function scales(enriched,E){const a=(enriched||[]).filter(p=>E.has(p.id));return{reference:'eligible-CI-G0',eligible_count:a.length,poblacion:max1(a,p=>p.poblacion),costoOD:max1(a,p=>Math.abs(num(p.costoOD))),oportunidades:max1(a,p=>p.oportunidades),demanda:max1(a,p=>p.demandaHabilitada),ciclistas:max1(a,p=>p.ciclistasInducidos),estudiantes:max1(a,p=>p.estudiantes),seguridad:max1(a,p=>p.siniestrosPeso),monumentos:max1(a,p=>p.monumentos),intermodal:max1(a,p=>p.metroEstaciones),factibilidad:max1(a,p=>p.numPistas),parques:max1(a,p=>p.parquesSup),costo:max1(a,p=>p.costo),fractalBase:100};}
function defs(){const m=window.EVA_SCENARIO_MAP||{};return[
 {key:'ponderacion_rmc',label:'RMC',src:'ponderacion_rmc'},
 {key:'balanceado',label:'Balanceado',src:'balanceado'},
 {key:'logit',label:'Logit (Biogeme)',src:'ciclistas_biogeme'}
].map(d=>({...d,weights:{...m[d.src].weights}}));}
function evaluate(locked,w,params,M,root,E){rootSet(root);const s=base.evaluateState(locked||[],w||allWeights(),params||{});const L=new Set((locked||[]).map(f=>f.properties&&f.properties.id));const available=(s.enriched||[]).filter(p=>E.has(p.id)&&!L.has(p.id)).map(p=>({...p,score:base.fixedScore(p,w||allWeights(),M)}));const ranked=[...available].sort((a,b)=>b.score-a.score||String(a.id).localeCompare(String(b.id)));return{...s,available,ranked};}
function maxPopulation(available){let best=null;for(const p of (available||[])){const v=num(p.poblacion);if(!best||v>best.population+1e-12||(Math.abs(v-best.population)<=1e-12&&String(p.id).localeCompare(String(best.project.id))<0))best={project:p,population:v};}return best||{project:null,population:0};}
function populationSort(a,b){const dp=num(b.poblacion)-num(a.poblacion);return Math.abs(dp)>1e-12?dp:String(a.id).localeCompare(String(b.id));}
function components(locked,params){return window.ENGINE.buildComponents(window.existingFC,locked||[],num(params.connectTol)||150).count;}
function addCum(row,prev){row.cum_population=num(prev.cum_population)+row.poblacion_marginal;row.cum_cost_mclp=num(prev.cum_cost_mclp)+row.costo_mclp;row.cum_demand=num(prev.cum_demand)+row.demanda_habilitada;row.cum_cyclists=num(prev.cum_cyclists)+row.ciclistas_inducidos;return row;}
async function simulateW(def,params,M,root,E,epsilon){const locked=[],rows=[];let current=evaluate(locked,def.weights,params,M,root,E);for(let step=1;step<=E.size;step++){
 const chosen=current.ranked[0];if(!chosen)break;const currentMax=maxPopulation(current.available);const chosenPop=num(chosen.poblacion);const positiveAvailable=current.available.filter(p=>num(p.poblacion)>epsilon).length;const g=geom(chosen.id);locked.push(g);
 const next=step<E.size?evaluate(locked,def.weights,params,M,root,E):{available:[]};const nextMax=maxPopulation(next.available);
 let zero_class='direct_positive';if(chosenPop<=epsilon){if(currentMax.population>epsilon)zero_class='zero_despite_positive_alternative';else if(nextMax.population>epsilon)zero_class='zero_observed_one_step_enabler';else zero_class='zero_no_observed_one_step_gain';}
 const prev=rows.at(-1)||{},pr=props(chosen.id);const row=addCum({scenario:def.key,scenario_label:def.label,method:'eva_multicriteria',step,id:chosen.id,nombre:chosen.nombre,escala:pr.escala||chosen.escala||null,poblacion_marginal:chosenPop,max_poblacion_marginal_disponible:currentMax.population,max_population_project_id:currentMax.project&&currentMax.project.id,local_population_gap:Math.max(0,currentMax.population-chosenPop),positive_population_candidates:positiveAvailable,zero_class,next_max_poblacion_marginal:nextMax.population,next_max_population_project_id:nextMax.project&&nextMax.project.id,demanda_habilitada:num(chosen.demandaHabilitada),ciclistas_inducidos:num(chosen.ciclistasInducidos),componentes_red:components(locked,params),costo_mclp:num(chosen.costo)},prev);rows.push(row);current=next;
 if(step===1||step%10===0||step===E.size)console.log(`[paper-pop] ${def.label}: ${step}/${E.size} · ${chosen.id} · dP=${chosenPop}`);if(window.evaYield)await window.evaYield();}
 return{key:def.key,label:def.label,rows,sequence:rows.map(r=>r.id)};}
async function scanOneStepEnablers(state,locked,params,M,root,E,epsilon){let best=null;let tested=0;for(const p of state.available){const g=geom(p.id);if(!g)continue;const next=evaluate([...locked,g],allWeights(),params,M,root,E);const nb=maxPopulation(next.available);const cand={project:p,next_best_population:nb.population,next_best_id:nb.project&&nb.project.id};tested++;if(!best||cand.next_best_population>best.next_best_population+1e-12||(Math.abs(cand.next_best_population-best.next_best_population)<=1e-12&&String(p.id).localeCompare(String(best.project.id))<0))best=cand;if(window.evaYield&&tested%5===0)await window.evaYield();}return{best,tested,epsilon};}
async function simulatePopulationFirst(params,M,root,E,epsilon){const locked=[],rows=[];let stop_reason=null,stop_state=null;for(let step=1;step<=E.size;step++){
 const state=evaluate(locked,allWeights(),params,M,root,E);if(!state.available.length){stop_reason='portfolio_exhausted';break;}const direct=[...state.available].sort(populationSort);const bestDirect=direct[0],maxDirect=num(bestDirect&&bestDirect.poblacion);let chosen=null,decision_type=null,enabling_next_population=0,enabling_next_id=null,enablers_tested=0;
 if(maxDirect>epsilon){chosen=bestDirect;decision_type='direct_population';}
 else{const scan=await scanOneStepEnablers(state,locked,params,M,root,E,epsilon);enablers_tested=scan.tested;if(scan.best&&scan.best.next_best_population>epsilon){chosen=scan.best.project;decision_type='one_step_population_enabler';enabling_next_population=scan.best.next_best_population;enabling_next_id=scan.best.next_best_id;}else{stop_reason='no_direct_or_one_step_population_gain';stop_state={step,remaining_projects:state.available.length,max_direct_population:maxDirect,best_one_step_enabled_population:scan.best?scan.best.next_best_population:0,best_one_step_enabler_id:scan.best&&scan.best.project&&scan.best.project.id};break;}}
 const pr=props(chosen.id),g=geom(chosen.id);locked.push(g);const prev=rows.at(-1)||{};const row=addCum({scenario:'population_first',scenario_label:'Population-first',method:'population_greedy_with_one_step_enabler',step,id:chosen.id,nombre:chosen.nombre,escala:pr.escala||chosen.escala||null,decision_type,poblacion_marginal:num(chosen.poblacion),max_poblacion_marginal_disponible:maxDirect,local_population_gap:Math.max(0,maxDirect-num(chosen.poblacion)),enabling_next_population,enabling_next_id,enablers_tested,demanda_habilitada:num(chosen.demandaHabilitada),ciclistas_inducidos:num(chosen.ciclistasInducidos),componentes_red:components(locked,params),costo_mclp:num(chosen.costo)},prev);rows.push(row);
 console.log(`[paper-pop] Population-first: ${step} · ${chosen.id} · ${decision_type} · dP=${row.poblacion_marginal}${decision_type==='one_step_population_enabler'?` -> ${enabling_next_population}`:''}`);if(window.evaYield)await window.evaYield();}
 return{key:'population_first',label:'Population-first',rows,sequence:rows.map(r=>r.id),stop_reason,stop_state,remaining_project_ids:[...E].filter(id=>!new Set(rows.map(r=>r.id)).has(id))};}
function firstStepAt(rows,target){const r=rows.find(x=>num(x.cum_population)>=target-1e-9);return r?r.step:null;}
function populationMetrics(run,fullPopulation,horizon){const rows=run.rows||[];const final=num(rows.at(-1)?.cum_population);const curve=[];for(let t=1;t<=horizon;t++){const r=t<=rows.length?rows[t-1]:rows.at(-1);curve.push(num(r&&r.cum_population));}const area=curve.reduce((a,b)=>a+b,0);const weighted=rows.reduce((s,r)=>s+num(r.step)*num(r.poblacion_marginal),0);const denom=final||1;const zeroRows=rows.filter(r=>num(r.poblacion_marginal)<=0);return{scenario:run.key,scenario_label:run.label,steps_executed:rows.length,stop_reason:run.stop_reason||'portfolio_exhausted',population_at_stop:final,population_fraction_of_full:fullPopulation?final/fullPopulation:null,population_area_horizon:area,population_capture_index:fullPopulation&&horizon?area/(fullPopulation*horizon):null,beneficiary_mean_entry_step:weighted/denom,step_50:firstStepAt(rows,0.50*fullPopulation),step_75:firstStepAt(rows,0.75*fullPopulation),step_90:firstStepAt(rows,0.90*fullPopulation),step_95:firstStepAt(rows,0.95*fullPopulation),step_99:firstStepAt(rows,0.99*fullPopulation),zero_direct_steps:zeroRows.length,zero_despite_positive_alternative:zeroRows.filter(r=>r.zero_class==='zero_despite_positive_alternative').length,zero_observed_one_step_enabler:zeroRows.filter(r=>r.zero_class==='zero_observed_one_step_enabler').length,zero_no_observed_one_step_gain:zeroRows.filter(r=>r.zero_class==='zero_no_observed_one_step_gain').length,one_step_enablers_executed:rows.filter(r=>r.decision_type==='one_step_population_enabler').length,local_population_gap_sum:rows.reduce((s,r)=>s+num(r.local_population_gap),0),remaining_projects:run.remaining_project_ids?run.remaining_project_ids.length:0};}
async function run(opts){opts=opts||{};const epsilon=opts.epsilon==null?0:+opts.epsilon;const params={...(window.PARAM_DEFAULTS||{}),perfil:'general',segKSI:false},root=base.rootCfg('Alameda',100,0.5),E=eligibleIds(),D=defs();rootSet(root);const M=scales(base.evaluateState([],allWeights(),params).enriched,E);const wRuns=[];console.log(`[paper-pop] Inicio · ${E.size} proyectos · epsilon=${epsilon}`);for(const d of D)wRuns.push(await simulateW(d,params,M,root,E,epsilon));const fullPopulation=Math.max(...wRuns.map(r=>num(r.rows.at(-1)?.cum_population)));const popRun=await simulatePopulationFirst(params,M,root,E,epsilon);const horizon=E.size;const runs=[...wRuns,popRun];const summaries=runs.map(r=>populationMetrics(r,fullPopulation,horizon));return{generated_at:new Date().toISOString(),design:{eligible_projects:E.size,epsilon_population:epsilon,normalization:'fixed-G0-eligible-CI',root,objective:'maximize early capture of non-duplicated marginal population; cost is not objective',population_first_rule:'choose max DeltaP_t; if all DeltaP_t<=epsilon, build a zero-direct project only when it enables DeltaP_{t+1}>epsilon in one step; otherwise stop',enabling_horizon:1,optimality_note:'population-first is greedy with one-step bridge at zero states; it is not a global optimizer'},normalization_reference:M,full_population_reference:fullPopulation,runs,summaries};}
window.EVA_PAPER_EXPERIMENTS.runPopulationSaturation=run;
})();