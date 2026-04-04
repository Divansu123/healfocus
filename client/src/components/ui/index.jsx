import { cn, statusBadge, capitalize } from '@/lib/utils'
import { X, ChevronLeft, LogOut, Menu } from 'lucide-react'

// ── Button ──
export function Button({ children, variant = 'primary', size = 'md', className, disabled, loading, type = 'button', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
  const variants = {
    primary:  'bg-gradient-to-r from-primary-800 to-violet-700 text-white shadow-md hover:shadow-lg hover:opacity-95',
    success:  'bg-emerald-600 text-white hover:bg-emerald-700',
    danger:   'bg-red-600 text-white hover:bg-red-700',
    outline:  'bg-white text-primary-800 border-2 border-primary-200 hover:bg-primary-50',
    ghost:    'bg-transparent text-primary-700 hover:bg-primary-50',
    amber:    'bg-amber-500 text-white hover:bg-amber-600',
  }
  const sizes = {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-5 py-3 text-sm w-full',
    lg: 'px-6 py-3.5 text-base w-full',
  }
  return (
    <button type={type} className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
      {children}
    </button>
  )
}

// ── Badge ──
export function Badge({ status, label, className }) {
  return (
    <span className={cn('inline-block px-2.5 py-0.5 rounded-full text-xs font-bold', statusBadge(status), className)}>
      {label || capitalize(status || '')}
    </span>
  )
}

// ── Card ──
export function Card({ children, className, onClick, ...props }) {
  return (
    <div className={cn('bg-white border border-primary-100 rounded-2xl p-4 shadow-card', onClick && 'cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-all', className)} onClick={onClick} {...props}>
      {children}
    </div>
  )
}

// ── Modal — bottom sheet ──
export function Modal({ open, onClose, title, children, className }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-primary-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-t-3xl w-full max-w-[430px] max-h-[92vh] overflow-y-auto modal-slide-up', className)}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-gray-200 rounded-full" /></div>
        <div className="px-5 pb-8 pt-2">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-primary-950">{title}</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"><X size={16} /></button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── FormGroup ──
export function FormGroup({ label, children, className }) {
  return (
    <div className={cn('mb-4', className)}>
      {label && <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>}
      {children}
    </div>
  )
}

export function Input({ className, ...props }) {
  return (
    <input className={cn('w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none bg-white text-primary-950 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all', className)} {...props} />
  )
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn('w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none bg-white text-primary-950 focus:border-primary-500 transition-all appearance-none', className)} {...props}>
      {children}
    </select>
  )
}

export function Textarea({ className, ...props }) {
  return (
    <textarea className={cn('w-full px-3.5 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none bg-white text-primary-950 resize-none min-h-[80px] focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all', className)} {...props} />
  )
}

// ── TopBar ──
export function TopBar({ title, onBack, actions, badge, hideOnDesktop }) {
  return (
    <header className={`bg-primary-950 text-white px-4 h-[52px] flex items-center gap-3 sticky top-0 z-10 flex-shrink-0${hideOnDesktop ? ' lg:hidden' : ''}`}>
      {onBack && (
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 flex-shrink-0">
          <ChevronLeft size={18} />
        </button>
      )}
      <h1 className="text-[15px] font-black flex-1 tracking-tight truncate">{title}</h1>
      {badge != null && badge > 0 && (
        <span className="w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{badge}</span>
      )}
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </header>
  )
}

// ── Tabs ──
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1.5 bg-primary-100 p-1 rounded-xl mb-4 overflow-x-auto scrollbar-hide">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={cn('flex-1 min-w-fit py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap', active === t.id ? 'bg-white text-primary-800 shadow-card' : 'text-primary-600 opacity-70 hover:opacity-100')}
        >{t.label}</button>
      ))}
    </div>
  )
}

