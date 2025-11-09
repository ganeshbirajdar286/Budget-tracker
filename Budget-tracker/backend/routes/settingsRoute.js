import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import verifyToken from '../middlewares/authMiddleware.js';
import { createObjectCsvWriter } from 'csv-writer';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// GET /api/users/me - Get current user data
router.get('/me', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await pool.query(`
      SELECT 
        user_id,
        username,
        email
      FROM users 
      WHERE user_id = $1
    `, [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { first_name, last_name, phone, currency, language, timezone } = req.body;

    const result = await pool.query(`
      UPDATE users 
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        currency = COALESCE($4, currency),
        language = COALESCE($5, language),
        timezone = COALESCE($6, timezone),
        updated_at = NOW()
      WHERE user_id = $7
      RETURNING user_id, email, first_name, last_name, phone, currency, language, timezone
    `, [first_name, last_name, phone, currency, language, timezone, userId]);

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/password - Change password
router.put('/password', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { current_password, new_password } = req.body;

    // First, check if the passwords are provided
    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Both current and new password are required' });
    }

    // Get user's current password hash
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Compare current password
    const validPassword = await bcrypt.compare(current_password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password
    const updateResult = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE user_id = $2 RETURNING user_id',
      [hashedPassword, userId]
    );

    if (updateResult.rowCount === 0) {
      throw new Error('Failed to update password');
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Failed to change password',
      details: error.message 
    });
  }
});

// GET /api/user-preferences - Get user preferences
router.get('/preferences', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await pool.query(`
      SELECT 
        theme,
        dashboard_layout,
        default_view,
        weekly_report,
        monthly_report,
        budget_alerts,
        spending_notifications,
        email_notifications,
        push_notifications
      FROM user_preferences 
      WHERE user_id = $1
    `, [userId]);

    // Return default preferences if none exist
    if (result.rowCount === 0) {
      const defaults = {
        theme: 'dark',
        dashboard_layout: 'standard',
        default_view: 'dashboard',
        weekly_report: true,
        monthly_report: false,
        budget_alerts: true,
        spending_notifications: true,
        email_notifications: true,
        push_notifications: true
      };

      // Insert default preferences
      await pool.query(`
        INSERT INTO user_preferences (user_id, theme, dashboard_layout, default_view, weekly_report, 
          monthly_report, budget_alerts, spending_notifications, email_notifications, push_notifications)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [userId, ...Object.values(defaults)]);

      return res.json({ preferences: defaults });
    }

    res.json({ preferences: result.rows[0] });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user-preferences - Update user preferences
router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const {
      theme,
      dashboard_layout,
      default_view,
      weekly_report,
      monthly_report,
      budget_alerts,
      spending_notifications,
      email_notifications,
      push_notifications
    } = req.body;

    const result = await pool.query(`
      UPDATE user_preferences 
      SET 
        theme = COALESCE($1, theme),
        dashboard_layout = COALESCE($2, dashboard_layout),
        default_view = COALESCE($3, default_view),
        weekly_report = COALESCE($4, weekly_report),
        monthly_report = COALESCE($5, monthly_report),
        budget_alerts = COALESCE($6, budget_alerts),
        spending_notifications = COALESCE($7, spending_notifications),
        email_notifications = COALESCE($8, email_notifications),
        push_notifications = COALESCE($9, push_notifications),
        updated_at = NOW()
      WHERE user_id = $10
      RETURNING *
    `, [theme, dashboard_layout, default_view, weekly_report, monthly_report,
        budget_alerts, spending_notifications, email_notifications, push_notifications, userId]);

    res.json({ preferences: result.rows[0] });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/privacy-settings - Get privacy settings
router.get('/privacy', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const result = await pool.query(`
      SELECT 
        data_sharing,
        analytics_tracking,
        marketing_emails,
        public_profile,
        show_balances,
        export_data
      FROM privacy_settings 
      WHERE user_id = $1
    `, [userId]);

    if (result.rowCount === 0) {
      const defaults = {
        data_sharing: false,
        analytics_tracking: true,
        marketing_emails: false,
        public_profile: false,
        show_balances: true,
        export_data: true
      };

      await pool.query(`
        INSERT INTO privacy_settings (
          user_id, data_sharing, analytics_tracking, marketing_emails, 
          public_profile, show_balances, export_data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [userId, ...Object.values(defaults)]);

      return res.json({ settings: defaults });
    }

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/privacy-settings - Update privacy settings
router.put('/privacy', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const {
      data_sharing,
      analytics_tracking,
      marketing_emails,
      public_profile,
      show_balances,
      export_data
    } = req.body;

    const result = await pool.query(`
      UPDATE privacy_settings 
      SET 
        data_sharing = COALESCE($1, data_sharing),
        analytics_tracking = COALESCE($2, analytics_tracking),
        marketing_emails = COALESCE($3, marketing_emails),
        public_profile = COALESCE($4, public_profile),
        show_balances = COALESCE($5, show_balances),
        export_data = COALESCE($6, export_data),
        updated_at = NOW()
      WHERE user_id = $7
      RETURNING *
    `, [data_sharing, analytics_tracking, marketing_emails, public_profile, show_balances, export_data, userId]);

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/export-data - Export user data
router.get('/export-data', verifyToken, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const tempDir = path.join(process.cwd(), 'temp');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const archive = archiver('zip');
    const output = fs.createWriteStream(path.join(tempDir, `export-${userId}.zip`));

    output.on('close', () => {
      res.download(path.join(tempDir, `export-${userId}.zip`), 'budget-data.zip', (err) => {
        if (err) console.error('Download error:', err);
        // Cleanup
        fs.unlink(path.join(tempDir, `export-${userId}.zip`), (err) => {
          if (err) console.error('Cleanup error:', err);
        });
      });
    });

    archive.pipe(output);

    // Export transactions
    const transactions = await pool.query('SELECT * FROM transactions WHERE user_id = $1', [userId]);
    archive.append(JSON.stringify(transactions.rows), { name: 'transactions.json' });

    // Export budgets
    const budgets = await pool.query('SELECT * FROM budgets WHERE user_id = $1', [userId]);
    archive.append(JSON.stringify(budgets.rows), { name: 'budgets.json' });

    // Export categories
    const categories = await pool.query('SELECT * FROM categories WHERE user_id = $1', [userId]);
    archive.append(JSON.stringify(categories.rows), { name: 'categories.json' });

    // Export subscriptions
    const subscriptions = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
    archive.append(JSON.stringify(subscriptions.rows), { name: 'subscriptions.json' });

    archive.finalize();
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/account - Delete account
router.delete('/account', verifyToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.user_id;
    
    await client.query('BEGIN');

    // Delete related data first (assuming CASCADE is not set)
    await client.query('DELETE FROM transactions WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM budgets WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM categories WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM subscriptions WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM privacy_settings WHERE user_id = $1', [userId]);
    
    // Finally delete the user
    await client.query('DELETE FROM users WHERE user_id = $1', [userId]);
    
    await client.query('COMMIT');
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

export default router;