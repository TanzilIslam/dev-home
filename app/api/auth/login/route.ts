import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { parseBody } from "@/lib/api/route-helpers";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { loginSchema } from "@/lib/auth/validation";

export async function POST(request: Request) {
  const result = await parseBody(request, loginSchema);
  if (!result.success) return result.response;

  const { email, password } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return jsonError("Invalid email or password.", 401);
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      return jsonError("Invalid email or password.", 401);
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
    });

    const response = jsonSuccess(null, { message: "Logged in successfully." });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      ...getSessionCookieOptions(),
    });

    return response;
  } catch {
    return jsonError("Unable to log in right now.", 500);
  }
}
