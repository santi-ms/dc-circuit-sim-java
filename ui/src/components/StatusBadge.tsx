import { motion } from 'framer-motion'

type StatusBadgeProps = {
  state: 'idle' | 'running' | 'waiting' | 'done'
}

const variants: Record<StatusBadgeProps['state'], { label: string; className: string }> = {
  idle: { label: 'Pendiente', className: 'bg-slate-700 text-slate-200' },
  running: { label: 'En progreso', className: 'bg-emerald-600 text-white' },
  waiting: { label: 'En cola', className: 'bg-amber-500 text-slate-900' },
  done: { label: 'Completado', className: 'bg-emerald-700 text-white' }
}

export function StatusBadge({ state }: StatusBadgeProps) {
  const data = variants[state]
  return (
    <motion.span
      className={`badge ${data.className}`}
      animate={{ scale: state === 'running' ? [1, 1.05, 1] : 1 }}
      transition={{ repeat: state === 'running' ? Infinity : 0, duration: 1.5 }}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {data.label}
    </motion.span>
  )
}
