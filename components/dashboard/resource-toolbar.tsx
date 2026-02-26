"use client";

import { PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ResourceToolbarProps = {
  title: string;
  description: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  addLabel: string;
};

export function ResourceToolbar({
  title,
  description,
  searchValue,
  onSearchChange,
  onAdd,
  addLabel,
}: ResourceToolbarProps) {
  const searchInputId = `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")}-search`;

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <label htmlFor={searchInputId} className="sr-only">
            Search {title}
          </label>
          <SearchIcon
            aria-hidden
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            id={searchInputId}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search..."
            className="pl-9"
          />
        </div>

        <Button onClick={onAdd} aria-label={addLabel}>
          <PlusIcon className="size-4" />
          {addLabel}
        </Button>
      </div>
    </div>
  );
}
