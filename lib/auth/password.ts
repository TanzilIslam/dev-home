import { compare, hash } from "bcryptjs";

const SALT_ROUNDS = 12;

export function hashPassword(plainPassword: string) {
  return hash(plainPassword, SALT_ROUNDS);
}

export function verifyPassword(
  plainPassword: string,
  passwordHash: string,
) {
  return compare(plainPassword, passwordHash);
}
