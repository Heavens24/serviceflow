import api from "./api";

const getNotifications = async () => {
  const response = await api.get("/api/notifications");

  return response.data;
};

const getUnreadCount = async () => {
  const response = await api.get(
    "/api/notifications/unread-count",
  );

  return response.data;
};

const markAsRead = async (notificationId) => {
  const response = await api.patch(
    `/api/notifications/${notificationId}/read`,
  );

  return response.data;
};

const markAllAsRead = async () => {
  const response = await api.patch(
    "/api/notifications/read-all",
  );

  return response.data;
};

const notificationService = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};

export default notificationService;