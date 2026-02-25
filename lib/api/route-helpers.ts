import type { z } from "zod";
import { resourceIdParamsSchema } from "@/lib/validation/dashboard";
import { getRequestUserId } from "@/lib/api/auth";
import { jsonError, readJsonBody, formatZodErrors } from "@/lib/api/response";

export type RouteContext = {
  params: Promise<Record<string, string>>;
};

export async function parseRouteId(context: RouteContext) {
  const parsed = resourceIdParamsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return null;
  }

  return parsed.data.id;
}

export function withAuth(
  handler: (
    userId: string,
    request: Request,
    context?: RouteContext,
  ) => Promise<Response>,
) {
  return async (request: Request, context?: RouteContext) => {
    const userId = await getRequestUserId();
    if (!userId) {
      return jsonError("Unauthorized.", 401);
    }

    return handler(userId, request, context);
  };
}

export async function parseBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; response: Response }
> {
  const body = await readJsonBody(request);
  if (!body.ok) {
    return {
      success: false,
      response: jsonError("Invalid request payload.", 400),
    };
  }

  const parsed = schema.safeParse(body.data);
  if (!parsed.success) {
    return {
      success: false,
      response: jsonError(
        parsed.error.issues[0]?.message ?? "Validation failed.",
        400,
        formatZodErrors(parsed.error),
      ),
    };
  }

  return { success: true, data: parsed.data };
}

export function parseFilters<T extends z.ZodTypeAny>(
  schema: T,
  data: Record<string, unknown>,
  fallbackMessage: string,
):
  | { success: true; data: z.infer<T> }
  | { success: false; response: Response } {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      response: jsonError(
        parsed.error.issues[0]?.message ?? fallbackMessage,
        400,
        formatZodErrors(parsed.error),
      ),
    };
  }

  return { success: true, data: parsed.data };
}
