import api from "./axiosInstance";
export const getWorkloadSummary = (params) => api.get("/workload", { params });
// params: { week: 'current' } | { week: 'next' } | { from: '...', to: '...' }
export const getMemberWorkload = (memberId, params) =>
  api.get(`/workload/members/${memberId}`, { params });
