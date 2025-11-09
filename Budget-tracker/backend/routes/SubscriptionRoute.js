import express from "express";
import pool from "../config/db.js";
import verifyToken from "../middlewares/authMiddleware.js";

const router = express.Router();

// Helper: get normalized user id from token
const getUserId = (req) => req.user?.user_id ?? req.user?.id ?? null;

// GET / -> list user's subscriptions
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const result = await pool.query(
      "SELECT id, name, amount, currency, billing_cycle, category, next_billing_date, status, description FROM subscriptions WHERE user_id = $1 ORDER BY next_billing_date",
      [userId]
    );
    return res.json({ subscriptions: result.rows });
  } catch (err) {
    console.error("Fetch subscriptions error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST / -> create subscription
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const {
      name,
      amount,
      currency,
      billing_cycle,
      category,
      next_billing_date,
      status = "active",
      description = null,
    } = req.body;

    if (!name || amount == null || !currency || !billing_cycle || !next_billing_date) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const insertRes = await pool.query(
      `INSERT INTO subscriptions
        (name, amount, currency, billing_cycle, category, next_billing_date, status, description, user_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW(), NOW())
       RETURNING id, name, amount, currency, billing_cycle, category, next_billing_date, status, description`,
      [name, amount, currency, billing_cycle, category, next_billing_date, status, description, userId]
    );

    return res.status(201).json({ subscription: insertRes.rows[0] });
  } catch (err) {
    console.error("Create subscription error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /:id -> update allowed fields (partial update)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    // Only allow specific fields to be updated
    const allowed = ["name", "amount", "currency", "billing_cycle", "category", "next_billing_date", "status", "description"];
    const fields = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        fields.push(`${key} = $${idx++}`);
        values.push(req.body[key]);
      }
    }

    if (fields.length === 0) return res.status(400).json({ error: "No updatable fields provided" });

    // add updated_at and where params
    fields.push(`updated_at = NOW()`);
    values.push(id, userId); // $idx -> id, $idx+1 -> userId

    const updateSql = `UPDATE subscriptions SET ${fields.join(", ")} WHERE id = $${idx++} AND user_id = $${idx} RETURNING id, name, amount, currency, billing_cycle, category, next_billing_date, status, description`;
    const updateRes = await pool.query(updateSql, values);

    if (updateRes.rowCount === 0) return res.status(404).json({ error: "Subscription not found" });

    return res.json({ subscription: updateRes.rows[0] });
  } catch (err) {
    console.error("Update subscription error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /:id -> delete subscription
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });

    const delRes = await pool.query("DELETE FROM subscriptions WHERE id = $1 AND user_id = $2 RETURNING id", [id, userId]);
    if (delRes.rowCount === 0) return res.status(404).json({ error: "Subscription not found" });

    return res.json({ message: "Subscription deleted successfully" });
  } catch (err) {
    console.error("Delete subscription error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;