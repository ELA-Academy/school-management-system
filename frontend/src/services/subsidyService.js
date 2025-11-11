import api from "../utils/api";

export const getSubsidies = async () => {
  try {
    const response = await api.get("/subsidies/");
    return response.data;
  } catch (error) {
    console.error("Error fetching subsidies:", error);
    throw error;
  }
};

export const createSubsidy = async (subsidyData) => {
  try {
    const response = await api.post("/subsidies/", subsidyData);
    return response.data;
  } catch (error) {
    console.error("Error creating subsidy:", error);
    throw error;
  }
};
