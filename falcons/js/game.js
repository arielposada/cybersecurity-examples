// =====================================================================
//  100 Falcons Said - game logic
//
//  Two teams. The playing team is chosen at the top of each board, and the
//  points of the answers it finds go to the round's "bank". When the board
//  ends, the bank goes to the team that won it.
//
//  Keys on a board:
//    1-9    reveal that answer (ding, the falcon says YES!) - or click a tile
//    Left / Right  choose the playing team
//    Q      add a strike (buzzer, big red X, the falcon says NO!)
//    S      steal mode on/off: the OTHER team gets one try
//             - a number (or a click) = the steal worked: win sound, that
//               answer opens and the stealing team takes the points
//             - Q (or the Fail button) = the steal failed: the playing
//               team keeps the points
//           then every answer is shown automatically
//    0      show every answer that is still covered (points go to the playing team)
//    Enter  back to the menu once the board is finished
//    Esc    leave the board early (no points are given)
//
//  Questions are read from data/questions.json (see README.txt).
// =====================================================================

const DATA_FILE = "falcons/data/questions.json";
const SAVE_KEY = "100-falcons-said-game";
const MIN_ANSWERS = 2;
const MAX_ANSWERS = 12;              // 1-9 have keys; 10, 11 and 12 are clicked
let MAX_STRIKES = 8;                 // can be changed with "settings": { "maxStrikes": 3 } in the JSON
const CONGRATS_ON_SHOW_ALL = false;   // true = also play the fanfare when 0 shows the answers
const DEFAULT_TEAMS = ["Team 1", "Team 2"];

const SOUND_FILES = {
    ding: "falcons/sounds/ding.mp3",
    strike: "falcons/sounds/strike.mp3",
    congrats: "falcons/sounds/congrats.mp3",
    flip: "falcons/sounds/flip.mp3",
    whoosh: "falcons/sounds/whoosh.mp3",
    intro: "falcons/sounds/intro.mp3",
    showAll: "falcons/sounds/show_all.mp3"
};

const LINES = {
    start: [
        "We asked 100 falcons... let's see what they said!",
        "100 falcons answered this one. Ready?",
        "Survey's in! Let's find those answers!"
    ],
    yes: ["YES!", "YES!", "YES!", "GOOD ONE!"],
    no: ["NO!"],
    allFound: "Congratulations! You found them all!",
    shown: "Here are all the answers!",
    bye: "See you next round!",
    turn: (team) => `${team}, you're up!`,
    stealOn: (team) => `${team}, can you steal it?`,
    stolen: (team) => `${team} steals the points!`,
    kept: (team) => `${team} keeps the points!`,
    winner: (team) => `${team} wins!`,
    tie: "It's a tie!"
};

// ---------------- Helpers ----------------
const $ = (id) => document.getElementById(id);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------- Questions (data/questions.json) ----------------
// The JSON can be a list of rounds, or { "settings": {...}, "rounds": [...] }.
// Each round: { "question": "...", "multiplier": 2 (optional),
//               "answers": [ { "text": "...", "points": 30 }, ... ] }
// An answer can also be just a string; then its points are worked out.
let BOARDS = [];
let dataSource = "";

function readAnswer(a) {
    if (typeof a === "string" || typeof a === "number") return { text: String(a).trim(), points: null };
    if (!a || typeof a !== "object") return { text: "", points: null };
    const text = String(a.text ?? a.answer ?? "").trim();
    const n = Number(a.points);
    const points = a.points === undefined || a.points === null || a.points === "" || !Number.isFinite(n) ? null : Math.max(0, Math.round(n));
    return { text, points };
}

// Answers without points share what is left of 100, more for the higher ones
function fillPoints(answers) {
    const missing = answers.filter(a => a.points === null);
    if (!missing.length) return;
    const given = answers.reduce((sum, a) => sum + (a.points ?? 0), 0);
    const left = Math.max(missing.length, 100 - given);
    const weights = missing.map((_, k) => missing.length - k);
    const total = weights.reduce((s, w) => s + w, 0);
    missing.forEach((a, k) => { a.points = Math.max(1, Math.round(left * weights[k] / total)); });
}

