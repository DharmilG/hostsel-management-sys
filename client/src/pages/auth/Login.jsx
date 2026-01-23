import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LogIn, AlertCircle, ArrowRight } from "lucide-react"
import { loginUser } from "../../api/authApi"
import { useAuth } from "../../context/AuthContext"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await loginUser({ email, password })
      localStorage.setItem("token", res.token)
      login(res.token, res.user)
      navigate(res.user.role === "admin" ? "/admin" : "/student")
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    // FIXED: 'fixed inset-0 z-50' forces this div to cover the entire viewport, 
    // sitting on top of any sidebars or parent layouts that might be showing colors on the side.
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8FAFC] overflow-hidden">
      
      {/* Animated Background Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-300/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-teal-300/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse delay-700" />
      <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-pink-300/30 rounded-full blur-[100px] mix-blend-multiply animate-pulse delay-1000" />

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4">
        <form
          onSubmit={handleSubmit}
          className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-8 transform transition-all hover:scale-[1.01]"
        >
          {/* Header */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-200">
                <LogIn className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 text-sm">Please sign in to your account</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50/80 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Inputs */}
          <div className="space-y-5">
            <div className="group">
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Email Address</label>
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                required
                className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all text-slate-700 placeholder:text-slate-400"
                />
            </div>

            <div className="group">
                <label className="block text-xs font-medium text-slate-500 mb-1 ml-1">Password</label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all text-slate-700 placeholder:text-slate-400"
                />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl py-3.5 shadow-lg shadow-slate-300/50 hover:shadow-xl hover:shadow-slate-300/60 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            
            <div className="text-center mt-4">
                <a href="#" className="text-sm text-slate-500 hover:text-slate-800 hover:underline transition-colors">
                    Forgot password?
                </a>
            </div>
          </div>
        </form>
        
        {/* Footer Text */}
        <p className="text-center text-slate-400 text-xs mt-8">
            © 2024 Education Portal. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default Login