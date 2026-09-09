# Tiny Planet Crew on your computer

Everything below happens in a terminal on the Mac. Node.js and Claude Code must be installed.

## 1. Get it
```bash
cd ~/code            # or wherever you keep projects
git clone -b claude/visual-task-management-game-r9djcb https://github.com/nicmagnuson/designs.git
cd designs/tiny-planet-crew
```

## 2. Run it as an app
Double-click `launch.command` in Finder, or run:
```bash
./launch.command
```
It starts the local server on port 4747 and opens the game in its own Chrome app window.
The sidebar footer should say **🟢 live bridge** once the server is up.
The first time you open it the world is seeded with three sample tiles. Delete them with the 🗑 button on each card.

## 3. Turn on the bridge
```bash
node bridge/install-hooks.js
```
That adds five hooks to `~/.claude/settings.json` (a backup is written next to it).
From now on every Claude Code session becomes a robot on the tile named after the folder it runs in.
Your first prompt names the robot. A permission prompt makes it ❓. When its turn ends it becomes 🙋 waiting on you.
Rename tiles freely: matching ignores case, spaces, and punctuation, so a folder called `product-reels` lands on a tile called "Product reels".

## 4. Click opens the chat
Click a robot, then **💬 Open chat**. The server opens Terminal in that project's folder and runs `claude --resume <session>`.
**💬 New chat here** on any tile starts a fresh Claude session in that folder.

## 5. Scheduled tasks
Copy `routines.example.json` to `routines.json` and describe each scheduled task:
`id`, `name`, `project` (tile name), `kind` (`scheduled` or `research`), `cwd` (folder to run in), `prompt`.
Each routine appears as a ⏰ robot on its tile right away.
To actually run one on a schedule, add a cron or launchd entry that calls:
```bash
node /full/path/to/tiny-planet-crew/bridge/routine-run.js nightly-uploader
```
The runner executes the prompt headlessly with `claude -p`, logs the reply on the robot's card, marks it 🏁 done,
or 💡 found something if the reply contains `FINDING:`. A failed run turns it ❓ with the error.
Scouts on perfected tiles are just routines with `kind: research` and a prompt that asks for FINDING: lines.

Cron example (runs at 2am daily; `crontab -e`):
```
0 2 * * * /usr/local/bin/node /Users/nic/code/designs/tiny-planet-crew/bridge/routine-run.js nightly-uploader
```

## Where things live
- `index.html` the 3D game (Three.js bundled, works offline)
- `state.json` live robots written by the hook and routine runner (local only, not committed)
- `routines.json` your scheduled tasks (local only)
- `bridge/hook.js` Claude Code hook · `bridge/serve.js` local server · `bridge/install-hooks.js` one-shot installer · `bridge/routine-run.js` scheduled runner
- `launch.command` Mac launcher · `launch.bat` Windows launcher