function buildBoards(raw) {
    const rounds = Array.isArray(raw) ? raw : (raw && (raw.rounds || raw.questions));
    if (!Array.isArray(rounds)) throw new Error('the file must have a list of rounds: { "rounds": [ ... ] }');
    const settings = (!Array.isArray(raw) && raw.settings) || {};
    const warnings = [];
    const boards = [];
    rounds.forEach((r, i) => {
        const question = String(r?.question ?? "").trim();
        const answers = (Array.isArray(r?.answers) ? r.answers : []).map(readAnswer).filter(a => a.text);
        if (!question) { warnings.push(`Round ${i + 1} has no "question", so it was skipped.`); return; }
        if (answers.length < MIN_ANSWERS || answers.length > MAX_ANSWERS) {
            warnings.push(`Round ${i + 1} ("${question}") needs ${MIN_ANSWERS} to ${MAX_ANSWERS} answers (it has ${answers.length}), so it was skipped.`);
            return;
        }
        fillPoints(answers);
        answers.sort((a, b) => b.points - a.points);          // most popular answer is #1
        const m = Number(r.multiplier);
        boards.push({ question, answers, multiplier: Number.isFinite(m) && m > 0 ? m : 1 });
    });
    if (!boards.length) throw new Error("no playable rounds were found");
    const ms = Number(settings.maxStrikes);
    return { boards, warnings, maxStrikes: Number.isInteger(ms) && ms >= 1 && ms <= 12 ? ms : 8 };
}

function useQuestions(raw, source, problem = "") {
    const { boards, warnings, maxStrikes } = buildBoards(raw);
    BOARDS = boards;
    MAX_STRIKES = maxStrikes;
    dataSource = source;
    warnings.forEach(w => console.warn(w));
    $("sourceNote").textContent = `${boards.length} rounds loaded from ${source}.` + (problem ? ` ${problem}` : "");
    $("sourceNote").classList.toggle("warn", Boolean(problem));
    const list = $("sourceWarnings");
    list.innerHTML = "";
    warnings.forEach(w => { const li = document.createElement("li"); li.textContent = w; list.appendChild(li); });
    list.hidden = warnings.length === 0;
    renderMenu();
}

function useBackup(problem) {
    if (typeof QUESTIONS === "undefined") {
        $("sourceNote").textContent = `No questions could be loaded. ${problem}`;
        $("sourceNote").classList.add("warn");
        return;
    }
    try { useQuestions(QUESTIONS, "the backup in js/questions.js", problem); }
    catch (err) { $("sourceNote").textContent = `The backup questions have a problem: ${err.message}. ${problem}`; $("sourceNote").classList.add("warn"); }
}

async function loadQuestions() {
    let text;
    try {
        const res = await fetch(DATA_FILE, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        text = await res.text();
    } catch (err) {
        useBackup(location.protocol === "file:"
            ? "(The browser can't read data/questions.json when the game is opened as a file. Put it on a website, or use the button below to pick questions.json.)"
            : `(data/questions.json could not be opened: ${err.message}.)`);
        return;
    }
    try {
        useQuestions(JSON.parse(text), "data/questions.json");
    } catch (err) {
        useBackup(`(data/questions.json has a mistake: ${err.message}. Fix it and reload the page.)`);
    }
}

function loadQuestionsFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try { useQuestions(JSON.parse(String(reader.result)), file.name); }
        catch (err) {
            $("sourceNote").textContent = `${file.name} has a mistake: ${err.message}. The questions did not change.`;
            $("sourceNote").classList.add("warn");
        }
    };
    reader.readAsText(file);
}

// ---------------- Sound ----------------
let muted = false;
const sounds = {};
for (const [name, src] of Object.entries(SOUND_FILES)) {
    const audio = new Audio(src);
    audio.preload = "auto";
    sounds[name] = audio;
}
function play(name, volume = 1) {
    if (muted || !sounds[name]) return;
    const a = sounds[name].cloneNode();
    a.volume = volume;
    a.play().catch(() => { /* the browser blocked it until the first key or click */ });
}

