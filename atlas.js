
(() => {
"use strict";
const D=window.GAIA_DATA;
const $=(s,e=document)=>e.querySelector(s), $$=(s,e=document)=>Array.from(e.querySelectorAll(s));
const num=(x,d=2)=>Number(x).toFixed(d).replace(/^-/, "−");
const signed=(x,d=2)=>(x>0?"+":"")+num(x,d);
const axisNum=(x,d=0)=>num(x,d);
const A=(file)=>"assets/"+file+".webp";
const dateShort=(date)=>new Date(date+"T12:00:00Z").toLocaleDateString("en-GB",{month:"short",day:"2-digit",timeZone:"UTC"});
const dash=(s)=>String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
function switches(id,attr,value){
 const el=$(id);
 for(const b of el.querySelectorAll("button["+attr+"]"))b.setAttribute("aria-pressed",String(b.getAttribute(attr)===String(value)));
}
function table(headers,rows){
 return '<div class="data-table-wrap"><table class="data-table"><thead><tr>'+headers.map(h=>'<th scope="col">'+dash(h)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map((v,i)=>i===0?'<th scope="row">'+dash(v)+'</th>':'<td>'+dash(v)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
const regions=[
 {name:"Western North America",n:"1,531",box:[12.8,22.1,10.7,16.0]},
 {name:"Mediterranean",n:"1,350",box:[46.3,21.1,16.0,20.0]},
 {name:"Southern Africa",n:"1,401",box:[50.7,64.0,12.6,19.5]},
 {name:"Southeastern Australia",n:"1,352",box:[82.9,71.0,12.5,17.5]},
];
$("#map-targets").innerHTML=regions.map((r,i)=>`<button type="button" class="map-target" data-region="${i}" style="--x:${r.box[0]}%;--y:${r.box[1]}%;--w:${r.box[2]}%;--h:${r.box[3]}%" aria-label="${r.name}, ${r.n} sampling sites" aria-pressed="false" title="${r.name}"></button>`).join("");
$("#region-strip").innerHTML=regions.map((r,i)=>`<button type="button" class="region" data-region="${i}" aria-pressed="false"><img src="${A("region-"+(i+1))}" alt="" width="680" height="355"><span><em>0${i+1}</em>${r.name}<small>${r.n} sites</small></span></button>`).join("");
function region(i,zoom=true){
 const r=regions[i];
 switches("#map-targets","data-region",i);switches("#region-strip","data-region",i);
 $("#region-readout").innerHTML=`<strong>${r.name}</strong> · ${r.n} sites in the CI18 climate sampling frame.`;
 if(zoom){
  const image=$("#focus-region-image");
  image.src=A("region-"+(i+1));image.alt=r.name+" zoom showing archived site coverage";
  $("#focus-region-name").textContent=r.name;
  $("#focus-region-description").textContent=r.n+" sites. Points are sampling strata. The map does not estimate fire risk.";
  $("#region-focus").hidden=false;
 }

}
for(const b of $$("[data-region]"))b.addEventListener("click",()=>region(+b.dataset.region));
region(0,false);
$("#close-region-zoom").addEventListener("click",()=>{$("#region-focus").hidden=true;$("#region-strip [aria-pressed=true]").focus();});
const eras=[
 ["2002–2011","Threshold reference","Climate observations set site-by-month heat and low-water thresholds. This is not a fire-outcome period."],
 ["2012–2018","Historical fire analysis","CI11: 964 completed histories in 243 blocks. These records support the core historical memory-quartile comparison."],
 ["2019–2024","Later measurements","Candidate histories and environmental measurements. The primary soil-water benchmark uses 2022–2024 held years."],
 ["2025","Coverage audit only","Input feasibility and design support were assessed without fire outcomes. This is not a fire result or an extension of CI11."],
];
$("#era-tabs").innerHTML=eras.map((e,i)=>`<button type="button" data-era="${i}" aria-pressed="false"><b>${e[0]}</b>${e[1]}</button>`).join("");
function era(i){const e=eras[i];switches("#era-tabs","data-era",i);$("#era-readout").innerHTML="<b>"+e[1]+".</b> "+e[2];}
for(const b of $$("[data-era]"))b.addEventListener("click",()=>era(+b.dataset.era));
era(1);

const scenes={
 modis:{n:6,prefix:"modis",left:"gpp",right:"qa",name:"Terra MODIS · h13v02",date:"17–24 MAY 2022",tags:["GPP · g C m⁻² / 8 d","MODLAND QA · bit 0"],rows:[["ctx","GPP context"],["gpp","GPP matched detail"],["qa","MODLAND QA"]],credit:"MOD17A2H.061. GPP ranges from 0 to 15+ g C m⁻² per 8 days in this display; teal is QA bit 0 = 0, amber is bit 0 = 1, dark is fill. One illustrative scene; the six windows are not separate study events."},
 landsat:{n:8,prefix:"landsat",left:"pre",right:"post",name:"Great Pine Tier · Tasmania",date:"LANDSAT 8 / JAN 2019",tags:["13 JAN · BEFORE","29 JAN · FIRE & BURN SCARS"],rows:[["ctx","Wider landscape context"],["pre","13 Jan · before"],["post","29 Jan · fire and burn scars"]],credit:"NASA/USGS Landsat 8 false colour. These 24 views are crops from two images, not independent observations or CI36/CI16 model events."}
};
let scene="modis",windowID=1;
const wipe=$("#wipe"), viewport=$("#compare-viewport");
function wipeAt(v){
 wipe.value=String(v);viewport.style.setProperty("--wipe",wipe.value+"%");
 wipe.setAttribute("aria-valuetext",wipe.value+" percent "+scenes[scene].tags[0].split(" · ")[0]+" visible");
}
function windowAt(k){
 const s=scenes[scene];windowID=k;
 $("#scene-top").src=A(`${s.prefix}-${s.left}-${k}`);
 $("#scene-base").src=A(`${s.prefix}-${s.right}-${k}`);
 $("#scene-top").alt=s.tags[0]+", window "+k;
 $("#scene-base").alt=s.tags[1]+", same footprint, window "+k;
 switches("#scene-thumbs","data-window",k);
 $("#scene-name").textContent=s.name+" · "+String(k).padStart(2,"0");
}
function sceneAt(k){
 scene=k;
 const s=scenes[k];
 switches("#scene-toggle","data-scene",k);
 $("#scene-date").textContent=s.date;$("#tag-left").textContent=s.tags[0];$("#tag-right").textContent=s.tags[1];$("#scene-credit").textContent=s.credit;
 $("#mosaic-title").textContent="Show all "+(s.n*3)+" archived views";
 $("#scene-thumbs").style.setProperty("--n",s.n);
 $("#scene-thumbs").innerHTML=Array.from({length:s.n},(_,i)=>`<button type="button" data-window="${i+1}" aria-label="Select window ${i+1}" aria-pressed="false"><img src="${A(`${s.prefix}-${s.left}-${i+1}`)}" alt="" width="100" height="66"><span>${String(i+1).padStart(2,"0")}</span></button>`).join("");
 $("#mosaic").style.setProperty("--n",s.n);
 $("#mosaic").innerHTML=s.rows.map(([type,label])=>'<div class="mosaic-caption">'+label+'</div>'+Array.from({length:s.n},(_,i)=>`<img src="${A(`${s.prefix}-${type}-${i+1}`)}" alt="${label}, window ${i+1}" loading="lazy" width="100" height="100">`).join("")).join("");
 for(const b of $$("[data-window]",$("#scene-thumbs")))b.addEventListener("click",()=>windowAt(+b.dataset.window));
 windowAt(1);wipeAt(50);
}
wipe.addEventListener("input",()=>wipeAt(+wipe.value));
for(const b of $$("[data-scene]"))b.addEventListener("click",()=>sceneAt(b.dataset.scene));
sceneAt("modis");
$("#veg-table").innerHTML='<div class="veg-list" role="group" aria-label="Select an indicator">'+D.veg.map(([name,e],i)=>`<button class="indicator" type="button" data-veg="${i}" aria-pressed="false"><strong>${name}</strong><span class="num ${e>=0?"pos":"neg"}">${signed(e,5)}</span></button>`).join("")+'</div><div id="veg-readout" class="indicator-readout" aria-live="polite"></div>';
function veg(i){const [name,e,lo,hi,n,b,what]=D.veg[i];switches("#veg-table","data-veg",i);$("#veg-readout").innerHTML=`<b>${what}</b> · ${n.toLocaleString("en-US")} episodes in ${b} blocks<br>95% interval [${signed(lo,5)}, ${signed(hi,5)}]`;}
for(const b of $$("[data-veg]"))b.addEventListener("click",()=>veg(+b.dataset.veg));
veg(2);

const svg=(w,h,title,content)=>`<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${dash(title)}">${content}</svg>`;
const ln=(x,y,a,b,stroke="#cecec7",width=1,attrs="")=>`<line x1="${x}" y1="${y}" x2="${a}" y2="${b}" stroke="${stroke}" stroke-width="${width}" ${attrs}/>`;
const tx=(x,y,val,fill="#576e62",align="start",size=12)=>`<text x="${x}" y="${y}" fill="${fill}" text-anchor="${align}" font-size="${size}">${dash(val)}</text>`;
const circle=(x,y,color,size=4.5)=>`<circle cx="${x}" cy="${y}" r="${size}" fill="${color}" />`;
const linepath=(ps,col,w=2,style="")=>`<polyline points="${ps.map(p=>p.join(",")).join(" ")}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${style}/>`;
const scale=(n0,n1,x0,x1)=>v=>x0+(v-n0)/(n1-n0)*(x1-x0);
function forest(series,min,max,ticks,label){
 const w=670,x0=141,x1=515,y0=24,dy=40,yB=y0+series.length*dy+3,h=yB+57,x=scale(min,max,x0,x1);
 let g=ticks.map(v=>ln(x(v),12,x(v),yB,v===0?"#a8c6bd":"#405a5d",1.1,v===0?'stroke-dasharray="4 3"':"")+tx(x(v),yB+20,axisNum(v),"#c2d3c9","middle",12)).join("");
 g+=series.map(([name,e,lo,hi],i)=>{
  const y=y0+dy*i+12,c=name.includes("Strict")?"#ecba88":e>=0?"#b9e3b2":"#8cc2dd";
  return tx(0,y+4,name,"#d5e2d7","start",12)+ln(x(lo),y,x(hi),y,c,2.1)+ln(x(lo),y-5,x(lo),y+5,c,1.5)+ln(x(hi),y-5,x(hi),y+5,c,1.5)+circle(x(e),y,c,5)+tx(w-2,y+4,signed(e)+" pp",c,"end",12);
 }).join("");
 g+=ln(x0,yB,x1,yB,"#6c817d")+tx((x0+x1)/2,yB+44,label,"#c4d6cc","middle",12);
 return svg(w,h,label,g);
}
function evidence(which){
 switches("#evidence-tabs","data-evidence",which);
 const ci=which==="ci11";
 const s=(ci?D.ci11:D.refits).map(([e,l,h],i)=>[ci?"Q"+(i+1)+"  ·  n = 241":["TMLE Early","TMLE Strict","Plug-in Early","Plug-in Strict","AIPW Early","AIPW Strict"][i],e,l,h]);
 $("#evidence-plot").innerHTML=ci?forest(s,-18,18,[-15,-10,-5,0,5,10,15],"Fire-risk contrast (percentage points)"):forest(s,-15,43,[-10,0,10,20,30,40],"Trend (percentage points per quartile)");
 $("#evidence-context").textContent=ci?"HEAT FIRST MINUS LOW SOIL WATER FIRST / 95% INTERVALS":"SIX ESTIMATES / 2,000 SPATIAL-BLOCK DRAWS / 95% INTERVALS";
 $("#evidence-table").innerHTML=table(["Estimate","Point","95% interval"],s.map(([l,e,a,b])=>[l,signed(e),`[${signed(a)}, ${signed(b)}]`]));
 $("#evidence-insight").innerHTML=ci?'<small>CI11 / HISTORICAL DEVELOPMENT</small><b class="insight-number">+4.11</b><p>Percentage points per memory quartile (95% interval, +0.53 to +8.18). The four estimates fell from Q1 to Q2 before rising.</p><p>964 episodes · 243 blocks · 600 resamples · 2012–2018</p>':'<small>COMPLETED-HISTORY REFITS</small><b class="insight-number">6 of 6</b><p>All trend intervals included zero. These are conditional associations under two measurement definitions, not the frozen first-stress contrast and not proof of a causal null.</p><p>Strict AIPW: 155/2,000 draws with one or more quartile estimates outside [−1, 1]; all retained.</p>';
}
for(const b of $$("[data-evidence]"))b.addEventListener("click",()=>evidence(b.dataset.evidence));
evidence("ci11");

const labels=["Measured","Monthly baseline","One-day rainfall","30-day memory"], colors=["#17302c","#758983","#356a99","#087e69"];
const on=[true,true,true,true];
const daySlider=$("#soil-day");
let soilTimer=null, soilReplay=false;
const playButton=$("#soil-play");
function playState(active){
 playButton.setAttribute("aria-pressed",String(active));
 playButton.innerHTML=active?'<span aria-hidden="true">Ⅱ</span> Pause replay':'<span aria-hidden="true">▶</span> Play 49-day trace';
 $("#soil-readout").setAttribute("aria-live",active?"off":"polite");
}
function stopSoil(clear=false){
 if(soilTimer!==null){clearInterval(soilTimer);soilTimer=null;}
 if(clear)soilReplay=false;
 playState(false);
}
function playSoil(restart=false){
 if(soilTimer!==null&&!restart){stopSoil();return;}
 if(restart)stopSoil(true);
 const i=+daySlider.value;
 soilReplay=true;
 soilDay(restart || i===48 ? 0 : i);
 playState(true);
 soilTimer=setInterval(()=>{
  const k=Number(daySlider.value)+1;
  if(k>48){stopSoil();$("#soil-demo-status").textContent="Replay complete · 49 archived days";return;}
  soilDay(k);
 },170);
}
playButton.addEventListener("click",()=>playSoil(!soilReplay));
$("#soil-reset").addEventListener("click",()=>{stopSoil(true);soilDay(0);});
window.addEventListener("pagehide",()=>stopSoil(true));
$("#soil-checks").innerHTML=labels.map((l,i)=>`<button class="curve-toggle" type="button" data-curve="${i}" aria-pressed="true"><i style="--dot:${colors[i]}"></i>${l}</button>`).join("");
for(const b of $$("[data-curve]"))b.addEventListener("click",()=>{const i=+b.dataset.curve;on[i]=!on[i];b.setAttribute("aria-pressed",String(on[i]));soilChart();});
function soilDay(i){
 daySlider.value=i;
 const q=D.trace[i];$("#soil-date").textContent=dateShort(q.date)+" 2022";
 $("#soil-readout").innerHTML=q.v.map((v,j)=>`<div><small>${labels[j]}</small><b><i style="--dot:${colors[j]}"></i>${num(v,4)}</b></div>`).join("")+`<div><small>Rainfall</small><b>${num(q.rain,1)} mm</b></div>`;
 const compare=+$("#bench-tabs [aria-pressed=true]").dataset.bench;
 const errors=q.v.slice(1).map(v=>Math.abs(v-q.v[0]));
 const delta=errors[compare]-errors[2];
 const situation=Math.abs(delta)<.00005?"matches the selected baseline":(delta>0?"is closer to the measurement by ":"is farther from the measurement by ")+num(Math.abs(delta),4)+" m³ m⁻³ versus the selected baseline";
 $("#soil-error-readout").textContent="On this day the 30-day model "+situation+". The benchmark uses all matched station-days.";
 $("#soil-demo-status").textContent=(soilReplay?"Replay · ":"Archived example · ")+"Day "+(i+1)+" of 49";
 soilChart();
}
daySlider.addEventListener("input",()=>{stopSoil(true);soilDay(+daySlider.value);});
function soilChart(){
 const w=750,h=292,x=scale(0,48,63,730),y=scale(.118,.207,245,95),maxRain=Math.max(...D.trace.map(q=>q.rain)), yRain=scale(0,maxRain,78,20);
 const i=+daySlider.value;
 let g=tx(63,13,"Rainfall (mm)","#537a72","start",12)+tx(63,92,"20 cm VWC (m³ m⁻³)","#537a72","start",12)+ln(63,78,730,78,"#c1cdc4");
 for(const q of [0,.5,1]){g+=tx(50,yRain(maxRain*q)+4,axisNum(maxRain*q),"#586f66","end",10);}
 g+=D.trace.map((row,j)=>`<rect x="${x(j)-3}" y="${yRain(row.rain)}" width="6" height="${78-yRain(row.rain)}" fill="#629db3" opacity="${j===i?1:.55}"/>`).join("");
 for(const t of [.12,.14,.16,.18,.20]){g+=ln(62,y(t),730,y(t),"#d4ddd1")+tx(52,y(t)+3,num(t,2),"#526c63","end",11);}
 g+=on.map((show,j)=>show?linepath(D.trace.slice(0,soilReplay?i+1:D.trace.length).map((r,k)=>[x(k),y(r.v[j])]),colors[j],j===0||j===3?2.3:1.7,j===1?'stroke-dasharray="6 3"':j===2?'stroke-dasharray="2 3"':""):"").join("");
 g+=ln(x(i),21,x(i),246,"#337d6d",1,'stroke-dasharray="3 4"');
 for(let j=0;j<on.length;j++)if(on[j])g+=circle(x(i),y(D.trace[i].v[j]),colors[j],4.5);
 g+=ln(62,247,730,247,"#a6b9ad");
 for(const j of [0,10,20,30,40,48])g+=tx(x(j),266,dateShort(D.trace[j].date),"#526c63",j===48?"end":"middle",11);
 $("#soil-plot").innerHTML=svg(w,h,"USCRN 03055: daily rainfall, observed volumetric soil water and archived predictions, 14 July to 31 August 2022",g);
}
$("#soil-plot").addEventListener("click",(e)=>{
 const s=$("#soil-plot svg");const r=s.getBoundingClientRect();const a=(e.clientX-r.left)/r.width*750;
 stopSoil(true);soilDay(Math.max(0,Math.min(48,Math.round((a-63)*48/667))));
});
soilDay(21);
function bars(values,names,col,max,d){
 return '<div class="bar-list">'+values.map((v,i)=>`<div class="bar-row"><span>${names[i]}</span><strong>${num(v,d)}</strong><div class="bar-track"><i style="--bar:${col[i]};--len:${Math.min(100,v/max*100)}%"></i></div></div>`).join("")+'</div>';
}
function benchmark(index){
 switches("#bench-tabs","data-bench",index);
 const rmse=D.stationSummary[0],gain=100*(rmse[index]-rmse[2])/rmse[index];
 $("#bench-readout").innerHTML="<strong>"+num(gain,1)+"% lower RMSE</strong><span>0.06228 vs "+num(rmse[index],5)+" m³ m⁻³ · "+labels[index+1]+"</span>";
 soilDay(+daySlider.value);
}
for(const b of $$("[data-bench]"))b.addEventListener("click",()=>benchmark(+b.dataset.bench));
benchmark(0);
$("#soil-summary").innerHTML=bars(D.stationSummary[0],labels.slice(1),colors.slice(1),.08,5)+'<p class="micro">Equal-station RMSE · m³ m⁻³ · lower is better</p><details><summary>Compare gains by held year</summary>'+table(["Year","vs monthly","vs one-day"],D.stationSummary[1].map((y,i)=>[2022+i,num(y[0]),num(y[1])]))+'<p class="micro">MSE gain ×10⁻³; larger values indicate less error than the comparator.</p></details>';
{
 const w=750,h=174,x=scale(0,89,56,731),y=scale(0,1,136,19);
 let g=[0,.5,1].map(v=>ln(57,y(v),731,y(v),"#d2dcd0")+tx(48,y(v)+4,num(v,1),"#527264","end",11)).join("");
 const m=Math.max(...D.kernel.map(r=>r.rain));
 g+=D.kernel.map((r,i)=>`<rect x="${x(i)-2}" y="${136-48*r.rain/m}" width="4" height="${48*r.rain/m}" fill="#8cb2bd" opacity=".7"/>`).join("");
 g+=linepath(D.kernel.map((r,i)=>[x(i),y(r.k[0])]),colors[2],2,'stroke-dasharray="3 2"');
 g+=linepath(D.kernel.map((r,i)=>[x(i),y(r.k[1])]),colors[3],2);
 g+=tx(57,13,"Weight (rainfall bars scaled for display)","#557d71","start",11)+tx(730,12,"1 day / 30 day","#255f52","end",11);
 for(const [i,t] of [[0,"−90 days"],[29,"−61"],[59,"−31"],[89,"−1 day"]])g+=tx(x(i),156,t,"#526c63",i===89?"end":"middle",11);
 $("#kernel-plot").innerHTML=svg(w,h,"Exponentially decaying weights for one-day and thirty-day rainfall history",g);
}
const fireColors=["#162f35","#0a8071","#3f6d9e"];
const fireLeg='<div class="curve-switches" aria-label="Legend">'+["Observed contrast","Memory model","State model"].map((l,i)=>`<span class="curve-toggle"><i style="--dot:${fireColors[i]}"></i>${l}</span>`).join("")+'</div>';
function fireChart(rows,active){
 const big=rows.length>4;
 const w=750,h=big?276:244,x=scale(0,rows.length-1,82,709),min=big?-12:-6,max=big?11:4,y=scale(min,max,h-45,14);
 let g=(big?[-10,-5,0,5,10]:[-6,-4,-2,0,2,4]).map(v=>ln(54,y(v),731,y(v),v===0?"#78958c":"#d1dbcf",1,v===0?'stroke-dasharray="4 3"':"")+tx(46,y(v)+4,axisNum(v),"#4d6a5e","end",11)).join("");
 if(active>=0){g+=ln(x(active),14,x(active),h-45,"#89af9d",1,'stroke-dasharray="3 3"');}
 g+=rows.map((r,i)=>r.v.map((v,j)=>`<g>${circle(x(i)+(j-1)*8,y(v),fireColors[j],5)}<title>${r.label}: ${["observed","memory","state"][j]} ${signed(v)} percentage points</title></g>`).join("")+tx(x(i),h-22,r.label,"#4b665e","middle",big?10:12)).join("");
 g+=tx(55,12,"Risk difference (pp)","#4b665e","start",11);
 return svg(w,h,"Observed and model-predicted archived fire-risk contrasts",g);
}
let split="spatial";
function pr(){
 const options={spatial:[.162,.171,.194],loro:[.145,.177,.167]}, is=split==="spatial";
 $("#pr-content").innerHTML='<div class="pr-grid"><figure><img src="'+A("pr-"+split)+'" alt="Archived CI16 precision–recall curves '+(is?"for spatial cross-validation":"for leave-region-out validation")+'"><figcaption>Archived CI16 curves. 964 historical episodes; 154 fire positives.</figcaption></figure><div>'+bars(options[split],["Dynamic memory","State + order","Weather + order"],[colors[3],colors[2],"#a26b30"],.2,3)+'<p class="micro">PR-AUC. Paired memory − state + order: <b>'+(is?"−0.009 [−0.046, +0.025]":"−0.031 [−0.071, −0.003]")+'</b>.</p></div></div>';
 switches("#pr-choice","data-split",split);
}
function fireMode(which){
 switches("#fire-modes","data-fire",which);
 const view=$("#fire-viz"),story=$("#fire-story");
 if(which==="pr"){
  view.innerHTML='<div class="seg" id="pr-choice" role="group" aria-label="Validation partition"><button type="button" data-split="spatial">Spatial CV</button><button type="button" data-split="loro">Leave region out</button></div><div id="pr-content"></div>';
  for(const b of $$("[data-split]"))b.addEventListener("click",()=>{split=b.dataset.split;pr();});pr();
  story.innerHTML='<p class="eyebrow">INDIVIDUAL TARGET / CI16</p><h3>Not a gain in fire classification.</h3><p>Adding dynamic memory did not improve individual-event ranking over state plus order. This is a different target from estimating the size of a group contrast.</p>';
  return;
 }
 const g=which==="groups",rows=g?D.groups:D.loro;
 view.innerHTML='<p class="fire-label">'+(g?'CI36 V2 / FOUR MEMORY QUARTILES × THREE FUEL TERTILES':'FOUR REGIONAL CONTRASTS / SAME RIDGE PENALTY, DIFFERENT FEATURES')+'</p>'+fireLeg+'<div class="chart-mount">'+fireChart(rows)+'</div><details><summary>Read the model values</summary>'+table(g?["Group","Episodes","Observed pp","Memory pp","State pp"]:["Region","Observed pp","Memory pp","State pp"],rows.map(r=>[r.label,...(g?[r.n]:[]),...r.v.map(v=>signed(v))]))+'</details>';
 const namesHere=rows.map(r=>r.label);
 const field=document.createElement("div");field.className="fire-inspection";
 field.innerHTML='<label>Inspect '+(g?'a group':'a held-out region')+' <select id="group-choice">'+namesHere.map((name,i)=>'<option value="'+i+'">'+name+'</option>').join("")+'</select></label><div id="group-readout" aria-live="polite"></div>';
 view.insertBefore(field,view.querySelector("details"));
 const sel=$("#group-choice");
 function update(k){
  const {label,n,v}=rows[k], em=Math.abs(v[1]-v[0]),es=Math.abs(v[2]-v[0]);
  view.querySelector(".chart-mount").innerHTML=fireChart(rows,k);
  $("#group-readout").innerHTML='<b>'+label+'</b>'+ (n?(' · '+n+' episodes'):'')+' · observed <b>'+signed(v[0])+' pp</b><br>Absolute prediction error: memory <b>'+num(em)+' pp</b> · state <b>'+num(es)+' pp</b>';
 }
 sel.addEventListener("change",()=>update(+sel.value));update(0);
 story.innerHTML=g?'<p class="eyebrow">GROUP TARGET / CI36 V2</p><h3>Better fits at equal model size.</h3><p>Both models used five parameters. The memory model combined physiological and structural memory, initial fuel and a memory × fuel term.</p>'+bars([.0243,.0273],["Memory","State only"],[colors[3],colors[2]],.03,4)+'<p class="micro">Weighted development RMSE. CI37 provided no independent cell-level score.</p>':'<p class="eyebrow">EXPLORATORY / FOUR HELD REGIONS</p><h3>Lower error in magnitude.</h3><p>Each region was predicted from the other three. Both models predicted the correct direction in just <b>1 of 4</b> regions.</p>'+bars([3.09,3.65],["Memory","State only"],[colors[3],colors[2]],4,2)+'<p class="micro">RMSE in percentage points. This coarser target is not independent validation of the original CI36 groups. SEA is an archive code.</p>';
}
for(const b of $$("[data-fire]"))b.addEventListener("click",()=>fireMode(b.dataset.fire));
fireMode("groups");
function lab(k){
 switches("#lab-tabs","data-lab",k);
 $("#lab-soil").hidden=k!=="soil";$("#lab-fire").hidden=k!=="fire";
 if(k!=="soil")stopSoil(true);
}
for(const b of $$("[data-lab]"))b.addEventListener("click",()=>lab(b.dataset.lab));
document.getElementById("research-tour").addEventListener("gaia:tour-start",()=>stopSoil(true));
const dialog=$("#summary-dialog");
$("#summary-open").addEventListener("click",()=>dialog.showModal());
$(".dialog-close",dialog).addEventListener("click",()=>dialog.close());
$("#overview-go").addEventListener("click",()=>dialog.close());
dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});
})();
