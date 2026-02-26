import axios, { type AxiosError } from "axios";
import type {
  ClientItem,
  ClientListData,
  ClientPayload,
  CodebaseItem,
  CodebaseListData,
  CodebaseListQueryParams,
  CodebasePayload,
  DropdownListData,
  FileItem,
  FileListData,
  FileListQueryParams,
  LinkItem,
  LinkListData,
  LinkListQueryParams,
  LinkPayload,
  ListQueryParams,
  ProjectItem,
  ProjectListData,
  ProjectListQueryParams,
  ProjectPayload,
} from "@/types/domain";
import type { ApiResponse } from "@/types/api";
import { http } from "@/lib/http";

export class ApiRequestError extends Error {
  statusCode?: number;
  fieldErrors?: Record<string, string[]>;

  constructor(message: string, options?: { statusCode?: number; fieldErrors?: Record<string, string[]> }) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = options?.statusCode;
    this.fieldErrors = options?.fieldErrors;
  }
}

function toQueryString(params?: object) {
  if (!params) {
    return "";
  }

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(
    params as Record<string, unknown>,
  )) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

function extractApiError(error: unknown) {
  if (error instanceof ApiRequestError) {
    return error;
  }

  if (!axios.isAxiosError(error)) {
    return new ApiRequestError("Something went wrong. Please try again.");
  }

  const axiosError = error as AxiosError<ApiResponse<unknown>>;
  const statusCode = axiosError.response?.status;
  const payload = axiosError.response?.data;

  if (payload && "success" in payload && payload.success === false) {
    return new ApiRequestError(payload.message, {
      statusCode,
      fieldErrors: payload.errors,
    });
  }

  return new ApiRequestError("Something went wrong. Please try again.", {
    statusCode,
  });
}

async function requestApi<TData>(config: {
  url: string;
  method?: "get" | "post" | "put" | "delete";
  data?: unknown;
}) {
  try {
    const response = await http.request<ApiResponse<TData>>({
      url: config.url,
      method: config.method ?? "get",
      data: config.data,
    });

    const payload = response.data;

    if (!payload.success) {
      throw new ApiRequestError(payload.message, {
        statusCode: response.status,
        fieldErrors: payload.errors,
      });
    }

    return payload.data;
  } catch (error) {
    throw extractApiError(error);
  }
}

async function listResource<TData>(resource: string, params?: object) {
  const query = toQueryString(params);
  return requestApi<TData>({
    url: `/${resource}${query}`,
    method: "get",
  });
}

async function createResource<TPayload, TData>(resource: string, payload: TPayload) {
  return requestApi<TData>({
    url: `/${resource}`,
    method: "post",
    data: payload,
  });
}

async function updateResource<TPayload, TData>(resource: string, id: string, payload: TPayload) {
  return requestApi<TData>({
    url: `/${resource}/${id}`,
    method: "put",
    data: payload,
  });
}

async function deleteResource(resource: string, id: string) {
  return requestApi<null>({
    url: `/${resource}/${id}`,
    method: "delete",
  });
}

export function listClients(params?: ListQueryParams) {
  return listResource<ClientListData>("clients", params);
}

export function listClientDropdown(params?: ListQueryParams) {
  return listResource<DropdownListData>("clients", {
    ...params,
    dropdown: true,
  });
}

export function createClient(payload: ClientPayload) {
  return createResource<ClientPayload, ClientItem>("clients", payload);
}

export function updateClient(id: string, payload: ClientPayload) {
  return updateResource<ClientPayload, ClientItem>("clients", id, payload);
}

export function deleteClient(id: string) {
  return deleteResource("clients", id);
}

export function listProjects(params?: ProjectListQueryParams) {
  return listResource<ProjectListData>("projects", params);
}

export function listProjectDropdown(params?: ProjectListQueryParams) {
  return listResource<DropdownListData>("projects", {
    ...params,
    dropdown: true,
  });
}

export function createProject(payload: ProjectPayload) {
  return createResource<ProjectPayload, ProjectItem>("projects", payload);
}

export function updateProject(id: string, payload: ProjectPayload) {
  return updateResource<ProjectPayload, ProjectItem>("projects", id, payload);
}

export function deleteProject(id: string) {
  return deleteResource("projects", id);
}

export function listCodebases(params?: CodebaseListQueryParams) {
  return listResource<CodebaseListData>("codebases", params);
}

export function listCodebaseDropdown(params?: CodebaseListQueryParams) {
  return listResource<DropdownListData>("codebases", {
    ...params,
    dropdown: true,
  });
}

export function createCodebase(payload: CodebasePayload) {
  return createResource<CodebasePayload, CodebaseItem>("codebases", payload);
}

export function updateCodebase(id: string, payload: CodebasePayload) {
  return updateResource<CodebasePayload, CodebaseItem>("codebases", id, payload);
}

export function deleteCodebase(id: string) {
  return deleteResource("codebases", id);
}

export function listLinks(params?: LinkListQueryParams) {
  return listResource<LinkListData>("links", params);
}

export function createLink(payload: LinkPayload) {
  return createResource<LinkPayload, LinkItem>("links", payload);
}

export function updateLink(id: string, payload: LinkPayload) {
  return updateResource<LinkPayload, LinkItem>("links", id, payload);
}

export function deleteLink(id: string) {
  return deleteResource("links", id);
}

export async function uploadFile(params: {
  file: File;
  clientId?: string | null;
  projectId?: string | null;
  codebaseId?: string | null;
  maxSize?: number;
  allowedMimeTypes?: string[];
}): Promise<FileItem> {
  const formData = new FormData();
  formData.append("file", params.file);

  if (params.clientId) formData.append("clientId", params.clientId);
  if (params.projectId) formData.append("projectId", params.projectId);
  if (params.codebaseId) formData.append("codebaseId", params.codebaseId);
  if (params.maxSize) formData.append("maxSize", String(params.maxSize));
  if (params.allowedMimeTypes?.length) {
    formData.append("allowedMimeTypes", params.allowedMimeTypes.join(","));
  }

  try {
    const response = await http.post<ApiResponse<FileItem>>("/files", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const payload = response.data;
    if (!payload.success) {
      throw new ApiRequestError(payload.message, {
        statusCode: response.status,
        fieldErrors: payload.errors,
      });
    }

    return payload.data;
  } catch (error) {
    throw extractApiError(error);
  }
}

export function listFiles(params?: FileListQueryParams) {
  return listResource<FileListData>("files", params);
}

export function deleteFileRecord(id: string) {
  return deleteResource("files", id);
}

export function updateProfile(payload: { name: string }) {
  return requestApi<{ id: string; email: string; name: string }>({
    url: "/auth/profile",
    method: "put",
    data: payload,
  });
}

export function changePassword(payload: { currentPassword: string; newPassword: string; confirmPassword: string }) {
  return requestApi<null>({
    url: "/auth/password",
    method: "put",
    data: payload,
  });
}