// ---------------- State ----------------
let screen = "setup";
let boardIndex = 0;
let board = null;
let state = [];            // per answer: "" covered, "found", "shown"
let strikes = 0;
let over = false;
const timers = [];         // timeouts that belong to the current board

// Teams and points
let teams = DEFAULT_TEAMS.map(name => ({ name, score: 0 }));
let playing = 0;           // index of the team playing the current board
let nextTeam = 0;          // who starts the next board (they take turns; you can change it)
let bank = 0;              // points found on this board, not given to anyone yet
let stealMode = false;
let played = [];           // questions already played (their text)

function later(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; }
function clearTimers() { while (timers.length) clearTimeout(timers.pop()); }
function announce(text) { $("announcer").textContent = text; }
const other = (t) => 1 - t;
const answerPoints = (i) => board.answers[i].points * board.multiplier;

// ---------------- Saving (so a page reload does not lose the scores) ----------------
function saveGame() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ teams, played, nextTeam })); } catch (e) { /* storage not available */ }
}
function readSave() {
    try {
        const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
        if (s && Array.isArray(s.teams) && s.teams.length === 2) return s;
    } catch (e) { /* ignore a broken save */ }
    return null;
}

// ---------------- Team setup ----------------
function showSetup() {
    clearTimers();
    falconHideNow();
    screen = "setup";
    for (const id of ["menu", "game", "results"]) $(id).hidden = true;
    $("setup").hidden = false;
    const save = readSave();
    $("team1Name").value = save ? save.teams[0].name : "";
    $("team2Name").value = save ? save.teams[1].name : "";
    const canContinue = save && (save.played?.length || save.teams.some(t => t.score > 0));
    $("continueBtn").hidden = !canContinue;
    if (canContinue) $("continueBtn").textContent = `Continue last game (${save.teams[0].name} ${save.teams[0].score} - ${save.teams[1].score} ${save.teams[1].name})`;
    setTimeout(() => $("team1Name").focus(), 50);
}

function startGame(e) {
    e.preventDefault();
    const names = [$("team1Name").value, $("team2Name").value].map((v, i) => v.trim() || DEFAULT_TEAMS[i]);
    teams = names.map(name => ({ name, score: 0 }));
    played = [];
    nextTeam = 0;
    saveGame();
    renderMenu();
    showMenu();
}

function continueGame() {
    const save = readSave();
    if (!save) return;
    teams = save.teams.map((t, i) => ({ name: String(t.name || DEFAULT_TEAMS[i]), score: Number(t.score) || 0 }));
    played = Array.isArray(save.played) ? save.played : [];
    nextTeam = save.nextTeam === 1 ? 1 : 0;
    renderMenu();
    showMenu();
}

function newGame() {
    if ((played.length || teams.some(t => t.score)) && !confirm("Start a new game? The scores will go back to 0.")) return;
    showSetup();
}

// ---------------- Scoreboard ----------------
function bump(el) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }

function renderScores(popTeam = -1) {
    teams.forEach((t, i) => {
        const card = $(`teamBtn${i}`);
        card.querySelector(".team-name").textContent = t.name;
        card.querySelector(".team-score").textContent = t.score;
        const isPlaying = i === playing;
        const isStealing = stealMode && i === other(playing);
        card.classList.toggle("playing", isPlaying && !isStealing);
        card.classList.toggle("stealing", isStealing);
        card.querySelector(".team-tag").textContent = isStealing ? "Stealing" : (isPlaying ? "Playing" : "");
        card.setAttribute("aria-pressed", String(isPlaying));
        card.disabled = over || stealMode;
        if (i === popTeam) bump(card);
        $(`menuName${i}`).textContent = t.name;
        $(`menuScore${i}`).textContent = t.score;
        $(`menuName${i}`).parentElement.classList.toggle("next", i === nextTeam);   // team that plays the next board
    });
    $("bankValue").textContent = bank;
    $("bankMult").hidden = !board || board.multiplier === 1;
    if (board) $("bankMult").textContent = `x${board.multiplier}`;
    $("stealBtn").textContent = stealMode ? "Steal: ON" : "Steal: off";
    $("stealBtn").setAttribute("aria-pressed", String(stealMode));
    $("stealBtn").classList.toggle("on", stealMode);
    $("stealBtn").disabled = over;
    $("failBtn").hidden = !stealMode || over;
    $("game").classList.toggle("stealing", stealMode);
    $("strikeKeyHelp").innerHTML = stealMode ? "<b>Q</b> steal failed" : "<b>Q</b> strike";
}

