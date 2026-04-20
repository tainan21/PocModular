/**
 * Seed da POC v3.
 *
 * Popula:
 *   1) CatalogItem — itens do módulo catalog (legado v1).
 *   2) DemoUser — usuário único da POC.
 *   3) ModuleCatalogEntry — catálogo administrável dos módulos conhecidos
 *      do código. Aqui o "admin simulado" declara pricing, visibilidade etc.
 *      Esse catálogo pode crescer/encolher independentemente do código.
 *
 * Observação: o seed NÃO mexe em UserOnboardingState / UserModuleSelection /
 * UserDashboardItem. Essas são criadas pelo usuário durante o onboarding.
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const CATALOG_ITEMS = [
  { sku: "BK-001", name: "Clean Architecture", description: "Robert C. Martin — princípios para software duradouro.", category: "Livros", priceCents: 12900 },
  { sku: "BK-002", name: "Domain-Driven Design", description: "Eric Evans — o clássico do DDD.", category: "Livros", priceCents: 18900 },
  { sku: "BK-003", name: "Implementing DDD", description: "Vaughn Vernon — DDD aplicado na prática.", category: "Livros", priceCents: 16900 },
  { sku: "TL-001", name: "Teclado Mecânico 65%", description: "Layout compacto com switches lineares.", category: "Periféricos", priceCents: 59900 },
  { sku: "TL-002", name: "Mouse Ergonômico", description: "Design ergonômico para longas sessões de código.", category: "Periféricos", priceCents: 24900 },
]

const MODULE_CATALOG = [
  { moduleId: "workspace-home", pricingModel: "internal", globallyEnabled: true, visibleInOnboarding: false, visibleInDashboard: false, displayOrder: 0 },
  { moduleId: "notes", pricingModel: "free", globallyEnabled: true, visibleInOnboarding: true, visibleInDashboard: true, displayOrder: 10 },
  { moduleId: "tasks", pricingModel: "free", globallyEnabled: true, visibleInOnboarding: true, visibleInDashboard: true, displayOrder: 20 },
  { moduleId: "catalog", pricingModel: "paid", priceCents: 1990, globallyEnabled: true, visibleInOnboarding: true, visibleInDashboard: true, displayOrder: 30 },
  { moduleId: "settings-demo", pricingModel: "internal", globallyEnabled: true, visibleInOnboarding: false, visibleInDashboard: false, displayOrder: 90 },
  { moduleId: "control-center", pricingModel: "internal", globallyEnabled: true, visibleInOnboarding: false, visibleInDashboard: false, displayOrder: 100 },
]

async function main() {
  console.log("[seed] limpando catálogo de items...")
  await prisma.catalogItem.deleteMany()

  console.log("[seed] criando items do módulo catalog...")
  for (const item of CATALOG_ITEMS) {
    await prisma.catalogItem.create({ data: item })
  }

  console.log("[seed] garantindo DemoUser...")
  await prisma.demoUser.upsert({
    where: { email: "demo@poc.dev" },
    update: {},
    create: { name: "Demo User", email: "demo@poc.dev" },
  })

  console.log("[seed] populando ModuleCatalogEntry...")
  for (const entry of MODULE_CATALOG) {
    await prisma.moduleCatalogEntry.upsert({
      where: { moduleId: entry.moduleId },
      create: entry,
      update: entry,
    })
  }

  console.log("[seed] pronto.")
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
