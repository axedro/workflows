#!/bin/bash

# FlowCraft Server Stop Script

echo "🛑 FlowCraft - Deteniendo servidores..."

# Función para terminar proceso por PID
kill_process() {
    local pid_file=$1
    local name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🔄 Terminando $name (PID: $pid)..."
            kill "$pid"
            sleep 2
            if kill -0 "$pid" 2>/dev/null; then
                echo "⚠️  Forzando terminación de $name..."
                kill -9 "$pid"
            fi
            echo "✅ $name terminado"
        else
            echo "ℹ️  $name ya no está corriendo"
        fi
        rm -f "$pid_file"
    else
        echo "ℹ️  No se encontró PID file para $name"
    fi
}

# Terminar por PID files
kill_process ".api.pid" "API"
kill_process ".frontend.pid" "Frontend"

# Terminar cualquier proceso restante en los puertos
echo "🔍 Verificando puertos..."

if lsof -ti:3000 > /dev/null 2>&1; then
    echo "🔄 Terminando procesos en puerto 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi

if lsof -ti:5173 > /dev/null 2>&1; then
    echo "🔄 Terminando procesos en puerto 5173..."
    lsof -ti:5173 | xargs kill -9 2>/dev/null
fi

# Limpiar logs antiguos
echo "🧹 Limpiando logs..."
rm -f apps/api/api.log apps/web/frontend.log apps/api/server.log

echo "✅ Todos los servidores han sido detenidos"