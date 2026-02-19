import client from './client'

export const usersAPI = {
  list: () => client.get('/users'),
  get: (id) => client.get(`/users/${id}`),
  update: (id, data) => client.put(`/users/${id}`, data),
  delete: (id) => client.delete(`/users/${id}`),
}
