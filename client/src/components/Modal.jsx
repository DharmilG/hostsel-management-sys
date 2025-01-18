import { X } from "lucide-react"

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60">
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-[#FFDEE9] blur-[100px] opacity-90" />
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-[#B5FFFC] blur-[120px] opacity-90" />

      <div className="relative z-10 w-full max-w-lg bg-white/60 border border-slate-100 rounded-3xl shadow-sm p-6 hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:bg-white/50 hover:text-slate-900 rounded-xl transition-colors p-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  )
}

export default Modal
