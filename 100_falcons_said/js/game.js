// =====================================================================
//  100 Falcons Said - game logic
//
//  Keys on a board:
//    1-9    reveal that answer (ding, the falcon says YES!)
//    Q      add a strike (buzzer, big red X, the falcon says NO!)
//    0      show every answer that is still covered
//    Enter  back to the menu once the board is finished
//    Esc    leave the board early
// =====================================================================

const MIN_ANSWERS = 5;
const MAX_ANSWERS = 9;
const MAX_STRIKES = 8;
const CONGRATS_ON_SHOW_ALL = false;   // true = also play the fanfare when 0 shows the answers

const SOUND_FILES = {
    ding: "./sounds/ding.mp3",
    strike: "./sounds/strike.mp3",
    congrats: "./sounds/congrats.mp3",
    flip: "./sounds/flip.mp3",
    whoosh: "./sounds/whoosh.mp3",
    intro: "./sounds/intro.mp3",
    showAll: "./sounds/show_all.mp3"
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
    bye: "See you next round!"
};

// ---------------- Helpers ----------------
const $ = (id) => document.getElementById(id);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Only boards with 5 to 9 answers are playable
const BOARDS = QUESTIONS.filter((q, i) => {
    const ok = Array.isArray(q.answers) && q.answers.length >= MIN_ANSWERS && q.answers.length <= MAX_ANSWERS;
    if (!ok) console.warn(`Board ${i + 1} ("${q.question}") needs ${MIN_ANSWERS} to ${MAX_ANSWERS} answers, so it was skipped.`);
    return ok;
});

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
let screen = "menu";
let boardIndex = 0;
let board = null;
let state = [];            // per answer: "" covered, "found", "shown"
let strikes = 0;
let over = false;
const timers = [];         // timeouts that belong to the current board

function later(fn, ms) { const id = setTimeout(fn, ms); timers.push(id); return id; }
function clearTimers() { while (timers.length) clearTimeout(timers.pop()); }
function announce(text) { $("announcer").textContent = text; }

// ---------------- Menu ----------------
function renderMenu() {
    const grid = $("questionGrid");
    grid.innerHTML = "";
    BOARDS.forEach((q, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "q-card";
        b.innerHTML = `<span class="q-num">${i + 1}</span>
            <span class="q-text"><span class="q-title"></span><span class="q-meta">${q.answers.length} answers</span></span>`;
        b.querySelector(".q-title").textContent = q.question;
        b.addEventListener("click", () => startBoard(i));
        grid.appendChild(b);
    });
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
    $("game").hidden = true;
    $("finishPrompt").hidden = true;
    $("menu").hidden = false;
    menuCards()[boardIndex]?.focus({ preventScroll: true });
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
    screen = "game";

    $("menu").hidden = true;
    $("game").hidden = false;
    $("finishPrompt").hidden = true;
    $("gameFoot").hidden = false;
    $("questionText").textContent = board.question;
    $("maxKey").textContent = board.answers.length;

    const el = $("board");
    el.innerHTML = "";
    el.style.setProperty("--rows", Math.ceil(board.answers.length / 4));
    board.answers.forEach((answer, i) => {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.style.animationDelay = `${i * 70}ms`;
        tile.innerHTML = `<div class="tile-inner">
                <div class="face front"><span class="big-num">${i + 1}</span></div>
                <div class="face back"><span class="small-num">${i + 1}</span><span class="answer"></span></div>
            </div>`;
        tile.querySelector(".answer").textContent = answer;
        el.appendChild(tile);
    });
    renderStrikes();
    renderFound();
    fitAnswers();
    play("intro", 0.8);
    announce(`${board.question}. ${board.answers.length} answers on the board.`);
    later(() => falconShow("enter", pick(LINES.start), "neutral", 2800, true), 450);
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
    state[i] = "found";
    tile.classList.add("open", "found");
    play("ding");
    renderFound();
    announce(`Answer ${i + 1}: ${board.answers[i]}`);

    if (state.every(s => s)) {
        finish("found");
    } else {
        falconPeek(pick(LINES.yes), "yes");
    }
}

function strike() {
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
    const covered = state.map((s, i) => s ? -1 : i).filter(i => i >= 0);
    if (covered.length === 0) { finish("found"); return; }
    falconHide();
    covered.forEach((i, k) => {
        later(() => {
            state[i] = "shown";
            tileEl(i).classList.add("open", "shown");
            play("flip", 0.7);
        }, 250 + k * 230);
    });
    later(() => finish("shown"), 250 + covered.length * 230 + 400);
}

function finish(how) {
    over = true;
    $("gameFoot").hidden = true;
    later(() => { $("finishPrompt").hidden = false; }, 900);

    if (how === "found") {
        later(() => {
            play("congrats");
            confetti();
            falconShow("enter", LINES.allFound, "yes", 3600, true);
        }, 650);
        announce("All answers found. Congratulations!");
    } else {
        if (CONGRATS_ON_SHOW_ALL) { play("congrats"); confetti(); } else { play("showAll", 0.9); }
        falconShow("enter", LINES.shown, "neutral", 3200, true);
        announce("All answers are shown.");
    }
}

function leaveBoard() {
    if (!over && !confirm("Leave this board and go back to the menu?")) return;
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

    if (screen === "menu") {
        if (e.key.startsWith("Arrow")) { e.preventDefault(); moveMenuFocus(e.key); }
        else if (e.key === "Enter" && !menuCards().includes(document.activeElement)) { e.preventDefault(); startBoard(boardIndex); }
        return;
    }

    // game screen
    if (e.repeat) return;
    if (/^[1-9]$/.test(e.key)) { e.preventDefault(); reveal(Number(e.key) - 1); }
    else if (e.key === "0") { e.preventDefault(); showAll(); }
    else if (e.key === "q" || e.key === "Q") { e.preventDefault(); strike(); }
    else if (e.key === "Enter") { e.preventDefault(); if (over) showMenu(); }
    else if (e.key === "Escape") { e.preventDefault(); leaveBoard(); }
});

// ---------------- Buttons ----------------
$("backBtn").addEventListener("click", leaveBoard);
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
for (const id of ["backBtn", "muteBtn", "fullBtn"]) $(id).addEventListener("mouseup", (e) => e.currentTarget.blur());

renderMenu();
showMenu();
