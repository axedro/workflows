import { prisma } from './client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const seedPath = path.resolve(__dirname, '..', 'translations.seed.json')
  if (!fs.existsSync(seedPath)) {
    console.error('translations.seed.json not found at', seedPath)
    process.exit(1)
  }
  const raw = fs.readFileSync(seedPath, 'utf8')
  const data = JSON.parse(raw) as {
    namespaces: Record<string, Record<string, Record<string,string>>>
  }

  // Ensure languages exist (es, en, nl)
  const langs = await prisma.language.findMany({ where: { code: { in: ['es','en','nl'] } } })
  const missing = ['es','en','nl'].filter(c => !langs.find(l => l.code === c))
  for (const code of missing) {
    await prisma.language.create({ data: { code, name: code.toUpperCase(), nativeName: code.toUpperCase(), isActive: true, isDefault: code==='es' } })
  }
  const languages = await prisma.language.findMany({ where: { code: { in: ['es','en','nl'] } } })

  let keyCount = 0
  let txCount = 0

  for (const [namespace, byLang] of Object.entries(data.namespaces)) {
    // Compute full key set from 'en' if available else first lang
    const baseLangMap = byLang['en'] || Object.values(byLang)[0] || {}
    const allKeys = new Set<string>(Object.keys(baseLangMap))
    for (const map of Object.values(byLang)) Object.keys(map).forEach(k => allKeys.add(k))

    for (const key of allKeys) {
      keyCount++
      const tKey = await prisma.translationKey.upsert({
        where: { key },
        update: { namespace, isActive: true },
        create: { key, namespace, isActive: true, category: 'auto-generated' }
      })

      for (const lang of languages) {
        const value = (byLang[lang.code] && byLang[lang.code][key]) || key
        await prisma.translation.upsert({
          where: { languageId_keyId: { languageId: lang.id, keyId: tKey.id } },
          update: { value, isApproved: true, approvedAt: new Date() },
          create: { languageId: lang.id, keyId: tKey.id, value, isApproved: true, approvedAt: new Date() }
        })
        txCount++
      }
    }
  }

  console.log(`Seeded ${keyCount} keys and ${txCount} translations.`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
