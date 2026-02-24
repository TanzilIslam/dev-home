"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEventHandler,
} from "react";
import { z } from "zod";
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
  CODEBASE_TYPE_OPTIONS,
  ENGAGEMENT_TYPE_OPTIONS,
  LINK_CATEGORY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
  getLabelByValue,
} from "@/lib/constants/domain";
import {
  firstFieldErrors,
  toNullableNumber,
  toNullableText,
  type FormErrorMap,
} from "@/lib/form-utils";
import {
  clientPayloadSchema,
  codebasePayloadSchema,
  linkPayloadSchema,
  projectPayloadSchema,
} from "@/lib/validation/dashboard";
import { usePaginatedList } from "@/hooks/use-paginated-list";
import type {
  ClientItem,
  CodebaseItem,
  DropdownOption,
  LinkItem,
  ProjectItem,
} from "@/types/domain";
import {
  DEFAULT_CLIENT_FORM_VALUES,
  DEFAULT_CODEBASE_FORM_VALUES,
  DEFAULT_LINK_FORM_VALUES,
  DEFAULT_PROJECT_FORM_VALUES,
  type DashboardEntity,
  type SelectOption,
  type SheetMode,
} from "@/types/dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { GlobalDeleteDialog } from "@/components/dashboard/global-delete-dialog";
import { GlobalFormSheet } from "@/components/dashboard/global-form-sheet";
import { NetworkActivityIndicator } from "@/components/dashboard/network-activity-indicator";
import { ResourcePagination } from "@/components/dashboard/resource-pagination";
import { ResourceToolbar } from "@/components/dashboard/resource-toolbar";
import { TableStateRow } from "@/components/dashboard/table-state-row";

type DashboardAppProps = {
  user: {
    email: string;
    name: string | null;
  };
};

type DashboardTab = "clients" | "projects" | "codebases" | "links";
type MutationAction = SheetMode | "delete";

type SheetState = {
  open: boolean;
  entity: DashboardEntity | null;
  mode: SheetMode;
  id: string | null;
};

type DeleteState = {
  open: boolean;
  entity: DashboardEntity | null;
  id: string | null;
  label: string;
};

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
  "notes",
] as const;
const PROJECT_FIELDS = ["clientId", "name", "description", "status"] as const;
const CODEBASE_FIELDS = ["projectId", "name", "type", "description"] as const;
const LINK_FIELDS = [
  "projectId",
  "codebaseId",
  "title",
  "url",
  "category",
  "notes",
] as const;

function toSelectOptions(items: DropdownOption[]): SelectOption[] {
  return items.map((item) => ({
    id: item.id,
    label: item.name,
  }));
}

function toValidationErrors<TFields extends string>(
  fields: readonly TFields[],
  error: z.ZodError,
) {
  const flattened = error.flatten();
  const mapped = firstFieldErrors(
    fields,
    flattened.fieldErrors as Record<string, string[]>,
  );

  if (flattened.formErrors[0]) {
    mapped.form = flattened.formErrors[0];
  }

  return mapped;
}

function showRequestError<TFields extends string>(
  error: unknown,
  fields: readonly TFields[],
  setErrors: (nextErrors: FormErrorMap<TFields>) => void,
  fallbackMessage: string,
) {
  if (error instanceof ApiRequestError) {
    const mapped = firstFieldErrors(fields, error.fieldErrors);
    setErrors({
      ...mapped,
      form: error.message,
    });
    toast.error(error.message);
    return;
  }

  setErrors({ form: fallbackMessage } as FormErrorMap<TFields>);
  toast.error(fallbackMessage);
}

