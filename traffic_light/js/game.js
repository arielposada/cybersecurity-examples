// =====================================================================
//  Internet Traffic Light - game logic
//  6x6 board: 30 questions (24 traffic light + 6 cybersecurity, picked at
//  random from the bank) + 6 surprise cards that add or take away points.
// =====================================================================

const BOARD_SIZE = 36;
const SURPRISE_CARDS = 6;
const TRAFFIC_ON_BOARD = 24;          // 80% of the 30 questions
const CYBER_ON_BOARD = 6;             // 20% of the 30 questions
const QUESTION_POINTS = [10, 15, 20];
const SURPRISE_WIN = [20, 25, 50];
const SURPRISE_LOSE = [10, 15, 20, 25];

// ---------------- Helpers ----------------
const $ = (id) => document.getElementById(id);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ---------------- State ----------------
let cards = [];
let scores = [0, 0];
let names = ["Team 1", "Team 2"];
let turn = 0;
let openIndex = -1;

// ---------------- Build a new random board ----------------
function buildCards() {
    const traffic = shuffle(QUESTION_BANK.filter(q => q.topic === "traffic")).slice(0, TRAFFIC_ON_BOARD);
    const cyber = shuffle(QUESTION_BANK.filter(q => q.topic === "cyber")).slice(0, CYBER_ON_BOARD);
    const questions = shuffle(traffic.concat(cyber)).map(q => ({
        kind: "question",
        data: q,
        points: pick(QUESTION_POINTS),
        options: shuffle([q.answer].concat(q.wrong))     // answers in a random order
    }));
    const surprises = [];
    for (let i = 0; i < SURPRISE_CARDS; i++) {
        const win = Math.random() < 0.5;
        surprises.push({ kind: "surprise", points: win ? pick(SURPRISE_WIN) : -pick(SURPRISE_LOSE) });
    }
    return shuffle(questions.concat(surprises)).map(c => ({ ...c, used: false, result: "" }));
}

function renderBoard() {
    const board = $("board");
    board.innerHTML = "";
    cards.forEach((card, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tile";
        const row = Math.floor(i / 6), col = i % 6;
        if ((row + col) % 2 === 1) btn.classList.add("alt");
        btn.textContent = i + 1;
        btn.setAttribute("aria-label", `Card ${i + 1}`);
        if (card.used) {
            btn.disabled = true;
            const tag = document.createElement("span");
            tag.className = "tag " + (card.delta > 0 ? "plus" : card.delta < 0 ? "minus" : "");
            tag.textContent = card.result;
            btn.appendChild(tag);
        }
        btn.addEventListener("click", () => openCard(i));
        board.appendChild(btn);
    });
}

function renderScores(popTeam = -1) {
    for (let t = 0; t < 2; t++) {
        $("teamName" + t).textContent = names[t];
        $("teamScore" + t).textContent = scores[t];
        $("team" + t).classList.toggle("active", t === turn);
    }
    if (popTeam >= 0) {
        const el = $("teamScore" + popTeam);
        el.classList.remove("pop");
        void el.offsetWidth;          // restart the animation
        el.classList.add("pop");
    }
}

// ---------------- Card modal ----------------
function openCard(i) {
    const card = cards[i];
    if (card.used || openIndex !== -1) return;
    openIndex = i;

    const head = $("cardHead");
    head.className = "card-head";
    $("cardTurn").textContent = `${names[turn]} · card ${i + 1}`;
    $("nextBtn").hidden = true;
    $("cardAnswers").innerHTML = "";
    $("specialText").hidden = true;

    if (card.kind === "question") {
        const q = card.data;
        $("cardPoints").textContent = `${card.points} pts`;
        $("cardImage").src = `images/jokes/${q.img}.png`;
        $("cardImage").alt = "";
        $("cardJoke").textContent = JOKES[q.img] || "";
        $("cardJoke").hidden = !JOKES[q.img];
        $("cardQuestion").hidden = false;
        $("cardQuestion").textContent = q.q;
        card.options.forEach(option => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "answer";
            const color = ANSWER_COLORS[option.toLowerCase()];
            if (color) {
                const dot = document.createElement("span");
                dot.className = "dot";
                dot.style.background = color;
                b.appendChild(dot);
            }
            b.appendChild(document.createTextNode(option));
            b.addEventListener("click", () => answer(option, b));
            $("cardAnswers").appendChild(b);
        });
    } else {
        // surprise card: points are added or taken away right away
        const win = card.points > 0;
        head.classList.add(win ? "special-plus" : "special-minus");
        $("cardPoints").textContent = win ? "Surprise!" : "Oh no!";
        $("cardImage").src = win ? "images/jokes/bonus.png" : "images/jokes/oops.png";
        $("cardImage").alt = win ? "A gift box" : "A little bug";
        $("cardJoke").hidden = false;
        $("cardJoke").textContent = win
            ? "Why did the website get a present? It was a GREEN site all year!"
            : "A bug got into the computer and ate some points!";
        $("cardQuestion").hidden = true;
        const text = $("specialText");
        text.hidden = false;
        text.className = "special-text " + (win ? "plus" : "minus");
        text.textContent = win ? `Win ${card.points} points!` : `Lose ${-card.points} points!`;
        finishCard(card.points, win ? "Yay!" : "Oops!", win);
    }
    $("cardModal").hidden = false;
}

