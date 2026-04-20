import React, { useRef, useState } from "react"
import { Upload, X, FileText, Image, File, Loader2 } from "lucide-react"
import { uploadFiles } from "../api/uploadApi"

const ICON_MAP = {
  "image/jpeg": Image,
  "image/png": Image,
  "image/gif": Image,
  "image/webp": Image,
  "application/pdf": FileText,
  "text/plain": FileText
}

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * FileUpload — reusable file upload component.
 *
 * Props:
 *   value:    Array of { file_ref, original_name, mime_type, size } (controlled)
 *   onChange: (newValue) => void — called with new array of uploaded file objects
 *   accept:   string — accept attribute for input (default: images + pdf + txt)
 *   multiple: boolean (default true)
 *   maxFiles: number (default 5)
 *   disabled: boolean
 *   label:    string (default "Attachments")
 *   helpText: string
 */
const FileUpload = ({
  value = [],
  onChange,
  accept = "image/*,application/pdf,.doc,.docx,.txt",
  multiple = true,
  maxFiles = 5,
  disabled = false,
  label = "Attachments",
  helpText = "Images, PDF, Word or text files up to 10MB",
  className = ""
}) => {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  const handleFiles = async (rawFiles) => {
    setError(null)
    const remaining = maxFiles - value.length
    const filesToUpload = Array.from(rawFiles).slice(0, remaining)

    if (filesToUpload.length === 0) {
      setError(`Max ${maxFiles} files allowed`)
      return
    }

    setUploading(true)
    try {
      const result = await uploadFiles(filesToUpload)
      const uploaded = result?.data || result || []
      onChange && onChange([...value, ...uploaded])
    } catch (err) {
      setError(err?.message || "Upload failed. Please try again.")
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  const handleInputChange = (e) => {
    if (e.target.files?.length) handleFiles(e.target.files)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (disabled || uploading) return
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }

  const removeFile = (idx) => {
    const next = value.filter((_, i) => i !== idx)
    onChange && onChange(next)
  }

  const getIcon = (mimeType) => {
    const Icon = ICON_MAP[mimeType] || File
    return <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
  }

  const canAdd = !disabled && !uploading && value.length < maxFiles

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
          {helpText && <span className="ml-1 text-xs text-slate-400 font-normal">({helpText})</span>}
        </label>
      )}

      {/* Drop zone */}
      {canAdd && (
        <div
          className={`relative border-2 border-dashed rounded-2xl p-4 transition-all duration-200 cursor-pointer text-center
            ${dragging
              ? "border-[color:var(--button-black)] bg-slate-100"
              : "border-slate-200 bg-slate-50 hover:border-[color:var(--button-black)] hover:bg-slate-100/40"
            }`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-1.5 pointer-events-none">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-[color:var(--button-black)] animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-slate-400" />
            )}
            <p className="text-sm text-slate-500">
              {uploading ? "Uploading…" : <><span className="font-medium text-[color:var(--button-black)]">Click to upload</span> or drag &amp; drop</>}
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-500 font-medium">{error}</p>
      )}

      {/* Uploaded file list */}
      {value.length > 0 && (
        <ul className="space-y-1.5">
          {value.map((file, idx) => (
            <li
              key={file.file_ref || idx}
              className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-3 py-2 shadow-sm"
            >
              {getIcon(file.mime_type)}
              <span className="flex-1 text-sm text-slate-700 truncate" title={file.original_name}>
                {file.original_name}
              </span>
              {file.size && (
                <span className="text-xs text-slate-400 flex-shrink-0">{formatBytes(file.size)}</span>
              )}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeFile(idx) }}
                  className="ml-1 p-0.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label={`Remove ${file.original_name}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default FileUpload
