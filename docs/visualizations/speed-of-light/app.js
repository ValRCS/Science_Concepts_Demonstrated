"use strict";

// A single pedagogical model drives all four levels. No historical measurements
// or real Io ephemerides are loaded. Model distances are AU, times are seconds.
const C_KM_S = 299792.458; // exact SI definition
const AU_KM = 149597870.7; // exact IAU astronomical unit
const ROMER_KM_S = 2 * AU_KM / (22 * 60); // retrospective using today's AU
const EARTH_YEAR_D = 365.25;
const DEFAULTS = Object.freeze({R:5.2, period:1.769, speedRatio:.75});
const SVG_NS = "http://www.w3.org/2000/svg";
const $ = id => document.getElementById(id);
const $$ = selector => Array.from(document.querySelectorAll(selector));
const state = {
  level:1, angle:0, R:DEFAULTS.R, period:DEFAULTS.period,
  speedRatio:DEFAULTS.speedRatio, comparison:"instant", chartMode:"cumulative",
  sampleCount:24, noise:30, distanceBias:0, seed:314159,
  elapsed:0, playing:false, frame:0, lastTime:0, delivered:false,
  reducedMotion:false, samples:[], fit:null
};

function clamp(x,a,b){return Math.min(b,Math.max(a,x));}
function distanceAU(deg, R=state.R){
  const theta=deg*Math.PI/180;
  return Math.sqrt(R*R+1-2*R*Math.cos(theta));
}
function travelSeconds(angle, speed=C_KM_S, R=state.R){
  return distanceAU(angle,R)*AU_KM/speed;
}
function excessSeconds(angle, speed=C_KM_S, R=state.R){
  return (distanceAU(angle,R)-(R-1))*AU_KM/speed;
}
function intervalSeconds(angle, speed=C_KM_S, R=state.R, period=state.period){
  const step=360*period/EARTH_YEAR_D;
  return (distanceAU(angle+step,R)-distanceAU(angle,R))*AU_KM/speed;
}
function comparisonSpeed(){
  if(state.comparison==="instant")return Infinity;
  if(state.comparison==="romer")return ROMER_KM_S;
  return state.speedRatio*C_KM_S;
}
function compareValue(angle){
  const speed=comparisonSpeed();
  if(speed===Infinity)return 0;
  return state.chartMode==="interval"
    ? intervalSeconds(angle,speed)
    : excessSeconds(angle,speed);
}
function svg(tag,attr={},content){
  const e=document.createElementNS(SVG_NS,tag);
  for(const [k,v] of Object.entries(attr))e.setAttribute(k,String(v));
  if(content!==undefined)e.textContent=content;
  return e;
}
function append(group,tag,attr={},content){
  const node=svg(tag,attr,content);
  group.appendChild(node);
  return node;
}
function fmt(value,places=1){
  return value.toLocaleString("en-US",{minimumFractionDigits:places,maximumFractionDigits:places});
}
function whole(value){return Math.round(value).toLocaleString("en-US");}
function minuteClock(seconds){
  const n=Math.max(0,Math.round(seconds));
  return Math.floor(n/60)+" min "+String(n%60).padStart(2,"0")+" s";
}
function detailedTime(seconds){
  if(seconds < 1e-6)return fmt(seconds*1e9,3)+" nanoseconds";
  if(seconds < .001)return fmt(seconds*1e6,3)+" microseconds";
  if(seconds < 1)return fmt(seconds*1e3,3)+" milliseconds";
  if(seconds < 60)return fmt(seconds,3)+" seconds";
  if(seconds < 3600)return minuteClock(seconds);
  if(seconds < 86400)return fmt(seconds/3600,3)+" hours";
  if(seconds < EARTH_YEAR_D*86400)return fmt(seconds/86400,3)+" days";
  return fmt(seconds/(EARTH_YEAR_D*86400),3)+" Julian years";
}
function setText(id,value){$(id).textContent=String(value);}

