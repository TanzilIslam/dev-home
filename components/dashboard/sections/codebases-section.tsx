"use client";

import { useState, useCallback } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
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
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { listFiles, listLinks } from "@/lib/supabase/queries";
import { useCancellableFetch } from "@/hooks/use-cancellable-fetch";
import { viewFile } from "@/lib/upload/download";
import type { CodebaseItem, FileItem, LinkItem } from "@/types/domain";

export function CodebasesSection() {
  const {
    codebases,
    clientOptions,
    clientOptionsLoading,
    cbFilterProjectOptions,
    cbFilterProjectLoading,
    loadCbFilterProjectDropdown,
    openCreateCodebaseSheet,
    openUpdateCodebaseSheet,
    openDeleteDialog,
  } = useDashboard();

  const [expandedCodebaseId, setExpandedCodebaseId] = useState<string | null>(null);

  function toggleExpand(codebaseId: string) {
    setExpandedCodebaseId((prev) => (prev === codebaseId ? null : codebaseId));
  }

  const totalColumns = 6; // chevron + name + client + project + description + actions

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
          loading={clientOptionsLoading}
          placeholder="Filter by client"
          allLabel="All clients"
        />
        <FilterSelect
          value={codebases.filters.projectId}
          onValueChange={(projectId) => codebases.setFilters({ ...codebases.filters, projectId })}
          options={cbFilterProjectOptions}
          loading={cbFilterProjectLoading}
          placeholder="Filter by project"
          allLabel="All projects"
          disabled={!codebases.filters.clientId}
        />
      </FilterBar>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
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
                colSpan={totalColumns}
                isLoading={codebases.isLoading}
                emptyMessage="No codebases found."
              />
            ) : (
              codebases.items.map((codebase) => (
                <CodebaseRowGroup
                  key={codebase.id}
                  codebase={codebase}
                  isExpanded={expandedCodebaseId === codebase.id}
                  totalColumns={totalColumns}
                  onToggleExpand={() => toggleExpand(codebase.id)}
                  onEdit={() => openUpdateCodebaseSheet(codebase)}
                  onDelete={() => openDeleteDialog("codebase", codebase.id, codebase.name)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ResourcePagination
        meta={codebases.meta}
        onPageChange={codebases.setPage}
        pageSize={codebases.pageSize}
        onPageSizeChange={codebases.setPageSize}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type CodebaseRowGroupProps = {
  codebase: CodebaseItem;
  isExpanded: boolean;
  totalColumns: number;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function CodebaseRowGroup({
  codebase,
  isExpanded,
  totalColumns,
  onToggleExpand,
  onEdit,
  onDelete,
}: CodebaseRowGroupProps) {
  const fetchLinks = useCallback(async (codebaseId: string) => {
    const result = await listLinks({ all: true, codebaseId });
    return result?.items ?? [];
  }, []);

  const fetchFiles = useCallback(async (codebaseId: string) => {
    const result = await listFiles({ all: true, codebaseId });
    return result?.items ?? [];
  }, []);

  const { data: expandedLinks, isLoading: isLoadingLinks } = useCancellableFetch<LinkItem[]>(
    isExpanded ? codebase.id : null,
    fetchLinks,
  );

  const { data: expandedFiles, isLoading: isLoadingFiles } = useCancellableFetch<FileItem[]>(
    isExpanded ? codebase.id : null,
    fetchFiles,
  );

  return (
    <>
      {/* Main codebase row */}
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
        <TableCell className="font-medium">
          {codebase.projectName} - {codebase.name}
        </TableCell>
        <TableCell>{codebase.clientName}</TableCell>
        <TableCell>{codebase.projectName}</TableCell>
        <TableCell className="text-muted-foreground hidden max-w-70 truncate lg:table-cell">
          {codebase.description ?? "-"}
        </TableCell>
        <TableCell>
          <ResourceActions
            editLabel={`Edit codebase ${codebase.name}`}
            deleteLabel={`Delete codebase ${codebase.name}`}
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
              {codebase.description && (
                <div className="bg-background rounded-md border">
                  <div className="border-b px-4 py-3">
                    <h4 className="text-sm font-semibold">Description</h4>
                  </div>
                  <div className="px-4 py-3">
                    <p className="text-muted-foreground whitespace-pre-wrap text-sm">
                      {codebase.description}
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
