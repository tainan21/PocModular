/**
 * Zod schemas para validação wire dos inputs da Platform API.
 *
 * IMPORTANTE:
 *  - Os DTOs em `./index.ts` continuam sendo a fonte de verdade dos TIPOS.
 *  - Este arquivo é opt-in: quem quiser validar (route handlers, CLI, tests)
 *    importa daqui. Consumidores que já confiam no server não pagam custo.
 *  - Os schemas usam `.strict()` para pegar campos extras no wire cedo.
 *
 * Os schemas são inferíveis, então os tipos derivados aqui são garantidamente
 * compatíveis com os DTOs — isso é testado em compile-time pelos `satisfies`
 * no final do arquivo.
 */

import { z } from "zod"
import type {
  AdminSaveCatalogRequest,
  AdminSetFlagRequest,
  CatalogQuery,
  FeaturesQuery,
  ModulesQuery,
  OnboardingIntentRequest,
  OnboardingSelectionRequest,
  RuntimeQuery,
} from "./index"

// ---------------------------------------------------------------------------
// Primitives

export const pricingModelSchema = z.enum(["free", "paid", "internal", "experimental"])
export const moduleAreaSchema = z.enum(["main", "settings", "system"])
export const moduleStatusSchema = z.enum(["active", "experimental", "hidden", "disabled"])
export const effectiveStateSchema = z.enum([
  "available",
  "disabled",
  "user-opt-out",
  "blocked-by-dependency",
  "blocked-by-context",
])

const pageBase = {
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(200).optional(),
  q: z.string().trim().min(1).max(200).optional(),
}

// ---------------------------------------------------------------------------
// Queries (GET /api/platform/* com query params)

export const modulesQuerySchema = z
  .object({
    ...pageBase,
    area: moduleAreaSchema.optional(),
    status: moduleStatusSchema.optional(),
  })
  .strict()

/**
 * Query params chegam como string. Aceitamos "true"/"false" e entregamos
 * `boolean | undefined`, casando com o DTO. Chamadas local-client passam
 * argumentos já tipados, então o schema é aplicado só na borda HTTP.
 */
const booleanQueryParam = z
  .enum(["true", "false"])
  .optional()
  .transform((v): boolean | undefined =>
    v === "true" ? true : v === "false" ? false : undefined,
  )

export const featuresQuerySchema = z
  .object({
    ...pageBase,
    moduleId: z.string().min(1).optional(),
    administrableOnly: booleanQueryParam,
  })
  .strict()

export const catalogQuerySchema = z
  .object({
    ...pageBase,
    pricingModel: pricingModelSchema.optional(),
    visibleInOnboarding: booleanQueryParam,
  })
  .strict()

export const runtimeQuerySchema = z
  .object({
    ...pageBase,
    effectiveState: effectiveStateSchema.optional(),
  })
  .strict()

// ---------------------------------------------------------------------------
// Request bodies (POST)

export const onboardingIntentRequestSchema = z
  .object({ intent: z.string().trim().min(1).max(80) })
  .strict()

export const onboardingSelectionRequestSchema = z
  .object({ moduleIds: z.array(z.string().min(1)).max(200) })
  .strict()

export const adminSaveCatalogRequestSchema = z
  .object({
    moduleId: z.string().min(1),
    pricingModel: pricingModelSchema,
    priceCents: z.number().int().nonnegative().nullable(),
    globallyEnabled: z.boolean(),
    visibleInOnboarding: z.boolean(),
    visibleInDashboard: z.boolean(),
    featureFlagged: z.boolean(),
    displayOrder: z.number().int(),
  })
  .strict()

export const adminSetFlagRequestSchema = z
  .object({
    moduleId: z.string().min(1),
    flagKey: z.string().min(1),
    value: z.boolean(),
  })
  .strict()

// ---------------------------------------------------------------------------
// Compile-time guardrail: o tipo inferido pelos schemas CASA com os DTOs
// exportados em ./index. Se alguém mudar um DTO sem atualizar o schema,
// o tsc quebra aqui.

type _Checks = [
  z.infer<typeof modulesQuerySchema> extends ModulesQuery ? 1 : never,
  z.infer<typeof featuresQuerySchema> extends FeaturesQuery ? 1 : never,
  z.infer<typeof catalogQuerySchema> extends CatalogQuery ? 1 : never,
  z.infer<typeof runtimeQuerySchema> extends RuntimeQuery ? 1 : never,
  z.infer<typeof onboardingIntentRequestSchema> extends OnboardingIntentRequest ? 1 : never,
  z.infer<typeof onboardingSelectionRequestSchema> extends OnboardingSelectionRequest ? 1 : never,
  z.infer<typeof adminSaveCatalogRequestSchema> extends AdminSaveCatalogRequest ? 1 : never,
  z.infer<typeof adminSetFlagRequestSchema> extends AdminSetFlagRequest ? 1 : never,
]
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _assert: _Checks = [1, 1, 1, 1, 1, 1, 1, 1]
