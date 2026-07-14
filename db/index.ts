import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

import * as schema from "./schema"

// Falls back to a placeholder so the app can build before .env exists.
// Real queries will fail loudly until DATABASE_URL is set.
const sql = neon(
  process.env.DATABASE_URL ??
    "postgresql://placeholder:placeholder@placeholder.neon.tech/flipghost"
)

export const db = drizzle(sql, { schema })
