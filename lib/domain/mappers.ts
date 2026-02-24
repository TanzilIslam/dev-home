import type {
  ClientItem,
  CodebaseItem,
  DropdownOption,
  LinkItem,
  ProjectItem,
} from "@/types/domain";

function toIso(date: Date) {
  return date.toISOString();
}

export function mapClientItem(value: {
  id: string;
  name: string;
  engagementType: ClientItem["engagementType"];
  workingDaysPerWeek: number | null;
  workingHoursPerDay: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ClientItem {
  return {
    id: value.id,
    name: value.name,
    engagementType: value.engagementType,
    workingDaysPerWeek: value.workingDaysPerWeek,
    workingHoursPerDay: value.workingHoursPerDay,
    notes: value.notes,
    createdAt: toIso(value.createdAt),
    updatedAt: toIso(value.updatedAt),
  };
}

export function mapProjectItem(value: {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  status: ProjectItem["status"];
  createdAt: Date;
  updatedAt: Date;
  client: {
    name: string;
  };
}): ProjectItem {
  return {
    id: value.id,
    clientId: value.clientId,
    clientName: value.client.name,
    name: value.name,
    description: value.description,
    status: value.status,
    createdAt: toIso(value.createdAt),
    updatedAt: toIso(value.updatedAt),
  };
}

export function mapCodebaseItem(value: {
  id: string;
  projectId: string;
  name: string;
  type: CodebaseItem["type"];
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    name: string;
  };
}): CodebaseItem {
  return {
    id: value.id,
    projectId: value.projectId,
    projectName: value.project.name,
    name: value.name,
    type: value.type,
    description: value.description,
    createdAt: toIso(value.createdAt),
    updatedAt: toIso(value.updatedAt),
  };
}

export function mapLinkItem(value: {
  id: string;
  projectId: string;
  codebaseId: string | null;
  title: string;
  url: string;
  category: LinkItem["category"];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    name: string;
  };
  codebase: {
    name: string;
  } | null;
}): LinkItem {
  return {
    id: value.id,
    projectId: value.projectId,
    projectName: value.project.name,
    codebaseId: value.codebaseId,
    codebaseName: value.codebase?.name ?? null,
    title: value.title,
    url: value.url,
    category: value.category,
    notes: value.notes,
    createdAt: toIso(value.createdAt),
    updatedAt: toIso(value.updatedAt),
  };
}

export function mapDropdownOption(value: {
  id: string;
  name: string;
}): DropdownOption {
  return {
    id: value.id,
    name: value.name,
  };
}
