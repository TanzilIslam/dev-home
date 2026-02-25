import type {
  CodebaseType,
  EngagementType,
  LinkCategory,
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

export const CODEBASE_TYPE_OPTIONS: Option<CodebaseType>[] = [
  { value: "WEB", label: "Web" },
  { value: "API", label: "API" },
  { value: "MOBILE_ANDROID", label: "Android" },
  { value: "MOBILE_IOS", label: "iOS" },
  { value: "DESKTOP", label: "Desktop" },
  { value: "INFRA", label: "Infra" },
  { value: "OTHER", label: "Other" },
];

export const LINK_CATEGORY_OPTIONS: Option<LinkCategory>[] = [
  { value: "REPOSITORY", label: "Repository" },
  { value: "SERVER", label: "Server" },
  { value: "COMMUNICATION", label: "Communication" },
  { value: "DOCUMENTATION", label: "Documentation" },
  { value: "DESIGN", label: "Design" },
  { value: "TRACKING", label: "Tracking" },
  { value: "OTHER", label: "Other" },
];

export const LINK_CATEGORY_CHART_LABELS: Record<string, string> = {
  REPOSITORY: "Repo",
  SERVER: "Server",
  COMMUNICATION: "Comms",
  DOCUMENTATION: "Docs",
  DESIGN: "Design",
  TRACKING: "Tracking",
  OTHER: "Other",
};

export function getLabelByValue(
  options: Option<string>[],
  value: string | null | undefined,
) {
  if (!value) {
    return "";
  }

  return options.find((option) => option.value === value)?.label ?? value;
}
