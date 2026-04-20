/**
 * I/O das escolhas do usuário sobre módulos.
 */
import { prisma } from "@server/db/prisma"
import type { UserSelection } from "@domains/platform-catalog"

export async function loadSelectionMap(
  userId: string,
): Promise<Record<string, UserSelection>> {
  const rows = await prisma.userModuleSelection.findMany({ where: { userId } })
  const map: Record<string, UserSelection> = {}
  for (const row of rows) {
    map[row.moduleId] = {
      moduleId: row.moduleId,
      selected: row.selected,
      pinned: row.pinned,
    }
  }
  return map
}

export async function setUserSelection(
  userId: string,
  moduleId: string,
  patch: { selected?: boolean; pinned?: boolean; chosenInOnboarding?: boolean },
): Promise<void> {
  await prisma.userModuleSelection.upsert({
    where: { userId_moduleId: { userId, moduleId } },
    create: {
      userId,
      moduleId,
      selected: patch.selected ?? false,
      pinned: patch.pinned ?? false,
      chosenInOnboarding: patch.chosenInOnboarding ?? false,
    },
    update: {
      ...(patch.selected !== undefined ? { selected: patch.selected } : {}),
      ...(patch.pinned !== undefined ? { pinned: patch.pinned } : {}),
      ...(patch.chosenInOnboarding !== undefined
        ? { chosenInOnboarding: patch.chosenInOnboarding }
        : {}),
    },
  })
}

export async function bulkSetSelection(
  userId: string,
  selectedModuleIds: string[],
  availableModuleIds: string[],
): Promise<void> {
  const wanted = new Set(selectedModuleIds)
  for (const moduleId of availableModuleIds) {
    await setUserSelection(userId, moduleId, {
      selected: wanted.has(moduleId),
      chosenInOnboarding: true,
    })
  }
}
