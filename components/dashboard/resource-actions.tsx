"use client";

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
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        aria-label={editLabel}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
      >
        Edit
      </Button>
      <Button
        variant="destructive"
        size="sm"
        aria-label={deleteLabel}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        Delete
      </Button>
    </div>
  );
}
