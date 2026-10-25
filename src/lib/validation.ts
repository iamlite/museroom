import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3)
  .max(24)
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid username characters");

export const passwordSchema = z.string().min(10);

export function normalizeUsername(username: string): string {
  return username.toLowerCase();
}

export const messageBodySchema = z.string().min(1).max(2000);
