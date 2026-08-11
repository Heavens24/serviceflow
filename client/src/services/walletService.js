import api from "./api";

const walletService = {
  // ==========================
  // Wallet Summary
  // ==========================
  async getWallet() {
    const response = await api.get(
      "/api/wallet",
    );

    return response.data;
  },

  // ==========================
  // Supported Payout Banks
  // ==========================
  async getPayoutBanks() {
    const response = await api.get(
      "/api/wallet/payout-banks",
    );

    return response.data;
  },

  // ==========================
  // Artisan Payout Account
  // ==========================
  async getPayoutAccount() {
    const response = await api.get(
      "/api/wallet/payout-account",
    );

    return response.data;
  },

  // ==========================
  // Validate Payout Account
  // ==========================
  async validatePayoutAccount(payload) {
    const response = await api.post(
      "/api/wallet/payout-account/validate",
      payload,
    );

    return response.data;
  },

  // ==========================
  // Save / Update Payout Account
  // ==========================
  async savePayoutAccount(payload) {
    const response = await api.put(
      "/api/wallet/payout-account",
      payload,
    );

    return response.data;
  },

  // ==========================
  // Wallet Transactions
  // ==========================
  async getTransactions({
    page = 1,
    perPage = 20,
    type = "",
    status = "",
  } = {}) {
    const response = await api.get(
      "/api/wallet/transactions",
      {
        params: {
          page,
          per_page: perPage,

          ...(type
            ? {
                type,
              }
            : {}),

          ...(status
            ? {
                status,
              }
            : {}),
        },
      },
    );

    return response.data;
  },

  // ==========================
  // Withdrawal History
  // ==========================
  async getWithdrawals({
    page = 1,
    perPage = 20,
    status = "",
  } = {}) {
    const response = await api.get(
      "/api/wallet/withdrawals",
      {
        params: {
          page,
          per_page: perPage,

          ...(status
            ? {
                status,
              }
            : {}),
        },
      },
    );

    return response.data;
  },

  // ==========================
  // Request Withdrawal
  // ==========================
  async requestWithdrawal(amount) {
    const response = await api.post(
      "/api/wallet/withdrawals",
      {
        amount,
      },
    );

    return response.data;
  },
};

export default walletService;