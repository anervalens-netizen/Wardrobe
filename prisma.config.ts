import "dotenv/config";
import { defineConfig } from "prisma/config";

const tursoUrl = process.env["TURSO_DATABASE_URL"];
const authToken = process.env["TURSO_AUTH_TOKEN"];

// For db push/migrate, Prisma needs a URL. Turso supports https:// protocol for migrations.
const migrationUrl = tursoUrl
  ? tursoUrl.replace("libsql://", "https://") + (authToken ? `?authToken=${authToken}` : "")
  : "file:prisma/dev.db";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
  },
});
