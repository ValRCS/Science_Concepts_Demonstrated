"use strict";

// A one-dimensional Fraunhofer probability model: all displayed detections are
// Monte Carlo samples of the same discrete, normalized density plotted below.
(function () {
  const H = 6.62607015e-34;
  const M_E = 9.1093837139e-31;
  const E_CHARGE = 1.602176634e-19;
  const HALF_WINDOW_MICROMETRES = 180;
  const BINS = 1024;
  const MAX_HITS = 50000;
  const DEFAULTS = Object.freeze({
    slitMode: "both",
    voltage: 100,
    separation: 1.2,
    width: 0.25,
    distance: 0.32,
    resolution: 0,
    distinguishability: 0
  });
  const $ = (id) => document.getElementById(id);
  const canvases = {
    apparatus: $("apparatus"),
    detector: $("detector"),
    distribution: $("distribution")
  };
  const ctx = {
    apparatus: canvases.apparatus.getContext("2d"),
    detector: canvases.detector.getContext("2d"),
    distribution: canvases.distribution.getContext("2d")
  };
  let settings = { ...DEFAULTS };
  let level = 1;
  let probability = new Float64Array(BINS);
  let cdf = new Float64Array(BINS);
  let histogram = new Uint32Array(BINS);
  let total = 0;
  let running = false;
  let frameToken = null;
  let lastFrame = 0;

  function wavelengthMetres(voltage) {
    return H / Math.sqrt(2 * M_E * E_CHARGE * voltage);
  }

  function sinc(z) {
    return Math.abs(z) < 1e-10 ? 1 : Math.sin(z) / z;
  }

  function fringeMicrometres(s) {
    return wavelengthMetres(s.voltage) * s.distance / (s.separation * 1e-6) * 1e6;
  }

  function coordinateMicrometres(bin) {
    return -HALF_WINDOW_MICROMETRES + (bin + 0.5) * 2 * HALF_WINDOW_MICROMETRES / BINS;
  }

  function rawDensity(xMicrometres, s) {
    const x = xMicrometres * 1e-6;
    const sinTheta = x / Math.hypot(s.distance, x);
    const lambda = wavelengthMetres(s.voltage);
    const beta = Math.PI * (s.width * 1e-6) * sinTheta / lambda;
    const envelope = sinc(beta) ** 2;
    if (s.slitMode !== "both") return envelope;

    const alpha = Math.PI * (s.separation * 1e-6) * sinTheta / lambda;
    // Equal-amplitude pure marker states: gamma = sqrt(1-D^2).
    const gamma = Math.sqrt(Math.max(0, 1 - s.distinguishability ** 2));
    return envelope * (1 + gamma * Math.cos(2 * alpha)) / 2;
  }

  function buildProbability(s) {
    const base = new Float64Array(BINS);
    for (let i = 0; i < BINS; i++) {
      base[i] = Math.max(0, rawDensity(coordinateMicrometres(i), s));
    }
    const blurred = new Float64Array(BINS);
    const dx = 2 * HALF_WINDOW_MICROMETRES / BINS;
    const sigma = s.resolution;
    if (sigma === 0) {
      blurred.set(base);
    } else {
      const radius = Math.ceil(3.5 * sigma / dx);
      const weights = new Float64Array(2 * radius + 1);
      let weightSum = 0;
      for (let offset = -radius; offset <= radius; offset++) {
        const weight = Math.exp(-0.5 * (offset * dx / sigma) ** 2);
        weights[offset + radius] = weight;
        weightSum += weight;
      }
      // Zero outside the displayed window, then condition on detection inside.
      for (let i = 0; i < BINS; i++) {
        let sum = 0;
        for (let offset = -radius; offset <= radius; offset++) {
          const j = i + offset;
          if (j >= 0 && j < BINS) {
            sum += base[j] * weights[offset + radius];
          }
        }
        blurred[i] = sum / weightSum;
      }
    }
    let norm = 0;
    for (const weight of blurred) norm += weight;
    if (!Number.isFinite(norm) || norm <= 0) throw new Error("Invalid simulation distribution");
    let cumulative = 0;
    for (let i = 0; i < BINS; i++) {
      probability[i] = blurred[i] / norm;
      cumulative += probability[i];
      cdf[i] = cumulative;
    }
    cdf[BINS - 1] = 1;
  }

  function sampleBin() {
    const r = Math.random();
    let lo = 0;
    let hi = BINS - 1;
    while (lo < hi) {
      const middle = (lo + hi) >>> 1;
      if (cdf[middle] < r) lo = middle + 1;
      else hi = middle;
    }
    return lo;
  }

  function line(context, a, b, c, d, color, width) {
    context.strokeStyle = color;
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(a, b);
    context.lineTo(c, d);
    context.stroke();
  }

  function drawApparatus() {
    const canvas = canvases.apparatus;
    const g = ctx.apparatus;
    const w = canvas.width;
    const h = canvas.height;
    g.fillStyle = "#071726";
    g.fillRect(0, 0, w, h);
    for (let x = 20; x < w; x += 36) line(g, x, 2, x, h - 2, "#1c344b", 0.6);
    for (let y = 14; y < h; y += 36) line(g, 0, y, w, y, "#1c344b", 0.6);

    const center = w / 2;
    const barrierY = 102;
    const screenY = 207;
    const separationPx = 40 + (settings.separation - 0.8) * 31;
    const holeWidthPx = 9 + settings.width * 20;
    const hole1 = center - separationPx / 2;
    const hole2 = center + separationPx / 2;
    const holes = settings.slitMode === "both" ? [hole1, hole2] :
      settings.slitMode === "left" ? [hole1] : [hole2];

    // Show a broad incoming coherent beam, not tracked electron trajectories.
    g.fillStyle = "rgba(84,208,222,.07)";
    g.beginPath();
    g.moveTo(center, 29);
    g.lineTo(center - 135, barrierY);
    g.lineTo(center + 135, barrierY);
    g.closePath();
    g.fill();

    // Opaque barrier segments leave appropriately placed openings.
    const openIntervals = holes.map((c) => [c - holeWidthPx / 2, c + holeWidthPx / 2]);
    openIntervals.sort((a, b) => a[0] - b[0]);
    let start = 14;
    for (const interval of openIntervals) {
      line(g, start, barrierY, interval[0], barrierY, "#89a6c0", 10);
      start = interval[1];
    }
    line(g, start, barrierY, w - 14, barrierY, "#89a6c0", 10);
    for (const slit of holes) {
      g.fillStyle = "#82e3d1";
      g.fillRect(slit - holeWidthPx / 2, barrierY - 5, holeWidthPx, 10);
      for (let j = -3; j <= 3; j++) {
        const endX = center + j * 74;
        g.beginPath();
        g.moveTo(slit, barrierY + 6);
        g.quadraticCurveTo((slit + endX) / 2, 168, endX, screenY - 5);
        g.strokeStyle = "rgba(93,215,222,.14)";
        g.lineWidth = 1.5;
        g.stroke();
      }
    }
    line(g, 14, screenY, w - 14, screenY, "#5d978f", 5);
    g.beginPath();
    g.arc(center, 29, 10, 0, Math.PI * 2);
    g.fillStyle = "#ffd682";
    g.fill();
    g.font = "15px system-ui, sans-serif";
    g.fillStyle = "#d3e6f4";
    g.fillText("Electron source", 18, 32);
    g.fillText("Aperture barrier", 18, barrierY - 15);
    g.fillText("Detector plane", 18, screenY - 12);
    g.font = "12px system-ui, sans-serif";
    g.fillStyle = "#9cbccf";
    g.fillText("Illustrative coherent wave contributions, not individual tracks", 18, 232);
  }

  function detectorX(bin) {
    return 33 + ((bin + 0.5) / BINS) * (canvases.detector.width - 66);
  }

  function drawDetectorBackground(emptyMessage) {
    const canvas = canvases.detector;
    const g = ctx.detector;
    const w = canvas.width;
    const h = canvas.height;
    g.fillStyle = "#061522";
    g.fillRect(0, 0, w, h);
    for (let k = -3; k <= 3; k++) {
      const x = 33 + (k + 3) / 6 * (w - 66);
      line(g, x, 12, x, h - 19, k === 0 ? "#486577" : "#263d50", k === 0 ? 1.4 : 0.7);
      g.font = "12px system-ui, sans-serif";
      g.fillStyle = "#a9bfd0";
      g.textAlign = "center";
      g.fillText(String(k * 60), x, h - 5);
    }
    g.textAlign = "left";
    g.fillStyle = "#bfdfeb";
    g.font = "12px system-ui, sans-serif";
    g.fillText("Screen position (µm)", 37, 19);
    if (emptyMessage) {
      g.fillStyle = "#d6e7f5";
      g.font = "19px system-ui, sans-serif";
      g.textAlign = "center";
      g.fillText("Fire an electron to see its detection mark", w / 2, h / 2);
      g.textAlign = "left";
    }
  }

  function drawHit(bin) {
    const g = ctx.detector;
    const x = detectorX(bin) + (Math.random() - 0.5) * (canvases.detector.width - 66) / BINS;
    const y = 31 + Math.random() * (canvases.detector.height - 61);
    g.fillStyle = "rgba(131,241,208,0.68)";
    g.beginPath();
    g.arc(x, y, 1.5, 0, Math.PI * 2);
    g.fill();
  }

  function drawDistribution() {
    const canvas = canvases.distribution;
    const g = ctx.distribution;
    const w = canvas.width;
    const h = canvas.height;
    const left = 38;
    const right = w - 17;
    const top = 15;
    const baseline = h - 36;
    const usableHeight = baseline - top;
    g.fillStyle = "#071726";
    g.fillRect(0, 0, w, h);

    const groups = 90;
    const expected = new Float64Array(groups);
    const observed = new Uint32Array(groups);
    for (let i = 0; i < BINS; i++) {
      const j = Math.min(groups - 1, Math.floor(i / BINS * groups));
      expected[j] += probability[i];
      observed[j] += histogram[i];
    }
    const peak = Math.max(...expected);
    for (const relative of [0, 0.25, 0.5, 0.75, 1]) {
      const yy = baseline - relative * usableHeight;
      line(g, left, yy, right, yy, relative === 0 ? "#7893a9" : "#28445a", relative === 0 ? 1.3 : .8);
    }
    if (total > 0) {
      const barWidth = (right - left) / groups;
      g.fillStyle = "rgba(255,192,102,0.58)";
      for (let j = 0; j < groups; j++) {
        const relative = (observed[j] / total) / peak;
        const barHeight = Math.min(usableHeight, Math.max(0, relative * usableHeight));
        g.fillRect(left + j * barWidth + 0.3, baseline - barHeight, Math.max(1, barWidth - 0.6), barHeight);
      }
    }
    g.beginPath();
    for (let j = 0; j < groups; j++) {
      const x = left + (j + 0.5) * (right - left) / groups;
      const y = baseline - (expected[j] / peak) * usableHeight;
      if (j === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokeStyle = "#74dcf6";
    g.lineWidth = 2.3;
    g.stroke();
    g.font = "12px system-ui, sans-serif";
    g.fillStyle = "#b1c9d8";
    g.textAlign = "center";
    for (let k = -3; k <= 3; k++) {
      g.fillText(String(k * 60), left + (k + 3) / 6 * (right - left), h - 17);
    }
    g.fillText("Transverse screen coordinate (µm)", w / 2, h - 3);
    g.textAlign = "left";
    g.fillText("Relative detection density", left + 3, top + 13);
    if (total < 25) {
      g.fillStyle = "#e2eaf5";
      g.fillText("Sample histogram is highly variable at small N", left + 3, top + 31);
    }
  }

  function refreshReadouts() {
    const s = settings;
    $("voltage-value").textContent = s.voltage + " V";
    $("separation-value").textContent = s.separation.toFixed(2) + " µm";
    $("width-value").textContent = s.width.toFixed(2) + " µm";
    $("distance-value").textContent = s.distance.toFixed(2) + " m";
    $("resolution-value").textContent = s.resolution.toFixed(1) + " µm";
    $("distinguishability-value").textContent = s.distinguishability.toFixed(2);
    $("lambda-value").textContent = (wavelengthMetres(s.voltage) * 1e9).toFixed(3) + " nm";
    $("spacing-value").textContent = fringeMicrometres(s).toFixed(1) + " µm";
    $("visibility-value").textContent = Math.sqrt(1 - s.distinguishability ** 2).toFixed(2);
    $("count").textContent = total.toLocaleString("en-US");
    $("count-sub").textContent = total === 0 ? "Start with a single electron" :
      total === 1 ? "One localized detection" : "Individual detections accumulated";
    $("distinguishability").disabled = s.slitMode !== "both";
  }

  function feedbackMessage() {
    if (settings.slitMode !== "both") {
      return "Only one slit is open: the two-path fringe modulation disappears, but a broad diffraction envelope remains.";
    }
    if (settings.distinguishability >= 1) {
      return "Fully distinguishable paths: no two-path interference term survives. The broad envelope remains.";
    }
    if (settings.distinguishability > 0) {
      return "Partial path information reduces the coherent fringe contrast, even if no one reads the marker.";
    }
    return total < 100
      ? "Individual marks look irregular. Add 1,000 or more to reveal the interference stripes."
      : "The independent detection marks are approaching the predicted interference probability distribution.";
  }

  function repaint() {
    refreshReadouts();
    drawDistribution();
    $("feedback").textContent = feedbackMessage();
  }

  function stopAuto() {
    running = false;
    if (frameToken !== null) cancelAnimationFrame(frameToken);
    frameToken = null;
    lastFrame = 0;
    $("auto").textContent = "▶ Auto-fire";
    $("auto").setAttribute("aria-pressed", "false");
  }

  function resetRun() {
    stopAuto();
    total = 0;
    histogram = new Uint32Array(BINS);
    drawDetectorBackground(true);
    repaint();
  }

  function fire(count) {
    if (total >= MAX_HITS) {
      stopAuto();
      $("feedback").textContent = "Reached 50,000 detections. Start a new run to continue experimenting.";
      return;
    }
    const n = Math.min(count, MAX_HITS - total);
    if (total === 0) drawDetectorBackground(false);
    for (let i = 0; i < n; i++) {
      const bin = sampleBin();
      histogram[bin]++;
      drawHit(bin);
    }
    total += n;
    repaint();
    if (total >= MAX_HITS) {
      stopAuto();
      $("feedback").textContent = "Reached the 50,000-detection display limit. Start a new run for another experiment.";
    }
  }

  function animate(now) {
    if (!running) return;
    if (now - lastFrame >= 45) {
      fire(65);
      lastFrame = now;
    }
    if (running) frameToken = requestAnimationFrame(animate);
  }

  function toggleAuto() {
    if (running) {
      stopAuto();
      return;
    }
    if (total >= MAX_HITS) resetRun();
    running = true;
    $("auto").textContent = "❚❚ Pause";
    $("auto").setAttribute("aria-pressed", "true");
    frameToken = requestAnimationFrame(animate);
  }

  function configureFromInputs() {
    settings = {
      slitMode: $("slit-mode").value,
      voltage: Number($("voltage").value),
      separation: Number($("separation").value),
      width: Number($("width").value),
      distance: Number($("distance").value),
      resolution: Number($("resolution").value),
      distinguishability: Number($("distinguishability").value)
    };
    buildProbability(settings);
    drawApparatus();
    resetRun();
  }

  function setLevel(nextLevel) {
    level = nextLevel;
    for (const button of document.querySelectorAll("[data-level]")) {
      button.setAttribute("aria-pressed", String(Number(button.dataset.level) === level));
    }
    for (const section of document.querySelectorAll(".level-content")) {
      section.hidden = section.id !== "level-" + level;
    }
    for (const element of document.querySelectorAll("[data-min-level]")) {
      element.hidden = Number(element.dataset.minLevel) > level;
    }
  }

  function initialize() {
    for (const id of ["voltage", "separation", "width", "distance", "resolution", "distinguishability"]) {
      $(id).addEventListener("input", configureFromInputs);
    }
    $("slit-mode").addEventListener("change", configureFromInputs);
    $("fire-one").addEventListener("click", () => fire(1));
    $("fire-ten").addEventListener("click", () => fire(10));
    $("fire-hundred").addEventListener("click", () => fire(100));
    $("fire-thousand").addEventListener("click", () => fire(1000));
    $("auto").addEventListener("click", toggleAuto);
    $("clear").addEventListener("click", resetRun);
    for (const button of document.querySelectorAll("[data-level]")) {
      button.addEventListener("click", () => setLevel(Number(button.dataset.level)));
    }
    window.addEventListener("pagehide", stopAuto);
    // A fresh load always begins with a clean, reproducible default configuration.
    $("slit-mode").value = DEFAULTS.slitMode;
    for (const id of ["voltage", "separation", "width", "distance", "resolution", "distinguishability"]) {
      $(id).value = DEFAULTS[id];
    }
    configureFromInputs();
    setLevel(1);
  }

  initialize();
})();
