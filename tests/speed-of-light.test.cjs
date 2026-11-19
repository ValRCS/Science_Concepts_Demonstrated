"use strict";
// Dependency-free regression suite: node --test tests/speed-of-light.test.cjs
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const page=path.join(root,"docs","visualizations","speed-of-light");
const html=fs.readFileSync(path.join(page,"index.html"),"utf8");
const css=fs.readFileSync(path.join(page,"style.css"),"utf8");
const source=fs.readFileSync(path.join(page,"app.js"),"utf8");
const catalog=JSON.parse(fs.readFileSync(path.join(root,"docs","concepts.json"),"utf8"));
const exported="{C_KM_S,AU_KM,ROMER_KM_S,state,distanceAU,travelSeconds,excessSeconds,intervalSeconds,syntheticObservations,fitTiming,initialize,setLevel,setAngle,renderAll,generateResearch,runSignal,tick}";
const model=vm.runInNewContext(source+"\n("+exported+")",{document:{addEventListener(){}}});
function near(actual,expected,tol=1e-8){assert.ok(Math.abs(actual-expected)<=tol,actual+" != "+expected);}
test("modern constants use exact SI and IAU values",()=>{
  assert.equal(model.C_KM_S,299792.458);
  assert.equal(model.AU_KM,149597870.7);
});
test("near, far and intermediate orbital geometry",()=>{
  near(model.distanceAU(0),4.2);
  near(model.distanceAU(180),6.2);
  near(model.distanceAU(360),4.2);
  near(model.distanceAU(90),Math.hypot(5.2,1));
});
test("near-to-far travel delay is 2 AU/c, not a delay in each eclipse",()=>{
  near(model.excessSeconds(0),0);
  near(model.excessSeconds(180),998.0095676723128,1e-6);
  near(model.travelSeconds(180)-model.travelSeconds(0),998.0095676723128,1e-6);
  near(model.ROMER_KM_S,226663.44045454543,1e-6);
  near(2*model.AU_KM/model.ROMER_KM_S,1320);
});
test("incremental eclipse timing changes sign, while cumulative delay is nonnegative",()=>{
  assert.ok(model.intervalSeconds(90)>0);
  assert.ok(model.intervalSeconds(270)<0);
  assert.ok(model.excessSeconds(270)>0);
  for(let angle=0;angle<=360;angle+=15)assert.ok(model.excessSeconds(angle)>=-1e-8);
});
test("inferred speed is recovered without noise or systematic bias",()=>{
  const data=model.syntheticObservations(24,0,0,123);
  const fit=model.fitTiming(data);
  near(fit.inferredSpeed,model.C_KM_S,1e-7);
  near(fit.speedError,0,1e-5);
  near(fit.rmse,0,1e-9);
  assert.ok(fit.instantRmse>100);
});
test("a distance scale bias remains even with no random error",()=>{
  const data=model.syntheticObservations(32,0,10,45);
  const fit=model.fitTiming(data);
  near(fit.slope,1.1,1e-10);
  near(fit.inferredSpeed,model.C_KM_S/1.1,1e-6);
  near(fit.rmse,0,1e-9);
});
test("a larger sample changes statistical scatter without removing systematic bias",()=>{
  const fit=model.fitTiming(model.syntheticObservations(48,20,-5,122));
  assert.ok(fit.inferredSpeed>model.C_KM_S);
  assert.ok(fit.rmse>0);
  assert.ok(fit.instantRmse>fit.rmse);
  assert.ok(fit.speedError>0);
});
test("no duplicated HTML IDs; script uses existing DOM targets",()=>{
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(new Set(ids).size,ids.length);
  const known=new Set(ids);
  for(const match of source.matchAll(/\$\("([^"]+)"\)/g)){
    if(match[1]==="[data-level]")continue;
    assert.ok(known.has(match[1]),"Missing DOM target "+match[1]);
  }
});
test("each learning level and its progressive controls exist",()=>{
  for(let level=1;level<=4;level++){
    assert.ok(html.includes('id="tab-'+level+'"'));
    assert.ok(html.includes('id="level-'+level+'"'));
    assert.ok(css.includes('[data-active-level="'+level+'"]'));
  }
  assert.match(html,/id="signal-scene"/);
  assert.match(html,/id="orbit-svg"/);
  assert.match(html,/id="timing-plot"/);
  assert.match(html,/id="research-plot"/);
  assert.match(html,/role="tablist"/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/overflow-x:auto/);
});
test("the page is catalogued once under Physics, with four school-level tags",()=>{
  const match=catalog.filter(item=>item.id==="speed-of-light");
  assert.equal(match.length,1);
  assert.equal(match[0].path,"visualizations/speed-of-light/");
  assert.equal(match[0].subject,"Physics");
  assert.equal(match[0].levels.length,4);
});
test("references and navigation use working relative or documented URLs",()=>{
  assert.match(html,/href="\.\.\/\.\.\/#category-physics"/);
  assert.match(html,/https:\/\/www\.sciencenorway\.no/);
  assert.match(html,/https:\/\/nbi\.ku\.dk\/hhh\/roemer/);
  assert.match(html,/https:\/\/clic\.obspm\.fr\//);
});

// A tiny deterministic fake DOM checks wiring and interaction without npm tools.
// It does not substitute for browser screenshots or a mobile accessibility audit.
function fakeEnvironment(){
  class Element {
    constructor(id=""){this.id=id;this.children=[];this.listeners={};this.attributes={};this.dataset={};this.value="";this.textContent="";this.hidden=false;this.disabled=false;this.tabIndex=0;this.option={disabled:false};}
    setAttribute(name,v){this.attributes[name]=String(v);}
    appendChild(child){this.children.push(child);return child;}
    replaceChildren(...children){this.children=children;}
    addEventListener(name,fn){this.listeners[name]=fn;}
    querySelector(){return this.option;}
    focus(){this.focused=true;}
    click(){this.clicked=true;}
    remove(){}
  }
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  const elements=Object.fromEntries(ids.map(id=>[id,new Element(id)]));
  const preset={
    "earth-angle":"0","comparison-model":"instant","chart-mode":"cumulative",
    "jupiter-au":"5.2","io-period":"1.769","speed-ratio":"0.75",
    "sample-count":"24","timing-noise":"30","distance-bias":"0",
    "journey":"384400","custom-km":"1000000"
  };
  for(const [id,value]of Object.entries(preset))elements[id].value=value;
  const levels=[1,2,3,4].map(n=>{elements["tab-"+n].dataset.level=String(n);return elements["tab-"+n];});
  const positions=["near","far"].map(position=>{const e=new Element();e.dataset.position=position;return e;});
  const predictions=["earlier","same","later"].map(predict=>{const e=new Element();e.dataset.predict=predict;return e;});
  const mql={matches:false,addEventListener(name,fn){this.change=fn;}};
  const document={
    hidden:false,body:new Element("body"),
    getElementById(id){assert.ok(elements[id],"Missing #"+id);return elements[id];},
    createElementNS(ns,name){return new Element(name);},
    createElement(name){return new Element(name);},
    querySelectorAll(selector){
      if(selector==="[data-level]")return levels;
      if(selector==="[data-position]")return positions;
      if(selector==="[data-predict]")return predictions;
      return [];
    },
    addEventListener(name,fn){this["on"+name]=fn;}
  };
  const window={location:{hash:""},matchMedia(){return mql;}};
  const callbacks=new Map();
  let frame=0;
  const context={
    document,window,performance:{now(){return 1000;}},
    requestAnimationFrame(fn){const id=++frame;callbacks.set(id,fn);return id;},
    cancelAnimationFrame(id){callbacks.delete(id);},
    URL:{createObjectURL(){return "blob:simulated";},revokeObjectURL(){}},
    Blob,setTimeout(){}
  };
  const app=vm.runInNewContext(source+"\n("+exported+")",context);
  app.initialize();
  return {app,elements,levels,positions,predictions,mql,callbacks};
}
test("first screen: near/far buttons change a shared orbit model",()=>{
  const ui=fakeEnvironment();
  assert.equal(ui.elements["light-time"].textContent,"34 min 56 s");
  assert.equal(ui.elements["earth-distance"].textContent,"4.200 AU");
  assert.equal(ui.elements["signal-scene"].children.length>10,true);
  ui.positions[1].listeners.click();
  assert.equal(ui.elements["earth-angle"].value,"180");
  assert.equal(ui.elements["extra-delay"].textContent,"16 min 38 s");
  assert.equal(ui.positions[1].attributes["aria-pressed"],"true");
  ui.predictions[2].listeners.click();
  assert.match(ui.elements["prediction-result"].textContent,/Correct!/);
});
test("animation can be started, paused and jumped to arrival",()=>{
  const ui=fakeEnvironment();
  ui.elements["run-signal"].listeners.click();
  assert.equal(ui.app.state.playing,true);
  ui.app.tick(1120);
  assert.ok(ui.app.state.elapsed>0);
  ui.elements["run-signal"].listeners.click();
  assert.equal(ui.app.state.playing,false);
  ui.elements["jump-arrival"].listeners.click();
  assert.equal(ui.app.state.delivered,true);
  assert.equal(ui.elements["clock-readout"].textContent,"34 min 56 s");
  assert.match(ui.elements["signal-status"].textContent,/Arrival!/);
  ui.elements["reset-signal"].listeners.click();
  assert.equal(ui.app.state.elapsed,0);
});
test("reduced-motion users receive the same outcome without animated playback",()=>{
  const ui=fakeEnvironment();
  ui.mql.matches=true;ui.mql.change();
  ui.elements["run-signal"].listeners.click();
  assert.equal(ui.app.state.delivered,true);
  assert.equal(ui.app.state.playing,false);
});
test("tabs progressively reveal model/research and support keyboard navigation",()=>{
  const ui=fakeEnvironment();
  assert.equal(ui.app.state.level,1);
  ui.levels[0].listeners.keydown({key:"ArrowRight",preventDefault(){}});
  assert.equal(ui.app.state.level,2);
  assert.equal(ui.elements["level-2"].hidden,false);
  ui.levels[3].listeners.click();
  assert.equal(ui.app.state.level,4);
  assert.equal(ui.elements["level-4"].hidden,false);
  assert.equal(ui.elements["research-plot"].children.length>25,true);
  ui.app.setLevel(1);
  assert.equal(ui.elements["level-4"].hidden,true);
});
test("model controls and research controls generate new results",()=>{
  const ui=fakeEnvironment();
  ui.app.setLevel(3);
  ui.elements["jupiter-au"].value="6.5";
  ui.elements["jupiter-au"].listeners.input();
  near(ui.app.distanceAU(0),5.5);
  near(ui.app.excessSeconds(180),998.0095676723128,1e-6);
  ui.elements["chart-mode"].value="interval";
  ui.elements["chart-mode"].listeners.change();
  assert.match(ui.elements["chart-description"].textContent,/clock interval/);
  ui.app.setLevel(4);
  ui.elements["distance-bias"].value="10";
  ui.elements["distance-bias"].listeners.input();
  assert.match(ui.elements["research-feedback"].textContent,/scale/);
  ui.elements["timing-noise"].value="0";
  ui.elements["timing-noise"].listeners.input();
  near(ui.app.state.fit.inferredSpeed,299792.458/1.1,1e-6);
  ui.elements["reset-research"].listeners.click();
  assert.equal(ui.app.state.distanceBias,0);
});
test("calculator handles metres, 1 AU, light-year and invalid distance",()=>{
  const ui=fakeEnvironment();
  ui.elements["journey"].value="0.001";
  ui.elements["journey"].listeners.change();
  assert.match(ui.elements["journey-time"].textContent,/3.336 nanoseconds/);
  ui.elements["journey"].value="9460730472580.8";
  ui.elements["journey"].listeners.change();
  assert.match(ui.elements["journey-time"].textContent,/Julian years/);
  ui.elements["journey"].value="custom";
  ui.elements["journey"].listeners.change();
  ui.elements["custom-km"].value="-1";
  ui.elements["custom-km"].listeners.input();
  assert.match(ui.elements["journey-time"].textContent,/Enter a distance/);
});
