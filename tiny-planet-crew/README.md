# 🪐 Tiny Planet Crew

A tiny visual task manager. Every project is a hex tile on a planet. Every chat,
scheduled task, or research bot working on that project is a little robot living on the tile.
Finish tasks and the tile levels up: bigger dome, more decorations, antennas, solar panels.

## Run it
Open `index.html` in any browser. No install. Progress saves in the browser.
Use **Export / Import** to back up or move your world.

## What's on a tile
Level 1 is a lone HQ dome. Each level adds to the settlement: workshop, crate stacks, storage tank, greenhouse, solar array, radar tower, wind turbine, a second workshop, and a flag at ★ Perfected, plus flowers, bushes and lamp posts. A landing pod (Home base) sits at the edge of the colony.

## Controls
- **Drag** to pan, **scroll / pinch** to zoom, **⌂** to fit everything.
- **Click a robot** for its card: a mini chat transcript, its question, last contact. Type in the box to log what you told it. Buttons to mark it answered, talked to, finished, or to change its status.
- **Click a tile** to open it in the sidebar. **Double-click** to zoom in on it.

## How it works
- **+ Tile** adds a project. A new hex appears on the map.
- Inside a tile, **Robot joins** adds a robot: 💬 chat, ⏰ scheduled task, or 🔭 research bot. Start a new chat for a project? Add a robot to that tile so it shows up helping.
- **Tasks** drive levels. Level 1 → 10. At level 10 the tile is **★ Perfected**.
- Nothing is ever perfect, so a perfected tile automatically gets a **Scout** research bot. Use **Copy research prompt** and paste it into a Claude Code chat to have it hunt for improvements. When it finds one, mark it 💡 **Found something**.
- Robots that need you glow: ❓ has a question, 💡 found something, 🙋 waiting on you, 💤 nobody has talked to it in a while (the "stale" dropdown sets how long). The tile pulses gold and they appear under **Needs you**.

## Live bridge to Claude Code (optional, experimental)
Real Claude Code sessions can show up as robots automatically.

1. Run the little server from this folder: `node bridge/serve.js` and open http://localhost:4747
2. Add the hooks from `bridge/claude-settings.example.json` to your `~/.claude/settings.json`, replacing the path.
3. Now each Claude Code session becomes a robot on the tile named after the folder it runs in (`basename` of the cwd).
   Your first prompt names the robot. A permission prompt or idle notification turns it into ❓. When its turn ends it becomes 🙋 waiting on you. Its card shows the last few messages from the real transcript (your prompts and its replies) and has **Copy resume cmd**, which gives you `claude --resume <session>` to jump back into that chat.

The sidebar footer shows **🟢 live bridge** when it is reading `state.json`.
The hook writes to `state.json` next to `index.html` (override with `TPC_STATE`).

`planet-v1.html` is the original round-planet version.
