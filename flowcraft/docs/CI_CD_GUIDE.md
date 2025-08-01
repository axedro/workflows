# CI/CD Pipeline - Guía de Uso
## FlowCraft Development Workflow

### 🚀 **Configuración Inicial**

#### 1. **Configurar GitHub Repository**
```bash
# Asegúrate de que el repositorio esté en GitHub
git remote add origin https://github.com/tu-usuario/flowcraft.git
git push -u origin main
```

#### 2. **Configurar Secrets (Opcional)**
Si necesitas variables de entorno en el pipeline, ve a:
- GitHub Repository → Settings → Secrets and variables → Actions
- Añade secrets como:
  - `DATABASE_URL`
  - `REDIS_URL`
  - `JWT_SECRET`

#### 3. **Verificar Workflow**
- Ve a tu repositorio en GitHub
- Pestaña "Actions"
- Deberías ver el workflow "CI/CD Pipeline"

### 🔄 **Flujo de Desarrollo**

#### **Desarrollo Local**
```bash
# 1. Crear feature branch
git checkout -b feature/nueva-funcionalidad

# 2. Hacer cambios
# ... código ...

# 3. Commit y push
git add .
git commit -m "feat: añadir nueva funcionalidad"
git push origin feature/nueva-funcionalidad
```

#### **Pull Request**
1. Ve a GitHub y crea un Pull Request
2. El pipeline se ejecutará automáticamente
3. Revisa los resultados en la pestaña "Checks"

#### **Merge a Main**
```bash
# 1. Merge PR en GitHub
# 2. El pipeline se ejecutará automáticamente
# 3. Se creará un release automático
```

### 📊 **Monitoreo del Pipeline**

#### **Verificar Estado**
- **GitHub Actions**: Ve a la pestaña "Actions" en tu repo
- **Checks en PR**: Cada PR muestra el estado del pipeline
- **Email notifications**: Recibirás emails con el resultado

#### **Logs y Debugging**
- Haz clic en cualquier job para ver logs detallados
- Los logs muestran:
  - Comandos ejecutados
  - Errores específicos
  - Tiempo de ejecución

### 🛠️ **Comandos Locales (Pre-Push)**

#### **Ejecutar Pipeline Localmente**
```bash
# Instalar dependencias
pnpm install

# Linting
pnpm lint

# Type checking
pnpm type-check

# Tests (si están configurados)
pnpm test:unit

# Build
pnpm build
```

#### **Verificar Antes de Push**
```bash
# Script completo de verificación
pnpm lint && pnpm type-check && pnpm build
```

### 🚨 **Solución de Problemas**

#### **Pipeline Falla en Linting**
```bash
# Ejecutar linting localmente
pnpm lint

# Auto-fix algunos problemas
pnpm lint --fix
```

#### **Pipeline Falla en Type Checking**
```bash
# Verificar tipos localmente
pnpm type-check

# Verificar tipos específicos
npx tsc --noEmit
```

#### **Pipeline Falla en Build**
```bash
# Construir localmente
pnpm build

# Verificar dependencias
pnpm install --frozen-lockfile
```

#### **Pipeline Falla en Tests**
```bash
# Ejecutar tests localmente
pnpm test:unit

# Verificar configuración de test
# Revisar archivos de test
```

### 📈 **Métricas y Reportes**

#### **Tiempo de Ejecución**
- **Test Job**: ~5-10 minutos
- **Security Job**: ~2-3 minutos
- **Build Job**: ~3-5 minutos

#### **Notificaciones**
- **Slack/Discord**: Configurar webhooks
- **Email**: Automático en GitHub
- **Status Badge**: Añadir a README

### 🔧 **Personalización**

#### **Modificar Workflow**
Edita `.github/workflows/ci.yml`:

```yaml
# Añadir nuevos jobs
jobs:
  new-job:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # ... más pasos

# Modificar triggers
on:
  push:
    branches: [main, develop, feature/*]
  pull_request:
    branches: [main, develop]
```

#### **Añadir Nuevos Scripts**
En `package.json`:
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:integration": "jest --config jest.integration.js"
  }
}
```

### 🎯 **Mejores Prácticas**

#### **Commits**
```bash
# Usar conventional commits
git commit -m "feat: añadir autenticación JWT"
git commit -m "fix: corregir error en workflow editor"
git commit -m "docs: actualizar README"
```

#### **Branching**
```bash
# Feature branches
git checkout -b feature/nombre-funcionalidad

# Hotfix branches
git checkout -b hotfix/critical-bug

# Release branches
git checkout -b release/v1.0.0
```

#### **Pull Requests**
- **Título descriptivo**: "feat: implementar sistema de autenticación"
- **Descripción detallada**: Qué hace, cómo funciona, testing
- **Labels**: feature, bug, documentation, etc.
- **Reviewers**: Asignar al menos 1 reviewer

### 📞 **Soporte**

#### **Problemas Comunes**
1. **Pipeline no se ejecuta**: Verificar triggers en workflow
2. **Dependencias fallan**: Verificar pnpm-lock.yaml
3. **Tests fallan**: Ejecutar localmente primero
4. **Build falla**: Verificar TypeScript errors

#### **Contacto**
- **Issues**: Crear issue en GitHub
- **Discussions**: Usar GitHub Discussions
- **Documentation**: Revisar docs/ folder

---

**¡El pipeline está listo para usar! 🚀** 