import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  getPaginationMeta,
  parseListQuery,
  resolvePagination,
} from "@/lib/api/pagination";
import { withAuth, parseBody, parseFilters } from "@/lib/api/route-helpers";
import { LINK_SELECT } from "@/lib/api/prisma-selects";
import { LINK_MSG } from "@/lib/api/messages";
import {
  requireClient,
  requireProject,
  requireCodebaseForProject,
} from "@/lib/api/ownership";
import { mapLinkItem } from "@/lib/domain/mappers";
import { linkListFiltersSchema, linkPayloadSchema } from "@/lib/validation/dashboard";

export const GET = withAuth(async (userId, request) => {
  const { searchParams } = new URL(request.url);
  const query = parseListQuery(searchParams);
  const filters = parseFilters(
    linkListFiltersSchema,
    {
      clientId: searchParams.get("clientId"),
      projectId: searchParams.get("projectId"),
      codebaseId: searchParams.get("codebaseId"),
    },
    "Invalid link filters.",
  );

  if (!filters.success) return filters.response;

  const where = {
    userId,
    ...(filters.data.clientId ? { clientId: filters.data.clientId } : {}),
    ...(filters.data.projectId ? { projectId: filters.data.projectId } : {}),
    ...(filters.data.codebaseId ? { codebaseId: filters.data.codebaseId } : {}),
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
              client: {
                name: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
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
        select: { id: true, title: true },
        orderBy: { title: "asc" },
        skip: pagination.skip,
        take: pagination.take,
      });

      return jsonSuccess({
        items: items.map((item) => ({ id: item.id, name: item.title })),
        meta: getPaginationMeta(total, pagination.page, pagination.pageSize),
      });
    }

    const items = await prisma.link.findMany({
      where,
      select: LINK_SELECT,
      orderBy: { updatedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    });

    return jsonSuccess({
      items: items.map(mapLinkItem),
      meta: getPaginationMeta(total, pagination.page, pagination.pageSize),
    });
  } catch {
    return jsonError(LINK_MSG.listError, 500);
  }
});

export const POST = withAuth(async (userId, request) => {
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

    const link = await prisma.link.create({
      data: {
        userId,
        clientId: result.data.clientId,
        projectId: result.data.projectId,
        codebaseId: result.data.codebaseId,
        title: result.data.title,
        url: result.data.url,
      },
      select: LINK_SELECT,
    });

    return jsonSuccess(mapLinkItem(link), {
      status: 201,
      message: LINK_MSG.created,
    });
  } catch {
    return jsonError(LINK_MSG.createError, 500);
  }
});
