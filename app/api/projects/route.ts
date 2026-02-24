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
import { mapDropdownOption, mapProjectItem } from "@/lib/domain/mappers";
import {
  projectListFiltersSchema,
  projectPayloadSchema,
} from "@/lib/validation/dashboard";

export async function GET(request: Request) {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
  }

  const { searchParams } = new URL(request.url);
  const query = parseListQuery(searchParams);
  const parsedFilters = projectListFiltersSchema.safeParse({
    clientId: searchParams.get("clientId"),
  });

  if (!parsedFilters.success) {
    return jsonError(
      parsedFilters.error.issues[0]?.message ?? "Invalid project filters.",
      400,
      formatZodErrors(parsedFilters.error),
    );
  }

  const filters = parsedFilters.data;

  const where = {
    client: {
      userId,
    },
    ...(filters.clientId
      ? {
          clientId: filters.clientId,
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
              client: {
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
    const total = await prisma.project.count({ where });
    const pagination = resolvePagination(total, query);

    if (query.dropdown) {
      const items = await prisma.project.findMany({
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

    const items = await prisma.project.findMany({
      where,
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
      orderBy: {
        updatedAt: "desc",
      },
      skip: pagination.skip,
      take: pagination.take,
    });

    return jsonSuccess({
      items: items.map(mapProjectItem),
      meta: getPaginationMeta(total, pagination.page, pagination.pageSize),
    });
  } catch {
    return jsonError("Unable to fetch projects right now.", 500);
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

    const project = await prisma.project.create({
      data: {
        clientId: parsed.data.clientId,
        name: parsed.data.name,
        description: parsed.data.description,
        status: parsed.data.status,
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

    return jsonSuccess(mapProjectItem(project), {
      status: 201,
      message: "Project created successfully.",
    });
  } catch {
    return jsonError("Unable to create project right now.", 500);
  }
}
