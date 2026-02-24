import { getSession } from "@/lib/auth/server";

export async function getRequestUserId() {
  const session = await getSession();
  return session?.sub ?? null;
}