function FormErrorText({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-destructive mt-1 text-xs">{message}</p>;
}

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

export function DashboardApp({ user }: DashboardAppProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("clients");
  const [sheetState, setSheetState] = useState<SheetState>(INITIAL_SHEET_STATE);
  const [deleteState, setDeleteState] = useState<DeleteState>(
    INITIAL_DELETE_STATE,
  );
  const [isSheetSubmitting, setIsSheetSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [clientOptions, setClientOptions] = useState<SelectOption[]>([]);
  const [projectOptions, setProjectOptions] = useState<SelectOption[]>([]);
  const [codebaseOptions, setCodebaseOptions] = useState<SelectOption[]>([]);
  const [linkFormCodebaseOptions, setLinkFormCodebaseOptions] = useState<
    SelectOption[]
  >([]);
  const [linkFilterCodebaseOptions, setLinkFilterCodebaseOptions] = useState<
    SelectOption[]
  >([]);
  const lastListErrorRef = useRef("");
  const lastListErrorAtRef = useRef(0);
  const clientOptionsRequestIdRef = useRef(0);
  const projectOptionsRequestIdRef = useRef(0);
  const codebaseOptionsRequestIdRef = useRef(0);
  const linkFormDropdownRequestIdRef = useRef(0);
  const linkFilterDropdownRequestIdRef = useRef(0);

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

  const codebases = usePaginatedList<CodebaseItem, { projectId?: string }>({
    fetcher: listCodebases,
    initialFilters: { projectId: undefined },
    onError: (error) => handleListError(error, "Unable to fetch codebases."),
  });

  const links = usePaginatedList<
    LinkItem,
    {
      projectId?: string;
      codebaseId?: string;
    }
  >({
    fetcher: listLinks,
    initialFilters: {
      projectId: undefined,
      codebaseId: undefined,
    },
    onError: (error) => handleListError(error, "Unable to fetch links."),
  });

  const [clientFormValues, setClientFormValues] = useState(
    DEFAULT_CLIENT_FORM_VALUES,
  );
  const [clientErrors, setClientErrors] = useState<
    FormErrorMap<(typeof CLIENT_FIELDS)[number]>
  >({});

  const [projectFormValues, setProjectFormValues] = useState(
    DEFAULT_PROJECT_FORM_VALUES,
  );
  const [projectErrors, setProjectErrors] = useState<
    FormErrorMap<(typeof PROJECT_FIELDS)[number]>
  >({});

  const [codebaseFormValues, setCodebaseFormValues] = useState(
    DEFAULT_CODEBASE_FORM_VALUES,
  );
  const [codebaseErrors, setCodebaseErrors] = useState<
    FormErrorMap<(typeof CODEBASE_FIELDS)[number]>
  >({});

  const [linkFormValues, setLinkFormValues] = useState(DEFAULT_LINK_FORM_VALUES);
  const [linkErrors, setLinkErrors] = useState<
    FormErrorMap<(typeof LINK_FIELDS)[number]>
  >({});

  const loadClientOptions = useCallback(async () => {
    const requestId = clientOptionsRequestIdRef.current + 1;
    clientOptionsRequestIdRef.current = requestId;

    try {
      const response = await listClientDropdown({ all: true });
      if (requestId !== clientOptionsRequestIdRef.current) {
        return;
      }

      setClientOptions(toSelectOptions(response.items));
    } catch {
      if (requestId !== clientOptionsRequestIdRef.current) {
        return;
      }

      setClientOptions([]);
    }
  }, []);

  const loadProjectOptions = useCallback(async () => {
    const requestId = projectOptionsRequestIdRef.current + 1;
    projectOptionsRequestIdRef.current = requestId;

    try {
      const response = await listProjectDropdown({ all: true });
      if (requestId !== projectOptionsRequestIdRef.current) {
        return;
      }

      setProjectOptions(toSelectOptions(response.items));
    } catch {
      if (requestId !== projectOptionsRequestIdRef.current) {
        return;
      }

      setProjectOptions([]);
    }
  }, []);

  const loadCodebaseOptions = useCallback(async () => {
    const requestId = codebaseOptionsRequestIdRef.current + 1;
    codebaseOptionsRequestIdRef.current = requestId;

    try {
      const response = await listCodebaseDropdown({ all: true });
      if (requestId !== codebaseOptionsRequestIdRef.current) {
        return;
      }

      setCodebaseOptions(toSelectOptions(response.items));
    } catch {
      if (requestId !== codebaseOptionsRequestIdRef.current) {
        return;
      }

      setCodebaseOptions([]);
    }
  }, []);

  const loadLinkFormCodebaseDropdown = useCallback(async (projectId?: string) => {
    const requestId = linkFormDropdownRequestIdRef.current + 1;
    linkFormDropdownRequestIdRef.current = requestId;
    setLinkFormCodebaseOptions([]);

    if (!projectId) {
      return;
    }

    try {
      const response = await listCodebaseDropdown({
        all: true,
        projectId,
      });

      if (requestId !== linkFormDropdownRequestIdRef.current) {
        return;
      }

      setLinkFormCodebaseOptions(toSelectOptions(response.items));
    } catch {
      if (requestId !== linkFormDropdownRequestIdRef.current) {
        return;
      }

      setLinkFormCodebaseOptions([]);
    }
  }, []);

  const loadLinkFilterCodebaseDropdown = useCallback(
    async (projectId?: string) => {
      const requestId = linkFilterDropdownRequestIdRef.current + 1;
      linkFilterDropdownRequestIdRef.current = requestId;
      setLinkFilterCodebaseOptions([]);

      if (!projectId) {
        return;
      }

      try {
        const response = await listCodebaseDropdown({
          all: true,
          projectId,
        });

        if (requestId !== linkFilterDropdownRequestIdRef.current) {
          return;
        }

        setLinkFilterCodebaseOptions(toSelectOptions(response.items));
      } catch {
        if (requestId !== linkFilterDropdownRequestIdRef.current) {
          return;
        }

        setLinkFilterCodebaseOptions([]);
      }
    },
    [],
  );

  const refreshAllReferenceOptions = useCallback(async () => {
    await Promise.all([loadClientOptions(), loadProjectOptions(), loadCodebaseOptions()]);
  }, [loadClientOptions, loadCodebaseOptions, loadProjectOptions]);

  const refreshReferenceOptionsForMutation = useCallback(
    async (entity: DashboardEntity, action: MutationAction) => {
      switch (entity) {
        case "client": {
          if (action === "delete") {
            await Promise.all([
              loadClientOptions(),
              loadProjectOptions(),
              loadCodebaseOptions(),
            ]);
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
  const resetSheetState = useCallback(() => {
    setSheetState(INITIAL_SHEET_STATE);
    setIsSheetSubmitting(false);
  }, []);

  const openDeleteDialog = useCallback(
    (entity: DashboardEntity, id: string, label: string) => {
      setDeleteState({
        open: true,
        entity,
        id,
        label,
      });
    },
    [],
  );

  const closeDeleteDialog = useCallback((open: boolean) => {
    if (!open) {
      setDeleteState(INITIAL_DELETE_STATE);
      setIsDeleting(false);
      return;
    }

    setDeleteState((previous) => ({
      ...previous,
      open,
    }));
  }, []);

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetSheetState();
        return;
      }

      setSheetState((previous) => ({
        ...previous,
        open,
      }));
    },
    [resetSheetState],
  );

  const reloadAfterMutation = useCallback(
    async (entity: DashboardEntity, action: MutationAction) => {
      switch (entity) {
        case "client": {
          clients.reload();
          if (action !== "create") {
            projects.reload();
          }
          if (action === "delete") {
            codebases.reload();
            links.reload();
          }
          await refreshReferenceOptionsForMutation(entity, action);
          if (action === "delete" && links.filters.projectId) {
            await loadLinkFilterCodebaseDropdown(links.filters.projectId);
          }
          break;
        }
        case "project": {
          projects.reload();
          if (action !== "create") {
            codebases.reload();
            links.reload();
          }
          await refreshReferenceOptionsForMutation(entity, action);
          if (action === "delete" && links.filters.projectId) {
            await loadLinkFilterCodebaseDropdown(links.filters.projectId);
          }
          break;
        }
        case "codebase": {
          codebases.reload();
          if (action !== "create") {
            links.reload();
          }
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
    [
      clients,
      projects,
      codebases,
      links,
      refreshReferenceOptionsForMutation,
      loadLinkFilterCodebaseDropdown,
    ],
  );

  const openCreateClientSheet = useCallback(() => {
    setClientFormValues(DEFAULT_CLIENT_FORM_VALUES);
    setClientErrors({});
    setSheetState({
      open: true,
      entity: "client",
      mode: "create",
      id: null,
    });
  }, []);

  const openUpdateClientSheet = useCallback((client: ClientItem) => {
    setClientFormValues({
      name: client.name,
      engagementType: client.engagementType,
      workingDaysPerWeek: client.workingDaysPerWeek,
      workingHoursPerDay: client.workingHoursPerDay,
      notes: client.notes,
    });
    setClientErrors({});
    setSheetState({
      open: true,
      entity: "client",
      mode: "update",
      id: client.id,
    });
  }, []);

  const openCreateProjectSheet = useCallback(() => {
    setProjectFormValues({
      ...DEFAULT_PROJECT_FORM_VALUES,
      clientId: projects.filters.clientId ?? "",
    });
    setProjectErrors({});
    setSheetState({
      open: true,
      entity: "project",
      mode: "create",
      id: null,
    });
  }, [projects.filters.clientId]);

  const openUpdateProjectSheet = useCallback((project: ProjectItem) => {
    setProjectFormValues({
      clientId: project.clientId,
      name: project.name,
      description: project.description,
      status: project.status,
    });
    setProjectErrors({});
    setSheetState({
      open: true,
      entity: "project",
      mode: "update",
      id: project.id,
    });
  }, []);

  const openCreateCodebaseSheet = useCallback(() => {
    setCodebaseFormValues({
      ...DEFAULT_CODEBASE_FORM_VALUES,
      projectId: codebases.filters.projectId ?? "",
    });
    setCodebaseErrors({});
    setSheetState({
      open: true,
      entity: "codebase",
      mode: "create",
      id: null,
    });
  }, [codebases.filters.projectId]);

  const openUpdateCodebaseSheet = useCallback((codebase: CodebaseItem) => {
    setCodebaseFormValues({
      projectId: codebase.projectId,
      name: codebase.name,
      type: codebase.type,
      description: codebase.description,
    });
    setCodebaseErrors({});
    setSheetState({
      open: true,
      entity: "codebase",
      mode: "update",
      id: codebase.id,
    });
  }, []);

  const openCreateLinkSheet = useCallback(async () => {
    const projectId = links.filters.projectId ?? "";
    setLinkFormValues({
      ...DEFAULT_LINK_FORM_VALUES,
      projectId,
      codebaseId: links.filters.codebaseId ?? null,
    });
    setLinkErrors({});
    setSheetState({
      open: true,
      entity: "link",
      mode: "create",
      id: null,
    });

    await loadLinkFormCodebaseDropdown(projectId);
  }, [links.filters.codebaseId, links.filters.projectId, loadLinkFormCodebaseDropdown]);

  const openUpdateLinkSheet = useCallback(
    async (link: LinkItem) => {
      setLinkFormValues({
        projectId: link.projectId,
        codebaseId: link.codebaseId,
        title: link.title,
        url: link.url,
        category: link.category,
        notes: link.notes,
      });
      setLinkErrors({});
      setSheetState({
        open: true,
        entity: "link",
        mode: "update",
        id: link.id,
      });

      await loadLinkFormCodebaseDropdown(link.projectId);
    },
    [loadLinkFormCodebaseDropdown],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteState.entity || !deleteState.id) {
      return;
    }

    const entity = deleteState.entity;
    const id = deleteState.id;

    setIsDeleting(true);

    try {
      switch (entity) {
        case "client":
          await deleteClient(id);
          break;
        case "project":
          await deleteProject(id);
          break;
        case "codebase":
          await deleteCodebase(id);
          break;
        case "link":
          await deleteLink(id);
          break;
        default:
          break;
      }

      toast.success(`${getEntityLabel(entity)} deleted successfully.`);
      setDeleteState(INITIAL_DELETE_STATE);
      await reloadAfterMutation(entity, "delete");
    } catch (error) {
      const message =
        error instanceof ApiRequestError
          ? error.message
          : `Unable to delete ${getEntityLabel(entity).toLowerCase()} right now.`;
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteState.entity, deleteState.id, reloadAfterMutation]);

  const submitClientForm = useCallback(async () => {
    if (isSheetSubmitting) {
      return;
    }

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
      showRequestError(
        error,
        CLIENT_FIELDS,
        setClientErrors,
        "Unable to save client right now.",
      );
    } finally {
      setIsSheetSubmitting(false);
    }
  }, [
    clientFormValues,
    isSheetSubmitting,
    reloadAfterMutation,
    resetSheetState,
    sheetState.id,
    sheetState.mode,
  ]);

  const submitProjectForm = useCallback(async () => {
    if (isSheetSubmitting) {
      return;
    }

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
      showRequestError(
        error,
        PROJECT_FIELDS,
        setProjectErrors,
        "Unable to save project right now.",
      );
    } finally {
      setIsSheetSubmitting(false);
    }
  }, [
    isSheetSubmitting,
    projectFormValues,
    reloadAfterMutation,
    resetSheetState,
    sheetState.id,
    sheetState.mode,
  ]);

  const submitCodebaseForm = useCallback(async () => {
    if (isSheetSubmitting) {
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
      showRequestError(
        error,
        CODEBASE_FIELDS,
        setCodebaseErrors,
        "Unable to save codebase right now.",
      );
    } finally {
      setIsSheetSubmitting(false);
    }
  }, [
    codebaseFormValues,
    isSheetSubmitting,
    reloadAfterMutation,
    resetSheetState,
    sheetState.id,
    sheetState.mode,
  ]);

  const submitLinkForm = useCallback(async () => {
    if (isSheetSubmitting) {
      return;
    }

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
      showRequestError(
        error,
        LINK_FIELDS,
        setLinkErrors,
        "Unable to save link right now.",
      );
    } finally {
      setIsSheetSubmitting(false);
    }
  }, [
    isSheetSubmitting,
    linkFormValues,
    reloadAfterMutation,
    resetSheetState,
    sheetState.id,
    sheetState.mode,
  ]);

  const handleSheetSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    switch (sheetState.entity) {
      case "client":
        void submitClientForm();
        break;
      case "project":
        void submitProjectForm();
        break;
      case "codebase":
        void submitCodebaseForm();
        break;
      case "link":
        void submitLinkForm();
        break;
      default:
        break;
    }
  };

  const sheetTitle = useMemo(() => {
    if (!sheetState.entity) {
      return "";
    }

    const action = sheetState.mode === "create" ? "Create" : "Update";
    return `${action} ${getEntityLabel(sheetState.entity)}`;
  }, [sheetState.entity, sheetState.mode]);

  const sheetDescription = useMemo(() => {
    if (!sheetState.entity) {
      return "";
    }

    if (sheetState.mode === "create") {
      return `Add a new ${getEntityLabel(sheetState.entity).toLowerCase()} to your dashboard.`;
    }

    return `Update your ${getEntityLabel(sheetState.entity).toLowerCase()} details.`;
  }, [sheetState.entity, sheetState.mode]);

  const linkTableCodebaseOptions =
    links.filters.projectId && linkFilterCodebaseOptions.length > 0
      ? linkFilterCodebaseOptions
      : codebaseOptions;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <NetworkActivityIndicator />

      <header className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Developer Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Signed in as {user.name ?? user.email}
          </p>
        </div>

        <form action="/api/auth/logout" method="post">
          <Button type="submit" variant="outline">
            Log out
          </Button>
        </form>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as DashboardTab)}
        className="space-y-4"
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="codebases">Codebases</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <ResourceToolbar
            title="Clients"
            description="Manage client workload settings and engagement types."
            searchValue={clients.query}
            onSearchChange={clients.setQuery}
            pageSize={clients.pageSize}
            onPageSizeChange={clients.setPageSize}
            onAdd={openCreateClientSheet}
            addLabel="Add Client"
          />

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead className="hidden md:table-cell">Schedule</TableHead>
                  <TableHead className="hidden lg:table-cell">Notes</TableHead>
                  <TableHead className="w-[160px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.items.length === 0 ? (
                  <TableStateRow
                    colSpan={5}
                    isLoading={clients.isLoading}
                    emptyMessage="No clients found."
                  />
                ) : (
                  clients.items.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getLabelByValue(
                            ENGAGEMENT_TYPE_OPTIONS,
                            client.engagementType,
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {client.workingDaysPerWeek && client.workingHoursPerDay
                          ? `${client.workingDaysPerWeek}d / ${client.workingHoursPerDay}h`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden max-w-[280px] truncate lg:table-cell">
                        {client.notes ?? "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label={`Edit client ${client.name}`}
                            onClick={() => openUpdateClientSheet(client)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            aria-label={`Delete client ${client.name}`}
                            onClick={() =>
                              openDeleteDialog("client", client.id, client.name)
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

          <ResourcePagination meta={clients.meta} onPageChange={clients.setPage} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="codebases" className="space-y-4">
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
        </TabsContent>
        <TabsContent value="links" className="space-y-4">
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
        </TabsContent>
      </Tabs>

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
                <label htmlFor="client-name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="client-name"
                  value={clientFormValues.name}
                  onChange={(event) => {
                    setClientFormValues((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }));
                    setClientErrors((previous) => ({
                      ...previous,
                      name: undefined,
                      form: undefined,
                    }));
                  }}
                />
                <FormErrorText message={clientErrors.name} />
              </div>

              <div className="space-y-2">
                <label htmlFor="client-engagement" className="text-sm font-medium">
                  Engagement type
                </label>
                <Select
                  value={clientFormValues.engagementType}
                  onValueChange={(value) => {
                    setClientFormValues((previous) => ({
                      ...previous,
                      engagementType: value as ClientItem["engagementType"],
                      workingDaysPerWeek:
                        value === "TIME_BASED"
                          ? previous.workingDaysPerWeek ?? 5
                          : null,
                      workingHoursPerDay:
                        value === "TIME_BASED"
                          ? previous.workingHoursPerDay ?? 8
                          : null,
                    }));
                    setClientErrors((previous) => ({
                      ...previous,
                      engagementType: undefined,
                      form: undefined,
                    }));
                  }}
                >
                  <SelectTrigger id="client-engagement" className="w-full">
                    <SelectValue placeholder="Select engagement type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ENGAGEMENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormErrorText message={clientErrors.engagementType} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="client-days" className="text-sm font-medium">
                    Working days per week
                  </label>
                  <Input
                    id="client-days"
                    type="number"
                    min={1}
                    max={7}
                    value={clientFormValues.workingDaysPerWeek ?? ""}
                    onChange={(event) => {
                      setClientFormValues((previous) => ({
                        ...previous,
                        workingDaysPerWeek: toNullableNumber(event.target.value),
                      }));
                      setClientErrors((previous) => ({
                        ...previous,
                        workingDaysPerWeek: undefined,
                        form: undefined,
                      }));
                    }}
                    disabled={clientFormValues.engagementType === "PROJECT_BASED"}
                  />
                  <FormErrorText message={clientErrors.workingDaysPerWeek} />
                </div>

                <div className="space-y-2">
                  <label htmlFor="client-hours" className="text-sm font-medium">
                    Working hours per day
                  </label>
                  <Input
                    id="client-hours"
                    type="number"
                    min={1}
                    max={24}
                    value={clientFormValues.workingHoursPerDay ?? ""}
                    onChange={(event) => {
                      setClientFormValues((previous) => ({
                        ...previous,
                        workingHoursPerDay: toNullableNumber(event.target.value),
                      }));
                      setClientErrors((previous) => ({
                        ...previous,
                        workingHoursPerDay: undefined,
                        form: undefined,
                      }));
                    }}
                    disabled={clientFormValues.engagementType === "PROJECT_BASED"}
                  />
                  <FormErrorText message={clientErrors.workingHoursPerDay} />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="client-notes" className="text-sm font-medium">
                  Notes
                </label>
                <Textarea
                  id="client-notes"
                  rows={4}
                  value={clientFormValues.notes ?? ""}
                  onChange={(event) => {
                    setClientFormValues((previous) => ({
                      ...previous,
                      notes: toNullableText(event.target.value),
                    }));
                    setClientErrors((previous) => ({
                      ...previous,
                      notes: undefined,
                      form: undefined,
                    }));
                  }}
                />
                <FormErrorText message={clientErrors.notes} />
              </div>

              {clientErrors.form ? (
                <p className="bg-destructive/10 text-destructive rounded-md border border-destructive/30 px-3 py-2 text-sm">
                  {clientErrors.form}
                </p>
              ) : null}
            </div>
          ) : null}

          {sheetState.entity === "project" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="project-client" className="text-sm font-medium">
                  Client
                </label>
                <Select
                  value={projectFormValues.clientId || "__none"}
                  onValueChange={(value) => {
                    setProjectFormValues((previous) => ({
                      ...previous,
                      clientId: value === "__none" ? "" : value,
                    }));
                    setProjectErrors((previous) => ({
                      ...previous,
                      clientId: undefined,
                      form: undefined,
                    }));
                  }}
                >
                  <SelectTrigger id="project-client" className="w-full">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Select client</SelectItem>
                    {clientOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormErrorText message={projectErrors.clientId} />
              </div>

              <div className="space-y-2">
                <label htmlFor="project-name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="project-name"
                  value={projectFormValues.name}
                  onChange={(event) => {
                    setProjectFormValues((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }));
                    setProjectErrors((previous) => ({
                      ...previous,
                      name: undefined,
                      form: undefined,
                    }));
                  }}
                />
                <FormErrorText message={projectErrors.name} />
              </div>

              <div className="space-y-2">
                <label htmlFor="project-status" className="text-sm font-medium">
                  Status
                </label>
                <Select
                  value={projectFormValues.status}
                  onValueChange={(value) => {
                    setProjectFormValues((previous) => ({
                      ...previous,
                      status: value as ProjectItem["status"],
                    }));
                    setProjectErrors((previous) => ({
                      ...previous,
                      status: undefined,
                      form: undefined,
                    }));
                  }}
                >
                  <SelectTrigger id="project-status" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormErrorText message={projectErrors.status} />
              </div>

              <div className="space-y-2">
                <label htmlFor="project-description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="project-description"
                  rows={4}
                  value={projectFormValues.description ?? ""}
                  onChange={(event) => {
                    setProjectFormValues((previous) => ({
                      ...previous,
                      description: toNullableText(event.target.value),
                    }));
                    setProjectErrors((previous) => ({
                      ...previous,
                      description: undefined,
                      form: undefined,
                    }));
                  }}
                />
                <FormErrorText message={projectErrors.description} />
              </div>

              {projectErrors.form ? (
                <p className="bg-destructive/10 text-destructive rounded-md border border-destructive/30 px-3 py-2 text-sm">
                  {projectErrors.form}
                </p>
              ) : null}
            </div>
          ) : null}
          {sheetState.entity === "codebase" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="codebase-project" className="text-sm font-medium">
                  Project
                </label>
                <Select
                  value={codebaseFormValues.projectId || "__none"}
                  onValueChange={(value) => {
                    setCodebaseFormValues((previous) => ({
                      ...previous,
                      projectId: value === "__none" ? "" : value,
                    }));
                    setCodebaseErrors((previous) => ({
                      ...previous,
                      projectId: undefined,
                      form: undefined,
                    }));
                  }}
                >
                  <SelectTrigger id="codebase-project" className="w-full">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Select project</SelectItem>
                    {projectOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormErrorText message={codebaseErrors.projectId} />
              </div>

              <div className="space-y-2">
                <label htmlFor="codebase-name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="codebase-name"
                  value={codebaseFormValues.name}
                  onChange={(event) => {
                    setCodebaseFormValues((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }));
                    setCodebaseErrors((previous) => ({
                      ...previous,
                      name: undefined,
                      form: undefined,
                    }));
                  }}
                />
                <FormErrorText message={codebaseErrors.name} />
              </div>

              <div className="space-y-2">
                <label htmlFor="codebase-type" className="text-sm font-medium">
                  Type
                </label>
                <Select
                  value={codebaseFormValues.type}
                  onValueChange={(value) => {
                    setCodebaseFormValues((previous) => ({
                      ...previous,
                      type: value as CodebaseItem["type"],
                    }));
                    setCodebaseErrors((previous) => ({
                      ...previous,
                      type: undefined,
                      form: undefined,
                    }));
                  }}
                >
                  <SelectTrigger id="codebase-type" className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CODEBASE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormErrorText message={codebaseErrors.type} />
              </div>

              <div className="space-y-2">
                <label htmlFor="codebase-description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="codebase-description"
                  rows={4}
                  value={codebaseFormValues.description ?? ""}
                  onChange={(event) => {
                    setCodebaseFormValues((previous) => ({
                      ...previous,
                      description: toNullableText(event.target.value),
                    }));
                    setCodebaseErrors((previous) => ({
                      ...previous,
                      description: undefined,
                      form: undefined,
                    }));
                  }}
                />
                <FormErrorText message={codebaseErrors.description} />
              </div>

              {codebaseErrors.form ? (
                <p className="bg-destructive/10 text-destructive rounded-md border border-destructive/30 px-3 py-2 text-sm">
                  {codebaseErrors.form}
                </p>
              ) : null}
            </div>
          ) : null}

          {sheetState.entity === "link" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="link-project" className="text-sm font-medium">
                  Project
                </label>
                <Select
                  value={linkFormValues.projectId || "__none"}
                  onValueChange={(value) => {
                    const projectId = value === "__none" ? "" : value;
                    setLinkFormValues((previous) => ({
                      ...previous,
                      projectId,
                      codebaseId: null,
                    }));
                    setLinkErrors((previous) => ({
                      ...previous,
                      projectId: undefined,
                      codebaseId: undefined,
                      form: undefined,
                    }));
                    void loadLinkFormCodebaseDropdown(projectId);
                  }}
                >
                  <SelectTrigger id="link-project" className="w-full">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">Select project</SelectItem>
                    {projectOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormErrorText message={linkErrors.projectId} />
              </div>

              <div className="space-y-2">
                <label htmlFor="link-codebase" className="text-sm font-medium">
                  Codebase (optional)
                </label>
                <Select
                  value={linkFormValues.codebaseId ?? "__none"}
                  onValueChange={(value) => {
                    setLinkFormValues((previous) => ({
                      ...previous,
                      codebaseId: value === "__none" ? null : value,
                    }));
                    setLinkErrors((previous) => ({
                      ...previous,
                      codebaseId: undefined,
                      form: undefined,
                    }));
                  }}
                >
                  <SelectTrigger id="link-codebase" className="w-full">
                    <SelectValue placeholder="Select codebase" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No codebase</SelectItem>
                    {linkFormCodebaseOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormErrorText message={linkErrors.codebaseId} />
              </div>

              <div className="space-y-2">
                <label htmlFor="link-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="link-title"
                  value={linkFormValues.title}
                  onChange={(event) => {
                    setLinkFormValues((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }));
                    setLinkErrors((previous) => ({
                      ...previous,
                      title: undefined,
                      form: undefined,
                    }));
                  }}
                />
                <FormErrorText message={linkErrors.title} />
              </div>

              <div className="space-y-2">
                <label htmlFor="link-url" className="text-sm font-medium">
                  URL
                </label>
                <Input
                  id="link-url"
                  type="url"
                  value={linkFormValues.url}
                  onChange={(event) => {
                    setLinkFormValues((previous) => ({
                      ...previous,
                      url: event.target.value,
                    }));
                    setLinkErrors((previous) => ({
                      ...previous,
                      url: undefined,
                      form: undefined,
                    }));
                  }}
                />
                <FormErrorText message={linkErrors.url} />
              </div>

              <div className="space-y-2">
                <label htmlFor="link-category" className="text-sm font-medium">
                  Category
                </label>
                <Select
                  value={linkFormValues.category}
                  onValueChange={(value) => {
                    setLinkFormValues((previous) => ({
                      ...previous,
                      category: value as LinkItem["category"],
                    }));
                    setLinkErrors((previous) => ({
                      ...previous,
                      category: undefined,
                      form: undefined,
                    }));
                  }}
                >
                  <SelectTrigger id="link-category" className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {LINK_CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormErrorText message={linkErrors.category} />
              </div>

              <div className="space-y-2">
                <label htmlFor="link-notes" className="text-sm font-medium">
                  Notes
                </label>
                <Textarea
                  id="link-notes"
                  rows={4}
                  value={linkFormValues.notes ?? ""}
                  onChange={(event) => {
                    setLinkFormValues((previous) => ({
                      ...previous,
                      notes: toNullableText(event.target.value),
                    }));
                    setLinkErrors((previous) => ({
                      ...previous,
                      notes: undefined,
                      form: undefined,
                    }));
                  }}
                />
                <FormErrorText message={linkErrors.notes} />
              </div>

              {linkErrors.form ? (
                <p className="bg-destructive/10 text-destructive rounded-md border border-destructive/30 px-3 py-2 text-sm">
                  {linkErrors.form}
                </p>
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
        onConfirm={() => {
          void handleDeleteConfirm();
        }}
      />
    </main>
  );
}
