import React from 'react'

export default function Button({ children, variant = 'primary', size = 'md', className = '', onClick, type = 'button', disabled = false, block = false, ...rest }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all'
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2'
  }
  const variants = {
    primary: 'bg-[color:var(--button-black)] text-white shadow-lg shadow-slate-200 hover:shadow-xl',
    secondary: 'bg-white border text-slate-800 hover:bg-slate-50',
    ghost: 'bg-slate-100 text-slate-800',
    danger: 'bg-red-50 text-red-700 border border-red-100 hover:border-red-200',
    export: 'bg-white text-black border border-black hover:bg-black hover:text-white',
    download: 'bg-[color:var(--button-black)] text-white border border-black hover:bg-black hover:text-white'
  }

  const blockCls = block ? 'w-full' : 'inline-flex'
  const disabledCls = disabled ? 'opacity-60 pointer-events-none' : ''

  // Allow skipping variant classes by passing variant="none"
  const variantCls = variant === 'none' ? '' : (variants[variant] || variants.primary)

  const cls = `${base} ${blockCls} ${sizes[size] || sizes.md} ${variantCls} ${disabledCls} ${className}`.trim()

  return (
    <button type={type} onClick={onClick} className={cls} disabled={disabled} {...rest}>
      {children}
    </button>
  )
}
