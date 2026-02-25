"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

      <div className="rounded-lg border p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={projects.filters.clientId ?? "__all"}
            onValueChange={(value) => {
              projects.setFilters({
                clientId: value === "__all" ? undefined : value,
              });
            }}
          >
            <SelectTrigger className="w-full sm:w-[260px]">
              <SelectValue placeholder="Filter by client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All clients</SelectItem>
              {clientOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

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
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Edit project ${project.name}`}
                        onClick={() => openUpdateProjectSheet(project)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        aria-label={`Delete project ${project.name}`}
                        onClick={() =>
                          openDeleteDialog("project", project.id, project.name)
                        }
                      >
                        Delete
                      </Button>
                    </div>
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
