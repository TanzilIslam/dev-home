export type GroupCount = {
  name: string;
  count: number;
};

export type RecentLink = {
  id: string;
  title: string;
  url: string;
  projectName: string;
  codebaseName: string | null;
  category: string;
  updatedAt: string;
};

export type DashboardStats = {
  totalClients: number;
  totalProjects: number;
  totalCodebases: number;
  totalLinks: number;
  projectsByStatus: GroupCount[];
  codebasesByType: GroupCount[];
  linksByCategory: GroupCount[];
  recentLinks: RecentLink[];
};
