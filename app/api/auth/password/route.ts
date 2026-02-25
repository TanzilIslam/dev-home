import { prisma } from "@/lib/prisma";
import { getRequestUserId } from "@/lib/api/auth";
import { jsonSuccess, jsonError, readJsonBody, formatZodErrors } from "@/lib/api/response";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { z } from "zod";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters.").max(72, "New password must be 72 characters or less."),
  confirmPassword: z.string().min(1, "Please confirm your new password."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
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

  const parsed = passwordSchema.safeParse(body.data);
  if (!parsed.success) {
    return jsonError("Validation failed.", 400, formatZodErrors(parsed.error));
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return jsonError("User not found.", 404);
    }

    const isValid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!isValid) {
      return jsonError("Current password is incorrect.", 400, {
        currentPassword: ["Current password is incorrect."],
      });
    }

    const newHash = await hashPassword(parsed.data.newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return jsonSuccess(null, { message: "Password changed successfully." });
  } catch {
    return jsonError("Unable to change password right now.", 500);
  }
}
