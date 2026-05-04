import User from "../models/User.js";
import Notification from "../models/Notification.js";

export const createNotification = async ({ userId, title, message, type = "general", relatedItem }) => {
  return Notification.create({
    userId,
    user: userId,
    title,
    message,
    type,
    relatedItem,
    isRead: false,
    read: false
  });
};

export const notifyAudience = async ({ targetAudience = "all", title, message, type, relatedItem }) => {
  const filters = {};
  if (targetAudience === "students") filters.role = "student";
  if (targetAudience === "staff") filters.role = { $in: ["professor", "TA", "staff"] };

  const users = await User.find(filters).select("_id");
  const notifications = [];

  for (const user of users) {
    const existing = relatedItem?.itemId
      ? await Notification.exists({
          userId: user._id,
          type,
          "relatedItem.itemId": relatedItem.itemId
        })
      : null;

    if (!existing) {
      notifications.push({
        userId: user._id,
        user: user._id,
        title,
        message,
        type,
        relatedItem,
        isRead: false,
        read: false
      });
    }
  }

  if (notifications.length === 0) return [];
  return Notification.insertMany(notifications);
};
