#!/usr/bin/env bash
set -euo pipefail

echo "Starting API service..."
export API_PORT=3002
bun run src/index.ts &
API_PID=$!

echo "Starting OpenClaw gateway..."
export OPENCLAW_CONFIG_PATH="${OPENCLAW_CONFIG_PATH:-/app/openclaw.config.json5}"
export OPENCLAW_STATE_DIR="${OPENCLAW_STATE_DIR:-/app/.openclaw}"
export OPENCLAW_HOOKS_TOKEN="${OPENCLAW_HOOKS_TOKEN:-${OPENCLAW_GATEWAY_TOKEN}-hooks}"
export OPENCLAW_SKIP_CANVAS_HOST="${OPENCLAW_SKIP_CANVAS_HOST:-1}"
export OPENCLAW_SKIP_CHANNELS="${OPENCLAW_SKIP_CHANNELS:-1}"
export OPENCLAW_DISABLE_BONJOUR="${OPENCLAW_DISABLE_BONJOUR:-1}"
mkdir -p "$OPENCLAW_STATE_DIR/workspace"
openclaw gateway run --allow-unconfigured --port 18789 --bind loopback --auth token --token "$OPENCLAW_GATEWAY_TOKEN" &
GW_PID=$!

cleanup() {
  kill "$API_PID" "$GW_PID" "${EDGE_PID:-}" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

sleep 2

echo "Starting nginx edge proxy on PORT=${PORT:-3001}..."
python3 - <<'PY'
import os
from pathlib import Path

port = os.environ.get("PORT", "3001")
template = Path("/app/nginx.conf.template").read_text()
Path("/tmp/nginx.conf").write_text(template.replace("__PORT__", port))
PY

nginx -c /tmp/nginx.conf -g 'daemon off;' &
EDGE_PID=$!

wait -n "$API_PID" "$GW_PID" "$EDGE_PID"
