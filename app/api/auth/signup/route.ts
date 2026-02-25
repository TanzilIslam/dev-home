import { prisma } from "@/lib/prisma";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import { parseBody } from "@/lib/api/route-helpers";
import { hashPassword } from "@/lib/auth/password";
import { signupSchema } from "@/lib/auth/validation";
import { Prisma } from "@/generated/prisma/client";

export async function POST(request: Request) {
  const result = await parseBody(request, signupSchema);
  if (!result.success) return result.response;

  const { name, email, password } = result.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return jsonError("Email is already in use.", 409);
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    });

    return jsonSuccess(null, {
      status: 201,
      message: "Account created successfully. Please log in.",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError("Email is already in use.", 409);
    }

    return jsonError("Unable to create your account right now.", 500);
  }
}
