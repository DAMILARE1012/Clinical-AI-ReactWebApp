import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FlaskConical, Eye, EyeOff, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../api/auth'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { value: 'researcher', label: 'Researcher', desc: 'Manage and contribute to research projects' },
  { value: 'admin', label: 'Principal Investigator (Admin)', desc: 'Full access including user management' },
]

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'researcher' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const data = await authAPI.register(form)
      login(data.access_token, data.user)
      toast.success(`Welcome, ${data.user.name}! Your account has been created.`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 via-brand-800 to-indigo-700 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <FlaskConical size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Join the Research Hub</h1>
          <p className="text-indigo-200 leading-relaxed">
            Create your account to start managing research projects and contributing
            to your team's shared knowledge base.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md py-6">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <FlaskConical size={24} className="text-brand-600" />
            <span className="font-semibold text-gray-900">Research Hub</span>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
            <p className="text-sm text-gray-500 mb-7">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="label">Full name</label>
                <input
                  className="input-field"
                  type="text"
                  name="name"
                  placeholder="Dr. Jane Smith"
                  value={form.name}
                  onChange={handle}
                  required
                  autoFocus
                />
              </div>

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
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    className="input-field pr-10"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Minimum 8 characters"
                    value={form.password}
                    onChange={handle}
                    required
                    minLength={8}
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

              <div>
                <label className="label">Role</label>
                <div className="space-y-2">
                  {ROLES.map((r) => (
                    <label
                      key={r.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        form.role === r.value
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={form.role === r.value}
                        onChange={handle}
                        className="mt-0.5 accent-brand-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{r.label}</p>
                        <p className="text-xs text-gray-500">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={loading}>
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
