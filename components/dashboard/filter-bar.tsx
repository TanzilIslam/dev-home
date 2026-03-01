"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { SelectOption } from "@/types/dashboard";

type FilterSelectProps = {
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
  options: SelectOption[];
  placeholder: string;
  allLabel: string;
  triggerClassName?: string;
  disabled?: boolean;
  loading?: boolean;
};

export function FilterSelect({
  value,
  onValueChange,
  options,
  placeholder,
  allLabel,
  triggerClassName = "w-full sm:w-[260px]",
  disabled = false,
  loading = false,
}: FilterSelectProps) {
  return (
    <Select
      value={value ?? "__all"}
      onValueChange={(v) => onValueChange(v === "__all" ? undefined : v)}
      disabled={disabled || loading}
    >
      <SelectTrigger className={triggerClassName}>
        {loading ? <Spinner className="size-3.5" /> : null}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type FilterBarProps = {
  children: React.ReactNode;
  className?: string;
};

export function FilterBar({
  children,
  className = "flex flex-col gap-2 sm:flex-row sm:items-center",
}: FilterBarProps) {
  return (
    <div className="rounded-lg border p-3">
      <div className={className}>{children}</div>
    </div>
  );
}
