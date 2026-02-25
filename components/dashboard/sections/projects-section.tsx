"use client";

import { Badge } from "@/components/ui/badge";
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
import {
  PROJECT_STATUS_OPTIONS,
  getLabelByValue,
} from "@/lib/constants/domain";
import { useDashboard } from "@/components/dashboard/dashboard-context";

export function ProjectsSection() {
  const {
    projects,
    clientOptions,
    openCreateProjectSheet,
    openUpdateProjectSheet,
    openDeleteDialog,
  } = useDashboard();

  return (
    <div className="space-y-4">
      <ResourceToolbar
        title="Projects"
        description="Track projects under each client and monitor status."
        searchValue={projects.query}
        onSearchChange={projects.setQuery}
        pageSize={projects.pageSize}
        onPageSizeChange={projects.setPageSize}
        onAdd={openCreateProjectSheet}
        addLabel="Add Project"
      />

      <FilterBar>
        <FilterSelect
          value={projects.filters.clientId}
          onValueChange={(clientId) => projects.setFilters({ clientId })}
          options={clientOptions}
          placeholder="Filter by client"
          allLabel="All clients"
        />
      </FilterBar>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
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
                colSpan={5}
                isLoading={projects.isLoading}
                emptyMessage="No projects found."
              />
            ) : (
              projects.items.map((project) => (
                <TableRow key={project.id}>
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
                  <TableCell className="text-muted-foreground hidden max-w-[300px] truncate lg:table-cell">
                    {project.description ?? "-"}
                  </TableCell>
                  <TableCell>
                    <ResourceActions
                      editLabel={`Edit project ${project.name}`}
                      deleteLabel={`Delete project ${project.name}`}
                      onEdit={() => openUpdateProjectSheet(project)}
                      onDelete={() => openDeleteDialog("project", project.id, project.name)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ResourcePagination meta={projects.meta} onPageChange={projects.setPage} />
    </div>
  );
}
