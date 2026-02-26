import type {
  ClientPayload,
  CodebasePayload,
  EngagementType,
  LinkPayload,
  ProjectPayload,
  ProjectStatus,
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
  email: null,
  phone: null,
  whatsapp: null,
  address: null,
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
  description: null,
};

export const DEFAULT_LINK_FORM_VALUES: LinkFormValues = {
  clientId: null,
  projectId: "",
  codebaseId: null,
  title: "",
  url: "",
};