function answer(option, button) {
    const card = cards[openIndex];
    const correct = option === card.data.answer;
    for (const b of $("cardAnswers").children) {
        b.disabled = true;
        const text = b.textContent;
        if (text === card.data.answer) b.classList.add("right");
        else if (b !== button) b.classList.add("faded");
    }
    if (!correct) button.classList.add("wrong");
    finishCard(correct ? card.points : 0, correct ? "OK!" : "Wrong!", correct);
}

function finishCard(delta, catText, good) {
    const card = cards[openIndex];
    card.used = true;
    card.delta = delta;
    const short = names[turn].length > 8 ? `T${turn + 1}` : names[turn];
    card.result = delta > 0 ? `${short} +${delta}` : delta < 0 ? `${short} ${delta}` : `${short} 0`;
    scores[turn] += delta;
    renderScores(delta !== 0 ? turn : -1);
    catSays(catText, good);
    $("nextBtn").hidden = false;
    $("nextBtn").textContent = cards.every(c => c.used) ? "See final scores" : "Next turn";
    $("nextBtn").focus({ preventScroll: true });
}

function closeCard() {
    $("cardModal").hidden = true;
    openIndex = -1;
    turn = 1 - turn;
    renderBoard();
    renderScores();
    if (cards.every(c => c.used)) showEnd();
}

// ---------------- Start / end ----------------
function startGame() {
    names = [0, 1].map(t => ($("nameInput" + t).value.trim() || `Team ${t + 1}`));
    scores = [0, 0];
    turn = 0;
    openIndex = -1;
    cards = buildCards();
    renderBoard();
    renderScores();
    $("startScreen").hidden = true;
    $("endScreen").hidden = true;
    $("finishBtn").hidden = false;
}

function showEnd() {
    for (let t = 0; t < 2; t++) {
        $("finalName" + t).textContent = names[t];
        $("finalScore" + t).textContent = scores[t];
    }
    $("cardModal").hidden = true;
    $("finishBtn").hidden = true;
    $("endScreen").hidden = false;
}

// ---------------- The cat: walks in, says something, walks out ----------------
const CAT_FRAMES = [1, 2, 3, 4, 5].map(n => `images/cat/frame_${n}.png`);
CAT_FRAMES.forEach(src => { const img = new Image(); img.src = src; });   // preload

const cat = {
    el: $("cat"), crop: $("catCrop"), img: $("catImg"), bubble: $("catBubble"),
    run: 0
};
const CAT_OUT = -180, CAT_IN = 40;
const WALK_MS = 750, TALK_MS = 1500;

function catSays(text, good) {
    const run = ++cat.run;           // a newer call cancels an older one
    cat.bubble.textContent = text;
    cat.bubble.classList.toggle("bad", !good);
    cat.bubble.classList.remove("show");
    cat.el.classList.add("show");
    cat.crop.classList.remove("flip");

    walk(CAT_OUT, CAT_IN, run, () => {
        cat.img.src = CAT_FRAMES[0];
        cat.bubble.classList.add("show");
        setTimeout(() => {
            if (run !== cat.run) return;
            cat.bubble.classList.remove("show");
            cat.crop.classList.add("flip");          // turn around
            walk(CAT_IN, CAT_OUT, run, () => cat.el.classList.remove("show"));
        }, TALK_MS);
    });
}

function walk(from, to, run, done) {
    const start = performance.now();
    let frame = 0, lastFrame = start;
    function step(now) {
        if (run !== cat.run) return;
        const t = Math.min(1, (now - start) / WALK_MS);
        cat.el.style.transform = `translateX(${from + (to - from) * t}px)`;
        if (now - lastFrame > 90) {
            frame = (frame + 1) % CAT_FRAMES.length;
            cat.img.src = CAT_FRAMES[frame];
            lastFrame = now;
        }
        if (t < 1) requestAnimationFrame(step);
        else done();
    }
    requestAnimationFrame(step);
}

// ---------------- Buttons ----------------
$("startBtn").addEventListener("click", startGame);
$("againBtn").addEventListener("click", () => {
    $("endScreen").hidden = true;
    $("startScreen").hidden = false;
});
$("nextBtn").addEventListener("click", closeCard);
$("finishBtn").addEventListener("click", () => {
    if (openIndex !== -1) return;
    if (confirm("Finish the game now and show the final scores?")) showEnd();
});

// show an empty board behind the start screen
cards = buildCards();
renderBoard();
renderScores();
