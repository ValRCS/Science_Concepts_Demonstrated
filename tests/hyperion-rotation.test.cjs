// Regression tests of the actual deterministic equations embedded in the public concept page.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.resolve(__dirname, '../docs/visualizations/hyperion-chaotic-rotation/index.html'),'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Simulation script exists');
function slice(a,b){const i=script.indexOf(a),j=script.indexOf(b);assert.ok(i>=0&&j>i,'Model section missing: '+a);return script.slice(i,j);}
const context=vm.createContext({Math});
vm.runInContext(slice('const TAU =','const inputs =')+'\n'+slice('const clamp =','function recordSample()'),context,{filename:'hyperion-model.js'});
const model=vm.runInContext('({TAU, rk4, rad, wrapPi})',context);
function simulate({e,k,theta=30,spin=1,offset=.01,orbits=1,steps=540}){
 vm.runInContext('cfg='+JSON.stringify({e,k,angle:theta,spin,offset}),context);
 let s=[model.rad(theta),spin,model.rad(theta+offset),spin,0];
 const h=model.TAU/steps;
 for(let i=0;i<orbits*steps;i++)s=model.rk4(s,h);
 return s;
}
function near(a,b,tolerance,label){assert.ok(Math.abs(a-b)<tolerance,label+': '+a+' vs '+b);}
const lock=simulate({e:0,k:.26,theta:0,spin:1,orbits:20});
near(lock[1],1,1e-10,'synchronous rate');
near(model.wrapPi(lock[0]-lock[4]),0,1e-8,'synchronous pointing');
const free=simulate({e:.104,k:0,theta:30,spin:1.75,orbits:20});
near(free[1],1.75,1e-12,'torque-free angular velocity');
near(free[0],model.rad(30)+1.75*model.TAU*20,1e-8,'torque-free uniform spin');
const identical=simulate({e:.104,k:.26,theta:30,spin:1,offset:0,orbits:21});
assert.equal(identical[0],identical[2],'identical orientations stay identical');
assert.equal(identical[1],identical[3],'identical spin rates stay identical');
const coarse=simulate({e:.104,k:.26,theta:30,spin:1,orbits:3,steps:270});
const fine=simulate({e:.104,k:.26,theta:30,spin:1,orbits:3,steps:540});
near(coarse[0],fine[0],.003,'RK4 angle convergence');
near(coarse[1],fine[1],.003,'RK4 rate convergence');
near(fine[4],3*model.TAU,1e-7,'Kepler orbit periodicity');
const divergent=simulate({e:.104,k:.26,theta:30,spin:1,offset:.01,orbits:21});
assert.ok(Math.abs(model.wrapPi(divergent[0]-divergent[2]))*180/Math.PI>1,'default preset illustrates sensitive dependence');
console.log('Hyperion planar spin–orbit model regression tests passed.');
