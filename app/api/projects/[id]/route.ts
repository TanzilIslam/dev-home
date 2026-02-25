import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { withAuth, parseBody, parseRouteId } from "@/lib/api/route-helpers";
import { PROJECT_SELECT } from "@/lib/api/prisma-selects";
import { PROJECT_MSG } from "@/lib/api/messages";
import { requireClient } from "@/lib/api/ownership";
import { mapProjectItem } from "@/lib/domain/mappers";
import { projectPayloadSchema } from "@/lib/validation/dashboard";

export const GET = withAuth(async (userId, _, context) => {
  const id = await parseRouteId(context!);
  if (!id) {
    return jsonError(PROJECT_MSG.invalidId, 400);
  }

  try {
    const project = await prisma.project.findFirst({
      where: { id, client: { userId } },
      select: PROJECT_SELECT,
    });

    if (!project) {
      return jsonError(PROJECT_MSG.notFound, 404);
    }

    return jsonSuccess(mapProjectItem(project));
  } catch {
    return jsonError(PROJECT_MSG.fetchError, 500);
  }
});

export const PUT = withAuth(async (userId, request, context) => {
  const id = await parseRouteId(context!);
  if (!id) {
    return jsonError(PROJECT_MSG.invalidId, 400);
  }

  const result = await parseBody(request, projectPayloadSchema);
  if (!result.success) return result.response;

  try {
    const error = await requireClient(userId, result.data.clientId);
    if (error) return error;

    const updateResult = await prisma.project.updateMany({
      where: { id, client: { userId } },
      data: {
        clientId: result.data.clientId,
        name: result.data.name,
        description: result.data.description,
        status: result.data.status,
      },
    });

    if (updateResult.count === 0) {
      return jsonError(PROJECT_MSG.notFound, 404);
    }

    const project = await prisma.project.findFirst({
      where: { id, client: { userId } },
      select: PROJECT_SELECT,
    });

    if (!project) {
      return jsonError(PROJECT_MSG.notFound, 404);
    }

    return jsonSuccess(mapProjectItem(project), {
      message: PROJECT_MSG.updated,
    });
  } catch {
    return jsonError(PROJECT_MSG.updateError, 500);
  }
});

export const DELETE = withAuth(async (userId, _, context) => {
  const id = await parseRouteId(context!);
  if (!id) {
    return jsonError(PROJECT_MSG.invalidId, 400);
  }

  try {
    const result = await prisma.project.deleteMany({
      where: { id, client: { userId } },
    });

    if (result.count === 0) {
      return jsonError(PROJECT_MSG.notFound, 404);
    }

    return jsonSuccess(null, {
      message: PROJECT_MSG.deleted,
    });
  } catch {
    return jsonError(PROJECT_MSG.deleteError, 500);
  }
});
