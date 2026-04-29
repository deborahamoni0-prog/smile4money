#!/usr/bin/env bash
set -euo pipefail

PROFILE="--release"
if [[ "${1:-}" == "--debug" ]]; then
  PROFILE=""
fi

echo "Building Soroban contracts${PROFILE:+ (release)}..."

if ! cargo build --target wasm32-unknown-unknown $PROFILE; then
  echo "Error: cargo build failed." >&2
  exit 1
fi

echo "Build complete."
