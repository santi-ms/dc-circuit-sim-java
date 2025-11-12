import { motion } from 'framer-motion'
import { useI18n } from '../i18n'

type StatusBadgeProps = {
  state: 'idle' | 'running' | 'waiting' | 'done'
}

const classes: Record<StatusBadgeProps['state'], string> = {
  idle: 'bg-slate-700 text-slate-200',
  running: 'bg-emerald-600 text-white',
  waiting: 'bg-amber-500 text-slate-900',
  done: 'bg-emerald-700 text-white'
}

export function StatusBadge({ state }: StatusBadgeProps) {
  const { t } = useI18n()
  const label = t(`statusBadge.${state}`)
  return (
    <motion.span
      className={`badge ${classes[state]}`}
      animate={{ scale: state === 'running' ? [1, 1.05, 1] : 1 }}
      transition={{ repeat: state === 'running' ? Infinity : 0, duration: 1.5 }}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {label}
    </motion.span>
  )
}