function setPlaying(t) {
    if (screen !== "game" || over || stealMode || t === playing) return;
    playing = t;
    renderScores(t);
    falconShow("enter", LINES.turn(teams[t].name), "neutral", 1800);
    announce(`${teams[t].name} is playing.`);
}

// ---------------- Menu ----------------
function renderMenu() {
    const grid = $("questionGrid");
    grid.innerHTML = "";
    BOARDS.forEach((q, i) => {
        const b = document.createElement("button");
        b.type = "button";
        const done = played.includes(q.question);
        b.className = "q-card" + (done ? " played" : "");
        const extra = (q.multiplier !== 1 ? ` &middot; points x${q.multiplier}` : "") + (done ? " &middot; played &#10003;" : "");
        b.innerHTML = `<span class="q-num">${i + 1}</span>
            <span class="q-text"><span class="q-title"></span><span class="q-meta">${q.answers.length} answers${extra}</span></span>`;
        b.querySelector(".q-title").textContent = q.question;
        b.addEventListener("click", () => startBoard(i));
        grid.appendChild(b);
    });
    renderScores();
}
function menuCards() { return Array.from($("questionGrid").children); }
function menuColumns() {
    const cards = menuCards();
    if (cards.length < 2) return 1;
    const top = cards[0].offsetTop;
    const n = cards.findIndex(c => c.offsetTop !== top);
    return n === -1 ? cards.length : n;
}
function moveMenuFocus(key) {
    const cards = menuCards();
    let i = cards.indexOf(document.activeElement);
    if (i === -1) { cards[boardIndex]?.focus(); return; }
    const cols = menuColumns();
    if (key === "ArrowRight") i = Math.min(cards.length - 1, i + 1);
    if (key === "ArrowLeft") i = Math.max(0, i - 1);
    if (key === "ArrowDown") i = Math.min(cards.length - 1, i + cols);
    if (key === "ArrowUp") i = Math.max(0, i - cols);
    cards[i].focus();
}

function showMenu() {
    clearTimers();
    falconHideNow();
    screen = "menu";
    board = null;
    stealMode = false;
    over = false;
    $("game").hidden = true;
    $("setup").hidden = true;
    $("results").hidden = true;
    $("finishPrompt").hidden = true;
    $("award").classList.remove("show");
    $("menu").hidden = false;
    renderScores();
    menuCards()[boardIndex]?.focus({ preventScroll: true });
}

// ---------------- Final results ----------------
function showResults() {
    clearTimers();
    falconHideNow();
    screen = "results";
    $("menu").hidden = true;
    $("results").hidden = false;
    const [a, b] = teams;
    const tie = a.score === b.score;
    const win = a.score > b.score ? 0 : 1;
    $("winnerText").textContent = tie ? LINES.tie : LINES.winner(teams[win].name);
    const box = $("finalScores");
    box.innerHTML = "";
    teams.forEach((t, i) => {
        const card = document.createElement("div");
        card.className = `final-card ${i === 0 ? "team-a" : "team-b"}` + (!tie && i === win ? " winner" : "");
        card.innerHTML = `<span class="final-crown">${!tie && i === win ? "Winner" : (tie ? "Tie" : "")}</span>
            <span class="final-name"></span><span class="final-score">${t.score}</span><span class="final-pts">points</span>`;
        card.querySelector(".final-name").textContent = t.name;
        box.appendChild(card);
    });
    $("resultsMeta").textContent = `${played.length} of ${BOARDS.length} rounds played`;
    play("congrats");
    confetti();
    announce(tie ? `It's a tie, ${a.score} to ${b.score}.` : `${teams[win].name} wins with ${teams[win].score} points. ${teams[other(win)].name} has ${teams[other(win)].score}.`);
    setTimeout(() => $("resultsBackBtn").focus({ preventScroll: true }), 50);
}

