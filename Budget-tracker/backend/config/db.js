// backend/config/db.js
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

function masked(v) {
  if (!v) return "(missing)";
  if (v.length <= 4) return v;
  return v.slice(0, 2) + "****" + v.slice(-2);
}

// Debug: print env vars (masked)
console.log("🔍 Environment check:");
console.log("  DATABASE_URL:", masked(process.env.DATABASE_URL));
console.log("  DB_HOST:", masked(process.env.DB_HOST));
console.log("  DB_USER:", masked(process.env.DB_USER));
console.log("  DB_NAME:", process.env.DB_NAME);
console.log("  DB_PORT:", process.env.DB_PORT);
console.log("  DB_SSL:", process.env.DB_SSL);
console.log("  NODE_ENV:", process.env.NODE_ENV);

// Build pool config
let poolConfig;

if (process.env.DATABASE_URL) {
  // CONNECTION STRING MODE (Render, Heroku, etc.)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 5000,
  };
  console.log("✅ Using CONNECTION_STRING mode (DATABASE_URL)");
} else if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
  // INDIVIDUAL VARS MODE (local dev)
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD || "",
    port: Number(process.env.DB_PORT || 5432),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    connectionTimeoutMillis: 5000,
  };
  console.log("✅ Using INDIVIDUAL VARS mode (DB_HOST, DB_USER, etc.)");
} else {
  console.error("❌ No database configuration found. Set either DATABASE_URL or DB_HOST/DB_USER/DB_NAME");
  process.exit(1);
}

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("❌ Database connection error:", err);
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected successfully");
});

export default pool;
