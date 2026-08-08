import api from "./api";

const paymentService = {
  // ==========================
  // Initialize Payment
  // ==========================
  async initializePayment(
    serviceRequestId,
  ) {
    const { data } = await api.post(
      `/api/payments/${serviceRequestId}/initialize`,
    );

    return data;
  },

  // ==========================
  // Verify Payment
  // ==========================
  async verifyPayment(reference) {
    const { data } = await api.get(
      `/api/payments/verify/${encodeURIComponent(
        reference,
      )}`,
    );

    return data;
  },
};

export default paymentService;