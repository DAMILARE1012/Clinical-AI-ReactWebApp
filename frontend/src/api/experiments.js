import client from './client'

export const experimentsAPI = {
  list: (projectId) => client.get(`/projects/${projectId}/experiments`),
  get: (id) => client.get(`/experiments/${id}`),
  create: (projectId, data) => client.post(`/projects/${projectId}/experiments`, data),
  update: (id, data) => client.put(`/experiments/${id}`, data),
  delete: (id) => client.delete(`/experiments/${id}`),
}
