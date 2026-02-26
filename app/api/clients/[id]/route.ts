import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { withAuth, parseBody, parseRouteId } from "@/lib/api/route-helpers";
import { CLIENT_SELECT } from "@/lib/api/prisma-selects";
import { CLIENT_MSG } from "@/lib/api/messages";
import { mapClientItem } from "@/lib/domain/mappers";
import { clientPayloadSchema } from "@/lib/validation/dashboard";
import { deleteFileFromDisk } from "@/lib/upload/storage";

export const GET = withAuth(async (userId, _, context) => {
  const id = await parseRouteId(context!);
  if (!id) {
    return jsonError(CLIENT_MSG.invalidId, 400);
  }

  try {
    const client = await prisma.client.findFirst({
      where: { id, userId },
      select: CLIENT_SELECT,
    });

    if (!client) {
      return jsonError(CLIENT_MSG.notFound, 404);
    }

    return jsonSuccess(mapClientItem(client));
  } catch {
    return jsonError(CLIENT_MSG.fetchError, 500);
  }
});

export const PUT = withAuth(async (userId, request, context) => {
  const id = await parseRouteId(context!);
  if (!id) {
    return jsonError(CLIENT_MSG.invalidId, 400);
  }

  const result = await parseBody(request, clientPayloadSchema);
  if (!result.success) return result.response;

  try {
    const updateResult = await prisma.client.updateMany({
      where: { id, userId },
      data: {
        name: result.data.name,
        engagementType: result.data.engagementType,
        workingDaysPerWeek: result.data.workingDaysPerWeek,
        workingHoursPerDay: result.data.workingHoursPerDay,
        email: result.data.email,
        phone: result.data.phone,
        whatsapp: result.data.whatsapp,
        address: result.data.address,
        notes: result.data.notes,
      },
    });

    if (updateResult.count === 0) {
      return jsonError(CLIENT_MSG.notFound, 404);
    }

    const client = await prisma.client.findFirst({
      where: { id, userId },
      select: CLIENT_SELECT,
    });

    if (!client) {
      return jsonError(CLIENT_MSG.notFound, 404);
    }

    return jsonSuccess(mapClientItem(client), {
      message: CLIENT_MSG.updated,
    });
  } catch {
    return jsonError(CLIENT_MSG.updateError, 500);
  }
});

export const DELETE = withAuth(async (userId, _, context) => {
  const id = await parseRouteId(context!);
  if (!id) {
    return jsonError(CLIENT_MSG.invalidId, 400);
  }

  try {
    const associatedFiles = await prisma.file.findMany({
      where: { clientId: id, userId },
      select: { storagePath: true },
    });

    const result = await prisma.client.deleteMany({
      where: { id, userId },
    });

    if (result.count === 0) {
      return jsonError(CLIENT_MSG.notFound, 404);
    }

    for (const f of associatedFiles) {
      await deleteFileFromDisk(f.storagePath).catch(() => {});
    }

    return jsonSuccess(null, {
      message: CLIENT_MSG.deleted,
    });
  } catch {
    return jsonError(CLIENT_MSG.deleteError, 500);
  }
});
