import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/api/auth";
import {
  formatZodErrors,
  jsonError,
  jsonSuccess,
  readJsonBody,
} from "@/lib/api/response";
import { mapProjectItem } from "@/lib/domain/mappers";
import {
  projectPayloadSchema,
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
    return jsonError("Invalid project id.", 400);
  }

  try {
    const project = await prisma.project.findFirst({
      where: {
        id,
        client: {
          userId,
        },
      },
      select: {
        id: true,
        clientId: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!project) {
      return jsonError("Project not found.", 404);
    }

    return jsonSuccess(mapProjectItem(project));
  } catch {
    return jsonError("Unable to fetch project right now.", 500);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
  }

  const id = await parseRouteId(context);
  if (!id) {
    return jsonError("Invalid project id.", 400);
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return jsonError("Invalid request payload.", 400);
  }

  const parsed = projectPayloadSchema.safeParse(bodyResult.data);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid project payload.",
      400,
      formatZodErrors(parsed.error),
    );
  }

  try {
    const client = await prisma.client.findFirst({
      where: {
        id: parsed.data.clientId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!client) {
      return jsonError("Client not found.", 404);
    }

    const updateResult = await prisma.project.updateMany({
      where: {
        id,
        client: {
          userId,
        },
      },
      data: {
        clientId: parsed.data.clientId,
        name: parsed.data.name,
        description: parsed.data.description,
        status: parsed.data.status,
      },
    });

    if (updateResult.count === 0) {
      return jsonError("Project not found.", 404);
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        client: {
          userId,
        },
      },
      select: {
        id: true,
        clientId: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!project) {
      return jsonError("Project not found.", 404);
    }

    return jsonSuccess(mapProjectItem(project), {
      message: "Project updated successfully.",
    });
  } catch {
    return jsonError("Unable to update project right now.", 500);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
  }

  const id = await parseRouteId(context);
  if (!id) {
    return jsonError("Invalid project id.", 400);
  }

  try {
    const result = await prisma.project.deleteMany({
      where: {
        id,
        client: {
          userId,
        },
      },
    });

    if (result.count === 0) {
      return jsonError("Project not found.", 404);
    }

    return jsonSuccess(null, {
      message: "Project deleted successfully.",
    });
  } catch {
    return jsonError("Unable to delete project right now.", 500);
  }
}
