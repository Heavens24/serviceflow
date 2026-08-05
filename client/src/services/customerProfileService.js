import api from "./api";


const getMyProfile = async () => {
  const response = await api.get(
    "/api/customer-profile",
  );

  return response.data;
};


const saveProfile = async (
  profileData,
) => {
  const response = await api.put(
    "/api/customer-profile",
    profileData,
  );

  return response.data;
};


const getProfile = async (
  userId,
) => {
  if (!userId) {
    throw new Error(
      "Customer user ID is required.",
    );
  }

  const response = await api.get(
    `/api/customer-profiles/${userId}`,
  );

  return response.data;
};


const customerProfileService = {
  getMyProfile,
  saveProfile,
  getProfile,
};


export default customerProfileService;