function signalDestination(){
  // Scale visual path length in proportion to physical travel time at c.
  // Maximum (far-side) separation occupies a 360 px track.
  return 90+360*distanceAU(state.angle)/(state.R+1);
}
function drawSignal(){
  const panel=$("signal-scene");
  panel.replaceChildren();
  append(panel,"rect",{x:0,y:0,width:520,height:238,rx:16,fill:"#091a30"});
  for(let i=0;i<21;i++)append(panel,"circle",{cx:14+(i*79)%488,cy:12+(i*53)%213,r:i%4===0?1.9:1.1,fill:"#b9cce3",opacity:.45});
  const target=signalDestination();
  const total=travelSeconds(state.angle);
  const fraction=clamp(state.elapsed/total,0,1);
  const px=90+(target-90)*fraction;
  // The source represents a change in Io's received light, not photons
  // travelling directly from the eclipsed satellite.
  append(panel,"circle",{cx:45,cy:112,r:29,fill:"#c89972",stroke:"#e8c2a1","stroke-width":2});
  for(const dy of [-13,4,18])append(panel,"path",{d:"M 19 "+(112+dy)+" Q 45 "+(117+dy)+" 70 "+(112+dy),fill:"none",stroke:"#8c624e","stroke-width":4,opacity:.8});
  const eclipseStarted=state.playing||state.elapsed>0||state.delivered;
  append(panel,"circle",{cx:77,cy:112,r:5.8,fill:eclipseStarted?"#253347":"#f0ecce",stroke:"#d7d8c6","stroke-width":1.2});
  append(panel,"text",{x:91,y:63,class:"label-small"},eclipseStarted?"Io enters shadow":"Io is bright");
  append(panel,"path",{d:"M 82 94 l 10 -12 v 58 l -10 -13 Z",fill:"#57728f",opacity:.55});
  append(panel,"line",{x1:90,y1:112,x2:target,y2:112,stroke:"#476786","stroke-width":5,"stroke-linecap":"round"});
  append(panel,"line",{x1:90,y1:112,x2:px,y2:112,stroke:"#7de6da","stroke-width":5,"stroke-linecap":"round"});
  append(panel,"circle",{cx:target,cy:112,r:22,fill:"#419ac9",stroke:"#a8e8fc","stroke-width":3});
  append(panel,"path",{d:"M "+(target-13)+" 109 l 12 -15 8 5 -3 10 -11 11 z",fill:"#68be94"});
  if(state.elapsed>0){
    append(panel,"circle",{cx:px,cy:112,r:8.5,fill:"#ffe1a1",stroke:"#fff5d3","stroke-width":2});
    append(panel,"circle",{cx:px,cy:112,r:16,fill:"none",stroke:"#ffe1a1","stroke-width":1.5,opacity:.45});
  }
  if(state.delivered)append(panel,"circle",{cx:target,cy:112,r:29,stroke:"#ffe1a1","stroke-width":3,fill:"none"});
  append(panel,"text",{x:45,y:160,"text-anchor":"middle",class:"label-large"},"Jupiter");
  append(panel,"text",{x:77,y:74,"text-anchor":"middle",class:"label-small"},"Io");
  append(panel,"text",{x:target,y:160,"text-anchor":"middle",class:"label-large"},"Earth");
  append(panel,"text",{x:(90+target)/2,y:81,"text-anchor":"middle",class:"label-small"},state.angle===0?"Shorter trip":state.angle===180?"Longer trip":"Changing trip");
  append(panel,"text",{x:16,y:25,class:"label-small"},"Io eclipse at Jupiter");
  append(panel,"text",{x:16,y:218,class:"label-small"},state.delivered?"Earth has received the eclipse signal":"Earth sees the event only after arrival");
  const caption=state.delivered?"Signal has arrived after "+minuteClock(total)
    :state.playing?"Signal moving toward Earth · simulated time "+minuteClock(state.elapsed)
    :"Waiting · one-way journey takes "+minuteClock(total);
  panel.setAttribute("aria-label","Jupiter and Earth separated by "+fmt(distanceAU(state.angle),2)+" AU. "+caption+".");
  setText("clock-readout",minuteClock(state.elapsed));
}
function drawOrbit(){
  const view=$("orbit-svg");
  view.replaceChildren();
  append(view,"rect",{x:0,y:0,width:700,height:290,rx:15,fill:"#091a30"});
  const cx=184,cy=141,er=104,jx=579,jy=141;
  const rad=state.angle*Math.PI/180;
  const ex=cx+er*Math.cos(rad),ey=cy-er*Math.sin(rad);
  append(view,"circle",{cx,cy,r:er,fill:"none",stroke:"#7992b3","stroke-width":2,"stroke-dasharray":"8 7"});
  append(view,"line",{x1:cx,y1:cy,x2:jx,y2:jy,stroke:"#345d7b","stroke-dasharray":"5 9"});
  append(view,"line",{x1:ex,y1:ey,x2:jx,y2:jy,stroke:"#7de6da","stroke-width":3});
  append(view,"circle",{cx,cy,r:24,fill:"#ffd179",stroke:"#fff0c1","stroke-width":2});
  append(view,"circle",{cx:jx,cy:jy,r:31,fill:"#cb9570",stroke:"#ecc4a4","stroke-width":2});
  for(const d of [-13,1,13])append(view,"path",{d:"M "+(jx-24)+" "+(jy+d)+" Q "+jx+" "+(jy+d+7)+" "+(jx+24)+" "+(jy+d),fill:"none",stroke:"#936d56","stroke-width":3.5});
  append(view,"circle",{cx:ex,cy:ey,r:14,fill:"#409dc9",stroke:"#aceafa","stroke-width":2});
  append(view,"text",{x:cx,y:cy+45,"text-anchor":"middle",class:"label-large"},"Sun");
  append(view,"text",{x:jx,y:jy-46,"text-anchor":"middle",class:"label-large"},"Jupiter");
  append(view,"text",{x:ex,y:ey-22,"text-anchor":"middle",class:"label-large"},"Earth");
  append(view,"text",{x:cx,y:cy+er+31,"text-anchor":"middle",class:"label-small"},"Circular Earth orbit (1 AU)");
  append(view,"text",{x:498,y:244,class:"label-small"},"Jupiter fixed: "+fmt(state.R,1)+" AU");
  append(view,"text",{x:20,y:27,class:"label-small"},"Top-down schematic · θ = "+Math.round(state.angle)+"°");
  append(view,"text",{x:510,y:275,class:"label-small"},"Signal path: "+fmt(distanceAU(state.angle),2)+" AU");
}
function drawLine(view,data,color,dashed=false){
  const p=data.map(([x,y])=>fmt(x,2)+","+fmt(y,2)).join(" ");
  const attrs={points:p,fill:"none",stroke:color,"stroke-width":3.4,"stroke-linejoin":"round","stroke-linecap":"round"};
  if(dashed)attrs["stroke-dasharray"]="9 7";
  view.appendChild(svg("polyline",attrs));
}
function drawTimingPlot(){
  const plot=$("timing-plot");
  plot.replaceChildren();
  append(plot,"rect",{x:0,y:0,width:760,height:320,rx:14,fill:"#091a30"});
  const interval=state.chartMode==="interval";
  const cValue=a=>interval?intervalSeconds(a):excessSeconds(a)/60;
  const other=a=>compareValue(a)/(interval?1:60);
  const xs=Array.from({length:121},(_,i)=>i*3);
  const values=xs.flatMap(a=>[cValue(a),other(a)]);
  let lo=Math.min(0,...values),hi=Math.max(0,...values);
  if(interval){const d=Math.max(Math.abs(lo),Math.abs(hi),.5)*1.15;lo=-d;hi=d;}
  else{hi=Math.max(hi,1)*1.12;lo=0;}
  const left=73,right=734,top=24,bottom=267;
  const x=a=>left+(right-left)*a/360;
  const y=v=>bottom-(v-lo)/(hi-lo)*(bottom-top);
  for(let i=0;i<=4;i++){
    const v=lo+(hi-lo)*i/4,py=y(v);
    append(plot,"line",{x1:left,y1:py,x2:right,y2:py,stroke:"#2c4965"});
    append(plot,"text",{x:left-9,y:py+5,"text-anchor":"end",class:"axis-text"},fmt(v,interval?1:0));
  }
  for(let a=0;a<=360;a+=60){
    append(plot,"line",{x1:x(a),y1:top,x2:x(a),y2:bottom,stroke:"#27415b","stroke-dasharray":"4 8"});
    append(plot,"text",{x:x(a),y:bottom+22,"text-anchor":"middle",class:"axis-text"},a+"°");
  }
  append(plot,"text",{x:15,y:19,class:"axis-text"},interval?"seconds":"minutes");
  append(plot,"text",{x:(left+right)/2,y:310,"text-anchor":"middle",class:"axis-text"},"Earth orbital angle");
  drawLine(plot,xs.map(a=>[x(a),y(cValue(a))]),"#76e3d9");
  drawLine(plot,xs.map(a=>[x(a),y(other(a))]),"#ffb181",true);
  append(plot,"line",{x1:x(state.angle),y1:top,x2:x(state.angle),y2:bottom,stroke:"#ffd68c","stroke-width":2,opacity:.75});
  append(plot,"circle",{cx:x(state.angle),cy:y(cValue(state.angle)),r:7.5,fill:"#ffd68c",stroke:"#162a43","stroke-width":2.5});
  append(plot,"circle",{cx:x(state.angle),cy:y(other(state.angle)),r:5.5,fill:"#ffb181",stroke:"#162a43","stroke-width":2});
  const kind=interval?"change in arrival time between successive Io-like clock ticks":"cumulative extra light travel time relative to Earth's nearest position";
  plot.setAttribute("aria-label","Model-generated graph of "+kind+". The current point is at "+Math.round(state.angle)+" degrees.");
  setText("chart-description",interval
    ?"Model-generated change in one observed clock interval, in seconds. It can be positive or negative. These are not actual eclipse observations."
    :"Cumulative one-way travel-time difference relative to Earth's nearest modeled position, in minutes. This is not the delay in any single eclipse interval.");
  const angle=state.angle,base=interval?intervalSeconds(angle):excessSeconds(angle)/60;
  const compare=other(angle);
  setText("timing-feedback",interval
    ?"Here the next observed eclipse interval differs from the intrinsic period by "+fmt(base,2)+" seconds (modern c). Positive means it appears later; negative means earlier."
    :"At "+Math.round(angle)+"°, the extra arrival time is "+fmt(base,2)+" minutes with modern c; the selected comparison predicts "+fmt(compare,2)+" minutes.");
}

