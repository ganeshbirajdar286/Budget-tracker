import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Normalize token payload so both ids are available
    // some tokens use { user_id: ... } and others use { id: ... }
    const userId = decoded.user_id ?? decoded.id ?? decoded.userId;

    req.user = {
      ...decoded,
      id: decoded.id ?? userId,
      user_id: decoded.user_id ?? userId,
    };

    // keep shortcut for other code
    req.userId = req.user.user_id;

    console.log("verifyToken resolved user:", req.user);

    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    return res.status(403).json({ msg: "Invalid or expired token" });
  }
};

export default verifyToken;