import api from "./api";

const createServiceRequest = async (requestData) => {
  const response = await api.post(
    "/api/service-requests",
    requestData,
  );

  return response.data;
};

const getMyRequests = async () => {
  const response = await api.get("/api/my/requests");

  return response.data;
};

const getAllServiceRequests = async () => {
  const response = await api.get(
    "/api/service-requests",
  );

  return response.data;
};

const getMarketplaceJobs = async () => {
  const response = await api.get(
    "/api/marketplace/jobs",
  );

  return response.data;
};

const getServiceRequest = async (requestId) => {
  const response = await api.get(
    `/api/service-requests/${requestId}`,
  );

  return response.data;
};

const acceptServiceRequest = async (requestId) => {
  const response = await api.put(
    `/api/service-requests/${requestId}/accept`,
  );

  return response.data;
};

const startServiceRequest = async (requestId) => {
  const response = await api.put(
    `/api/service-requests/${requestId}/start`,
  );

  return response.data;
};

const completeServiceRequest = async (requestId) => {
  const response = await api.put(
    `/api/service-requests/${requestId}/complete`,
  );

  return response.data;
};

const confirmServiceRequest = async (requestId) => {
  const response = await api.put(
    `/api/service-requests/${requestId}/confirm`,
  );

  return response.data;
};

const getMyJobs = async () => {
  const response = await api.get("/api/my/jobs");

  return response.data;
};

const serviceRequestService = {
  createServiceRequest,
  getMyRequests,
  getAllServiceRequests,
  getMarketplaceJobs,
  getServiceRequest,
  acceptServiceRequest,
  startServiceRequest,
  completeServiceRequest,
  confirmServiceRequest,
  getMyJobs,
};

export default serviceRequestService;