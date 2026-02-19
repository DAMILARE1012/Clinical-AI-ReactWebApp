import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FlaskConical, Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await authAPI.login(form)
      login(data.access_token, data.user)
      toast.success(`Welcome back, ${data.user.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 via-brand-800 to-indigo-700 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <FlaskConical size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Clinical Research Knowledge Hub</h1>
          <p className="text-indigo-200 leading-relaxed">
            Manage your research projects, track experiments, and query your team's
            collective knowledge base with an AI research assistant.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {['Projects', 'Experiments', 'AI Assistant'].map((label) => (
              <div key={label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-sm font-medium text-indigo-100">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <FlaskConical size={24} className="text-brand-600" />
            <span className="font-semibold text-gray-900">Research Hub</span>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h2>
            <p className="text-sm text-gray-500 mb-7">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-600 font-medium hover:underline">
                Register
              </Link>
            </p>

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="label">Email address</label>
                <input
                  className="input-field"
                  type="email"
                  name="email"
                  placeholder="you@institution.edu"
                  value={form.email}
                  onChange={handle}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    className="input-field pr-10"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handle}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
