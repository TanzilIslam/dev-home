"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEventHandler,
} from "react";
import { toast } from "sonner";
import {
  ApiRequestError,
  createClient,
  createCodebase,
  createLink,
  createProject,
  deleteClient,
  deleteCodebase,
  deleteLink,
  deleteProject,
  listClientDropdown,
  listClients,
  listCodebaseDropdown,
  listCodebases,
  listLinks,
  listProjectDropdown,
  listProjects,
  updateClient,
  updateCodebase,
  updateLink,
  updateProject,
} from "@/lib/api/client";
import {
  ENGAGEMENT_TYPE_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  toEngagementType,
  toProjectStatus,
} from "@/lib/constants/domain";
import {
  toNullableNumber,
  toNullableText,
  toValidationErrors,
  type FormErrorMap,
} from "@/lib/form-utils";
import { showRequestError } from "@/lib/form-error-handler";
import {
  clientPayloadSchema,
  codebasePayloadSchema,
  linkPayloadSchema,
  projectPayloadSchema,
} from "@/lib/validation/dashboard";
import { useDropdownLoader } from "@/hooks/use-dropdown-loader";
import { useFileUpload } from "@/hooks/use-file-upload";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import { useAppStore, sectionFromPathname, type DashboardSection } from "@/store/use-app-store";
import { downloadFile, viewFile } from "@/lib/upload/download";
import type {
  ClientItem,
  CodebaseItem,
  LinkItem,
  ProjectItem,
} from "@/types/domain";
import {
  DEFAULT_CLIENT_FORM_VALUES,
  DEFAULT_CODEBASE_FORM_VALUES,
  DEFAULT_LINK_FORM_VALUES,
  DEFAULT_PROJECT_FORM_VALUES,
  type DashboardEntity,
  type SheetMode,
} from "@/types/dashboard";
import { FormErrorText } from "@/components/ui/form-error-text";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  DashboardContext,
  type SheetState,
  type DeleteState,
} from "@/components/dashboard/dashboard-context";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { GlobalDeleteDialog } from "@/components/dashboard/global-delete-dialog";
import { GlobalFormSheet } from "@/components/dashboard/global-form-sheet";
import { NetworkActivityIndicator } from "@/components/dashboard/network-activity-indicator";
import { ClientsSection } from "@/components/dashboard/sections/clients-section";
import { ProjectsSection } from "@/components/dashboard/sections/projects-section";
import { CodebasesSection } from "@/components/dashboard/sections/codebases-section";
import { LinksSection } from "@/components/dashboard/sections/links-section";
import { OverviewSection } from "@/components/dashboard/sections/overview-section";
import { SettingsSection } from "@/components/dashboard/sections/settings-section";
import { FileUploadInput } from "@/components/dashboard/file-upload-input";
import { FileList } from "@/components/dashboard/file-list";

type DashboardAppProps = {
  user: {
    email: string;
    name: string | null;
  };
  initialSection?: DashboardSection;
};

type MutationAction = SheetMode | "delete";

const EMPTY_FILTERS: Record<string, never> = {};

const INITIAL_SHEET_STATE: SheetState = {
  open: false,
  entity: null,
  mode: "create",
  id: null,
};

const INITIAL_DELETE_STATE: DeleteState = {
  open: false,
  entity: null,
  id: null,
  label: "",
};

const CLIENT_FIELDS = [
  "name",
  "engagementType",
  "workingDaysPerWeek",
  "workingHoursPerDay",
  "email",
  "phone",
  "whatsapp",
  "address",
  "notes",
] as const;
const PROJECT_FIELDS = ["clientId", "name", "description", "status"] as const;
const CODEBASE_FIELDS = ["projectId", "name", "description"] as const;
const LINK_FIELDS = [
  "clientId",
  "projectId",
  "codebaseId",
  "title",
  "url",
] as const;

function getEntityLabel(entity: DashboardEntity) {
  switch (entity) {
    case "client":
      return "Client";
    case "project":
      return "Project";
    case "codebase":
      return "Codebase";
    case "link":
      return "Link";
    default:
      return "Item";
  }
}

function ActiveSection({ user }: { user: DashboardAppProps["user"] }) {
  const activeSection = useAppStore((s) => s.activeSection);

  switch (activeSection) {
    case "overview":
      return <OverviewSection />;
    case "clients":
      return <ClientsSection />;
    case "projects":
      return <ProjectsSection />;
    case "codebases":
      return <CodebasesSection />;
    case "links":
      return <LinksSection />;
    case "profile":
      return <SettingsSection user={user} />;
    default:
      return <OverviewSection />;
  }
}

