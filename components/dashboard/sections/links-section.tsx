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
import { ResourceToolbar } from "@/components/dashboard/resource-toolbar";
import { ResourcePagination } from "@/components/dashboard/resource-pagination";
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

      <div className="rounded-lg border p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <Select
            value={links.filters.projectId ?? "__all"}
            onValueChange={(value) => {
              const projectId = value === "__all" ? undefined : value;
              links.setFilters({
                projectId,
                codebaseId: undefined,
              });
              void loadLinkFilterCodebaseDropdown(projectId);
            }}
          >
            <SelectTrigger className="w-full lg:w-[260px]">
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

          <Select
            value={links.filters.codebaseId ?? "__all"}
            onValueChange={(value) => {
              links.setFilters({
                ...links.filters,
                codebaseId: value === "__all" ? undefined : value,
              });
            }}
          >
            <SelectTrigger className="w-full lg:w-[260px]">
              <SelectValue placeholder="Filter by codebase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All codebases</SelectItem>
              {linkTableCodebaseOptions.map((option) => (
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
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Edit link ${link.title}`}
                        onClick={() => {
                          void openUpdateLinkSheet(link);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        aria-label={`Delete link ${link.title}`}
                        onClick={() =>
                          openDeleteDialog("link", link.id, link.title)
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

      <ResourcePagination meta={links.meta} onPageChange={links.setPage} />
    </div>
  );
}
