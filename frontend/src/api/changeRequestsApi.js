import api from "./axiosInstance";
export const getAll = () => api.get("/change-requests");
export const getPending = () => api.get("/change-requests/pending");
export const getByTask = (taskId) => api.get(`/change-requests/task/${taskId}`);
export const createChangeRequest = (data) => api.post("/change-requests", data);
export const approveRequest = (id) => api.put(`/change-requests/${id}/approve`);
export const rejectRequest = (id, note) =>
  api.put(`/change-requests/${id}/reject`, { rejectionNote: note });
export const getMyTaskCRs = (taskId) =>
  api.get(`/change-requests/my-task/${taskId}`);
