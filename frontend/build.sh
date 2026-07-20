#!/bin/zsh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
cd ~/nature-miniplex-monorepo/frontend
npm install -g pnpm
pnpm install
pnpm build
