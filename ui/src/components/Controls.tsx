import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { useI18n } from '../i18n'

type ControlsProps = {
  scheduler: string
  scenario: string
  onSchedulerChange: (value: string) => void
  onScenarioChange: (value: string) => void
  onRun: () => void
  onOpenCustom: () => void
  onOpenPhysical: () => void
  disabled?: boolean
}

export function Controls({
  scheduler,
  scenario,
  onSchedulerChange,
  onScenarioChange,
  onRun,
  onOpenCustom,
  onOpenPhysical,
  disabled
}: ControlsProps) {
  const { t } = useI18n()

  const schedulers = useMemo(
    () => [
      { value: 'fcfs', label: 'FCFS' },
      { value: 'rr', label: 'Round Robin' },
      { value: 'sjf', label: 'SJF' }
    ],
    []
  )

  const scenarios = useMemo(
    () => [
      { value: 'simple', label: t('scenario.simple') },
      { value: 'medio', label: t('scenario.medio') },
      { value: 'complejo', label: t('scenario.complejo') }
    ],
    [t]
  )

  return (
    <motion.section
      className="card flex flex-col gap-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <header>
        <h2 className="text-lg font-semibold text-emerald-300">{t('controls.title')}</h2>
        <p className="text-sm text-slate-400">{t('controls.subtitle')}</p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="text-slate-300">{t('controls.scheduler')}</span>
          <select
            className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            value={scheduler}
            onChange={(event) => onSchedulerChange(event.target.value)}
            disabled={disabled}
          >
            {schedulers.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="text-slate-300">{t('controls.scenario')}</span>
          <select
            className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
            value={scenario}
            onChange={(event) => onScenarioChange(event.target.value)}
            disabled={disabled}
          >
            {scenarios.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button className="button-primary" onClick={onRun} disabled={disabled}>
          {disabled ? t('controls.running') : t('controls.run')}
        </button>
        <button
          className="inline-flex items-center justify-center rounded-full border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-600/10"
          type="button"
          onClick={onOpenCustom}
        >
          {t('controls.custom')}
        </button>
        <button
          className="inline-flex items-center justify-center rounded-full border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          type="button"
          onClick={onOpenPhysical}
        >
          {t('controls.physical')}
        </button>
      </div>
    </motion.section>
  )
}
