/* Quiz questions. To add one, copy a block and change the text.
   "answer" is the position of the correct option, starting at 0. */
const QUESTIONS = [
  {
    q: "How many landmark points per eye does the Eye Aspect Ratio (EAR) use?",
    options: ["4", "6", "12", "68"],
    answer: 1,
    why: "EAR uses six points: the two eye corners (p1, p4), two on the upper lid (p2, p3), and two on the lower lid (p5, p6)."
  },
  {
    q: "What happens to EAR when the eye closes?",
    options: ["It rises sharply", "It stays the same", "It falls toward zero", "It becomes negative"],
    answer: 2,
    why: "EAR is the eye's height divided by its width. As the lids close, the height shrinks, so the ratio falls toward zero."
  },
  {
    q: "How does a system tell a normal blink apart from drowsy eye closure?",
    options: [
      "By the color of the eye",
      "By how long EAR stays below the threshold",
      "By which eye closes first",
      "By the size of the pupil"
    ],
    answer: 1,
    why: "A blink drops EAR for only a few frames. Drowsiness keeps it low much longer, so systems count consecutive frames below the threshold."
  },
  {
    q: "What does PERCLOS measure?",
    options: [
      "The percentage of time the eyes are mostly closed over a time window",
      "The number of yawns per minute",
      "The angle of the driver's head",
      "The brightness of the eye region"
    ],
    answer: 0,
    why: "PERCLOS is the PERcentage of eyelid CLOSure: the share of frames in a window where the eyes are at least 80% closed."
  },
  {
    q: "A driver wears dark sunglasses. Which signal is still most useful?",
    options: ["Eye Aspect Ratio", "PERCLOS", "Head pose and yawning", "Pupil size"],
    answer: 2,
    why: "Sunglasses hide the eyes, so eye-based measures fail. Mouth and head-pose signals still work."
  }
];

(function () {
  const box = document.getElementById("quiz");
  const scoreEl = document.getElementById("score");
  let answered = 0, correct = 0;

  function render() {
    answered = 0; correct = 0; scoreEl.textContent = "";
    box.innerHTML = "";
    QUESTIONS.forEach((item, qi) => {
      const div = document.createElement("div");
      div.className = "q";
      div.innerHTML = `<h3>${qi + 1}. ${item.q}</h3>`;
      item.options.forEach((text, oi) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "opt"; b.textContent = text;
        b.addEventListener("click", () => choose(div, item, oi));
        div.appendChild(b);
      });
      const why = document.createElement("p");
      why.className = "why"; why.setAttribute("aria-live", "polite");
      div.appendChild(why);
      box.appendChild(div);
    });
  }

  function choose(div, item, oi) {
    const buttons = div.querySelectorAll("button.opt");
    buttons.forEach(b => (b.disabled = true));
    buttons[item.answer].classList.add("right");
    const ok = oi === item.answer;
    if (!ok) buttons[oi].classList.add("wrong");
    div.querySelector(".why").innerHTML = `<strong>${ok ? "Correct." : "Not quite."}</strong> ${item.why}`;
    answered++; if (ok) correct++;
    if (answered === QUESTIONS.length) {
      scoreEl.textContent = `You got ${correct} of ${QUESTIONS.length} right.`;
    }
  }

  document.getElementById("reset").addEventListener("click", render);
  render();
})();
