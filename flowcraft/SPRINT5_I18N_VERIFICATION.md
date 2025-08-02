# Sprint 5: Internacionalización (i18n) y Multiidioma - Plan de Verificación

## 🎯 Objetivo del Sprint
Implementar soporte multiidioma completo con detección automática y gestión dinámica de contenido para Español, Inglés y Holandés.

## ⏱️ Duración: 1.5 semanas

---

## 📋 Tareas Planificadas vs Estado

### 🗄️ Database Schema para i18n

#### ✅ Tabla `languages` (id, code, name, is_active, is_default)
- **Estado:** COMPLETADO
- **Archivos objetivo:** `packages/database/prisma/schema.prisma`
- **Criterios de aceptación:**
  - Campos: id (UUID), code (VARCHAR(5)), name, native_name, flag_emoji
  - Constraints: UNIQUE en code, solo un is_default=true
  - Seeds iniciales para ES, EN, NL

#### ✅ Tabla `translation_keys` (id, key, category, description)
- **Estado:** COMPLETADO
- **Archivos objetivo:** `packages/database/prisma/schema.prisma`
- **Criterios de aceptación:**
  - Organización por namespace (auth, common, dashboard)
  - Sistema de categorías para mejor organización
  - Descripción para contexto de traductores

#### ✅ Tabla `translations` (id, language_id, key_id, value, created_at, updated_at)
- **Estado:** COMPLETADO
- **Archivos objetivo:** `packages/database/prisma/schema.prisma`
- **Criterios de aceptación:**
  - Relaciones FK correctas con CASCADE
  - Sistema de aprobación (is_approved, approved_by)
  - Constraint UNIQUE(language_id, key_id)

#### ✅ Índices optimizados para consultas de traducción
- **Estado:** COMPLETADO
- **Criterios de aceptación:**
  - Índice compuesto en (language_id, key_id)
  - Índice en namespace para translation_keys
  - Índice parcial en languages activos

#### ✅ Migraciones y seeds con idiomas base (es, en, nl)
- **Estado:** COMPLETADO
- **Archivos objetivo:** `packages/database/src/seeds/`
- **Criterios de aceptación:**
  - Datos iniciales para 3 idiomas
  - Traducciones base para elementos críticos
  - Script de migración sin downtime

---

### 🔧 Backend i18n System

#### ⏳ Service de traducción con cache Redis
- **Estado:** PENDIENTE
- **Archivos objetivo:** `apps/api/src/services/i18n.service.ts`
- **Criterios de aceptación:**
  - Cache inteligente con TTL configurable
  - Invalidación de cache en actualizaciones
  - Fallback system (en → es → key)

#### ⏳ API endpoints para gestión de traducciones
- **Estado:** PENDIENTE
- **Archivos objetivo:** `apps/api/src/routes/i18n.ts`
- **Criterios de aceptación:**
  - GET /i18n/translations/:lang/:namespace
  - POST/PUT/DELETE para CRUD de traducciones
  - Endpoints para gestión de idiomas

#### ⏳ Middleware de detección de idioma (Accept-Language header)
- **Estado:** PENDIENTE
- **Archivos objetivo:** `apps/api/src/middleware/i18n.middleware.ts`
- **Criterios de aceptación:**
  - Parsing de Accept-Language header
  - Detección de idioma preferido del usuario
  - Fallback a idioma por defecto

#### ⏳ Sistema de fallback (en → es → clave)
- **Estado:** PENDIENTE
- **Criterios de aceptación:**
  - Cascada de fallback configurable
  - Logging de claves faltantes
  - Retorno de clave original si no hay traducción

#### ⏳ API para obtener traducciones por namespace
- **Estado:** PENDIENTE
- **Criterios de aceptación:**
  - Lazy loading por namespace
  - Compresión gzip para respuestas
  - Versionado para cache busting

#### ⏳ Endpoint para cambio dinámico de idioma
- **Estado:** PENDIENTE
- **Criterios de aceptación:**
  - Actualización de preferencia en perfil
  - Respuesta inmediata con nuevas traducciones
  - Sincronización con localStorage

---

### ⚛️ Frontend i18n Implementation

#### ⏳ React i18next setup y configuración
- **Estado:** PENDIENTE
- **Archivos objetivo:** `apps/web/src/i18n/`
- **Criterios de aceptación:**
  - Configuración de i18next con React
  - Backend plugin para cargar traducciones
  - Configuración de namespaces

