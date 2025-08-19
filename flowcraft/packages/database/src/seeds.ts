import { prisma } from './client'
import bcrypt from 'bcrypt'

// Using unified prisma client

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create a test organization
  const organization = await prisma.organization.upsert({
    where: { id: 'test-org-1' },
    update: {},
    create: {
      id: 'test-org-1',
      name: 'Test Organization',
      plan: 'FREE',
    },
  })

  // Create a test user
  const passwordHash = await bcrypt.hash('test123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'test@flowcraft.io' },
    update: {},
    create: {
      email: 'test@flowcraft.io',
      name: 'Test User',
      passwordHash: passwordHash,
      organizationId: organization.id,
      role: 'ADMIN',
    },
  })

  // Create some test connectors
  const connectors = await Promise.all([
    prisma.connector.upsert({
      where: { id: 'http-connector' },
      update: {},
      create: {
        id: 'http-connector',
        name: 'HTTP Request Connector',
        type: 'http',
        description: 'Make HTTP requests to APIs and web services',
        configuration: {
          baseUrl: 'https://api.example.com',
          endpoint: '/users',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        version: 1,
        createdBy: user.id,
      },
    }),
    prisma.connector.upsert({
      where: { id: 'email-connector' },
      update: {},
      create: {
        id: 'email-connector',
        name: 'Email/SMTP Connector',
        type: 'email',
        description: 'Send emails via SMTP',
        configuration: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: 'your-email@gmail.com',
            pass: 'your-app-password',
          },
        },
        version: 1,
        createdBy: user.id,
      },
    }),
  ])

  // Create initial languages
  const languages = await Promise.all([
    prisma.language.upsert({
      where: { code: 'es' },
      update: {},
      create: {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        flagEmoji: '🇪🇸',
        isDefault: true,
        isActive: true,
      },
    }),
    prisma.language.upsert({
      where: { code: 'en' },
      update: {},
      create: {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flagEmoji: '🇺🇸',
        isDefault: false,
        isActive: true,
      },
    }),
    prisma.language.upsert({
      where: { code: 'nl' },
      update: {},
      create: {
        code: 'nl',
        name: 'Dutch',
        nativeName: 'Nederlands',
        flagEmoji: '🇳🇱',
        isDefault: false,
        isActive: true,
      },
    }),
  ])

  // Create initial translation keys
  const translationKeysData = [
    // Common translations
    { key: 'common.welcome', namespace: 'common', category: 'messages', description: 'Welcome message' },
    { key: 'common.welcome_user', namespace: 'common', category: 'messages', description: 'Welcome message with user name' },
    { key: 'common.dashboard', namespace: 'common', category: 'navigation', description: 'Dashboard link' },
    { key: 'common.profile', namespace: 'common', category: 'navigation', description: 'Profile link' },
    { key: 'common.logout', namespace: 'common', category: 'actions', description: 'Logout button' },
    { key: 'common.sign_in', namespace: 'common', category: 'actions', description: 'Sign in button' },
    { key: 'common.get_started', namespace: 'common', category: 'actions', description: 'Get started button' },
    { key: 'common.loading', namespace: 'common', category: 'states', description: 'Loading message' },
    { key: 'common.error', namespace: 'common', category: 'states', description: 'Error message' },
    { key: 'common.nav.home', namespace: 'common', category: 'navigation', description: 'Home navigation link' },
    { key: 'common.nav.features', namespace: 'common', category: 'navigation', description: 'Features navigation link' },
    { key: 'common.nav.pricing', namespace: 'common', category: 'navigation', description: 'Pricing navigation link' },
    { key: 'common.nav.docs', namespace: 'common', category: 'navigation', description: 'Documentation navigation link' },
    
    // Auth translations
    { key: 'auth.login.title', namespace: 'auth', category: 'titles', description: 'Login page title' },
    { key: 'auth.register.title', namespace: 'auth', category: 'titles', description: 'Registration page title' },
    { key: 'auth.email', namespace: 'auth', category: 'labels', description: 'Email field label' },
    { key: 'auth.password', namespace: 'auth', category: 'labels', description: 'Password field label' },
    { key: 'auth.name', namespace: 'auth', category: 'labels', description: 'Name field label' },
    { key: 'auth.confirm_password', namespace: 'auth', category: 'labels', description: 'Confirm password label' },
    { key: 'auth.signin_button', namespace: 'auth', category: 'actions', description: 'Sign in button' },
    { key: 'auth.register_button', namespace: 'auth', category: 'actions', description: 'Register button' },
    { key: 'auth.forgot_password', namespace: 'auth', category: 'actions', description: 'Forgot password link' },
    { key: 'auth.no_account', namespace: 'auth', category: 'messages', description: 'No account message' },
    { key: 'auth.have_account', namespace: 'auth', category: 'messages', description: 'Have account message' },
    { key: 'auth.sign_up', namespace: 'auth', category: 'actions', description: 'Sign up button' },
    { key: 'auth.sign_in', namespace: 'auth', category: 'actions', description: 'Sign in button' },
    { key: 'auth.email_placeholder', namespace: 'auth', category: 'placeholders', description: 'Email field placeholder' },
    { key: 'auth.password_placeholder', namespace: 'auth', category: 'placeholders', description: 'Password field placeholder' },
    { key: 'auth.name_placeholder', namespace: 'auth', category: 'placeholders', description: 'Name field placeholder' },
    { key: 'auth.organization_name', namespace: 'auth', category: 'labels', description: 'Organization name field label' },
    { key: 'auth.organization_placeholder', namespace: 'auth', category: 'placeholders', description: 'Organization field placeholder' },
    { key: 'auth.confirm_password_placeholder', namespace: 'auth', category: 'placeholders', description: 'Confirm password field placeholder' },
    
    // Landing page translations
    { key: 'landing.hero.title', namespace: 'landing', category: 'hero', description: 'Main hero title' },
    { key: 'landing.hero.subtitle', namespace: 'landing', category: 'hero', description: 'Hero subtitle' },
    { key: 'landing.hero.cta_primary', namespace: 'landing', category: 'hero', description: 'Primary CTA button' },
    { key: 'landing.hero.cta_secondary', namespace: 'landing', category: 'hero', description: 'Secondary CTA button' },
    { key: 'landing.features.title', namespace: 'landing', category: 'features', description: 'Features section title' },
    { key: 'landing.features.subtitle', namespace: 'landing', category: 'features', description: 'Features section subtitle' },
    { key: 'landing.features.visual_editor.title', namespace: 'landing', category: 'features', description: 'Visual editor title' },
    { key: 'landing.features.visual_editor.description', namespace: 'landing', category: 'features', description: 'Visual editor description' },
    { key: 'landing.features.integrations.title', namespace: 'landing', category: 'features', description: 'Integrations title' },
    { key: 'landing.features.integrations.description', namespace: 'landing', category: 'features', description: 'Integrations description' },
    { key: 'landing.features.monitoring.title', namespace: 'landing', category: 'features', description: 'Monitoring title' },
    { key: 'landing.features.monitoring.description', namespace: 'landing', category: 'features', description: 'Monitoring description' },
    { key: 'landing.features.scalable.title', namespace: 'landing', category: 'features', description: 'Scalable title' },
    { key: 'landing.features.scalable.description', namespace: 'landing', category: 'features', description: 'Scalable description' },
    { key: 'landing.features.custom_connectors.title', namespace: 'landing', category: 'features', description: 'Custom connectors title' },
    { key: 'landing.features.custom_connectors.description', namespace: 'landing', category: 'features', description: 'Custom connectors description' },
    { key: 'landing.features.security.title', namespace: 'landing', category: 'features', description: 'Security title' },
    { key: 'landing.features.security.description', namespace: 'landing', category: 'features', description: 'Security description' },
    { key: 'landing.cta.title', namespace: 'landing', category: 'cta', description: 'CTA section title' },
    { key: 'landing.cta.subtitle', namespace: 'landing', category: 'cta', description: 'CTA section subtitle' },
    { key: 'landing.cta.button', namespace: 'landing', category: 'cta', description: 'CTA button' },
    { key: 'landing.footer.description', namespace: 'landing', category: 'footer', description: 'Footer description' },
    { key: 'landing.footer.product', namespace: 'landing', category: 'footer', description: 'Footer product section' },
    { key: 'landing.footer.features', namespace: 'landing', category: 'footer', description: 'Footer features link' },
    { key: 'landing.footer.pricing', namespace: 'landing', category: 'footer', description: 'Footer pricing link' },
    { key: 'landing.footer.integrations', namespace: 'landing', category: 'footer', description: 'Footer integrations link' },
    { key: 'landing.footer.api', namespace: 'landing', category: 'footer', description: 'Footer API link' },
    { key: 'landing.footer.resources', namespace: 'landing', category: 'footer', description: 'Footer resources section' },
    { key: 'landing.footer.documentation', namespace: 'landing', category: 'footer', description: 'Footer documentation link' },
    { key: 'landing.footer.tutorials', namespace: 'landing', category: 'footer', description: 'Footer tutorials link' },
    { key: 'landing.footer.blog', namespace: 'landing', category: 'footer', description: 'Footer blog link' },
    { key: 'landing.footer.support', namespace: 'landing', category: 'footer', description: 'Footer support link' },
    { key: 'landing.footer.company', namespace: 'landing', category: 'footer', description: 'Footer company section' },
    { key: 'landing.footer.about', namespace: 'landing', category: 'footer', description: 'Footer about link' },
    { key: 'landing.footer.careers', namespace: 'landing', category: 'footer', description: 'Footer careers link' },
    { key: 'landing.footer.contact', namespace: 'landing', category: 'footer', description: 'Footer contact link' },
    { key: 'landing.footer.privacy', namespace: 'landing', category: 'footer', description: 'Footer privacy link' },
    { key: 'landing.footer.copyright', namespace: 'landing', category: 'footer', description: 'Footer copyright text' },
    
    // Dashboard translations
    { key: 'dashboard.title', namespace: 'dashboard', category: 'titles', description: 'Dashboard page title' },
    { key: 'dashboard.welcome', namespace: 'dashboard', category: 'messages', description: 'Dashboard welcome message' },
    { key: 'dashboard.stats.workflows', namespace: 'dashboard', category: 'stats', description: 'Workflows stat label' },
    { key: 'dashboard.stats.executions', namespace: 'dashboard', category: 'stats', description: 'Executions stat label' },
    { key: 'dashboard.stats.connectors', namespace: 'dashboard', category: 'stats', description: 'Connectors stat label' },
    { key: 'dashboard.quick_actions.title', namespace: 'dashboard', category: 'actions', description: 'Quick actions title' },
    { key: 'dashboard.quick_actions.create_workflow', namespace: 'dashboard', category: 'actions', description: 'Create workflow action' },
    { key: 'dashboard.quick_actions.create_workflow_desc', namespace: 'dashboard', category: 'actions', description: 'Create workflow description' },
    { key: 'dashboard.quick_actions.view_templates', namespace: 'dashboard', category: 'actions', description: 'View templates action' },
    { key: 'dashboard.quick_actions.view_templates_desc', namespace: 'dashboard', category: 'actions', description: 'View templates description' },
    { key: 'dashboard.quick_actions.manage_connectors', namespace: 'dashboard', category: 'actions', description: 'Manage connectors action' },
    { key: 'dashboard.quick_actions.manage_connectors_desc', namespace: 'dashboard', category: 'actions', description: 'Manage connectors description' },
    { key: 'dashboard.quick_actions.view_analytics', namespace: 'dashboard', category: 'actions', description: 'View analytics action' },
    { key: 'dashboard.quick_actions.view_analytics_desc', namespace: 'dashboard', category: 'actions', description: 'View analytics description' },
  ];

  const translationKeys = await Promise.all(
    translationKeysData.map(keyData =>
      prisma.translationKey.upsert({
        where: { key: keyData.key },
        update: {},
        create: keyData,
      })
    )
  )

  // Create initial translations
  const translations = []
  
  // Translation mapping
  const translationMap: Record<string, Record<string, string>> = {
    // Common translations
    'common.welcome': { es: 'Bienvenido', en: 'Welcome', nl: 'Welkom' },
    'common.welcome_user': { es: 'Hola, {{name}}', en: 'Hello, {{name}}', nl: 'Hallo, {{name}}' },
    'common.dashboard': { es: 'Panel', en: 'Dashboard', nl: 'Dashboard' },
    'common.profile': { es: 'Perfil', en: 'Profile', nl: 'Profiel' },
    'common.logout': { es: 'Cerrar Sesión', en: 'Logout', nl: 'Uitloggen' },
    'common.sign_in': { es: 'Iniciar Sesión', en: 'Sign In', nl: 'Inloggen' },
    'common.get_started': { es: 'Comenzar', en: 'Get Started', nl: 'Aan de Slag' },
    'common.loading': { es: 'Cargando...', en: 'Loading...', nl: 'Laden...' },
    'common.error': { es: 'Error', en: 'Error', nl: 'Fout' },
    'common.nav.home': { es: 'Inicio', en: 'Home', nl: 'Home' },
    'common.nav.features': { es: 'Características', en: 'Features', nl: 'Functies' },
    'common.nav.pricing': { es: 'Precios', en: 'Pricing', nl: 'Prijzen' },
    'common.nav.docs': { es: 'Documentación', en: 'Docs', nl: 'Documentatie' },
    
    // Auth translations
    'auth.login.title': { es: 'Iniciar Sesión', en: 'Sign In', nl: 'Inloggen' },
    'auth.register.title': { es: 'Crear Cuenta', en: 'Create Account', nl: 'Account Aanmaken' },
    'auth.email': { es: 'Correo Electrónico', en: 'Email', nl: 'E-mail' },
    'auth.password': { es: 'Contraseña', en: 'Password', nl: 'Wachtwoord' },
    'auth.name': { es: 'Nombre', en: 'Name', nl: 'Naam' },
    'auth.confirm_password': { es: 'Confirmar Contraseña', en: 'Confirm Password', nl: 'Bevestig Wachtwoord' },
    'auth.signin_button': { es: 'Iniciar Sesión', en: 'Sign In', nl: 'Inloggen' },
    'auth.register_button': { es: 'Registrarse', en: 'Register', nl: 'Registreren' },
         'auth.forgot_password': { es: '¿Olvidaste tu contraseña?', en: 'Forgot your password?', nl: 'Wachtwoord vergeten?' },
     'auth.no_account': { es: '¿No tienes cuenta?', en: "Don't have an account?", nl: 'Geen account?' },
     'auth.have_account': { es: '¿Ya tienes cuenta?', en: 'Already have an account?', nl: 'Al een account?' },
     'auth.sign_up': { es: 'Registrarse', en: 'Sign up', nl: 'Registreren' },
     'auth.sign_in': { es: 'Iniciar Sesión', en: 'Sign in', nl: 'Inloggen' },
     'auth.email_placeholder': { es: 'Introduce tu email', en: 'Enter your email', nl: 'Voer je e-mail in' },
     'auth.password_placeholder': { es: 'Introduce tu contraseña', en: 'Enter your password', nl: 'Voer je wachtwoord in' },
     'auth.name_placeholder': { es: 'Introduce tu nombre completo', en: 'Enter your full name', nl: 'Voer je volledige naam in' },
     'auth.organization_name': { es: 'Nombre de Organización (Opcional)', en: 'Organization Name (Optional)', nl: 'Organisatienaam (Optioneel)' },
     'auth.organization_placeholder': { es: 'Introduce el nombre de la organización', en: 'Enter organization name', nl: 'Voer organisatienaam in' },
     'auth.confirm_password_placeholder': { es: 'Confirma tu contraseña', en: 'Confirm your password', nl: 'Bevestig je wachtwoord' },
    
    // Landing page translations
    'landing.hero.title': { 
      es: 'Automatiza tus Flujos de Trabajo con FlowCraft', 
      en: 'Automate Your Workflows with FlowCraft', 
      nl: 'Automatiseer je Workflows met FlowCraft' 
    },
    'landing.hero.subtitle': { 
      es: 'Crea, ejecuta y monitorea flujos de trabajo complejos con nuestra plataforma visual intuitiva.', 
      en: 'Create, execute, and monitor complex workflows with our intuitive visual platform.', 
      nl: 'Creëer, voer uit en monitor complexe workflows met ons intuïtieve visuele platform.' 
    },
         'landing.hero.cta_primary': { es: 'Comenzar Gratis', en: 'Start Building Free', nl: 'Gratis Beginnen' },
     'landing.hero.cta_secondary': { es: 'Ver Demo', en: 'Watch Demo', nl: 'Demo Bekijken' },
     'landing.features.title': { es: '¿Por qué elegir FlowCraft?', en: 'Why Choose FlowCraft?', nl: 'Waarom FlowCraft kiezen?' },
     'landing.features.subtitle': { es: 'Características poderosas diseñadas para hacer la automatización de flujos de trabajo simple y escalable', en: 'Powerful features designed to make workflow automation simple and scalable', nl: 'Krachtige functies ontworpen om workflowautomatisering eenvoudig en schaalbaar te maken' },
     'landing.features.visual_editor.title': { es: 'Editor Visual de Flujos', en: 'Visual Workflow Editor', nl: 'Visuele Workflow Editor' },
     'landing.features.visual_editor.description': { es: 'Interfaz de arrastrar y soltar para crear flujos complejos sin escribir código', en: 'Drag-and-drop interface to create complex workflows without writing code', nl: 'Sleep-en-zet interface om complexe workflows te maken zonder code te schrijven' },
     'landing.features.integrations.title': { es: '200+ Integraciones', en: '200+ Integrations', nl: '200+ Integraties' },
     'landing.features.integrations.description': { es: 'Conecta con tus herramientas favoritas incluyendo Slack, Google Sheets, GitHub y más', en: 'Connect with your favorite tools and services including Slack, Google Sheets, GitHub, and more', nl: 'Verbind met je favoriete tools en services zoals Slack, Google Sheets, GitHub en meer' },
     'landing.features.monitoring.title': { es: 'Monitoreo en Tiempo Real', en: 'Real-time Monitoring', nl: 'Real-time Monitoring' },
     'landing.features.monitoring.description': { es: 'Monitorea la ejecución de flujos, rastrea el rendimiento y obtén análisis detallados', en: 'Monitor workflow execution, track performance, and get detailed analytics', nl: 'Monitor workflow-uitvoering, volg prestaties en krijg gedetailleerde analyses' },
     'landing.features.scalable.title': { es: 'Arquitectura Escalable', en: 'Scalable Architecture', nl: 'Schaalbare Architectuur' },
     'landing.features.scalable.description': { es: 'Construido sobre arquitectura de microservicios que escala con las necesidades de tu negocio', en: 'Built on microservices architecture that scales with your business needs', nl: 'Gebouwd op microservices architectuur die schaalt met je bedrijfsbehoeften' },
     'landing.features.custom_connectors.title': { es: 'Conectores Personalizados', en: 'Custom Connectors', nl: 'Aangepaste Connectoren' },
     'landing.features.custom_connectors.description': { es: 'Construye conectores personalizados para tus necesidades específicas con nuestro SDK', en: 'Build custom connectors for your specific needs with our SDK', nl: 'Bouw aangepaste connectoren voor je specifieke behoeften met onze SDK' },
     'landing.features.security.title': { es: 'Seguridad Empresarial', en: 'Enterprise Security', nl: 'Enterprise Beveiliging' },
     'landing.features.security.description': { es: 'Cumple con SOC 2 con encriptación en tránsito y en reposo, registro de auditoría', en: 'SOC 2 compliant with encryption in transit and at rest, audit logging', nl: 'SOC 2 compliant met encryptie in transit en at rest, audit logging' },
     'landing.cta.title': { es: '¿Listo para Automatizar tus Flujos de Trabajo?', en: 'Ready to Automate Your Workflows?', nl: 'Klaar om je Workflows te Automatiseren?' },
     'landing.cta.subtitle': { es: 'Únete a miles de equipos que ya usan FlowCraft para optimizar sus procesos', en: 'Join thousands of teams already using FlowCraft to streamline their processes', nl: 'Sluit je aan bij duizenden teams die FlowCraft al gebruiken om hun processen te stroomlijnen' },
     'landing.cta.button': { es: 'Inicia tu Prueba Gratuita', en: 'Start Your Free Trial', nl: 'Start je Gratis Proefperiode' },
     'landing.footer.description': { es: 'Plataforma de automatización de flujos de trabajo para equipos modernos', en: 'Workflow automation platform for modern teams', nl: 'Workflow automatiseringsplatform voor moderne teams' },
     'landing.footer.product': { es: 'Producto', en: 'Product', nl: 'Product' },
     'landing.footer.features': { es: 'Características', en: 'Features', nl: 'Functies' },
     'landing.footer.pricing': { es: 'Precios', en: 'Pricing', nl: 'Prijzen' },
     'landing.footer.integrations': { es: 'Integraciones', en: 'Integrations', nl: 'Integraties' },
     'landing.footer.api': { es: 'API', en: 'API', nl: 'API' },
     'landing.footer.resources': { es: 'Recursos', en: 'Resources', nl: 'Bronnen' },
     'landing.footer.documentation': { es: 'Documentación', en: 'Documentation', nl: 'Documentatie' },
     'landing.footer.tutorials': { es: 'Tutoriales', en: 'Tutorials', nl: 'Tutorials' },
     'landing.footer.blog': { es: 'Blog', en: 'Blog', nl: 'Blog' },
     'landing.footer.support': { es: 'Soporte', en: 'Support', nl: 'Ondersteuning' },
     'landing.footer.company': { es: 'Empresa', en: 'Company', nl: 'Bedrijf' },
     'landing.footer.about': { es: 'Acerca de', en: 'About', nl: 'Over' },
     'landing.footer.careers': { es: 'Carreras', en: 'Careers', nl: 'Carrières' },
     'landing.footer.contact': { es: 'Contacto', en: 'Contact', nl: 'Contact' },
     'landing.footer.privacy': { es: 'Privacidad', en: 'Privacy', nl: 'Privacy' },
     'landing.footer.copyright': { es: '© 2025 FlowCraft. Todos los derechos reservados.', en: '© 2025 FlowCraft. All rights reserved.', nl: '© 2025 FlowCraft. Alle rechten voorbehouden.' },
    
         // Dashboard translations
     'dashboard.title': { es: 'Panel de Control', en: 'Dashboard', nl: 'Dashboard' },
     'dashboard.welcome': { es: 'Bienvenido a tu panel de control', en: 'Welcome to your dashboard', nl: 'Welkom bij je dashboard' },
     'dashboard.stats.workflows': { es: 'Flujos de Trabajo', en: 'Workflows', nl: 'Workflows' },
     'dashboard.stats.executions': { es: 'Ejecuciones', en: 'Executions', nl: 'Uitvoeringen' },
     'dashboard.stats.connectors': { es: 'Conectores', en: 'Connectors', nl: 'Connectoren' },
     'dashboard.quick_actions.title': { es: 'Acciones Rápidas', en: 'Quick Actions', nl: 'Snelle Acties' },
     'dashboard.quick_actions.create_workflow': { es: 'Crear Flujo de Trabajo', en: 'Create Workflow', nl: 'Workflow Maken' },
     'dashboard.quick_actions.create_workflow_desc': { es: 'Construye una nueva automatización', en: 'Build a new automation', nl: 'Bouw een nieuwe automatisering' },
     'dashboard.quick_actions.view_templates': { es: 'Ver Plantillas', en: 'View Templates', nl: 'Sjablonen Bekijken' },
     'dashboard.quick_actions.view_templates_desc': { es: 'Comienza desde una plantilla', en: 'Start from a template', nl: 'Begin met een sjabloon' },
     'dashboard.quick_actions.manage_connectors': { es: 'Gestionar Conectores', en: 'Manage Connectors', nl: 'Connectoren Beheren' },
     'dashboard.quick_actions.manage_connectors_desc': { es: 'Configura integraciones', en: 'Configure integrations', nl: 'Integraties configureren' },
     'dashboard.quick_actions.view_analytics': { es: 'Ver Análisis', en: 'View Analytics', nl: 'Analytics Bekijken' },
     'dashboard.quick_actions.view_analytics_desc': { es: 'Monitorea el rendimiento', en: 'Monitor performance', nl: 'Prestaties monitoren' },
  };
  
  for (const lang of languages) {
    for (const key of translationKeys) {
      const value = translationMap[key.key]?.[lang.code] || key.key;

      const translation = await prisma.translation.upsert({
        where: {
          languageId_keyId: {
            languageId: lang.id,
            keyId: key.id,
          },
        },
        update: {},
        create: {
          languageId: lang.id,
          keyId: key.id,
          value,
          isApproved: true,
          approvedBy: user.id,
          approvedAt: new Date(),
        },
      })
      translations.push(translation)
    }
  }

  // Create workflow templates
  const workflowTemplates = await Promise.all([
    prisma.workflowTemplate.upsert({
      where: { id: 'template-email-notification' },
      update: {},
      create: {
        id: 'template-email-notification',
        name: 'Email Notification Workflow',
        description: 'Send email notifications based on triggers',
        category: 'communication',
        isPublic: true,
        createdBy: user.id,
        organizationId: organization.id,
        definition: {
          nodes: [
            {
              id: 'start',
              type: 'trigger',
              position: { x: 100, y: 100 },
              data: { label: 'Start' }
            },
            {
              id: 'email',
              type: 'action',
              position: { x: 300, y: 100 },
              data: { 
                label: 'Send Email',
                connector: 'email',
                config: {
                  to: '{{trigger.email}}',
                  subject: 'Notification',
                  body: '{{trigger.message}}'
                }
              }
            },
            {
              id: 'end',
              type: 'end',
              position: { x: 500, y: 100 },
              data: { label: 'End' }
            }
          ],
          edges: [
            { id: 'e1', source: 'start', target: 'email' },
            { id: 'e2', source: 'email', target: 'end' }
          ]
        }
      }
    }),
    prisma.workflowTemplate.upsert({
      where: { id: 'template-data-sync' },
      update: {},
      create: {
        id: 'template-data-sync',
        name: 'Data Synchronization',
        description: 'Sync data between different systems',
        category: 'data',
        isPublic: true,
        createdBy: user.id,
        organizationId: organization.id,
        definition: {
          nodes: [
            {
              id: 'start',
              type: 'trigger',
              position: { x: 100, y: 100 },
              data: { label: 'Data Change' }
            },
            {
              id: 'fetch',
              type: 'action',
              position: { x: 300, y: 100 },
              data: { 
                label: 'Fetch Data',
                connector: 'http',
                config: {
                  method: 'GET',
                  url: '{{trigger.source_url}}'
                }
              }
            },
            {
              id: 'transform',
              type: 'action',
              position: { x: 500, y: 100 },
              data: { 
                label: 'Transform Data',
                connector: 'data-transform',
                config: {
                  mapping: '{{fetch.data}}'
                }
              }
            },
            {
              id: 'save',
              type: 'action',
              position: { x: 700, y: 100 },
              data: { 
                label: 'Save Data',
                connector: 'http',
                config: {
                  method: 'POST',
                  url: '{{trigger.target_url}}',
                  body: '{{transform.result}}'
                }
              }
            },
            {
              id: 'end',
              type: 'end',
              position: { x: 900, y: 100 },
              data: { label: 'End' }
            }
          ],
          edges: [
            { id: 'e1', source: 'start', target: 'fetch' },
            { id: 'e2', source: 'fetch', target: 'transform' },
            { id: 'e3', source: 'transform', target: 'save' },
            { id: 'e4', source: 'save', target: 'end' }
          ]
        }
      }
    }),
    prisma.workflowTemplate.upsert({
      where: { id: 'template-slack-notification' },
      update: {},
      create: {
        id: 'template-slack-notification',
        name: 'Slack Notification',
        description: 'Send notifications to Slack channels',
        category: 'communication',
        isPublic: true,
        createdBy: user.id,
        organizationId: organization.id,
        definition: {
          nodes: [
            {
              id: 'start',
              type: 'trigger',
              position: { x: 100, y: 100 },
              data: { label: 'Event Trigger' }
            },
            {
              id: 'condition',
              type: 'condition',
              position: { x: 300, y: 100 },
              data: { 
                label: 'Check Priority',
                condition: '{{trigger.priority}} === "high"'
              }
            },
            {
              id: 'slack',
              type: 'action',
              position: { x: 500, y: 100 },
              data: { 
                label: 'Send to Slack',
                connector: 'slack',
                config: {
                  channel: '{{trigger.channel}}',
                  message: '🚨 {{trigger.message}}'
                }
              }
            },
            {
              id: 'end',
              type: 'end',
              position: { x: 700, y: 100 },
              data: { label: 'End' }
            }
          ],
          edges: [
            { id: 'e1', source: 'start', target: 'condition' },
            { id: 'e2', source: 'condition', target: 'slack' },
            { id: 'e3', source: 'slack', target: 'end' }
          ]
        }
      }
    })
  ])

  console.log('✅ Database seeded successfully!')
  console.log(`📊 Created:`)
  console.log(`  - Organization: ${organization.name}`)
  console.log(`  - User: ${user.name} (${user.email})`)
  console.log(`  - Connectors: ${connectors.length}`)
  console.log(`  - Languages: ${languages.length}`)
  console.log(`  - Translation Keys: ${translationKeys.length}`)
  console.log(`  - Translations: ${translations.length}`)
  console.log(`  - Workflow Templates: ${workflowTemplates.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 