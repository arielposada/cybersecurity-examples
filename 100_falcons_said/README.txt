100 FALCONS SAID - classroom game (one team)

Open index.html, or upload this whole folder to your website.
All images and sounds use relative paths, so it works inside any subfolder.

MENU
  Click a board, or use the arrow keys and press Enter.

ON A BOARD
  1-9    Reveal that answer (ding, the falcon sneaks in and says YES!)
  Q      Add a strike (buzzer, big red X, the falcon says NO!). Up to 8 strikes;
         strikes never end the board, you decide when to stop.
  0      Show all the answers that are still covered.
  Enter  Back to the menu, once the board is finished
         (all answers found, or 0 was pressed).
  Esc    Leave a board early (asks first).

  When every answer is found with the number keys, the congratulations
  fanfare plays. To also play it after pressing 0, open js/game.js and set
  CONGRATS_ON_SHOW_ALL = true.

EDITING
  Questions:  js/questions.js  (each board needs 5 to 9 answers)
  Falcon:     images/falcon.png  (replace with a larger transparent PNG
              of the same character for a sharper picture)
  Sounds:     sounds/*.mp3  (keep the same file names to swap them)
  Falcon lines ("YES!", "NO!", greetings): the LINES list at the top of js/game.js
