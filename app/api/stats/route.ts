import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { withAuth } from "@/lib/api/route-helpers";

export const GET = withAuth(async (userId) => {
  try {
    const [
      totalClients,
      totalProjects,
      totalCodebases,
      totalLinks,
      projectsByStatus,
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
      prisma.link.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          url: true,
          updatedAt: true,
          client: { select: { name: true } },
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
      recentLinks: recentLinks.map((l) => ({
        id: l.id,
        title: l.title,
        url: l.url,
        clientName: l.client?.name ?? null,
        projectName: l.project?.name ?? null,
        codebaseName: l.codebase?.name ?? null,
        updatedAt: l.updatedAt.toISOString(),
      })),
    });
  } catch {
    return jsonError("Unable to fetch stats right now.", 500);
  }
});
