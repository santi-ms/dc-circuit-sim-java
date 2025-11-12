import { useState } from 'react'
import { motion } from 'framer-motion'
import { solvePhysical, SolveResponse, PhysicalSolvePayload } from '../api'

const schedulers = [
  { value: 'fcfs', label: 'FCFS' },
  { value: 'rr', label: 'Round Robin' },
  { value: 'sjf', label: 'SJF' }
]

const topologies = [
  { value: 'serie', label: 'Serie' },
  { value: 'paralelo', label: 'Paralelo' }
]

type PhysicalSolveProps = {
  open: boolean
  onClose: () => void
  onSuccess: (
    response: SolveResponse,
    scheduler: string,
    config: Pick<PhysicalSolvePayload, 'topology' | 'voltage' | 'resistances' | 'name'>
  ) => void
}

export function PhysicalSolve({ open, onClose, onSuccess }: PhysicalSolveProps) {
  const [scheduler, setScheduler] = useState('fcfs')
  const [topology, setTopology] = useState<'serie' | 'paralelo'>('serie')
  const [voltage, setVoltage] = useState('12')
  const [resistancesText, setResistancesText] = useState('4,2,1')
  const [name, setName] = useState('circuito-fisico')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return null
  }

  const handleSubmit = async () => {
    setError(null)
    try {
      const resistances = resistancesText
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => !Number.isNaN(value) && value > 0)

      if (resistances.length === 0) {
        throw new Error('Ingrese resistencias válidas (positivas) separadas por coma')
      }

      const voltageValue = Number(voltage)
      if (Number.isNaN(voltageValue) || voltageValue === 0) {
        throw new Error('Ingrese un voltaje distinto de cero')
      }

      setLoading(true)
      const response = await solvePhysical({
        sched: scheduler,
        topology,
        voltage: voltageValue,
        resistances,
        name
      })
      onSuccess(response, scheduler, {
        topology,
        voltage: voltageValue,
        resistances,
        name
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
      <motion.div
        className="card max-h-[90vh] w-full max-w-3xl overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-emerald-200">Circuito físico (serie/paralelo)</h2>
            <p className="text-sm text-slate-400">
              Define la topología, el voltaje y las resistencias para generar la matriz Ax = b automáticamente.
            </p>
          </div>
          <button className="text-slate-400 hover:text-white" onClick={onClose}>
            Cerrar
          </button>
        </header>

        <div className="mt-4 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span>Planificador</span>
              <select
                className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-white"
                value={scheduler}
                onChange={(event) => setScheduler(event.target.value)}
              >
                {schedulers.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span>Topología</span>
              <select
                className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-white"
                value={topology}
                onChange={(event) => setTopology(event.target.value as 'serie' | 'paralelo')}
              >
                {topologies.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            <span>Nombre (opcional)</span>
            <input
              className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-white"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="circuito-fisico"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span>Voltaje de la fuente (V)</span>
            <input
              type="number"
              className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-white"
              value={voltage}
              onChange={(event) => setVoltage(event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span>Resistencias (Ohm) separadas por coma</span>
            <input
              className="rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-white"
              value={resistancesText}
              onChange={(event) => setResistancesText(event.target.value)}
              placeholder="4,2,1"
            />
          </label>

          {topology === 'paralelo' && (
            <p className="text-xs text-slate-400">
              En paralelo, cada rama recibe el mismo voltaje y se calcula su corriente `I = V / R`.
            </p>
          )}

          {error && <p className="rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-200">{error}</p>}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button className="rounded-full px-4 py-2 text-sm text-slate-300 hover:text-white" onClick={onClose}>
              Cancelar
            </button>
            <button className="button-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Generando…' : 'Resolver circuito físico'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
