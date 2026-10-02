/* Convolution lab for Section 7: a tiny grayscale eye image, a 3x3 horizontal-edge filter,
   and the resulting feature map. Toggle between an open and a closed eye. */
(function () {
  const inBox = document.getElementById("conv-in");
  if (!inBox) return;
  const outBox = document.getElementById("conv-out");
  const ROWS = 9, COLS = 13;
  const KERNEL = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];   // responds to horizontal edges

  function eyeImage(open) {
    const img = [];
    for (let r = 0; r < ROWS; r++) {
      const row = [];
      for (let c = 0; c < COLS; c++) {
        const x = (c - 6) / 6, y = (r - 4) / 4;           // -1..1 coordinates
        let v = 0.8;                                       // skin
        if (open) {
          const inside = Math.abs(y) < 0.75 * (1 - x * x); // almond-shaped opening
          if (inside) v = 1.0;                             // white of the eye
          const d = Math.hypot(x * 1.5, y);
          if (inside && d < 0.65) v = 0.35;                // iris
          if (inside && d < 0.3) v = 0.05;                 // pupil
        } else {
          if (r === 4 && Math.abs(x) < 0.95) v = 0.25;     // closed lid: a single dark lash line
        }
        row.push(v);
      }
      img.push(row);
    }
    return img;
  }
  function convolve(img) {
    const out = [];
    for (let r = 1; r < ROWS - 1; r++) {
      const row = [];
      for (let c = 1; c < COLS - 1; c++) {
        let s = 0;
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) s += KERNEL[i + 1][j + 1] * img[r + i][c + j];
        row.push(s);
      }
      out.push(row);
    }
    return out;
  }
  function draw(box, grid, color) {
    box.style.gridTemplateColumns = `repeat(${grid[0].length}, 1fr)`;
    box.innerHTML = "";
    grid.flat().forEach(v => {
      const d = document.createElement("div");
      d.style.background = color(v);
      d.title = v.toFixed(2);
      box.appendChild(d);
    });
  }
  const gray = v => { const g = Math.round(v * 255); return `rgb(${g},${g},${g})`; };
  const diverge = v => {
    const a = Math.min(1, Math.abs(v) / 3);
    return v >= 0 ? `rgba(233,162,59,${a})` : `rgba(47,111,143,${a})`;
  };
  function show(open) {
    const img = eyeImage(open), fm = convolve(img);
    draw(inBox, img, gray);
    draw(outBox, fm, diverge);
    document.getElementById("conv-score").textContent = open
      ? "Open eye: the filter fires in curved arcs above and below the iris and pupil, tracing the shape of an open eye."
      : "Closed eye: the filter fires in two straight, parallel bands along the lash line and nothing else. Later layers learn to tell these patterns apart.";
    document.querySelectorAll("#conv-toggle button").forEach(b => b.setAttribute("aria-pressed", (b.dataset.open === "1") === open));
  }
  document.querySelectorAll("#conv-toggle button").forEach(b => b.addEventListener("click", () => show(b.dataset.open === "1")));
  show(true);
})();
