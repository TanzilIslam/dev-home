import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/api/auth";
import {
  formatZodErrors,
  jsonError,
  jsonSuccess,
  readJsonBody,
} from "@/lib/api/response";
import { mapCodebaseItem } from "@/lib/domain/mappers";
import {
  codebasePayloadSchema,
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
    return jsonError("Invalid codebase id.", 400);
  }

  try {
    const codebase = await prisma.codebase.findFirst({
      where: {
        id,
        project: {
          client: {
            userId,
          },
        },
      },
      select: {
        id: true,
        projectId: true,
        name: true,
        type: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!codebase) {
      return jsonError("Codebase not found.", 404);
    }

    return jsonSuccess(mapCodebaseItem(codebase));
  } catch {
    return jsonError("Unable to fetch codebase right now.", 500);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
  }

  const id = await parseRouteId(context);
  if (!id) {
    return jsonError("Invalid codebase id.", 400);
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return jsonError("Invalid request payload.", 400);
  }

  const parsed = codebasePayloadSchema.safeParse(bodyResult.data);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid codebase payload.",
      400,
      formatZodErrors(parsed.error),
    );
  }

  try {
    const existingCodebase = await prisma.codebase.findFirst({
      where: {
        id,
        project: {
          client: {
            userId,
          },
        },
      },
      select: {
        id: true,
        projectId: true,
      },
    });

    if (!existingCodebase) {
      return jsonError("Codebase not found.", 404);
    }

    const project = await prisma.project.findFirst({
      where: {
        id: parsed.data.projectId,
        client: {
          userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      return jsonError("Project not found.", 404);
    }

    const codebase = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.codebase.updateMany({
        where: {
          id,
          project: {
            client: {
              userId,
            },
          },
        },
        data: {
          projectId: parsed.data.projectId,
          name: parsed.data.name,
          type: parsed.data.type,
          description: parsed.data.description,
        },
      });

      if (updateResult.count === 0) {
        return null;
      }

      if (existingCodebase.projectId !== parsed.data.projectId) {
        await tx.link.updateMany({
          where: {
            userId,
            codebaseId: id,
          },
          data: {
            projectId: parsed.data.projectId,
          },
        });
      }

      return tx.codebase.findFirst({
        where: {
          id,
          project: {
            client: {
              userId,
            },
          },
        },
        select: {
          id: true,
          projectId: true,
          name: true,
          type: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          project: {
            select: {
              name: true,
            },
          },
        },
      });
    });

    if (!codebase) {
      return jsonError("Codebase not found.", 404);
    }

    return jsonSuccess(mapCodebaseItem(codebase), {
      message: "Codebase updated successfully.",
    });
  } catch {
    return jsonError("Unable to update codebase right now.", 500);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
  }

  const id = await parseRouteId(context);
  if (!id) {
    return jsonError("Invalid codebase id.", 400);
  }

  try {
    const result = await prisma.codebase.deleteMany({
      where: {
        id,
        project: {
          client: {
            userId,
          },
        },
      },
    });

    if (result.count === 0) {
      return jsonError("Codebase not found.", 404);
    }

    return jsonSuccess(null, {
      message: "Codebase deleted successfully.",
    });
  } catch {
    return jsonError("Unable to delete codebase right now.", 500);
  }
}
