import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/api/auth";
import {
  formatZodErrors,
  jsonError,
  jsonSuccess,
  readJsonBody,
} from "@/lib/api/response";
import { mapLinkItem } from "@/lib/domain/mappers";
import {
  linkPayloadSchema,
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
    return jsonError("Invalid link id.", 400);
  }

  try {
    const link = await prisma.link.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        projectId: true,
        codebaseId: true,
        title: true,
        url: true,
        category: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            name: true,
          },
        },
        codebase: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!link) {
      return jsonError("Link not found.", 404);
    }

    return jsonSuccess(mapLinkItem(link));
  } catch {
    return jsonError("Unable to fetch link right now.", 500);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
  }

  const id = await parseRouteId(context);
  if (!id) {
    return jsonError("Invalid link id.", 400);
  }

  const bodyResult = await readJsonBody(request);
  if (!bodyResult.ok) {
    return jsonError("Invalid request payload.", 400);
  }

  const parsed = linkPayloadSchema.safeParse(bodyResult.data);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid link payload.",
      400,
      formatZodErrors(parsed.error),
    );
  }

  try {
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

    if (parsed.data.codebaseId) {
      const codebase = await prisma.codebase.findFirst({
        where: {
          id: parsed.data.codebaseId,
          projectId: parsed.data.projectId,
          project: {
            client: {
              userId,
            },
          },
        },
        select: {
          id: true,
        },
      });

      if (!codebase) {
        return jsonError("Codebase not found for the selected project.", 404);
      }
    }

    const updateResult = await prisma.link.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        projectId: parsed.data.projectId,
        codebaseId: parsed.data.codebaseId,
        title: parsed.data.title,
        url: parsed.data.url,
        category: parsed.data.category,
        notes: parsed.data.notes,
      },
    });

    if (updateResult.count === 0) {
      return jsonError("Link not found.", 404);
    }

    const link = await prisma.link.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
        projectId: true,
        codebaseId: true,
        title: true,
        url: true,
        category: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        project: {
          select: {
            name: true,
          },
        },
        codebase: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!link) {
      return jsonError("Link not found.", 404);
    }

    return jsonSuccess(mapLinkItem(link), {
      message: "Link updated successfully.",
    });
  } catch {
    return jsonError("Unable to update link right now.", 500);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
  }

  const id = await parseRouteId(context);
  if (!id) {
    return jsonError("Invalid link id.", 400);
  }

  try {
    const result = await prisma.link.deleteMany({
      where: {
        id,
        userId,
      },
    });

    if (result.count === 0) {
      return jsonError("Link not found.", 404);
    }

    return jsonSuccess(null, {
      message: "Link deleted successfully.",
    });
  } catch {
    return jsonError("Unable to delete link right now.", 500);
  }
}
