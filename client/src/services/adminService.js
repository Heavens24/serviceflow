import api from "./api";

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "all"
      ) {
        return;
      }

      query.set(
        key,
        String(value),
      );
    },
  );

  return query.toString();
}

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

  // ==========================
  // Admin Users
  // ==========================
  async getUsers(params = {}) {
    const queryString =
      buildQuery(params);

    const endpoint = queryString
      ? `/api/admin/users?${queryString}`
      : "/api/admin/users";

    const { data } = await api.get(
      endpoint,
    );

    return data;
  },

  // ==========================
  // Update User Status
  // ==========================
  async updateUserStatus(
    userId,
    status,
  ) {
    const { data } = await api.patch(
      `/api/admin/users/${userId}/status`,
      {
        status,
      },
    );

    return data;
  },

  // ==========================
  // Update User Verification
  // ==========================
  async updateUserVerification(
    userId,
    verificationData,
  ) {
    const payload = {};

    if (
      typeof verificationData?.verified
      === "boolean"
    ) {
      payload.verified =
        verificationData.verified;
    }

    if (
      typeof verificationData
        ?.email_verified === "boolean"
    ) {
      payload.email_verified =
        verificationData.email_verified;
    }

    const { data } = await api.patch(
      `/api/admin/users/${userId}/verify`,
      payload,
    );

    return data;
  },

  // ==========================
  // Update User Role
  // ==========================
  async updateUserRole(
    userId,
    role,
  ) {
    const { data } = await api.patch(
      `/api/admin/users/${userId}/role`,
      {
        role,
      },
    );

    return data;
  },

  // ==========================
  // Admin Jobs
  // ==========================
  async getJobs(params = {}) {
    const queryString =
      buildQuery(params);

    const endpoint = queryString
      ? `/api/admin/jobs?${queryString}`
      : "/api/admin/jobs";

    const { data } = await api.get(
      endpoint,
    );

    return data;
  },

  // ==========================
  // Get One Admin Job
  // ==========================
  async getJob(jobId) {
    const { data } = await api.get(
      `/api/admin/jobs/${jobId}`,
    );

    return data;
  },

  // ==========================
  // Update Job Status
  // ==========================
  async updateJobStatus(
    jobId,
    status,
  ) {
    const { data } = await api.patch(
      `/api/admin/jobs/${jobId}/status`,
      {
        status,
      },
    );

    return data;
  },

  // ==========================
  // Delete Job
  // ==========================
  async deleteJob(jobId) {
    const { data } = await api.delete(
      `/api/admin/jobs/${jobId}`,
    );

    return data;
  },
};

export default adminService;