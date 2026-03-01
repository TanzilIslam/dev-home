/**
 * Supabase Table Names Configuration
 * All table names use a prefix from the environment
 * This allows multiple isolated deployments in one Supabase project
 *
 * Example:
 * - prefix: 'dev-home' → tables: dev-home-users, dev-home-clients, etc.
 * - prefix: 'client-acme' → tables: client-acme-users, client-acme-clients, etc.
 */

const PREFIX = process.env.NEXT_PUBLIC_TABLE_PREFIX || 'dev-home';

export const TABLES = {
  users: `${PREFIX}-users`,
  clients: `${PREFIX}-clients`,
  projects: `${PREFIX}-projects`,
  codebases: `${PREFIX}-codebases`,
  links: `${PREFIX}-links`,
  files: `${PREFIX}-files`,
} as const;

export const STORAGE_BUCKETS = {
  files: 'dev-home-files', // Use prefix for multiple instances if needed
} as const;

export type TableNames = typeof TABLES;
export type StorageBuckets = typeof STORAGE_BUCKETS;
