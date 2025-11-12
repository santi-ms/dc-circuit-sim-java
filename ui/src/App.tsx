import { useCallback, useEffect, useMemo, useState } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Controls } from './components/Controls'
import { ResultCard } from './components/ResultCard'
import { CustomSolve } from './components/CustomSolve'
import { PhysicalSolve } from './components/PhysicalSolve'
import { CircuitDiagram } from './components/CircuitDiagram'
import { AnalysisView } from './components/AnalysisView'
import { solve, SolveResponse, SolveResult, PhysicalSolvePayload, EquationVerification } from './api'
import { connectWS } from './ws'
import { useI18n, translateTopology, Language } from './i18n'

const METHODS = ['cramer', 'gauss-jordan', 'library'] as const

type MethodKey = typeof METHODS[number]

type MethodState = {
  elapsedMs?: number
  vector?: number[]
  residual?: number
  scenario?: string
  scheduler?: string
  waitingMs?: number
  turnaroundMs?: number
  equations?: EquationVerification[]
  state: 'idle' | 'running' | 'done'
}

type Toast = {
  id: number
  message: string
}

type PhysicalConfig = Pick<PhysicalSolvePayload, 'topology' | 'voltage' | 'resistances' | 'name'>

type StatusKey = 'ready' | 'running' | 'completed' | 'error' | 'customReady' | 'state'

type StatusMeta = {
  state?: 'running' | 'done' | 'idle'
  scheduler?: string
}

function parseEquations(value: unknown): EquationVerification[] | undefined {
  if (!Array.isArray(value)) return undefined
  const mapped = value
    .map((item) => {
      if (item == null || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const row = Number(record.row)
      const lhs = Number(record.lhs)
      const rhs = Number(record.rhs)
      const error = Number(record.error)
      if (Number.isNaN(row) || Number.isNaN(lhs) || Number.isNaN(rhs) || Number.isNaN(error)) {
        return null
      }
      return { row, lhs, rhs, error }
    })
    .filter((eq): eq is EquationVerification => eq !== null)
  return mapped.length > 0 ? mapped : undefined
}

function useLocalStorage(key: string, initial: string) {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initial
    }
    return window.localStorage.getItem(key) ?? initial
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value)
    }
  }, [value, key])

  return [value, setValue] as const
}

