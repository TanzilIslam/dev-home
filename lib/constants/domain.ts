import type {
  EngagementType,
  ProjectStatus,
} from "@/types/domain";

type Option<TValue extends string> = {
  value: TValue;
  label: string;
};

export const ENGAGEMENT_TYPE_OPTIONS: Option<EngagementType>[] = [
  { value: "TIME_BASED", label: "Time Based" },
  { value: "PROJECT_BASED", label: "Project Based" },
];

export const PROJECT_STATUS_OPTIONS: Option<ProjectStatus>[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "ARCHIVED", label: "Archived" },
];

export function getLabelByValue(
  options: Option<string>[],
  value: string | null | undefined,
) {
  if (!value) {
    return "";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}

function isValidOption<T extends string>(options: Option<T>[], value: string): value is T {
  return options.some((o) => o.value === value);
}

export function toEngagementType(value: string): EngagementType {
  if (isValidOption(ENGAGEMENT_TYPE_OPTIONS, value)) return value;
  return "TIME_BASED";
}

export function toProjectStatus(value: string): ProjectStatus {
  if (isValidOption(PROJECT_STATUS_OPTIONS, value)) return value;
  return "ACTIVE";
}

export function joinLabels(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(" - ");
}
