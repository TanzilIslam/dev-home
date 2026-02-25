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
  CODEBASE_TYPE_OPTIONS,
  getLabelByValue,
} from "@/lib/constants/domain";
import { useDashboard } from "@/components/dashboard/dashboard-context";

export function CodebasesSection() {
  const {
    codebases,
    projectOptions,
    openCreateCodebaseSheet,
    openUpdateCodebaseSheet,
    openDeleteDialog,
  } = useDashboard();

  return (
    <div className="space-y-4">
      <ResourceToolbar
        title="Codebases"
        description="Manage repositories and app surfaces inside each project."
        searchValue={codebases.query}
        onSearchChange={codebases.setQuery}
        pageSize={codebases.pageSize}
        onPageSizeChange={codebases.setPageSize}
        onAdd={openCreateCodebaseSheet}
        addLabel="Add Codebase"
      />

      <div className="rounded-lg border p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={codebases.filters.projectId ?? "__all"}
            onValueChange={(value) => {
              codebases.setFilters({
                projectId: value === "__all" ? undefined : value,
              });
            }}
          >
            <SelectTrigger className="w-full sm:w-[260px]">
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All projects</SelectItem>
              {projectOptions.map((option) => (
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
              <TableHead>Project</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden lg:table-cell">Description</TableHead>
              <TableHead className="w-[160px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codebases.items.length === 0 ? (
              <TableStateRow
                colSpan={5}
                isLoading={codebases.isLoading}
                emptyMessage="No codebases found."
              />
            ) : (
              codebases.items.map((codebase) => (
                <TableRow key={codebase.id}>
                  <TableCell className="font-medium">{codebase.name}</TableCell>
                  <TableCell>{codebase.projectName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getLabelByValue(CODEBASE_TYPE_OPTIONS, codebase.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground hidden max-w-[280px] truncate lg:table-cell">
                    {codebase.description ?? "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Edit codebase ${codebase.name}`}
                        onClick={() => openUpdateCodebaseSheet(codebase)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        aria-label={`Delete codebase ${codebase.name}`}
                        onClick={() =>
                          openDeleteDialog("codebase", codebase.id, codebase.name)
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

      <ResourcePagination meta={codebases.meta} onPageChange={codebases.setPage} />
    </div>
  );
}
