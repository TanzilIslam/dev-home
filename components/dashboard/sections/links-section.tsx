"use client";

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
import { FilterBar, FilterSelect } from "@/components/dashboard/filter-bar";
import { ResourceActions } from "@/components/dashboard/resource-actions";
import { TableStateRow } from "@/components/dashboard/table-state-row";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { joinLabels } from "@/lib/constants/domain";

export function LinksSection() {
  const {
    links,
    clientOptions,
    linkFilterProjectOptions,
    loadLinkFilterProjectDropdown,
    linkFilterCodebaseOptions,
    loadLinkFilterCodebaseDropdown,
    openCreateLinkSheet,
    openUpdateLinkSheet,
    openDeleteDialog,
  } = useDashboard();

  return (
    <div className="space-y-4">
      <ResourceToolbar
        title="Links"
        description="Save custom links by project and optional codebase."
        searchValue={links.query}
        onSearchChange={links.setQuery}
        onAdd={openCreateLinkSheet}
        addLabel="Add Link"
      />

      <FilterBar className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <FilterSelect
          value={links.filters.clientId}
          onValueChange={(clientId) => {
            links.setFilters({ clientId, projectId: undefined, codebaseId: undefined });
            loadLinkFilterProjectDropdown(clientId).catch(() => {});
          }}
          options={clientOptions}
          placeholder="Filter by client"
          allLabel="All clients"
          triggerClassName="w-full lg:w-[260px]"
        />
        <FilterSelect
          value={links.filters.projectId}
          onValueChange={(projectId) => {
            links.setFilters({ ...links.filters, projectId, codebaseId: undefined });
            loadLinkFilterCodebaseDropdown(projectId).catch(() => {});
          }}
          options={linkFilterProjectOptions}
          placeholder="Filter by project"
          allLabel="All projects"
          disabled={!links.filters.clientId}
          triggerClassName="w-full lg:w-[260px]"
        />
        <FilterSelect
          value={links.filters.codebaseId}
          onValueChange={(codebaseId) => {
            links.setFilters({ ...links.filters, codebaseId });
          }}
          options={linkFilterCodebaseOptions}
          placeholder="Filter by codebase"
          allLabel="All codebases"
          disabled={!links.filters.projectId}
          triggerClassName="w-full lg:w-[260px]"
        />
      </FilterBar>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden sm:table-cell">URL</TableHead>
              <TableHead className="hidden md:table-cell">Client</TableHead>
              <TableHead className="hidden lg:table-cell">Project</TableHead>
              <TableHead className="hidden xl:table-cell">Codebase</TableHead>
              <TableHead className="w-[160px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.items.length === 0 ? (
              <TableStateRow
                colSpan={6}
                isLoading={links.isLoading}
                emptyMessage="No links found."
              />
            ) : (
              links.items.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{joinLabels(link.projectName, link.codebaseName, link.title)}</TableCell>
                  <TableCell className="hidden max-w-70 truncate sm:table-cell">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${link.title} in a new tab`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {link.url}
                    </a>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {link.clientName ?? "-"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {link.projectName ?? "-"}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    {link.codebaseName ?? "-"}
                  </TableCell>
                  <TableCell>
                    <ResourceActions
                      editLabel={`Edit link ${link.title}`}
                      deleteLabel={`Delete link ${link.title}`}
                      onEdit={() => openUpdateLinkSheet(link)}
                      onDelete={() => openDeleteDialog("link", link.id, link.title)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ResourcePagination meta={links.meta} onPageChange={links.setPage} pageSize={links.pageSize} onPageSizeChange={links.setPageSize} />
    </div>
  );
}
