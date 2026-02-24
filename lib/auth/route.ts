import { NextResponse } from "next/server";

export function formValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), {
    status: 303,
  });
}

export function redirectWithError(
  request: Request,
  path: string,
  message: string,
) {
  const url = new URL(path, request.url);
  url.searchParams.set("error", message);

  return NextResponse.redirect(url, {
    status: 303,
  });
}
