import { createSignedUrl } from "@/lib/supabase/queries";

export async function viewFile(storagePath: string): Promise<void> {
  const url = await createSignedUrl(storagePath);
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function downloadFile(storagePath: string, filename: string): Promise<void> {
  const url = await createSignedUrl(storagePath);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}
