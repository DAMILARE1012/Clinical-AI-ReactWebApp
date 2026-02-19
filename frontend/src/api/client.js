import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 s — surfaces a real error instead of hanging forever
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    if (err.code === 'ECONNABORTED') return Promise.reject('Request timed out — is the backend running?')
    if (!err.response) return Promise.reject('Cannot reach server — check that the backend is running on port 8000')
    return Promise.reject(err.response?.data?.detail ?? `Server error ${err.response.status}`)
  }
)

export default client
