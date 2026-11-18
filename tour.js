
(() => {
"use strict";
const D=window.GAIA_DATA;
const $=(query,scope=document)=>scope.querySelector(query);
const $$=(query,scope=document)=>[...scope.querySelectorAll(query)];
const modal=$("#research-tour"), out=$("#tour-scene"), body=$("#tour-body");
const esc=(value)=>String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const f=(value,d=2)=>Number(value).toFixed(d).replace(/^-/,"−");
const sf=(value,d=2)=>(value>0?"+":"")+f(value,d);
const asset=(name)=>"assets/"+name+".webp";
const color={obs:"#e8f0df",season:"#a6a99a",fast:"#94b8ec",memory:"#8fe0bd",diff:"#f1b17b",dim:"#a9c7bb",grid:"#47645d",line:"#678c82"};
const regions=[
 {cn:"W. North America",en:"Western North America",n:"1,531",box:[12.8,22.1,10.7,16]},
 {cn:"Mediterranean",en:"Mediterranean",n:"1,350",box:[46.3,21.1,16,20]},
 {cn:"Southern Africa",en:"Southern Africa",n:"1,401",box:[50.7,64,12.6,19.5]},
 {cn:"SE Australia",en:"Southeastern Australia",n:"1,352",box:[82.9,71,12.5,17.5]}
];
const tabTitles={atlas:"Study regions",sat:"Satellite imagery",soil:"Soil-water model",fire:"Fire-risk model",groups:"Group fits",hold:"Regional holdout",pr:"Fire classification"};
const STAGES=["atlas","sat","soil","fire"];
const FIRE=["groups","hold","pr"];
const full=[
 ...regions.map((_,i)=>({stage:"atlas",label:"Study regions",kind:"atlas",i,ms:i===3?4400:1900})),
 {stage:"sat",label:"Same-scene MODIS",kind:"modis",ms:7400},
 {stage:"sat",label:"Historical Landsat example",kind:"landsat",ms:5700},
 {stage:"soil",label:"Daily replay",kind:"trace",ms:11300},
 {stage:"soil",label:"Held-year test at 37 stations",kind:"soil-bench",ms:10000},
 {stage:"fire",label:"From discovery to prediction",kind:"ci11",ms:7300},
 ...D.groups.map((_,i)=>({stage:"fire",label:"12 development groups",kind:"groups",i,ms:i===11?6300:1000})),
 ...D.loro.map((_,i)=>({stage:"fire",label:"Four-region holdout",kind:"hold",i,ms:i===3?8500:1850})),
 {stage:"fire",label:"Classification · spatial CV",kind:"pr",split:"spatial",ms:6800},
 {stage:"fire",label:"Classification · region holdout",kind:"pr",split:"loro",ms:11000}
];
const fireOnly=full.filter(x=>x.stage==="fire"&&x.kind!=="ci11");
let deck=full, mode="full", index=0, running=false, ended=false, elapsed=0, last=0, raf=0, trigger=null, lastDay=-1, renderedKind=null;
const ratio=()=>Math.min(1,elapsed/deck[index].ms);
const paintSvg=(w,h,title,g)=>`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" xmlns="http://www.w3.org/2000/svg">${g}</svg>`;
const line=(x,y,x1,y1,c=color.grid,width=1,style="")=>`<line x1="${x}" y1="${y}" x2="${x1}" y2="${y1}" stroke="${c}" stroke-width="${width}" ${style}/>`;
const tx=(x,y,val,c=color.dim,anchor="start",size=13)=>`<text x="${x}" y="${y}" fill="${c}" text-anchor="${anchor}" font-size="${size}">${esc(val)}</text>`;
const pts=(points,col,dash="",w=2.4)=>`<polyline points="${points.map(p=>p.join(",")).join(" ")}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${dash}/>`;
const dot=(x,y,c,r=4.2)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
const sx=(a,b,c,d)=>p=>c+(p-a)/(b-a)*(d-c);
const section=(k,t,p,visual,aside)=>`<div class="tour-opening"><p class="tour-kicker">${k}</p><h3>${t}</h3><p>${p}</p></div><div class="tour-scene-grid"><div class="tour-visual">${visual}</div><aside class="tour-aside">${aside}</aside></div>`;
const legend=(pairs)=>`<div class="tour-legend">${pairs.map(([n,c])=>`<span><i style="--dot:${c}"></i>${n}</span>`).join("")}</div>`;
const bars=(data,max,d)=>data.map(([label,value,col])=>`<div class="tour-bar-row"><span>${label}<b>${f(value,d)}</b></span><div class="tour-tinybar"><i style="--bar:${col};--width:${Math.min(100,value/max*100)}%"></i></div></div>`).join("");
function atlas(step){
 const r=regions[step.i];
 const [x,y,w,h]=r.box;
 return section("01 / THE SAMPLING FRAME","One question across four regions",
  "The evidence spans 2012–2024. The core fire-risk analysis used 964 historical episodes from 2012–2018.",
  `<div class="tour-world"><img src="${asset("global-atlas")}" width="2200" height="637" alt="Four study regions over a global biomass layer"><span class="tour-marker" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"></span><img class="tour-map-zoom" id="tour-map-zoom" src="${asset("region-"+(step.i+1))}" alt="" aria-hidden="true"><span class="tour-map-zoom-label">${r.cn} · sampling window</span></div>
 <div class="tour-regions">${regions.map((q,i)=>`<span${i===step.i?' class="active"':""}>${q.cn}<strong>${q.n}</strong></span>`).join("")}</div>
 <p class="tour-caption">ESA CCI Biomass v7, 2022. Points mark the sampling frame, not fire risk.</p>`,
 `<span class="tour-label">CI18 · Region ${step.i+1} / 4</span><h4>${r.cn}</h4><b class="tour-digit">${r.n}</b><p>Sampled sites in this region. Across all four regions: 5,634 sites in 469 spatial blocks.</p><img class="tour-region-crop" src="${asset("region-"+(step.i+1))}" width="680" height="355" alt="${r.cn} sampling window"><p class="tour-caption">${r.en}</p>`);
}
function satellite(step){
 const modis=step.kind==="modis";
 const pair=modis?["modis-gpp-1","modis-qa-1"]:["landsat-pre-7","landsat-post-7"];
 const labs=modis?["GPP · productivity","MODLAND · quality flag"]:["13 Jan 2019 · before","29 Jan 2019 · fire and burn scars"];
 const visual=`<div class="tour-wipe" id="tour-wipe"><img width="560" height="550" src="${asset(pair[1])}" alt="${labs[1]}"><img width="560" height="550" id="tour-wipe-front" src="${asset(pair[0])}" alt="${labs[0]}"><div class="tour-wipe-bar"></div><div class="tour-wipe-labels"><span>${labs[0]}</span><span>${labs[1]}</span></div></div>
 <label class="day-slider" for="tour-wipe-range"><span>Drag to compare</span><input id="tour-wipe-range" type="range" min="15" max="85" value="52"><output id="tour-wipe-value">52%</output></label>
 <p class="tour-caption">${modis?"Terra MODIS MOD17A2H.061, h13v02, 17–24 May 2022. The right image is the quality layer for the same scene, not a different date.":"NASA/USGS Landsat 8, Great Pine Tier, Tasmania. This illustrative fire was not used to fit the models."}</p>`;
 const right=modis?
 `<span class="tour-label">CI442 · separate from the image example</span><h4>Stronger canopy signals, lower relative water use</h4><div class="tour-mini-metrics">${D.veg.slice(0,3).map(([n,e,l,h])=>`<div class="${e<0?"is-neg":""}" title="Pointwise 95% interval [${sf(l,5)}, ${sf(h,5)}]"><span>${n}</span><b>${sf(e,5)}</b></div>`).join("")}</div><p>Adjusted differences: heat first minus low soil water first, in each measure’s own units. Stronger canopy signals did not mean higher relative water use.</p>`:
 '<span class="tour-label">LANDSAT 8 · HISTORICAL IMAGERY</span><h4>Burn scars across the same landscape</h4><p>These images show what the satellite can see. Fire-risk estimates come from separate historical records, not from these two images.</p>';
 return section("02 / SATELLITE OBSERVATIONS",modis?"What the satellite measures":"The same landscape, two dates",
  modis?"Compare productivity and quality flags over the same footprint. Canopy condition is not a substitute for water use.":"Drag the divider to compare historical images. The right side shows active fire and burn scars, not a model prediction.",visual,right);
}

const soilNames=["Measured soil water","Station-month baseline","One-day rainfall","30-day memory"];
const soilColors=[color.obs,color.season,color.fast,color.memory];
const soilErrMax=Math.ceil(Math.max(...D.trace.flatMap(q=>q.v.slice(1).map(v=>Math.abs(v-q.v[0]))))*100)/100;
function trace(step){
 const observing=step.kind==="trace", b=D.stationSummary[0];
 const view=`<div class="tour-plot" id="tour-soil-chart"></div>
 ${legend(soilNames.map((n,i)=>[n,soilColors[i]]))}
 <label class="day-slider" for="tour-day"><span>Inspect a day</span><input type="range" id="tour-day" min="0" max="48" value="${observing?0:48}"><output id="tour-date"></output></label>
 <div class="tour-date-values" id="tour-day-values" aria-label="Predictions and errors on the selected day"></div>
 <p class="tour-caption">Station 03055, 14 Jul–31 Aug 2022. The bottom panel shows absolute prediction error; the vertical line aligns the same day across panels.</p>`;
 const aside=observing?
 '<span class="tour-label">USCRN 03055 · 49 matched days</span><h4>How does the model use rainfall history?</h4><p>The model weights rainfall over the preceding 90 days, giving more weight to recent rain. Thirty days is a decay scale, not a recovery time.</p><p class="why">The upper plot shows soil water; the lower plot shows error. No single day determines which model works best.</p>':
 '<span class="tour-label">2022–2024 / HELD YEARS</span><h4>Test on years held out from fitting</h4><b class="tour-digit">16.6% / 14.1%</b><p>Lower RMSE vs. the station-month and one-day baselines, respectively.<b>37 stations · 23,578 matched station-days</b>. The memory model beat both baselines at 31 of 37 stations.</p>'+
 '<div class="tour-soil-benchmark-bars">'+bars([["Station-month baseline",b[0],color.season],["One-day rainfall",b[1],color.fast],["30-day memory",b[2],color.memory]],.08,5)+'</div>'+
 '<p class="tour-caption">Equal-weight station RMSE (m³ m⁻³); lower is better. The decay scale was selected in 2021 and tested in 2022–2024.</p>';
 return section("03 / MODEL 01",observing?"Rainfall ends. Its influence persists.":"Which model predicts held-out years best?",
   observing?"Follow 49 days of observations, three predictions and their errors on a shared time axis.":"Keep the daily trace in view while comparing held-year errors across all matched station-days.",view,aside);
}
function soilPlot(i,fullTrace=false){
 const W=740,H=310,x=sx(0,48,57,722),y=sx(.118,.207,168,68);
 const max=Math.ceil(Math.max(...D.trace.map(q=>q.rain))),rain=sx(0,max,51,17);
 const yp=sx(0,soilErrMax,269,205),end=fullTrace?D.trace.length:i+1;
 const rows=D.trace.slice(0,end);
 let g=tx(57,12,"Rainfall (mm)")+tx(57,65,"Measured and predicted 20 cm VWC (m³ m⁻³)")+tx(57,196,"Absolute error |prediction − measured| (m³ m⁻³)");
 for(const k of [0,Math.round(max/2),max])g+=tx(47,rain(k)+4,k,color.dim,"end",10);
 for(const z of [.12,.14,.16,.18,.20])g+=line(57,y(z),722,y(z))+tx(47,y(z)+4,f(z,2),color.dim,"end",11);
 for(const e of [0,soilErrMax/2,soilErrMax])g+=line(57,yp(e),722,yp(e))+tx(47,yp(e)+4,f(e,2),color.dim,"end",11);
 for(const k of [0,12,24,36,48]){
  const t=D.trace[k].date.slice(5);g+=tx(x(k),287,t,color.dim,k===0?"start":k===48?"end":"middle",11);
 }
 g+=rows.map((r,j)=>`<rect x="${x(j)-3}" y="${rain(r.rain)}" width="5.7" height="${Math.max(0,51-rain(r.rain))}" fill="#6aadc2" opacity="${i===j?1:.62}"/>`).join("");
 for(let j=0;j<4;j++){
  const style=j===1?'stroke-dasharray="7 4"':j===2?'stroke-dasharray="3 3"':"";
  g+=pts(rows.map((r,k)=>[x(k),y(r.v[j])]),soilColors[j],style,j===3?2.9:1.9);
  if(j>0)g+=pts(rows.map((r,k)=>[x(k),yp(Math.abs(r.v[j]-r.v[0]))]),soilColors[j],style,j===3?2.9:1.9);
 }
 g+=line(x(i),17,x(i),270,"#c2d9cb",1,'stroke-dasharray="3 4"');
 for(let j=0;j<4;j++){
  g+=dot(x(i),y(D.trace[i].v[j]),soilColors[j],4.4);
  if(j>0)g+=dot(x(i),yp(Math.abs(D.trace[i].v[j]-D.trace[i].v[0])),soilColors[j],4.4);
 }
 return paintSvg(W,H,"49 days of rainfall, measured soil water, three predictions, and aligned absolute errors",g);
}
function renderSoilDay(i,fullTrace=false){
 if(i===lastDay)return;lastDay=i;
 const q=D.trace[i];
 $("#tour-day").value=i;$("#tour-date").textContent=q.date;
 $("#tour-soil-chart").innerHTML=soilPlot(i,fullTrace);
 $("#tour-day-values").innerHTML=q.v.map((v,j)=>`<div><span><i style="--dot:${soilColors[j]}"></i>${soilNames[j]}</span><b>${f(v,4)}</b><small>${j===0?"Measured":"Abs. error "+f(Math.abs(v-q.v[0]),4)}</small></div>`).join("");
}
function coreFireFinding(){
 const x=sx(-18,18,71,578), W=670,H=222;
 let g="";
 for(const v of [-15,-10,-5,0,5,10,15]){
   g+=line(x(v),13,x(v),169,v===0?"#b5cfbf":color.grid,1,v===0?'stroke-dasharray="3 3"':"");
   g+=tx(x(v),193,v,color.dim,"middle",12);
 }
 for(const [i,[e,lo,hi]] of D.ci11.entries()){
   const y=32+i*36,c=e<0?color.fast:color.memory;
   g+=tx(13,y+5,"Q"+(i+1),color.dim);
   g+=line(x(lo),y,x(hi),y,c,2)+line(x(lo),y-5,x(lo),y+5,c)+line(x(hi),y-5,x(hi),y+5,c)+dot(x(e),y,c,6);
   g+=tx(656,y+5,sf(e),c,"end",13);
 }
 g+=tx(322,212,"Fire-risk difference: heat first minus low soil water first (pp)",color.dim,"middle",12);
 return section("04 / FROM DISCOVERY TO PREDICTION","From a historical finding to a prediction task","In CI11, the estimated fire-risk contrast changed sign across physiological-memory quartiles.",
  '<div class="tour-plot">'+paintSvg(W,H,"CI11 quartile risk differences with pointwise 95% intervals",g)+'</div><p class="tour-caption">CI11, 2012–2018 · 964 episodes in 243 spatial blocks. Historical development estimates and pointwise 95% intervals.</p>',
  '<span class="tour-label">LINEAR TREND / HISTORICAL CI11</span><b class="tour-digit">+4.11 pp</b><p>Estimated change per memory quartile (95% interval: +0.53 to +8.18 pp). All six later refit intervals included zero.</p><p class="why">Next: does memory improve predictions of group-level risk contrasts?</p>');
}

function firePlot(step){
 const group=step.kind==="groups", list=group?D.groups:D.loro;
 const W=740,H=230,x=sx(0,list.length-1,80,701),min=group?-12:-6,max=group?11:4,y=sx(min,max,189,21);
 let g=tx(57,15,"Risk difference (pp)");
 for(const v of group?[-10,-5,0,5,10]:[-6,-4,-2,0,2,4])g+=line(53,y(v),722,y(v),v===0?"#adcbc2":color.grid,1,v===0?'stroke-dasharray="3 4"':"")+tx(45,y(v)+4,v,color.dim,"end",12);
 g+=line(x(step.i),20,x(step.i),191,color.line,1.1,'stroke-dasharray="3 3"');
 for(let i=0;i<list.length;i++){
  const r=list[i];g+=tx(x(i),213,r.label,i===step.i?color.memory:color.dim,"middle",group?11:13);
  if(i>step.i)continue;
  let set=r.v.map((v,j)=>dot(x(i)+(j-1)*8,y(v),[color.obs,color.memory,color.fast][j],i===step.i?5.5:4)).join("");
  g+="<g opacity="+(i===step.i?'"1"':'".61"')+">"+set+"</g>";
 }
 return paintSvg(W,H,"Historical reference contrasts and predictions from equal-size memory and state models",g);
}

function fireContrasts(step){
 const group=step.kind==="groups", r=(group?D.groups:D.loro)[step.i], n=(group?D.groups:D.loro).length;
 const err=r.v.slice(1).map(v=>Math.abs(v-r.v[0]));
 const keys=[group?"Historical TMLE":"Regional reference","Memory prediction","State prediction"];
 const cols=[color.obs,color.memory,color.fast];
 const compare=`<div class="tour-fire-current"><span>${r.label}${group?" · "+r.n+" episodes":""}</span><span>Heat first minus low soil water first (pp)</span></div>
 <div class="tour-date-values tour-fire-values">${r.v.map((v,j)=>`<div><span><i style="--dot:${cols[j]}"></i>${keys[j]}</span><b>${sf(v)} pp</b><small>${j===0?"Reference estimate":"Abs. error "+f(err[j-1])+" pp"}</small></div>`).join("")}</div>
 <div class="tour-fire-errors" aria-label="Absolute error for the current comparison">${bars([["Memory abs. error",err[0],color.memory],["State abs. error",err[1],color.fast]],8.5,2)}</div>`;
 return section("04 / MODEL 02",group?"How close are the group predictions?":"What happens when a region is held out?",
  group?"Both models use five parameters. Each group shows its historical reference estimate and both predictions.":"Train on three regions and predict the fourth. This targets regional contrasts, not independent validation of the original groups.",
  `<div class="tour-plot">${firePlot(step)}</div>${legend(keys.map((key,i)=>[key,cols[i]]))}${compare}<p class="tour-caption">${group?"CI36 v2: physiological-memory quartile × initial-fuel tertile. Development fit only; CI37 yielded no independent score.":"Four exploratory holdouts; SEA is an archive code. Error is distance from an estimated group contrast, not error on individual fires."}</p>`,
  `<span class="tour-label">${group?"CI36 V2 / DEVELOPMENT":"EXPLORATORY REGION HOLDOUT"} · ${step.i+1}/${n}</span><h4>${group?"Weighted RMSE across 12 groups":"Four-region holdout RMSE"}</h4>
  <div class="tour-aggregate-pair"><div><small>Memory model</small><b>${group?"0.0243":"3.09 pp"}</b></div><div><small>State baseline</small><b>${group?"0.0273":"3.65 pp"}</b></div></div>
  <p class="tour-caption">${group?"Risk-difference scale (0.0243 = 2.43 percentage points).":"Same four holdouts; errors are in percentage points."}</p>
  <p class="why">${group?"Lower group-fit error at the same model size.":"Lower error in magnitude, but each model got the direction right in only one of four regions."}</p>`);
}
function firePr(step){
 const hold=step.split==="loro", v=hold?[.145,.177,.167]:[.162,.171,.194];
 return section("04 / FIRE MODEL · DIFFERENT TARGET","Better group forecasts did not improve fire classification",
  "Compare the archived classifiers under the same evaluation: dynamic memory, state plus order, and weather plus order.",
  `<div class="tour-pr"><img src="${asset("pr-"+step.split)}" alt="${hold?"Leave-region-out":"Spatial cross-validation"} CI16 precision–recall curves"><div><h4>${hold?"Leave-region-out":"Spatial cross-validation"} · PR-AUC</h4>${bars([["Dynamic memory",v[0],color.memory],["State + order",v[1],color.fast],["Weather + order",v[2],color.diff]],.2,3)}</div><p class="tour-caption">CI16: 964 historical episodes, 154 fire-positive. Paired difference (memory minus state + order): ${hold?"−0.031［−0.071，−0.003］":"−0.009［−0.046，+0.025］"}.</p></div>`,
  '<span class="tour-label">WHAT THE TWO MODELS ADD</span><h4>What the models add</h4><p><b>Rainfall memory: </b>improved soil-water prediction on held-out years at 37 stations.</p><p><b>Ecological memory: </b>reduced error in group-risk contrasts and exploratory regional holdouts, but did not improve individual fire classification.</p><p class="why">The value of history depends on the prediction target.</p>');
}

function stageFor(step){return mode==="fire"?step.kind:step.stage;}
const current=()=>deck[index];

const cue={
 atlas:["2012–2024 · Cross-continental evidence","Start with the study’s geographic coverage."],
 modis:["17–24 May 2022 · MODIS","Move from the sampling map to a separate satellite example: GPP and quality flags for the same scene."],
 landsat:["Jan 2019 · Landsat 8","Same footprint at two dates. The images illustrate change; the models were not fitted to them."],
 trace:["14 Jul–31 Aug 2022 · USCRN 03055","Satellite data describe the landscape; ground measurements let us check soil-water predictions."],
 "soil-bench":["2022–2024 · Held-year test at 37 stations","From one station trace to performance across all matched station-days."],
 ci11:["Back to 2012–2018 · Historical fire risk","A different target: group-level fire-risk differences between two stress orders."],
 groups:["2012–2018 · CI36 development groups","Compare two equal-size models against historical group estimates."],
 hold:["2012–2018 · Exploratory regional holdout","Hold out a region and distinguish error in magnitude from accuracy of the direction."],
 pr:["2012–2018 · CI16 event classification","Classifying individual fires is not the same task as estimating group differences."]
};
const mobileReduce=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const smooth=(v)=>{const p=Math.min(1,Math.max(0,v));return p*p*(3-2*p);};
function progress(){
 const a=current(), r=ratio(), total=deck.reduce((sum,z)=>sum+z.ms,0), before=deck.slice(0,index).reduce((sum,z)=>sum+z.ms,0);
 $("#tour-progress-label").textContent=a.label;
 $("#tour-progress-bar").style.width=100*(before+Math.min(elapsed,a.ms))/total+"%";
 $("#tour-count").textContent=(index+1)+" / "+deck.length;
 if(a.kind==="atlas"){
  const world=out.querySelector(".tour-world");
  if(world){
   const [x,y,w,h]=regions[a.i].box;
   const z=a.i===3&&!mobileReduce()?smooth((r-.18)/.61):0,k=1-z;
   world.style.setProperty("--zoom-a",z>.04?Math.min(1,z*2.1):0);
   world.style.setProperty("--zoom-clip","inset("+(k*y)+"% "+(k*(100-x-w))+"% "+(k*(100-y-h))+"% "+(k*x)+"%)");
   world.style.setProperty("--zoom-tag",z>.3?Math.min(1,(z-.3)*1.7):0);
  }
 } else if(a.kind==="modis"||a.kind==="landsat"){
  const value=Math.round(85-70*smooth((r-.17)/.64));
  const v=$("#tour-wipe");
  if(v){v.style.setProperty("--split",value+"%");$("#tour-wipe-range").value=value;$("#tour-wipe-value").textContent=value+"%";}
 } else if(a.kind==="trace"){
  renderSoilDay(Math.min(48,Math.floor(49*Math.min(1,r/.93))));
 } else if(a.kind==="soil-bench"&&lastDay===-1){
  renderSoilDay(48,true);
 }
}
function updateControls(){
 $("#tour-toggle").textContent=running?"Ⅱ Pause":ended?"▶ Replay":"▶ Play";
 $("#tour-toggle").setAttribute("aria-pressed",String(running));
 $("#tour-prev").disabled=index===0;
 $("#tour-next").disabled=index===deck.length-1;
}
function pause(){
 running=false;last=0;if(raf)cancelAnimationFrame(raf);raf=0;updateControls();
}
function render(resetScroll){
 const a=current(), beforeKind=renderedKind, same=beforeKind===a.kind;
 lastDay=-1;
 const options={atlas,modis:satellite,landsat:satellite,trace,"soil-bench":trace,ci11:coreFireFinding,groups:fireContrasts,hold:fireContrasts,pr:firePr};
 const next=document.createElement("template");next.innerHTML=options[a.kind](a);
 const swap=(selector)=>{
  let from=out.querySelector(selector), to=next.content.querySelector(selector);
  if(from&&to)from.replaceWith(to.cloneNode(true));
 };
 if(same&&a.kind==="atlas"){
   const old=out.querySelector(".tour-marker");
   const n=next.content.querySelector(".tour-marker");
   for(const k of ["left","top","width","height"])old.style[k]=n.style[k];
   swap(".tour-map-zoom");swap(".tour-map-zoom-label");swap(".tour-regions");swap(".tour-aside");
 }else if(same&&(a.kind==="groups"||a.kind==="hold")){
   swap(".tour-plot");swap(".tour-fire-current");swap(".tour-fire-values");swap(".tour-fire-errors");swap(".tour-aside");
 }else if(same&&a.kind==="pr"){
   swap(".tour-pr");
 }else if(beforeKind==="trace"&&a.kind==="soil-bench"){
   swap(".tour-opening");swap(".tour-aside");
 }else{
   out.replaceChildren(next.content);
   if(beforeKind && !mobileReduce()){
     const entering=out.querySelector(".tour-opening");
     const visual=out.querySelector(".tour-visual");
     entering.animate([{opacity:.6,transform:"translateY(6px)"},{opacity:1,transform:"translateY(0)"}],{duration:380,easing:"ease-out"});
     visual.animate([{opacity:.5,transform:"translateY(6px)"},{opacity:1,transform:"translateY(0)"}],{duration:540,easing:"cubic-bezier(.2,.65,.3,1)"});
     if(beforeKind==="atlas"&&a.kind==="modis"&&running){
      const bridge=document.createElement("img");
      bridge.src=asset("region-4");bridge.alt="";bridge.className="tour-bridge";
      out.querySelector(".tour-wipe").append(bridge);
      bridge.animate([{opacity:.78,transform:"scale(1.04)"},{opacity:0,transform:"scale(1)"}],{duration:640,easing:"ease-out"}).finished.then(()=>bridge.remove(),()=>bridge.remove());
     }
   }
 }
 renderedKind=a.kind;
 out.classList.toggle("is-synthesis",a.kind==="soil-bench"||(a.kind==="groups"&&a.i===11)||(a.kind==="hold"&&a.i===3)||(a.kind==="pr"&&a.split==="loro"));
 const previousLabel=$("#tour-time-period").textContent;
 const [yr,note]=cue[a.kind];
 if(previousLabel!==yr||$("#tour-time-note").textContent!==note){
  $("#tour-time-period").textContent=yr;
  $("#tour-time-note").textContent=note;
  if(!mobileReduce())$("#tour-time-note").animate([{opacity:.62},{opacity:1}],{duration:380});
 }
 for(const b of $$("#tour-tabs button")){
  if(stageFor(a)===b.dataset.stage)b.setAttribute("aria-current","step");else b.removeAttribute("aria-current");
 }
 if(resetScroll)body.scrollTop=0;
 const w=$("#tour-wipe-range");
 if(w)w.oninput=()=>{
  pause();
  const k=Number(w.value);
  // Invert the smooth wipe curve so resuming picks up at the visible divider.
  const target=(85-k)/70;let lo=0,hi=1;
  for(let i=0;i<18;i++){const m=(lo+hi)/2;if(smooth(m)<target)lo=m;else hi=m;}
  elapsed=a.ms*(.17+.64*(lo+hi)/2);
  $("#tour-wipe").style.setProperty("--split",k+"%");$("#tour-wipe-value").textContent=k+"%";
 };
 const day=$("#tour-day");
 if(day)day.oninput=()=>{
    pause();
    const i=+day.value;
    if(a.kind==="trace"){elapsed=a.ms*.93*(i+.01)/49;progress();}
    else {renderSoilDay(i,true);}
 };
 progress();updateControls();
}
function seek(i,autoplay=false){
 const previous=stageFor(current()); index=Math.min(deck.length-1,Math.max(0,i));
 elapsed=0;ended=false;
 if(!autoplay)pause();
 render(previous!==stageFor(current()) || !autoplay);
 if(!autoplay)$("#tour-status").textContent="Paused: "+current().label+", step "+(index+1)+"";
}
function tick(now){
 if(!running||!modal.open)return;
 if(!last)last=now;
 elapsed+=Math.min(now-last,250);last=now;
 progress();
 if(elapsed>=current().ms){
  if(index===deck.length-1){
    ended=true;pause();
    $("#tour-status").textContent="Tour complete. Replay or return to any step.";
    return;
  }
  seek(index+1,true);
 }
 raf=requestAnimationFrame(tick);
}
function go(){
 if(ended)seek(0);
 if(running)return;
 last=0;running=true;updateControls();
 $("#tour-status").textContent="Tour playing.";
 raf=requestAnimationFrame(tick);
}
function toggle(){if(running){pause();$("#tour-status").textContent="Tour paused.";}else go();}
function open(kind,autoplay,origin){
 mode=kind==="fire"?"fire":"full";deck=mode==="fire"?fireOnly:full;
 (mode==="fire"?FIRE:STAGES).forEach(part=>{if(!deck.some(a=>stageFor(a)===part))throw Error("missing tour stage");});
 pause();index=0;elapsed=0;ended=false;renderedKind=null;trigger=origin||null;
 $("#tour-heading").textContent=mode==="fire"?"Fire-model demonstration":"Research tour";
 const tabs=$("#tour-tabs");tabs.dataset.mode=mode;
 tabs.innerHTML=(mode==="fire"?FIRE:STAGES).map((k,i)=>`<button type="button" data-stage="${k}"><span>0${i+1}</span>${tabTitles[k]}</button>`).join("");
 for(const b of $$("button",tabs))b.addEventListener("click",()=>seek(deck.findIndex(s=>stageFor(s)===b.dataset.stage)));
 if(!modal.open)modal.showModal();
 modal.dispatchEvent(new Event("gaia:tour-start"));
 render(true);
 if(autoplay&&!matchMedia("(prefers-reduced-motion: reduce)").matches)go();
}
for(const b of $$("[data-tour]"))b.addEventListener("click",()=>open(b.dataset.tour,true,b));
$("#tour-close").addEventListener("click",()=>modal.close());
modal.addEventListener("close",()=>{pause();if(trigger)trigger.focus();});
$("#tour-toggle").addEventListener("click",toggle);
$("#tour-prev").addEventListener("click",()=>seek(index-1));
$("#tour-next").addEventListener("click",()=>seek(index+1));
$("#tour-restart").addEventListener("click",()=>{const was=running;seek(0);if(was)go();});
modal.addEventListener("keydown",e=>{
 if(e.target.matches("button,input,select,textarea,a"))return;
 if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();seek(index+(e.key==="ArrowRight"?1:-1));}
 if(e.code==="Space"){e.preventDefault();toggle();}
});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&running)pause();});
const requested=new URLSearchParams(location.search).get("tour");
if(requested==="full"||requested==="fire")open(requested,false);
})();
