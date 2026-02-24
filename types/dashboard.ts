import type {
  ClientPayload,
  CodebasePayload,
  EngagementType,
  LinkCategory,
  LinkPayload,
  ProjectPayload,
  ProjectStatus,
  CodebaseType,
} from "@/types/domain";

export interface SelectOption {
  id: string;
  label: string;
}

export type DashboardEntity = "client" | "project" | "codebase" | "link";

export type SheetMode = "create" | "update";

export type ClientFormValues = ClientPayload;

export type ProjectFormValues = ProjectPayload;

export type CodebaseFormValues = CodebasePayload;

export type LinkFormValues = LinkPayload;

export const DEFAULT_CLIENT_FORM_VALUES: ClientFormValues = {
  name: "",
  engagementType: "TIME_BASED" satisfies EngagementType,
  workingDaysPerWeek: 5,
  workingHoursPerDay: 8,
  notes: null,
};

export const DEFAULT_PROJECT_FORM_VALUES: ProjectFormValues = {
  clientId: "",
  name: "",
  description: null,
  status: "ACTIVE" satisfies ProjectStatus,
};

export const DEFAULT_CODEBASE_FORM_VALUES: CodebaseFormValues = {
  projectId: "",
  name: "",
  type: "WEB" satisfies CodebaseType,
  description: null,
};

export const DEFAULT_LINK_FORM_VALUES: LinkFormValues = {
  projectId: "",
  codebaseId: null,
  title: "",
  url: "",
  category: "REPOSITORY" satisfies LinkCategory,
  notes: null,
};
