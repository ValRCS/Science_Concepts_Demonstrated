"use strict";

/* Run from the repository root:
 *   node --test tests/radiometric-dating.test.cjs
 * Uses only built-in Node modules; no DOM package is required.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const page = path.join(root, "docs", "visualizations", "radiometric-dating");
const js = fs.readFileSync(path.join(page, "app.js"), "utf8");
const html = fs.readFileSync(path.join(page, "index.html"), "utf8");
const css = fs.readFileSync(path.join(page, "style.css"), "utf8");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "docs", "concepts.json"), "utf8"));

function harness() {
  class Node {
    constructor(id = "") {
      this.id = id;
      this.value = "";
      this.dataset = {};
      this.attributes = {};
      this.children = [];
      this.listeners = {};
      this.hidden = false;
      this.disabled = false;
      this.textContent = "";
      this.classList = {
        values: new Set(),
        add(...names) { names.forEach(name => this.values.add(name)); },
        remove(...names) { names.forEach(name => this.values.delete(name)); }
      };
    }
    appendChild(item) { this.children.push(item); }
    append(...items) { this.children.push(...items); }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    addEventListener(event, fn) { this.listeners[event] = fn; }
    focus() { this.focused = true; }
    fire(event, payload = {}) { if (this.listeners[event]) this.listeners[event](payload); }
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  const elements = Object.fromEntries(ids.map(id => [id, new Node(id)]));
  const defaults = {
    clock: "c14", elapsed: "1", measured: "25", uncertainty: "1",
    material: "wood", method: "c14", "upper-layer": "66", "lower-layer": "72",
    "mineral-clock": "k40", disturbance: "closed", "disturbance-amount": "30"
  };
  for (const [id, value] of Object.entries(defaults)) elements[id].value = value;
  const tabs = [1,2,3,4].map(n => {
    elements["tab-" + n].dataset.level = String(n);
    return elements["tab-" + n];
  });
  const predictions = [50,25,0].map(n => {
    const item = new Node(); item.dataset.predict = String(n); return item;
  });
  const fractions = [50,25,12.5].map(n => {
    const item = new Node(); item.dataset.fraction = String(n); return item;
  });
  const document = {
    hidden: false,
    getElementById: id => elements[id],
    createElementNS: () => new Node(),
    addEventListener() {},
    querySelectorAll(query) {
      if (query === ".level-tabs [role=tab]") return tabs;
      if (query === "[data-predict]") return predictions;
      if (query === "[data-fraction]") return fractions;
      throw new Error("Unexpected selector " + query);
    }
  };
  let animation = null;
  vm.runInNewContext(js, {
    document,
    requestAnimationFrame(fn) { animation = fn; return 1; },
    cancelAnimationFrame() { animation = null; }
  });
  return {
    elements, tabs, predictions,
    input(id, value, event = "input") {
      if (value !== undefined) elements[id].value = String(value);
      elements[id].fire(event);
    },
    frame(time) {
      if (animation) {
        const fn = animation;
        animation = null;
        fn(time);
      }
    }
  };
}

function numberFrom(text) { return Number(text.replace(/,/g, "").split(" ")[0]); }

test("all referenced HTML IDs are present and unique", () => {
  const pageIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(pageIds).size, pageIds.length, "Duplicate HTML id");
  for (const match of js.matchAll(/\$\("([^"]+)"\)/g)) {
    assert.ok(pageIds.includes(match[1]), "Missing id " + match[1]);
  }
});

test("initial C-14 half-life and inverse solution are correct", () => {
  const h = harness();
  assert.equal(h.elements["age-value"].textContent, "5,730 years");
  assert.equal(h.elements["parent-value"].textContent, "50.00%");
  assert.equal(h.elements["inferred-age"].textContent, "11,460 years");
  assert.equal(h.elements["atoms-svg"].children.length, 180);
  assert.ok(h.elements["decay-chart"].children.length > 20);
});

test("zero, one, two and three half-lives produce 100, 50, 25 and 12.5 percent", () => {
  const h = harness();
  for (const [halfLives, expected] of [[0,100],[1,50],[2,25],[3,12.5]]) {
    h.input("elapsed", halfLives);
    assert.equal(Number(h.elements["parent-value"].textContent.replace("%","")), expected);
  }
});

test("K-40 age scaling and explicit branching are consistent", () => {
  const h = harness();
  h.input("clock", "k40", "change");
  h.input("elapsed", "2");
  assert.equal(h.elements["age-value"].textContent, "2.50 billion years");
  assert.match(h.elements["branch-output"].textContent, /8\.04% has become argon-40/);
  assert.match(h.elements["branch-output"].textContent, /66\.96% has become calcium-40/);
});

test("U-238 ages beyond Earth's age show an explicit warning", () => {
  const h = harness();
  h.input("clock", "u238", "change");
  h.input("elapsed", "2");
  assert.equal(h.elements["age-warning"].hidden, false);
  assert.match(h.elements["age-warning"].textContent, /Hypothetical/);
});

test("derived age decreases with increasing surviving parent fraction", () => {
  const h = harness();
  h.input("measured", 50);
  const younger = numberFrom(h.elements["inferred-age"].textContent);
  h.input("measured", 25);
  const older = numberFrom(h.elements["inferred-age"].textContent);
  assert.ok(older > younger);
  assert.equal(older, 11460);
  h.input("measured", 1);
  h.input("uncertainty", 5);
  assert.match(h.elements["inferred-range"].textContent, /no finite upper bound/);
});

test("daughter loss makes the inferred mineral age younger; inheritance older", () => {
  const h = harness();
  h.input("disturbance", "loss", "change");
  const truth = numberFrom(h.elements["true-age"].textContent);
  const apparentLoss = numberFrom(h.elements["apparent-age"].textContent);
  assert.ok(apparentLoss < truth);
  h.input("disturbance", "inherit", "change");
  const apparentInherited = numberFrom(h.elements["apparent-age"].textContent);
  assert.ok(apparentInherited > truth);
  h.input("disturbance", "closed", "change");
  assert.equal(h.elements["true-age"].textContent, h.elements["apparent-age"].textContent);
});

test("method selection explains suitability rather than inventing fossil dating", () => {
  const h = harness();
  h.input("material", "fossil", "change");
  h.input("method", "c14", "change");
  h.input("method-check", undefined, "click");
  assert.match(h.elements["method-result"].textContent, /cannot meaningfully be dated by carbon-14/);
  h.input("material", "zircon", "change");
  h.input("method", "u238", "change");
  h.input("method-check", undefined, "click");
  assert.match(h.elements["method-result"].textContent, /Excellent candidate/);
});

test("geological stratigraphy returns a bounded interval", () => {
  const h = harness();
  h.input("upper-layer", 64);
  h.input("lower-layer", 78);
  assert.match(h.elements["strata-result"].textContent, /between 64 and 78/);
});

test("playback advances even for time steps shorter than input range step", () => {
  const h = harness();
  h.input("play", undefined, "click");
  for (let time = 1000; time < 2000; time += 16) h.frame(time);
  assert.ok(Number(h.elements.elapsed.value) > 1, "Animation did not move");
  h.input("play", undefined, "click");
  assert.equal(h.elements.play.attributes["aria-pressed"], "false");
});

test("four learning levels and accessibility conventions are present", () => {
  const h = harness();
  h.tabs[3].fire("click");
  assert.equal(h.elements["level-4"].hidden, false);
  assert.equal(h.elements["level-1"].hidden, true);
  assert.equal(h.elements["tab-4"].attributes["aria-selected"], "true");
  assert.ok(css.includes("prefers-reduced-motion"));
  assert.ok(html.includes('href="../../#category-earth-and-space"'));
  assert.ok(html.includes("IntCal20"));
  assert.ok(html.includes("Dodson"));
});

test("catalog contains exactly one Earth & Space radiometric dating entry", () => {
  const entries = catalog.filter(item => item.id === "radiometric-dating");
  assert.equal(entries.length, 1);
  assert.equal(entries[0].subject, "Earth & Space");
  assert.equal(entries[0].path, "visualizations/radiometric-dating/");
  assert.equal(entries[0].levels.length, 4);
});