// ── BottomNav ──
export function BottomNav({ tabs, active, onChange }) {
  return (
    <nav className="sticky bottom-0 bg-white border-t border-primary-100 flex px-1 py-1 z-10 shadow-[0_-2px_12px_rgba(55,48,163,.08)] bottom-nav-safe flex-shrink-0">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={cn('flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all', active === t.id ? 'bg-primary-50' : 'hover:bg-gray-50')}
        >
          <span className="text-[17px] leading-none">{t.icon}</span>
          <span className={cn('text-[9px] font-bold leading-none', active === t.id ? 'text-primary-700' : 'text-gray-400')}>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}

// ── StatsGrid ──
export function StatsGrid({ items }) {
  return (
    <div className="grid grid-cols-2 gap-2.5 mb-4">
      {items.map((item, i) => (
        <div key={i} className="bg-white border border-primary-100 rounded-2xl p-3.5 text-center shadow-card">
          {item.icon && <div className="text-2xl mb-1">{item.icon}</div>}
          <div className="text-2xl font-black text-primary-700" style={item.color ? { color: item.color } : {}}>{item.num}</div>
          <div className="text-[11px] text-gray-500 mt-0.5 font-medium">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── EmptyState ──
export function EmptyState({ icon = '📭', title = 'Nothing here', desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center px-4 fade-in">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="font-bold text-gray-700 text-sm">{title}</p>
      {desc && <p className="text-xs text-gray-400 mt-1">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ── Avatar ──
export function Avatar({ name, size = 'md', className }) {
  const initial = name?.[0]?.toUpperCase() || '?'
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' }
  return (
    <div className={cn('rounded-full bg-primary-100 text-primary-700 font-black flex items-center justify-center flex-shrink-0', sizes[size], className)}>
      {initial}
    </div>
  )
}

// ── InfoRow ──
export function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-primary-950 text-right max-w-[55%]">{value || '—'}</span>
    </div>
  )
}

// ── Loader ──
export function Loader({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  )
}

// ── SectionHeader ──
export function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-bold text-primary-950">{title}</h3>
      {action}
    </div>
  )
}

// ── Alert ──
export function Alert({ type = 'info', children }) {
  const styles = {
    info:    'bg-primary-50 text-primary-700 border-primary-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger:  'bg-red-50 text-red-700 border-red-200',
  }
  return (
    <div className={cn('px-3.5 py-2.5 rounded-xl text-sm border mb-3 leading-relaxed', styles[type])}>
      {children}
    </div>
  )
}

// ── Sidebar (Hospital/Admin) ──
export function Sidebar({ open, onClose, navItems, activeTab, onTabChange, role, onLogout }) {
  return (
    <>
      {open && <div className="fixed inset-0 bg-primary-950/55 z-30 lg:hidden backdrop-blur-sm" onClick={onClose} />}
      <aside className={cn(
        'fixed left-0 top-0 bottom-0 w-60 bg-primary-950 z-40 flex flex-col overflow-y-auto transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
        'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:flex-shrink-0',
        open ? 'translate-x-0 sidebar-enter' : '-translate-x-full lg:translate-x-0'
      )}>
        <div className="px-4 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-sm font-black text-white">H</div>
            <div>
              <div className="text-[15px] font-black text-white">Heal Focus</div>
              <div className="text-[10px] text-white/40 truncate max-w-[140px]">{role}</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-3 px-2">
          {navItems.map((item, i) => {
            if (item.section) return (
              <div key={i} className="px-3 pt-4 pb-1 text-[9px] font-black uppercase tracking-widest text-white/30">{item.section}</div>
            )
            return (
              <button key={item.id} onClick={() => { onTabChange(item.id); onClose() }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-all text-[13px] font-semibold',
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-primary-600/50 to-primary-600/20 text-white border-l-[3px] border-primary-400'
                    : 'text-white/60 hover:bg-white/8 hover:text-white'
                )}
              >
                <span className="text-[17px] w-6 text-center flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{item.badge}</span>
                )}
              </button>
            )
          })}
        </nav>
        <div className="px-2 py-3 border-t border-white/10">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-white/8 text-[13px] font-semibold transition-all">
            <LogOut size={16} /><span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

// ── PageTitle (Portal pages) ──
export function PageTitle({ icon, children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-200 flex items-center justify-center text-[17px] flex-shrink-0">{icon}</div>
      <h2 className="text-[17px] font-black text-primary-950">{children}</h2>
    </div>
  )
}

// ── AddButton ──
export function AddButton({ onClick, children }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-800 to-violet-700 text-white text-xs font-bold rounded-full shadow-card hover:shadow-card-md transition-all">
      {children}
    </button>
  )
}
