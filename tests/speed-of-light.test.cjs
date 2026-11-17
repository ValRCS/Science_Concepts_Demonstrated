"use strict";

/* Run from the repository root with:
 *   node --test tests/speed-of-light.test.cjs
 * No packages or browser dependency required. */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const pageRoot = path.join(root, "docs", "visualizations", "speed-of-light");
const js = fs.readFileSync(path.join(pageRoot, "app.js"), "utf8");
const html = fs.readFileSync(path.join(pageRoot, "index.html"), "utf8");
const css = fs.readFileSync(path.join(pageRoot, "style.css"), "utf8");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "docs", "concepts.json"), "utf8"));

const physics = vm.runInNewContext(js + "\n({C_KM_S, AU_KM, earthJupiterAU, lightTimeSeconds, extraDelaySeconds, nextEclipseCorrectionSeconds, ROMER_INFERRED_KM_S})", {
  document: { addEventListener() {} }
});
function near(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance, (message || "Numeric mismatch") + ": " + actual + " vs " + expected);
}

test("defined physical constants are correct", () => {
  assert.equal(physics.C_KM_S, 299792.458);
  assert.equal(physics.AU_KM, 149597870.7);
});

test("circular geometry gives 4.2 AU near and 6.2 AU far", () => {
  near(physics.earthJupiterAU(0), 4.2, 1e-12);
  near(physics.earthJupiterAU(180), 6.2, 1e-12);
  near(physics.earthJupiterAU(360), 4.2, 1e-12);
  near(physics.earthJupiterAU(90), Math.sqrt(5.2**2 + 1), 1e-12);
});

test("one-way residual is about 16 min 38 s across Earth's orbital diameter", () => {
  near(physics.extraDelaySeconds(0), 0, 1e-10);
  near(physics.extraDelaySeconds(180), 998.0095676723128, 1e-7);
  near(physics.extraDelaySeconds(360), 0, 1e-10);
});

test("Rømer historical 22 min estimate is a retrospective effective speed", () => {
  near(physics.ROMER_INFERRED_KM_S, 226663.44045454543, 1e-6);
  near(2 * physics.AU_KM / physics.ROMER_INFERRED_KM_S, 22 * 60, 1e-8);
});

test("Io eclipse-interval correction changes sign with radial motion", () => {
  assert.ok(physics.nextEclipseCorrectionSeconds(90) > 0);
  assert.ok(physics.nextEclipseCorrectionSeconds(270) < 0);
});

test("light travel checkpoints and units", () => {
  near(physics.lightTimeSeconds(physics.AU_KM), 499.0047838361564, 1e-9);
  near(physics.lightTimeSeconds(384400), 1.2822203819416966, 1e-12);
  near(physics.lightTimeSeconds(0.001) * 1e9, 3.335640951981521, 1e-12);
});

test("UI's JavaScript ID references exist in the page", () => {
  const pageIds = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  const jsIds = [...js.matchAll(/(?<!\$)\$\("([^"]+)"\)/g)].map(match => match[1]);
  for (const id of jsIds) assert.ok(pageIds.has(id), "Missing DOM id " + id);
});

test("four learning levels, reduced-motion style and relative navigation exist", () => {
  for (let n = 1; n <= 4; n++) {
    assert.ok(html.includes('id="tab-' + n + '"'));
    assert.ok(html.includes('id="level-' + n + '"'));
  }
  assert.ok(css.includes("prefers-reduced-motion"));
  assert.ok(html.includes('href="../../#category-physics"'));
  assert.ok(html.includes('href="https://www.sciencenorway.no/'));
});

test("speed-of-light catalog entry is unique and routes to the page", () => {
  const entries = catalog.filter(entry => entry.id === "speed-of-light");
  assert.equal(entries.length, 1);
  assert.equal(entries[0].subject, "Physics");
  assert.equal(entries[0].path, "visualizations/speed-of-light/");
  assert.equal(entries[0].levels.length, 4);
});
