import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { withAuth, parseBody } from "@/lib/api/route-helpers";
import { profileSchema } from "@/lib/auth/validation";

export const PUT = withAuth(async (userId, request) => {
  const result = await parseBody(request, profileSchema);
  if (!result.success) return result.response;

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: result.data.name },
      select: { id: true, email: true, name: true },
    });

    return jsonSuccess(user, { message: "Profile updated successfully." });
  } catch {
    return jsonError("Unable to update profile right now.", 500);
  }
});
