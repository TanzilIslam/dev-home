import type {
  ClientItem,
  CodebaseItem,
  DropdownOption,
  FileItem,
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
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
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
    email: value.email,
    phone: value.phone,
    whatsapp: value.whatsapp,
    address: value.address,
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
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    name: string;
    clientId: string;
    client: { name: string };
  };
}): CodebaseItem {
  return {
    id: value.id,
    clientId: value.project.clientId,
    clientName: value.project.client.name,
    projectId: value.projectId,
    projectName: value.project.name,
    name: value.name,
    description: value.description,
    createdAt: toIso(value.createdAt),
    updatedAt: toIso(value.updatedAt),
  };
}

export function mapLinkItem(value: {
  id: string;
  clientId: string | null;
  projectId: string | null;
  codebaseId: string | null;
  title: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
  client: { name: string } | null;
  project: { name: string } | null;
  codebase: { name: string } | null;
}): LinkItem {
  return {
    id: value.id,
    clientId: value.clientId,
    clientName: value.client?.name ?? null,
    projectId: value.projectId,
    projectName: value.project?.name ?? null,
    codebaseId: value.codebaseId,
    codebaseName: value.codebase?.name ?? null,
    title: value.title,
    url: value.url,
    createdAt: toIso(value.createdAt),
    updatedAt: toIso(value.updatedAt),
  };
}

export function mapFileItem(value: {
  id: string;
  clientId: string | null;
  projectId: string | null;
  codebaseId: string | null;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  updatedAt: Date;
}): FileItem {
  return {
    id: value.id,
    clientId: value.clientId,
    projectId: value.projectId,
    codebaseId: value.codebaseId,
    filename: value.filename,
    mimeType: value.mimeType,
    sizeBytes: value.sizeBytes,
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
