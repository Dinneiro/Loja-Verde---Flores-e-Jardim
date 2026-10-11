#!/usr/bin/env sh
cd "$(dirname "$0")"
[ -f .env ] || { cp .env.example .env; echo "Criado .env a partir de .env.example"; }
npm install --no-audit --no-fund && npm start
