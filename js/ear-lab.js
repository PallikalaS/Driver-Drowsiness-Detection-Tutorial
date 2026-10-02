/* EAR lab for Section 3: a slider closes the eye, the six landmarks follow the lids,
   and EAR is computed from the landmark distances. */
(function () {
  const svg = document.getElementById("lab-eye");
  if (!svg) return;
  const $ = id => document.getElementById(id);
  const CX1 = 20, CX4 = 220, MID = 60, OPEN_UP = 30, OPEN_LOW = 90, K = 0.43875;
  const pts = ["q1", "q2", "q3", "q4", "q5", "q6"].map($);

  function update() {
    const o = $("lab-slider").value / 100;
    const yUp = MID - (MID - OPEN_UP) * o, yLow = MID + (OPEN_LOW - MID) * o;
    const cUp = MID - (MID - yUp) / K, cLow = MID + (yLow - MID) / K;
    $("lab-lid-up").setAttribute("d", `M0 0 H240 V${MID} H${CX4} Q120 ${cUp} ${CX1} ${MID} H0 Z`);
    $("lab-lid-low").setAttribute("d", `M0 120 H240 V${MID} H${CX4} Q120 ${cLow} ${CX1} ${MID} H0 Z`);
    const xs = [CX1, 85, 155, CX4, 155, 85], ys = [MID, yUp, yUp, MID, yLow, yLow];
    pts.forEach((p, i) => { p.setAttribute("cx", xs[i]); p.setAttribute("cy", ys[i]); });
    ["lab-v1", "lab-v2"].forEach(id => { $(id).setAttribute("y1", yUp); $(id).setAttribute("y2", yLow); });
    const a = yLow - yUp, b = yLow - yUp, c = CX4 - CX1;
    const ear = (a + b) / (2 * c);
    $("lab-calc").innerHTML =
      `EAR = (‖p2−p6‖ + ‖p3−p5‖) / (2 · ‖p1−p4‖)<br>` +
      `&nbsp;&nbsp;&nbsp;&nbsp;= (${a.toFixed(0)} + ${b.toFixed(0)}) / (2 × ${c}) = <b>${ear.toFixed(3)}</b>`;
    const closed = ear < 0.2;
    const st = $("lab-state");
    st.textContent = closed ? "Below the 0.20 threshold: counted as a closed-eye frame" : "Above the 0.20 threshold: eye counted as open";
    st.classList.toggle("closed", closed);
    $("lab-slider").setAttribute("aria-valuetext", `Eye ${Math.round(o * 100)}% open, EAR ${ear.toFixed(2)}`);
  }
  $("lab-slider").addEventListener("input", update);
  update();
})();
