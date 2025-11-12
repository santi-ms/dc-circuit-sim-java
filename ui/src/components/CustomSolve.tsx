import { useState } from 'react'
import { motion } from 'framer-motion'
import { solveCustom, SolveResponse } from '../api'

type CustomSolveProps = {
  open: boolean
  onClose: () => void
  onSuccess: (response: SolveResponse, scheduler: string) => void
}

const defaultMatrix = `[[1,2,3],[0,1,4],[5,6,0]]`
const defaultVector = `[1,2,3]`

const schedulers = [
  { value: 'fcfs', label: 'FCFS' },
  { value: 'rr', label: 'Round Robin' },
  { value: 'sjf', label: 'SJF' }
]

export function CustomSolve({ open, onClose, onSuccess }: CustomSolveProps) {
  const [matrix, setMatrix] = useState(defaultMatrix)
  const [vector, setVector] = useState(defaultVector)
  const [scheduler, setScheduler] = useState('fcfs')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) {
    return null
  }

  const handleSubmit = async () => {
    setError(null)
    try {
      const parsedMatrix = JSON.parse(matrix)
      const parsedVector = JSON.parse(vector)
      setLoading(true)
      const response = await solveCustom({
        sched: scheduler,
        name: 'custom-ui',
        a: parsedMatrix,
        b: parsedVector
      })
      onSuccess(response, scheduler)
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
        className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-emerald-200">Carga personalizada</h2>
            <p className="text-sm text-slate-400">Ingresa la matriz A y el vector b en formato JSON.</p>
          </div>
          <button className="text-slate-400 hover:text-white" onClick={onClose}>
            Cerrar
          </button>
        </header>

        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span>Matriz A (JSON)</span>
            <textarea
              className="min-h-[120px] rounded-xl border border-slate-700 bg-slate-900 p-3 font-mono text-xs text-emerald-100"
              value={matrix}
              onChange={(event) => setMatrix(event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span>Vector b (JSON)</span>
            <textarea
              className="min-h-[80px] rounded-xl border border-slate-700 bg-slate-900 p-3 font-mono text-xs text-emerald-100"
              value={vector}
              onChange={(event) => setVector(event.target.value)}
            />
          </label>

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

          {error && <p className="rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-200">{error}</p>}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button className="rounded-full px-4 py-2 text-sm text-slate-300 hover:text-white" onClick={onClose}>
              Cancelar
            </button>
            <button className="button-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Enviando...' : 'Resolver circuito personalizado'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
