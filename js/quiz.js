/* Quiz questions. To add one, copy a block and change the text.
   "answer" is the position of the correct option, starting at 0. */
const QUESTIONS = [
  {
    q: "Why do drowsy-driving crash statistics likely understate the problem? (Section 1)",
    options: [
      "Drowsy crashes only happen at night",
      "There is no roadside test for sleepiness, so it is hard to prove in crash reports",
      "Most drowsy drivers are never involved in crashes",
      "Police are not allowed to record drowsiness"
    ],
    answer: 1,
    why: "Unlike alcohol, sleepiness can't be measured at the roadside. One study estimated drowsy drivers are involved in about ten times more fatal crashes than are officially reported."
  },
  {
    q: "Why do most real-time systems use near-infrared (NIR) cameras with their own infrared lighting? (Sections 2 and 10)",
    options: [
      "They record in color",
      "They need no landmark model",
      "They see the face evenly in darkness and often through sunglasses",
      "They run at a higher resolution than any RGB camera"
    ],
    answer: 2,
    why: "Infrared lighting is invisible to the driver but gives the camera an evenly lit face at any time of day, and infrared often passes through lenses that block visible light."
  },
  {
    q: "How many landmark points per eye does the Eye Aspect Ratio (EAR) use? (Section 3)",
    options: ["4", "6", "12", "68"],
    answer: 1,
    why: "EAR uses six points: the two eye corners (p1, p4), two on the upper lid (p2, p3), and two on the lower lid (p5, p6)."
  },
  {
    q: "A driver leans closer to the camera without changing how open their eyes are. What happens to EAR? (Section 3)",
    options: [
      "It rises, because the eye looks bigger",
      "It falls, because the eye looks wider",
      "It becomes negative",
      "It stays about the same, because it is a ratio"
    ],
    answer: 3,
    why: "Moving closer scales every distance by the same factor. The height and width both grow, so their ratio stays the same."
  },
  {
    q: "How does a system tell a normal blink apart from drowsy eye closure? (Section 3)",
    options: [
      "By how long EAR stays below the threshold",
      "By the color of the eye",
      "By which eye closes first",
      "By the size of the pupil"
    ],
    answer: 0,
    why: "A blink drops EAR for only a fraction of a second. Drowsiness keeps it low much longer, so systems measure how long the eyes stay closed."
  },
  {
    q: "What does PERCLOS measure? (Section 3)",
    options: [
      "The number of yawns per minute",
      "The percentage of time the eyes are mostly closed over a time window",
      "The angle of the driver's head",
      "The brightness of the eye region"
    ],
    answer: 1,
    why: "PERCLOS is the PERcentage of eyelid CLOSure: the share of frames in a window, typically a minute, where the eyes are at least 80% closed."
  },
  {
    q: "The mouth opens wide for one second while the driver laughs. Why isn't it counted as a yawn? (Section 4)",
    options: [
      "MAR only works for yawns",
      "Laughing lowers MAR",
      "A yawn must keep MAR above the threshold for longer, such as 1.5 seconds",
      "Yawns are only detected with the eyes closed"
    ],
    answer: 2,
    why: "Height alone isn't enough. Yawns hold a wide opening for seconds, while laughing and talking only peak briefly, so a minimum duration filters them out."
  },
  {
    q: "Which head-pitch pattern most suggests a driver is nodding off? (Section 5)",
    options: [
      "A slow sag downward followed by a sudden jerk back up",
      "A smooth glance down at the dashboard and back",
      "A quick turn to check the side mirror",
      "Holding the head perfectly still"
    ],
    answer: 0,
    why: "As neck muscles relax the head sags slowly, then the driver startles awake and jerks it back up, unlike a controlled glance, which goes down and returns smoothly."
  },
  {
    q: "Why must features be scaled before using k-Nearest Neighbors? (Section 6)",
    options: [
      "k-NN only accepts values between 0 and 1",
      "Scaling makes training faster",
      "Scaling removes noisy windows",
      "Otherwise the feature with the largest numbers dominates the distance"
    ],
    answer: 3,
    why: "Blink duration in milliseconds would swamp PERCLOS in percent. Scaling puts every feature on a similar range so each one counts fairly."
  },
  {
    q: "What advantage does a CNN + LSTM have over a CNN that looks at single frames? (Section 7)",
    options: [
      "It needs no training data",
      "It can tell a blink from a long closure, because it sees the sequence over time",
      "It runs without a GPU in every case",
      "It explains its decisions in plain language"
    ],
    answer: 1,
    why: "A single frame of a closed eye looks the same during a blink and a microsleep. The LSTM reads a sequence of frames, so it learns how long the closure lasts."
  },
  {
    q: "Why can splitting video frames randomly into training and test sets make results look too good? (Section 8)",
    options: [
      "Random splits always create too small a test set",
      "Random splits remove all drowsy frames",
      "Near-identical frames of the same person end up in both sets",
      "Random splits change the frame rate"
    ],
    answer: 2,
    why: "Neighboring frames are almost copies. The model is then tested on people and moments it already saw, so a subject-independent split by driver is needed."
  },
  {
    q: "On data where 90% of windows are alert, a system that always answers \"alert\" scores 90% accuracy. What is its recall for drowsiness? (Section 8)",
    options: ["0%", "10%", "50%", "90%"],
    answer: 0,
    why: "It never catches a single drowsy window, so recall is zero. That's why precision and recall matter more than accuracy here."
  },
  {
    q: "A driver with naturally narrow eyes keeps triggering false drowsiness alerts. What is the best fix? (Section 10)",
    options: [
      "Raise the fixed EAR threshold for everyone",
      "Turn off eye detection for that driver",
      "Use only yawning",
      "Set the threshold relative to that driver's own open-eye baseline"
    ],
    answer: 3,
    why: "A fixed threshold assumes an average face. Calibrating to each driver's own baseline adapts to naturally narrow or wide eyes."
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