// ---------------- Board ----------------
function startBoard(index) {
    clearTimers();
    if (document.activeElement) document.activeElement.blur();
    boardIndex = index;
    board = BOARDS[index];
    state = board.answers.map(() => "");
    strikes = 0;
    over = false;
    bank = 0;
    stealMode = false;
    lastResult = "";
    playing = nextTeam;
    screen = "game";

    $("menu").hidden = true;
    $("game").hidden = false;
    $("finishPrompt").hidden = true;
    $("award").classList.remove("show");
    $("gameFoot").hidden = false;
    $("questionText").textContent = board.question;
    $("maxKey").textContent = Math.min(9, board.answers.length);

    const el = $("board");
    el.innerHTML = "";
    el.style.setProperty("--rows", Math.ceil(board.answers.length / 4));
    board.answers.forEach((answer, i) => {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.style.animationDelay = `${i * 70}ms`;
        tile.innerHTML = `<div class="tile-inner">
                <div class="face front"><span class="big-num">${i + 1}</span></div>
                <div class="face back"><span class="small-num">${i + 1}</span><span class="answer"></span><span class="pts">${answerPoints(i)}</span></div>
            </div>`;
        tile.querySelector(".answer").textContent = answer.text;
        tile.addEventListener("click", () => reveal(i));
        el.appendChild(tile);
    });
    renderStrikes();
    renderFound();
    renderScores();
    fitAnswers();
    play("intro", 0.8);
    announce(`${board.question}. ${board.answers.length} answers on the board. ${teams[playing].name} is playing.`);
    later(() => falconShow("enter", LINES.turn(teams[playing].name), "neutral", 2800, true), 450);
}

function tileEl(i) { return $("board").children[i]; }

// Shrink each answer until it fits its tile, so long words are never cut in half
function fitAnswers() {
    for (const tile of $("board").children) {
        const face = tile.querySelector(".back");
        const text = tile.querySelector(".answer");
        text.style.fontSize = "";
        let size = parseFloat(getComputedStyle(text).fontSize);
        const maxH = face.clientHeight - 16;
        while (size > 13 && (text.scrollWidth > text.clientWidth + 1 || text.scrollHeight > maxH)) {
            size -= 1;
            text.style.fontSize = `${size}px`;
        }
    }
}
let resizeTimer = null;
window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { if (screen === "game") fitAnswers(); }, 120);
});
if (document.fonts) document.fonts.ready.then(() => { if (screen === "game") fitAnswers(); });

function renderFound() {
    const found = state.filter(s => s === "found").length;
    $("foundCount").textContent = `${found} / ${state.length}`;
}

function renderStrikes(popLast = false) {
    const row = $("strikeRow");
    row.innerHTML = "";
    for (let i = 0; i < MAX_STRIKES; i++) {
        const s = document.createElement("span");
        s.className = "strike" + (i < strikes ? " on" : "");
        s.textContent = "X";
        if (i < strikes && !(popLast && i === strikes - 1)) s.style.animation = "none";
        row.appendChild(s);
    }
}

function reveal(i) {
    if (over || i >= state.length) return;
    const tile = tileEl(i);
    if (state[i]) {                         // already open: small wiggle
        tile.classList.remove("nudge"); void tile.offsetWidth; tile.classList.add("nudge");
        return;
    }
    if (stealMode) { stealWon(i); return; }
    state[i] = "found";
    tile.classList.add("open", "found");
    play("ding");
    bank += answerPoints(i);
    renderFound();
    renderScores();
    bump($("bankValue"));
    announce(`Answer ${i + 1}: ${board.answers[i].text}, ${answerPoints(i)} points`);

    if (state.every(s => s)) {
        finish("found");
    } else {
        falconPeek(pick(LINES.yes), "yes");
    }
}

