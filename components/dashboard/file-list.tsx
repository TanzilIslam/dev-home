"use client";

import { useState } from "react";
import { Download, ExternalLink, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatFileSize } from "@/lib/upload/constants";
import type { FileItem } from "@/types/domain";

type FileListProps = {
  files: FileItem[];
  isLoading?: boolean;
  onDelete?: (fileId: string) => Promise<void>;
  onDownload?: (fileId: string, filename: string) => void;
  onView?: (fileId: string) => void;
  readOnly?: boolean;
};

export function FileList({
  files,
  isLoading = false,
  onDelete,
  onDownload,
  onView,
  readOnly = false,
}: FileListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(fileId: string) {
    if (!onDelete) return;
    setDeletingId(fileId);
    try {
      await onDelete(fileId);
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <Spinner className="size-4" />
        <span className="text-muted-foreground text-sm">Loading files...</span>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <p className="text-muted-foreground py-2 text-sm">No files attached.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {files.map((file) => (
        <li
          key={file.id}
          className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="text-muted-foreground size-4 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.filename}</p>
              <p className="text-muted-foreground text-xs">
                {formatFileSize(file.sizeBytes)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onView ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-7 p-0"
                onClick={() => onView(file.id)}
                aria-label={`View ${file.filename}`}
              >
                <ExternalLink className="size-4" />
              </Button>
            ) : null}
            {!readOnly && onDownload ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-7 p-0"
                onClick={() => onDownload(file.id, file.filename)}
                aria-label={`Download ${file.filename}`}
              >
                <Download className="size-4" />
              </Button>
            ) : null}
            {!readOnly && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive size-7 p-0"
                onClick={() => {
                  void handleDelete(file.id);
                }}
                disabled={deletingId === file.id}
                aria-label={`Delete ${file.filename}`}
              >
                {deletingId === file.id ? (
                  <Spinner className="size-4" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
