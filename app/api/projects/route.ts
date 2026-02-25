import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  getPaginationMeta,
  parseListQuery,
  resolvePagination,
} from "@/lib/api/pagination";
import { withAuth, parseBody, parseFilters } from "@/lib/api/route-helpers";
import { DROPDOWN_SELECT, PROJECT_SELECT } from "@/lib/api/prisma-selects";
import { PROJECT_MSG } from "@/lib/api/messages";
import { requireClient } from "@/lib/api/ownership";
import { mapDropdownOption, mapProjectItem } from "@/lib/domain/mappers";
import {
  projectListFiltersSchema,
  projectPayloadSchema,
} from "@/lib/validation/dashboard";

export const GET = withAuth(async (userId, request) => {
  const { searchParams } = new URL(request.url);
  const query = parseListQuery(searchParams);
  const filters = parseFilters(
    projectListFiltersSchema,
    { clientId: searchParams.get("clientId") },
    "Invalid project filters.",
  );

  if (!filters.success) return filters.response;

  const where = {
    client: { userId },
    ...(filters.data.clientId ? { clientId: filters.data.clientId } : {}),
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
        select: DROPDOWN_SELECT,
        orderBy: { name: "asc" },
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
      select: PROJECT_SELECT,
      orderBy: { updatedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    });

    return jsonSuccess({
      items: items.map(mapProjectItem),
      meta: getPaginationMeta(total, pagination.page, pagination.pageSize),
    });
  } catch {
    return jsonError(PROJECT_MSG.listError, 500);
  }
});

export const POST = withAuth(async (userId, request) => {
  const result = await parseBody(request, projectPayloadSchema);
  if (!result.success) return result.response;

  try {
    const error = await requireClient(userId, result.data.clientId);
    if (error) return error;

    const project = await prisma.project.create({
      data: {
        clientId: result.data.clientId,
        name: result.data.name,
        description: result.data.description,
        status: result.data.status,
      },
      select: PROJECT_SELECT,
    });

    return jsonSuccess(mapProjectItem(project), {
      status: 201,
      message: PROJECT_MSG.created,
    });
  } catch {
    return jsonError(PROJECT_MSG.createError, 500);
  }
});
