import api from "./api";

const createReview = async (reviewData) => {
  const response = await api.post(
    "/api/reviews",
    reviewData,
  );

  return response.data;
};

const getReview = async (reviewId) => {
  const response = await api.get(
    `/api/reviews/${reviewId}`,
  );

  return response.data;
};

const getArtisanReviews = async (artisanId) => {
  const response = await api.get(
    `/api/artisans/${artisanId}/reviews`,
  );

  return response.data;
};

const reviewService = {
  createReview,
  getReview,
  getArtisanReviews,
};

export default reviewService;