import client from './client'

export const projectsAPI = {
  list: () => client.get('/projects'),
  get: (id) => client.get(`/projects/${id}`),
  create: (data) => client.post('/projects', data),
  update: (id, data) => client.put(`/projects/${id}`, data),
  delete: (id) => client.delete(`/projects/${id}`),
}
