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
    ] = await Promise.all([
      prisma.client.count({ where: { userId } }),
      prisma.project.count({ where: { client: { userId } } }),
      prisma.codebase.count({ where: { project: { client: { userId } } } }),
      prisma.link.count({ where: { userId } }),
    ]);

    return jsonSuccess({
      totalClients,
      totalProjects,
      totalCodebases,
      totalLinks,
    });
  } catch {
    return jsonError("Unable to fetch stats right now.", 500);
  }
});
