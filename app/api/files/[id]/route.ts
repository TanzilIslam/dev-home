import fs from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { withAuth, parseRouteId } from "@/lib/api/route-helpers";
import { FILE_MSG } from "@/lib/api/messages";
import { deleteFileFromDisk, getAbsolutePath } from "@/lib/upload/storage";

export const GET = withAuth(async (userId, _, context) => {
  const id = await parseRouteId(context!);
  if (!id) {
    return jsonError(FILE_MSG.invalidId, 400);
  }

  try {
    const file = await prisma.file.findFirst({
      where: { id, userId },
      select: { storagePath: true, filename: true, mimeType: true },
    });

    if (!file) {
      return jsonError(FILE_MSG.notFound, 404);
    }

    const absolutePath = getAbsolutePath(file.storagePath);
    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(absolutePath);
    } catch {
      return jsonError("File not found on disk.", 404);
    }

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.filename)}"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch {
    return jsonError(FILE_MSG.fetchError, 500);
  }
});

export const DELETE = withAuth(async (userId, _, context) => {
  const id = await parseRouteId(context!);
  if (!id) {
    return jsonError(FILE_MSG.invalidId, 400);
  }

  try {
    const file = await prisma.file.findFirst({
      where: { id, userId },
      select: { id: true, storagePath: true },
    });

    if (!file) {
      return jsonError(FILE_MSG.notFound, 404);
    }

    await prisma.file.delete({ where: { id: file.id } });
    await deleteFileFromDisk(file.storagePath);

    return jsonSuccess(null, { message: FILE_MSG.deleted });
  } catch {
    return jsonError(FILE_MSG.deleteError, 500);
  }
});
