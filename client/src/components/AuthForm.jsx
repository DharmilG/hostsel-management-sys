import React, { useState } from "react"
import { ArrowRight, AlertCircle } from "lucide-react"

/**
 * AuthForm - Reusable authentication form
 *
 * How to configure `fields`:
 * - Provide an array of field descriptors to the `fields` prop:
 *   [
 *     { name: 'email', label: 'Email Address', type: 'email', placeholder: 'you@school.edu', required: true },
 *     { name: 'password', label: 'Password', type: 'password', required: true },
 *     { name: 'confirmPassword', label: 'Confirm Password', type: 'password' } // special check included
 *   ]
 * - Supported descriptor keys:
 *   - `name` (string) : unique field key (required)
 *   - `label` (string): label text shown above input
 *   - `type` (string) : HTML input type (text, email, password, number, date, etc.)
 *   - `placeholder` (string)
 *   - `required` (boolean)
 *   - `fullWidth` (boolean): when true the field will span both columns on larger screens
 *   - `initial` (any) : default value for the field
 * - `initialValues` prop can override per-field initial values: { email: '...' }
 * - The component collects values into an object and calls `onSubmit(payload)` on submit.
 * - The component performs simple required-field checks and a `confirmPassword` match check.
 * - To add custom validation or complex controls (select, checkbox, file), either extend this component
 *   or replace the default input rendering in the `fields.map` section below.
 */
const AuthForm = ({
  fields = [],
  onSubmit,
  submitLabel = "Submit",
  initialValues = {}
}) => {
  const initialState = {}
  fields.forEach((f) => {
    initialState[f.name] = initialValues[f.name] ?? f.initial ?? ""
  })

  const [values, setValues] = useState(initialState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (name, val) => setValues((s) => ({ ...s, [name]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    for (const f of fields) {
      if (f.required && !values[f.name]) {
        setError(`${f.label || f.name} is required`)
        return
      }
    }

    if (values.confirmPassword && values.password !== values.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const payload = { ...values }
      if (payload.confirmPassword) delete payload.confirmPassword
      await onSubmit(payload)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Submission failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl p-8 overflow-visible transform transition-all hover:scale-[1.01]"
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50/80 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/*
        Render fields in a responsive grid: single column on small screens,
        two columns on medium+ screens. Add `fullWidth: true` to any field
        descriptor to make it span both columns (useful for long inputs).
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((f) => (
          <div className={`${f.fullWidth ? "md:col-span-2" : ""} group`} key={f.name}>
            <label className="block text-lg font-medium text-slate-500 mb-1 ml-1">{f.label}</label>
            <input
              type={f.type || "text"}
              value={values[f.name] || ""}
              onChange={(e) => handleChange(f.name, e.target.value)}
              placeholder={f.placeholder || ""}
              required={!!f.required}
              className="w-full bg-white/50 border border-slate-200 rounded-xl px-5 py-3.5 outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-400 transition-all text-slate-700 placeholder:text-slate-400"
            />
          </div>
        ))}

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
                {submitLabel} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

export default AuthForm
