import api from "./api";

const adminService = {
  // ==========================
  // Admin Dashboard
  // ==========================
  async getDashboard() {
    const { data } = await api.get(
      "/api/admin/dashboard",
    );

    return data;
  },
};

export default adminService;