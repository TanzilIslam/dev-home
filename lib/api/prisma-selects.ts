export const CLIENT_SELECT = {
  id: true,
  name: true,
  engagementType: true,
  workingDaysPerWeek: true,
  workingHoursPerDay: true,
  email: true,
  phone: true,
  whatsapp: true,
  address: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const PROJECT_SELECT = {
  id: true,
  clientId: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { name: true } },
} as const;

export const CODEBASE_SELECT = {
  id: true,
  projectId: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { name: true, clientId: true, client: { select: { name: true } } } },
} as const;

export const LINK_SELECT = {
  id: true,
  clientId: true,
  projectId: true,
  codebaseId: true,
  title: true,
  url: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { name: true } },
  project: { select: { name: true } },
  codebase: { select: { name: true } },
} as const;

export const FILE_SELECT = {
  id: true,
  clientId: true,
  projectId: true,
  codebaseId: true,
  filename: true,
  mimeType: true,
  sizeBytes: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const DROPDOWN_SELECT = {
  id: true,
  name: true,
} as const;
