import React, { useState } from "react"
import { FileText, Image, File, Download, X, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import Button from "./Button"
import { getFileUrl, getDownloadUrl } from "../api/uploadApi"

const ICON_MAP = {
  "image/jpeg": Image,
  "image/png": Image,
  "image/gif": Image,
  "image/webp": Image,
  "application/pdf": FileText,
  "text/plain": FileText
}

const formatBytes = (bytes) => {
  if (!bytes) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const isImage = (mimeType) => mimeType && mimeType.startsWith("image/")
const isPdf = (mimeType) => mimeType === "application/pdf"

/**
 * AttachmentViewer — shows a list of attachments with:
 *   - inline preview (image or PDF iframe when expanded)
 *   - download button
 *
 * Props:
 *   attachments: Array<{ file_ref, original_name, mime_type, size }>
 *   title:       string (default "Attachments")
 *   compact:     boolean — show compact chip list instead of card list
 */
const AttachmentViewer = ({ attachments = [], title = "Attachments", compact = false }) => {
  const [expanded, setExpanded] = useState({}) // { file_ref: boolean }

  if (!attachments || attachments.length === 0) return null

  const togglePreview = (fileRef) => {
    setExpanded((prev) => ({ ...prev, [fileRef]: !prev[fileRef] }))
  }

  const getFileIcon = (mimeType) => {
    const Icon = ICON_MAP[mimeType] || File
    return <Icon className="w-4 h-4 flex-shrink-0" />
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
          {attachments.map((att, idx) => (
          <a
            key={att.file_ref || idx}
            href={getDownloadUrl(att.file_ref, att.original_name)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-100 border border-slate-200 hover:border-[color:var(--button-black)] rounded-xl text-xs text-slate-700 transition-colors"
          >
            {getFileIcon(att.mime_type)}
            <span className="truncate max-w-[120px]">{att.original_name}</span>
            <Download className="w-3 h-3 text-slate-400" />
          </a>
        ))}
      </div>
    )
  }

  return (
    <div>
      {title && (
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{title}</p>
      )}
      <div className="space-y-2">
        {attachments.map((att, idx) => {
          const fileUrl = getFileUrl(att.file_ref)
          const downloadUrl = getDownloadUrl(att.file_ref, att.original_name)
          const canPreview = isImage(att.mime_type) || isPdf(att.mime_type)
          const isExpanded = !!expanded[att.file_ref]

          return (
            <div
              key={att.file_ref || idx}
              className="border border-slate-200 rounded-2xl overflow-hidden bg-white"
            >
              {/* Attachment row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="text-slate-500">{getFileIcon(att.mime_type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{att.original_name}</p>
                  {att.size && (
                    <p className="text-xs text-slate-400">{formatBytes(att.size)}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Preview toggle (only for image/PDF) */}
                  {canPreview && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => togglePreview(att.file_ref)}
                      title={isExpanded ? "Collapse preview" : "Preview"}
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isExpanded ? "Hide" : "Preview"}
                    </Button>
                  )}

                  {/* Open in new tab */}
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* Download */}
                  <a
                    href={downloadUrl}
                    download={att.original_name}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-[color:var(--button-black)] text-white border border-black hover:bg-black transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              </div>

              {/* Inline preview — only when expanded */}
              {canPreview && isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 p-3">
                  {isImage(att.mime_type) && (
                    <img
                      src={fileUrl}
                      alt={att.original_name}
                      className="max-h-80 max-w-full rounded-xl object-contain mx-auto block"
                      onError={(e) => { e.currentTarget.src = ""; e.currentTarget.alt = "Preview unavailable" }}
                    />
                  )}
                  {isPdf(att.mime_type) && (
                    <iframe
                      src={fileUrl}
                      title={att.original_name}
                      className="w-full h-96 rounded-xl border-0"
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AttachmentViewer
