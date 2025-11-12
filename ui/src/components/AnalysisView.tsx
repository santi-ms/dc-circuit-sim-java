import { useEffect, useMemo, useState } from 'react'
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, LineChart, Line, ComposedChart } from 'recharts'
import { fetchJobsCsv, fetchMetricsJson, MetricsResponse } from '../api'

const scenarioLabels: Record<string, string> = {
  simple: 'Simple',
  medio: 'Medio',
  complejo: 'Complejo',
  unknown: 'Desconocido'
}

type CsvEntry = {
  timestamp: string
  jobId: string
  method: string
  scheduler: string
  scenario: string
  elapsedMs: number
  waitingMs?: number
  turnaroundMs?: number
  cpuPct: number
  memMb: number
  ctxVoluntary?: number
  ctxInvoluntary?: number
  ioReadBytes?: number
  ioWriteBytes?: number
  residual: number
}

type AnalysisViewProps = {
  onError: (message: string) => void
}

function parseCsv(raw: string): CsvEntry[] {
  if (!raw) return []
  const lines = raw.trim().split(/\r?\n/)
  if (lines.length <= 1) return []
  const data: CsvEntry[] = []
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',')
    if (parts.length < 7) continue
    const schedulerRaw = parts[3]
    const scenarioRaw = parts[4]
    const scenario = scenarioRaw.includes('-') ? scenarioRaw.split('-')[0] : scenarioRaw
    data.push({
      timestamp: parts[0],
      jobId: parts[1],
      method: parts[2],
      scheduler: schedulerRaw.toUpperCase(),
      scenario,
      elapsedMs: Number(parts[5]),
      waitingMs: Number(parts[6]),
      turnaroundMs: Number(parts[7]),
      cpuPct: Number(parts[8]),
      memMb: Number(parts[9]),
      ctxVoluntary: Number(parts[10]),
      ctxInvoluntary: Number(parts[11]),
      ioReadBytes: Number(parts[12]),
      ioWriteBytes: Number(parts[13]),
      residual: parts.length >= 15 ? Number(parts[14]) : NaN
    })
  }
  return data
}

