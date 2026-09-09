#!/bin/bash
# Double-click me on a Mac: starts the server (if needed) and opens the game as its own app window.
cd "$(dirname "$0")"
if ! curl -s -o /dev/null http://localhost:4747/ ; then
  nohup node bridge/serve.js > /tmp/tiny-planet-crew.log 2>&1 &
  sleep 1
fi
open -na "Google Chrome" --args --app=http://localhost:4747 2>/dev/null || open http://localhost:4747
