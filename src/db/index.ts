import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

function getDatabaseUrl(): string {
  return process.env.TURSO_DATABASE_URL ?? "file:./local.db";
}

const globalForDb = globalThis as unknown as {
  libsqlClient?: ReturnType<typeof createClient>;
};

function getClient() {
  if (!globalForDb.libsqlClient) {
    globalForDb.libsqlClient = createClient({
      url: getDatabaseUrl(),
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return globalForDb.libsqlClient;
}

export const db = drizzle(getClient(), { schema });
export { schema };
