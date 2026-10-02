/* Shared navigation, prev/next links and footer.
   To rename or reorder pages, edit only this list. */
const PAGES = [
  { file: "01-introduction.html",     title: "Introduction and Problem Definition", n: "1" },
  { file: "02-face-detection.html",   title: "Detecting the Driver's Face",         n: "2" },
  { file: "03-eye-detection.html",    title: "Eye-Based Drowsiness Detection",      n: "3" },
  { file: "04-yawning.html",          title: "Mouth and Yawning Detection",         n: "4" },
  { file: "05-head-pose.html",        title: "Head-Pose Analysis",                  n: "5" },
  { file: "06-traditional-ml.html",   title: "Computer Vision and Machine Learning", n: "6" },
  { file: "07-deep-learning.html",    title: "Deep Learning Approaches",            n: "7" },
  { file: "08-datasets.html",         title: "Datasets and Evaluation",             n: "8" },
  { file: "09-existing-systems.html", title: "Existing Systems",                    n: "9" },
  { file: "10-challenges.html",       title: "Real-World Challenges",               n: "10" },
  { file: "11-demo.html",             title: "Experimental Demonstration",          n: "11" },
  { file: "12-conclusion.html",       title: "Future Research and Conclusion",      n: "12" },
  { file: "quiz.html",                title: "Quiz",                                n: "" },
  { file: "bibliography.html",        title: "Annotated Bibliography",              n: "" }
];

(function () {
  const here = location.pathname.split("/").pop() || "index.html";
  const idx = PAGES.findIndex(p => p.file === here);

  // ----- sidebar -----
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) {
    const item = p =>
      `<li><a href="${p.file}"${p.file === here ? ' aria-current="page"' : ""}>` +
      `<span class="n">${p.n}</span><span>${p.title}</span></a></li>`;
    const main = PAGES.filter(p => p.n).map(item).join("");
    const extra = PAGES.filter(p => !p.n).map(item).join("");
    sidebar.innerHTML =
      `<a class="brand" href="index.html">Driver Drowsiness Detection<small>A computer vision tutorial</small></a>` +
      `<button class="menu-btn" aria-expanded="false" aria-controls="site-nav">Menu</button>` +
      `<nav id="site-nav" aria-label="Tutorial sections">` +
      `<ul><li><a href="index.html"${here === "index.html" ? ' aria-current="page"' : ""}><span class="n"></span><span>Home</span></a></li></ul>` +
      `<ol>${main}</ol><ul class="extra">${extra}</ul></nav>`;
    const btn = sidebar.querySelector(".menu-btn");
    btn.addEventListener("click", () => {
      const open = sidebar.classList.toggle("open");
      btn.setAttribute("aria-expanded", open);
    });
  }

  // ----- prev / next -----
  const pager = document.querySelector(".pager");
  if (pager) {
    let prev, next;
    if (here === "index.html") { next = PAGES[0]; }
    else if (idx >= 0) {
      prev = idx === 0 ? { file: "index.html", title: "Home" } : PAGES[idx - 1];
      next = PAGES[idx + 1];
    }
    pager.innerHTML =
      (prev ? `<a class="prev" href="${prev.file}"><small>Previous</small><strong>${prev.title}</strong></a>` : "") +
      (next ? `<a class="next" href="${next.file}"><small>Next</small><strong>${next.title}</strong></a>` : "");
  }

  // ----- footer -----
  const footer = document.querySelector(".site-footer");
  if (footer) {
    footer.innerHTML =
      `CS663 Computer Vision, Project 1. Written by Swathi Pallikala. ` +
      `Image sources are credited in each caption; full references are in the <a href="bibliography.html">annotated bibliography</a>.`;
  }

  // ----- homepage eye demo -----
  const svg = document.getElementById("eye-demo");
  if (svg) runEyeDemo(svg);
})();

/* Animated eye: the lids move, the six EAR landmarks follow them,
   and EAR is computed from those landmark positions every frame. */
