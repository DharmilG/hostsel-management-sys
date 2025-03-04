import React from "react"

const AuthPage = ({ children, footerText }) => {
  return (
    <div className="relative min-h-screen bg-[#F8FAFC] px-4 overflow-hidden">
      <div className="pointer-events-none absolute -top-1/4 -left-1/12 w-[500px] h-[500px] bg-purple-300/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse" />
      <div className="pointer-events-none absolute -bottom-1/4 -right-1/12 w-[500px] h-[500px] bg-teal-300/40 rounded-full blur-[120px] mix-blend-multiply animate-pulse delay-700" />
      <div className="pointer-events-none absolute top-[40%] left-[40%] w-[300px] h-[300px] bg-pink-300/30 rounded-full blur-[100px] mix-blend-multiply animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-lg md:max-w-2xl p-6 md:p-8 mx-auto py-12">
        {children}

        <p className="text-center text-slate-400 text-xs mt-8">
          {footerText || "© 2024 Education Portal. All rights reserved."}
        </p>
      </div>
    </div>
  )
}

export default AuthPage
