"use client";

import { useState, useCallback } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResourcePagination } from "@/components/dashboard/resource-pagination";
import { ResourceToolbar } from "@/components/dashboard/resource-toolbar";
import { FilterBar, FilterSelect } from "@/components/dashboard/filter-bar";
import { ResourceActions } from "@/components/dashboard/resource-actions";
import { TableStateRow } from "@/components/dashboard/table-state-row";
import { FileList } from "@/components/dashboard/file-list";
import { PROJECT_STATUS_OPTIONS, getLabelByValue } from "@/lib/constants/domain";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { listFiles, listLinks } from "@/lib/supabase/queries";
import { useCancellableFetch } from "@/hooks/use-cancellable-fetch";
import { viewFile } from "@/lib/upload/download";
import type { FileItem, LinkItem, ProjectItem } from "@/types/domain";

export function ProjectsSection() {
  const {
    projects,
    clientOptions,
    clientOptionsLoading,
    openCreateProjectSheet,
    openUpdateProjectSheet,
    openDeleteDialog,
  } = useDashboard();

  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  function toggleExpand(projectId: string) {
    setExpandedProjectId((prev) => (prev === projectId ? null : projectId));
  }

  const totalColumns = 6; // chevron + name + client + status + description + actions

  return (
    <div className="space-y-4">
      <ResourceToolbar
        title="Projects"
        description="Track projects under each client and monitor status."
        searchValue={projects.query}
        onSearchChange={projects.setQuery}
        onAdd={openCreateProjectSheet}
        addLabel="Add Project"
      />

      <FilterBar>
        <FilterSelect
          value={projects.filters.clientId}
          onValueChange={(clientId) => projects.setFilters({ clientId })}
          options={clientOptions}
          loading={clientOptionsLoading}
          placeholder="Filter by client"
          allLabel="All clients"
        />
      </FilterBar>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden lg:table-cell">Description</TableHead>
              <TableHead className="w-[160px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.items.length === 0 ? (
              <TableStateRow
                colSpan={totalColumns}
                isLoading={projects.isLoading}
                emptyMessage="No projects found."
              />
            ) : (
              projects.items.map((project) => (
                <ProjectRowGroup
                  key={project.id}
                  project={project}
                  isExpanded={expandedProjectId === project.id}
                  totalColumns={totalColumns}
                  onToggleExpand={() => toggleExpand(project.id)}
                  onEdit={() => openUpdateProjectSheet(project)}
                  onDelete={() => openDeleteDialog("project", project.id, project.name)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ResourcePagination
        meta={projects.meta}
        onPageChange={projects.setPage}
        pageSize={projects.pageSize}
        onPageSizeChange={projects.setPageSize}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type ProjectRowGroupProps = {
  project: ProjectItem;
  isExpanded: boolean;
  totalColumns: number;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function ProjectRowGroup({
  project,
  isExpanded,
  totalColumns,
  onToggleExpand,
  onEdit,
  onDelete,
}: ProjectRowGroupProps) {
  const fetchLinks = useCallback(async (projectId: string) => {
    const result = await listLinks({ all: true, projectId });
    return result?.items ?? [];
  }, []);

  const fetchFiles = useCallback(async (projectId: string) => {
    const result = await listFiles({ all: true, projectId });
    return result?.items ?? [];
  }, []);

  const { data: expandedLinks, isLoading: isLoadingLinks } = useCancellableFetch<LinkItem[]>(
    isExpanded ? project.id : null,
    fetchLinks,
  );

  const { data: expandedFiles, isLoading: isLoadingFiles } = useCancellableFetch<FileItem[]>(
    isExpanded ? project.id : null,
    fetchFiles,
  );

  return (
    <>
      {/* Main project row */}
      <TableRow className="cursor-pointer" onClick={onToggleExpand}>
        <TableCell className="w-10 px-2">
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
            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </Button>
        </TableCell>
        <TableCell className="font-medium">{project.name}</TableCell>
        <TableCell>{project.clientName}</TableCell>
        <TableCell>
          <Badge
            variant={
              project.status === "ACTIVE"
                ? "default"
                : project.status === "PAUSED"
                  ? "secondary"
                  : "outline"
            }
          >
            {getLabelByValue(PROJECT_STATUS_OPTIONS, project.status)}
          </Badge>
        </TableCell>
        <TableCell className="text-muted-foreground hidden max-w-75 truncate lg:table-cell">
          {project.description ?? "-"}
        </TableCell>
        <TableCell>
          <ResourceActions
            editLabel={`Edit project ${project.name}`}
            deleteLabel={`Delete project ${project.name}`}
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
              {/* Links sub-section */}
              <div className="bg-background rounded-md border">
                <div className="border-b px-4 py-3">
                  <h4 className="text-sm font-semibold">Links</h4>
                </div>
                {isLoadingLinks ? (
                  <div className="flex items-center justify-center gap-2 py-6">
                    <Spinner className="size-4" />
                    <span className="text-muted-foreground text-sm">Loading links...</span>
                  </div>
                ) : !expandedLinks || expandedLinks.length === 0 ? (
                  <p className="text-muted-foreground px-4 py-3 text-sm">No links attached.</p>
                ) : (
                  <ul className="divide-y">
                    {expandedLinks.map((link) => (
                      <li key={link.id} className="flex items-center gap-3 px-4 py-2">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {link.title}
                        </span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary min-w-0 flex-1 truncate text-sm underline-offset-4 hover:underline"
                        >
                          {link.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Description */}
              {project.description && (
                <div className="bg-background rounded-md border">
                  <div className="border-b px-4 py-3">
                    <h4 className="text-sm font-semibold">Description</h4>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                      {project.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Files sub-section */}
              <div className="bg-background rounded-md border">
                <div className="border-b px-4 py-3">
                  <h4 className="text-sm font-semibold">Files</h4>
                </div>
                <div className="px-4 py-3">
                  <FileList
                    files={expandedFiles ?? []}
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
