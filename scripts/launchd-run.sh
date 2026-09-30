#!/bin/bash
# launchd starts jobs with a minimal PATH, and nvm/Homebrew upgrades remove old
# versioned node directories, so resolve node on every start instead of pinning one.
node="${CRYPTMONITOR_NODE:-}"
if [ -z "$node" ]; then
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  for nvm_sh in "$NVM_DIR/nvm.sh" /opt/homebrew/opt/nvm/nvm.sh /usr/local/opt/nvm/nvm.sh; do
    if [ -s "$nvm_sh" ]; then
      . "$nvm_sh" --no-use
      node="$(nvm which default 2>/dev/null)"
      break
    fi
  done
fi
if [ ! -x "$node" ]; then
  for candidate in /opt/homebrew/bin/node /usr/local/bin/node; do
    if [ -x "$candidate" ]; then node="$candidate"; break; fi
  done
fi
if [ ! -x "$node" ]; then
  echo "cryptMonitor: nodeが見つかりません。CRYPTMONITOR_NODE で場所を指定してください。" >&2
  exit 78
fi
cd "$(dirname "$0")/.." || exit 78
exec "$node" scripts/monitor.mjs