// ---------------- Stealing ----------------
function toggleSteal() {
    if (screen !== "game" || over) return;
    stealMode = !stealMode;
    renderScores();
    const thief = teams[other(playing)].name;
    if (stealMode) {
        play("flip", 0.8);
        falconShow("enter", LINES.stealOn(thief), "neutral", 2600);
        announce(`Steal mode. ${thief} can steal ${bank} points with one answer.`);
    } else {
        falconHide();
        announce("Steal mode off.");
    }
}

// The stealing team gave a correct answer
function stealWon(i) {
    over = true;
    const thief = other(playing);
    state[i] = "found";
    tileEl(i).classList.add("open", "found");
    bank += answerPoints(i);
    renderFound();
    renderScores();
    bump($("bankValue"));
    play("congrats");
    confetti();
    announce(`Answer ${i + 1}: ${board.answers[i].text}. ${teams[thief].name} steals the points!`);
    later(() => award(thief, LINES.stolen(teams[thief].name), "steals the points!"), 700);
    later(() => revealRest(), 2000);
}

// The steal failed: the playing team keeps the bank
function stealFailed() {
    over = true;
    renderScores();
    play("strike", 0.9);
    const x = $("bigX");
    x.classList.remove("show"); void x.offsetWidth; x.classList.add("show");
    falconPeek(pick(LINES.no), "no");
    announce("The steal failed.");
    later(() => award(playing, LINES.kept(teams[playing].name), "keeps the points!"), 1100);
    later(() => revealRest(), 2300);
}

// Open every covered answer one by one, then show the finish prompt
function revealRest(withPrompt = true) {
    const covered = state.map((s, i) => s ? -1 : i).filter(i => i >= 0);
    covered.forEach((i, k) => {
        later(() => {
            state[i] = "shown";
            tileEl(i).classList.add("open", "shown");
            play("flip", 0.7);
        }, 250 + k * 230);
    });
    const done = 250 + covered.length * 230 + 400;
    if (withPrompt) later(endPrompt, done);
    return done;
}

// ---------------- Points ----------------
let lastResult = "";
function award(t, line, note = "points!", kind = "yes") {
    const pts = bank;
    teams[t].score += pts;
    bank = 0;
    if (!played.includes(board.question)) played.push(board.question);
    nextTeam = other(playing);                 // the other team starts the next board
    saveGame();
    renderScores(t);
    lastResult = `${teams[t].name} +${pts}`;
    $("awardPoints").textContent = `+${pts}`;
    $("awardTeam").textContent = teams[t].name;
    $("awardNote").textContent = note;
    const a = $("award");
    a.classList.remove("show"); void a.offsetWidth; a.classList.add("show");
    falconHide();
    if (line) later(() => falconShow("enter", line, kind, 3200), 2800);   // after the banner
    announce(`${pts} points for ${teams[t].name}. ${teams[0].name} ${teams[0].score}, ${teams[1].name} ${teams[1].score}.`);
}

function endPrompt() {
    $("gameFoot").hidden = true;
    $("finishResult").textContent = lastResult ? `${lastResult} ·` : "";
    $("finishPrompt").hidden = false;
}

function strike() {
    if (stealMode && !over) { stealFailed(); return; }
    if (over || strikes >= MAX_STRIKES) return;
    strikes++;
    renderStrikes(true);
    play("strike", 0.9);
    const x = $("bigX");
    x.classList.remove("show"); void x.offsetWidth; x.classList.add("show");
    falconPeek(pick(LINES.no), "no");
    announce(`Strike ${strikes}`);
}

function showAll() {
    if (over) return;
    over = true;
    stealMode = false;
    renderScores();
    const covered = state.map((s, i) => s ? -1 : i).filter(i => i >= 0);
    if (covered.length === 0) { finish("found"); return; }
    falconHide();
    const done = revealRest(false);
    later(() => finish("shown"), done);
}

function finish(how) {
    over = true;
    renderScores();
    $("gameFoot").hidden = true;

    if (how === "found") {
        later(() => {
            play("congrats");
            confetti();
            award(playing, LINES.allFound);
        }, 650);
        later(endPrompt, 900);
        announce("All answers found. Congratulations!");
    } else {
        if (CONGRATS_ON_SHOW_ALL) { play("congrats"); confetti(); } else { play("showAll", 0.9); }
        award(playing, LINES.shown, "points!", "neutral");
        later(endPrompt, 900);
        announce("All answers are shown.");
    }
}

