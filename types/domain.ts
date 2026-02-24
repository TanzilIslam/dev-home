import type { PaginatedData } from "@/types/pagination";

export type EngagementType = "TIME_BASED" | "PROJECT_BASED";
export type ProjectStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";
export type CodebaseType =
  | "WEB"
  | "API"
  | "MOBILE_ANDROID"
  | "MOBILE_IOS"
  | "DESKTOP"
  | "INFRA"
  | "OTHER";
export type LinkCategory =
  | "REPOSITORY"
  | "SERVER"
  | "COMMUNICATION"
  | "DOCUMENTATION"
  | "DESIGN"
  | "TRACKING"
  | "OTHER";

export interface ClientItem {
  id: string;
  name: string;
  engagementType: EngagementType;
  workingDaysPerWeek: number | null;
  workingHoursPerDay: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectItem {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CodebaseItem {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  type: CodebaseType;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkItem {
  id: string;
  projectId: string;
  projectName: string;
  codebaseId: string | null;
  codebaseName: string | null;
  title: string;
  url: string;
  category: LinkCategory;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DropdownOption {
  id: string;
  name: string;
}

export type ClientListData = PaginatedData<ClientItem>;
export type ProjectListData = PaginatedData<ProjectItem>;
export type CodebaseListData = PaginatedData<CodebaseItem>;
export type LinkListData = PaginatedData<LinkItem>;
export type DropdownListData = PaginatedData<DropdownOption>;

export interface ClientPayload {
  name: string;
  engagementType: EngagementType;
  workingDaysPerWeek?: number | null;
  workingHoursPerDay?: number | null;
  notes?: string | null;
}

export interface ProjectPayload {
  clientId: string;
  name: string;
  description?: string | null;
  status: ProjectStatus;
}

export interface CodebasePayload {
  projectId: string;
  name: string;
  type: CodebaseType;
  description?: string | null;
}

export interface LinkPayload {
  projectId: string;
  codebaseId?: string | null;
  title: string;
  url: string;
  category: LinkCategory;
  notes?: string | null;
}

export interface ListQueryParams {
  page?: number;
  pageSize?: number;
  q?: string;
  all?: boolean;
  dropdown?: boolean;
}

export interface ProjectListQueryParams extends ListQueryParams {
  clientId?: string;
}

export interface CodebaseListQueryParams extends ListQueryParams {
  projectId?: string;
}

export interface LinkListQueryParams extends ListQueryParams {
  projectId?: string;
  codebaseId?: string;
}
