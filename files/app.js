// Candidate Prep — vanilla JS app driven by TOPICS (see data.js)

const app = document.getElementById("app");

const state = {
  screen: "topics",   // topics | modules | setup | quiz
  topic: null,
  module: null,
  numQuestions: 10,
  quizQuestions: [],
  currentIndex: 0,
  selectedOption: null,
  isLocked: false,     // true once "Submit" has been clicked for the current question
  score: 0,
};

function resetToTopics() {
  state.screen = "topics";
  state.topic = null;
  state.module = null;
  state.quizQuestions = [];
  state.currentIndex = 0;
  state.selectedOption = null;
  state.isLocked = false;
  state.score = 0;
  render();
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function letter(i) { return ["A", "B", "C", "D"][i]; }

/* ---------------- Screens ---------------- */

function renderTopics() {
  const cards = TOPICS.map((t, idx) => {
    const modCount = t.modules.length;
    const qCount = t.modules.reduce((s, m) => s + m.questions.length, 0);
    return `
      <button class="topic-card" data-topic="${t.id}">
        <span class="num">${String(idx + 1).padStart(2, "0")}</span>
        <span class="name">${t.name}</span>
        <span class="meta">${modCount} modules &middot; ${qCount} questions ready</span>
      </button>`;
  }).join("");

  app.innerHTML = `
    <div class="step-eyebrow"><span>Step 1 &middot; Choose a topic</span><span class="rule"></span></div>
    <h2 class="screen-title">Which topic are you drilling today?</h2>
    <div class="topic-grid">${cards}</div>
  `;

  app.querySelectorAll(".topic-card").forEach(el => {
    el.addEventListener("click", () => {
      state.topic = TOPICS.find(t => t.id === el.dataset.topic);
      state.screen = "modules";
      render();
    });
  });
}

function renderModules() {
  const t = state.topic;
  const rows = t.modules.map(m => {
    const n = m.questions.length;
    const ready = n > 0;
    return `
      <div class="module-row ${ready ? "" : "disabled"}" data-module="${m.id}">
        <span class="m-name">${m.name}</span>
        <span class="m-count ${ready ? "ready" : ""}">${ready ? n + " questions" : "coming soon"}</span>
      </div>`;
  }).join("");

  app.innerHTML = `
    <button class="back-link">&larr; All topics</button>
    <div class="step-eyebrow"><span>Step 2 &middot; ${t.name}</span><span class="rule"></span></div>
    <h2 class="screen-title">Pick a module</h2>
    <div class="module-list">${rows}</div>
  `;

  app.querySelector(".back-link").addEventListener("click", resetToTopics);

  app.querySelectorAll(".module-row:not(.disabled)").forEach(el => {
    el.addEventListener("click", () => {
      state.module = t.modules.find(m => m.id === el.dataset.module);
      state.screen = "setup";
      render();
    });
  });
}

function renderSetup() {
  const t = state.topic, m = state.module;
  const max = m.questions.length;
  const options = [...new Set([Math.min(5, max), Math.min(10, max), max].filter(n => n > 0))];
  if (!options.includes(state.numQuestions) || state.numQuestions > max) {
    state.numQuestions = options[options.length - 1];
  }

  const chips = options.map(n =>
    `<button class="count-chip ${n === state.numQuestions ? "active" : ""}" data-n="${n}">${n} question${n === 1 ? "" : "s"}</button>`
  ).join("");

  app.innerHTML = `
    <button class="back-link">&larr; ${t.name}</button>
    <div class="step-eyebrow"><span>Step 3 &middot; Set up your run</span><span class="rule"></span></div>
    <div class="setup-card">
      <div class="ticket-head">
        <div>
          <div class="t-topic">${t.name}</div>
          <h3>${m.name}</h3>
        </div>
        <div class="t-topic">${max} available</div>
      </div>
      <p style="margin:0 0 8px;font-size:13.5px;color:#a99a72;font-family:var(--font-mono);">How many questions?</p>
      <div class="count-row">${chips}</div>
      <button class="btn-primary" id="start-btn">Start quiz</button>
    </div>
  `;

  app.querySelector(".back-link").addEventListener("click", () => {
    state.screen = "modules";
    render();
  });

  app.querySelectorAll(".count-chip").forEach(el => {
    el.addEventListener("click", () => {
      state.numQuestions = parseInt(el.dataset.n, 10);
      render();
    });
  });

  document.getElementById("start-btn").addEventListener("click", startQuiz);
}

function startQuiz() {
  const pool = shuffle(state.module.questions).slice(0, state.numQuestions);
  state.quizQuestions = pool;
  state.currentIndex = 0;
  state.selectedOption = null;
  state.isLocked = false;
  state.score = 0;
  state.screen = "quiz";
  render();
}

function renderQuiz() {
  const q = state.quizQuestions[state.currentIndex];
  const total = state.quizQuestions.length;
  const idx = state.currentIndex;
  const pct = Math.round(((idx) / total) * 100);
  const isLast = idx === total - 1;

  const options = q.options.map((opt, i) => {
    let cls = "option-row";
    if (state.isLocked) {
      cls += " locked";
      if (i === q.correct) cls += " correct-answer";
      else if (i === state.selectedOption) cls += " wrong-answer";
    } else if (i === state.selectedOption) {
      cls += " selected";
    }
    return `
      <div class="${cls}" data-i="${i}">
        <span class="bubble">${letter(i)}</span>
        <span class="option-text">${opt}</span>
      </div>`;
  }).join("");

  let feedbackHtml = "";
  if (state.isLocked) {
    const correct = state.selectedOption === q.correct;
    feedbackHtml = `
      <div class="feedback-panel ${correct ? "correct" : "incorrect"}">
        <p class="feedback-head">${correct ? "Congrats — that's correct." : "Oh no — not quite."}</p>
        <p class="feedback-answer">Correct answer: ${letter(q.correct)}. ${q.options[q.correct]}</p>
        <p class="feedback-explain">${q.explain}</p>
      </div>`;
  }

  app.innerHTML = `
    <div class="quiz-progress">
      <span class="p-text">${state.module.name} &middot; ${idx + 1} / ${total}</span>
      <div class="p-track"><div class="p-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="question-card">
      <div class="q-tag">Question ${idx + 1}</div>
      <p class="q-text">${q.q}</p>
      <div class="option-list">${options}</div>
      ${feedbackHtml}
      <div class="q-actions">
        ${state.isLocked
          ? `<button class="btn-dark" id="next-btn">${isLast ? "See results" : "Next question"}</button>`
          : `<button class="btn-dark" id="submit-btn" ${state.selectedOption === null ? "disabled" : ""}>Submit answer</button>`
        }
      </div>
    </div>
  `;

  if (!state.isLocked) {
    app.querySelectorAll(".option-row").forEach(el => {
      el.addEventListener("click", () => {
        state.selectedOption = parseInt(el.dataset.i, 10);
        render();
      });
    });
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) submitBtn.addEventListener("click", submitAnswer);
  } else {
    document.getElementById("next-btn").addEventListener("click", nextQuestion);
  }
}

