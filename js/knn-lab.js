/* k-NN lab for Section 6: synthetic feature windows (PERCLOS vs. mean blink duration),
   click to add a new window, and the k nearest labeled windows vote. */
(function () {
  const svg = document.getElementById("knn-svg");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  const W = 600, H = 340, L = 56, R = 14, T = 14, B = 44;
  const XMAX = 40, YMIN = 100, YMAX = 600;             // PERCLOS %, blink duration ms
  const sx = v => L + (W - L - R) * v / XMAX;
  const sy = v => T + (H - T - B) * (1 - (v - YMIN) / (YMAX - YMIN));
  const ix = px => (px - L) / (W - L - R) * XMAX;
  const iy = py => YMIN + (1 - (py - T) / (H - T - B)) * (YMAX - YMIN);

  // Deterministic pseudo-random synthetic data
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
  const data = [];
  for (let i = 0; i < 24; i++) data.push({ x: Math.max(1, 7.5 + 4.5 * gauss()), y: 225 + 55 * gauss(), c: 0 });
  for (let i = 0; i < 24; i++) data.push({ x: Math.min(38, 17 + 6 * gauss()), y: Math.min(580, 360 + 75 * gauss()), c: 1 });

  const el = (tag, attrs, parent = svg) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent.appendChild(e); return e;
  };
  // axes and grid
  for (let v = 0; v <= 40; v += 10) {
    el("line", { x1: sx(v), x2: sx(v), y1: T, y2: H - B, stroke: "#E3E8ED" });
    el("text", { x: sx(v), y: H - B + 18, "text-anchor": "middle", "font-size": 12, fill: "#566476" }).textContent = v + "%";
  }
  for (let v = 100; v <= 600; v += 100) {
    el("line", { x1: L, x2: W - R, y1: sy(v), y2: sy(v), stroke: "#E3E8ED" });
    el("text", { x: L - 8, y: sy(v) + 4, "text-anchor": "end", "font-size": 12, fill: "#566476" }).textContent = v;
  }
  el("text", { x: (L + W - R) / 2, y: H - 6, "text-anchor": "middle", "font-size": 12.5, fill: "#1B2530" }).textContent = "PERCLOS over the window";
  el("text", { x: 14, y: (T + H - B) / 2, "text-anchor": "middle", "font-size": 12.5, fill: "#1B2530", transform: `rotate(-90 14 ${(T + H - B) / 2})` }).textContent = "Mean blink duration (ms)";

  const linkLayer = el("g", {});
  const COLORS = ["#2F6F8F", "#C2413A"];
  const dots = data.map(d => el("circle", { cx: sx(d.x), cy: sy(d.y), r: 5.5, fill: COLORS[d.c], "fill-opacity": .85, stroke: "#fff", "stroke-width": 1.2 }));
  const query = el("g", { style: "display:none" });
  el("circle", { r: 9, fill: "#E9A23B", stroke: "#16212F", "stroke-width": 1.5 }, query);
  el("text", { y: 4, "text-anchor": "middle", "font-size": 11, "font-weight": 700, fill: "#16212F" }, query).textContent = "?";

  let k = 3, q = null;
  const result = document.getElementById("knn-result");

  function classify() {
    linkLayer.innerHTML = "";
    dots.forEach(d => d.setAttribute("r", 5.5));
    if (!q) { result.textContent = "Click or tap anywhere on the chart to add a new driving window."; return; }
    query.style.display = "";
    query.setAttribute("transform", `translate(${sx(q.x)},${sy(q.y)})`);
    // distance on features scaled to 0..1, so both axes count equally
    const dist = d => Math.hypot((d.x - q.x) / XMAX, (d.y - q.y) / (YMAX - YMIN));
    const nearest = data.map((d, i) => ({ i, dd: dist(d) })).sort((a, b) => a.dd - b.dd).slice(0, k);
    let drowsy = 0;
    nearest.forEach(n => {
      const d = data[n.i];
      el("line", { x1: sx(q.x), y1: sy(q.y), x2: sx(d.x), y2: sy(d.y), stroke: COLORS[d.c], "stroke-width": 1.5, "stroke-dasharray": "4 3" }, linkLayer);
      dots[n.i].setAttribute("r", 8);
      drowsy += d.c;
    });
    const label = drowsy > k / 2 ? "Drowsy" : "Alert";
    result.innerHTML = `New window: PERCLOS ${q.x.toFixed(1)}%, blinks ${Math.round(q.y)} ms. ` +
      `Votes: ${k - drowsy} alert, ${drowsy} drowsy → <span style="color:${label === "Drowsy" ? COLORS[1] : COLORS[0]}">${label}</span>`;
  }

  svg.addEventListener("click", e => {
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    if (p.x < L || p.x > W - R || p.y < T || p.y > H - B) return;
    q = { x: ix(p.x), y: iy(p.y) }; classify();
  });
  document.querySelectorAll("#knn-k button").forEach(b => b.addEventListener("click", () => {
    k = +b.dataset.k;
    document.querySelectorAll("#knn-k button").forEach(x => x.setAttribute("aria-pressed", x === b));
    classify();
  }));
  classify();
})();