#### ⏳ Hook personalizado useTranslation
- **Estado:** PENDIENTE
- **Archivos objetivo:** `apps/web/src/hooks/useTranslation.ts`
- **Criterios de aceptación:**
  - Wrapper sobre i18next con funcionalidades extra
  - Soporte para interpolación y pluralización
  - TypeScript types para keys

#### ⏳ Detector de idioma del browser/localización
- **Estado:** PENDIENTE
- **Criterios de aceptación:**
  - Detección automática con navigator.language
  - Fallback a geolocalización (opcional)
  - Respeto a preferencias guardadas

#### ⏳ Selector de idioma en Header
- **Estado:** PENDIENTE
- **Archivos objetivo:** `apps/web/src/components/LanguageSelector.tsx`
- **Criterios de aceptación:**
  - Dropdown con banderas y nombres nativos
  - Cambio inmediato sin reload
  - Persistencia de selección

#### ⏳ Namespace organization (auth, common, dashboard, etc.)
- **Estado:** PENDIENTE
- **Archivos objetivo:** `apps/web/src/i18n/namespaces/`
- **Criterios de aceptación:**
  - Organización lógica por funcionalidad
  - Lazy loading de namespaces
  - TypeScript interfaces para cada namespace

#### ⏳ Lazy loading de traducciones por ruta
- **Estado:** PENDIENTE
- **Criterios de aceptación:**
  - Carga bajo demanda según ruta activa
  - Preloading para rutas probables
  - Loading states durante carga

---

### 🌐 Content Translation

#### ⏳ Traducción completa de Landing Page (es, en, nl)
- **Estado:** PENDIENTE
- **Archivos objetivo:** `apps/web/src/i18n/namespaces/landing.json`
- **Criterios de aceptación:**
  - Hero section, features, CTA, footer
  - Adaptación cultural apropiada
  - SEO meta tags traducidos

#### ⏳ Traducción de formularios de autenticación
- **Estado:** PENDIENTE
- **Archivos objetivo:** `apps/web/src/i18n/namespaces/auth.json`
- **Criterios de aceptación:**
  - Login, register, forgot password forms
  - Labels, placeholders, buttons
  - Mensajes de validación

#### ⏳ Traducción de mensajes de error y validación
- **Estado:** PENDIENTE
- **Archivos objetivo:** `apps/web/src/i18n/namespaces/errors.json`
- **Criterios de aceptación:**
  - Errores de API traducidos
  - Validaciones de formulario
  - Mensajes de estado (loading, success)

#### ⏳ Traducción de Dashboard y navegación
- **Estado:** PENDIENTE
- **Archivos objetivo:** `apps/web/src/i18n/namespaces/dashboard.json`
- **Criterios de aceptación:**
  - Menús de navegación
  - Botones y acciones principales
  - Textos descriptivos

#### ⏳ Traducción de emails y notificaciones
- **Estado:** PENDIENTE
- **Archivos objetivo:** `apps/api/src/templates/`
- **Criterios de aceptación:**
  - Templates de email en 3 idiomas
  - Notificaciones push/in-app
  - Subjects y contenido personalizado

---

### 🎨 Language Detection & UX

#### ⏳ Detección automática por navigator.language
- **Estado:** PENDIENTE
- **Criterios de aceptación:**
  - Parsing correcto de locale codes
  - Mapeo a idiomas soportados
  - Fallback a idioma por defecto

#### ⏳ Detección por geolocalización (opcional)
- **Estado:** PENDIENTE
- **Criterios de aceptación:**
  - API de geolocalización como fallback
  - Mapeo país → idioma preferido
  - Respeto a privacidad del usuario

#### ⏳ Persistencia de preferencia en localStorage
- **Estado:** PENDIENTE
- **Criterios de aceptación:**
  - Almacenamiento local de preferencia
  - Sincronización con backend
  - Limpieza en logout

#### ⏳ Sincronización con perfil de usuario
- **Estado:** PENDIENTE
- **Criterios de aceptación:**
  - Campo language_preference en User model
  - API para actualizar preferencia
  - Carga automática en login

