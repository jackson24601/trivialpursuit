# Trivial Pursuit Scorekeeper

A web app for tracking wedges in a Trivial Pursuit game.

Open `index.html` in a browser, pick **2–4 teams**, name them, and start. Each team gets a six-color pie (red, blue, orange, green, yellow, purple). Click a slice to add that wedge to the team; click it again to remove it.

Game progress is saved in the browser, so a refresh does not wipe the current match.

## Run locally

No build step. Either open the file directly:

```bash
open index.html
```

or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.
