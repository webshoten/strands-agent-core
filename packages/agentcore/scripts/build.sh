#!/usr/bin/env bash
set -euo pipefail

package_root="$(cd "$(dirname "$0")/.." && pwd)"
build_dir="$package_root/build"
output_zip="$package_root/deployment-package.zip"
export UV_CACHE_DIR="$package_root/.uv-cache"

rm -rf "$build_dir" "$output_zip"
mkdir -p "$build_dir"

if [[ -n "${STRANDS_WHEELHOUSE:-}" ]]; then
  uv pip install \
    --prerelease=allow \
    --python-platform aarch64-manylinux2014 \
    --python-version 3.13 \
    --target "$build_dir" \
    --only-binary=:all: \
    --no-index \
    --find-links "$STRANDS_WHEELHOUSE" \
    -r "$package_root/requirements.lock.txt"
else
  uv pip install \
    --prerelease=allow \
    --python-platform aarch64-manylinux2014 \
    --python-version 3.13 \
    --target "$build_dir" \
    --only-binary=:all: \
    -r "$package_root/requirements.lock.txt"
fi

cp "$package_root/src/main.py" "$build_dir/main.py"
find "$build_dir" -type d -name __pycache__ -prune -exec rm -rf {} +
find "$build_dir" -type f -exec chmod 644 {} +
find "$build_dir" -type d -exec chmod 755 {} +

(
  cd "$build_dir"
  zip -q -r "$output_zip" .
)

printf 'Created %s\n' "$output_zip"
