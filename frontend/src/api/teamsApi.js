import api from "./axiosInstance";
export const getTeams = () => api.get("/teams");
export const createTeam = (name) => api.post("/teams", { name });
export const renameTeam = (id, name) => api.put(`/teams/${id}`, { name });
export const deleteTeam = (id) => api.delete(`/teams/${id}`);
