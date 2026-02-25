import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  getPaginationMeta,
  parseListQuery,
  resolvePagination,
} from "@/lib/api/pagination";
import { withAuth, parseBody } from "@/lib/api/route-helpers";
import { CLIENT_SELECT, DROPDOWN_SELECT } from "@/lib/api/prisma-selects";
import { CLIENT_MSG } from "@/lib/api/messages";
import { mapClientItem, mapDropdownOption } from "@/lib/domain/mappers";
import { clientPayloadSchema } from "@/lib/validation/dashboard";

export const GET = withAuth(async (userId, request) => {
  const { searchParams } = new URL(request.url);
  const query = parseListQuery(searchParams);

  const where = {
    userId,
    ...(query.search
      ? {
          name: {
            contains: query.search,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  try {
    const total = await prisma.client.count({ where });
    const pagination = resolvePagination(total, query);

    if (query.dropdown) {
      const items = await prisma.client.findMany({
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

    const items = await prisma.client.findMany({
      where,
      select: CLIENT_SELECT,
      orderBy: { updatedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    });

    return jsonSuccess({
      items: items.map(mapClientItem),
      meta: getPaginationMeta(total, pagination.page, pagination.pageSize),
    });
  } catch {
    return jsonError(CLIENT_MSG.listError, 500);
  }
});

export const POST = withAuth(async (userId, request) => {
  const result = await parseBody(request, clientPayloadSchema);
  if (!result.success) return result.response;

  try {
    const client = await prisma.client.create({
      data: {
        userId,
        name: result.data.name,
        engagementType: result.data.engagementType,
        workingDaysPerWeek: result.data.workingDaysPerWeek,
        workingHoursPerDay: result.data.workingHoursPerDay,
        notes: result.data.notes,
      },
      select: CLIENT_SELECT,
    });

    return jsonSuccess(mapClientItem(client), {
      status: 201,
      message: CLIENT_MSG.created,
    });
  } catch {
    return jsonError(CLIENT_MSG.createError, 500);
  }
});