function runEyeDemo(svg) {
  const upper = svg.querySelector("#lid-up"), lower = svg.querySelector("#lid-low");
  const edgeUp = svg.querySelector("#edge-up"), edgeLow = svg.querySelector("#edge-low");
  const pts = ["p1", "p2", "p3", "p4", "p5", "p6"].map(id => svg.querySelector("#" + id));
  const v1 = svg.querySelector("#v1"), v2 = svg.querySelector("#v2");
  const earEl = document.getElementById("ear-value");
  const closedEl = document.getElementById("closed-time");
  const lamp = document.getElementById("lamp");

  const CX1 = 20, CX4 = 220, MID = 60;   // eye corners and centre line
  const OPEN_UP = 30, OPEN_LOW = 90;     // lid positions when fully open
  const THRESH = 0.2, ALERT_AFTER = 0.8; // EAR threshold, seconds closed before alert

  // Eye openness (1 = open, 0 = closed) over a 7-second cycle:
  // two quick blinks, then one long closure that should trigger the alert.
  function openness(t) {
    const c = t % 7;
    const dip = (start, len) => {
      if (c < start || c > start + len) return 1;
      const k = (c - start) / len;
      return Math.abs(Math.cos(k * Math.PI)) ** 0.6;
    };
    if (c >= 4.2 && c <= 5.8) {             // long closure
      if (c < 4.45) return 1 - (c - 4.2) / 0.25;
      if (c > 5.55) return (c - 5.55) / 0.25;
      return 0.04;
    }
    return Math.min(dip(1.2, 0.3), dip(2.6, 0.3));
  }

  function draw(o) {
    const yUp = MID - (MID - OPEN_UP) * o;
    const yLow = MID + (OPEN_LOW - MID) * o;
    // Quadratic lid curves from corner to corner, bent so they pass through p2/p3 and p5/p6.
    const K = 0.43875; // 2t(1-t) at x = 85 for a curve from x = 20 to x = 220
    const cUp = MID - (MID - yUp) / K, cLow = MID + (yLow - MID) / K;
    const curveUp = `M${CX4} ${MID} Q120 ${cUp} ${CX1} ${MID}`;
    const curveLow = `M${CX4} ${MID} Q120 ${cLow} ${CX1} ${MID}`;
    upper.setAttribute("d", `M0 0 H240 V${MID} H${CX4} Q120 ${cUp} ${CX1} ${MID} H0 Z`);
    lower.setAttribute("d", `M0 120 H240 V${MID} H${CX4} Q120 ${cLow} ${CX1} ${MID} H0 Z`);
    edgeUp.setAttribute("d", curveUp);
    edgeLow.setAttribute("d", curveLow);
    // landmarks: p1 left corner, p2/p3 upper lid, p4 right corner, p5/p6 lower lid
    const xs = [CX1, 85, 155, CX4, 155, 85];
    const ys = [MID, yUp, yUp, MID, yLow, yLow];
    pts.forEach((p, i) => { p.setAttribute("cx", xs[i]); p.setAttribute("cy", ys[i]); });
    v1.setAttribute("y1", yUp); v1.setAttribute("y2", yLow);
    v2.setAttribute("y1", yUp); v2.setAttribute("y2", yLow);
    // EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
    return ((yLow - yUp) * 2) / (2 * (CX4 - CX1));
  }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    earEl.textContent = draw(1).toFixed(2);
    closedEl.textContent = "Animation paused (reduced motion)";
    return;
  }

  let closedSince = null, start = null;
  function frame(ts) {
    if (start === null) start = ts;
    const t = (ts - start) / 1000;
    const ear = draw(openness(t));
    earEl.textContent = ear.toFixed(2);
    if (ear < THRESH) {
      if (closedSince === null) closedSince = t;
      const d = t - closedSince;
      closedEl.textContent = `Below threshold for ${d.toFixed(1)} s`;
      lamp.classList.toggle("on", d >= ALERT_AFTER);
    } else {
      closedSince = null;
      closedEl.textContent = "Eyes open";
      lamp.classList.remove("on");
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
