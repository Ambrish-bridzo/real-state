import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("[postgres] DATABASE_URL is not set; PostgreSQL-backed endpoints will fail until configured.");
}

export const pgPool = new Pool({
  connectionString,
  max: Number(process.env.PG_POOL_MAX || 10),
  ssl: process.env.PG_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});
