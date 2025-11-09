// ...existing code...
import express from "express";
import verifyToken from "../middlewares/authMiddleware.js";
import pool from "../config/db.js";

const router = express.Router();

// GET /api/budgets - list budgets for authenticated user
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id; // normalized in middleware
    const result = await pool.query(
      "SELECT * FROM budgets WHERE user_id=$1 ORDER BY month DESC",
      [userId]
    );
    res.json({ budgets: result.rows });
  } catch (err) {
    console.error("Fetch budgets error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/budgets - create budget
router.post("/", verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { category_id, amount, month, description } = req.body;
    const result = await pool.query(
      `INSERT INTO budgets (user_id, category_id, amount, month, description, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5, NOW(), NOW()) RETURNING *`,
      [userId, category_id, amount, month, description]
    );
    res.status(201).json({ budget: result.rows[0] });
  } catch (err) {
    console.error("Create budget error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/budgets/:id - delete a budget
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;
    await pool.query("DELETE FROM budgets WHERE budget_id=$1 AND user_id=$2", [
      id,
      userId,
    ]);
    res.json({ msg: "Budget deleted" });
  } catch (err) {
    console.error("Delete budget error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
// ...existing code...