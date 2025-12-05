#!/bin/bash
# Deployment script pro Klientskou datovou platformu
# Spustit na serveru: bash deploy.sh

set -e

echo "==================================="
echo "Klientská datová platforma - Deploy"
echo "==================================="

# Kontrola Node.js verze
NODE_PATH="$HOME/nodejs/bin"
export PATH="$NODE_PATH:$PATH"

echo ""
echo "1. Kontrola Node.js..."
node --version || { echo "CHYBA: Node.js není dostupný"; exit 1; }

echo ""
echo "2. Instalace závislostí..."
npm install

echo ""
echo "3. Generování Prisma klienta..."
npm run db:generate

echo ""
echo "4. Aplikace databázových migrací..."
npm run db:push

echo ""
echo "5. Seed admin uživatele..."
# Nastavení hesla pro admin (změňte na bezpečné heslo!)
export ADMIN_EMAIL="admin@racek.digital"
export ADMIN_PASSWORD="ZmenTotoHeslo123!"
npm run db:seed

echo ""
echo "6. Build aplikace..."
npm run build

echo ""
echo "==================================="
echo "Deploy dokončen!"
echo "==================================="
echo ""
echo "Pro spuštění aplikace:"
echo "  npm start"
echo ""
echo "Nebo pro PM2 (doporučeno pro produkci):"
echo "  pm2 start npm --name 'klientska-platforma' -- start"
echo ""
echo "Admin přihlášení:"
echo "  Email: $ADMIN_EMAIL"
echo "  Heslo: $ADMIN_PASSWORD"
echo ""
echo "DŮLEŽITÉ: Změňte heslo admina po prvním přihlášení!"
