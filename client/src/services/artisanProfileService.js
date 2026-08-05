import api from "./api";

const getMyProfile = async () => {
  const response = await api.get(
    "/api/artisan-profile",
  );

  return response.data;
};

const saveProfile = async (profileData) => {
  const response = await api.put(
    "/api/artisan-profile",
    profileData,
  );

  return response.data;
};

const getAllProfiles = async () => {
  const response = await api.get(
    "/api/artisan-profiles",
  );

  return response.data;
};

const getProfile = async (userId) => {
  const response = await api.get(
    `/api/artisan-profiles/${userId}`,
  );

  return response.data;
};

const artisanProfileService = {
  getMyProfile,
  saveProfile,
  getAllProfiles,
  getProfile,
};

export default artisanProfileService;