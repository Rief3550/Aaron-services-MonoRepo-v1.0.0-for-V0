#!/bin/bash
# Script para hacer push a todos los remotes configurados

echo "🚀 Haciendo push a todos los remotes..."

# Push a origin (repo principal)
echo "📦 Push a origin (repo principal)..."
git push origin main

# Push a v0 (repo para V0)
echo "📦 Push a v0 (repo para V0)..."
git push v0 main

echo "✅ Push completado a todos los remotes!"

