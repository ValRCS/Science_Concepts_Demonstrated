"use strict";
// Compact spherical mass model; educational predictions, not observational data.
const G = 4.30091e-6; // kpc (km/s)^2 / solar mass
const KM_PER_KPC = 3.085677581491367e16;
const SEC_PER_MYR = 365.25 * 86400 * 1e6;
const DEFAULTS = {radius:12,mass:6,haloSpeed:205,core:5,scale:3};
const $ = id => document.getElementById(id);
const canvas = $("galaxy");
const ctx = canvas.getContext("2d");
const svg = $("rotation-curve");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const state = {level:1,halo:true,playing:!reducedMotion,angle:-0.72,lastFrame:0};
const starfield = [];
let seed = 1037;
function random(){seed = (1664525 * seed + 1013904223) >>> 0;return seed / 4294967296;}
for(let i=0;i<360;i++){
  const radius = 10 + 177 * Math.sqrt(random());
  const arm = i % 4;
  const angle = arm * Math.PI / 2 + radius * .030 + (random() - .5) * .70;
  starfield.push({radius,angle,size:.5 + random() * 1.5,alpha:.3 + random() * .7});
}
function parameters(){
  return {
    radius:Number($("radius").value),
    mass:Number($("mass").value)*1e10,
    haloSpeed:Number($("haloSpeed").value),
    core:Number($("core").value),
    scale:Number($("scale").value)
  };
}
function velocities(r,p){
  // Hernquist spherical visible mass and cored pseudo-isothermal halo.
  const vb2 = G*p.mass*r/((r+p.scale)*(r+p.scale));
  const x = r/p.core;
  const haloFactor = x < 1e-4 ? x*x/3 : 1-Math.atan(x)/x;
  const vh2 = p.haloSpeed*p.haloSpeed*Math.max(0,haloFactor);
  return {visible:Math.sqrt(vb2),halo:Math.sqrt(vh2),total:Math.sqrt(vb2+vh2)};
}
function selectedSpeed(v){return state.halo?v.total:v.visible;}
function fmt(x){return Math.round(x).toLocaleString("en-US");}
function drawGalaxy(p,v){
  if(!ctx)return;
  const w=canvas.width,h=canvas.height,cx=w/2,cy=h/2+5, maxR=190;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle="#071321";ctx.fillRect(0,0,w,h);
  if(state.halo){
    const glow=ctx.createRadialGradient(cx,cy,15,cx,cy,210);
    glow.addColorStop(0,"rgba(120,93,211,.07)");
    glow.addColorStop(.6,"rgba(126,107,240,.20)");
    glow.addColorStop(1,"rgba(126,107,240,0)");
    ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,210,0,2*Math.PI);ctx.fill();
    ctx.strokeStyle="rgba(174,149,255,.42)";ctx.setLineDash([7,9]);ctx.lineWidth=1.3;
    ctx.beginPath();ctx.arc(cx,cy,194,0,2*Math.PI);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle="#c3b2ff";ctx.font="12px system-ui";ctx.fillText("SCHEMATIC HALO",18,27);
  }else{
    ctx.fillStyle="#a8bcd3";ctx.font="12px system-ui";ctx.fillText("VISIBLE-MATTER MODEL",18,27);
  }
  ctx.strokeStyle="rgba(172,193,212,.11)";
  for(let i=1;i<=4;i++){ctx.beginPath();ctx.arc(cx,cy,maxR*i/4,0,2*Math.PI);ctx.stroke();}
  for(const s of starfield){
    const x=cx+s.radius*Math.cos(s.angle),y=cy+s.radius*Math.sin(s.angle);
    ctx.fillStyle="rgba(219,233,255,"+s.alpha.toFixed(3)+")";
    ctx.beginPath();ctx.arc(x,y,s.size,0,2*Math.PI);ctx.fill();
  }
  const core=ctx.createRadialGradient(cx,cy,1,cx,cy,30);
  core.addColorStop(0,"#fff9d8");core.addColorStop(.17,"#f1d6a6");core.addColorStop(1,"rgba(246,211,162,0)");
  ctx.fillStyle=core;ctx.beginPath();ctx.arc(cx,cy,30,0,2*Math.PI);ctx.fill();
  const rr=maxR*p.radius/30;
  ctx.setLineDash([5,6]);ctx.strokeStyle="#f7d49b";ctx.lineWidth=1.7;
  ctx.beginPath();ctx.arc(cx,cy,rr,0,2*Math.PI);ctx.stroke();ctx.setLineDash([]);
  const x=cx+rr*Math.cos(state.angle),y=cy+rr*Math.sin(state.angle);
  ctx.strokeStyle="rgba(255,225,171,.35)";ctx.lineWidth=1.3;
  ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(x,y);ctx.stroke();
  const unitX=-Math.sin(state.angle),unitY=Math.cos(state.angle);
  const speedArrow=32;
  const ax=x+unitX*speedArrow,ay=y+unitY*speedArrow;
  ctx.strokeStyle="#79ebdd";ctx.fillStyle="#79ebdd";ctx.lineWidth=2.8;
  ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ax,ay);ctx.stroke();
  const theta=Math.atan2(unitY,unitX);
  ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax-10*Math.cos(theta-.4),ay-10*Math.sin(theta-.4));ctx.lineTo(ax-10*Math.cos(theta+.4),ay-10*Math.sin(theta+.4));ctx.closePath();ctx.fill();
  ctx.fillStyle="#ffe49f";ctx.beginPath();ctx.arc(x,y,6.5,0,2*Math.PI);ctx.fill();
  ctx.strokeStyle="#fff9e1";ctx.lineWidth=1.5;ctx.stroke();
  ctx.fillStyle="#cbdff2";ctx.font="13px system-ui";
  ctx.fillText("Radius: "+p.radius+" kpc",18,h-19);
  ctx.textAlign="right";ctx.fillText("Orbit speed: "+fmt(selectedSpeed(v))+" km/s",w-18,h-19);ctx.textAlign="left";
}
function chartMarkup(p){
  const left=57,right=723,top=25,bottom=251;
  let peak=0;
  for(let r=.3;r<=30;r+=.3)peak=Math.max(peak,velocities(r,p).total);
  const ymax=Math.max(300,Math.ceil(peak*1.12/50)*50);
  const px=r=>left+(r/30)*(right-left);
  const py=v=>bottom-v/ymax*(bottom-top);
  function path(which){
    const result=[];
    for(let i=0;i<=180;i++){
      const r=.03+(29.97*i/180);
      result.push((i?"L":"M")+px(r).toFixed(2)+","+py(velocities(r,p)[which]).toFixed(2));
    }
    return result.join(" ");
  }
  const v=velocities(p.radius,p);
  const x=px(p.radius);
  const grids=[];
  for(let q=0;q<=ymax;q+=50){
    grids.push('<line x1="'+left+'" y1="'+py(q)+'" x2="'+right+'" y2="'+py(q)+'" stroke="#36516b" stroke-opacity=".68" stroke-dasharray="3 5"/>');
    grids.push('<text x="45" y="'+(py(q)+4)+'" text-anchor="end" fill="#c0d3e5" font-size="13">'+q+'</text>');
  }
  for(let r=0;r<=30;r+=5){
    grids.push('<line x1="'+px(r)+'" y1="'+top+'" x2="'+px(r)+'" y2="'+bottom+'" stroke="#36516b" stroke-opacity=".37"/>');
    grids.push('<text x="'+px(r)+'" y="271" text-anchor="middle" fill="#c0d3e5" font-size="13">'+r+'</text>');
  }
  const chosenY=py(selectedSpeed(v));
  const svgText='<title>Two predicted galaxy rotation curves</title><desc>Orange is visible matter alone; teal includes a dark halo. Selected radius '+p.radius+' kiloparsecs. Visible speed '+fmt(v.visible)+' and with-halo speed '+fmt(v.total)+' kilometres per second.</desc>'
    +grids.join("")
    +'<path d="'+path("visible")+'" fill="none" stroke="#ffd28c" stroke-width="4" stroke-linejoin="round"/>'
    +'<path d="'+path("total")+'" fill="none" stroke="#61e2cf" stroke-width="4" stroke-linejoin="round"/>'
    +'<line x1="'+x+'" y1="'+top+'" x2="'+x+'" y2="'+bottom+'" stroke="#dceaff" stroke-width="1.6" stroke-dasharray="5 5"/>'
    +'<circle cx="'+x+'" cy="'+py(v.visible)+'" r="6" fill="#ffd28c" stroke="#13253a" stroke-width="2"/>'
    +'<circle cx="'+x+'" cy="'+py(v.total)+'" r="6" fill="#61e2cf" stroke="#13253a" stroke-width="2"/>'
    +'<circle cx="'+x+'" cy="'+chosenY+'" r="10" fill="none" stroke="#fff9e8" stroke-width="2"/>'
    +'<text x="14" y="18" fill="#d6e6f7" font-size="13">Speed (km/s)</text>'
    +'<text x="390" y="302" fill="#d6e6f7" text-anchor="middle" font-size="13">Distance from centre (kpc)</text>';
  svg.innerHTML=svgText;
  svg.setAttribute("aria-label","Modeled orbital speeds at "+p.radius+" kpc: visible matter "+fmt(v.visible)+" km/s and visible plus dark halo "+fmt(v.total)+" km/s. Selected model: "+(state.halo?"with halo":"visible only")+".");
}
function refresh(){
  const p=parameters(),v=velocities(p.radius,p),vs=selectedSpeed(v);
  $("radiusValue").textContent=p.radius+" kpc";
  $("massValue").textContent=Number($("mass").value).toLocaleString("en-US")+" × 10¹⁰ M☉";
  $("haloSpeedValue").textContent=p.haloSpeed+" km/s";
  $("coreValue").textContent=p.core+" kpc";
  $("scaleValue").textContent=p.scale+" kpc";
  $("speedReadout").textContent=fmt(vs)+" km/s";
  $("visibleReadout").textContent=fmt(v.visible)+" km/s";
  $("periodReadout").textContent=(2*Math.PI*p.radius*KM_PER_KPC/vs/SEC_PER_MYR).toFixed(0)+" Myr";
  $("tableRadius").textContent=p.radius+" kpc";
  $("tableVisible").textContent=fmt(v.visible)+" km/s";
  $("tableTotal").textContent=fmt(v.total)+" km/s";
  $("tableHalo").textContent=fmt(v.halo)+" km/s";
  const difference=Math.round(v.total-v.visible);
  $("model-status").textContent=state.halo
    ? "At "+p.radius+" kpc, the halo model predicts "+difference+" km/s greater circular speed than visible matter alone."
    : "Visible-only gravity predicts a slower orbit here. Compare the teal curve to see the extra speed predicted with a halo.";
  document.querySelectorAll("[data-halo]").forEach(button=>button.setAttribute("aria-pressed",String((button.dataset.halo==="true")===state.halo)));
  drawGalaxy(p,v);chartMarkup(p);
}
function setLevel(level){
  state.level=level;
  document.querySelectorAll("[data-level]").forEach(tab=>{
    const active=Number(tab.dataset.level)===level;
    tab.setAttribute("aria-selected",String(active));
    tab.tabIndex=active?0:-1;
  });
  document.querySelectorAll(".level-body").forEach(panel=>panel.hidden=panel.id!=="level-"+level);
  document.querySelectorAll("[data-min-level]").forEach(group=>group.hidden=Number(group.dataset.minLevel)>level);
  refresh();
}
document.querySelectorAll("[data-halo]").forEach(button=>button.addEventListener("click",()=>{
  state.halo=button.dataset.halo==="true";refresh();
}));
for(const id of Object.keys(DEFAULTS))$(id).addEventListener("input",refresh);
const tabs=Array.from(document.querySelectorAll("[data-level]"));
tabs.forEach((tab,index)=>{
  tab.addEventListener("click",()=>setLevel(index+1));
  tab.addEventListener("keydown",event=>{
    let next=index;
    if(event.key==="ArrowRight")next=(index+1)%tabs.length;
    else if(event.key==="ArrowLeft")next=(index+tabs.length-1)%tabs.length;
    else if(event.key==="Home")next=0;
    else if(event.key==="End")next=tabs.length-1;
    else return;
    event.preventDefault();setLevel(next+1);tabs[next].focus();
  });
});
function updateMotionButton(){
  $("motion").textContent=state.playing?"Pause orbit":"Resume orbit";
  $("motion").setAttribute("aria-pressed",String(state.playing));
}
$("motion").addEventListener("click",()=>{state.playing=!state.playing;state.lastFrame=0;updateMotionButton();});
$("reset").addEventListener("click",()=>{
  for(const [id,value] of Object.entries(DEFAULTS))$(id).value=value;
  state.halo=true;state.angle=-.72;refresh();
});
function frame(timestamp){
  if(state.playing&&ctx){
    if(state.lastFrame){
      const elapsed=Math.min((timestamp-state.lastFrame)/1000,.08);
      const p=parameters(),v=velocities(p.radius,p);
      // Orbit angular speed is exaggerated for teaching. No physical time scale.
      state.angle+=elapsed*(selectedSpeed(v)/p.radius)*.055;
      drawGalaxy(p,v);
    }
    state.lastFrame=timestamp;
  }
  requestAnimationFrame(frame);
}
setLevel(1);updateMotionButton();requestAnimationFrame(frame);
