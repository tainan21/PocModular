/**
 * I/O da composição do dashboard do usuário.
 */
import { prisma } from "@server/db/prisma"
import type { UserDashboardItemInput } from "@domains/dashboard/application/dashboard-composition"

export async function loadUserDashboardItems(
  userId: string,
): Promise<UserDashboardItemInput[]> {
  const rows = await prisma.userDashboardItem.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  })
  return rows.map((r) => ({
    moduleId: r.moduleId,
    contributionKind: r.contributionKind as UserDashboardItemInput["contributionKind"],
    contributionKey: r.contributionKey,
    order: r.order,
    visible: r.visible,
  }))
}

export async function setDashboardItem(
  userId: string,
  moduleId: string,
  contributionKind: string,
  contributionKey: string,
  patch: { order?: number; visible?: boolean },
): Promise<void> {
  await prisma.userDashboardItem.upsert({
    where: {
      userId_moduleId_contributionKind_contributionKey: {
        userId,
        moduleId,
        contributionKind,
        contributionKey,
      },
    },
    create: {
      userId,
      moduleId,
      contributionKind,
      contributionKey,
      order: patch.order ?? 0,
      visible: patch.visible ?? true,
    },
    update: {
      ...(patch.order !== undefined ? { order: patch.order } : {}),
      ...(patch.visible !== undefined ? { visible: patch.visible } : {}),
    },
  })
}

export async function clearDashboardForModules(
  userId: string,
  moduleIds: string[],
): Promise<void> {
  if (moduleIds.length === 0) return
  await prisma.userDashboardItem.deleteMany({
    where: { userId, moduleId: { in: moduleIds } },
  })
}
