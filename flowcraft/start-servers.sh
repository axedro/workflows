#!/bin/bash

# FlowCraft Server Startup Script
# Soluciona problemas de job control iniciando servidores con nohup

echo "🚀 FlowCraft - Iniciando servidores..."

# Función para verificar si un puerto está en uso
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        echo "❌ Puerto $port ya está en uso"
        return 1
    else
        echo "✅ Puerto $port disponible"
        return 0
    fi
}

# Función para esperar que un puerto esté disponible
wait_for_port() {
    local port=$1
    local timeout=30
    local count=0
    
    echo "⏳ Esperando que el puerto $port esté disponible..."
    while ! curl -s http://localhost:$port/health > /dev/null 2>&1; do
        sleep 1
        count=$((count + 1))
        if [ $count -ge $timeout ]; then
            echo "❌ Timeout esperando puerto $port"
            return 1
        fi
    done
    echo "✅ Puerto $port está respondiendo"
    return 0
}

# Verificar puertos
echo "🔍 Verificando puertos..."
check_port 3000 || exit 1
check_port 5173 || exit 1

# Verificar Docker
echo "🐳 Verificando Docker..."
if ! docker ps | grep -q "flowcraft-postgres\|flowcraft-redis"; then
    echo "❌ Docker containers no están corriendo. Ejecuta: docker compose up -d"
    exit 1
fi
echo "✅ Docker containers activos"

# Iniciar API
echo "🔧 Iniciando API server..."
cd apps/api
nohup pnpm dev > api.log 2>&1 &
API_PID=$!
echo "API PID: $API_PID"
cd ../..

# Esperar que API esté disponible
if wait_for_port 3000; then
    echo "✅ API server iniciado correctamente"
else
    echo "❌ Error iniciando API server"
    kill $API_PID 2>/dev/null
    exit 1
fi

# Iniciar Frontend
echo "🌐 Iniciando Frontend server..."
cd apps/web
nohup pnpm dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ../..

# Esperar un poco para que el frontend se inicie
sleep 5

# Verificar estado final
echo "📊 Estado final:"
echo "🚀 API (puerto 3000): $(curl -s http://localhost:3000/health | jq -r '.status' 2>/dev/null || echo 'No disponible')"
echo "🌐 Frontend (puerto 5173): $(curl -s http://localhost:5173 > /dev/null 2>&1 && echo 'Activo' || echo 'Iniciando...')"

# Guardar PIDs para poder terminar después
echo "$API_PID" > .api.pid
echo "$FRONTEND_PID" > .frontend.pid

echo ""
echo "🎉 Servidores iniciados!"
echo "📝 Para terminar los servidores: ./stop-servers.sh"
echo "📊 API: http://localhost:3000"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "📋 PIDs guardados:"
echo "   API: $API_PID (apps/api/api.log)"
echo "   Frontend: $FRONTEND_PID (apps/web/frontend.log)"