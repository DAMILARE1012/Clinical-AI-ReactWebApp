import client from './client'
import axios from 'axios'

export const authAPI = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  me: (token) =>
    axios
      .get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.data),
}
