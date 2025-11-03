import api from "../utils/api";

export const createLead = async (leadData) => {
  try {
    const response = await api.post("/admissions/leads", leadData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating lead:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getAllLeads = async () => {
  try {
    const response = await api.get("/admissions/leads");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching leads:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getLeadByToken = async (token) => {
  try {
    const response = await api.get(`/admissions/leads/${token}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching lead ${token}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

export const updateLead = async (token, updateData) => {
  try {
    const response = await api.put(`/admissions/leads/${token}`, updateData);
    return response.data;
  } catch (error) {
    console.error(
      `Error updating lead ${token}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// --- NEW FUNCTION ---
export const updateLeadDetails = async (token, detailsData) => {
  try {
    const response = await api.put(
      `/admissions/leads/${token}/details`,
      detailsData
    );
    return response.data;
  } catch (error) {
    console.error(
      `Error updating lead details ${token}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getTasksForLead = async (leadToken) => {
  try {
    const response = await api.get(`/tasks/lead/${leadToken}`);
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching tasks for lead:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const createTask = async (taskData) => {
  try {
    const response = await api.post("/tasks", taskData);
    return response.data;
  } catch (error) {
    console.error(
      "Error creating task:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getActiveDepartments = async () => {
  try {
    const response = await api.get("/departments");
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching departments:",
      error.response?.data || error.message
    );
    throw error;
  }
};
