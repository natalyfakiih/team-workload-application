import api from "./axiosInstance";

export const getInvitations = () => api.get("/invitations");
export const createInvitation = (data) => api.post("/invitations", data);
export const cancelInvitation = (id) => api.delete(`/invitations/${id}`);
export const validateToken = (token) =>
  api.get("/invitations/validate", { params: { token } });
export const acceptInvitation = (data) => api.post("/invitations/accept", data);
