import api from "./api";

const getConversation = async (serviceRequestId) => {
  const response = await api.get(
    `/api/service-requests/${serviceRequestId}/messages`,
  );

  return response.data;
};

const sendMessage = async (
  serviceRequestId,
  message,
) => {
  const response = await api.post("/api/messages", {
    service_request_id: serviceRequestId,
    message,
  });

  return response.data;
};

const messageService = {
  getConversation,
  sendMessage,
};

export default messageService;