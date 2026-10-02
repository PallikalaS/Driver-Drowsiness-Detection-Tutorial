/* Calibration lab for Section 10: one fixed EAR threshold vs. a threshold set from each driver's baseline. */
(function () {
  const s = document.getElementById("cal-base");
  if (!s) return;
  const FIXED = 0.23, RATIO = 0.75;
  const $ = id => document.getElementById(id);
  function cell(id, isClosedCall, truthClosed) {
    const c = $(id), correct = isClosedCall === truthClosed;
    c.textContent = (isClosedCall ? "Closed" : "Open") + (correct ? " ✓" : (truthClosed ? " (missed)" : " (false alarm)"));
    c.className = correct ? "ok" : "bad";
  }
  function update() {
    const base = s.value / 100;
    const cal = RATIO * base;
    $("cal-base-o").textContent = base.toFixed(2);
    $("cal-thr").textContent = cal.toFixed(3);
    const open = base, half = base * 0.5;
    $("cal-open-ear").textContent = open.toFixed(3);
    $("cal-half-ear").textContent = half.toFixed(3);
    cell("cal-open-fixed", open < FIXED, false);
    cell("cal-open-cal", open < cal, false);
    cell("cal-half-fixed", half < FIXED, true);
    cell("cal-half-cal", half < cal, true);
    $("cal-note").textContent = open < FIXED
      ? "This driver's eyes are naturally narrow: the fixed threshold mistakes their normal, open eyes for closed ones, the same false alarm reported in [3]. The calibrated threshold adapts and gets both cases right."
      : "For this driver both rules work. The fixed threshold only fails for drivers whose normal open-eye EAR sits below 0.23.";
  }
  s.addEventListener("input", update);
  update();
})();
