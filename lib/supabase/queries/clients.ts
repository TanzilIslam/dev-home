import { supabase } from "../client";
import { TABLES } from "@/lib/config/tables";
import type {
  ClientItem,
  ClientPayload,
  ClientListData,
  DropdownListData,
  ListQueryParams,
} from "@/types/domain";
import {
  SupabaseError,
  toCamelCase,
  toSnakeCase,
  parseListParams,
  createPaginatedResponse,
  getCurrentUserId,
} from "./utils";

export async function listClients(params?: ListQueryParams): Promise<ClientListData> {
  try {
    const userId = await getCurrentUserId();
    const { page, pageSize, search, offset } = parseListParams(params);

    let query = supabase
      .from(TABLES.clients)
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (!params?.all) {
      query = query.range(offset, offset + pageSize - 1);
    }

    const { data, count, error } = await query;

    if (error)
      throw new SupabaseError(error.message, { statusCode: Number(error.code) || undefined });

    const camelData = toCamelCase(data || []);
    return createPaginatedResponse(camelData, count, page, pageSize);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to fetch clients");
  }
}

export async function listClientDropdown(params?: ListQueryParams): Promise<DropdownListData> {
  try {
    const userId = await getCurrentUserId();
    const { page, pageSize, search } = parseListParams(params);

    let query = supabase
      .from(TABLES.clients)
      .select("id, name", { count: "exact" })
      .eq("user_id", userId)
      .order("name", { ascending: true });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    query = query.limit(pageSize);

    const { data, count, error } = await query;

    if (error) throw new SupabaseError(error.message);

    const camelData = toCamelCase(data || []);
    return createPaginatedResponse(camelData, count, page, pageSize);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to fetch clients");
  }
}

export async function createClient(payload: ClientPayload): Promise<ClientItem> {
  try {
    const userId = await getCurrentUserId();
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.clients)
      .insert([{ user_id: userId, ...snakePayload }])
      .select()
      .single();

    if (error) throw new SupabaseError(error.message);
    return toCamelCase(data);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to create client");
  }
}

export async function updateClient(id: string, payload: ClientPayload): Promise<ClientItem> {
  try {
    const userId = await getCurrentUserId();
    const snakePayload = toSnakeCase(payload);

    const { data, error } = await supabase
      .from(TABLES.clients)
      .update(snakePayload)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw new SupabaseError(error.message);
    return toCamelCase(data);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to update client");
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    const userId = await getCurrentUserId();

    const { error } = await supabase
      .from(TABLES.clients)
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw new SupabaseError(error.message);
  } catch (error) {
    if (error instanceof SupabaseError) throw error;
    throw new SupabaseError("Failed to delete client");
  }
}
