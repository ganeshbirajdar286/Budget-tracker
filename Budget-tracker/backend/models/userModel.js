import pool from "../config/db.js"; // PostgreSQL connection pool

// ✅ Create a new user
export const createUser = async ({ username, email, password }) => {
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING user_id, username, email, created_at`,
    [username, email, password]
  );
  return result.rows[0];
};

// ✅ Find user by email (for login)
export const findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0];
};

// ✅ Find user by ID
export const findUserById = async (user_id) => {
  const result = await pool.query(
    `SELECT user_id, username, email, created_at 
     FROM users 
     WHERE user_id = $1`,
    [user_id]
  );
  return result.rows[0];
};

// ✅ Get all users (if ever needed)
export const getAllUsers = async () => {
  const result = await pool.query(
    `SELECT user_id, username, email, created_at FROM users ORDER BY created_at DESC`
  );
  return result.rows;
};

// ✅ Update user
export const updateUser = async (user_id, { username, email }) => {
  const result = await pool.query(
    `UPDATE users
     SET username = $1, email = $2, updated_at = NOW()
     WHERE user_id = $3
     RETURNING user_id, username, email, updated_at`,
    [username, email, user_id]
  );
  return result.rows[0];
};

// ✅ Delete user
export const deleteUser = async (user_id) => {
  await pool.query(`DELETE FROM users WHERE user_id = $1`, [user_id]);
  return { message: "User deleted successfully" };
};
