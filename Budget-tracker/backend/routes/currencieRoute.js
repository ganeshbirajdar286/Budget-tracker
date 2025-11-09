// ...existing code...
import express from "express";
import pool from "../config/db.js";
import verifyToken from "../middlewares/authMiddleware.js";

const router = express.Router();

// cache column checks
const _colCache = new Map();
async function hasColumn(col) {
  if (_colCache.has(col)) return _colCache.get(col);
  const q = `
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'currencies' AND column_name = $1
    LIMIT 1
  `;
  const r = await pool.query(q, [col]);
  const exists = r.rowCount > 0;
  _colCache.set(col, exists);
  return exists;
}

function getReqUserId(req) {
  return req.user?.user_id ?? req.user?.id ?? null;
}

// GET /api/currencies
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = getReqUserId(req);
    const hasUser = await hasColumn("user_id");
    const sql = hasUser
      ? "SELECT code, name, rate_to_inr, is_default FROM currencies WHERE user_id = $1 ORDER BY is_default DESC, code"
      : "SELECT code, name, rate_to_inr, is_default FROM currencies ORDER BY is_default DESC, code";
    const result = hasUser ? await pool.query(sql, [userId]) : await pool.query(sql);
    return res.json({ currencies: result.rows });
  } catch (error) {
    console.error("Fetch currencies error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/currencies
// ...existing code...
// Replace the POST / route with the following:
// ...existing code...
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = getReqUserId(req);
    const { code, name, rate_to_inr } = req.body;
    let { is_default = false, force = false } = req.body;

    if (!code || !name || rate_to_inr == null) {
      return res.status(400).json({ error: "code, name and rate_to_inr are required" });
    }
    is_default = Boolean(is_default);
    force = Boolean(force);

    const codeUpper = code.toUpperCase();
    const hasUser = await hasColumn("user_id");
    const existsSql = hasUser
      ? "SELECT code, name, rate_to_inr, is_default FROM currencies WHERE code = $1 AND user_id = $2 LIMIT 1"
      : "SELECT code, name, rate_to_inr, is_default FROM currencies WHERE code = $1 LIMIT 1";
    const existsParams = hasUser ? [codeUpper, userId] : [codeUpper];
    const existsRes = await pool.query(existsSql, existsParams);

    // If already exists and not forcing update, return existing (200) instead of 409
    if (existsRes.rowCount > 0 && !force) {
      return res.status(200).json({ currency: existsRes.rows[0], message: "Currency already exists" });
    }

    // Upsert behaviour: update existing when force=true, otherwise insert
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (is_default) {
        const updateDefaultSql = hasUser
          ? "UPDATE currencies SET is_default = false WHERE user_id = $1"
          : "UPDATE currencies SET is_default = false";
        await client.query(updateDefaultSql, hasUser ? [userId] : []);
      }

      let result;
      if (existsRes.rowCount > 0) {
        // update existing
        const updateSql = hasUser
          ? "UPDATE currencies SET name = $1, rate_to_inr = $2, is_default = $3" + (await hasColumn("updated_at") ? ", updated_at = NOW()" : "") + " WHERE code = $4 AND user_id = $5 RETURNING code, name, rate_to_inr, is_default"
          : "UPDATE currencies SET name = $1, rate_to_inr = $2, is_default = $3" + (await hasColumn("updated_at") ? ", updated_at = NOW()" : "") + " WHERE code = $4 RETURNING code, name, rate_to_inr, is_default";
        const params = hasUser ? [name, rate_to_inr, is_default, codeUpper, userId] : [name, rate_to_inr, is_default, codeUpper];
        result = await client.query(updateSql, params);
      } else {
        // insert new
        const hasCreated = await hasColumn("created_at");
        const hasUpdated = await hasColumn("updated_at");
        const cols = ["code", "name", "rate_to_inr", "is_default"];
        const vals = [codeUpper, name, rate_to_inr, is_default];
        if (hasUser) { cols.push("user_id"); vals.push(userId); }
        if (hasCreated) { cols.push("created_at"); vals.push(new Date()); }
        if (hasUpdated) { cols.push("updated_at"); vals.push(new Date()); }
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
        const insertSql = `INSERT INTO currencies (${cols.join(", ")}) VALUES (${placeholders}) RETURNING code, name, rate_to_inr, is_default`;
        result = await client.query(insertSql, vals);
      }

      await client.query("COMMIT");
      return res.status(existsRes.rowCount > 0 ? 200 : 201).json({ currency: result.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create currency error:", error);
    return res.status(500).json({ error: error.message });
  }
});
// ...existing code...
// PUT /api/currencies/default
router.put("/default", verifyToken, async (req, res) => {
  try {
    const userId = getReqUserId(req);
    const { currency_code } = req.body;
    if (!currency_code) return res.status(400).json({ error: "currency_code is required" });

    const hasUser = await hasColumn("user_id");
    const hasUpdated = await hasColumn("updated_at");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      if (hasUser) {
        await client.query("UPDATE currencies SET is_default = false WHERE user_id = $1", [userId]);
      } else {
        await client.query("UPDATE currencies SET is_default = false");
      }

      const updateSql = hasUser
        ? `UPDATE currencies SET is_default = true${hasUpdated ? ", updated_at = NOW()" : ""} WHERE code = $1 AND user_id = $2 RETURNING code, name, rate_to_inr, is_default`
        : `UPDATE currencies SET is_default = true${hasUpdated ? ", updated_at = NOW()" : ""} WHERE code = $1 RETURNING code, name, rate_to_inr, is_default`;

      const params = hasUser ? [currency_code.toUpperCase(), userId] : [currency_code.toUpperCase()];
      const updateRes = await client.query(updateSql, params);

      if (updateRes.rowCount === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Currency not found" });
      }
      await client.query("COMMIT");
      return res.json({ message: "Default currency updated", currency: updateRes.rows[0] });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Set default currency error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/currencies/:code
router.delete("/:code", verifyToken, async (req, res) => {
  try {
    const userId = getReqUserId(req);
    const codeParam = (req.params.code || "").toUpperCase();
    const hasUser = await hasColumn("user_id");

    const delSql = hasUser
      ? "DELETE FROM currencies WHERE code = $1 AND user_id = $2 RETURNING code, name, rate_to_inr, is_default"
      : "DELETE FROM currencies WHERE code = $1 RETURNING code, name, rate_to_inr, is_default";

    const params = hasUser ? [codeParam, userId] : [codeParam];
    const delRes = await pool.query(delSql, params);

    if (delRes.rowCount === 0) {
      return res.status(404).json({ error: "Currency not found or not allowed to delete" });
    }
    return res.json({ message: "Currency deleted", currency: delRes.rows[0] });
  } catch (error) {
    console.error("Delete currency error:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
// ...existing code...