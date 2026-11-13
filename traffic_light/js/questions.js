// =====================================================================
//  Internet Traffic Light - question bank (35 questions)
//  28 about the internet traffic light (80%) + 7 about cybersecurity (20%)
//
//  Each question:
//    q:       the question text
//    answer:  the right answer
//    wrong:   the wrong answers (the order is mixed every game)
//    topic:   "traffic" or "cyber"
//    img:     a picture from images/jokes/ (see JOKES below)
// =====================================================================

const QUESTION_BANK = [
    // ---------------- Internet traffic light (28) ----------------
    { topic: "traffic", img: "traffic_light", q: "A GREEN website or app is JUST RIGHT for you. It has fun things to do and ________ words.", answer: "Kind", wrong: ["Mean", "Scary", "Bad"] },
    { topic: "traffic", img: "spider_web", q: "What does a GREEN light mean on the internet?", answer: "Go! It is just right for me", wrong: ["Stop right now", "Give my password", "Close the computer forever"] },
    { topic: "traffic", img: "links", q: "What does a YELLOW light mean on the internet?", answer: "Slow down and be careful", wrong: ["Go super fast", "Click everything", "It is a prize"] },
    { topic: "traffic", img: "mouse", q: "What does a RED light mean on the internet?", answer: "Stop! It is not for me", wrong: ["Go and play", "Share it with everyone", "Type my address"] },
    { topic: "traffic", img: "microchips", q: "What color? A game your teacher picked for your class, made for kids your age.", answer: "Green", wrong: ["Yellow", "Red", "Blue"] },
    { topic: "traffic", img: "phone", q: "What color? A website asks you to type where you live.", answer: "Red", wrong: ["Green", "Yellow", "Purple"] },
    { topic: "traffic", img: "motherboard", q: "What color? A website has very hard words and you are not sure if it is for you.", answer: "Yellow", wrong: ["Green", "Red", "Pink"] },
    { topic: "traffic", img: "traffic_light", q: "What color? A website has scary pictures that give you bad dreams.", answer: "Red", wrong: ["Green", "Yellow", "Orange"] },
    { topic: "traffic", img: "spider_web", q: "What color? An app with funny videos made for kids, that you watch with your family.", answer: "Green", wrong: ["Red", "Yellow", "Pink"] },
    { topic: "traffic", img: "links", q: "What color? A website is clearly made for grown-ups, not for kids.", answer: "Red", wrong: ["Green", "Yellow", "Gold"] },
    { topic: "traffic", img: "mouse", q: "What color? A game asks you to download something before you can play.", answer: "Yellow", wrong: ["Green", "Red", "Blue"] },
    { topic: "traffic", img: "microchips", q: "What color? A website with lots of blinking ads and you do not know what to click.", answer: "Yellow", wrong: ["Green", "Red", "Purple"] },
    { topic: "traffic", img: "phone", q: "What color? Someone in a game chat asks for your phone number.", answer: "Red", wrong: ["Green", "Yellow", "Orange"] },
    { topic: "traffic", img: "motherboard", q: "What color? A math game where you count stars with friendly animals.", answer: "Green", wrong: ["Red", "Yellow", "Black"] },
    { topic: "traffic", img: "traffic_light", q: "What color? A website you have never seen before, and you are not sure about it.", answer: "Yellow", wrong: ["Green", "Red", "Pink"] },
    { topic: "traffic", img: "spider_web", q: "What color? A video has bad words in it.", answer: "Red", wrong: ["Green", "Yellow", "Blue"] },
    { topic: "traffic", img: "links", q: "What color? A website asks you to make an account with your name and email.", answer: "Yellow", wrong: ["Green", "Red", "Gold"] },
    { topic: "traffic", img: "mouse", q: "What color? Your school library page with storybooks for kids.", answer: "Green", wrong: ["Red", "Yellow", "Purple"] },
    { topic: "traffic", img: "microchips", q: "If you go to a RED website, you should STOP and ________.", answer: "Tell a trusted adult", wrong: ["Keep it a secret", "Show all your friends", "Look for more"] },
    { topic: "traffic", img: "phone", q: "If you find a YELLOW website, what should you do?", answer: "Ask a trusted adult if it is OK", wrong: ["Click all the buttons", "Type my password", "Hide it from my family"] },
    { topic: "traffic", img: "motherboard", q: "Would a GREEN website or app have bad words?", answer: "No", wrong: ["Yes", "Only on Mondays", "Only in videos"] },
    { topic: "traffic", img: "traffic_light", q: "Would a GREEN website be so scary that it gives you nightmares?", answer: "No", wrong: ["Yes", "Sometimes", "Only at night"] },
    { topic: "traffic", img: "spider_web", q: "You are watching a nice video and a video with bad words comes on. What do you do?", answer: "Turn it off and tell an adult", wrong: ["Watch it again", "Turn the volume up", "Send it to a friend"] },
    { topic: "traffic", img: "links", q: "When you are online, should you tell people where you live?", answer: "No", wrong: ["Yes", "Only to strangers", "Only in a game chat"] },
    { topic: "traffic", img: "mouse", q: "Who is a trusted adult you can ask about a website?", answer: "A parent or a teacher", wrong: ["A stranger in a game", "A pop-up ad", "Nobody"] },
    { topic: "traffic", img: "microchips", q: "Which one is a GREEN website sign?", answer: "Kind words and fun for kids", wrong: ["It asks where I live", "It has scary pictures", "It has mean words"] },
    { topic: "traffic", img: "phone", q: "Which one is a RED website sign?", answer: "It asks for my private information", wrong: ["Fun puzzles for kids", "My teacher picked it", "It has kind words"] },
    { topic: "traffic", img: "motherboard", q: "A friend sends you a link to a game you do not know. What color is it until an adult checks it?", answer: "Yellow", wrong: ["Green", "Red", "Blue"] },

    // ---------------- Basic cybersecurity (7) ----------------
    { topic: "cyber", img: "strong_password", q: "Which password is the strongest?", answer: "Blue!Tiger7Pizza", wrong: ["123456", "password", "my name"] },
    { topic: "cyber", img: "strong_password", q: "Is it OK to share your password with your friends?", answer: "No, only with my parents", wrong: ["Yes, with everyone", "Yes, with my best friend", "Yes, in a game chat"] },
    { topic: "cyber", img: "sick_computer", q: "What is a computer virus?", answer: "A bad program that can hurt a computer", wrong: ["A cold for robots", "A new fun game", "A kind of mouse"] },
    { topic: "cyber", img: "sick_computer", q: "A message from someone you do not know says: 'Click this link NOW!' What do you do?", answer: "Do not click it and tell an adult", wrong: ["Click it fast", "Send it to friends", "Answer with my name"] },
    { topic: "cyber", img: "cookie", q: "A pop-up says 'You won a free tablet! Type your address!' What is it?", answer: "A trick, do not type anything", wrong: ["A real prize", "A gift from my teacher", "A safe game"] },
    { topic: "cyber", img: "cookie", q: "When you finish using a computer at school, you should...", answer: "Log out of your account", wrong: ["Leave it open", "Write my password on the screen", "Give it to a stranger"] },
    { topic: "cyber", img: "strong_password", q: "Where is the best place to keep your password?", answer: "In my head or with my parents", wrong: ["On a sticky note on the screen", "In a game chat", "On my backpack"] }
];

// Family-friendly jokes shown with each picture (images/jokes/<name>.png)
const JOKES = {
    traffic_light: "Why did the traffic light turn red? You would too if people saw you changing!",
    spider_web: "How does a spider find a good website? On the World Wide Web!",
    links: "Why don't websites ever get lost? They always follow the links!",
    mouse: "Why did the cat sit on the computer? To keep an eye on the mouse!",
    microchips: "What is a computer's favorite snack? Microchips!",
    phone: "Why did the phone wear glasses? It lost all its contacts!",
    motherboard: "Why are computers so smart? They listen to their motherboard!",
    strong_password: "Why did the password go to the gym? To get STRONGER!",
    sick_computer: "Why did the computer go to the doctor? It caught a virus!",
    cookie: "Why did the cookie go to the doctor? It felt crummy!"
};

// Colors that get a little colored dot on the answer buttons
const ANSWER_COLORS = {
    green: "#59c059", yellow: "#ffbf00", red: "#ff4a5e", blue: "#4c97ff",
    purple: "#9966ff", pink: "#ff8fc1", orange: "#ff8c1a", gold: "#d4a017", black: "#222222"
};
