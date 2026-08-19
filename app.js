const CATEGORIES = [
  { id: "red", label: "Red", color: "#d62828" },
  { id: "blue", label: "Blue", color: "#1d4ed8" },
  { id: "orange", label: "Orange", color: "#ea580c" },
  { id: "green", label: "Green", color: "#16a34a" },
  { id: "yellow", label: "Yellow", color: "#eab308" },
  { id: "purple", label: "Purple", color: "#7c3aed" },
];

const STORAGE_KEY = "trivial-pursuit-scorekeeper";

const setupEl = document.getElementById("setup");
const boardEl = document.getElementById("board");
const teamNamesEl = document.getElementById("team-names");
const teamsEl = document.getElementById("teams");
const legendEl = document.getElementById("legend");
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const newGameBtn = document.getElementById("new-game-btn");

let state = loadState() || {
  teamCount: 2,
  names: ["Team 1", "Team 2", "Team 3", "Team 4"],
  started: false,
  wedges: {},
};

function emptyWedges() {
  return Object.fromEntries(CATEGORIES.map((category) => [category.id, false]));
}

function ensureTeamWedges() {
  for (let i = 0; i < 4; i += 1) {
    const key = String(i);
    if (!state.wedges[key]) {
      state.wedges[key] = emptyWedges();
    }
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function polar(cx, cy, radius, angle) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function wedgePath(index, total = 6) {
  const cx = 100;
  const cy = 100;
  const outer = 86;
  const inner = 26;
  const gap = 0.018;
  const slice = (Math.PI * 2) / total;
  const start = -Math.PI / 2 + index * slice + gap;
  const end = -Math.PI / 2 + (index + 1) * slice - gap;
  const a = polar(cx, cy, outer, start);
  const b = polar(cx, cy, outer, end);
  const c = polar(cx, cy, inner, end);
  const d = polar(cx, cy, inner, start);
  return [
    `M ${a.x.toFixed(2)} ${a.y.toFixed(2)}`,
    `A ${outer} ${outer} 0 0 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`,
    `L ${c.x.toFixed(2)} ${c.y.toFixed(2)}`,
    `A ${inner} ${inner} 0 0 0 ${d.x.toFixed(2)} ${d.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function renderLegend() {
  legendEl.innerHTML = CATEGORIES.map(
    (category) => `
      <span class="legend-item">
        <span class="swatch" style="background:${category.color}"></span>
        ${category.label}
      </span>
    `
  ).join("");
}

function renderSetup() {
  document.querySelectorAll(".count-btn").forEach((button) => {
    button.classList.toggle(
      "is-selected",
      Number(button.dataset.count) === state.teamCount
    );
  });

  teamNamesEl.innerHTML = Array.from({ length: state.teamCount }, (_, i) => {
    return `
      <div class="team-field">
        <label for="team-name-${i}">Team ${i + 1} name</label>
        <input id="team-name-${i}" data-name-index="${i}" value="${escapeHtml(
          state.names[i] || `Team ${i + 1}`
        )}" maxlength="24" />
      </div>
    `;
  }).join("");
}

function pieSvg(teamIndex) {
  const wedges = CATEGORIES.map((category, index) => {
    const filled = Boolean(state.wedges[teamIndex]?.[category.id]);
    return `
      <path
        class="wedge ${filled ? "is-filled" : "is-empty"}"
        data-team="${teamIndex}"
        data-category="${category.id}"
        d="${wedgePath(index)}"
        fill="${category.color}"
        tabindex="0"
        role="button"
        aria-pressed="${filled}"
        aria-label="${escapeHtml(state.names[teamIndex])} ${category.label} wedge"
      ></path>
    `;
  }).join("");

  return `
    <svg class="pie" viewBox="0 0 200 200" aria-hidden="false">
      <circle class="rim" cx="100" cy="100" r="93"></circle>
      ${wedges}
      <circle class="hub" cx="100" cy="100" r="22"></circle>
    </svg>
  `;
}

function filledCount(teamIndex) {
  return CATEGORIES.filter((category) => state.wedges[teamIndex]?.[category.id])
    .length;
}

function renderBoard() {
  teamsEl.className = `teams count-${state.teamCount}`;
  teamsEl.innerHTML = Array.from({ length: state.teamCount }, (_, i) => {
    const score = filledCount(i);
    const complete = score === CATEGORIES.length;
    return `
      <article class="team-card ${complete ? "is-complete" : ""}">
        ${complete ? `<div class="complete-banner">Full pie</div>` : ""}
        <h3>${escapeHtml(state.names[i])}</h3>
        <p class="score-line">${score} / 6 wedges</p>
        <div class="collected" aria-hidden="true">
          ${CATEGORIES.map((category) => {
            const on = Boolean(state.wedges[i]?.[category.id]);
            const fill = on ? category.color : "transparent";
            return `<span class="dot ${on ? "is-on" : ""}" style="background:${fill}; ${on ? "" : `box-shadow: inset 0 0 0 6px ${category.color}22`}"></span>`;
          }).join("")}
        </div>
        <div class="pie-wrap">${pieSvg(i)}</div>
      </article>
    `;
  }).join("");
}

function showBoard(started) {
  setupEl.hidden = started;
  setupEl.classList.toggle("is-hidden", started);
  boardEl.hidden = !started;
  boardEl.classList.toggle("is-hidden", !started);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function toggleWedge(teamIndex, categoryId) {
  ensureTeamWedges();
  const current = Boolean(state.wedges[teamIndex][categoryId]);
  state.wedges[teamIndex][categoryId] = !current;
  saveState();
  renderBoard();
}

document.querySelector(".count-picker").addEventListener("click", (event) => {
  const button = event.target.closest(".count-btn");
  if (!button) return;
  state.teamCount = Number(button.dataset.count);
  saveState();
  renderSetup();
});

teamNamesEl.addEventListener("input", (event) => {
  const input = event.target.closest("input[data-name-index]");
  if (!input) return;
  state.names[Number(input.dataset.nameIndex)] = input.value;
  saveState();
});

startBtn.addEventListener("click", () => {
  ensureTeamWedges();
  for (let i = 0; i < state.teamCount; i += 1) {
    if (!state.names[i]?.trim()) {
      state.names[i] = `Team ${i + 1}`;
    }
  }
  state.started = true;
  saveState();
  showBoard(true);
  renderBoard();
});

resetBtn.addEventListener("click", () => {
  for (let i = 0; i < state.teamCount; i += 1) {
    state.wedges[i] = emptyWedges();
  }
  saveState();
  renderBoard();
});

newGameBtn.addEventListener("click", () => {
  state.started = false;
  state.wedges = {};
  ensureTeamWedges();
  saveState();
  showBoard(false);
  renderSetup();
});

teamsEl.addEventListener("click", (event) => {
  const wedge = event.target.closest(".wedge");
  if (!wedge) return;
  toggleWedge(wedge.dataset.team, wedge.dataset.category);
});

teamsEl.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const wedge = event.target.closest(".wedge");
  if (!wedge) return;
  event.preventDefault();
  toggleWedge(wedge.dataset.team, wedge.dataset.category);
});

ensureTeamWedges();
renderLegend();
renderSetup();
showBoard(Boolean(state.started));
if (state.started) {
  renderBoard();
}