#### ⏳ Cambio de idioma sin reload de página
- **Estado:** PENDIENTE
- **Criterios de aceptación:**
  - Transición suave entre idiomas
  - Mantenimiento de estado de aplicación
  - Actualización de URL si necesario

---

### 🛠️ Admin Panel para Traducciones

#### ⏳ Interface para gestión de translation keys
- **Estado:** PENDIENTE
- **Archivos objetivo:** `apps/web/src/components/admin/TranslationKeys.tsx`
- **Criterios de aceptación:**
  - CRUD de claves de traducción
  - Organización por namespace
  - Búsqueda y filtrado

#### ⏳ Editor de traducciones por idioma
- **Estado:** PENDIENTE
- **Archivos objetivo:** `apps/web/src/components/admin/TranslationEditor.tsx`
- **Criterios de aceptación:**
  - Editor rico para traducciones
  - Vista side-by-side de idiomas
  - Validación de interpolaciones

#### ⏳ Importación/exportación de traducciones (JSON/CSV)
- **Estado:** PENDIENTE
- **Criterios de aceptación:**
  - Export masivo en múltiples formatos
  - Import con validación
  - Backup y restore de traducciones

#### ⏳ Sistema de aprobación para traducciones
- **Estado:** PENDIENTE
- **Criterios de aceptación:**
  - Workflow de aprobación
  - Roles de traductor y revisor
  - Historial de cambios

#### ⏳ Estadísticas de completitud por idioma
- **Estado:** PENDIENTE
- **Criterios de aceptación:**
  - Dashboard con métricas
  - Progreso por namespace
  - Identificación de gaps

---

## 🎯 Criterios de Éxito del Sprint

### ✅ Funcionalidad Básica
- [ ] Usuario puede cambiar idioma desde el header
- [ ] Detección automática funciona en primera visita
- [ ] Landing page completamente traducida en 3 idiomas
- [ ] Formularios de auth funcionan en todos los idiomas

### ✅ Rendimiento
- [ ] Tiempo de carga de traducciones < 200ms
- [ ] Cache de Redis funciona correctamente
- [ ] Lazy loading no bloquea la UI

### ✅ Experiencia de Usuario
- [ ] Cambio de idioma es instantáneo
- [ ] No hay textos sin traducir (fallback funciona)
- [ ] Selector de idioma es intuitivo
- [ ] Preferencia se persiste entre sesiones

### ✅ Administración
- [ ] Panel admin permite gestionar traducciones
- [ ] Import/export funciona sin errores
- [ ] Sistema de aprobación operativo

---

## 🚀 Entregables Finales

1. **Sistema de traducciones dinámico completo**
2. **Landing page y auth en 3 idiomas (ES, EN, NL)**
3. **Selector de idioma funcional en header**
4. **Base de datos optimizada para i18n**
5. **Panel de administración de traducciones**

---

## 🔄 Plan de Testing

### Unit Tests
- [ ] Services de traducción
- [ ] Middleware de detección de idioma
- [ ] Hooks de React i18next

### Integration Tests
- [ ] API endpoints de i18n
- [ ] Cache de Redis
- [ ] Fallback system

### E2E Tests
- [ ] Cambio de idioma completo
- [ ] Detección automática
- [ ] Persistencia de preferencias

### Performance Tests
- [ ] Carga de traducciones bajo load
- [ ] Memoria usage con múltiples idiomas
- [ ] Cache hit ratio

---

## 📊 Métricas de Éxito

- **Cobertura de traducción:** 100% para elementos críticos
- **Tiempo de respuesta:** < 200ms para cambio de idioma
- **Precisión de detección:** > 95% para idiomas soportados
- **Satisfacción UX:** Cambio fluido sin interrupciones

---

## 🔗 Dependencias

### Tecnologías Nuevas
- `react-i18next` - Framework de i18n para React
- `i18next-browser-languagedetector` - Detección automática
- `i18next-http-backend` - Carga desde API

### Servicios Externos (Opcional)
- Servicio de geolocalización para detección por país
- Servicio de traducción automática para bootstrap inicial

---

## 🎯 Estado Actual: PENDIENTE

**Próximos pasos:**
1. Diseñar esquema de base de datos
2. Implementar backend services
3. Configurar React i18next
4. Crear componentes de UI
5. Implementar sistema de admin

**Estimación de esfuerzo:** 1.5 semanas (60 horas de desarrollo)