import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [user, setUser] = useState(
    localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null
  )

  const login = (token, user) => {
    setToken(token)
    setUser(user)
    localStorage.setItem("token", token)
    localStorage.setItem("user", JSON.stringify(user))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("token")
    localStorage.removeItem("user")
  }

  useEffect(() => {
    if (!token) {
      logout()
    }
  }, [token])

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
