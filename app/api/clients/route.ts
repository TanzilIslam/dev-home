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
import { mapClientItem, mapDropdownOption } from "@/lib/domain/mappers";
import { clientPayloadSchema } from "@/lib/validation/dashboard";

export async function GET(request: Request) {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
  }

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

    const items = await prisma.client.findMany({
      where,
      select: {
        id: true,
        name: true,
        engagementType: true,
        workingDaysPerWeek: true,
        workingHoursPerDay: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip: pagination.skip,
      take: pagination.take,
    });

    return jsonSuccess({
      items: items.map(mapClientItem),
      meta: getPaginationMeta(total, pagination.page, pagination.pageSize),
    });
  } catch {
    return jsonError("Unable to fetch clients right now.", 500);
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

  const parsed = clientPayloadSchema.safeParse(bodyResult.data);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "Invalid client payload.",
      400,
      formatZodErrors(parsed.error),
    );
  }

  try {
    const client = await prisma.client.create({
      data: {
        userId,
        name: parsed.data.name,
        engagementType: parsed.data.engagementType,
        workingDaysPerWeek: parsed.data.workingDaysPerWeek,
        workingHoursPerDay: parsed.data.workingHoursPerDay,
        notes: parsed.data.notes,
      },
      select: {
        id: true,
        name: true,
        engagementType: true,
        workingDaysPerWeek: true,
        workingHoursPerDay: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return jsonSuccess(mapClientItem(client), {
      status: 201,
      message: "Client created successfully.",
    });
  } catch {
    return jsonError("Unable to create client right now.", 500);
  }
}
