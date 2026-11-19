/**
 * Dependency-free regression checks for the browser-only electron double-slit page.
 * Run: node tests/quantum-electron-double-slit.test.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const script = readFileSync(join(root, "docs/visualizations/quantum-electron-double-slit/simulation.js"), "utf8");
const hits = [];
const ids = [
  "apparatus", "detector", "distribution", "count", "count-sub", "voltage-value",
  "separation-value", "width-value", "distance-value", "resolution-value",
  "distinguishability-value", "lambda-value", "spacing-value", "visibility-value",
  "feedback", "slit-mode", "voltage", "separation", "width", "distance",
  "resolution", "distinguishability", "fire-one", "fire-ten", "fire-hundred",
  "fire-thousand", "auto", "clear"
];
const noOp = () => {};
function graphicsContext(name) {
  return {
    fillRect: noOp, fillText: noOp, beginPath: noOp, moveTo: noOp,
    lineTo: noOp, stroke: noOp, fill: noOp, closePath: noOp,
    quadraticCurveTo: noOp,
    arc(x, y, radius) {
      if (name === "detector") hits.push([x, y, radius]);
    }
  };
}
const elements = {};
for (const id of ids) {
  const element = {
    value: "", textContent: "", hidden: false, disabled: false,
    handlers: {}, setAttribute: noOp,
    addEventListener(type, handler) { this.handlers[type] = handler; }
  };
  if (["apparatus", "detector", "distribution"].includes(id)) {
    element.width = 840;
    element.height = id === "apparatus" ? 240 : id === "detector" ? 285 : 234;
    element.getContext = () => graphicsContext(id);
  }
  elements[id] = element;
}
const levels = Array.from({ length: 4 }, (_, i) => ({
  dataset: { level: String(i + 1) },
  attributes: {},
  handlers: {},
  setAttribute(name, value) { this.attributes[name] = value; },
  addEventListener(type, handler) { this.handlers[type] = handler; }
}));
const articles = Array.from({ length: 4 }, (_, i) => ({ id: "level-" + (i + 1), hidden: i > 0 }));
const controlSections = Array.from({ length: 3 }, (_, i) => ({
  dataset: { minLevel: String(i + 2) }, hidden: true
}));
const document = {
  getElementById(id) {
    assert.ok(elements[id], "Missing DOM element " + id);
    return elements[id];
  },
  querySelectorAll(selector) {
    return selector === "[data-level]" ? levels :
      selector === ".level-content" ? articles :
      selector === "[data-min-level]" ? controlSections : [];
  }
};
let nextAnimation = null;
vm.runInNewContext(script, {
  document, window: { addEventListener: noOp },
  requestAnimationFrame(callback) { nextAnimation = callback; return 1; },
  cancelAnimationFrame: noOp,
  // Production uses Math.random. Other Math functions remain exact.
  Math, Float64Array, Uint32Array, Number, String, Object, Array, Error, console
}, { filename: "simulation.js" });

const trigger = (id, event = "click") => elements[id].handlers[event]();
const count = () => Number(elements.count.textContent.replaceAll(",", ""));
const ratio = (positions, a, b, radius = 8) => {
  const near = (target) => positions.filter(x => Math.abs(x - target) < radius).length;
  return near(a) / Math.max(1, near(b));
};
function batch(n) {
  const before = hits.length;
  for (let i = 0; i < n / 1000; i++) trigger("fire-thousand");
  assert.equal(count(), n);
  return hits.slice(before).map(([x]) => x);
}

assert.equal(count(), 0);
trigger("fire-one");
assert.equal(count(), 1);
trigger("clear");
assert.equal(count(), 0);

const mid = 420;
const firstMinimum = mid + (16.35 / 360) * 774;
const coherent = batch(20000);
assert.ok(ratio(coherent, mid, firstMinimum) > 3, "Coherent interference peak/minimum contrast");

elements["slit-mode"].value = "left";
trigger("slit-mode", "change");
assert.equal(count(), 0, "Changing aperture clears existing detections");
const oneSlit = batch(20000);
assert.ok(ratio(oneSlit, mid, firstMinimum) < 1.5, "Single-slit distribution lacks the fine fringes");

elements["slit-mode"].value = "both";
trigger("slit-mode", "change");
elements.distinguishability.value = "1";
trigger("distinguishability", "input");
const marked = batch(20000);
assert.ok(ratio(marked, mid, firstMinimum) < 1.5, "Complete which-path information suppresses interference");

levels[3].handlers.click();
assert.equal(articles[0].hidden, true);
assert.equal(articles[3].hidden, false);
assert.equal(controlSections[2].hidden, false);

elements.voltage.value = "400";
trigger("voltage", "input");
assert.equal(count(), 0);
assert.ok(elements["spacing-value"].textContent.startsWith("16."), "Fringe spacing decreases with energy");

elements.resolution.value = "8";
trigger("resolution", "input");
assert.equal(count(), 0, "Detector resolution control resets run");
trigger("auto");
assert.equal(elements.auto.textContent, "❚❚ Pause");
assert.equal(typeof nextAnimation, "function");
trigger("auto");
assert.equal(elements.auto.textContent, "▶ Auto-fire");

console.log("PASS: accumulation, single slit, which-path suppression, level navigation, energy scaling, blur, auto-fire.");
