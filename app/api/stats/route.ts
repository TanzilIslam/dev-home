import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/api/auth";
import { jsonSuccess, jsonError } from "@/lib/api/response";

export async function GET() {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
  }

  try {
    const [
      totalClients,
      totalProjects,
      totalCodebases,
      totalLinks,
      projectsByStatus,
      codebasesByType,
      linksByCategory,
      recentLinks,
    ] = await Promise.all([
      prisma.client.count({ where: { userId } }),
      prisma.project.count({ where: { client: { userId } } }),
      prisma.codebase.count({ where: { project: { client: { userId } } } }),
      prisma.link.count({ where: { userId } }),
      prisma.project.groupBy({
        by: ["status"],
        _count: true,
        where: { client: { userId } },
      }),
      prisma.codebase.groupBy({
        by: ["type"],
        _count: true,
        where: { project: { client: { userId } } },
      }),
      prisma.link.groupBy({
        by: ["category"],
        _count: true,
        where: { userId },
      }),
      prisma.link.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          url: true,
          category: true,
          updatedAt: true,
          project: { select: { name: true } },
          codebase: { select: { name: true } },
        },
      }),
    ]);

    return jsonSuccess({
      totalClients,
      totalProjects,
      totalCodebases,
      totalLinks,
      projectsByStatus: projectsByStatus.map((g) => ({
        name: g.status,
        count: g._count,
      })),
      codebasesByType: codebasesByType.map((g) => ({
        name: g.type,
        count: g._count,
      })),
      linksByCategory: linksByCategory.map((g) => ({
        name: g.category,
        count: g._count,
      })),
      recentLinks: recentLinks.map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        projectName: l.project.name,
        codebaseName: l.codebase?.name ?? null,
        category: l.category,
        updatedAt: l.updatedAt.toISOString(),
      })),
    });
  } catch {
    return jsonError("Unable to fetch stats right now.", 500);
  }
}
