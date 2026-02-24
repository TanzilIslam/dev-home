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
import { mapCodebaseItem, mapDropdownOption } from "@/lib/domain/mappers";
import {
  codebaseListFiltersSchema,
  codebasePayloadSchema,
} from "@/lib/validation/dashboard";

export async function GET(request: Request) {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
  }

  const { searchParams } = new URL(request.url);
  const query = parseListQuery(searchParams);
  const parsedFilters = codebaseListFiltersSchema.safeParse({
    projectId: searchParams.get("projectId"),
  });

  if (!parsedFilters.success) {
    return jsonError(
      parsedFilters.error.issues[0]?.message ?? "Invalid codebase filters.",
      400,
      formatZodErrors(parsedFilters.error),
    );
  }

  const filters = parsedFilters.data;

  const where = {
    project: {
      client: {
        userId,
      },
    },
    ...(filters.projectId
      ? {
          projectId: filters.projectId,
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            {
              name: {
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
          ],
        }
      : {}),
  };

  try {
    const total = await prisma.codebase.count({ where });
    const pagination = resolvePagination(total, query);

    if (query.dropdown) {
      const items = await prisma.codebase.findMany({
        where,
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
        skip: pagination.skip,
        take: pagination.take,
      });

      return jsonSuccess({
        items: items.map(mapDropdownOption),
        meta: getPaginationMeta(total, pagination.page, pagination.pageSize),
      });
    }

    const items = await prisma.codebase.findMany({
      where,
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
      orderBy: {
        updatedAt: "desc",
      },
      skip: pagination.skip,
      take: pagination.take,
    });

    return jsonSuccess({
      items: items.map(mapCodebaseItem),
      meta: getPaginationMeta(total, pagination.page, pagination.pageSize),
    });
  } catch {
    return jsonError("Unable to fetch codebases right now.", 500);
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

  const parsed = codebasePayloadSchema.safeParse(bodyResult.data);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid codebase payload.",
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

    const codebase = await prisma.codebase.create({
      data: {
        projectId: parsed.data.projectId,
        name: parsed.data.name,
        type: parsed.data.type,
        description: parsed.data.description,
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

    return jsonSuccess(mapCodebaseItem(codebase), {
      status: 201,
      message: "Codebase created successfully.",
    });
  } catch {
    return jsonError("Unable to create codebase right now.", 500);
  }
}
