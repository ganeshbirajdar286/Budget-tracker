import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  deleteUser,
} from "../models/userModel.js";

// ✅ Signup Controller
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1️⃣ Check existing user
    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Create user
    const newUser = await createUser({
      username,
      email,
      password: hashedPassword,
    });

    // 4️⃣ Generate token
    const token = jwt.sign(
      { user_id: newUser.user_id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      msg: "User registered successfully",
      user: newUser,
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Login Controller
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Find user
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // 2️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    // 3️⃣ Create JWT
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      msg: "Login successful",
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Profile (Protected)
export const getProfile = async (req, res) => {
  try {
    const user = await findUserById(req.user.user_id);
    if (!user) return res.status(404).json({ msg: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Profile
export const updateProfile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { username, email } = req.body;
    const updated = await updateUser(user_id, { username, email });
    res.json({ msg: "Profile updated", user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete Account
export const deleteAccount = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    await deleteUser(user_id);
    res.json({ msg: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
