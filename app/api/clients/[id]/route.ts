import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/api/auth";
import {
  formatZodErrors,
  jsonError,
  jsonSuccess,
  readJsonBody,
} from "@/lib/api/response";
import { mapClientItem } from "@/lib/domain/mappers";
import {
  clientPayloadSchema,
  resourceIdParamsSchema,
} from "@/lib/validation/dashboard";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function parseRouteId(context: RouteContext) {
  const parsed = resourceIdParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return null;
  }

  return parsed.data.id;
}

export async function GET(_: Request, context: RouteContext) {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
  }

  const id = await parseRouteId(context);
  if (!id) {
    return jsonError("Invalid client id.", 400);
  }

  try {
    const client = await prisma.client.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        name: true,
        engagementType: true,
        workingDaysPerWeek: true,
        workingHoursPerDay: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!client) {
      return jsonError("Client not found.", 404);
    }

    return jsonSuccess(mapClientItem(client));
  } catch {
    return jsonError("Unable to fetch client right now.", 500);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
  }

  const id = await parseRouteId(context);
  if (!id) {
    return jsonError("Invalid client id.", 400);
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return jsonError("Invalid request payload.", 400);
  }

  const parsed = clientPayloadSchema.safeParse(bodyResult.data);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid client payload.",
      400,
      formatZodErrors(parsed.error),
    );
  }

  try {
    const updateResult = await prisma.client.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        name: parsed.data.name,
        engagementType: parsed.data.engagementType,
        workingDaysPerWeek: parsed.data.workingDaysPerWeek,
        workingHoursPerDay: parsed.data.workingHoursPerDay,
        notes: parsed.data.notes,
      },
    });

    if (updateResult.count === 0) {
      return jsonError("Client not found.", 404);
    }

    const client = await prisma.client.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        name: true,
        engagementType: true,
        workingDaysPerWeek: true,
        workingHoursPerDay: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!client) {
      return jsonError("Client not found.", 404);
    }

    return jsonSuccess(mapClientItem(client), {
      message: "Client updated successfully.",
    });
  } catch {
    return jsonError("Unable to update client right now.", 500);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
  }

  const id = await parseRouteId(context);
  if (!id) {
    return jsonError("Invalid client id.", 400);
  }

  try {
    const result = await prisma.client.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (result.count === 0) {
      return jsonError("Client not found.", 404);
    }

    return jsonSuccess(null, {
      message: "Client deleted successfully.",
    });
  } catch {
    return jsonError("Unable to delete client right now.", 500);
  }
}
