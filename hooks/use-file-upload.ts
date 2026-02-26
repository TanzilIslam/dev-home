"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ApiRequestError,
  deleteFileRecord,
  listFiles,
  uploadFile,
} from "@/lib/api/client";
import type { FileItem } from "@/types/domain";

type EntityScope = {
  clientId?: string;
  projectId?: string;
  codebaseId?: string;
};

type UseFileUploadOptions = {
  scope: EntityScope;
  maxSize?: number;
  allowedMimeTypes?: string[];
};

export function useFileUpload(options: UseFileUploadOptions) {
  const { scope, maxSize, allowedMimeTypes } = options;
  const scopeClientId = scope.clientId;
  const scopeProjectId = scope.projectId;
  const scopeCodebaseId = scope.codebaseId;

  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const hasScope =
    Boolean(scopeClientId) ||
    Boolean(scopeProjectId) ||
    Boolean(scopeCodebaseId);

  const loadFiles = useCallback(async () => {
    if (!hasScope) {
      setFiles([]);
      return;
    }

    setIsLoading(true);
    try {
      const data = await listFiles({
        clientId: scopeClientId,
        projectId: scopeProjectId,
        codebaseId: scopeCodebaseId,
        all: true,
      });
      if (mountedRef.current) {
        setFiles(data.items);
      }
    } catch {
      if (mountedRef.current) {
        setFiles([]);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [hasScope, scopeClientId, scopeProjectId, scopeCodebaseId]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const upload = useCallback(
    async (file: File) => {
      const effectiveMaxSize = maxSize ?? 4 * 1024 * 1024;
      if (file.size > effectiveMaxSize) {
        toast.error(
          `File exceeds maximum size of ${Math.round(effectiveMaxSize / (1024 * 1024))}MB.`,
        );
        return;
      }

      if (allowedMimeTypes?.length && !allowedMimeTypes.includes(file.type)) {
        toast.error("File type is not allowed.");
        return;
      }

      setIsUploading(true);
      try {
        const result = await uploadFile({
          file,
          clientId: scopeClientId,
          projectId: scopeProjectId,
          codebaseId: scopeCodebaseId,
          maxSize: effectiveMaxSize,
          allowedMimeTypes,
        });

        if (mountedRef.current) {
          setFiles((prev) => [result, ...prev]);
          toast.success("File uploaded successfully.");
        }
      } catch (error) {
        const message =
          error instanceof ApiRequestError
            ? error.message
            : "Unable to upload file right now.";
        toast.error(message);
      } finally {
        if (mountedRef.current) {
          setIsUploading(false);
        }
      }
    },
    [scopeClientId, scopeProjectId, scopeCodebaseId, maxSize, allowedMimeTypes],
  );

  const remove = useCallback(async (fileId: string) => {
    try {
      await deleteFileRecord(fileId);
      if (mountedRef.current) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
        toast.success("File deleted successfully.");
      }
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : "Unable to delete file right now.";
      toast.error(message);
    }
  }, []);

  return {
    files,
    isUploading,
    isLoading,
    loadFiles,
    upload,
    remove,
  };
}
