import { X } from "lucide-react"
import { useEffect } from "react"

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  // customization
  overlayClassName = "bg-black/40 backdrop-blur-sm",
  contentClassName = "bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl shadow-sm p-6",
  maxWidthClass = "max-w-lg",
  closeOnOverlayClick = true,
  showClose = true,
  // lock body scroll while modal is open (default true). Set to false to allow page scroll.
  lockScroll = true,
}) => {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  // Lock body scroll when modal is open and lockScroll is true
  useEffect(() => {
    if (!isOpen || !lockScroll) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev || ""
    }
  }, [isOpen, lockScroll])

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center`}>
      {/* Decorative blobs behind the overlay (subtle, low opacity) */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#FFF3E0] blur-[100px] opacity-30" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#F7EEF6] blur-[120px] opacity-25" />
      </div>

      {/* Overlay that dims the background and blurs slightly */}
      <div className={`absolute inset-0 z-0 ${overlayClassName}`} onClick={closeOnOverlayClick ? onClose : undefined} />

      <div className={`relative z-10 w-full ${maxWidthClass} ${contentClassName} flex flex-col max-h-[85vh] min-h-0`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          {title ? (
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">{title}</h2>
          ) : (
            <div />
          )}
          {showClose && (
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="bg-slate-900 text-white hover:bg-slate-950 rounded-xl transition-colors p-2 shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="py-4 min-h-0 flex-1 overflow-auto">{children}</div>

        {footer && (
          <div className="pt-4 border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
