import api from "../utils/api";

// Get overview stats for the administration dashboard
export const getAdministrationOverview = async () => {
  try {
    const response = await api.get("/administration/overview");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching administration overview:",
      error.response?.data || error.message
    );
    throw error;
  }
};
