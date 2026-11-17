"use strict";

// Educational two-dimensional geometry; not an Io eclipse ephemeris.
// Distances in kilometres; light times in seconds; angular phases in degrees.
const C_KM_S = 299792.458;
const AU_KM = 149597870.7;
const JUPITER_AU = 5.2;
const IO_PERIOD_DAYS = 1.769137786;
const EARTH_YEAR_DAYS = 365.25;
const ROMER_INFERRED_KM_S = 2 * AU_KM / (22 * 60);
const MIN_AU = JUPITER_AU - 1;
const NS = "http://www.w3.org/2000/svg";
const $ = id => document.getElementById(id);
const $$ = selector => Array.from(document.querySelectorAll(selector));

function earthJupiterAU(angleDegrees) {
  const rad = angleDegrees * Math.PI / 180;
  return Math.hypot(JUPITER_AU - Math.cos(rad), Math.sin(rad));
}
function lightTimeSeconds(distanceKm, speedKmS = C_KM_S) {
  return distanceKm / speedKmS;
}
function extraDelaySeconds(angleDegrees, speedKmS = C_KM_S) {
  return (earthJupiterAU(angleDegrees) - MIN_AU) * AU_KM / speedKmS;
}
function nextEclipseCorrectionSeconds(angleDegrees) {
  const stepDegrees = 360 * IO_PERIOD_DAYS / EARTH_YEAR_DAYS;
  const next = earthJupiterAU(angleDegrees + stepDegrees);
  const current = earthJupiterAU(angleDegrees);
  return (next - current) * AU_KM / C_KM_S;
}
function makeSvg(tag, attrs = {}, text = null) {
  const e = document.createElementNS(NS, tag);
  for (const key in attrs) e.setAttribute(key, String(attrs[key]));
  if (text !== null) e.textContent = text;
  return e;
}
function add(parent, tag, attrs = {}, text = null) {
  const e = makeSvg(tag, attrs, text);
  parent.appendChild(e);
  return e;
}
function fixed(n, digits = 1) {
  return Number(n).toLocaleString("en-US", {minimumFractionDigits:digits,maximumFractionDigits:digits});
}
function integer(n) { return Math.round(n).toLocaleString("en-US"); }
function minutesAndSeconds(s) {
  const total = Math.round(s);
  return Math.floor(total / 60) + " min " + String(total % 60).padStart(2,"0") + " s";
}
function shortTravel(s) {
  if (s < 1e-6) return fixed(s * 1e9, 3) + " nanoseconds";
  if (s < .001) return fixed(s * 1e6, 3) + " microseconds";
  if (s < 1) return fixed(s * 1e3, 3) + " milliseconds";
  if (s < 60) return fixed(s, 3) + " seconds";
  if (s < 3600) return minutesAndSeconds(s);
  if (s < 86400) return fixed(s / 3600, 3) + " hours";
  if (s < 31557600) return fixed(s / 86400, 3) + " days";
  return fixed(s / 31557600, 3) + " Julian years";
}
function comparisonDelay(angle) {
  const type = $("light-model").value;
  return type === "instant" ? 0 : extraDelaySeconds(angle, ROMER_INFERRED_KM_S);
}
function updateReadouts(angle) {
  const distance = earthJupiterAU(angle);
  const duration = distance * AU_KM / C_KM_S;
  const residual = extraDelaySeconds(angle);
  const drift = nextEclipseCorrectionSeconds(angle);
  $("angle-value").textContent = Math.round(angle) + "°";
  $("earth-distance").textContent = fixed(distance, 3) + " AU";
  $("light-time").textContent = minutesAndSeconds(duration);
  $("extra-delay").textContent = minutesAndSeconds(residual);
  $("clock-drift").textContent = (drift >= 0 ? "+" : "") + fixed(drift, 2) + " s";
  let movement;
  if (angle === 0 || angle === 360) movement = "At the nearest modeled point, the extra travel-time residual is zero.";
  else if (angle === 180) movement = "At the farthest modeled point, the signal arrives about 16 min 38 s later than at the nearest point.";
  else if (angle < 180) movement = "Earth is travelling away from Jupiter: successive eclipse signals take progressively longer to arrive.";
  else movement = "Earth is approaching Jupiter: successive eclipse signals take progressively less time to arrive.";
  const compare = $("light-model").value === "instant"
    ? " Instantaneous light would produce no distance-dependent delay."
    : " The historical 22-minute estimate predicts a larger delay than the modern value.";
  $("orbit-feedback").textContent = movement + compare;
}
function drawOrbit(angle) {
  const svg = $("orbit-drawing");
  svg.replaceChildren();
  const cx = 238, cy = 203, orbitRadius = 146, jx = 781, jy = 203;
  const radians = angle * Math.PI / 180;
  const ex = cx + orbitRadius * Math.cos(radians);
  const ey = cy - orbitRadius * Math.sin(radians);

  for (let i = 0; i < 24; i++) {
    const x = 19 + ((i * 151) % 882), y = 18 + ((i * 103) % 375);
    add(svg, "circle", {cx:x,cy:y,r:i % 4 === 0 ? 1.7 : 1,fill:"#b2c7e6",opacity:".3"});
  }
  add(svg, "circle", {cx,cy,r:62,fill:"url(#sun-glow)"});
  add(svg, "circle", {cx,cy,r:orbitRadius,fill:"none",stroke:"#7194b7","stroke-width":2,"stroke-dasharray":"6 8",opacity:".8"});
  add(svg, "line", {x1:cx,y1:cy,x2:jx,y2:jy,stroke:"#3b617d","stroke-width":1.5,"stroke-dasharray":"5 9"});
  add(svg, "circle", {cx,cy,r:24,fill:"#ffd175",stroke:"#ffe7b4","stroke-width":3});
  add(svg, "text", {x:cx,y:cy+43,"text-anchor":"middle",class:"big-label"},"Sun");
  add(svg, "text", {x:cx,y:cy+orbitRadius+24,"text-anchor":"middle",class:"axis-label"},"Earth's circular orbit · 1 AU");

  add(svg, "polygon", {points: (jx+34)+","+(jy-22)+" 918,"+(jy-50)+" 918,"+(jy+50)+" "+(jx+34)+","+(jy+22),fill:"#304660",opacity:".4"});
  add(svg, "circle", {cx:jx,cy:jy,r:40,fill:"url(#jupiter-fill)",stroke:"#dfbe9d","stroke-width":2});
  for (const d of [-22,-9,8,24]) {
    add(svg, "path", {d:"M "+(jx-32)+" "+(jy+d)+" Q "+jx+" "+(jy+d+8)+" "+(jx+31)+" "+(jy+d),stroke:"#8e654e",fill:"none","stroke-width":4,opacity:".8"});
  }
  add(svg, "text", {x:jx,y:jy-54,"text-anchor":"middle",class:"big-label"},"Jupiter");
  add(svg, "circle", {cx:jx+56,cy:jy,r:6,fill:"#cfd7e2",stroke:"#7f96af","stroke-width":2});
  add(svg, "text", {x:jx+58,y:jy+32,"text-anchor":"middle",class:"axis-label"},"Io");
  add(svg, "text", {x:883,y:jy-54,"text-anchor":"middle",class:"axis-label"},"shadow");

  // Light-time readout uses centre-to-centre Earth–Jupiter distance,
  // ignoring Io's orbital displacement (as labelled in the page).
  add(svg, "line", {x1:jx,y1:jy,x2:ex,y2:ey,stroke:"#79e6db","stroke-width":3.5,"stroke-dasharray":"10 8",opacity:".93"});
  add(svg, "circle", {cx:ex,cy:ey,r:16,fill:"#60bfe4",stroke:"#d4f2ff","stroke-width":3});
  add(svg, "path", {d:"M "+(ex-10)+" "+(ey-4)+" l 8 -6 5 6 -4 7 -9 -1 z",fill:"#5cb78f",opacity:".85"});
  add(svg, "text", {x:ex,y:ey-29,"text-anchor":"middle",class:"big-label"},"Earth");
  const distMidX = (ex + jx) / 2, distMidY = (ey + jy) / 2;
  add(svg, "rect", {x:distMidX-84,y:distMidY-22,width:168,height:26,rx:7,fill:"#102b45",opacity:".95"});
  add(svg, "text", {x:distMidX,y:distMidY-5,"text-anchor":"middle",class:"axis-label"},fixed(earthJupiterAU(angle),2)+" AU · signal path");
  add(svg, "text", {x:25,y:35,class:"axis-label"},"Top-down schematic · angle "+Math.round(angle)+"°");
  add(svg, "text", {x:25,y:385,class:"axis-label"},"The eclipse happens at Jupiter; its observed arrival time changes.");
}
function plotLine(points, color, dash = null) {
  const attrs = {points:points.map(p=>p[0].toFixed(2)+","+p[1].toFixed(2)).join(" "),fill:"none",stroke:color,"stroke-width":3.5,"stroke-linecap":"round","stroke-linejoin":"round"};
  if (dash) attrs["stroke-dasharray"] = dash;
  return makeSvg("polyline",attrs);
}
function drawTimingPlot(angle) {
  const plot = $("timing-plot");
  plot.replaceChildren();
  const left = 78, right = 866, top = 26, bottom = 276, ymax = 24;
  const x = a => left + a / 360 * (right - left);
  const y = minutes => bottom - minutes / ymax * (bottom - top);
  for (let m = 0; m <= 24; m += 6) {
    const py = y(m);
    add(plot,"line",{x1:left,y1:py,x2:right,y2:py,stroke:"#2a4763","stroke-width":1});
    add(plot,"text",{x:left-13,y:py+5,"text-anchor":"end",class:"axis-label"},m+"");
  }
  for (let a = 0; a <= 360; a += 60) {
    const px = x(a);
    add(plot,"line",{x1:px,y1:top,x2:px,y2:bottom,stroke:"#28435d","stroke-width":1,"stroke-dasharray":"3 6"});
    add(plot,"text",{x:px,y:bottom+23,"text-anchor":"middle",class:"axis-label"},a+"°");
  }
  add(plot,"text",{x:22,y:18,class:"axis-label"},"Minutes");
  add(plot,"text",{x:(left+right)/2,y:bottom+52,"text-anchor":"middle",class:"axis-label"},"Earth's orbital angle, from nearest to farthest and back");
  const observed = [], alternative = [];
  for (let a = 0; a <= 360; a += 3) {
    observed.push([x(a),y(extraDelaySeconds(a)/60)]);
    alternative.push([x(a),y(comparisonDelay(a)/60)]);
  }
  plot.appendChild(plotLine(observed,"#75e5d9"));
  plot.appendChild(plotLine(alternative,"#ffad7e","9 7"));
  add(plot,"line",{x1:x(angle),y1:top,x2:x(angle),y2:bottom,stroke:"#ffd08a","stroke-width":1.6,opacity:".75"});
  add(plot,"circle",{cx:x(angle),cy:y(extraDelaySeconds(angle)/60),r:7.5,fill:"#ffd08a",stroke:"#10223a","stroke-width":2.5});
  add(plot,"circle",{cx:x(angle),cy:y(comparisonDelay(angle)/60),r:6,fill:"#ffad7e",stroke:"#10223a","stroke-width":2});
}
function selectedAngle() {
  return Math.max(0,Math.min(360,Number($("earth-angle").value) || 0));
}
function render() {
  const a = selectedAngle();
  updateReadouts(a);
  drawOrbit(a);
  drawTimingPlot(a);
}
function travelKm() {
  const selection = $("journey").value;
  if (selection === "custom") {
    const v = Number($("custom-km").value);
    return Number.isFinite(v) && v >= 0 && v <= 1e13 ? v : null;
  }
  return Number(selection);
}
function renderJourney() {
  const custom = $("journey").value === "custom";
  $("custom-km").disabled = !custom;
  const km = travelKm();
  if (km === null) {
    $("journey-time").textContent = "Enter a distance from 0 to 10 trillion km";
    $("journey-equation").textContent = "Use a non-negative, finite number of kilometres.";
    $("journey-explanation").textContent = "The speed calculation requires a valid distance.";
    return;
  }
  const seconds = lightTimeSeconds(km);
  $("journey-time").textContent = shortTravel(seconds);
  $("journey-equation").textContent = km.toLocaleString("en-US",{maximumSignificantDigits:12})+" km ÷ 299,792.458 km/s";
  let message = "This is a one-way light travel time in vacuum, not the elapsed time of any real-time animation.";
  if (km === 9460730472580.8) message = "One light-year is a distance: light travels this far in 365.25 days.";
  else if (km === 149597870.7) message = "Sunlight reaches the Earth after roughly 8 minutes 19 seconds.";
  else if (km === 384400) message = "A laser pulse going to the Moon and back would take approximately twice as long.";
  $("journey-explanation").textContent = message;
}
let playing = false, lastTick = 0, lastPaint = 0, frameId = 0;
function stopOrbit() {
  if (!playing) return;
  playing = false;
  cancelAnimationFrame(frameId);
  $("play-orbit").setAttribute("aria-pressed","false");
  $("play-orbit").textContent = "▶ Play Earth's orbit";
  $("orbit-feedback").setAttribute("aria-live","polite");
}
function animate(t) {
  if (!playing) return;
  const delta = Math.min(100,t-lastTick);
  lastTick = t;
  const next = (selectedAngle() + delta * 360 / 18000) % 360;
  $("earth-angle").value = String(next);
  if (t-lastPaint > 80) {
    render();
    lastPaint = t;
  }
  frameId = requestAnimationFrame(animate);
}
function toggleOrbit() {
  if (playing) { stopOrbit(); render(); return; }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  playing = true;
  lastTick = performance.now();
  lastPaint = 0;
  $("play-orbit").setAttribute("aria-pressed","true");
  $("play-orbit").textContent = "Ⅱ Pause Earth's orbit";
  $("orbit-feedback").setAttribute("aria-live","off");
  frameId = requestAnimationFrame(animate);
}
function activateLevel(index, moveFocus = false) {
  const tabs = $$("[data-level]");
  tabs.forEach((button,i)=>{
    const selected = i === index;
    button.setAttribute("aria-selected",String(selected));
    button.tabIndex = selected ? 0 : -1;
    $("level-"+button.dataset.level).hidden = !selected;
  });
  if (moveFocus) tabs[index].focus();
}
function initialise() {
  $("earth-angle").addEventListener("input",()=>{ stopOrbit(); render(); });
  $("light-model").addEventListener("change",render);
  $("play-orbit").addEventListener("click",toggleOrbit);
  $("reset").addEventListener("click",()=>{
    stopOrbit();
    $("earth-angle").value = "0";
    $("light-model").value = "instant";
    render();
  });
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const syncMotion = ()=>{
    if (reduced.matches) {
      stopOrbit();
      $("play-orbit").disabled = true;
      $("motion-note").textContent = "Reduced motion is enabled. The animation is disabled; use the accessible angle slider instead.";
    } else {
      $("play-orbit").disabled = false;
      $("motion-note").textContent = "Drag the slider to investigate freely. The orbit animation is accelerated, not real time.";
    }
  };
  if (reduced.addEventListener) reduced.addEventListener("change",syncMotion);
  syncMotion();
  $("journey").addEventListener("change",renderJourney);
  $("custom-km").addEventListener("input",renderJourney);
  const tabs = $$("[data-level]");
  tabs.forEach((button,i)=>{
    button.addEventListener("click",()=>activateLevel(i));
    button.addEventListener("keydown",event=>{
      let next = i;
      if (event.key === "ArrowRight") next = (i+1)%tabs.length;
      else if (event.key === "ArrowLeft") next = (i+tabs.length-1)%tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length-1;
      else return;
      event.preventDefault();
      activateLevel(next,true);
    });
  });
  $("modern-diameter").textContent = "≈ "+minutesAndSeconds(2*AU_KM/C_KM_S);
  activateLevel(0);
  render();
  renderJourney();
}
document.addEventListener("DOMContentLoaded",initialise);