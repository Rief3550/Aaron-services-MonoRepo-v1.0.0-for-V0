#!/bin/bash

# ===========================================
# Script para limpiar archivos de infra/pgdata/ del historial de Git
# ===========================================
# 
# ADVERTENCIA: Este script reescribirá el historial de Git
# y requerirá un force push. Asegúrate de:
# 1. Hacer backup del repositorio
# 2. Coordinar con tu equipo
# 3. Estar seguro de que quieres proceder
#
# ===========================================

set -e

# Verificar si se pasa --yes para ejecución automática
AUTO_YES=false
if [ "$1" = "--yes" ] || [ "$1" = "-y" ]; then
    AUTO_YES=true
fi

if [ "$AUTO_YES" = false ]; then
    echo "⚠️  ADVERTENCIA: Este script reescribirá el historial de Git"
    echo "⚠️  Los archivos de infra/pgdata/ serán removidos del historial"
    echo ""
    read -p "¿Estás seguro de que quieres continuar? (escribe 'SI' para confirmar): " confirmacion
    
    if [ "$confirmacion" != "SI" ]; then
        echo "❌ Operación cancelada"
        exit 1
    fi
else
    echo "⚠️  ADVERTENCIA: Este script reescribirá el historial de Git"
    echo "⚠️  Los archivos de infra/pgdata/ serán removidos del historial"
    echo "✅ Modo automático activado (--yes)"
    echo ""
fi

echo ""
echo "📦 Verificando que git-filter-repo esté instalado..."
if ! command -v git-filter-repo &> /dev/null; then
    echo "❌ git-filter-repo no está instalado"
    echo "📥 Instalando git-filter-repo..."
    pip3 install git-filter-repo
fi

echo ""
echo "🧹 Limpiando historial de Git..."
echo "   Removiendo todos los archivos de infra/pgdata/ del historial..."

# Guardar el remote antes de que git-filter-repo lo remueva
ORIGIN_URL=$(git remote get-url origin 2>/dev/null || echo "")

# Remover archivos de infra/pgdata/ del historial
git filter-repo --path infra/pgdata --invert-paths --force

# Restaurar el remote si existía
if [ -n "$ORIGIN_URL" ]; then
    echo ""
    echo "🔗 Restaurando remote 'origin'..."
    git remote add origin "$ORIGIN_URL" 2>/dev/null || git remote set-url origin "$ORIGIN_URL"
fi

echo ""
echo "✅ Historial limpiado exitosamente"
echo ""
echo "📊 Estadísticas del repositorio:"
git count-objects -vH

echo ""
echo "⚠️  IMPORTANTE: Ahora necesitas hacer un force push"
echo "   Ejecuta: git push origin --force --all"
echo ""

if [ "$AUTO_YES" = false ]; then
    read -p "¿Quieres hacer el force push ahora? (escribe 'SI' para confirmar): " push_confirm
    DO_PUSH=false
    if [ "$push_confirm" = "SI" ]; then
        DO_PUSH=true
    fi
else
    echo "✅ Modo automático: se hará force push automáticamente"
    DO_PUSH=true
fi

if [ "$DO_PUSH" = true ]; then
    echo ""
    echo "🚀 Haciendo force push a todas las ramas..."
    git push origin --force --all
    git push origin --force --tags
    echo ""
    echo "✅ Force push completado"
else
    echo ""
    echo "⏸️  Force push cancelado"
    echo "   Recuerda hacerlo manualmente cuando estés listo:"
    echo "   git push origin --force --all"
    echo "   git push origin --force --tags"
fi

echo ""
echo "✅ Proceso completado"

