import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  getPaginationMeta,
  parseListQuery,
  resolvePagination,
} from "@/lib/api/pagination";
import { withAuth, parseBody, parseFilters } from "@/lib/api/route-helpers";
import { CODEBASE_SELECT, DROPDOWN_SELECT } from "@/lib/api/prisma-selects";
import { CODEBASE_MSG } from "@/lib/api/messages";
import { requireProject } from "@/lib/api/ownership";
import { mapCodebaseItem, mapDropdownOption } from "@/lib/domain/mappers";
import {
  codebaseListFiltersSchema,
  codebasePayloadSchema,
} from "@/lib/validation/dashboard";

export const GET = withAuth(async (userId, request) => {
  const { searchParams } = new URL(request.url);
  const query = parseListQuery(searchParams);
  const filters = parseFilters(
    codebaseListFiltersSchema,
    { clientId: searchParams.get("clientId"), projectId: searchParams.get("projectId") },
    "Invalid codebase filters.",
  );

  if (!filters.success) return filters.response;

  const where = {
    project: {
      client: { userId },
      ...(filters.data.clientId ? { clientId: filters.data.clientId } : {}),
    },
    ...(filters.data.projectId ? { projectId: filters.data.projectId } : {}),
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

    const items = await prisma.codebase.findMany({
      where,
      select: CODEBASE_SELECT,
      orderBy: { updatedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    });

    return jsonSuccess({
      items: items.map(mapCodebaseItem),
      meta: getPaginationMeta(total, pagination.page, pagination.pageSize),
    });
  } catch {
    return jsonError(CODEBASE_MSG.listError, 500);
  }
});

export const POST = withAuth(async (userId, request) => {
  const result = await parseBody(request, codebasePayloadSchema);
  if (!result.success) return result.response;

  try {
    const error = await requireProject(userId, result.data.projectId);
    if (error) return error;

    const codebase = await prisma.codebase.create({
      data: {
        projectId: result.data.projectId,
        name: result.data.name,
        description: result.data.description,
      },
      select: CODEBASE_SELECT,
    });

    return jsonSuccess(mapCodebaseItem(codebase), {
      status: 201,
      message: CODEBASE_MSG.created,
    });
  } catch {
    return jsonError(CODEBASE_MSG.createError, 500);
  }
});