export function AnalysisView({ onError }: AnalysisViewProps) {
  const [csv, setCsv] = useState<string>('')
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null)
  const [selectedScenario, setSelectedScenario] = useState<string>('all')

  useEffect(() => {
    const load = async () => {
      try {
        const [csvData, metricsData] = await Promise.all([
          fetchJobsCsv(),
          fetchMetricsJson().catch(() => null)
        ])
        setCsv(csvData)
        setMetrics(metricsData)
      } catch (error) {
        onError(error instanceof Error ? error.message : 'No se pudo cargar la informacion de analisis')
      }
    }
    load()
  }, [onError])

  const rows = useMemo(() => parseCsv(csv), [csv])
  const filteredRows = useMemo(() => {
    if (selectedScenario === 'all') return rows
    return rows.filter((row) => row.scenario === selectedScenario)
  }, [rows, selectedScenario])

  const barData = useMemo(() => {
    if (!metrics) return []
    return Object.entries(metrics.byMethod ?? {}).map(([method, info]) => ({
      method,
      tiempo: Number(info.avgElapsedMs.toFixed(2))
    }))
  }, [metrics])

  const lineData = useMemo(() => {
    return filteredRows.map((row) => ({
      timestamp: row.timestamp,
      tiempo: row.elapsedMs,
      method: row.method
    }))
  }, [filteredRows])

  const schedulerSummary = useMemo(() => {
    if (!metrics) return []
    const entries = Object.entries(metrics.byScheduler ?? {})
    return entries.map(([scheduler, info]) => ({
      scheduler: scheduler.toUpperCase(),
      avgElapsedMs: Number(info.avgElapsedMs.toFixed(2)),
      avgWaitingMs: Number(info.avgWaitingMs.toFixed(2)),
      avgTurnaroundMs: Number(info.avgTurnaroundMs.toFixed(2)),
      throughputPerMinute: Number(info.throughputPerMinute.toFixed(2)),
      avgCtxVoluntary: Number(info.avgCtxVoluntary.toFixed(2)),
      avgCtxInvoluntary: Number(info.avgCtxInvoluntary.toFixed(2)),
      avgIoReadBytes: Number(info.avgIoReadBytes.toFixed(2)),
      avgIoWriteBytes: Number(info.avgIoWriteBytes.toFixed(2)),
      avgResidual: Number.isFinite(info.avgResidual) ? Number(info.avgResidual.toExponential(3)) : NaN,
      count: info.count
    }))
  }, [metrics])

  const exportCsv = () => {
    if (!csv) return
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'jobs_log.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-emerald-200">Analisis de ejecucion</h1>
          <p className="text-sm text-slate-400">Revisa historicos, tiempos promedio y consumo registrado.</p>
        </div>
        <button className="button-primary" onClick={exportCsv} disabled={!csv}>
          Exportar CSV
        </button>
      </header>

      <section className="card grid gap-4 sm:grid-cols-6">
        <div>
          <p className="text-xs uppercase text-slate-400">Total de jobs</p>
          <p className="text-2xl font-bold text-white">{metrics?.totalJobs ?? 0}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Tiempo promedio (ms)</p>
          <p className="text-2xl font-bold text-white">{metrics ? metrics.avgElapsedMs.toFixed(2) : '--'}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Espera promedio (ms)</p>
          <p className="text-2xl font-bold text-white">{metrics ? metrics.avgWaitingMs.toFixed(2) : '--'}</p>
          <p className="text-[10px] text-slate-500">Turnaround: {metrics ? metrics.avgTurnaroundMs.toFixed(2) : '--'} ms</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">CPU promedio (%)</p>
          <p className="text-2xl font-bold text-white">{metrics ? metrics.avgCpuPct.toFixed(2) : '--'}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Context switches</p>
          <p className="text-2xl font-bold text-white">
            {metrics && Number.isFinite(metrics.avgCtxVoluntary)
              ? `${metrics.avgCtxVoluntary.toFixed(1)} / ${metrics.avgCtxInvoluntary.toFixed(1)}`
              : '--'}
          </p>
          <p className="text-[10px] text-slate-500">Voluntarios / Invol.</p>
        </div>
        <div>
          <p className="text-xs uppercase text-slate-400">Throughput (jobs/min)</p>
          <p className="text-2xl font-bold text-white">{metrics && Number.isFinite(metrics.throughputPerMinute) ? metrics.throughputPerMinute.toFixed(2) : '--'}</p>
          <p className="text-[10px] text-slate-500">Tiempo total: {metrics ? (metrics.totalElapsedMs / 1000).toFixed(1) : '--'} s</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs uppercase text-slate-400">Residual promedio</p>
          <p className="text-2xl font-bold text-white">{metrics && Number.isFinite(metrics.avgResidual) ? metrics.avgResidual.toExponential(3) : '--'}</p>
          <p className="text-[10px] text-slate-500">
            IO Δ: {metrics && Number.isFinite(metrics.avgIoReadBytes) ? `${(metrics.avgIoReadBytes / 1024).toFixed(1)} KB` : '--'} /
            {metrics && Number.isFinite(metrics.avgIoWriteBytes) ? ` ${(metrics.avgIoWriteBytes / 1024).toFixed(1)} KB` : ''}
          </p>
        </div>
      </section>

      <section className="card space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Promedio por metodo</h2>
            <p className="text-xs text-slate-400">Tiempos normalizados a milisegundos.</p>
          </div>
          <select
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            value={selectedScenario}
            onChange={(event) => setSelectedScenario(event.target.value)}
          >
            <option value="all">Todos los escenarios</option>
            {Array.from(new Set(rows.map((row) => row.scenario))).map((scenario) => (
              <option key={scenario} value={scenario}>
                {scenarioLabels[scenario] ?? scenario}
              </option>
            ))}
          </select>
        </header>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="method" stroke="#cbd5f5" />
              <YAxis stroke="#cbd5f5" />
              <Tooltip />
              <Legend />
              <Bar dataKey="tiempo" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card space-y-4">
        <header>
          <h2 className="text-lg font-semibold text-white">Evolucion temporal</h2>
        </header>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="timestamp" stroke="#cbd5f5" hide />
              <YAxis stroke="#cbd5f5" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tiempo" stroke="#34d399" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-white">Historial de ejecuciones</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs text-slate-200">
            <thead className="text-slate-400">
              <tr className="border-b border-slate-700">
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Scheduler</th>
                <th className="px-3 py-2">Metodo</th>
                <th className="px-3 py-2">Escenario</th>
                <th className="px-3 py-2">Elapsed ms</th>
                <th className="px-3 py-2">CPU %</th>
                <th className="px-3 py-2">Mem MB</th>
                <th className="px-3 py-2">Espera ms</th>
                <th className="px-3 py-2">Turnaround ms</th>
                <th className="px-3 py-2">Ctx Vol</th>
                <th className="px-3 py-2">Ctx Invol</th>
                <th className="px-3 py-2">IO Read (KB)</th>
                <th className="px-3 py-2">IO Write (KB)</th>
                <th className="px-3 py-2">Residual</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={`${row.timestamp}-${row.jobId}-${row.method}`} className="border-b border-slate-800 last:border-none">
                  <td className="px-3 py-2">{row.timestamp}</td>
                  <td className="px-3 py-2">{row.scheduler}</td>
                  <td className="px-3 py-2 capitalize">{row.method}</td>
                  <td className="px-3 py-2">{scenarioLabels[row.scenario] ?? row.scenario}</td>
                  <td className="px-3 py-2">{row.elapsedMs.toFixed(2)}</td>
                  <td className="px-3 py-2">{row.cpuPct.toFixed(2)}</td>
                  <td className="px-3 py-2">{row.memMb.toFixed(2)}</td>
                  <td className="px-3 py-2">{Number.isFinite(row.waitingMs ?? NaN) ? row.waitingMs!.toFixed(2) : '—'}</td>
                  <td className="px-3 py-2">{Number.isFinite(row.turnaroundMs ?? NaN) ? row.turnaroundMs!.toFixed(2) : '—'}</td>
                  <td className="px-3 py-2">{row.ctxVoluntary != null && Number.isFinite(row.ctxVoluntary) ? row.ctxVoluntary.toFixed(1) : '—'}</td>
                  <td className="px-3 py-2">{row.ctxInvoluntary != null && Number.isFinite(row.ctxInvoluntary) ? row.ctxInvoluntary.toFixed(1) : '—'}</td>
                  <td className="px-3 py-2">
                    {row.ioReadBytes != null && Number.isFinite(row.ioReadBytes) ? (row.ioReadBytes / 1024).toFixed(1) : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {row.ioWriteBytes != null && Number.isFinite(row.ioWriteBytes) ? (row.ioWriteBytes / 1024).toFixed(1) : '—'}
                  </td>
                  <td className="px-3 py-2">{Number.isFinite(row.residual) ? row.residual.toExponential(3) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRows.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">Aun no hay ejecuciones registradas.</p>
          )}
        </div>
      </section>

      {schedulerSummary.length > 0 && (
        <section className="card space-y-4">
          <header>
            <h2 className="text-lg font-semibold text-white">Planificador vs rendimiento</h2>
            <p className="text-xs text-slate-400">Comparación de tiempo medio y throughput para cada algoritmo.</p>
          </header>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={schedulerSummary}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="scheduler" stroke="#cbd5f5" />
                <YAxis yAxisId="left" stroke="#34d399" label={{ value: 'Tiempo (ms)', angle: -90, position: 'insideLeft', fill: '#34d399' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" label={{ value: 'Jobs/min', angle: 90, position: 'insideRight', fill: '#f59e0b' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="avgElapsedMs" name="Tiempo promedio (ms)" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar yAxisId="left" dataKey="avgWaitingMs" name="Espera promedio (ms)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="throughputPerMinute" name="Throughput (jobs/min)" stroke="#fbbf24" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="avgCtxVoluntary" name="Ctx voluntarios" stroke="#60a5fa" strokeWidth={2} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-200">
              <thead className="text-slate-400">
                <tr className="border-b border-slate-700">
                  <th className="px-3 py-2">Planificador</th>
                  <th className="px-3 py-2">Jobs</th>
                  <th className="px-3 py-2">Tiempo promedio (ms)</th>
                  <th className="px-3 py-2">Espera promedio (ms)</th>
                  <th className="px-3 py-2">Turnaround promedio (ms)</th>
                  <th className="px-3 py-2">Residual promedio</th>
                  <th className="px-3 py-2">Ctx Vol / Invol</th>
                  <th className="px-3 py-2">IO Read/Write (KB)</th>
                  <th className="px-3 py-2">Throughput (jobs/min)</th>
                </tr>
              </thead>
              <tbody>
                {schedulerSummary.map((item) => (
                  <tr key={item.scheduler} className="border-b border-slate-800 last:border-none">
                    <td className="px-3 py-2">{item.scheduler}</td>
                    <td className="px-3 py-2">{item.count}</td>
                    <td className="px-3 py-2">{item.avgElapsedMs.toFixed(2)}</td>
                    <td className="px-3 py-2">{item.avgWaitingMs.toFixed(2)}</td>
                    <td className="px-3 py-2">{item.avgTurnaroundMs.toFixed(2)}</td>
                    <td className="px-3 py-2">{Number.isFinite(item.avgResidual) ? item.avgResidual.toExponential(3) : '—'}</td>
                    <td className="px-3 py-2">
                      {Number.isFinite(item.avgCtxVoluntary) ? item.avgCtxVoluntary.toFixed(1) : '—'} /
                      {Number.isFinite(item.avgCtxInvoluntary) ? ` ${item.avgCtxInvoluntary.toFixed(1)}` : ' —'}
                    </td>
                    <td className="px-3 py-2">
                      {Number.isFinite(item.avgIoReadBytes) ? (item.avgIoReadBytes / 1024).toFixed(1) : '—'} /
                      {Number.isFinite(item.avgIoWriteBytes) ? ` ${(item.avgIoWriteBytes / 1024).toFixed(1)}` : ' —'}
                    </td>
                    <td className="px-3 py-2">{item.throughputPerMinute.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
