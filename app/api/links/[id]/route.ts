import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { withAuth, parseBody, parseRouteId } from "@/lib/api/route-helpers";
import { LINK_SELECT } from "@/lib/api/prisma-selects";
import { LINK_MSG } from "@/lib/api/messages";
import {
  requireClient,
  requireProject,
  requireCodebaseForProject,
} from "@/lib/api/ownership";
import { mapLinkItem } from "@/lib/domain/mappers";
import { linkPayloadSchema } from "@/lib/validation/dashboard";

export const GET = withAuth(async (userId, _, context) => {
  const id = await parseRouteId(context!);
  if (!id) {
    return jsonError(LINK_MSG.invalidId, 400);
  }

  try {
    const link = await prisma.link.findFirst({
      where: { id, userId },
      select: LINK_SELECT,
    });

    if (!link) {
      return jsonError(LINK_MSG.notFound, 404);
    }

    return jsonSuccess(mapLinkItem(link));
  } catch {
    return jsonError(LINK_MSG.fetchError, 500);
  }
});

export const PUT = withAuth(async (userId, request, context) => {
  const id = await parseRouteId(context!);
  if (!id) {
    return jsonError(LINK_MSG.invalidId, 400);
  }

  const result = await parseBody(request, linkPayloadSchema);
  if (!result.success) return result.response;

  try {
    if (result.data.clientId) {
      const clientError = await requireClient(userId, result.data.clientId);
      if (clientError) return clientError;
    }

    if (result.data.projectId) {
      const projectError = await requireProject(userId, result.data.projectId);
      if (projectError) return projectError;

      if (result.data.codebaseId) {
        const codebaseError = await requireCodebaseForProject(
          userId,
          result.data.codebaseId,
          result.data.projectId,
        );
        if (codebaseError) return codebaseError;
      }
    }

    const updateResult = await prisma.link.updateMany({
      where: { id, userId },
      data: {
        clientId: result.data.clientId,
        projectId: result.data.projectId,
        codebaseId: result.data.codebaseId,
        title: result.data.title,
        url: result.data.url,
      },
    });

    if (updateResult.count === 0) {
      return jsonError(LINK_MSG.notFound, 404);
    }

    const link = await prisma.link.findFirst({
      where: { id, userId },
      select: LINK_SELECT,
    });

    if (!link) {
      return jsonError(LINK_MSG.notFound, 404);
    }

    return jsonSuccess(mapLinkItem(link), {
      message: LINK_MSG.updated,
    });
  } catch {
    return jsonError(LINK_MSG.updateError, 500);
  }
});

export const DELETE = withAuth(async (userId, _, context) => {
  const id = await parseRouteId(context!);
  if (!id) {
    return jsonError(LINK_MSG.invalidId, 400);
  }

  try {
    const result = await prisma.link.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      return jsonError(LINK_MSG.notFound, 404);
    }

    return jsonSuccess(null, {
      message: LINK_MSG.deleted,
    });
  } catch {
    return jsonError(LINK_MSG.deleteError, 500);
  }
});
