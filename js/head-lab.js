/* Head-pose lab for Section 5: rotates a simple 3D face model by pitch, yaw and roll
   and projects it onto the image, the forward version of what solvePnP undoes. */
(function () {
  const svg = document.getElementById("head-svg");
  if (!svg) return;
  const $ = id => document.getElementById(id);
  const NS = "http://www.w3.org/2000/svg";
  const CENTER = [0, 0, -250];   // rotate around the middle of the head, not the nose tip

  // Generic 3D face model (same six points commonly used with solvePnP), plus outline shapes
  const MODEL = {
    nose: [0, 0, 0], chin: [0, -330, -65],
    eyeR: [-225, 170, -135], eyeL: [225, 170, -135],
    mouthR: [-150, -150, -125], mouthL: [150, -150, -125]
  };
  const ring = (cx, cy, cz, rx, ry, n = 40) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = 2 * Math.PI * i / n;
      return [cx + rx * Math.cos(a), cy + ry * Math.sin(a), cz];
    });
  const SHAPES = [
    { pts: ring(0, -30, -200, 300, 420), stroke: "#7F90A4", w: 1.5 },          // face outline
    { pts: ring(-225 + 45, 170, -135, 60, 26, 24), stroke: "#DCE4EC", w: 1.4 }, // right eye
    { pts: ring(225 - 45, 170, -135, 60, 26, 24), stroke: "#DCE4EC", w: 1.4 },  // left eye
    { pts: [[0, 190, -140], [0, 0, 0], [-45, -40, -95], [45, -40, -95], [0, 0, 0]], stroke: "#E9A23B", w: 1.8 }, // nose
    { pts: [[-150, -150, -125], [0, -175, -110], [150, -150, -125]], stroke: "#DCE4EC", w: 1.6 }               // mouth
  ];

  const lines = SHAPES.map(s => {
    const p = document.createElementNS(NS, "polyline");
    p.setAttribute("fill", "none"); p.setAttribute("stroke", s.stroke);
    p.setAttribute("stroke-width", s.w); p.setAttribute("stroke-linejoin", "round");
    svg.appendChild(p); return p;
  });
  const dots = Object.keys(MODEL).map(() => {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("r", 4); c.setAttribute("fill", "#E9A23B");
    c.setAttribute("stroke", "#16212F"); c.setAttribute("stroke-width", 1);
    svg.appendChild(c); return c;
  });

  function rotate([x, y, z], pitch, yaw, roll) {
    x -= CENTER[0]; y -= CENTER[1]; z -= CENTER[2];
    const p = -pitch * Math.PI / 180, q = yaw * Math.PI / 180, r = roll * Math.PI / 180;
    let y1 = y * Math.cos(p) - z * Math.sin(p), z1 = y * Math.sin(p) + z * Math.cos(p);            // pitch (x axis)
    let x2 = x * Math.cos(q) + z1 * Math.sin(q), z2 = -x * Math.sin(q) + z1 * Math.cos(q);         // yaw (y axis)
    let x3 = x2 * Math.cos(r) - y1 * Math.sin(r), y3 = x2 * Math.sin(r) + y1 * Math.cos(r);        // roll (z axis)
    return [x3, y3, z2];
  }
  function project([x, y, z]) {
    const f = 1400, s = f / (f - z);            // mild perspective: closer points look bigger
    return [130 + 0.28 * x * s, 150 - 0.28 * y * s];
  }

  function update() {
    const pitch = +$("hp-pitch").value, yaw = +$("hp-yaw").value, roll = +$("hp-roll").value;
    $("hp-pitch-o").textContent = pitch + "°";
    $("hp-yaw-o").textContent = yaw + "°";
    $("hp-roll-o").textContent = roll + "°";
    SHAPES.forEach((s, i) =>
      lines[i].setAttribute("points", s.pts.map(p => project(rotate(p, pitch, yaw, roll)).map(v => v.toFixed(1)).join(",")).join(" ")));
    Object.values(MODEL).forEach((p, i) => {
      const [u, v] = project(rotate(p, pitch, yaw, roll));
      dots[i].setAttribute("cx", u.toFixed(1)); dots[i].setAttribute("cy", v.toFixed(1));
    });
    const msgs = [];
    if (pitch <= -15) msgs.push("Head dropped forward: a possible nod if it happened slowly and then snapped back.");
    if (pitch >= 15) msgs.push("Head tilted back.");
    if (Math.abs(yaw) >= 30) msgs.push("Turned away from the road: a distraction sign if it lasts more than a moment.");
    if (Math.abs(roll) >= 20) msgs.push("Head tilted sideways: can happen as a drowsy driver's neck relaxes.");
    const v = $("hp-verdict");
    v.textContent = msgs.length ? msgs.join(" ") : "Facing the road: no head-pose warning.";
    v.classList.toggle("warn", msgs.length > 0);
  }
  ["hp-pitch", "hp-yaw", "hp-roll"].forEach(id => $(id).addEventListener("input", update));
  $("hp-reset").addEventListener("click", () => {
    ["hp-pitch", "hp-yaw", "hp-roll"].forEach(id => ($(id).value = 0)); update();
  });
  update();
})();
