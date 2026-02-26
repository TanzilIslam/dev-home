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
