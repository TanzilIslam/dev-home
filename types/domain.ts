import type { PaginatedData } from "@/types/pagination";

export type EngagementType = "TIME_BASED" | "PROJECT_BASED";
export type ProjectStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";
export interface ClientItem {
  id: string;
  name: string;
  engagementType: EngagementType;
  workingDaysPerWeek: number | null;
  workingHoursPerDay: number | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
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
  clientId: string;
  clientName: string;
  projectId: string;
  projectName: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkItem {
  id: string;
  clientId: string | null;
  clientName: string | null;
  projectId: string | null;
  projectName: string | null;
  codebaseId: string | null;
  codebaseName: string | null;
  title: string;
  url: string;
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

export interface FileItem {
  id: string;
  clientId: string | null;
  projectId: string | null;
  codebaseId: string | null;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

export type FileListData = PaginatedData<FileItem>;

export interface FileListQueryParams extends ListQueryParams {
  clientId?: string;
  projectId?: string;
  codebaseId?: string;
}

export interface ClientPayload {
  name: string;
  engagementType: EngagementType;
  workingDaysPerWeek?: number | null;
  workingHoursPerDay?: number | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
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
  description?: string | null;
}

export interface LinkPayload {
  clientId?: string | null;
  projectId?: string | null;
  codebaseId?: string | null;
  title: string;
  url: string;
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
  clientId?: string;
  projectId?: string;
}

export interface LinkListQueryParams extends ListQueryParams {
  clientId?: string;
  projectId?: string;
  codebaseId?: string;
}

