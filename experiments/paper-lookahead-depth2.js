/* EVA EDTR · look-ahead de dos pasos sobre cartera completa C/I.
   Compara greedy vs rollout depth-2 para RMC, Balanceado y Logit.
   En cada estado se consideran los K mejores candidatos contemporaneos.
   Para cada p de esa shortlist:
     L2(p|Gt)=S(p|Gt)+delta*max_q S(q|T_p(Gt))
   No es optimizacion global; K es un limite computacional explicito.
*/
(function(){
  'use strict';
  const base=window.EVA_PAPER_EXPERIMENTS;
  if(!base||!base.evaluateState||!base.fixedScore||!base.rootCfg) throw new Error('requiere paper-experiments-fast.js');
  const num=v=>Number.isFinite(+v)?+v:0;
  const normText=v=>String(v==null?'':v).trim().toLowerCase();
  const rawPortfolio=()=> (window.FC_RAW&&window.FC_RAW['Plan Maestro'])||window.projectsFC;
  const CRITERIA=['poblacion','costoOD','oportunidades','equidad','continuidad','demanda','ciclistas','fractal','estudiantes','prioridadGore','costoInv','seguridad','monumentos','intermodal','factibilidad','parques'];
  const projectGeom=id=>(rawPortfolio().features||[]).find(f=>f.properties&&f.properties.id===id);
  const eligibleIds=()=>new Set((rawPortfolio().features||[]).filter(f=>['comunal','intercomunal'].includes(normText(f.properties&&f.properties.escala))).map(f=>f.properties.id));
  function setRoot(r){ if(r&&window.FRACTAL&&window.FRACTAL.setRootConfig) window.FRACTAL.setRootConfig(r); }
  function allWeights(){ return Object.fromEntries(CRITERIA.map(k=>[k,k==='monumentos'?0:1])); }
  function max1(rows,fn){ return Math.max(1,...rows.map(r=>num(fn(r)))); }
  function scalesFrom(enriched,ids){ const rows=(enriched||[]).filter(p=>ids.has(p.id)); return {reference:'eligible-CI-G0',eligible_count:rows.length,poblacion:max1(rows,p=>p.poblacion),costoOD:max1(rows,p=>Math.abs(num(p.costoOD))),oportunidades:max1(rows,p=>p.oportunidades),demanda:max1(rows,p=>p.demandaHabilitada),ciclistas:max1(rows,p=>p.ciclistasInducidos),estudiantes:max1(rows,p=>p.estudiantes),seguridad:max1(rows,p=>p.siniestrosPeso),monumentos:max1(rows,p=>p.monumentos),intermodal:max1(rows,p=>p.metroEstaciones),factibilidad:max1(rows,p=>p.numPistas),parques:max1(rows,p=>p.parquesSup),costo:max1(rows,p=>p.costo),fractalBase:100}; }
  function evaluate(locked,weights,params,scales,root,ids){ setRoot(root); const state=base.evaluateState(locked||[],weights||{},params||{}); const lockedIds=new Set((locked||[]).map(f=>f.properties&&f.properties.id)); const ranked=(state.enriched||[]).filter(p=>ids.has(p.id)&&!lockedIds.has(p.id)).map(p=>({...p,score:base.fixedScore(p,weights,scales)})).sort((a,b)=>b.score-a.score||String(a.id).localeCompare(String(b.id))); return {...state,ranked}; }
  function scenarios(){ const m=window.EVA_SCENARIO_MAP||{}; return [
    {key:'ponderacion_rmc',label:'RMC',source:'ponderacion_rmc'},
    {key:'balanceado',label:'Balanceado',source:'balanceado'},
    {key:'logit',label:'Logit (Biogeme)',source:'ciclistas_biogeme'}
  ].map(d=>({...d,weights:{...m[d.source].weights}})); }
  function components(locked,params){ return window.ENGINE.buildComponents(window.existingFC,locked||[],num(params.connectTol)||150).count; }
  function crossScores(p,defs,scales){ const o={}; for(const d of defs)o[d.key]=base.fixedScore(p,d.weights,scales); return o; }
  async function chooseDepth2(state,locked,def,params,scales,root,ids,discount,topK){
    if(state.ranked.length<=1) return {chosen:state.ranked[0],two_step_value:num(state.ranked[0]?.score),next_best_score:0,next_best_id:null,evaluated_first_choices:state.ranked.length};
    const shortlist=state.ranked.slice(0,Math.min(topK,state.ranked.length));
    let best=null;
    for(let i=0;i<shortlist.length;i++){
      const p=shortlist[i],g=projectGeom(p.id); if(!g) continue;
      const next=evaluate([...locked,g],def.weights,params,scales,root,ids).ranked[0];
      const v=num(p.score)+discount*num(next&&next.score);
      if(!best||v>best.two_step_value+1e-12||(Math.abs(v-best.two_step_value)<=1e-12&&String(p.id).localeCompare(String(best.chosen.id))<0)) best={chosen:p,two_step_value:v,next_best_score:num(next&&next.score),next_best_id:next&&next.id,evaluated_first_choices:shortlist.length};
      if(window.evaYield&&i%4===0) await window.evaYield();
    }
    return best;
  }
  async function simulate(def,defs,params,scales,root,ids,discount,mode,topK){
    const locked=[],rows=[]; const n=ids.size;
    for(let step=1;step<=n;step++){
      const state=evaluate(locked,def.weights,params,scales,root,ids);
      const choice=mode==='depth2'?await chooseDepth2(state,locked,def,params,scales,root,ids,discount,topK):{chosen:state.ranked[0],two_step_value:null,next_best_score:null,next_best_id:null,evaluated_first_choices:1};
      const p=choice.chosen;if(!p)break;const g=projectGeom(p.id),x=crossScores(p,defs,scales);locked.push(g);const prev=rows.at(-1)||{};
      const row={scenario:def.key,scenario_label:def.label,method:mode,step,id:p.id,nombre:p.nombre,own_score:num(p.score),lookahead_value:choice.two_step_value,next_best_score:choice.next_best_score,next_best_id:choice.next_best_id,evaluated_first_choices:choice.evaluated_first_choices,score_eval_rmc:num(x.ponderacion_rmc),score_eval_balanceado:num(x.balanceado),score_eval_logit:num(x.logit),poblacion_marginal:num(p.poblacion),demanda_habilitada:num(p.demandaHabilitada),ciclistas_inducidos:num(p.ciclistasInducidos),componentes_red:components(locked,params),costo_mclp:num(p.costo)};
      row.cum_cost_mclp=num(prev.cum_cost_mclp)+row.costo_mclp;row.cum_own_score=num(prev.cum_own_score)+row.own_score;row.cum_own_score_discounted=num(prev.cum_own_score_discounted)+Math.pow(discount,step-1)*row.own_score;row.cum_eval_rmc=num(prev.cum_eval_rmc)+row.score_eval_rmc;row.cum_eval_balanceado=num(prev.cum_eval_balanceado)+row.score_eval_balanceado;row.cum_eval_logit=num(prev.cum_eval_logit)+row.score_eval_logit;row.cum_population=num(prev.cum_population)+row.poblacion_marginal;row.cum_demand=num(prev.cum_demand)+row.demanda_habilitada;row.cum_cyclists=num(prev.cum_cyclists)+row.ciclistas_inducidos;rows.push(row);
      if(step===1||step%10===0||step===n)console.log(`[paper-L2] ${def.label} ${mode}: ${step}/${n} · ${p.id}`);if(window.evaYield)await window.evaYield();
    }
    return {key:def.key,label:def.label,method:mode,rows,sequence:rows.map(r=>r.id)};
  }
  function summary(run,initialComponents){const last=run.rows.at(-1)||{};return {scenario:run.key,scenario_label:run.label,method:run.method,steps:run.rows.length,final_cost_mclp:num(last.cum_cost_mclp),final_components:num(last.componentes_red),mean_components:run.rows.reduce((s,r)=>s+num(r.componentes_red),0)/run.rows.length,integrated_component_reduction:run.rows.reduce((s,r)=>s+(initialComponents-num(r.componentes_red)),0),cumulative_own_score:num(last.cum_own_score),cumulative_own_score_discounted:num(last.cum_own_score_discounted),cumulative_eval_rmc:num(last.cum_eval_rmc),cumulative_eval_balanceado:num(last.cum_eval_balanceado),cumulative_eval_logit:num(last.cum_eval_logit),cumulative_population:num(last.cum_population),cumulative_demand:num(last.cum_demand),cumulative_cyclists:num(last.cum_cyclists)};}
  function compare(g,l){const rank=new Map(l.sequence.map((id,i)=>[id,i+1]));const disp=g.sequence.map((id,i)=>Math.abs(i+1-rank.get(id)));let first=0;for(let i=0;i<g.sequence.length;i++){if(g.sequence[i]!==l.sequence[i]){first=i+1;break;}}const jac=k=>{const A=new Set(g.sequence.slice(0,k)),B=new Set(l.sequence.slice(0,k));let inter=0;for(const x of A)if(B.has(x))inter++;return inter/new Set([...A,...B]).size;};return {scenario:g.key,first_divergence_step:first,mean_abs_displacement:disp.reduce((a,b)=>a+b,0)/disp.length,max_abs_displacement:Math.max(...disp),jaccard_top_10:jac(10),jaccard_top_20:jac(20),jaccard_top_30:jac(30),jaccard_top_50:jac(50),jaccard_top_100:jac(100),jaccard_top_124:jac(124)};}
  function improvement(gs,ls){const fields=['cumulative_eval_rmc','cumulative_eval_balanceado','cumulative_eval_logit','cumulative_own_score','cumulative_own_score_discounted','mean_components','integrated_component_reduction'];const o={scenario:gs.scenario};for(const f of fields){o[`greedy_${f}`]=gs[f];o[`depth2_${f}`]=ls[f];o[`delta_${f}`]=num(ls[f])-num(gs[f]);o[`pct_${f}`]=num(gs[f])?100*(num(ls[f])-num(gs[f]))/Math.abs(num(gs[f])):null;}return o;}
  async function run(opts){opts=opts||{};const discount=opts.discount==null?0.95:+opts.discount;const topK=opts.topK==null?10:Math.max(1,Math.floor(+opts.topK));const params={...(window.PARAM_DEFAULTS||{}),perfil:'general',segKSI:false};const root=base.rootCfg('Alameda',100,0.5),ids=eligibleIds(),defs=scenarios();setRoot(root);const baseState=base.evaluateState([],allWeights(),params),scales=scalesFrom(baseState.enriched,ids),initialComponents=components([],params),greedy=[],depth2=[];
    console.log(`[paper-L2] Inicio · ${ids.size} proyectos × 3 W · greedy vs depth2 Top-${topK}`);
    for(const d of defs){greedy.push(await simulate(d,defs,params,scales,root,ids,discount,'greedy',topK));depth2.push(await simulate(d,defs,params,scales,root,ids,discount,'depth2',topK));}
    const gs=greedy.map(r=>summary(r,initialComponents)),ls=depth2.map(r=>summary(r,initialComponents));
    return {generated_at:new Date().toISOString(),design:{eligible_projects:ids.size,scenarios:defs.map(d=>({key:d.key,label:d.label,weights:d.weights})),normalization:'fixed-G0-eligible-CI',root,discount_per_step:discount,lookahead_depth:2,first_choice_shortlist_k:topK,selection_rule:`maximize S_t(p)+delta*max_q S_{t+1}(q|T_p(G_t)) among current Top-${topK} candidates`,optimality_note:'rollout depth-2 sobre shortlist; no garantiza optimo global y K es un limite computacional'},normalization_reference:scales,initial_components:initialComponents,greedy_summaries:gs,depth2_summaries:ls,improvements:gs.map((g,i)=>improvement(g,ls[i])),order_comparison:greedy.map((g,i)=>compare(g,depth2[i])),greedy_runs:greedy,depth2_runs:depth2};
  }
  window.EVA_PAPER_EXPERIMENTS.runDepth2Lookahead=run;
})();
