import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  getPaginationMeta,
  parseListQuery,
  resolvePagination,
} from "@/lib/api/pagination";
import { withAuth, parseFilters } from "@/lib/api/route-helpers";
import { FILE_SELECT } from "@/lib/api/prisma-selects";
import { FILE_MSG } from "@/lib/api/messages";
import {
  requireClient,
  requireProject,
  requireCodebaseForProject,
} from "@/lib/api/ownership";
import { mapFileItem } from "@/lib/domain/mappers";
import { fileListFiltersSchema } from "@/lib/validation/dashboard";
import {
  ensureUserDir,
  generateStoragePath,
  saveFile,
} from "@/lib/upload/storage";
import { DEFAULT_MAX_FILE_SIZE } from "@/lib/upload/constants";

export const GET = withAuth(async (userId, request) => {
  const { searchParams } = new URL(request.url);
  const query = parseListQuery(searchParams);
  const filters = parseFilters(
    fileListFiltersSchema,
    {
      clientId: searchParams.get("clientId"),
      projectId: searchParams.get("projectId"),
      codebaseId: searchParams.get("codebaseId"),
    },
    "Invalid file filters.",
  );

  if (!filters.success) return filters.response;

  const where = {
    userId,
    ...(filters.data.clientId ? { clientId: filters.data.clientId } : {}),
    ...(filters.data.projectId ? { projectId: filters.data.projectId } : {}),
    ...(filters.data.codebaseId
      ? { codebaseId: filters.data.codebaseId }
      : {}),
    ...(query.search
      ? {
          filename: {
            contains: query.search,
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  try {
    const total = await prisma.file.count({ where });
    const pagination = resolvePagination(total, query);

    const items = await prisma.file.findMany({
      where,
      select: FILE_SELECT,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    });

    return jsonSuccess({
      items: items.map(mapFileItem),
      meta: getPaginationMeta(total, pagination.page, pagination.pageSize),
    });
  } catch {
    return jsonError(FILE_MSG.listError, 500);
  }
});

export const POST = withAuth(async (userId, request) => {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid form data.", 400);
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File) || file.size === 0) {
    return jsonError("No file provided.", 400);
  }

  const clientId = (formData.get("clientId") as string) || null;
  const projectId = (formData.get("projectId") as string) || null;
  const codebaseId = (formData.get("codebaseId") as string) || null;

  const maxSizeStr = formData.get("maxSize") as string | null;
  const maxSize = maxSizeStr ? Number(maxSizeStr) : DEFAULT_MAX_FILE_SIZE;
  const allowedMimeTypesStr = formData.get("allowedMimeTypes") as string | null;

  if (file.size > maxSize) {
    return jsonError(
      `File exceeds maximum size of ${Math.round(maxSize / (1024 * 1024))}MB.`,
      400,
    );
  }

  if (allowedMimeTypesStr) {
    const allowedTypes = allowedMimeTypesStr.split(",").map((t) => t.trim());
    if (!allowedTypes.includes(file.type)) {
      return jsonError("File type is not allowed.", 400);
    }
  }

  try {
    if (clientId) {
      const clientError = await requireClient(userId, clientId);
      if (clientError) return clientError;
    }

    if (projectId) {
      const projectError = await requireProject(userId, projectId);
      if (projectError) return projectError;

      if (codebaseId) {
        const codebaseError = await requireCodebaseForProject(
          userId,
          codebaseId,
          projectId,
        );
        if (codebaseError) return codebaseError;
      }
    }

    await ensureUserDir(userId);
    const storagePath = generateStoragePath(userId, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await saveFile(storagePath, buffer);

    const record = await prisma.file.create({
      data: {
        userId,
        clientId,
        projectId,
        codebaseId,
        filename: file.name,
        storagePath,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      },
      select: FILE_SELECT,
    });

    return jsonSuccess(mapFileItem(record), {
      status: 201,
      message: FILE_MSG.created,
    });
  } catch {
    return jsonError(FILE_MSG.createError, 500);
  }
});
