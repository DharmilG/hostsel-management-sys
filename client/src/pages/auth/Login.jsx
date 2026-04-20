import React, { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { LogIn, AlertCircle, ArrowRight } from "lucide-react"
import { loginUser, googleAuth } from "../../api/authApi"
import { useAuth } from "../../context/AuthContext"
import AuthPage from "../../components/AuthPage"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { login } = useAuth()

  const [lastLoginInfo, setLastLoginInfo] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem("lastLoginInfo")
      if (raw) setLastLoginInfo(JSON.parse(raw))
    } catch (e) {}
  }, [])

  const formatDate = (iso) => {
    if (!iso) return ""
    try {
      return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    } catch (e) {
      return iso
    }
  }

  const tokenClientRef = useRef(null)

  const handleGoogleProfile = async (profile) => {
    setLoading(true)
    setError("")
    try {
      // send profile or tokens to backend to exchange/create a local session
      const res = await googleAuth(profile)
      if (res?.token) {
        localStorage.setItem("token", res.token)
        login(res.token, res.user)
        navigate(res.user.role === "admin" ? "/admin" : "/student")
      } else {
        setError("Google sign-in succeeded but server did not return a valid session.")
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Google sign-in failed")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) return

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid email profile",
          callback: async (resp) => {
            if (resp.error) {
              setError(resp.error)
              return
            }
            try {
              const accessToken = resp.access_token
              const profile = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` },
              }).then((r) => r.json())
              await handleGoogleProfile(profile)
            } catch (err) {
              setError("Failed to fetch Google profile")
            }
          },
        })
      } else if (window.google && window.google.accounts && window.google.accounts.id) {
        // fallback to ID token flow
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp) => {
            try {
              const id_token = resp.credential
              const res = await googleAuth({ id_token })
              if (res?.token) {
                localStorage.setItem("token", res.token)
                login(res.token, res.user)
                navigate(res.user.role === "admin" ? "/admin" : "/student")
              } else {
                setError("Google sign-in succeeded but server did not return a valid session.")
              }
            } catch (err) {
              setError(err?.response?.data?.message || err?.message || "Google sign-in failed")
            }
          },
        })
      }
    }

    document.body.appendChild(script)
    return () => {
      try {
        document.body.removeChild(script)
      } catch (e) {}
    }
  }, [])

  const handleGoogleClick = () => {
    setError("")
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken({ prompt: "consent" })
      return
    }

    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt()
      return
    }

    setError("Google SDK not loaded yet. Try again in a moment.")
  }

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
    <AuthPage>
      

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

      <form
        onSubmit={handleSubmit}
        className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-8 overflow-visible transform transition-all hover:scale-[1.01]"
      >
        {/* Inputs laid out in a responsive two-column grid on larger screens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="group">
              <label className="block text-lg font-medium text-slate-500 mb-1 ml-1">Email Address</label>
              <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@example.com"
              required
              className="w-full bg-white/50 border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all text-slate-700 placeholder:text-slate-400"
              />
          </div>

          <div className="group">
              <label className="block text-lg font-medium text-slate-500 mb-1 ml-1">Password</label>
              <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-white/50 border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all text-slate-700 placeholder:text-slate-400"
              />
          </div>

          {/* Submit button spans both columns */}
          <div className="md:col-span-2">
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
          </div>

          <div className="md:col-span-2 text-center mt-4">
              <Link to="/forgot-password" className="text-sm text-slate-500 hover:text-slate-800 hover:underline transition-colors">
                  Forgot password?
              </Link>
          </div>
          <div className="md:col-span-2 text-center mt-2">
            <Link to="/register" className="text-sm text-slate-500 hover:text-slate-800 hover:underline transition-colors">
              Don't have an account? Create one
            </Link>
          </div>
        </div>
      </form>

      {/* Google sign-in below form (divider + button) */}
      <div className="w-full mt-4 border-t border-slate-200" />
      <div className="flex flex-col items-center mt-4 mb-6">
        <div className="text-center mb-3 text-slate-500 text-sm">Or continue with</div>
        <div className="relative">
          <button
            type="button"
            onClick={handleGoogleClick}
            aria-label="Sign in with Google"
            className="w-14 h-14 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center shadow border border-slate-200 ring-1 ring-slate-100 hover:shadow-xl"
          >
            <svg className="w-10 h-10" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M533.5 278.4c0-17.8-1.6-35.1-4.6-51.7H272v98h147.7c-6.4 34.5-25.4 63.8-54.3 83.4v69.2h87.7c51.2-47.2 82.4-116.7 82.4-198.9z"/>
              <path fill="#34A853" d="M272 544.3c73.9 0 135.9-24.6 181.1-66.9l-87.7-69.2c-24.3 16.3-55.6 26-93.4 26-71.7 0-132.5-48.2-154.3-112.9H28.6v70.9C74 494.6 167.7 544.3 272 544.3z"/>
              <path fill="#F4B400" d="M117.7 323.3c-10.8-31.2-10.8-64.9 0-96.1V156.3H28.6c-30.4 60.8-30.4 132.6 0 193.3l89.1-26.3z"/>
              <path fill="#EA4335" d="M272 107.7c39.9 0 75.9 13.7 104.1 40.6l78.2-78.2C403.7 24.1 338.9 0 272 0 167.7 0 74 49.7 28.6 125.8l89.1 70.2C139.5 156 200.3 107.7 272 107.7z"/>
            </svg>
          </button>
          {lastLoginInfo && lastLoginInfo.method === 'google' && (
            <div className="absolute -top-3 -right-3 bg-white/70 border border-teal-300 text-teal-700 text-xs font-medium px-3 py-1 rounded-full shadow-sm whitespace-nowrap backdrop-blur-sm">
              Last used
            </div>
          )}
        </div>
      </div>
    </AuthPage>
  )
}

export default Login