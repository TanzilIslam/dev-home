import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types/api";

export function jsonSuccess<TData>(
  data: TData,
  options?: { status?: number; message?: string },
) {
  const payload: ApiResponse<TData> = {
    success: true,
    data,
    ...(options?.message ? { message: options.message } : {}),
  };

  return NextResponse.json(payload, {
    status: options?.status ?? 200,
  });
}

export function jsonError(
  message: string,
  status = 400,
  errors?: Record<string, string[]>,
) {
  const payload: ApiResponse<never> = {
    success: false,
    message,
    ...(errors ? { errors } : {}),
  };

  return NextResponse.json(payload, { status });
}

export async function readJsonBody(request: Request) {
  try {
    return {
      ok: true as const,
      data: (await request.json()) as unknown,
    };
  } catch {
    return {
      ok: false as const,
      data: null,
    };
  }
}

export function formatZodErrors(error: ZodError) {
  const mapped: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!mapped[key]) {
      mapped[key] = [];
    }
    mapped[key].push(issue.message);
  }

  return mapped;
}
