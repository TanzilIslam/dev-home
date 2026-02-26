"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ResourceActionsProps = {
  editLabel: string;
  deleteLabel: string;
  onEdit: () => void;
  onDelete: () => void;
};

export function ResourceActions({
  editLabel,
  deleteLabel,
  onEdit,
  onDelete,
}: ResourceActionsProps) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={editLabel}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={deleteLabel}
        className="text-destructive hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
