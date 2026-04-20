/**
 * Capability — capacidade simbólica que um módulo reivindica.
 *
 * Nesta POC, capabilities são apenas strings declarativas.
 * No futuro, viram base para um sistema real de permissões/escopos.
 *
 * Ex: "notes:read", "notes:write", "tasks:read", "system:config".
 */
export type Capability = string

export interface CapabilityDescriptor {
  capability: Capability
  /** Módulo que declarou a capacidade. */
  ownerModuleId: string
  description?: string
}
