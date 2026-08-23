#!/bin/bash
# Launcher for Aliasist Files Abductor (Electron OG)

export PATH="$HOME/.cargo/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -n 1)/bin:$HOME/.local/bin:/usr/local/bin:/usr/bin:$PATH"

DIR="/home/aliasist/aliasist-files-abductor/abductor-electron"
cd "$DIR" && npx electron . --no-sandbox
