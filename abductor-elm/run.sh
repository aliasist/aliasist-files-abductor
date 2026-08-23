#!/bin/bash
# Launcher for Aliasist Files Abductor (Elm Edition)

# Load user environment (NVM, Rust, PATH)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

export PATH="$HOME/.cargo/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:$PATH"

DIR="/home/aliasist/aliasist-files-abductor/abductor-elm"
cd "$DIR" || exit 1

# If a self-contained release binary exists, run it
if [ -f "$DIR/src-tauri/target/release/aliasist-files-abductor-elm" ]; then
    exec "$DIR/src-tauri/target/release/aliasist-files-abductor-elm"
else
    # Run in dev mode (spawns Vite frontend server + Tauri GUI window)
    exec npm run tauri dev
fi
