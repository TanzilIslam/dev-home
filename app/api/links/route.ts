import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/api/auth";
import {
  formatZodErrors,
  jsonError,
  jsonSuccess,
  readJsonBody,
} from "@/lib/api/response";
import {
  getPaginationMeta,
  parseListQuery,
  resolvePagination,
} from "@/lib/api/pagination";
import { mapLinkItem } from "@/lib/domain/mappers";
import { linkListFiltersSchema, linkPayloadSchema } from "@/lib/validation/dashboard";

export async function GET(request: Request) {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
  }

  const { searchParams } = new URL(request.url);
  const query = parseListQuery(searchParams);
  const parsedFilters = linkListFiltersSchema.safeParse({
    projectId: searchParams.get("projectId"),
    codebaseId: searchParams.get("codebaseId"),
  });

  if (!parsedFilters.success) {
    return jsonError(
      parsedFilters.error.issues[0]?.message ?? "Invalid link filters.",
      400,
      formatZodErrors(parsedFilters.error),
    );
  }

  const filters = parsedFilters.data;

  const where = {
    userId,
    ...(filters.projectId
      ? {
          projectId: filters.projectId,
        }
      : {}),
    ...(filters.codebaseId
      ? {
          codebaseId: filters.codebaseId,
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            {
              title: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
            {
              url: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
            {
              project: {
                name: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            },
            {
              codebase: {
                name: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };

  try {
    const total = await prisma.link.count({ where });
    const pagination = resolvePagination(total, query);

    if (query.dropdown) {
      const items = await prisma.link.findMany({
        where,
        select: {
          id: true,
          title: true,
        },
        orderBy: {
          title: "asc",
        },
        skip: pagination.skip,
        take: pagination.take,
      });

      return jsonSuccess({
        items: items.map((item) => ({
          id: item.id,
          name: item.title,
        })),
        meta: getPaginationMeta(total, pagination.page, pagination.pageSize),
      });
    }

    const items = await prisma.link.findMany({
      where,
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
      orderBy: {
        updatedAt: "desc",
      },
      skip: pagination.skip,
      take: pagination.take,
    });

    return jsonSuccess({
      items: items.map(mapLinkItem),
      meta: getPaginationMeta(total, pagination.page, pagination.pageSize),
    });
  } catch {
    return jsonError("Unable to fetch links right now.", 500);
  }
}

export async function POST(request: Request) {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
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

    const link = await prisma.link.create({
      data: {
        userId,
        projectId: parsed.data.projectId,
        codebaseId: parsed.data.codebaseId,
        title: parsed.data.title,
        url: parsed.data.url,
        category: parsed.data.category,
        notes: parsed.data.notes,
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

    return jsonSuccess(mapLinkItem(link), {
      status: 201,
      message: "Link created successfully.",
    });
  } catch {
    return jsonError("Unable to create link right now.", 500);
  }
}