function leaveBoard() {
    if (!over && !confirm("Leave this board and go back to the menu? The points of this board will not be given.")) return;
    showMenu();
}

// ---------------- Confetti ----------------
function confetti() {
    if (reducedMotion) return;
    const layer = $("confetti");
    const colors = ["#ffd23f", "#12a03c", "#3d8bff", "#ff3b3b", "#fffdf4", "#ff8fd0"];
    for (let i = 0; i < 90; i++) {
        const p = document.createElement("i");
        p.style.left = `${Math.random() * 100}vw`;
        p.style.background = pick(colors);
        p.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
        p.style.animationDelay = `${Math.random() * 0.6}s`;
        p.style.setProperty("--dx", `${(Math.random() - 0.5) * 30}vw`);
        p.style.setProperty("--rot", `${(Math.random() - 0.5) * 1440}deg`);
        p.style.width = `${8 + Math.random() * 8}px`;
        layer.appendChild(p);
    }
    setTimeout(() => { layer.innerHTML = ""; }, 4800);
}

// ---------------- The falcon host ----------------
// Modes: "enter" walks in from the left (start and end of a board),
// "peek-right", "peek-left" and "peek-bottom" sneak in on reveals and strikes.
const falcon = {
    el: $("falcon"), bubble: $("falconBubble"),
    mode: null, visible: false, anim: null, hideTimer: null, token: 0
};
const AWAY = {
    "enter": "translateX(-130%)",
    "peek-right": "translateX(115%)",
    "peek-left": "translateX(-115%)",
    "peek-bottom": "translateY(110%)"
};
const SHOWN = {
    "enter": "translateX(0)",
    "peek-right": "translateX(34%)",
    "peek-left": "translateX(-34%)",
    "peek-bottom": "translateY(38%)"
};
const TAILS = { "enter": "tail-down", "peek-right": "tail-right", "peek-left": "tail-left", "peek-bottom": "tail-left" };

function setBubble(text, kind) {
    const b = falcon.bubble;
    b.textContent = text;
    b.className = `bubble ${kind} ${text.length > 12 ? "long" : "short"} ${TAILS[falcon.mode]}`;
}
function popBubble() {
    const b = falcon.bubble;
    b.classList.remove("show"); void b.offsetWidth; b.classList.add("show");
}

function falconShow(mode, text, kind, holdMs, withWhoosh = false) {

    // Patch
    withWhoosh = false; // Disable whoosh sound for now 

    const token = ++falcon.token;
    clearTimeout(falcon.hideTimer);

    if (falcon.visible && falcon.mode === mode) {
        // already on screen in that spot: just say the new thing
        setBubble(text, kind);
        popBubble();
    } else {
        if (falcon.anim) falcon.anim.cancel();
        falcon.mode = mode;
        falcon.el.dataset.mode = mode;
        if (mode === "peek-bottom") falcon.el.style.left = `${20 + Math.random() * 45}vw`;
        else falcon.el.style.left = "";
        setBubble(text, kind);
        falcon.el.classList.add("active");
        falcon.visible = true;
        
        // If we want to play the whoosh sound, we'll do it here
        if (withWhoosh) play("whoosh", 0.7);
        falcon.anim = falcon.el.animate(
            [{ transform: AWAY[mode] }, { transform: SHOWN[mode] }],
            { duration: reducedMotion ? 1 : (mode === "enter" ? 600 : 260), easing: "cubic-bezier(.25, 1.25, .5, 1)", fill: "forwards" }
        );
        falcon.anim.finished.then(() => { if (token === falcon.token) popBubble(); }).catch(() => {});
    }
    falcon.hideTimer = setTimeout(() => falconHide(token), holdMs);
}

function falconPeek(text, kind) {
    const mode = falcon.visible && falcon.mode !== "enter" ? falcon.mode : pick(["peek-right", "peek-left", "peek-bottom"]);
    falconShow(mode, text, kind, 1100);
}