function renderReadouts(){
  setText("angle-value",Math.round(state.angle)+"°");
  setText("earth-distance",fmt(distanceAU(state.angle),3)+" AU");
  setText("light-time",minuteClock(travelSeconds(state.angle)));
  setText("extra-delay",minuteClock(excessSeconds(state.angle)));
  const correction=intervalSeconds(state.angle);
  setText("clock-drift",(correction>=0?"+":"")+fmt(correction,2)+" s");
  setText("jupiter-value",fmt(state.R,1)+" AU");
  setText("period-value",fmt(state.period,3)+" days");
  setText("speed-value",fmt(state.speedRatio,2)+" c");
  $$("[data-position]").forEach(b=>b.setAttribute("aria-pressed",String((b.dataset.position==="near") === (state.angle===0))));
}
function renderAll(){
  renderReadouts();
  drawSignal();
  drawOrbit();
  drawTimingPlot();
  renderJourney();
  generateResearch();
}
function stopSignal(){
  if(state.playing)cancelAnimationFrame(state.frame);
  state.playing=false;
  $("run-signal").textContent=state.elapsed>0&&!state.delivered?"▶ Continue signal":"▶ Send the eclipse signal";
  $("run-signal").setAttribute("aria-pressed","false");
}
function resetSignal(){
  stopSignal();
  state.elapsed=0;
  state.delivered=false;
  setText("signal-status","Ready: Io's eclipse happens at Jupiter. Send the signal to find out when Earth sees it.");
  drawSignal();
}
function completeSignal(){
  stopSignal();
  state.elapsed=travelSeconds(state.angle);
  state.delivered=true;
  setText("signal-status","Arrival! Earth sees the eclipse after "+minuteClock(state.elapsed)+". Moving Earth farther away changes when we SEE it, not when it HAPPENED at Jupiter.");
  drawSignal();
}
function tick(time){
  if(!state.playing)return;
  const dt=clamp(time-state.lastTime,0,120);
  state.lastTime=time;
  // 400 simulated seconds per real second. Playback time, not physical c.
  state.elapsed=Math.min(travelSeconds(state.angle),state.elapsed+dt*.4);
  if(state.elapsed>=travelSeconds(state.angle)){
    completeSignal();
    return;
  }
  drawSignal();
  state.frame=requestAnimationFrame(tick);
}
function runSignal(){
  if(state.delivered)resetSignal();
  if(state.reducedMotion){completeSignal();return;}
  if(state.playing){stopSignal();setText("signal-status","Paused. Continue the same journey or show the arrival.");return;}
  state.playing=true;
  state.lastTime=performance.now();
  $("run-signal").textContent="Ⅱ Pause signal";
  $("run-signal").setAttribute("aria-pressed","true");
  setText("signal-status","The eclipse has happened. Its change in light is on the way to Earth…");
  state.frame=requestAnimationFrame(tick);
}
function setAngle(value){
  resetSignal();
  state.angle=clamp(Number(value)||0,0,360);
  $("earth-angle").value=String(Math.round(state.angle));
  renderAll();
}
function setLevel(n,focus=false){
  n=clamp(Number(n),1,4);
  stopSignal();
  state.level=n;
  document.body.dataset.activeLevel=String(n);
  const tabs=$$("[data-level]");
  tabs.forEach(b=>{
    const active=Number(b.dataset.level)===n;
    b.setAttribute("aria-selected",String(active));
    b.tabIndex=active?0:-1;
    $("level-"+b.dataset.level).hidden=!active;
    if(active&&focus)b.focus();
  });
  const option=$("comparison-model").querySelector('option[value="hypothetical"]');
  if(option)option.disabled=n<3;
  if(n<3&&state.comparison==="hypothetical"){
    state.comparison="instant";
    $("comparison-model").value="instant";
  }
  if(n<3){
    state.chartMode="cumulative";
    $("chart-mode").value="cumulative";
  }
  if(n===1 && state.angle!==0 && state.angle!==180){
    state.angle=state.angle>=90&&state.angle<=270?180:0;
    $("earth-angle").value=String(state.angle);
    resetSignal();
  }
  renderAll();
}

