import { http } from "@/lib/http";

export function viewFile(fileId: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";
  window.open(`${base}/files/${fileId}`, "_blank");
}

export async function downloadFile(fileId: string, filename: string) {
  const response = await http.get<Blob>(`/files/${fileId}`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
