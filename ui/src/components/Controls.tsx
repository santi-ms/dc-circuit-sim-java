import { motion } from 'framer-motion'

const schedulers = [
  { value: 'fcfs', label: 'FCFS' },
  { value: 'rr', label: 'Round Robin' },
  { value: 'sjf', label: 'SJF' }
]

const scenarios = [
  { value: 'simple', label: 'Simple (3x3)' },
  { value: 'medio', label: 'Medio (20x20)' },
  { value: 'complejo', label: 'Complejo (80x80)' }
]

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
  return (
    <motion.section
      className="card flex flex-col gap-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <header>
        <h2 className="text-lg font-semibold text-emerald-300">Panel de control</h2>
        <p className="text-sm text-slate-400">Selecciona planificador y escenario para ejecutar la simulacion.</p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          <span className="text-slate-300">Planificador</span>
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
          <span className="text-slate-300">Escenario</span>
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
          {disabled ? 'Ejecutando...' : 'Ejecutar simulacion'}
        </button>
        <button
          className="inline-flex items-center justify-center rounded-full border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-600/10"
          type="button"
          onClick={onOpenCustom}
        >
          Carga personalizada
        </button>
        <button
          className="inline-flex items-center justify-center rounded-full border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          type="button"
          onClick={onOpenPhysical}
        >
          Circuito físico
        </button>
      </div>
    </motion.section>
  )
}
