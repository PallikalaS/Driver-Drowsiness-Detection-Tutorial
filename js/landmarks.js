/* Interactive 68-point landmark explorer for Section 2.
   Points are a schematic layout that follows the standard 68-point numbering. */
(function () {
  const svg = document.getElementById("lm-svg");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";
  const pts = [];

  // Jaw 1-17
  for (let i = 0; i < 17; i++) {
    const a = -0.1 + (Math.PI + 0.2) * i / 16;
    pts.push([150 - 95 * Math.cos(a), 150 + 140 * Math.sin(a)]);
  }
  // Eyebrows 18-27
  for (let i = 0; i < 5; i++) pts.push([74 + i * 15, 108 - 12 * Math.sin(Math.PI * i / 4)]);
  for (let i = 0; i < 5; i++) pts.push([166 + i * 15, 108 - 12 * Math.sin(Math.PI * i / 4)]);
  // Nose bridge 28-31, nostrils 32-36
  for (let i = 0; i < 4; i++) pts.push([150, 125 + i * 17]);
  for (let i = 0; i < 5; i++) pts.push([130 + i * 10, 192 + 5 * Math.sin(Math.PI * i / 4)]);
  // Eyes 37-42 (right eye, image left) and 43-48 (left eye): p1..p6
  const eye = (cx) => [[cx - 22, 140], [cx - 8, 131], [cx + 7, 131], [cx + 22, 140], [cx + 7, 149], [cx - 8, 149]];
  eye(107).forEach(p => pts.push(p));
  eye(193).forEach(p => pts.push(p));
  // Mouth outer 49-60, inner 61-68
  for (let i = 0; i < 12; i++) {
    const a = Math.PI + 2 * Math.PI * i / 12;
    pts.push([150 + 36 * Math.cos(a), 238 + 15 * Math.sin(a)]);
  }
  for (let i = 0; i < 8; i++) {
    const a = Math.PI + 2 * Math.PI * i / 8;
    pts.push([150 + 21 * Math.cos(a), 238 + 6 * Math.sin(a)]);
  }

  const GROUPS = {
    jaw:   { range: [1, 17],  name: "Jaw line: points 1–17", text: "Outline of the face from ear to ear. Used for face shape and, together with the nose, for head-pose estimation (Section 5)." },
    brows: { range: [18, 27], name: "Eyebrows: points 18–27", text: "Five points per eyebrow. Raised brows can help separate surprise from drowsiness." },
    nose:  { range: [28, 36], name: "Nose: points 28–36", text: "Bridge and nostrils. The nose tip is a stable anchor for head-pose estimation (Section 5)." },
    eyes:  { range: [37, 48], name: "Eyes: points 37–48", text: "Six points per eye, in the order p1 to p6 used by the Eye Aspect Ratio (Section 3). In Python code the list starts at 0, so these are indices 36–47." },
    mouth: { range: [49, 68], name: "Mouth: points 49–68", text: "Twelve outer-lip and eight inner-lip points. The inner lips give the Mouth Aspect Ratio used for yawning (Section 4)." }
  };

  const gBox = document.createElementNS(NS, "rect");
  Object.entries({ x: 40, y: 70, width: 220, height: 245, rx: 4, fill: "none", stroke: "#2F6F8F", "stroke-width": 2, "stroke-dasharray": "6 4" })
    .forEach(([k, v]) => gBox.setAttribute(k, v));
  gBox.style.display = "none";
  svg.appendChild(gBox);

  const dots = [], labels = [];
  pts.forEach((p, i) => {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", p[0].toFixed(1)); c.setAttribute("cy", p[1].toFixed(1));
    c.setAttribute("r", 3.2); c.setAttribute("fill", "#E9A23B");
    c.setAttribute("stroke", "#16212F"); c.setAttribute("stroke-width", ".8");
    c.classList.add("lm");
    const t = document.createElementNS(NS, "title"); t.textContent = "Point " + (i + 1);
    c.appendChild(t);
    svg.appendChild(c); dots.push(c);
    const l = document.createElementNS(NS, "text");
    l.setAttribute("x", (p[0] + 4).toFixed(1)); l.setAttribute("y", (p[1] - 4).toFixed(1));
    l.classList.add("lbl"); l.textContent = i + 1; l.style.display = "none";
    svg.appendChild(l); labels.push(l);
  });

  const info = document.getElementById("lm-info");
  const buttons = document.querySelectorAll(".explorer .controls button");
  function show(key) {
    buttons.forEach(b => b.setAttribute("aria-pressed", b.dataset.group === key));
    gBox.style.display = key === "box" ? "" : "none";
    const g = GROUPS[key];
    dots.forEach((d, i) => {
      const inG = g && i + 1 >= g.range[0] && i + 1 <= g.range[1];
      d.classList.toggle("dim", Boolean(key === "box" || (g && !inG)));
      d.setAttribute("r", inG ? 4.2 : 3.2);
      labels[i].style.display = inG && (key === "eyes" || key === "brows" || key === "nose") ? "" : "none";
    });
    if (key === "all") info.innerHTML = "<strong>All 68 points</strong>The full landmark layout. Choose a region to see which point numbers belong to it, or hover over a point to see its number.";
    else if (key === "box") info.innerHTML = "<strong>Face detection box</strong>Step one: a face detector finds a rectangle around the face. The landmark model then searches only inside this box.";
    else info.innerHTML = `<strong>${g.name}</strong>${g.text}`;
  }
  buttons.forEach(b => b.addEventListener("click", () => show(b.dataset.group)));
  show("all");
})();
