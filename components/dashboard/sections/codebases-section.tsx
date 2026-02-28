"use client";

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
import { useDashboard } from "@/components/dashboard/dashboard-context";

export function CodebasesSection() {
  const {
    codebases,
    clientOptions,
    cbFilterProjectOptions,
    loadCbFilterProjectDropdown,
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
        onAdd={openCreateCodebaseSheet}
        addLabel="Add Codebase"
      />

      <FilterBar>
        <FilterSelect
          value={codebases.filters.clientId}
          onValueChange={(clientId) => {
            codebases.setFilters({ clientId, projectId: undefined });
            loadCbFilterProjectDropdown(clientId).catch(() => {});
          }}
          options={clientOptions}
          placeholder="Filter by client"
          allLabel="All clients"
        />
        <FilterSelect
          value={codebases.filters.projectId}
          onValueChange={(projectId) => codebases.setFilters({ ...codebases.filters, projectId })}
          options={cbFilterProjectOptions}
          placeholder="Filter by project"
          allLabel="All projects"
          disabled={!codebases.filters.clientId}
        />
      </FilterBar>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Project</TableHead>
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
                  <TableCell className="font-medium">{codebase.projectName} - {codebase.name}</TableCell>
                  <TableCell>{codebase.clientName}</TableCell>
                  <TableCell>{codebase.projectName}</TableCell>
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

      <ResourcePagination meta={codebases.meta} onPageChange={codebases.setPage} pageSize={codebases.pageSize} onPageSizeChange={codebases.setPageSize} />
    </div>
  );
}
