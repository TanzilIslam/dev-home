export type GroupCount = {
  name: string;
  count: number;
};

export type RecentLink = {
  id: string;
  title: string;
  url: string;
  clientName: string | null;
  projectName: string | null;
  codebaseName: string | null;
  updatedAt: string;
};

export type DashboardStats = {
  totalClients: number;
  totalProjects: number;
  totalCodebases: number;
  totalLinks: number;
  projectsByStatus: GroupCount[];
  recentLinks: RecentLink[];
};
