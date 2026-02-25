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

      <FilterBar>
        <FilterSelect
          value={codebases.filters.projectId}
          onValueChange={(projectId) => codebases.setFilters({ projectId })}
          options={projectOptions}
          placeholder="Filter by project"
          allLabel="All projects"
        />
      </FilterBar>

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
                    <ResourceActions
                      editLabel={`Edit codebase ${codebase.name}`}
                      deleteLabel={`Delete codebase ${codebase.name}`}
                      onEdit={() => openUpdateCodebaseSheet(codebase)}
                      onDelete={() => openDeleteDialog("codebase", codebase.id, codebase.name)}
                    />
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
