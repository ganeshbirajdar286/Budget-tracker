import express from "express";
import verifyToken from "../middlewares/authMiddleware.js";
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllRead,
  deleteNotification,
  clearNotifications,
  getSettings,
  updateSettings
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.post("/", verifyToken, createNotification);
router.put("/:id/read", verifyToken, markAsRead);
router.put("/read-all", verifyToken, markAllRead);
router.delete("/:id", verifyToken, deleteNotification);
router.delete("/", verifyToken, clearNotifications);

router.get("/settings", verifyToken, getSettings);
router.put("/settings", verifyToken, updateSettings);

export default router;