function HomeView({
  scheduler,
  scenario,
  onSchedulerChange,
  onScenarioChange,
  onRun,
  onOpenCustom,
  onOpenPhysical,
  disabled,
  methods,
  physicalConfig
}: {
  scheduler: string
  scenario: string
  onSchedulerChange: (value: string) => void
  onScenarioChange: (value: string) => void
  onRun: () => void
  onOpenCustom: () => void
  onOpenPhysical: () => void
  disabled: boolean
  methods: Record<MethodKey, MethodState>
  physicalConfig: PhysicalConfig | null
}) {
  const { t } = useI18n()
  const currentSolution = METHODS.map((method) => methods[method]).find(
    (state) => state.state === 'done' && state.vector && state.vector.length > 0
  )

  return (
    <div className="space-y-6">
      <Controls
        scheduler={scheduler}
        scenario={scenario}
        onSchedulerChange={onSchedulerChange}
        onScenarioChange={onScenarioChange}
        onRun={onRun}
        onOpenCustom={onOpenCustom}
        onOpenPhysical={onOpenPhysical}
        disabled={disabled}
      />
      <section className="grid gap-4 sm:grid-cols-2">
        {METHODS.map((method) => (
          <ResultCard
            key={method}
            method={method}
            elapsedMs={methods[method].elapsedMs}
            residual={methods[method].residual}
            scenario={methods[method].scenario}
            scheduler={methods[method].scheduler}
            waitingMs={methods[method].waitingMs}
            turnaroundMs={methods[method].turnaroundMs}
            vector={methods[method].vector}
            equations={methods[method].equations}
            state={methods[method].state}
          />
        ))}
      </section>
      {physicalConfig && currentSolution && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-emerald-200">
            {t('home.diagram.title', { topology: translateTopology(physicalConfig.topology, t) })}
          </h3>
          <CircuitDiagram
            topology={physicalConfig.topology}
            voltage={physicalConfig.voltage}
            resistances={physicalConfig.resistances}
            currents={currentSolution.vector ?? []}
          />
        </div>
      )}
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t, lang, setLang } = useI18n()

  const [scheduler, setScheduler] = useLocalStorage('dc-scheduler', 'fcfs')
  const [scenario, setScenario] = useLocalStorage('dc-scenario', 'simple')
  const [methodState, setMethodState] = useState<Record<MethodKey, MethodState>>(() =>
    METHODS.reduce((acc, method) => {
      acc[method] = { state: 'idle' }
      return acc
    }, {} as Record<MethodKey, MethodState>)
  )
  const [isRunning, setIsRunning] = useState(false)
  const [statusState, setStatusState] = useState<{ key: StatusKey; meta?: StatusMeta }>({ key: 'ready' })
  const [showCustom, setShowCustom] = useState(false)
  const [showPhysical, setShowPhysical] = useState(false)
  const [physicalConfig, setPhysicalConfig] = useState<PhysicalConfig | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])

  const pushToast = useCallback((message: string) => {
    setToasts((prev) => [...prev, { id: Date.now(), message }])
  }, [])

  const resetMethods = useCallback(() => {
    setMethodState(() =>
      METHODS.reduce((acc, method) => {
        acc[method] = {
          state: 'running',
          elapsedMs: undefined,
          vector: undefined,
          residual: undefined,
          scenario: undefined,
          equations: undefined,
          scheduler: undefined,
          waitingMs: undefined,
          turnaroundMs: undefined
        }
        return acc
      }, {} as Record<MethodKey, MethodState>)
    )
  }, [])

  const applyResults = useCallback((results: SolveResult[]) => {
    setMethodState((prev) => {
      const next: Record<MethodKey, MethodState> = { ...prev }
      results.forEach((result) => {
        const key = result.method as MethodKey
        if (METHODS.includes(key)) {
          next[key] = {
            elapsedMs: result.elapsedMs,
            vector: result.x,
            residual: result.residual,
            scenario: result.scenario?.split('-')[0] ?? result.scenario,
            scheduler: result.scheduler,
            waitingMs: result.waitingMs,
            turnaroundMs: result.turnaroundMs,
            equations: result.equations,
            state: 'done'
          }
        }
      })
      return next
    })
  }, [])

  const runSimulation = useCallback(async () => {
    setIsRunning(true)
    setStatusState({ key: 'running' })
    setPhysicalConfig(null)
    resetMethods()
    try {
      const response = await solve(scheduler, scenario)
      applyResults(response.results)
      setStatusState({ key: 'completed' })
    } catch (error) {
      pushToast(error instanceof Error ? error.message : t('status.error'))
      setStatusState({ key: 'error' })
    } finally {
      setIsRunning(false)
    }
  }, [scheduler, scenario, applyResults, resetMethods, pushToast, t])

  useEffect(() => {
    const socket = connectWS()

    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as Record<string, unknown>
        if (payload.type === 'status') {
          const state = payload.state as string
          const schedulerName = payload.scheduler as string
          setStatusState({
            key: 'state',
            meta: {
              state: state === 'running' || state === 'done' ? state : 'idle',
              scheduler: schedulerName
            }
          })
          setIsRunning(state === 'running')
        }
        if (payload.type === 'result') {
          const method = payload.method as string
          if (METHODS.includes(method as MethodKey)) {
            setMethodState((prev) => ({
              ...prev,
              [method as MethodKey]: {
                elapsedMs: Number(payload.elapsedMs),
                vector: (payload.x as number[]) ?? [],
                residual: typeof payload.residual === 'number' ? payload.residual : Number(payload.residual ?? NaN),
                scenario:
                  typeof payload.scenario === 'string'
                    ? (payload.scenario as string).split('-')[0]
                    : prev[method as MethodKey]?.scenario,
                scheduler:
                  typeof payload.scheduler === 'string' ? (payload.scheduler as string) : prev[method as MethodKey]?.scheduler,
                waitingMs:
                  typeof payload.waitingMs === 'number'
                    ? payload.waitingMs
                    : Number(payload.waitingMs ?? NaN),
                turnaroundMs:
                  typeof payload.turnaroundMs === 'number'
                    ? payload.turnaroundMs
                    : Number(payload.turnaroundMs ?? NaN),
                equations: parseEquations(payload.equations) ?? prev[method as MethodKey]?.equations,
                state: 'done'
              }
            }))
          }
        }
      } catch (err) {
        console.error('WS message parse error', err)
      }
    }

    socket.addEventListener('message', handleMessage)
    socket.addEventListener('open', () => {
      console.info('WebSocket conectado')
    })
    socket.addEventListener('close', () => {
      console.info('WebSocket cerrado')
    })

    return () => {
      socket.removeEventListener('message', handleMessage)
      socket.close()
    }
  }, [])

  const handleScenarioChange = useCallback(
    (value: string) => {
      setScenario(value)
      setPhysicalConfig(null)
    },
    [setScenario]
  )

  const handleSchedulerChange = useCallback(
    (value: string) => {
      setScheduler(value)
    },
    [setScheduler]
  )

  const handleCustomSuccess = useCallback(
    (response: SolveResponse, customScheduler: string, config?: PhysicalConfig) => {
      setScheduler(customScheduler)
      applyResults(response.results)
      setStatusState({ key: 'customReady' })
      setIsRunning(false)
      setPhysicalConfig(config ?? null)
    },
    [applyResults, setScheduler]
  )

  const toastElements = useMemo(
    () => (
      <div className="fixed bottom-4 right-4 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              className="rounded-xl bg-red-500/80 px-4 py-2 text-sm text-white shadow-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    ),
    [toasts]
  )

  useEffect(() => {
    if (toasts.length === 0) return
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1))
    }, 4000)
    return () => clearTimeout(timer)
  }, [toasts])

  const isAnalysisRoute = location.pathname === '/analysis'

  const statusText = useMemo(() => {
    switch (statusState.key) {
      case 'ready':
        return t('status.ready')
      case 'running':
        return t('status.running')
      case 'completed':
        return t('status.completed')
      case 'error':
        return t('status.error')
      case 'customReady':
        return t('status.customReady')
      case 'state': {
        const state =
          statusState.meta?.state === 'running' || statusState.meta?.state === 'done'
            ? statusState.meta.state
            : 'idle'
        const schedulerName = statusState.meta?.scheduler ?? '--'
        return t('status.state', {
          state: t(`status.state.${state}` as any),
          scheduler: schedulerName
        })
      }
      default:
        return t('status.ready')
    }
  }, [statusState, t])

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLang(event.target.value as Language)
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 pb-16">
      <nav className="mx-auto flex max-w-3xl items-center justify-between py-6">
        <Link to="/" className="text-lg font-semibold text-emerald-300">
          DC Circuit Sim
        </Link>
        <div className="flex items-center gap-3">
          <select
            value={lang}
            onChange={handleLanguageChange}
            className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-200"
            aria-label={t('language.switch')}
          >
            <option value="es">{t('language.es')}</option>
            <option value="pt">{t('language.pt')}</option>
          </select>
          <button
            className={`rounded-full px-4 py-2 text-sm transition ${
              !isAnalysisRoute ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'
            }`}
            onClick={() => navigate('/')}
          >
            {t('nav.simulation')}
          </button>
          <button
            className={`rounded-full px-4 py-2 text-sm transition ${
              isAnalysisRoute ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'
            }`}
            onClick={() => navigate('/analysis')}
          >
            {t('nav.analysis')}
          </button>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl space-y-6">
        <p className="text-sm text-slate-400">{statusText}</p>
        <Routes>
          <Route
            path="/"
            element={
              <HomeView
                scheduler={scheduler}
                scenario={scenario}
                onSchedulerChange={handleSchedulerChange}
                onScenarioChange={handleScenarioChange}
                onRun={runSimulation}
                onOpenCustom={() => setShowCustom(true)}
                onOpenPhysical={() => setShowPhysical(true)}
                disabled={isRunning}
                methods={methodState}
                physicalConfig={physicalConfig}
              />
            }
          />
          <Route path="/analysis" element={<AnalysisView onError={pushToast} />} />
        </Routes>
      </main>

      <CustomSolve open={showCustom} onClose={() => setShowCustom(false)} onSuccess={handleCustomSuccess} />
      <PhysicalSolve open={showPhysical} onClose={() => setShowPhysical(false)} onSuccess={handleCustomSuccess} />
      {toastElements}
    </div>
  )
}
