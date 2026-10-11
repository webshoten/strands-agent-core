#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "$0")/.." && pwd)"
agent_root="$project_root/packages/agentcore"

export UV_CACHE_DIR="$agent_root/.uv-cache"
export UV_PYTHON_INSTALL_DIR="$agent_root/.uv-python"

cd "$project_root"

pnpm_store_dir=""
if [[ -f "$project_root/node_modules/.modules.yaml" ]]; then
  pnpm_store_dir="$(sed -n 's/^storeDir: //p' "$project_root/node_modules/.modules.yaml")"
fi

if [[ -n "$pnpm_store_dir" ]]; then
  pnpm install --frozen-lockfile --store-dir "$pnpm_store_dir"
else
  pnpm install --frozen-lockfile
fi

uv python install 3.13 --no-bin

if [[ ! -x "$agent_root/.venv/bin/python" ]]; then
  uv venv --python 3.13 "$agent_root/.venv"
fi

uv pip sync \
  --python "$agent_root/.venv/bin/python" \
  "$agent_root/requirements.lock.txt"

echo "Local development dependencies are ready"