function submitAnswer() {
  if (state.selectedOption === null) return;
  state.isLocked = true;
  const q = state.quizQuestions[state.currentIndex];
  if (state.selectedOption === q.correct) state.score += 1;
  render();
}

function nextQuestion() {
  const isLast = state.currentIndex === state.quizQuestions.length - 1;
  if (isLast) {
    showResults();
    return;
  }
  state.currentIndex += 1;
  state.selectedOption = null;
  state.isLocked = false;
  render();
}

function showResults() {
  const total = state.quizQuestions.length;
  const pct = Math.round((state.score / total) * 100);
  let msg;
  if (pct === 100) msg = "Perfect run. That module is locked in.";
  else if (pct >= 80) msg = "Strong showing — just a couple to review.";
  else if (pct >= 50) msg = "Solid start. Worth another pass on this module.";
  else msg = "Good data point — revisit the learning outcomes and try again.";

  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `
    <div class="modal-card">
      <button class="modal-close" aria-label="Close">&times;</button>
      <div class="modal-eyebrow">${state.topic.name} &middot; ${state.module.name}</div>
      <p class="modal-score">${state.score}/${total}</p>
      <p class="modal-score-sub">${pct}% correct</p>
      <div class="modal-bar"><div class="modal-bar-fill" style="width:${pct}%"></div></div>
      <p class="modal-msg">${msg}</p>
      <button class="btn-primary" id="close-modal-btn">Back to topics</button>
    </div>
  `;
  document.body.appendChild(backdrop);

  const close = () => {
    backdrop.remove();
    resetToTopics();
  };
  backdrop.querySelector(".modal-close").addEventListener("click", close);
  backdrop.querySelector("#close-modal-btn").addEventListener("click", close);
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
}

/* ---------------- Router ---------------- */

function render() {
  if (state.screen === "topics") renderTopics();
  else if (state.screen === "modules") renderModules();
  else if (state.screen === "setup") renderSetup();
  else if (state.screen === "quiz") renderQuiz();
}

render();
