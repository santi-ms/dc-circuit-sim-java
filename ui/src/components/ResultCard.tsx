import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { StatusBadge } from './StatusBadge'
import type { EquationVerification } from '../api'
import { useI18n } from '../i18n'

type ResultCardProps = {
  method: string
  elapsedMs?: number
  residual?: number
  scenario?: string
  scheduler?: string
  waitingMs?: number
  turnaroundMs?: number
  vector?: number[]
  equations?: EquationVerification[]
  state: 'idle' | 'running' | 'done'
}

const methodNames: Record<string, string> = {
  cramer: 'Cramer',
  'gauss-jordan': 'Gauss-Jordan',
  library: 'Libreria'
}

export function ResultCard({
  method,
  elapsedMs,
  residual,
  scenario,
  scheduler,
  waitingMs,
  turnaroundMs,
  vector,
  equations,
  state
}: ResultCardProps) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const label = methodNames[method] ?? method
  const scenarioDisplay = scenario ? scenario.split('-')[0] : undefined
  const hasEquations = Array.isArray(equations) && equations.length > 0

  const renderDirection = (value: number, index: number) => {
    if (!Number.isFinite(value)) {
      return (
        <span key={index} className="text-slate-400">
          I{index + 1}: —
        </span>
      )
    }
    const magnitude = Math.abs(value)
    const arrow = value >= 0 ? '→' : '←'
    const description = value >= 0 ? t('result.current.assumed') : t('result.current.reverse')
    return (
      <span key={index} className="rounded-full bg-slate-800/80 px-3 py-1 text-xs text-slate-200">
        I{index + 1}: {magnitude.toFixed(3)} A {arrow}{' '}
        <span className="text-slate-400">({description})</span>
      </span>
    )
  }

  return (
    <motion.article
      className="card flex flex-col gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">{label}</h3>
          <p className="text-xs uppercase tracking-wide text-slate-400">{t('result.resolution')}</p>
          <div className="space-y-1 text-xs text-slate-500">
            {scenarioDisplay && (
              <p>
                {t('result.scenario')}: {scenarioDisplay}
              </p>
            )}
            {scheduler && (
              <p>
                {t('result.scheduler')}: {scheduler.toUpperCase()}
              </p>
            )}
          </div>
        </div>
        <StatusBadge state={state} />
      </header>

      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
        <span className="font-medium text-emerald-200">
          {elapsedMs != null ? `${elapsedMs.toFixed(2)} ms` : '...'}
        </span>
        <span className="text-xs text-slate-400">
          {t('result.residual')}: {residual != null && !Number.isNaN(residual) ? residual.toExponential(3) : '—'}
        </span>
        {typeof scheduler !== 'undefined' && (
          <span className="text-xs text-slate-400 uppercase">
            {t('result.scheduler')}: {scheduler.toUpperCase()}
          </span>
        )}
        {typeof waitingMs === 'number' && !Number.isNaN(waitingMs) && (
          <span className="text-xs text-slate-400">
            {t('result.wait')}: {waitingMs.toFixed(2)} ms
          </span>
        )}
        {typeof turnaroundMs === 'number' && !Number.isNaN(turnaroundMs) && (
          <span className="text-xs text-slate-400">
            {t('result.turnaround')}: {turnaroundMs.toFixed(2)} ms
          </span>
        )}
        <button
          type="button"
          className="rounded-full border border-slate-600 px-3 py-1 text-xs uppercase tracking-wide text-slate-200 transition hover:bg-slate-700"
          onClick={() => setExpanded((prev) => !prev)}
          disabled={!hasEquations && (!vector || vector.length === 0)}
        >
          {expanded ? t('result.hideDetails') : t('result.viewDetails')}
        </button>
      </div>

      {vector && vector.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {vector.map((value, index) => renderDirection(value, index))}
        </div>
      )}

      <AnimatePresence initial={false}>
        {expanded && (hasEquations || (vector && vector.length > 0)) && (
          <motion.div
            className="space-y-3 rounded-xl bg-slate-900/80 p-4 text-xs"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {hasEquations && (
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="min-w-full divide-y divide-slate-800 text-left">
                  <thead className="bg-slate-900/70 text-[11px] uppercase tracking-wide text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Fila</th>
                      <th className="px-3 py-2">Sum a*x (lhs)</th>
                      <th className="px-3 py-2">b (rhs)</th>
                      <th className="px-3 py-2">Error |lhs-rhs|</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {equations!.map((eq) => {
                      const isWarn = Number.isFinite(eq.error) && eq.error > 1e-6
                      return (
                        <tr key={eq.row} className={isWarn ? 'bg-red-500/10' : undefined}>
                          <td className="px-3 py-2 text-slate-400">#{eq.row}</td>
                          <td className="px-3 py-2">{Number.isFinite(eq.lhs) ? eq.lhs.toFixed(6) : '—'}</td>
                          <td className="px-3 py-2">{Number.isFinite(eq.rhs) ? eq.rhs.toFixed(6) : '—'}</td>
                          <td className="px-3 py-2">
                            {Number.isFinite(eq.error) ? eq.error.toExponential(3) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {vector && vector.length > 0 && (
              <pre className="max-h-48 overflow-auto rounded-lg bg-slate-950 p-3 text-emerald-100">
                {JSON.stringify(vector, null, 2)}
              </pre>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