function renderJourney(){
  const chosen=$("journey").value;
  const custom=chosen==="custom";
  $("custom-km").disabled=!custom;
  const km=custom?Number($("custom-km").value):Number(chosen);
  if(!Number.isFinite(km)||km<0||km>1e13||(custom&&$("custom-km").value.trim()==="")){
    setText("journey-time","Enter a distance from 0 to 10 trillion km");
    setText("journey-equation","Distance must be a nonnegative number in kilometres.");
    setText("journey-explanation","Enter a valid distance to calculate light-time.");
    return;
  }
  const seconds=km/C_KM_S;
  setText("journey-time",detailedTime(seconds));
  setText("journey-equation",km.toLocaleString("en-US",{maximumSignificantDigits:12})+" km ÷ "+C_KM_S.toLocaleString("en-US",{maximumFractionDigits:3})+" km/s");
  setText("journey-explanation",chosen==="9460730472580.8"
    ?"One light-year is a distance; light takes one Julian year (365.25 days) to cross it."
    :chosen==="384400"?"The Moon's distance varies; a round-trip radar/laser pulse takes about twice as long."
    :chosen==="149597870.7"?"Sunlight takes about 8 minutes and 19 seconds to travel 1 AU."
    :"This is an idealized one-way vacuum travel time, not an animation running in real time.");
}