export function DashboardApp({ user, initialSection }: DashboardAppProps) {
  // Set store synchronously so server and client render the same section
  const initializedRef = useRef(false);
  if (!initializedRef.current) {
    initializedRef.current = true;
    if (initialSection && initialSection !== "overview") {
      useAppStore.setState({
        activeSection: initialSection,
        expandedClientId: null,
        expandedClientName: null,
      });
    }
  }

  // Handle browser back/forward
  useEffect(() => {
    function handlePopState() {
      const section = sectionFromPathname(window.location.pathname);
      useAppStore.setState({
        activeSection: section,
        expandedClientId: null,
        expandedClientName: null,
      });
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [sheetState, setSheetState] = useState<SheetState>(INITIAL_SHEET_STATE);
  const [deleteState, setDeleteState] = useState<DeleteState>(INITIAL_DELETE_STATE);
  const [isSheetSubmitting, setIsSheetSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { options: clientOptions, load: loadClientOptions } = useDropdownLoader(listClientDropdown);
  const { options: projectOptions, load: loadProjectOptions } = useDropdownLoader(listProjectDropdown);
  const { options: codebaseOptions, load: loadCodebaseOptions } = useDropdownLoader(listCodebaseDropdown);
  const { options: codebaseFormProjectOptions, load: loadCbFormPj, clear: clearCbFormPj } = useDropdownLoader(listProjectDropdown);
  const { options: linkFormProjectOptions, load: loadLinkFormPj, clear: clearLinkFormPj } = useDropdownLoader(listProjectDropdown);
  const { options: linkFormCodebaseOptions, load: loadLinkFormCb, clear: clearLinkFormCb } = useDropdownLoader(listCodebaseDropdown);
  const { options: cbFilterProjectOptions, load: loadCbFilterPj, clear: clearCbFilterPj } = useDropdownLoader(listProjectDropdown);
  const { options: linkFilterProjectOptions, load: loadLinkFilterPj, clear: clearLinkFilterPj } = useDropdownLoader(listProjectDropdown);
  const { options: linkFilterCodebaseOptions, load: loadLinkFilterCb, clear: clearLinkFilterCb } = useDropdownLoader(listCodebaseDropdown);
  const clientFileUpload = useFileUpload({
    scope: {
      clientId:
        sheetState.entity === "client" && sheetState.mode === "update" && sheetState.id
          ? sheetState.id
          : undefined,
    },
  });

  const lastListErrorRef = useRef("");
  const lastListErrorAtRef = useRef(0);

  const handleListError = useCallback(
    (error: unknown, fallbackMessage: string) => {
      const message =
        error instanceof ApiRequestError ? error.message : fallbackMessage;
      const now = Date.now();

      if (
        message === lastListErrorRef.current &&
        now - lastListErrorAtRef.current < 3000
      ) {
        return;
      }

      lastListErrorRef.current = message;
      lastListErrorAtRef.current = now;
      toast.error(message);
    },
    [],
  );

  const clients = usePaginatedList<ClientItem, Record<string, never>>({
    fetcher: listClients,
    initialFilters: EMPTY_FILTERS,
    onError: (error) => handleListError(error, "Unable to fetch clients."),
  });

  const projects = usePaginatedList<ProjectItem, { clientId?: string }>({
    fetcher: listProjects,
    initialFilters: { clientId: undefined },
    onError: (error) => handleListError(error, "Unable to fetch projects."),
  });

  const codebases = usePaginatedList<CodebaseItem, { clientId?: string; projectId?: string }>({
    fetcher: listCodebases,
    initialFilters: { clientId: undefined, projectId: undefined },
    onError: (error) => handleListError(error, "Unable to fetch codebases."),
  });

  const links = usePaginatedList<
    LinkItem,
    { clientId?: string; projectId?: string; codebaseId?: string }
  >({
    fetcher: listLinks,
    initialFilters: { clientId: undefined, projectId: undefined, codebaseId: undefined },
    onError: (error) => handleListError(error, "Unable to fetch links."),
  });

  const [clientFormValues, setClientFormValues] = useState(DEFAULT_CLIENT_FORM_VALUES);
  const [clientErrors, setClientErrors] = useState<FormErrorMap<(typeof CLIENT_FIELDS)[number]>>({});

  const [projectFormValues, setProjectFormValues] = useState(DEFAULT_PROJECT_FORM_VALUES);
  const [projectErrors, setProjectErrors] = useState<FormErrorMap<(typeof PROJECT_FIELDS)[number]>>({});

  const [codebaseFormValues, setCodebaseFormValues] = useState(DEFAULT_CODEBASE_FORM_VALUES);
  const [codebaseErrors, setCodebaseErrors] = useState<FormErrorMap<(typeof CODEBASE_FIELDS)[number]>>({});
  const [codebaseFormClientId, setCodebaseFormClientId] = useState("");

  const [linkFormValues, setLinkFormValues] = useState(DEFAULT_LINK_FORM_VALUES);
  const [linkErrors, setLinkErrors] = useState<FormErrorMap<(typeof LINK_FIELDS)[number]>>({});

  const loadCbFormProjectDropdown = useCallback(async (clientId?: string) => {
    clearCbFormPj();
    if (clientId) {
      await loadCbFormPj({ clientId });
    } else {
      await loadCbFormPj();
    }
  }, [clearCbFormPj, loadCbFormPj]);

  const loadLinkFormProjectDropdown = useCallback(async (clientId?: string) => {
    clearLinkFormPj();
    if (!clientId) return;
    await loadLinkFormPj({ clientId });
  }, [clearLinkFormPj, loadLinkFormPj]);

  const loadLinkFormCodebaseDropdown = useCallback(async (projectId?: string) => {
    clearLinkFormCb();
    if (!projectId) return;
    await loadLinkFormCb({ projectId });
  }, [clearLinkFormCb, loadLinkFormCb]);

  const loadCbFilterProjectDropdown = useCallback(async (clientId?: string) => {
    clearCbFilterPj();
    if (!clientId) return;
    await loadCbFilterPj({ clientId });
  }, [clearCbFilterPj, loadCbFilterPj]);

  const loadLinkFilterProjectDropdown = useCallback(async (clientId?: string) => {
    clearLinkFilterPj();
    if (!clientId) return;
    await loadLinkFilterPj({ clientId });
  }, [clearLinkFilterPj, loadLinkFilterPj]);

  const loadLinkFilterCodebaseDropdown = useCallback(async (projectId?: string) => {
    clearLinkFilterCb();
    if (!projectId) return;
    await loadLinkFilterCb({ projectId });
  }, [clearLinkFilterCb, loadLinkFilterCb]);

  const refreshAllReferenceOptions = useCallback(async () => {
    await Promise.all([loadClientOptions(), loadProjectOptions(), loadCodebaseOptions()]);
  }, [loadClientOptions, loadCodebaseOptions, loadProjectOptions]);

  const refreshReferenceOptionsForMutation = useCallback(
    async (entity: DashboardEntity, action: MutationAction) => {
      switch (entity) {
        case "client": {
          if (action === "delete") {
            await Promise.all([loadClientOptions(), loadProjectOptions(), loadCodebaseOptions()]);
            return;
          }
          await loadClientOptions();
          return;
        }
        case "project": {
          if (action === "delete") {
            await Promise.all([loadProjectOptions(), loadCodebaseOptions()]);
            return;
          }
          await loadProjectOptions();
          return;
        }
        case "codebase":
          await loadCodebaseOptions();
          return;
        default:
          return;
      }
    },
    [loadClientOptions, loadCodebaseOptions, loadProjectOptions],
  );

  useEffect(() => {
    void refreshAllReferenceOptions();
  }, [refreshAllReferenceOptions]);

  // --- Sheet/delete handlers (EXACT same as original) ---

  const resetSheetState = useCallback(() => {
    setSheetState(INITIAL_SHEET_STATE);
    setIsSheetSubmitting(false);
  }, []);

  const openDeleteDialog = useCallback(
    (entity: DashboardEntity, id: string, label: string) => {
      setDeleteState({ open: true, entity, id, label });
    },
    [],
  );

  const closeDeleteDialog = useCallback((open: boolean) => {
    if (!open) {
      setDeleteState(INITIAL_DELETE_STATE);
      setIsDeleting(false);
      return;
    }
    setDeleteState((previous) => ({ ...previous, open }));
  }, []);

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetSheetState();
        return;
      }
      setSheetState((previous) => ({ ...previous, open }));
    },
    [resetSheetState],
  );

  const reloadAfterMutation = useCallback(
    async (entity: DashboardEntity, action: MutationAction) => {
      switch (entity) {
        case "client": {
          clients.reload();
          if (action !== "create") projects.reload();
          if (action === "delete") { codebases.reload(); links.reload(); }
          await refreshReferenceOptionsForMutation(entity, action);
          if (action === "delete" && links.filters.projectId) {
            await loadLinkFilterCodebaseDropdown(links.filters.projectId);
          }
          break;
        }
        case "project": {
          projects.reload();
          if (action !== "create") { codebases.reload(); links.reload(); }
          await refreshReferenceOptionsForMutation(entity, action);
          if (action === "delete" && links.filters.projectId) {
            await loadLinkFilterCodebaseDropdown(links.filters.projectId);
          }
          break;
        }
        case "codebase": {
          codebases.reload();
          if (action !== "create") links.reload();
          await refreshReferenceOptionsForMutation(entity, action);
          if (links.filters.projectId) {
            await loadLinkFilterCodebaseDropdown(links.filters.projectId);
          }
          break;
        }
        case "link": {
          links.reload();
          break;
        }
        default:
          break;
      }
    },
    [clients, projects, codebases, links, refreshReferenceOptionsForMutation, loadLinkFilterCodebaseDropdown],
  );

  // --- Open sheet handlers ---

  const openCreateClientSheet = useCallback(() => {
    setClientFormValues(DEFAULT_CLIENT_FORM_VALUES);
    setClientErrors({});
    setSheetState({ open: true, entity: "client", mode: "create", id: null });
  }, []);

  const openUpdateClientSheet = useCallback((client: ClientItem) => {
    setClientFormValues({
      name: client.name,
      engagementType: client.engagementType,
      workingDaysPerWeek: client.workingDaysPerWeek,
      workingHoursPerDay: client.workingHoursPerDay,
      email: client.email,
      phone: client.phone,
      whatsapp: client.whatsapp,
      address: client.address,
      notes: client.notes,
    });
    setClientErrors({});
    setSheetState({ open: true, entity: "client", mode: "update", id: client.id });
  }, []);

  const openCreateProjectSheet = useCallback(() => {
    setProjectFormValues({
      ...DEFAULT_PROJECT_FORM_VALUES,
      clientId: projects.filters.clientId ?? "",
    });
    setProjectErrors({});
    setSheetState({ open: true, entity: "project", mode: "create", id: null });
  }, [projects.filters.clientId]);

  const openUpdateProjectSheet = useCallback((project: ProjectItem) => {
    setProjectFormValues({
      clientId: project.clientId,
      name: project.name,
      description: project.description,
      status: project.status,
    });
    setProjectErrors({});
    setSheetState({ open: true, entity: "project", mode: "update", id: project.id });
  }, []);

  const openCreateCodebaseSheet = useCallback(async () => {
    setCodebaseFormValues({
      ...DEFAULT_CODEBASE_FORM_VALUES,
      projectId: codebases.filters.projectId ?? "",
    });
    setCodebaseFormClientId("");
    setCodebaseErrors({});
    setSheetState({ open: true, entity: "codebase", mode: "create", id: null });
    await loadCbFormProjectDropdown();
  }, [codebases.filters.projectId, loadCbFormProjectDropdown]);

  const openUpdateCodebaseSheet = useCallback(async (codebase: CodebaseItem) => {
    setCodebaseFormValues({
      projectId: codebase.projectId,
      name: codebase.name,
      description: codebase.description,
    });
    setCodebaseFormClientId(codebase.clientId);
    setCodebaseErrors({});
    setSheetState({ open: true, entity: "codebase", mode: "update", id: codebase.id });
    await loadCbFormProjectDropdown(codebase.clientId);
  }, [loadCbFormProjectDropdown]);

  const openCreateLinkSheet = useCallback(async () => {
    const clientId = links.filters.clientId;
    const projectId = links.filters.projectId ?? "";
    setLinkFormValues({
      ...DEFAULT_LINK_FORM_VALUES,
      clientId: clientId ?? null,
      projectId,
      codebaseId: links.filters.codebaseId ?? null,
    });
    setLinkErrors({});
    setSheetState({ open: true, entity: "link", mode: "create", id: null });
    await Promise.all([
      loadLinkFormProjectDropdown(clientId),
      loadLinkFormCodebaseDropdown(projectId),
    ]);
  }, [links.filters.clientId, links.filters.codebaseId, links.filters.projectId, loadLinkFormProjectDropdown, loadLinkFormCodebaseDropdown]);

  const openUpdateLinkSheet = useCallback(
    async (link: LinkItem) => {
      setLinkFormValues({
        clientId: link.clientId,
        projectId: link.projectId ?? "",
        codebaseId: link.codebaseId,
        title: link.title,
        url: link.url,
      });
      setLinkErrors({});
      setSheetState({ open: true, entity: "link", mode: "update", id: link.id });
      await Promise.all([
        loadLinkFormProjectDropdown(link.clientId ?? undefined),
        loadLinkFormCodebaseDropdown(link.projectId ?? undefined),
      ]);
    },
    [loadLinkFormProjectDropdown, loadLinkFormCodebaseDropdown],
  );

  // --- Delete confirm ---

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteState.entity || !deleteState.id) return;
    const entity = deleteState.entity;
    const id = deleteState.id;
    setIsDeleting(true);
    try {
      switch (entity) {
        case "client": await deleteClient(id); break;
        case "project": await deleteProject(id); break;
        case "codebase": await deleteCodebase(id); break;
        case "link": await deleteLink(id); break;
        default: break;
      }
      toast.success(`${getEntityLabel(entity)} deleted successfully.`);
      setDeleteState(INITIAL_DELETE_STATE);
      await reloadAfterMutation(entity, "delete");
    } catch (error) {
      const message = error instanceof ApiRequestError
        ? error.message
        : `Unable to delete ${getEntityLabel(entity).toLowerCase()} right now.`;
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteState.entity, deleteState.id, reloadAfterMutation]);

  // --- Form submissions ---

  const submitClientForm = useCallback(async () => {
    if (isSheetSubmitting) return;
    const parsed = clientPayloadSchema.safeParse(clientFormValues);
    if (!parsed.success) {
      setClientErrors(toValidationErrors(CLIENT_FIELDS, parsed.error));
      return;
    }
    setClientErrors({});
    setIsSheetSubmitting(true);
    try {
      if (sheetState.mode === "create") {
        await createClient(parsed.data);
        toast.success("Client created successfully.");
      } else if (sheetState.id) {
        await updateClient(sheetState.id, parsed.data);
        toast.success("Client updated successfully.");
      }
      resetSheetState();
      await reloadAfterMutation("client", sheetState.mode);
    } catch (error) {
      showRequestError(error, CLIENT_FIELDS, setClientErrors, "Unable to save client right now.");
    } finally {
      setIsSheetSubmitting(false);
    }
  }, [clientFormValues, isSheetSubmitting, reloadAfterMutation, resetSheetState, sheetState.id, sheetState.mode]);

  const submitProjectForm = useCallback(async () => {
    if (isSheetSubmitting) return;
    const parsed = projectPayloadSchema.safeParse(projectFormValues);
    if (!parsed.success) {
      setProjectErrors(toValidationErrors(PROJECT_FIELDS, parsed.error));
      return;
    }
    setProjectErrors({});
    setIsSheetSubmitting(true);
    try {
      if (sheetState.mode === "create") {
        await createProject(parsed.data);
        toast.success("Project created successfully.");
      } else if (sheetState.id) {
        await updateProject(sheetState.id, parsed.data);
        toast.success("Project updated successfully.");
      }
      resetSheetState();
      await reloadAfterMutation("project", sheetState.mode);
    } catch (error) {
      showRequestError(error, PROJECT_FIELDS, setProjectErrors, "Unable to save project right now.");
    } finally {
      setIsSheetSubmitting(false);
    }
  }, [isSheetSubmitting, projectFormValues, reloadAfterMutation, resetSheetState, sheetState.id, sheetState.mode]);

  const submitCodebaseForm = useCallback(async () => {
    if (isSheetSubmitting) return;
    if (!codebaseFormClientId) {
      setCodebaseErrors({ form: "Please select a client first." });
      return;
    }
    const parsed = codebasePayloadSchema.safeParse(codebaseFormValues);
    if (!parsed.success) {
      setCodebaseErrors(toValidationErrors(CODEBASE_FIELDS, parsed.error));
      return;
    }
    setCodebaseErrors({});
    setIsSheetSubmitting(true);
    try {
      if (sheetState.mode === "create") {
        await createCodebase(parsed.data);
        toast.success("Codebase created successfully.");
      } else if (sheetState.id) {
        await updateCodebase(sheetState.id, parsed.data);
        toast.success("Codebase updated successfully.");
      }
      resetSheetState();
      await reloadAfterMutation("codebase", sheetState.mode);
    } catch (error) {
      showRequestError(error, CODEBASE_FIELDS, setCodebaseErrors, "Unable to save codebase right now.");
    } finally {
      setIsSheetSubmitting(false);
    }
  }, [codebaseFormValues, isSheetSubmitting, reloadAfterMutation, resetSheetState, sheetState.id, sheetState.mode]);

  const submitLinkForm = useCallback(async () => {
    if (isSheetSubmitting) return;
    const parsed = linkPayloadSchema.safeParse(linkFormValues);
    if (!parsed.success) {
      setLinkErrors(toValidationErrors(LINK_FIELDS, parsed.error));
      return;
    }
    setLinkErrors({});
    setIsSheetSubmitting(true);
    try {
      if (sheetState.mode === "create") {
        await createLink(parsed.data);
        toast.success("Link created successfully.");
      } else if (sheetState.id) {
        await updateLink(sheetState.id, parsed.data);
        toast.success("Link updated successfully.");
      }
      resetSheetState();
      await reloadAfterMutation("link", sheetState.mode);
    } catch (error) {
      showRequestError(error, LINK_FIELDS, setLinkErrors, "Unable to save link right now.");
    } finally {
      setIsSheetSubmitting(false);
    }
  }, [isSheetSubmitting, linkFormValues, reloadAfterMutation, resetSheetState, sheetState.id, sheetState.mode]);

  const handleSheetSubmit: FormEventHandler<HTMLFormElement> = useCallback((event) => {
    event.preventDefault();
    switch (sheetState.entity) {
      case "client": void submitClientForm(); break;
      case "project": void submitProjectForm(); break;
      case "codebase": void submitCodebaseForm(); break;
      case "link": void submitLinkForm(); break;
      default: break;
    }
  }, [sheetState.entity, submitClientForm, submitProjectForm, submitCodebaseForm, submitLinkForm]);

  const sheetTitle = useMemo(() => {
    if (!sheetState.entity) return "";
    const action = sheetState.mode === "create" ? "Create" : "Update";
    return `${action} ${getEntityLabel(sheetState.entity)}`;
  }, [sheetState.entity, sheetState.mode]);

  const sheetDescription = useMemo(() => {
    if (!sheetState.entity) return "";
    if (sheetState.mode === "create") {
      return `Add a new ${getEntityLabel(sheetState.entity).toLowerCase()} to your dashboard.`;
    }
    return `Update your ${getEntityLabel(sheetState.entity).toLowerCase()} details.`;
  }, [sheetState.entity, sheetState.mode]);

  // --- Context value ---

  const contextValue = useMemo(
    () => ({
      user,
      clients,
      projects,
      codebases,
      links,
      sheetState,
      isSheetSubmitting,
      handleSheetOpenChange,
      handleSheetSubmit,
      sheetTitle,
      sheetDescription,
      deleteState,
      isDeleting,
      openDeleteDialog,
      closeDeleteDialog,
      handleDeleteConfirm: () => { void handleDeleteConfirm(); },
      clientFormValues,
      setClientFormValues,
      clientErrors,
      setClientErrors,
      openCreateClientSheet,
      openUpdateClientSheet,
      projectFormValues,
      setProjectFormValues,
      projectErrors,
      setProjectErrors,
      openCreateProjectSheet,
      openUpdateProjectSheet,
      codebaseFormValues,
      setCodebaseFormValues,
      codebaseErrors,
      setCodebaseErrors,
      codebaseFormClientId,
      setCodebaseFormClientId,
      codebaseFormProjectOptions,
      loadCbFormProjectDropdown,
      openCreateCodebaseSheet: () => { void openCreateCodebaseSheet(); },
      openUpdateCodebaseSheet: (codebase: CodebaseItem) => { void openUpdateCodebaseSheet(codebase); },
      linkFormValues,
      setLinkFormValues,
      linkErrors,
      setLinkErrors,
      linkFormProjectOptions,
      loadLinkFormProjectDropdown,
      linkFormCodebaseOptions,
      loadLinkFormCodebaseDropdown,
      openCreateLinkSheet: () => { void openCreateLinkSheet(); },
      openUpdateLinkSheet: (link: LinkItem) => { void openUpdateLinkSheet(link); },
      clientOptions,
      projectOptions,
      codebaseOptions,
      cbFilterProjectOptions,
      loadCbFilterProjectDropdown,
      linkFilterProjectOptions,
      loadLinkFilterProjectDropdown,
      linkFilterCodebaseOptions,
      loadLinkFilterCodebaseDropdown,
    }),
    [
      user, clients, projects, codebases, links,
      sheetState, isSheetSubmitting, handleSheetSubmit, handleSheetOpenChange, sheetTitle, sheetDescription,
      deleteState, isDeleting, openDeleteDialog, closeDeleteDialog, handleDeleteConfirm,
      clientFormValues, clientErrors, openCreateClientSheet, openUpdateClientSheet,
      projectFormValues, projectErrors, openCreateProjectSheet, openUpdateProjectSheet,
      codebaseFormValues, codebaseErrors, codebaseFormClientId, codebaseFormProjectOptions, loadCbFormProjectDropdown,
      openCreateCodebaseSheet, openUpdateCodebaseSheet,
      linkFormValues, linkErrors, linkFormProjectOptions, loadLinkFormProjectDropdown, linkFormCodebaseOptions, loadLinkFormCodebaseDropdown,
      openCreateLinkSheet, openUpdateLinkSheet,
      clientOptions, projectOptions, codebaseOptions,
      cbFilterProjectOptions, loadCbFilterProjectDropdown,
      linkFilterProjectOptions, loadLinkFilterProjectDropdown,
      linkFilterCodebaseOptions, loadLinkFilterCodebaseDropdown,
    ],
  );

  return (
    <DashboardContext.Provider value={contextValue}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <NetworkActivityIndicator />
          <div className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <ActiveSection user={user} />
          </div>
        </SidebarInset>
      </SidebarProvider>

      {sheetState.entity ? (
        <GlobalFormSheet
          open={sheetState.open}
          onOpenChange={handleSheetOpenChange}
          title={sheetTitle}
          description={sheetDescription}
          submitLabel={sheetState.mode === "create" ? "Create" : "Update"}
          isSubmitting={isSheetSubmitting}
          onSubmit={handleSheetSubmit}
        >
          {sheetState.entity === "client" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="client-name" className="text-sm font-medium">Name</label>
                <Input
                  id="client-name"
                  value={clientFormValues.name}
                  onChange={(event) => {
                    setClientFormValues((p) => ({ ...p, name: event.target.value }));
                    setClientErrors((p) => ({ ...p, name: undefined, form: undefined }));
                  }}
                />
                <FormErrorText message={clientErrors.name} />
              </div>
              <div className="space-y-2">
                <label htmlFor="client-engagement" className="text-sm font-medium">Engagement type</label>
                <Select
                  value={clientFormValues.engagementType}
                  onValueChange={(value) => {
                    setClientFormValues((p) => ({
                      ...p,
                      engagementType: toEngagementType(value),
                      workingDaysPerWeek: value === "TIME_BASED" ? p.workingDaysPerWeek ?? 5 : null,
                      workingHoursPerDay: value === "TIME_BASED" ? p.workingHoursPerDay ?? 8 : null,
                    }));
                    setClientErrors((p) => ({ ...p, engagementType: undefined, form: undefined }));
                  }}
                >
                  <SelectTrigger id="client-engagement" className="w-full">
                    <SelectValue placeholder="Select engagement type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENGAGEMENT_TYPE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormErrorText message={clientErrors.engagementType} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="client-days" className="text-sm font-medium">Working days per week</label>
                  <Input id="client-days" type="number" min={1} max={7}
                    value={clientFormValues.workingDaysPerWeek ?? ""}
                    onChange={(e) => {
                      setClientFormValues((p) => ({ ...p, workingDaysPerWeek: toNullableNumber(e.target.value) }));
                      setClientErrors((p) => ({ ...p, workingDaysPerWeek: undefined, form: undefined }));
                    }}
                    disabled={clientFormValues.engagementType === "PROJECT_BASED"}
                  />
                  <FormErrorText message={clientErrors.workingDaysPerWeek} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="client-hours" className="text-sm font-medium">Working hours per day</label>
                  <Input id="client-hours" type="number" min={1} max={24}
                    value={clientFormValues.workingHoursPerDay ?? ""}
                    onChange={(e) => {
                      setClientFormValues((p) => ({ ...p, workingHoursPerDay: toNullableNumber(e.target.value) }));
                      setClientErrors((p) => ({ ...p, workingHoursPerDay: undefined, form: undefined }));
                    }}
                    disabled={clientFormValues.engagementType === "PROJECT_BASED"}
                  />
                  <FormErrorText message={clientErrors.workingHoursPerDay} />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="client-email" className="text-sm font-medium">Email</label>
                <Input id="client-email" type="email" value={clientFormValues.email ?? ""}
                  onChange={(e) => {
                    setClientFormValues((p) => ({ ...p, email: toNullableText(e.target.value) }));
                    setClientErrors((p) => ({ ...p, email: undefined, form: undefined }));
                  }}
                />
                <FormErrorText message={clientErrors.email} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="client-phone" className="text-sm font-medium">Phone</label>
                  <Input id="client-phone" value={clientFormValues.phone ?? ""}
                    onChange={(e) => {
                      setClientFormValues((p) => ({ ...p, phone: toNullableText(e.target.value) }));
                      setClientErrors((p) => ({ ...p, phone: undefined, form: undefined }));
                    }}
                  />
                  <FormErrorText message={clientErrors.phone} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="client-whatsapp" className="text-sm font-medium">WhatsApp</label>
                  <Input id="client-whatsapp" value={clientFormValues.whatsapp ?? ""}
                    onChange={(e) => {
                      setClientFormValues((p) => ({ ...p, whatsapp: toNullableText(e.target.value) }));
                      setClientErrors((p) => ({ ...p, whatsapp: undefined, form: undefined }));
                    }}
                  />
                  <FormErrorText message={clientErrors.whatsapp} />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="client-address" className="text-sm font-medium">Address</label>
                <Textarea id="client-address" rows={2} value={clientFormValues.address ?? ""}
                  onChange={(e) => {
                    setClientFormValues((p) => ({ ...p, address: toNullableText(e.target.value) }));
                    setClientErrors((p) => ({ ...p, address: undefined, form: undefined }));
                  }}
                />
                <FormErrorText message={clientErrors.address} />
              </div>
              <div className="space-y-2">
                <label htmlFor="client-notes" className="text-sm font-medium">Notes</label>
                <Textarea id="client-notes" rows={4} value={clientFormValues.notes ?? ""}
                  onChange={(e) => {
                    setClientFormValues((p) => ({ ...p, notes: toNullableText(e.target.value) }));
                    setClientErrors((p) => ({ ...p, notes: undefined, form: undefined }));
                  }}
                />
                <FormErrorText message={clientErrors.notes} />
              </div>
              {sheetState.mode === "update" ? (
                <div className="space-y-2 border-t pt-4">
                  <label className="text-sm font-medium">Files</label>
                  <FileUploadInput
                    accept=".pdf,.doc,.docx"
                    isUploading={clientFileUpload.isUploading}
                    onFileSelect={(file) => {
                      void clientFileUpload.upload(file);
                    }}
                    disabled={isSheetSubmitting}
                  />
                  <FileList
                    files={clientFileUpload.files}
                    isLoading={clientFileUpload.isLoading}
                    onDelete={clientFileUpload.remove}
                    onDownload={(id, name) => {
                      void downloadFile(id, name);
                    }}
                    onView={viewFile}
                  />
                </div>
              ) : null}
              {clientErrors.form ? (
                <p className="bg-destructive/10 text-destructive rounded-md border border-destructive/30 px-3 py-2 text-sm">{clientErrors.form}</p>
              ) : null}
            </div>
          ) : null}

          {sheetState.entity === "project" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="project-client" className="text-sm font-medium">Client</label>
                <Select value={projectFormValues.clientId || "__none"} onValueChange={(v) => {
                  setProjectFormValues((p) => ({ ...p, clientId: v === "__none" ? "" : v }));
                  setProjectErrors((p) => ({ ...p, clientId: undefined, form: undefined }));
                }}>
                  <SelectTrigger id="project-client" className="w-full"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Select client</SelectItem>
                    {clientOptions.map((o) => (<SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormErrorText message={projectErrors.clientId} />
              </div>
              <div className="space-y-2">
                <label htmlFor="project-name" className="text-sm font-medium">Name</label>
                <Input id="project-name" value={projectFormValues.name} onChange={(e) => {
                  setProjectFormValues((p) => ({ ...p, name: e.target.value }));
                  setProjectErrors((p) => ({ ...p, name: undefined, form: undefined }));
                }} />
                <FormErrorText message={projectErrors.name} />
              </div>
              <div className="space-y-2">
                <label htmlFor="project-status" className="text-sm font-medium">Status</label>
                <Select value={projectFormValues.status} onValueChange={(v) => {
                  setProjectFormValues((p) => ({ ...p, status: toProjectStatus(v) }));
                  setProjectErrors((p) => ({ ...p, status: undefined, form: undefined }));
                }}>
                  <SelectTrigger id="project-status" className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUS_OPTIONS.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormErrorText message={projectErrors.status} />
              </div>
              <div className="space-y-2">
                <label htmlFor="project-description" className="text-sm font-medium">Description</label>
                <Textarea id="project-description" rows={4} value={projectFormValues.description ?? ""} onChange={(e) => {
                  setProjectFormValues((p) => ({ ...p, description: toNullableText(e.target.value) }));
                  setProjectErrors((p) => ({ ...p, description: undefined, form: undefined }));
                }} />
                <FormErrorText message={projectErrors.description} />
              </div>
              {projectErrors.form ? (
                <p className="bg-destructive/10 text-destructive rounded-md border border-destructive/30 px-3 py-2 text-sm">{projectErrors.form}</p>
              ) : null}
            </div>
          ) : null}

          {sheetState.entity === "codebase" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="codebase-client" className="text-sm font-medium">Client</label>
                <Select value={codebaseFormClientId || "__none"} onValueChange={(v) => {
                  const clientId = v === "__none" ? "" : v;
                  setCodebaseFormClientId(clientId);
                  setCodebaseFormValues((p) => ({ ...p, projectId: "" }));
                  setCodebaseErrors((p) => ({ ...p, projectId: undefined, form: undefined }));
                  void loadCbFormProjectDropdown(clientId || undefined);
                }}>
                  <SelectTrigger id="codebase-client" className="w-full"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Select client</SelectItem>
                    {clientOptions.map((o) => (<SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormErrorText message={codebaseErrors.form} />
              </div>
              <div className="space-y-2">
                <label htmlFor="codebase-project" className="text-sm font-medium">Project</label>
                <Select
                  value={codebaseFormValues.projectId || "__none"}
                  onValueChange={(v) => {
                    setCodebaseFormValues((p) => ({ ...p, projectId: v === "__none" ? "" : v }));
                    setCodebaseErrors((p) => ({ ...p, projectId: undefined, form: undefined }));
                  }}
                  disabled={!codebaseFormClientId}
                >
                  <SelectTrigger id="codebase-project" className="w-full"><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Select project</SelectItem>
                    {codebaseFormProjectOptions.map((o) => (<SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormErrorText message={codebaseErrors.projectId} />
              </div>
              <div className="space-y-2">
                <label htmlFor="codebase-name" className="text-sm font-medium">Name</label>
                <Input id="codebase-name" value={codebaseFormValues.name} onChange={(e) => {
                  setCodebaseFormValues((p) => ({ ...p, name: e.target.value }));
                  setCodebaseErrors((p) => ({ ...p, name: undefined, form: undefined }));
                }} />
                <FormErrorText message={codebaseErrors.name} />
              </div>
              <div className="space-y-2">
                <label htmlFor="codebase-description" className="text-sm font-medium">Description</label>
                <Textarea id="codebase-description" rows={4} value={codebaseFormValues.description ?? ""} onChange={(e) => {
                  setCodebaseFormValues((p) => ({ ...p, description: toNullableText(e.target.value) }));
                  setCodebaseErrors((p) => ({ ...p, description: undefined, form: undefined }));
                }} />
                <FormErrorText message={codebaseErrors.description} />
              </div>
            </div>
          ) : null}

          {sheetState.entity === "link" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="link-client" className="text-sm font-medium">Client</label>
                <Select value={linkFormValues.clientId ?? "__none"} onValueChange={(v) => {
                  const clientId = v === "__none" ? null : v;
                  setLinkFormValues((p) => ({ ...p, clientId, projectId: "", codebaseId: null }));
                  setLinkErrors((p) => ({ ...p, clientId: undefined, projectId: undefined, codebaseId: undefined, form: undefined }));
                  void loadLinkFormProjectDropdown(clientId ?? undefined);
                  clearLinkFormCb();
                }}>
                  <SelectTrigger id="link-client" className="w-full"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No client</SelectItem>
                    {clientOptions.map((o) => (<SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormErrorText message={linkErrors.clientId} />
              </div>
              <div className="space-y-2">
                <label htmlFor="link-project" className="text-sm font-medium">Project (optional)</label>
                <Select value={linkFormValues.projectId || "__none"} onValueChange={(v) => {
                  const projectId = v === "__none" ? "" : v;
                  setLinkFormValues((p) => ({ ...p, projectId, codebaseId: null }));
                  setLinkErrors((p) => ({ ...p, projectId: undefined, codebaseId: undefined, form: undefined }));
                  void loadLinkFormCodebaseDropdown(projectId);
                }} disabled={!linkFormValues.clientId}>
                  <SelectTrigger id="link-project" className="w-full"><SelectValue placeholder="Select project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No project</SelectItem>
                    {linkFormProjectOptions.map((o) => (<SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormErrorText message={linkErrors.projectId} />
              </div>
              <div className="space-y-2">
                <label htmlFor="link-codebase" className="text-sm font-medium">Codebase (optional)</label>
                <Select value={linkFormValues.codebaseId ?? "__none"} onValueChange={(v) => {
                  setLinkFormValues((p) => ({ ...p, codebaseId: v === "__none" ? null : v }));
                  setLinkErrors((p) => ({ ...p, codebaseId: undefined, form: undefined }));
                }} disabled={!linkFormValues.projectId}>
                  <SelectTrigger id="link-codebase" className="w-full"><SelectValue placeholder="Select codebase" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No codebase</SelectItem>
                    {linkFormCodebaseOptions.map((o) => (<SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>))}
                  </SelectContent>
                </Select>
                <FormErrorText message={linkErrors.codebaseId} />
              </div>
              <div className="space-y-2">
                <label htmlFor="link-title" className="text-sm font-medium">Title</label>
                <Input id="link-title" value={linkFormValues.title} onChange={(e) => {
                  setLinkFormValues((p) => ({ ...p, title: e.target.value }));
                  setLinkErrors((p) => ({ ...p, title: undefined, form: undefined }));
                }} />
                <FormErrorText message={linkErrors.title} />
              </div>
              <div className="space-y-2">
                <label htmlFor="link-url" className="text-sm font-medium">URL</label>
                <Input id="link-url" type="url" value={linkFormValues.url} onChange={(e) => {
                  setLinkFormValues((p) => ({ ...p, url: e.target.value }));
                  setLinkErrors((p) => ({ ...p, url: undefined, form: undefined }));
                }} />
                <FormErrorText message={linkErrors.url} />
              </div>
              {linkErrors.form ? (
                <p className="bg-destructive/10 text-destructive rounded-md border border-destructive/30 px-3 py-2 text-sm">{linkErrors.form}</p>
              ) : null}
            </div>
          ) : null}
        </GlobalFormSheet>
      ) : null}

      <GlobalDeleteDialog
        open={deleteState.open}
        onOpenChange={closeDeleteDialog}
        title={`Delete ${deleteState.entity ? getEntityLabel(deleteState.entity) : "item"}?`}
        description={
          deleteState.label
            ? `This action will permanently remove "${deleteState.label}".`
            : "This action cannot be undone."
        }
        isDeleting={isDeleting}
        onConfirm={() => { void handleDeleteConfirm(); }}
      />
    </DashboardContext.Provider>
  );
}
