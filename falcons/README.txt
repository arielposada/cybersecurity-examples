100 FALCONS SAID - classroom game (two teams)

Open index.html, or upload this whole folder to your website.
index.html loads its files from the "falcons/" folder, so keep
index.html next to that folder (as on your website).

START OF THE GAME
  Type the names of the two teams and press Start game.
  "Continue last game" appears if a game was left unfinished (for example
  after the page was reloaded); scores are kept in the browser.

MENU
  Click a board, or use the arrow keys and press Enter.
  The scores of both teams are shown at the top.
  Played boards are marked "played".
  "Who won? Final scores"  shows the winning team and the final scores.
  "New game"               goes back to the team names and resets the scores.

ON A BOARD
  At the top: the two teams and the "Round" points (the points found so far
  on this board). The team marked PLAYING gets the points.
  Click a team (or press Left / Right) to choose the playing team before
  the round starts. Teams take turns by default.

  1-9    Reveal that answer (or click the tile). Its points go to the round.
  Q      Add a strike (buzzer, big red X, the falcon says NO!).
  0      Show all the answers that are still covered. The round points go
         to the playing team.
  Enter  Back to the menu, once the board is finished.
  Esc    Leave a board early (asks first; no points are given).

  When every answer is found, the playing team gets the round points.

STEALING
  S (or the "Steal" button at the top) turns steal mode on. The other team
  is marked STEALING and has one try:
    - Correct answer: press its number (or click it). The win sound plays,
      the answer opens and the STEALING team takes all the round points.
    - Wrong answer: press Q (or the "Fail" button). The strike sound plays
      and the PLAYING team keeps the round points.
  Then all the remaining answers are revealed automatically.
  Press S again to turn steal mode off before anyone answers.

EDITING THE QUESTIONS  ->  data/questions.json
  The menu and the boards are built automatically from this file.
  Add, remove or change rounds and answers, save, and reload the page.

  {
      "settings": { "maxStrikes": 8 },
      "rounds": [
          {
              "question": "Most used web browsers",
              "answers": [
                  { "text": "Chrome", "points": 41 },
                  { "text": "Safari", "points": 22 },
                  { "text": "Edge",   "points": 15 }
              ]
          },
          {
              "question": "Final round",
              "multiplier": 2,
              "answers": [ "Answer one", "Answer two", "Answer three" ]
          }
      ]
  }

  - Each round needs 2 to 12 answers (1-9 have keys; 10-12 are clicked).
  - Answers are sorted by points automatically (highest = #1).
  - "points" is optional. An answer can be just text; then the points are
    worked out so the round adds up to about 100.
  - "multiplier" is optional (2 = double points, 3 = triple points).
  - "maxStrikes" is optional (how many X boxes are shown, 1 to 12).
  - JSON rules: use double quotes, a comma between items, and no comma
    after the last item. If the file has a mistake, the start screen says
    what is wrong and the game uses the backup questions.

  Opening index.html by double-clicking it (file://): browsers do not let
  the page read questions.json. The game then uses the backup copy in
  js/questions.js, or you can press "Load questions file (.json)" on the
  start screen and pick questions.json. On a website it is read directly.
  To update the backup, paste the content of questions.json into
  js/questions.js after "const QUESTIONS = ".

OTHER FILES
  Falcon:     images/falcon.png  (replace with a larger transparent PNG
              of the same character for a sharper picture)
  Sounds:     sounds/*.mp3  (keep the same file names to swap them)
              The win sound is congrats.mp3, the fail sound is strike.mp3.
  Falcon lines ("YES!", "NO!", greetings, steal lines): the LINES list at
              the top of js/game.js
  To also play the fanfare after pressing 0, open js/game.js and set
  CONGRATS_ON_SHOW_ALL = true.