function seededRandom(seed){
  let a=seed>>>0;
  return function(){
    a=(a+0x6D2B79F5)>>>0;
    let t=a;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}
function normalRandom(random){
  return Math.sqrt(-2*Math.log(Math.max(1e-12,random())))*Math.cos(2*Math.PI*random());
}
function syntheticObservations(n=state.sampleCount, noise=state.noise, biasPercent=state.distanceBias, seed=state.seed, R=state.R){
  const random=seededRandom(seed);
  return Array.from({length:n},(_,i)=>{
    const angle=360*i/(n-1);
    const x=excessSeconds(angle,C_KM_S,R);
    // The 30-second clock offset is a fitted nuisance parameter.
    const observed=30+(1+biasPercent/100)*x+noise*normalRandom(random);
    return {angle,x,observed};
  });
}
function fitTiming(data){
  const n=data.length;
  const xmean=data.reduce((s,p)=>s+p.x,0)/n;
  const ymean=data.reduce((s,p)=>s+p.observed,0)/n;
  const sxx=data.reduce((s,p)=>s+(p.x-xmean)**2,0);
  const sxy=data.reduce((s,p)=>s+(p.x-xmean)*(p.observed-ymean),0);
  const slope=sxy/sxx;
  const intercept=ymean-slope*xmean;
  const sse=data.reduce((s,p)=>s+(p.observed-intercept-slope*p.x)**2,0);
  const instantSse=data.reduce((s,p)=>s+(p.observed-ymean)**2,0);
  const standardSlope=Math.sqrt((sse/(n-2))/sxx);
  const inferredSpeed=slope>0?C_KM_S/slope:NaN;
  const speedError=slope>0?C_KM_S*standardSlope/(slope*slope):NaN;
  return {n,xmean,ymean,slope,intercept,sse,instantSse,standardSlope,inferredSpeed,speedError,rmse:Math.sqrt(sse/n),instantRmse:Math.sqrt(instantSse/n)};
}
function plotResearch(data,fit){
  const view=$("research-plot");
  view.replaceChildren();
  append(view,"rect",{x:0,y:0,width:760,height:330,rx:14,fill:"#091a30"});
  const samples=Array.from({length:121},(_,i)=>i*3);
  const predict=angle=>fit.intercept+fit.slope*excessSeconds(angle);
  const allY=[...data.map(p=>p.observed),...samples.map(predict),fit.ymean];
  let minY=Math.min(...allY), maxY=Math.max(...allY);
  const margin=Math.max((maxY-minY)*.10,10);
  minY-=margin;maxY+=margin;
  const left=76,right=734,top=25,bottom=272;
  const x=a=>left+a/360*(right-left);
  const y=v=>bottom-(v-minY)/(maxY-minY)*(bottom-top);
  for(let i=0;i<=4;i++){
    const py=top+(bottom-top)*i/4, val=maxY-(maxY-minY)*i/4;
    append(view,"line",{x1:left,y1:py,x2:right,y2:py,stroke:"#304c66"});
    append(view,"text",{x:left-10,y:py+5,"text-anchor":"end",class:"axis-text"},fmt(val,0));
  }
  for(let a=0;a<=360;a+=60){
    append(view,"text",{x:x(a),y:bottom+23,"text-anchor":"middle",class:"axis-text"},a+"°");
    append(view,"line",{x1:x(a),y1:top,x2:x(a),y2:bottom,stroke:"#29445d","stroke-dasharray":"4 8"});
  }
  append(view,"text",{x:12,y:18,class:"axis-text"},"Seconds");
  append(view,"text",{x:(left+right)/2,y:316,"text-anchor":"middle",class:"axis-text"},"Earth orbital angle · synthetic observations");
  drawLine(view,samples.map(a=>[x(a),y(predict(a))]),"#76e3d9");
  drawLine(view,[[x(0),y(fit.ymean)],[x(360),y(fit.ymean)]],"#ffb181",true);
  for(const p of data){
    append(view,"circle",{cx:x(p.angle),cy:y(p.observed),r:4.3,fill:"#ffd68c",stroke:"#10223d","stroke-width":1.2});
  }
  view.setAttribute("aria-label",data.length+" simulated eclipse arrival times. Fitted speed "+whole(fit.inferredSpeed)+" kilometres per second, using the stated statistical and systematic assumptions.");
}
function generateResearch(){
  state.samples=syntheticObservations();
  state.fit=fitTiming(state.samples);
  const f=state.fit;
  setText("count-value",state.sampleCount);
  setText("noise-value",state.noise+" s");
  setText("bias-value",(state.distanceBias>0?"+":"")+state.distanceBias+"%");
  setText("fit-speed",Number.isFinite(f.inferredSpeed)?whole(f.inferredSpeed)+" km/s":"Not physically interpretable");
  setText("fit-error",Number.isFinite(f.speedError)?"± "+whole(f.speedError)+" km/s":"Not available");
  setText("finite-rmse",fmt(f.rmse,2)+" s");
  setText("instant-rmse",fmt(f.instantRmse,2)+" s");
  setText("research-feedback",state.distanceBias===0
    ?"No distance-scale bias was introduced. The fitted speed varies with synthetic random noise; its statistical error assumes the ideal model is correct."
    :"The hidden distance scale is "+(state.distanceBias>0?"too large":"too small")+" by "+Math.abs(state.distanceBias)+"%. This changes the fitted speed even as random noise is reduced. The displayed statistical error does not capture that bias.");
  plotResearch(state.samples,f);
}
function csvDownload(name,lines){
  const blob=new Blob([lines.join("\n")+"\n"],{type:"text/csv;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportModel(){
  const lines=["angle_deg,distance_au,travel_time_s,excess_time_s,next_interval_correction_s,romer_excess_s,hypothetical_excess_s"];
  for(let deg=0;deg<=360;deg+=5)lines.push([
    deg,distanceAU(deg),travelSeconds(deg),excessSeconds(deg),
    intervalSeconds(deg),excessSeconds(deg,ROMER_KM_S),
    excessSeconds(deg,C_KM_S*state.speedRatio)
  ].join(","));
  csvDownload("light-time-model-generated.csv",lines);
}
function exportResearch(){
  const f=state.fit;
  const lines=["angle_deg,nominal_excess_s,synthetic_observed_s,finite_fit_s,instantaneous_fit_s"];
  for(const p of state.samples)lines.push([
    p.angle,p.x,p.observed,f.intercept+f.slope*p.x,f.ymean
  ].join(","));
  csvDownload("synthetic-eclipse-observations.csv",lines);
}
function initialize(){
  $$("[data-position]").forEach(button=>button.addEventListener("click",()=>setAngle(button.dataset.position==="near"?0:180)));
  $("earth-angle").addEventListener("input",()=>setAngle($("earth-angle").value));
  $("run-signal").addEventListener("click",runSignal);
  $("jump-arrival").addEventListener("click",completeSignal);
  $("reset-signal").addEventListener("click",resetSignal);
  $$("[data-predict]").forEach(button=>button.addEventListener("click",()=>{
    const correct=button.dataset.predict==="later";
    $$("[data-predict]").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));
    setText("prediction-result",correct
      ?"Correct! The eclipse happens at Jupiter at the same time, but its light has farther to travel to the distant Earth. Try the Far away button."
      :"Try again: the event happens at the same time at Jupiter, but light needs longer to travel farther. Does that mean Earth sees it earlier or later?");
  }));
  $("comparison-model").addEventListener("change",()=>{
    state.comparison=$("comparison-model").value;
    drawTimingPlot();
  });
  $("chart-mode").addEventListener("change",()=>{
    state.chartMode=$("chart-mode").value;
    drawTimingPlot();
  });
  const modelInputs=[["jupiter-au","R"],["io-period","period"],["speed-ratio","speedRatio"]];
  modelInputs.forEach(([id,key])=>$(id).addEventListener("input",()=>{
    state[key]=Number($(id).value);
    resetSignal();
    renderAll();
  }));
  $("reset-model").addEventListener("click",()=>{
    Object.assign(state,DEFAULTS);
    modelInputs.forEach(([id,key])=>$(id).value=String(state[key]));
    resetSignal();
    renderAll();
  });
  $("export-model").addEventListener("click",exportModel);
  const researchInputs=[["sample-count","sampleCount"],["timing-noise","noise"],["distance-bias","distanceBias"]];
  researchInputs.forEach(([id,key])=>$(id).addEventListener("input",()=>{
    state[key]=Number($(id).value);
    generateResearch();
  }));
  $("resample").addEventListener("click",()=>{state.seed++;generateResearch();});
  $("reset-research").addEventListener("click",()=>{
    state.sampleCount=24;state.noise=30;state.distanceBias=0;state.seed=314159;
    researchInputs.forEach(([id,key])=>$(id).value=String(state[key]));
    generateResearch();
  });
  $("export-research").addEventListener("click",exportResearch);
  $("journey").addEventListener("change",renderJourney);
  $("custom-km").addEventListener("input",renderJourney);
  const tabs=$$("[data-level]");
  tabs.forEach((button,index)=>{
    button.addEventListener("click",()=>setLevel(Number(button.dataset.level)));
    button.addEventListener("keydown",event=>{
      let next=index;
      if(event.key==="ArrowRight")next=(index+1)%tabs.length;
      else if(event.key==="ArrowLeft")next=(index+tabs.length-1)%tabs.length;
      else if(event.key==="Home")next=0;
      else if(event.key==="End")next=tabs.length-1;
      else return;
      event.preventDefault();
      setLevel(next+1,true);
    });
  });
  const mql=window.matchMedia("(prefers-reduced-motion: reduce)");
  const reflectMotion=()=>{
    state.reducedMotion=mql.matches;
    if(state.reducedMotion){
      stopSignal();
      setText("motion-note","Reduced motion: pressing Send the eclipse signal reveals the arrival immediately. The manual controls still work.");
    }else setText("motion-note","Playback is accelerated (400 simulated seconds per real second). The clock shows simulated travel time.");
  };
  if(mql.addEventListener)mql.addEventListener("change",reflectMotion);
  reflectMotion();
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&state.playing){stopSignal();setText("signal-status","Paused because the page was hidden. Resume when ready.");}});
  const hash=window.location.hash.match(/^#level-([1-4])$/);
  setLevel(hash?Number(hash[1]):1);
  resetSignal();
}
document.addEventListener("DOMContentLoaded",initialize);
