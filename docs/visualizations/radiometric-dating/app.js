/* Radiometric dating: one physics model, four levels, three applied experiments.
   No external libraries. All values are idealized educational examples. */
(() => {
  "use strict";

  const CLOCKS = Object.freeze({
    c14: {
      name: "Carbon-14",
      halfLife: 5730,
      branch: 1,
      description: "Useful for formerly living material, generally to about 50,000 years; physical decay ages here are not calibrated radiocarbon dates."
    },
    k40: {
      name: "Potassium-40",
      halfLife: 1.248e9,
      branch: 0.1072,
      description: "A long-lived clock for suitable potassium-bearing minerals. Only about 10.7% of decays yield argon-40; most yield calcium-40."
    },
    u238: {
      name: "Uranium-238",
      halfLife: 4.468e9,
      branch: 1,
      description: "Used with uranium–lead measurements in minerals such as zircon. Lead-206 is the eventual stable product of a multistep chain."
    }
  });
  const LN2 = Math.LN2;
  const TOTAL = 180;
  const NS = "http://www.w3.org/2000/svg";
  const $ = id => document.getElementById(id);
  const number = value => value.toLocaleString("en-US");
  const clockControl = $("clock");
  const elapsed = $("elapsed");
  const atomsSvg = $("atoms-svg");
  const chartSvg = $("decay-chart");
  const draw = {
    x0: 65, x1: 694, y0: 23, y1: 247,
    width: 629, height: 224
  };

  let playing = false;
  let frameId = null;
  let lastFrameTime = null;
  let smoothHalfLives = Number(elapsed.value);
  const atomCircles = [];
  let plotCursor = null;
  let plotParentPoint = null;
  let plotDecayedPoint = null;
  let sampleThresholds = [];

  function svg(tag, attrs, textValue) {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs || {})) {
      el.setAttribute(key, String(value));
    }
    if (textValue !== undefined) el.textContent = textValue;
    return el;
  }

  function ageLabel(years) {
    if (!Number.isFinite(years) || years < 0) return "Not defined";
    if (years === 0) return "0 years";
    if (years >= 1e9) return (years / 1e9).toFixed(2) + " billion years";
    if (years >= 1e6) return (years / 1e6).toFixed(2) + " million years";
    return number(Math.round(years)) + " years";
  }

  function remaining(halfLives) {
    return Math.pow(2, -halfLives);
  }

  function ageFromFraction(fraction, clock) {
    if (!(fraction > 0 && fraction <= 1)) return NaN;
    return -Math.log(fraction) * clock.halfLife / LN2;
  }

  function setSvgAttrs(element, attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      element.setAttribute(key, String(value));
    }
  }

  function seededRandom(seed) {
    let s = seed >>> 0;
    return () => {
      s = (Math.imul(1664525, s) + 1013904223) >>> 0;
      return (s + 0.5) / 4294967296;
    };
  }

  function initializeAtoms() {
    const random = seededRandom(20261119);
    for (let i = 0; i < TOTAL; i++) {
      const u = random();
      sampleThresholds.push(-Math.log(u) / LN2);
      const row = Math.floor(i / 18);
      const col = i % 18;
      const circle = svg("circle", {
        cx: 22 + col * 33.6,
        cy: 20 + row * 23.3,
        r: 7.3,
        class: "atom parent"
      });
      atomCircles.push(circle);
      atomsSvg.appendChild(circle);
    }
  }

  const toX = h => draw.x0 + h / 10 * draw.width;
  const toY = fraction => draw.y1 - fraction * draw.height;

  function buildCurve(fn) {
    const segments = [];
    for (let i = 0; i <= 250; i++) {
      const h = i / 25;
      segments.push((i ? "L " : "M ") + toX(h).toFixed(3) + " " + toY(fn(h)).toFixed(3));
    }
    return segments.join(" ");
  }

  function initializeChart() {
    chartSvg.appendChild(svg("rect", {
      x: draw.x0, y: draw.y0, width: draw.width, height: draw.height,
      fill: "#10263a", rx: 4
    }));
    for (let pct = 0; pct <= 100; pct += 25) {
      const y = toY(pct / 100);
      chartSvg.appendChild(svg("line", {x1: draw.x0, y1: y, x2: draw.x1, y2: y, class: "chart-grid"}));
      chartSvg.appendChild(svg("text", {
        x: draw.x0 - 11, y: y + 5, "text-anchor": "end", class: "chart-tick"
      }, pct + "%"));
    }
    for (let h = 0; h <= 10; h += 2) {
      const x = toX(h);
      chartSvg.appendChild(svg("line", {x1: x, y1: draw.y0, x2: x, y2: draw.y1, class: "chart-grid"}));
      chartSvg.appendChild(svg("text", {
        x, y: draw.y1 + 22, "text-anchor": "middle", class: "chart-tick"
      }, String(h)));
    }
    chartSvg.appendChild(svg("line", {
      x1: draw.x0, y1: draw.y1, x2: draw.x1, y2: draw.y1, class: "chart-axis"
    }));
    chartSvg.appendChild(svg("line", {
      x1: draw.x0, y1: draw.y0, x2: draw.x0, y2: draw.y1, class: "chart-axis"
    }));
    chartSvg.appendChild(svg("text", {
      x: (draw.x0 + draw.x1) / 2, y: 288, "text-anchor": "middle", class: "chart-tick"
    }, "Elapsed half-lives"));
    chartSvg.appendChild(svg("path", {
      d: buildCurve(h => remaining(h)),
      class: "chart-curve-parent"
    }));
    chartSvg.appendChild(svg("path", {
      d: buildCurve(h => 1 - remaining(h)),
      class: "chart-curve-decayed"
    }));
    plotCursor = svg("line", {class: "chart-cursor", x1: 0, x2: 0, y1: draw.y0, y2: draw.y1});
    plotParentPoint = svg("circle", {r: 6.4, class: "chart-dot", fill: "#70e5c3"});
    plotDecayedPoint = svg("circle", {r: 6.4, class: "chart-dot", fill: "#f0ab68"});
    chartSvg.append(plotCursor, plotParentPoint, plotDecayedPoint);
  }

  function renderMain() {
    const clock = CLOCKS[clockControl.value];
    const h = Number(elapsed.value);
    const p = remaining(h);
    const age = h * clock.halfLife;
    let actual = 0;
    for (let i = 0; i < TOTAL; i++) {
      const alive = sampleThresholds[i] > h;
      atomCircles[i].setAttribute("class", alive ? "atom parent" : "atom decayed");
      if (alive) actual++;
    }
    const x = toX(h);
    setSvgAttrs(plotCursor, {x1: x, x2: x});
    setSvgAttrs(plotParentPoint, {cx: x, cy: toY(p)});
    setSvgAttrs(plotDecayedPoint, {cx: x, cy: toY(1 - p)});
    $("elapsed-value").textContent = h.toFixed(2);
    $("age-value").textContent = ageLabel(age);
    $("parent-value").textContent = (100 * p).toFixed(2) + "%";
    $("expected-value").textContent = (TOTAL * p).toFixed(1) + " of " + TOTAL;
    $("actual-value").textContent = actual + " of " + TOTAL;
    $("clock-description").textContent = clock.description;
    if (clockControl.value === "k40") {
      $("branch-output").textContent = "Of the original parent population, approximately " +
        ((1 - p) * clock.branch * 100).toFixed(2) + "% has become argon-40 and " +
        ((1 - p) * (1 - clock.branch) * 100).toFixed(2) +
        "% has become calcium-40 (approximate branching fractions).";
    } else if (clockControl.value === "u238") {
      $("branch-output").textContent = "The dots indicate parent atoms that have undergone decay; the corresponding stable lead-206 abundance is approximated on geological timescales, not simulated step by step.";
    } else {
      $("branch-output").textContent = "Each decayed carbon-14 parent becomes nitrogen-14, but real radiocarbon dating measures carbon-14 remaining, not accumulated nitrogen-14.";
    }
    if (h === 0) {
      $("lab-feedback").textContent = "At the beginning, every parent atom is present. Start the clock to see radioactive decay.";
    } else {
      $("lab-feedback").textContent = "After " + h.toFixed(2) + " half-lives, " +
        (100 * p).toFixed(2) + "% of the original parent population is expected to remain. " +
        "This small simulated set has " + actual + " surviving dots, demonstrating statistical variation.";
    }
    let warning = "";
    if (clockControl.value === "u238" && age > 4.54e9) {
      warning = "Hypothetical timescale: this simulated age exceeds Earth's approximate 4.54-billion-year age. The mathematics is valid; it is not an age for an Earth sample.";
    } else if (clockControl.value === "k40" && age > 4.54e9) {
      warning = "Hypothetical Earth sample: this modeled age is older than Earth. Do not interpret it as the age of a terrestrial mineral.";
    } else if (clockControl.value === "c14" && age > 5e4) {
      warning = "Beyond the usual practical radiocarbon dating range (around 50,000 years). Real measurements approach background and contamination limits.";
    }
    $("age-warning").textContent = warning;
    $("age-warning").hidden = !warning;
    renderInversion();
  }

  function renderInversion() {
    const clock = CLOCKS[clockControl.value];
    const f = Number($("measured").value) / 100;
    const sigma = Number($("uncertainty").value) / 100;
    const age = ageFromFraction(f, clock);
    const lowerF = f - sigma;
    const upperF = Math.min(1, f + sigma);
    const youngest = ageFromFraction(upperF, clock);
    const oldest = lowerF > 0 ? ageFromFraction(lowerF, clock) : Infinity;
    $("measured-value").textContent = (100 * f).toFixed(1).replace(/\.0$/, "") + "%";
    $("uncertainty-value").textContent = "±" + (sigma * 100).toFixed(1) +
      (sigma === 0.01 ? " percentage point" : " percentage points");
    $("inferred-age").textContent = ageLabel(age);
    const halfLives = age / clock.halfLife;
    $("inferred-equation").textContent = "t = −ln(" + f.toFixed(3) +
      ") ÷ λ = " + halfLives.toFixed(2) + " half-lives";
    if (Number.isFinite(oldest)) {
      $("inferred-range").textContent = ageLabel(youngest) + " – " + ageLabel(oldest);
    } else {
      $("inferred-range").textContent = "At least " + ageLabel(youngest) + "; no finite upper bound";
    }
    $("range-note").textContent = "Interval from the chosen ±" + (sigma * 100).toFixed(1) +
      " percentage-point error alone. Not a statistical confidence interval, a calibrated radiocarbon age, or a full laboratory uncertainty budget.";
  }

  function renderMethod() {
    const material = $("material").value;
    const method = $("method").value;
    let message;
    if (material === "wood") {
      message = method === "c14"
        ? "Suitable in principle: charcoal is formerly living carbon. Sample pretreatment, contamination control and radiocarbon calibration are still necessary."
        : "Not suitable for the charcoal itself: this isotope system requires appropriate minerals. Choose radiocarbon for preserved organic carbon.";
    } else if (material === "ash") {
      if (method === "k40") message = "Potentially suitable: potassium-bearing minerals in volcanic material can yield K–Ar or ⁴⁰Ar/³⁹Ar ages if the relevant argon-retention conditions are satisfied.";
      else if (method === "u238") message = "Potentially suitable if suitable newly crystallized zircon or other U-bearing minerals occur in the ash. Check for inherited or reworked grains.";
      else message = "Radiocarbon does not directly date inorganic volcanic ash. Associated charcoal, if present and young enough, is a separate possible target.";
    } else if (material === "zircon") {
      message = method === "u238"
        ? "Excellent candidate: zircon commonly incorporates uranium but little initial lead, making dual U–Pb dating powerful. Inspect zoning, inheritance, and lead-loss evidence."
        : "Not the appropriate clock for zircon: choose U–Pb. Zircon is generally not a suitable potassium-bearing or organic-carbon sample.";
    } else {
      message = "A dinosaur fossil of Mesozoic age cannot meaningfully be dated by carbon-14, and these isotope clocks generally do not directly date the fossil's original death. Instead date suitable associated igneous layers or mineral phases, then combine ages with stratigraphy.";
    }
    $("method-result").textContent = message;
  }

  function renderStrata() {
    const upper = Number($("upper-layer").value);
    const lower = Number($("lower-layer").value);
    $("upper-value").textContent = upper + " Ma";
    $("lower-value").textContent = lower + " Ma";
    $("upper-layer-label").textContent = upper + " Ma";
    $("lower-layer-label").textContent = lower + " Ma";
    $("strata-result").textContent = "If the layers are undisturbed and the ash ages date deposition, the intervening fossil layer is younger than " +
      lower + " Ma and older than " + upper + " Ma (between " + upper + " and " + lower + " million years old).";
  }

  function renderDisturbance() {
    const clock = CLOCKS[$("mineral-clock").value];
    const mode = $("disturbance").value;
    const fraction = Number($("disturbance-amount").value) / 100;
    const parent = remaining(1.5);
    const daughter = clock.branch * (1 - parent);
    const trueYears = clock.halfLife * 1.5;
    let observed = daughter;
    if (mode === "loss") observed *= 1 - fraction;
    if (mode === "inherit") observed += clock.branch * fraction;
    const apparentHalfLives = Math.log1p(observed / (clock.branch * parent)) / LN2;
    const apparentYears = clock.halfLife * apparentHalfLives;
    $("disturbance-amount").disabled = mode === "closed";
    $("disturbance-value").textContent = (100 * fraction).toFixed(0) + "%";
    $("true-age").textContent = ageLabel(trueYears);
    $("apparent-age").textContent = ageLabel(apparentYears);
    if (mode === "closed" || fraction === 0) {
      $("disturbance-result").textContent = "The inferred and true ages agree because the model assumes the clock remained closed and had no unaccounted initial radiogenic daughter.";
    } else if (mode === "loss") {
      $("disturbance-result").textContent = "Removing " + (100 * fraction).toFixed(0) + "% of accumulated radiogenic daughter gives an apparent age that is too young. Real mineral diffusion and disturbance histories are more complicated.";
    } else {
      $("disturbance-result").textContent = "Adding inherited daughter product makes this idealized parent–daughter age too old. Real isotope methods use initial-daughter corrections and independent checks.";
    }
  }

  function stop() {
    playing = false;
    lastFrameTime = null;
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    $("play").textContent = "▶ Play";
    $("play").setAttribute("aria-pressed", "false");
  }

  function tick(time) {
    if (!playing) return;
    if (lastFrameTime !== null) {
      const delta = Math.min(100, time - lastFrameTime);
      const next = Math.min(10, smoothHalfLives + delta * 0.00027);
      smoothHalfLives = next;
      const snapped = Math.round(next * 20) / 20;
      if (Number(elapsed.value) !== snapped) {
        elapsed.value = String(snapped);
        renderMain();
      }
      if (next >= 10) {
        stop();
        return;
      }
    }
    lastFrameTime = time;
    frameId = requestAnimationFrame(tick);
  }

  function setLearningLevel(level, focus) {
    for (const tab of document.querySelectorAll(".level-tabs [role=tab]")) {
      const selected = tab.dataset.level === String(level);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) tab.focus();
    }
    for (let index = 1; index <= 4; index++) {
      $("level-" + index).hidden = index !== level;
    }
  }

  function installListeners() {
    clockControl.addEventListener("change", () => { stop(); renderMain(); });
    elapsed.addEventListener("input", () => { stop(); smoothHalfLives = Number(elapsed.value); renderMain(); });
    $("play").addEventListener("click", () => {
      if (playing) { stop(); return; }
      if (Number(elapsed.value) >= 10) elapsed.value = "0";
      smoothHalfLives = Number(elapsed.value);
      playing = true;
      $("play").textContent = "Ⅱ Pause";
      $("play").setAttribute("aria-pressed", "true");
      frameId = requestAnimationFrame(tick);
    });
    $("reset").addEventListener("click", () => {
      stop();
      clockControl.value = "c14";
      elapsed.value = "1";
      smoothHalfLives = 1;
      $("measured").value = "25";
      $("uncertainty").value = "1";
      for (const answer of document.querySelectorAll("[data-predict]")) {
        answer.classList.remove("correct", "wrong");
        answer.setAttribute("aria-pressed", "false");
      }
      $("prediction-feedback").textContent = "Choose an answer to check your prediction.";
      renderMain();
    });
    for (const button of document.querySelectorAll("[data-predict]")) {
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        const answer = Number(button.dataset.predict);
        for (const other of document.querySelectorAll("[data-predict]")) {
          other.classList.remove("correct", "wrong");
          other.setAttribute("aria-pressed", String(other === button));
        }
        button.classList.add(answer === 25 ? "correct" : "wrong");
        $("prediction-feedback").textContent = answer === 25
          ? "Correct! Half of 50% is 25% of the original population."
          : "Try again: after one half-life 50% remains. After the next half-life, half of that remainder survives.";
      });
    }
    $("measured").addEventListener("input", renderInversion);
    $("uncertainty").addEventListener("input", renderInversion);
    for (const button of document.querySelectorAll("[data-fraction]")) {
      button.addEventListener("click", () => {
        $("measured").value = button.dataset.fraction;
        renderInversion();
      });
    }
    $("method-check").addEventListener("click", renderMethod);
    $("upper-layer").addEventListener("input", renderStrata);
    $("lower-layer").addEventListener("input", renderStrata);
    $("mineral-clock").addEventListener("change", renderDisturbance);
    $("disturbance").addEventListener("change", renderDisturbance);
    $("disturbance-amount").addEventListener("input", renderDisturbance);
    const tabs = Array.from(document.querySelectorAll(".level-tabs [role=tab]"));
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => setLearningLevel(index + 1, false));
      tab.addEventListener("keydown", event => {
        let next = -1;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        if (next === -1) return;
        event.preventDefault();
        setLearningLevel(next + 1, true);
      });
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
    });
  }

  initializeAtoms();
  initializeChart();
  installListeners();
  renderMain();
  renderStrata();
  renderDisturbance();
  setLearningLevel(1, false);
})();