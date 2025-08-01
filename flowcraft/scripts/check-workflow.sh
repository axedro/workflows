#!/bin/bash

# Script para verificar el estado del workflow CI/CD
# Requiere: GitHub CLI (gh) instalado

echo "🔍 Verificando estado del workflow CI/CD..."

# Verificar si GitHub CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI no está instalado"
    echo "📦 Instalar con: brew install gh"
    echo "🔗 O verificar manualmente en: https://github.com/axedro/workflows/actions"
    exit 1
fi

# Verificar si estamos autenticados
if ! gh auth status &> /dev/null; then
    echo "❌ No estás autenticado con GitHub CLI"
    echo "🔐 Ejecutar: gh auth login"
    exit 1
fi

# Obtener el último workflow run
echo "📊 Obteniendo último workflow run..."
WORKFLOW_RUN=$(gh api repos/axedro/workflows/actions/runs --jq '.workflow_runs[0]')

if [ -z "$WORKFLOW_RUN" ]; then
    echo "❌ No se encontraron workflow runs"
    echo "🔗 Verificar manualmente en: https://github.com/axedro/workflows/actions"
    exit 1
fi

# Extraer información del workflow
RUN_ID=$(echo "$WORKFLOW_RUN" | jq -r '.id')
STATUS=$(echo "$WORKFLOW_RUN" | jq -r '.status')
CONCLUSION=$(echo "$WORKFLOW_RUN" | jq -r '.conclusion // "running"')
WORKFLOW_NAME=$(echo "$WORKFLOW_RUN" | jq -r '.name')
HEAD_BRANCH=$(echo "$WORKFLOW_RUN" | jq -r '.head_branch')
CREATED_AT=$(echo "$WORKFLOW_RUN" | jq -r '.created_at')

echo "📋 Información del Workflow:"
echo "   ID: $RUN_ID"
echo "   Nombre: $WORKFLOW_NAME"
echo "   Rama: $HEAD_BRANCH"
echo "   Estado: $STATUS"
echo "   Conclusión: $CONCLUSION"
echo "   Creado: $CREATED_AT"

# Mostrar estado con emoji
case $STATUS in
    "completed")
        case $CONCLUSION in
            "success")
                echo "✅ Workflow completado exitosamente!"
                ;;
            "failure")
                echo "❌ Workflow falló"
                ;;
            "cancelled")
                echo "⏹️ Workflow cancelado"
                ;;
            *)
                echo "⚠️ Workflow completado con estado: $CONCLUSION"
                ;;
        esac
        ;;
    "in_progress")
        echo "🔄 Workflow en ejecución..."
        ;;
    "queued")
        echo "⏳ Workflow en cola..."
        ;;
    *)
        echo "❓ Estado desconocido: $STATUS"
        ;;
esac

echo ""
echo "🔗 Ver detalles completos en:"
echo "   https://github.com/axedro/workflows/actions/runs/$RUN_ID"

# Mostrar jobs del workflow
echo ""
echo "📋 Jobs del workflow:"
gh api repos/axedro/workflows/actions/runs/$RUN_ID/jobs --jq '.jobs[] | "   \(.name): \(.status) (\(.conclusion // "running"))"' 2>/dev/null || echo "   No se pudieron obtener los jobs" 