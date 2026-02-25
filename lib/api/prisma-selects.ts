export const CLIENT_SELECT = {
  id: true,
  name: true,
  engagementType: true,
  workingDaysPerWeek: true,
  workingHoursPerDay: true,
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
  type: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { name: true } },
} as const;

export const LINK_SELECT = {
  id: true,
  projectId: true,
  codebaseId: true,
  title: true,
  url: true,
  category: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { name: true } },
  codebase: { select: { name: true } },
} as const;

export const DROPDOWN_SELECT = {
  id: true,
  name: true,
} as const;
