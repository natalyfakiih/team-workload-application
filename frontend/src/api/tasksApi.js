import api from "./axiosInstance";
export const getTasks = () => api.get("/tasks");
export const getMyTasks = () => api.get("/tasks/my");
export const getTaskById = (id) => api.get(`/tasks/${id}`);
export const getTasksByMember = (memberId) =>
  api.get(`/tasks/member/${memberId}`);
export const createTask = (data) => api.post("/tasks", data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const updateStatus = (id, newStatus) =>
  api.patch(`/tasks/${id}/status`, { newStatus });
export const acknowledgeTask = (id) => api.post(`/tasks/${id}/acknowledge`);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
