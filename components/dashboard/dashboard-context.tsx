"use client";

import { createContext, useContext, type FormEventHandler } from "react";
import type { FormErrorMap } from "@/lib/form-utils";
import type { ClientItem, CodebaseItem, LinkItem, ProjectItem } from "@/types/domain";
import type {
  ClientFormValues,
  CodebaseFormValues,
  DashboardEntity,
  LinkFormValues,
  ProjectFormValues,
  SelectOption,
  SheetMode,
} from "@/types/dashboard";
import type { UsePaginatedListReturn } from "@/hooks/use-paginated-list";

// ---------------------------------------------------------------------------
// Field-name union types (one per entity form)
// ---------------------------------------------------------------------------

export type ClientField =
  | "name"
  | "engagementType"
  | "workingDaysPerWeek"
  | "workingHoursPerDay"
  | "notes";

export type ProjectField = "clientId" | "name" | "description" | "status";

export type CodebaseField = "projectId" | "name" | "type" | "description";

export type LinkField =
  | "projectId"
  | "codebaseId"
  | "title"
  | "url"
  | "category"
  | "notes";

// ---------------------------------------------------------------------------
// Composite state types
// ---------------------------------------------------------------------------

export type MutationAction = SheetMode | "delete";

export type SheetState = {
  open: boolean;
  entity: DashboardEntity | null;
  mode: SheetMode;
  id: string | null;
};

export type DeleteState = {
  open: boolean;
  entity: DashboardEntity | null;
  id: string | null;
  label: string;
};

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------

export type DashboardContextValue = {
  user: { email: string; name: string | null };

  // Paginated lists
  clients: UsePaginatedListReturn<ClientItem, Record<string, never>>;
  projects: UsePaginatedListReturn<ProjectItem, { clientId?: string }>;
  codebases: UsePaginatedListReturn<CodebaseItem, { projectId?: string }>;
  links: UsePaginatedListReturn<
    LinkItem,
    { projectId?: string; codebaseId?: string }
  >;

  // Sheet (create / update form)
  sheetState: SheetState;
  isSheetSubmitting: boolean;
  handleSheetOpenChange: (open: boolean) => void;
  handleSheetSubmit: FormEventHandler<HTMLFormElement>;
  sheetTitle: string;
  sheetDescription: string;

  // Delete dialog
  deleteState: DeleteState;
  isDeleting: boolean;
  openDeleteDialog: (
    entity: DashboardEntity,
    id: string,
    label: string,
  ) => void;
  closeDeleteDialog: (open: boolean) => void;
  handleDeleteConfirm: () => void;

  // Client form
  clientFormValues: ClientFormValues;
  setClientFormValues: React.Dispatch<React.SetStateAction<ClientFormValues>>;
  clientErrors: FormErrorMap<ClientField>;
  setClientErrors: React.Dispatch<
    React.SetStateAction<FormErrorMap<ClientField>>
  >;
  openCreateClientSheet: () => void;
  openUpdateClientSheet: (client: ClientItem) => void;

  // Project form
  projectFormValues: ProjectFormValues;
  setProjectFormValues: React.Dispatch<
    React.SetStateAction<ProjectFormValues>
  >;
  projectErrors: FormErrorMap<ProjectField>;
  setProjectErrors: React.Dispatch<
    React.SetStateAction<FormErrorMap<ProjectField>>
  >;
  openCreateProjectSheet: () => void;
  openUpdateProjectSheet: (project: ProjectItem) => void;

  // Codebase form
  codebaseFormValues: CodebaseFormValues;
  setCodebaseFormValues: React.Dispatch<
    React.SetStateAction<CodebaseFormValues>
  >;
  codebaseErrors: FormErrorMap<CodebaseField>;
  setCodebaseErrors: React.Dispatch<
    React.SetStateAction<FormErrorMap<CodebaseField>>
  >;
  openCreateCodebaseSheet: () => void;
  openUpdateCodebaseSheet: (codebase: CodebaseItem) => void;

  // Link form
  linkFormValues: LinkFormValues;
  setLinkFormValues: React.Dispatch<React.SetStateAction<LinkFormValues>>;
  linkErrors: FormErrorMap<LinkField>;
  setLinkErrors: React.Dispatch<
    React.SetStateAction<FormErrorMap<LinkField>>
  >;
  linkFormCodebaseOptions: SelectOption[];
  loadLinkFormCodebaseDropdown: (projectId?: string) => Promise<void>;
  openCreateLinkSheet: () => void;
  openUpdateLinkSheet: (link: LinkItem) => void;

  // Reference dropdown options
  clientOptions: SelectOption[];
  projectOptions: SelectOption[];
  codebaseOptions: SelectOption[];
  linkFilterCodebaseOptions: SelectOption[];
  loadLinkFilterCodebaseDropdown: (projectId?: string) => Promise<void>;
};

// ---------------------------------------------------------------------------
// Context & hook
// ---------------------------------------------------------------------------

export const DashboardContext = createContext<DashboardContextValue | null>(
  null,
);

export function useDashboard(): DashboardContextValue {
  const ctx = useContext(DashboardContext);

  if (!ctx) {
    throw new Error("useDashboard must be used within a <DashboardContext.Provider>");
  }

  return ctx;
}
