import axios, { type AxiosRequestConfig } from "axios";
import { z } from "zod";

const DEFAULT_TIMEOUT_MS = 15_000;

export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

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
