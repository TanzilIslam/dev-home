import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { withAuth, parseBody, parseRouteId } from "@/lib/api/route-helpers";
import { CODEBASE_SELECT } from "@/lib/api/prisma-selects";
import { CODEBASE_MSG } from "@/lib/api/messages";
import { requireProject } from "@/lib/api/ownership";
import { mapCodebaseItem } from "@/lib/domain/mappers";
import { codebasePayloadSchema } from "@/lib/validation/dashboard";

export const GET = withAuth(async (userId, _, context) => {
  const id = await parseRouteId(context!);
  if (!id) {
    return jsonError(CODEBASE_MSG.invalidId, 400);
  }

  try {
    const codebase = await prisma.codebase.findFirst({
      where: { id, project: { client: { userId } } },
      select: CODEBASE_SELECT,
    });

    if (!codebase) {
      return jsonError(CODEBASE_MSG.notFound, 404);
    }

    return jsonSuccess(mapCodebaseItem(codebase));
  } catch {
    return jsonError(CODEBASE_MSG.fetchError, 500);
  }
});

export const PUT = withAuth(async (userId, request, context) => {
  const id = await parseRouteId(context!);
  if (!id) {
    return jsonError(CODEBASE_MSG.invalidId, 400);
  }

  const result = await parseBody(request, codebasePayloadSchema);
  if (!result.success) return result.response;

  try {
    const existingCodebase = await prisma.codebase.findFirst({
      where: { id, project: { client: { userId } } },
      select: { id: true, projectId: true },
    });

    if (!existingCodebase) {
      return jsonError(CODEBASE_MSG.notFound, 404);
    }

    const error = await requireProject(userId, result.data.projectId);
    if (error) return error;

    const codebase = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.codebase.updateMany({
        where: { id, project: { client: { userId } } },
        data: {
          projectId: result.data.projectId,
          name: result.data.name,
          type: result.data.type,
          description: result.data.description,
        },
      });

      if (updateResult.count === 0) {
        return null;
      }

      if (existingCodebase.projectId !== result.data.projectId) {
        await tx.link.updateMany({
          where: { userId, codebaseId: id },
          data: { projectId: result.data.projectId },
        });
      }

      return tx.codebase.findFirst({
        where: { id, project: { client: { userId } } },
        select: CODEBASE_SELECT,
      });
    });

    if (!codebase) {
      return jsonError(CODEBASE_MSG.notFound, 404);
    }

    return jsonSuccess(mapCodebaseItem(codebase), {
      message: CODEBASE_MSG.updated,
    });
  } catch {
    return jsonError(CODEBASE_MSG.updateError, 500);
  }
});

export const DELETE = withAuth(async (userId, _, context) => {
  const id = await parseRouteId(context!);
  if (!id) {
    return jsonError(CODEBASE_MSG.invalidId, 400);
  }

  try {
    const result = await prisma.codebase.deleteMany({
      where: { id, project: { client: { userId } } },
    });

    if (result.count === 0) {
      return jsonError(CODEBASE_MSG.notFound, 404);
    }

    return jsonSuccess(null, {
      message: CODEBASE_MSG.deleted,
    });
  } catch {
    return jsonError(CODEBASE_MSG.deleteError, 500);
  }
});
