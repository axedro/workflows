import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
  const user = await prisma.user.upsert({
    where: { email: 'test@flowcraft.io' },
    update: {},
    create: {
      email: 'test@flowcraft.io',
      name: 'Test User',
      passwordHash: 'hashed-password',
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
    
    // Landing page translations
    { key: 'landing.hero.title', namespace: 'landing', category: 'hero', description: 'Main hero title' },
    { key: 'landing.hero.subtitle', namespace: 'landing', category: 'hero', description: 'Hero subtitle' },
    { key: 'landing.hero.cta_primary', namespace: 'landing', category: 'hero', description: 'Primary CTA button' },
    { key: 'landing.hero.cta_secondary', namespace: 'landing', category: 'hero', description: 'Secondary CTA button' },
    { key: 'landing.features.title', namespace: 'landing', category: 'features', description: 'Features section title' },
    { key: 'landing.features.visual_editor', namespace: 'landing', category: 'features', description: 'Visual editor feature' },
    { key: 'landing.features.integrations', namespace: 'landing', category: 'features', description: 'Integrations feature' },
    { key: 'landing.features.automation', namespace: 'landing', category: 'features', description: 'Automation feature' },
    { key: 'landing.features.monitoring', namespace: 'landing', category: 'features', description: 'Monitoring feature' },
    { key: 'landing.features.collaboration', namespace: 'landing', category: 'features', description: 'Collaboration feature' },
    { key: 'landing.features.scalability', namespace: 'landing', category: 'features', description: 'Scalability feature' },
    
    // Dashboard translations
    { key: 'dashboard.title', namespace: 'dashboard', category: 'titles', description: 'Dashboard page title' },
    { key: 'dashboard.welcome', namespace: 'dashboard', category: 'messages', description: 'Dashboard welcome message' },
    { key: 'dashboard.workflows', namespace: 'dashboard', category: 'sections', description: 'Workflows section' },
    { key: 'dashboard.recent_executions', namespace: 'dashboard', category: 'sections', description: 'Recent executions section' },
    { key: 'dashboard.create_workflow', namespace: 'dashboard', category: 'actions', description: 'Create workflow button' },
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
    'landing.features.visual_editor': { es: 'Editor Visual', en: 'Visual Editor', nl: 'Visuele Editor' },
    'landing.features.integrations': { es: '200+ Integraciones', en: '200+ Integrations', nl: '200+ Integraties' },
    'landing.features.automation': { es: 'Automatización Inteligente', en: 'Smart Automation', nl: 'Slimme Automatisering' },
    'landing.features.monitoring': { es: 'Monitoreo en Tiempo Real', en: 'Real-time Monitoring', nl: 'Real-time Monitoring' },
    'landing.features.collaboration': { es: 'Colaboración en Equipo', en: 'Team Collaboration', nl: 'Team Samenwerking' },
    'landing.features.scalability': { es: 'Escalabilidad Empresarial', en: 'Enterprise Scalability', nl: 'Enterprise Schaalbaarheid' },
    
    // Dashboard translations
    'dashboard.title': { es: 'Panel de Control', en: 'Dashboard', nl: 'Dashboard' },
    'dashboard.welcome': { es: 'Bienvenido a tu panel de control', en: 'Welcome to your dashboard', nl: 'Welkom bij je dashboard' },
    'dashboard.workflows': { es: 'Flujos de Trabajo', en: 'Workflows', nl: 'Workflows' },
    'dashboard.recent_executions': { es: 'Ejecuciones Recientes', en: 'Recent Executions', nl: 'Recente Uitvoeringen' },
    'dashboard.create_workflow': { es: 'Crear Flujo de Trabajo', en: 'Create Workflow', nl: 'Workflow Maken' },
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

  console.log('✅ Database seeded successfully!')
  console.log(`📊 Created:`)
  console.log(`  - Organization: ${organization.name}`)
  console.log(`  - User: ${user.name} (${user.email})`)
  console.log(`  - Connectors: ${connectors.length}`)
  console.log(`  - Languages: ${languages.length}`)
  console.log(`  - Translation Keys: ${translationKeys.length}`)
  console.log(`  - Translations: ${translations.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 