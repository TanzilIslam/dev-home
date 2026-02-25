import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { withAuth, parseBody } from "@/lib/api/route-helpers";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { changePasswordSchema } from "@/lib/auth/validation";

export const PUT = withAuth(async (userId, request) => {
  const result = await parseBody(request, changePasswordSchema);
  if (!result.success) return result.response;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      return jsonError("User not found.", 404);
    }

    const isValid = await verifyPassword(result.data.currentPassword, user.passwordHash);
    if (!isValid) {
      return jsonError("Current password is incorrect.", 400, {
        currentPassword: ["Current password is incorrect."],
      });
    }

    const newHash = await hashPassword(result.data.newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return jsonSuccess(null, { message: "Password changed successfully." });
  } catch {
    return jsonError("Unable to change password right now.", 500);
  }
});
