"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  formatFileSize,
  DEFAULT_MAX_FILE_SIZE,
} from "@/lib/upload/constants";

type FileUploadInputProps = {
  accept?: string;
  maxSize?: number;
  isUploading?: boolean;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
};

export function FileUploadInput({
  accept,
  maxSize = DEFAULT_MAX_FILE_SIZE,
  isUploading = false,
  onFileSelect,
  disabled = false,
}: FileUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={disabled || isUploading}
      >
        {isUploading ? (
          <>
            <Spinner className="size-4" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="size-4" />
            Upload File
          </>
        )}
      </Button>
      <p className="text-muted-foreground text-xs">
        Max size: {formatFileSize(maxSize)}
        {accept ? ` | Allowed: ${accept}` : ""}
      </p>
    </div>
  );
}
