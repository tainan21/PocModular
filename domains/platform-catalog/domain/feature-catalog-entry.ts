export interface FeatureCatalogEntryProps {
  moduleId: string
  featureKey: string
  label: string
  description: string | null
  defaultValue: boolean
  enabled: boolean
  priceCents: number | null
  visibleInOnboarding: boolean
  visibleInDashboard: boolean
}
