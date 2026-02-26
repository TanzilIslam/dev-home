"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ResourceActions } from "@/components/dashboard/resource-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResourceToolbar } from "@/components/dashboard/resource-toolbar";
import { ResourcePagination } from "@/components/dashboard/resource-pagination";
import { TableStateRow } from "@/components/dashboard/table-state-row";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { useAppStore } from "@/store/use-app-store";
import {
  ENGAGEMENT_TYPE_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  getLabelByValue,
} from "@/lib/constants/domain";
import { listFiles, listProjects } from "@/lib/api/client";
import { viewFile } from "@/lib/upload/download";
import { FileList } from "@/components/dashboard/file-list";
import type { FileItem, ProjectItem } from "@/types/domain";

export function ClientsSection() {
  const {
    clients,
    openCreateClientSheet,
    openUpdateClientSheet,
    openDeleteDialog,
  } = useDashboard();

  const expandedClientId = useAppStore((s) => s.expandedClientId);
  const expandedClientName = useAppStore((s) => s.expandedClientName);
  const setExpandedClient = useAppStore((s) => s.setExpandedClient);

  const [expandedProjects, setExpandedProjects] = useState<ProjectItem[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<FileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  useEffect(() => {
    if (!expandedClientId) return;

    let cancelled = false;

    listProjects({ clientId: expandedClientId, all: true })
      .then((data) => {
        if (!cancelled) {
          setExpandedProjects(data?.items ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExpandedProjects([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingProjects(false);
        }
      });

    listFiles({ clientId: expandedClientId, all: true })
      .then((data) => {
        if (!cancelled) {
          setExpandedFiles(data?.items ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExpandedFiles([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingFiles(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [expandedClientId]);

  function toggleExpand(clientId: string, clientName: string) {
    if (expandedClientId === clientId) {
      setExpandedClient(null, null);
      setExpandedProjects([]);
      setExpandedFiles([]);
    } else {
      setExpandedClient(clientId, clientName);
      setIsLoadingProjects(true);
      setIsLoadingFiles(true);
    }
  }

  const totalColumns = 6; // chevron + name + engagement + schedule + notes + actions

  return (
    <>
      <ResourceToolbar
        title="Clients"
        description="Manage client workload settings and engagement types."
        searchValue={clients.query}
        onSearchChange={clients.setQuery}
        onAdd={openCreateClientSheet}
        addLabel="Add Client"
      />

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]" />
              <TableHead>Name</TableHead>
              <TableHead>Engagement</TableHead>
              <TableHead className="hidden md:table-cell">Schedule</TableHead>
              <TableHead className="hidden lg:table-cell">Notes</TableHead>
              <TableHead className="w-[160px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.items.length === 0 ? (
              <TableStateRow
                colSpan={totalColumns}
                isLoading={clients.isLoading}
                emptyMessage="No clients found."
              />
            ) : (
              clients.items.map((client) => {
                const isExpanded = expandedClientId === client.id;

                return (
                  <ClientRowGroup
                    key={client.id}
                    client={client}
                    isExpanded={isExpanded}
                    totalColumns={totalColumns}
                    isLoadingProjects={isLoadingProjects}
                    expandedProjects={expandedProjects}
                    expandedFiles={expandedFiles}
                    isLoadingFiles={isLoadingFiles}
                    expandedClientName={expandedClientName}
                    onToggleExpand={() => toggleExpand(client.id, client.name)}
                    onEdit={() => openUpdateClientSheet(client)}
                    onDelete={() =>
                      openDeleteDialog("client", client.id, client.name)
                    }
                  />
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ResourcePagination meta={clients.meta} onPageChange={clients.setPage} pageSize={clients.pageSize} onPageSizeChange={clients.setPageSize} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type ClientRowGroupProps = {
  client: {
    id: string;
    name: string;
    engagementType: string;
    workingDaysPerWeek: number | null;
    workingHoursPerDay: number | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
    address: string | null;
    notes: string | null;
  };
  isExpanded: boolean;
  totalColumns: number;
  isLoadingProjects: boolean;
  expandedProjects: ProjectItem[];
  expandedFiles: FileItem[];
  isLoadingFiles: boolean;
  expandedClientName: string | null;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function ClientRowGroup({
  client,
  isExpanded,
  totalColumns,
  isLoadingProjects,
  expandedProjects,
  expandedFiles,
  isLoadingFiles,
  expandedClientName,
  onToggleExpand,
  onEdit,
  onDelete,
}: ClientRowGroupProps) {
  return (
    <>
      {/* Main client row */}
      <TableRow
        className="cursor-pointer"
        onClick={onToggleExpand}
      >
        <TableCell className="w-[40px] px-2">
          <Button
            variant="ghost"
            size="sm"
            className="size-7 p-0"
            aria-label={isExpanded ? "Collapse row" : "Expand row"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-medium">{client.name}</TableCell>
        <TableCell>
          <Badge variant="secondary">
            {getLabelByValue(ENGAGEMENT_TYPE_OPTIONS, client.engagementType)}
          </Badge>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {client.workingDaysPerWeek && client.workingHoursPerDay
            ? `${client.workingDaysPerWeek}d / ${client.workingHoursPerDay}h`
            : "-"}
        </TableCell>
        <TableCell className="text-muted-foreground hidden max-w-[280px] truncate lg:table-cell">
          {client.notes ?? "-"}
        </TableCell>
        <TableCell>
          <ResourceActions
            editLabel={`Edit client ${client.name}`}
            deleteLabel={`Delete client ${client.name}`}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </TableCell>
      </TableRow>

      {/* Expanded detail row */}
      {isExpanded && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={totalColumns} className="bg-muted/40 p-4">
            <div className="space-y-4">
              {/* Client detail card */}
              <div className="rounded-md border bg-background p-4">
                <h3 className="mb-2 text-sm font-semibold">
                  {expandedClientName ?? client.name} &mdash; Details
                </h3>
                <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-muted-foreground">Engagement Type</dt>
                    <dd>
                      {getLabelByValue(
                        ENGAGEMENT_TYPE_OPTIONS,
                        client.engagementType,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Schedule</dt>
                    <dd>
                      {client.workingDaysPerWeek && client.workingHoursPerDay
                        ? `${client.workingDaysPerWeek} days/week, ${client.workingHoursPerDay} hours/day`
                        : "Not set"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd>{client.email ?? "None"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd>{client.phone ?? "None"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">WhatsApp</dt>
                    <dd>{client.whatsapp ?? "None"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Address</dt>
                    <dd>{client.address ?? "None"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Notes</dt>
                    <dd>{client.notes ?? "None"}</dd>
                  </div>
                </dl>
              </div>

              {/* Projects sub-table */}
              <div className="rounded-md border bg-background">
                <div className="border-b px-4 py-3">
                  <h4 className="text-sm font-semibold">Projects</h4>
                </div>
                {isLoadingProjects ? (
                  <div className="flex items-center justify-center gap-2 py-8">
                    <Spinner className="size-4" />
                    <span className="text-muted-foreground text-sm">
                      Loading projects...
                    </span>
                  </div>
                ) : expandedProjects.length === 0 ? (
                  <div className="py-8 text-center">
                    <span className="text-muted-foreground text-sm">
                      No projects found for this client.
                    </span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expandedProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">
                            {project.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {getLabelByValue(
                                PROJECT_STATUS_OPTIONS,
                                project.status,
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[320px] truncate">
                            {project.description ?? "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Files sub-section */}
              <div className="rounded-md border bg-background">
                <div className="border-b px-4 py-3">
                  <h4 className="text-sm font-semibold">Files</h4>
                </div>
                <div className="px-4 py-3">
                  <FileList
                    files={expandedFiles}
                    isLoading={isLoadingFiles}
                    readOnly
                    onView={viewFile}
                  />
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
