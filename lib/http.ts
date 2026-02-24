import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { z } from "zod";
import { beginNetworkRequest, endNetworkRequest } from "@/lib/network";

const DEFAULT_TIMEOUT_MS = 15_000;
const AUTH_TOKEN_STORAGE_KEY = "dev_home_access_token";
const SKIP_LOADER_HEADER = "x-skip-loader";

type TrackedConfig = InternalAxiosRequestConfig & {
  metadata?: {
    tracked?: boolean;
  };
};

type HeaderBag = {
  get?: (key: string) => unknown;
  set?: (key: string, value: string) => void;
  delete?: (key: string) => void;
} & Record<string, unknown>;

function getHeader(config: InternalAxiosRequestConfig, key: string) {
  const headers = config.headers as HeaderBag | undefined;
  if (!headers) {
    return undefined;
  }

  if (typeof headers.get === "function") {
    return headers.get(key);
  }

  return headers[key] ?? headers[key.toLowerCase()];
}

function setHeader(
  config: InternalAxiosRequestConfig,
  key: string,
  value: string,
) {
  if (!config.headers) {
    config.headers = {} as InternalAxiosRequestConfig["headers"];
  }

  const headers = config.headers as HeaderBag;

  if (typeof headers.set === "function") {
    headers.set(key, value);
    return;
  }

  headers[key] = value;
}

function removeHeader(config: InternalAxiosRequestConfig, key: string) {
  const headers = config.headers as HeaderBag | undefined;
  if (!headers) {
    return;
  }

  if (typeof headers.delete === "function") {
    headers.delete(key);
    return;
  }

  delete headers[key];
  delete headers[key.toLowerCase()];
}

function shouldTrackLoader(config: InternalAxiosRequestConfig) {
  const skipLoaderValue = getHeader(config, SKIP_LOADER_HEADER);
  if (
    skipLoaderValue === true ||
    skipLoaderValue === "true" ||
    skipLoaderValue === 1 ||
    skipLoaderValue === "1"
  ) {
    return false;
  }

  return typeof window !== "undefined";
}

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  const trackedConfig = config as TrackedConfig;
  const tracked = shouldTrackLoader(config);

  trackedConfig.metadata = {
    ...(trackedConfig.metadata ?? {}),
    tracked,
  };

  if (tracked) {
    beginNetworkRequest();
  }

  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (token) {
      setHeader(config, "Authorization", `Bearer ${token}`);
    }
  }

  removeHeader(config, SKIP_LOADER_HEADER);
  return config;
});

http.interceptors.response.use(
  (response) => {
    const tracked = (response.config as TrackedConfig).metadata?.tracked;
    if (tracked) {
      endNetworkRequest();
    }

    return response;
  },
  (error: AxiosError) => {
    const tracked = (error.config as TrackedConfig | undefined)?.metadata
      ?.tracked;
    if (tracked) {
      endNetworkRequest();
    }

    return Promise.reject(error);
  },
);

export function setAuthToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export async function getValidated<TSchema extends z.ZodTypeAny>(
  url: string,
  schema: TSchema,
  config?: AxiosRequestConfig,
): Promise<z.infer<TSchema>> {
  const { data } = await http.get(url, config);
  return schema.parse(data);
}

export async function postValidated<TSchema extends z.ZodTypeAny>(
  url: string,
  body: unknown,
  schema: TSchema,
  config?: AxiosRequestConfig,
): Promise<z.infer<TSchema>> {
  const { data } = await http.post(url, body, config);
  return schema.parse(data);
}
