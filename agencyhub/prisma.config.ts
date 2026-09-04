
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({ path: ".env.local" });

const fallbackUrl =
  process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/agencyhub";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: fallbackUrl,
    directUrl: process.env.DIRECT_URL ?? fallbackUrl,
  },
});
