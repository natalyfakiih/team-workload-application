import api from "./axiosInstance";
export const getUsers = () => api.get("/users");
export const createUser = (data) => api.post("/users", data);
export const assignRole = (id, role) => api.put(`/users/${id}/role`, { role });
export const assignTeam = (id, teamId) =>
  api.put(`/users/${id}/team`, { teamId });
