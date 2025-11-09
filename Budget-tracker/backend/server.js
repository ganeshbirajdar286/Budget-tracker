// server.js
import express from "express";
import bcrypt from "bcryptjs";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import pool from "./config/db.js";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errorHandler.js";
import session from "express-session";
import  verifyToken  from "./middlewares/authMiddleware.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import currenciesRoutes from "./routes/currencieRoute.js";
import subscriptionRoutes from "./routes/SubscriptionRoute.js";
import settingsRouter from './routes/settingsRoute.js';
import reportsRouter from './routes/reportsRoute.js';
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const saltRounds = 15;

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BASE_URL = process.env.BASE_URL || `http://localhost:${port}`;

// ================= Middleware =================
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-deployed-site-url.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(errorHandler);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.use('/api/budgets', budgetRoutes); // Add this line
app.use("/api/currencies", currenciesRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use('/api/users', settingsRouter);
app.use('/api/reports', reportsRouter);
app.use("/api/notifications", notificationRoutes);
// ---------------- Helper: sign JWT & set cookie ----------------
// ...existing code...
function createAndSetToken(res, user) {
  const token = jwt.sign(
    { user_id: user.user_id, email: user.email }, // use user_id consistently
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return token;
}
// ...existing code...

app.get("/transactions", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, c.name AS category_name 
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.category_id
       WHERE t.user_id = $1
       ORDER BY t.transaction_date DESC`,
      [req.user.id]
    );
    res.json({ transactions: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/categories", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM categories WHERE user_id=$1",
      [req.user.id]
    );
    res.json({ categories: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/transactions", verifyToken, async (req, res) => {
  try {
    console.log("POST /transactions req.user:", req.user); // <-- debug
    const {
      category_id, type, amount, currency, description, merchant, transaction_date,
    } = req.body;
    const userId = req.user?.user_id ?? req.user?.id;
    console.log("Resolved userId:", userId); // <-- debug

    const result = await pool.query(
      `INSERT INTO transactions
        (user_id, category_id, type, amount, currency, description, merchant, transaction_date, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, NOW(), NOW())
       RETURNING *`,
      [userId, category_id, type, amount, currency, description, merchant, transaction_date]
    );

    let createdNotification = null;
    try {
      const title = `New transaction: ${merchant || description || "Transaction"}`;
      const message = `You spent ₹${Number(amount).toLocaleString("en-IN")} on ${merchant || description || "an item"}`;
      const notifRes = await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, priority, action_url, created_at)
         VALUES ($1,$2,$3,$4,$5,$6, NOW()) RETURNING *`,
        [userId, `New transaction: ${merchant||description}`, `You spent ₹${Number(amount).toLocaleString('en-IN')} on ${merchant||description}`, 'transaction', 'low', '/transactions']
      );
      console.log('Notification created for txn:', notifRes.rows[0]);
      createdNotification = notifRes.rows[0];
    } catch (notifErr) {
      console.warn("Failed to insert notification:", notifErr?.message || notifErr);
    }

    res.status(201).json({ transaction: result.rows[0], notification: createdNotification });
  } catch (err) {
    console.error("POST /transactions error:", err);
    res.status(500).json({ error: err.message });
  }
});



app.post("/sign-up", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ error: "All fields are required" });

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{6,50}$/;
    if (!passwordRegex.test(password))
      return res.status(400).json({
        error:
          "Password must be 6-50 chars long and include uppercase, lowercase, number, and special char",
      });

    // Check if username or email already exists
    const userCheck = await pool.query(
      "SELECT * FROM users WHERE email=$1 OR username=$2",
      [email, username]
    );

    if (userCheck.rows.length > 0) {
      const existingUser = userCheck.rows[0];
      if (existingUser.email === email) return res.status(400).json({ error: "Email already registered" });
      return res.status(400).json({ error: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [username, email, hashedPassword]
    );

    const user = result.rows[0];
    delete user.password_hash;

    const token = createAndSetToken(res, user);

    res.status(201).json({ message: "User created & authenticated", user, token });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message || "Something went wrong" });
  }
});

// ================= SIGN IN =================
app.post("/sign-in", async (req, res) => {
  try {
    const { emailOrName, password } = req.body;
    if (!emailOrName || !password)
      return res.status(400).json({ error: "All fields are required" });

    const userQuery = await pool.query(
      "SELECT * FROM users WHERE email=$1 OR username=$1",
      [emailOrName]
    );
    if (userQuery.rows.length === 0)
      return res.status(400).json({ error: "User does not exist" });

    const user = userQuery.rows[0];

    if (!user.password_hash || user.password_hash === "google_oauth") {
      return res.status(400).json({
        error: "This account uses Google OAuth. Please sign in with Google.",
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = createAndSetToken(res, user);
    const safeUser = { ...user };
    delete safeUser.password_hash;

    res.json({ message: "Login successful", user: safeUser, token });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ error: err.message || "Something went wrong" });
  }
});

// ================= Google OAuth =================
passport.serializeUser((user, done) => done(null, user.user_id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE user_id=$1", [id]);
    if (result.rows.length === 0) return done(null, null);
    const user = result.rows[0];
    delete user.password_hash;
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.VITE_BASE_URL}/auth/google/callback`
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const username = profile.displayName || "GoogleUser";

        if (!email) return done(new Error("Google profile has no email"));

        const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
        let user;

        if (result.rows.length === 0) {
          const insert = await pool.query(
            "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
            [username, email, "google_oauth"]
          );
          user = insert.rows[0];
        } else {
          user = result.rows[0];
        }

        delete user.password_hash;
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Google routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: `${FRONTEND_URL}/sign-in` }),
  (req, res) => {
    if (!req.user) return res.redirect(`${FRONTEND_URL}/sign-in`);
    const token = createAndSetToken(res, req.user);
    res.redirect(`${FRONTEND_URL}/DashBoard?token=${token}`);
  }
);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Debug endpoint: create a test notification for the authenticated user
app.post("/api/debug/notifications", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.user_id ?? req.user?.id;
    const { title = "Debug notification", message = "This is a test", priority = "low" } = req.body;
    const q = `INSERT INTO notifications (user_id, title, message, type, priority, action_url, created_at)
               VALUES ($1,$2,$3,$4,$5,$6, NOW()) RETURNING *`;
    const r = await pool.query(q, [userId, title, message, "debug", priority, "/debug"]);
    console.log("Debug notification created for user:", userId, r.rows[0]);
    res.status(201).json({ notification: r.rows[0] });
  } catch (err) {
    console.error("DEBUG /api/debug/notifications error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));

export default app;
