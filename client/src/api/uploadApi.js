import { createAPI } from "./fetchClient"

const API = createAPI("/api/uploads")

/**
 * Upload one or more files. Returns array of file metadata objects:
 * [{ file_ref, original_name, mime_type, size }]
 */
export const uploadFiles = async (files) => {
  const formData = new FormData()
  for (const file of files) {
    formData.append("files", file)
  }
  const res = await API.post("/", formData)
  return res.data
}

/**
 * Build a URL to view/serve a stored file inline (for img src, iframe src, etc.)
 * Uses the /uploads static public path — no auth cookie needed.
 */
export const getFileUrl = (file_ref) => {
  const apiHost = import.meta.env.VITE_API_URL || ""
  return `${apiHost}/uploads/${encodeURIComponent(file_ref)}`
}

/**
 * Build a URL that triggers a file download with proper content disposition.
 * Uses the authenticated /api/uploads/:filename?download=1 route.
 */
export const getDownloadUrl = (file_ref, original_name) => {
  const apiHost = import.meta.env.VITE_API_URL || ""
  const name = encodeURIComponent(original_name || file_ref)
  return `${apiHost}/api/uploads/${encodeURIComponent(file_ref)}?download=1&name=${name}`
}

export default { uploadFiles, getFileUrl, getDownloadUrl }
