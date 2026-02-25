import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/api/auth";
import { jsonSuccess, jsonError, readJsonBody, formatZodErrors } from "@/lib/api/response";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name must be 100 characters or less."),
});

export async function PUT(request: Request) {
  const userId = await getRequestUserId();
  if (!userId) {
    return jsonError("Unauthorized.", 401);
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return jsonError("Invalid request payload.", 400);
  }

  const parsed = profileSchema.safeParse(body.data);
  if (!parsed.success) {
    return jsonError("Validation failed.", 400, formatZodErrors(parsed.error));
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: parsed.data.name },
      select: { id: true, email: true, name: true },
    });

    return jsonSuccess(user, { message: "Profile updated successfully." });
  } catch {
    return jsonError("Unable to update profile right now.", 500);
  }
}
