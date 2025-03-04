export function createAPI(basePath = "") {
  const apiHost = import.meta.env.VITE_API_URL || ""
  const base = (apiHost + basePath).replace(/\/+$/g, "")

  const buildUrl = (url = "") => {
    if (!url) return base
    return url.startsWith("/") ? base + url : base + "/" + url
  }

  const authHeader = () => {
    const token = localStorage.getItem("token")
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function handleResponse(res) {
    const contentType = res.headers.get("content-type") || ""
    let payload = null
    try {
      payload = contentType.includes("application/json") ? await res.json() : await res.text()
    } catch (e) {
      payload = null
    }

    if (!res.ok) {
      const err = new Error((payload && payload.message) || res.statusText || "Request failed")
      err.status = res.status
      err.data = payload
      throw err
    }

    return { data: payload, status: res.status, headers: res.headers }
  }

  return {
    get: async (url = "") => {
      const res = await fetch(buildUrl(url), {
        method: "GET",
        headers: { ...authHeader() }
      })
      return handleResponse(res)
    },

    post: async (url = "", body) => {
      const isFormData = body instanceof FormData
      const headers = { ...authHeader(), ...(isFormData ? {} : { "Content-Type": "application/json" }) }
      const res = await fetch(buildUrl(url), {
        method: "POST",
        headers,
        body: isFormData ? body : JSON.stringify(body)
      })
      return handleResponse(res)
    },

    put: async (url = "", body) => {
      const isFormData = body instanceof FormData
      const headers = { ...authHeader(), ...(isFormData ? {} : { "Content-Type": "application/json" }) }
      const res = await fetch(buildUrl(url), {
        method: "PUT",
        headers,
        body: isFormData ? body : JSON.stringify(body)
      })
      return handleResponse(res)
    },

    delete: async (url = "") => {
      const res = await fetch(buildUrl(url), {
        method: "DELETE",
        headers: { ...authHeader() }
      })
      return handleResponse(res)
    }
  }
}

export default createAPI
