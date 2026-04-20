import React, { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { UserPlus } from "lucide-react"
import AuthPage from "../../components/AuthPage"
import AuthForm from "../../components/AuthForm"
import { registerUser, googleAuth } from "../../api/authApi"
import { useAuth } from "../../context/AuthContext"

/**
 * Register page
 *
 * Customize the `fields` array below to change the signup form inputs.
 * Each field descriptor supports: { name, label, type, placeholder, required, initial }.
 *
 * Notes:
 * - The collected payload is passed to `handleSubmit(payload)`. This implementation adds `role: 'student'`
 *   before calling the backend. If you add fields that must be processed server-side (e.g., `rollNumber`,
 *   `department`), ensure the server `register` endpoint accepts and handles them.
 * - To reuse this form elsewhere, import `AuthForm` and provide a custom `fields` array and `onSubmit` handler.
 */
const Register = () => {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState("")
  const [success, setSuccess] = useState("")
  const { login } = useAuth()
  const tokenClientRef = useRef(null)
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

  const handleGoogleProfile = async (profile) => {
    setServerError("")
    try {
      const res = await googleAuth(profile)
      if (res?.token) {
        localStorage.setItem("token", res.token)
        login(res.token, res.user)
        navigate(res.user.role === "admin" ? "/admin" : "/student")
      } else {
        setServerError("Google sign-in succeeded but server did not return a valid session.")
      }
    } catch (err) {
      setServerError(err?.response?.data?.message || err?.message || "Google sign-in failed")
      throw err
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
              setServerError(resp.error)
              return
            }
            try {
              const accessToken = resp.access_token
              const profile = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` },
              }).then((r) => r.json())
              await handleGoogleProfile(profile)
            } catch (err) {
              setServerError("Failed to fetch Google profile")
            }
          },
        })
      } else if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (resp) => {
            try {
              const id_token = resp.credential
              await handleGoogleProfile({ id_token })
            } catch (err) {
              setServerError(err?.response?.data?.message || err?.message || "Google sign-in failed")
            }
          },
        })
      }
    }
    document.body.appendChild(script)
    return () => {
      try { document.body.removeChild(script) } catch (e) {}
    }
  }, [])

  const handleGoogleClick = () => {
    setServerError("")
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken({ prompt: "consent" })
      return
    }
    if (window.google && window.google.accounts && window.google.accounts.id) {
      window.google.accounts.id.prompt()
      return
    }
    setServerError("Google SDK not loaded yet. Try again in a moment.")
  }

  // Edit this `fields` array to add/remove form inputs. See the comment above for format.
  const fields = [
    { name: "username", label: "Full Name", type: "text", placeholder: "John Doe", required: true },
    { name: "email", label: "Email Address", type: "email", placeholder: "student@example.com", required: true },
    { name: "password", label: "Password", type: "password", placeholder: "••••••••", required: true },
    { name: "confirmPassword", label: "Confirm Password", type: "password", placeholder: "••••••••", required: true }
  ]

  const handleSubmit = async (payload) => {
    setServerError("")
    try {
      // server expects `username`, `email`, `password`, `role`
      const data = { ...payload, role: "student" }
      await registerUser(data)
      setSuccess("Account created successfully. Redirecting to login...")
      setTimeout(() => navigate("/login"), 1400)
    } catch (err) {
      setServerError(err?.response?.data?.message || err?.message || "Registration failed")
      throw err
    }
  }

  return (
    <AuthPage>

      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-200">
          <UserPlus className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create Account</h1>
        <p className="text-slate-500 text-sm">Please create your account to continue</p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 bg-red-50/80 border border-red-100 rounded-xl text-sm text-red-600">{serverError}</div>
      )}

      <AuthForm fields={fields} submitLabel="Create Account" onSubmit={handleSubmit} />

      {/* Google sign-in below form (divider + button) */}
      <div className="w-full mt-4 border-t border-slate-200" />
      <div className="flex flex-col items-center mt-4 mb-6">
        <div className="text-center mb-3 text-slate-500 text-sm">Or continue with</div>
        <div className="relative">
          <button
            type="button"
            onClick={handleGoogleClick}
            aria-label="Sign up with Google"
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

      {success && <div className="mt-4 text-center text-teal-600 text-sm">{success}</div>}

      <div className="text-center mt-4">
        <Link to="/login" className="text-sm text-slate-500 hover:text-slate-800 hover:underline">
          Already have an account? Sign in
        </Link>
      </div>
    </AuthPage>
  )
}

export default Register
