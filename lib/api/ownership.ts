import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api/response";

export async function requireClient(userId: string, clientId: string) {
  const client = await prisma.client.findFirst({
    where: { id: clientId, userId },
    select: { id: true },
  });

  if (!client) return jsonError("Client not found.", 404);
  return null;
}

export async function requireProject(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, client: { userId } },
    select: { id: true },
  });

  if (!project) return jsonError("Project not found.", 404);
  return null;
}

export async function requireCodebaseForProject(
  userId: string,
  codebaseId: string,
  projectId: string,
) {
  const codebase = await prisma.codebase.findFirst({
    where: {
      id: codebaseId,
      projectId,
      project: { client: { userId } },
    },
    select: { id: true },
  });

  if (!codebase) {
    return jsonError("Codebase not found for the selected project.", 404);
  }
  return null;
}
