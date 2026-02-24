import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/server";

export async function getCurrentUser() {
  const session = await getSession();

  if (!session?.sub) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
}
