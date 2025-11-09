import pool from "../config/db.js";

const getUserId = (req) => req.user?.user_id ?? req.user?.id ?? null;

export const getNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);
    const q = `SELECT id, title, message, type, priority, is_read, action_url, data, created_at
               FROM notifications WHERE user_id=$1 ORDER BY created_at DESC`;
    const result = await pool.query(q, [userId]);
    res.json({ notifications: result.rows });
  } catch (err) {
    console.error("getNotifications:", err);
    res.status(500).json({ error: err.message });
  }
};

export const createNotification = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { title, message, type = "system", priority = "low", action_url = null, data = null } = req.body;
    const q = `INSERT INTO notifications (user_id, title, message, type, priority, action_url, data, created_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7, NOW()) RETURNING *`;
    const result = await pool.query(q, [userId, title, message, type, priority, action_url, data]);
    res.status(201).json({ notification: result.rows[0] });
  } catch (err) {
    console.error("createNotification:", err);
    res.status(500).json({ error: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = req.params.id;
    await pool.query("UPDATE notifications SET is_read = true WHERE id=$1 AND user_id=$2", [id, userId]);
    res.json({ success: true });
  } catch (err) {
    console.error("markAsRead:", err);
    res.status(500).json({ error: err.message });
  }
};

export const markAllRead = async (req, res) => {
  try {
    const userId = getUserId(req);
    await pool.query("UPDATE notifications SET is_read = true WHERE user_id=$1", [userId]);
    res.json({ success: true });
  } catch (err) {
    console.error("markAllRead:", err);
    res.status(500).json({ error: err.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const userId = getUserId(req);
    const id = req.params.id;
    await pool.query("DELETE FROM notifications WHERE id=$1 AND user_id=$2", [id, userId]);
    res.json({ success: true });
  } catch (err) {
    console.error("deleteNotification:", err);
    res.status(500).json({ error: err.message });
  }
};

export const clearNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);
    await pool.query("DELETE FROM notifications WHERE user_id=$1", [userId]);
    res.json({ success: true });
  } catch (err) {
    console.error("clearNotifications:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getSettings = async (req, res) => {
  try {
    const userId = getUserId(req);
    const q = "SELECT settings FROM notification_settings WHERE user_id=$1";
    const r = await pool.query(q, [userId]);
    if (r.rows.length === 0) {
      return res.json({ settings: {
        email_notifications: true,
        push_notifications: true,
        billing_reminders: true,
        subscription_alerts: true,
        budget_alerts: true
      }});
    }
    res.json({ settings: r.rows[0].settings });
  } catch (err) {
    console.error("getSettings:", err);
    res.status(500).json({ error: err.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const userId = getUserId(req);
    const settings = req.body;
    const upsert = `
      INSERT INTO notification_settings (user_id, settings, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) DO UPDATE SET settings = $2, updated_at = NOW()
      RETURNING settings
    `;
    const r = await pool.query(upsert, [userId, settings]);
    res.json({ settings: r.rows[0].settings });
  } catch (err) {
    console.error("updateSettings:", err);
    res.status(500).json({ error: err.message });
  }
};