function falconHide(token = falcon.token) {
    if (token !== falcon.token || !falcon.visible) return;
    clearTimeout(falcon.hideTimer);
    falcon.bubble.classList.remove("show");
    const mode = falcon.mode;
    if (falcon.anim) falcon.anim.cancel();
    falcon.anim = falcon.el.animate(
        [{ transform: SHOWN[mode] }, { transform: AWAY[mode] }],
        { duration: reducedMotion ? 1 : (mode === "enter" ? 500 : 280), easing: "ease-in", fill: "forwards" }
    );
    falcon.anim.finished.then(() => {
        if (token !== falcon.token) return;
        falcon.visible = false;
        falcon.el.classList.remove("active");
    }).catch(() => {});
}

function falconHideNow() {
    falcon.token++;
    clearTimeout(falcon.hideTimer);
    if (falcon.anim) falcon.anim.cancel();
    falcon.visible = false;
    falcon.bubble.classList.remove("show");
    falcon.el.classList.remove("active");
}

// ---------------- Keyboard ----------------
window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (screen === "setup") return;          // typing team names: the form handles Enter

    if (screen === "results") {
        if (e.key === "Escape") { e.preventDefault(); showMenu(); }
        return;
    }

    if (screen === "menu") {
        if (e.key.startsWith("Arrow")) { e.preventDefault(); moveMenuFocus(e.key); }
        else if (e.key === "Enter" && document.activeElement?.tagName !== "BUTTON") { e.preventDefault(); startBoard(boardIndex); }
        return;
    }

    // game screen
    if (e.repeat) return;
    if (/^[1-9]$/.test(e.key)) { e.preventDefault(); reveal(Number(e.key) - 1); }
    else if (e.key === "0") { e.preventDefault(); showAll(); }
    else if (e.key === "q" || e.key === "Q") { e.preventDefault(); strike(); }
    else if (e.key === "s" || e.key === "S") { e.preventDefault(); toggleSteal(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setPlaying(0); }
    else if (e.key === "ArrowRight") { e.preventDefault(); setPlaying(1); }
    else if (e.key === "Enter") { e.preventDefault(); if (over && !$("finishPrompt").hidden) showMenu(); }
    else if (e.key === "Escape") { e.preventDefault(); leaveBoard(); }
});

// ---------------- Buttons ----------------
$("backBtn").addEventListener("click", leaveBoard);
$("stealBtn").addEventListener("click", toggleSteal);
$("failBtn").addEventListener("click", () => { if (stealMode && !over) stealFailed(); });
$("teamBtn0").addEventListener("click", () => setPlaying(0));
$("teamBtn1").addEventListener("click", () => setPlaying(1));
$("setupForm").addEventListener("submit", startGame);
$("continueBtn").addEventListener("click", continueGame);
$("loadJsonBtn").addEventListener("click", () => $("jsonFile").click());
$("jsonFile").addEventListener("change", (e) => { loadQuestionsFile(e.target.files[0]); e.target.value = ""; });
$("resultsBtn").addEventListener("click", showResults);
$("newGameBtn").addEventListener("click", newGame);
$("resultsBackBtn").addEventListener("click", showMenu);
$("resultsNewBtn").addEventListener("click", newGame);
$("muteBtn").addEventListener("click", () => {
    muted = !muted;
    $("muteBtn").textContent = muted ? "Sound: off" : "Sound: on";
    $("muteBtn").setAttribute("aria-pressed", String(muted));
});
$("fullBtn").addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().catch(() => {});
});
document.addEventListener("fullscreenchange", () => {
    $("fullBtn").textContent = document.fullscreenElement ? "Exit full screen" : "Full screen";
});
// buttons should not keep focus, so Space/Enter go to the game
for (const id of ["backBtn", "muteBtn", "fullBtn", "stealBtn", "failBtn", "teamBtn0", "teamBtn1", "resultsBtn", "newGameBtn"]) {
    $(id).addEventListener("mouseup", (e) => e.currentTarget.blur());
}

// ---------------- Start ----------------
showSetup();
loadQuestions();
