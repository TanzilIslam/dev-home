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
import { ResourceToolbar } from "@/components/dashboard/resource-toolbar";
import { ResourcePagination } from "@/components/dashboard/resource-pagination";
import { FilterBar, FilterSelect } from "@/components/dashboard/filter-bar";
import { ResourceActions } from "@/components/dashboard/resource-actions";
import { TableStateRow } from "@/components/dashboard/table-state-row";
import { LINK_CATEGORY_OPTIONS, getLabelByValue } from "@/lib/constants/domain";
import { useDashboard } from "@/components/dashboard/dashboard-context";

export function LinksSection() {
  const {
    links,
    projectOptions,
    codebaseOptions,
    linkFilterCodebaseOptions,
    loadLinkFilterCodebaseDropdown,
    openCreateLinkSheet,
    openUpdateLinkSheet,
    openDeleteDialog,
  } = useDashboard();

  const linkTableCodebaseOptions =
    links.filters.projectId && linkFilterCodebaseOptions.length > 0
      ? linkFilterCodebaseOptions
      : codebaseOptions;

  return (
    <div className="space-y-4">
      <ResourceToolbar
        title="Links"
        description="Save custom links by project and optional codebase."
        searchValue={links.query}
        onSearchChange={links.setQuery}
        pageSize={links.pageSize}
        onPageSizeChange={links.setPageSize}
        onAdd={() => {
          void openCreateLinkSheet();
        }}
        addLabel="Add Link"
      />

      <FilterBar className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <FilterSelect
          value={links.filters.projectId}
          onValueChange={(projectId) => {
            links.setFilters({ projectId, codebaseId: undefined });
            void loadLinkFilterCodebaseDropdown(projectId);
          }}
          options={projectOptions}
          placeholder="Filter by project"
          allLabel="All projects"
          triggerClassName="w-full lg:w-[260px]"
        />
        <FilterSelect
          value={links.filters.codebaseId}
          onValueChange={(codebaseId) => {
            links.setFilters({ ...links.filters, codebaseId });
          }}
          options={linkTableCodebaseOptions}
          placeholder="Filter by codebase"
          allLabel="All codebases"
          triggerClassName="w-full lg:w-[260px]"
        />
      </FilterBar>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Project</TableHead>
              <TableHead className="hidden lg:table-cell">Codebase</TableHead>
              <TableHead className="hidden xl:table-cell">URL</TableHead>
              <TableHead>Category</TableHead>
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
                  <TableCell className="font-medium">{link.title}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {link.projectName}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {link.codebaseName ?? "-"}
                  </TableCell>
                  <TableCell className="hidden max-w-[280px] truncate xl:table-cell">
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
                  <TableCell>
                    <Badge variant="outline">
                      {getLabelByValue(LINK_CATEGORY_OPTIONS, link.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ResourceActions
                      editLabel={`Edit link ${link.title}`}
                      deleteLabel={`Delete link ${link.title}`}
                      onEdit={() => { void openUpdateLinkSheet(link); }}
                      onDelete={() => openDeleteDialog("link", link.id, link.title)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ResourcePagination meta={links.meta} onPageChange={links.setPage} />
    </div>
  );
}
