/* Data split lab for Section 8: compares a random frame split with a split by driver. */
(function () {
  const box = document.getElementById("split-drivers");
  if (!box) return;
  const DRIVERS = 6, FRAMES = 10;
  const COLORS = ["#2F6F8F", "#E9A23B", "#7A5BA6", "#3E8E5B", "#C2413A", "#5B6B7E"];
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const randomTest = new Set();
  while (randomTest.size < 15) randomTest.add(Math.floor(rand() * DRIVERS * FRAMES));

  function render(mode) {
    box.innerHTML = "";
    let leaked = 0, testCount = 0;
    for (let d = 0; d < DRIVERS; d++) {
      const row = document.createElement("div"); row.className = "drv";
      row.innerHTML = `<span>Driver ${d + 1}</span>`;
      const fr = document.createElement("div"); fr.className = "frames";
      const isTest = f => mode === "random" ? randomTest.has(d * FRAMES + f) : d >= 4;
      for (let f = 0; f < FRAMES; f++) {
        const s = document.createElement("span");
        s.style.background = COLORS[d];
        const t = isTest(f);
        s.className = t ? "test" : "train";
        s.title = `Driver ${d + 1}, frame ${f + 1}: ${t ? "test" : "training"}`;
        if (t) {
          testCount++;
          if ((f > 0 && !isTest(f - 1)) || (f < FRAMES - 1 && !isTest(f + 1))) leaked++;
        }
        fr.appendChild(s);
      }
      row.appendChild(fr); box.appendChild(row);
    }
    const msg = document.getElementById("split-msg");
    if (mode === "random") {
      msg.className = "msg bad";
      msg.textContent = `${leaked} of ${testCount} test frames have a neighboring frame of the same driver in the training set. The model is being tested on people and moments it already saw during training.`;
    } else {
      msg.className = "msg good";
      msg.textContent = `0 of ${testCount} test frames come from a driver seen in training. Drivers 5 and 6 are completely new to the model, just like a real customer would be.`;
    }
    document.querySelectorAll("#split-mode button").forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === mode));
  }
  document.querySelectorAll("#split-mode button").forEach(b => b.addEventListener("click", () => render(b.dataset.mode)));
  render("random");
})();
