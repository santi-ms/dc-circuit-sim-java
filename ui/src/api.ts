export const apiBase = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_BASE ?? '')

type RequestInitWithBody = RequestInit & { body?: BodyInit | null }

async function request<T = unknown>(path: string, init: RequestInitWithBody = {}): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    headers: {
      Accept: 'application/json',
      ...(init.headers ?? {})
    },
    ...init
  });

  if (response.status == 204) {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    return '' as T;
  }

  const raw = await response.text();
  let parsed: unknown = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch (ignored) {
      parsed = null;
    }
  }

  if (!response.ok) {
    let message = `HTTP ${response.status} ${response.statusText}`;
    if (typeof parsed === 'object' && parsed !== null && 'error' in parsed) {
      const errorValue = (parsed as Record<string, unknown>).error;
      if (typeof errorValue === 'string' && errorValue.trim().length > 0) {
        message = errorValue;
      } else if (errorValue != null) {
        message = String(errorValue);
      }
    }
    throw new Error(message);
  }

  if (parsed !== null) {
    return parsed as T;
  }
  return raw as T;
}

export const get = <T = unknown>(path: string) => request<T>(path)

export const post = <T = unknown>(path: string, body?: unknown, headers?: Record<string, string>) =>
  request<T>(path, {
    method: 'POST',
    headers,
    body: body != null ? JSON.stringify(body) : undefined
  })

export type SolveResult = {
  jobId: string
  method: string
  scheduler: string
  elapsedMs: number
  waitingMs: number
  turnaroundMs: number
  residual: number
  scenario: string
  equations: EquationVerification[]
  x: number[]
}

export type EquationVerification = {
  row: number
  lhs: number
  rhs: number
  error: number
}

export type SolveResponse = {
  ok: boolean
  results: SolveResult[]
}

export type MetricsResponse = {
  totalJobs: number
  avgElapsedMs: number
  avgWaitingMs: number
  avgTurnaroundMs: number
  avgCpuPct: number
  avgMemMb: number
  avgCtxVoluntary: number
  avgCtxInvoluntary: number
  avgIoReadBytes: number
  avgIoWriteBytes: number
  avgResidual: number
  totalElapsedMs: number
  throughputPerMinute: number
  byMethod: Record<string, {
    count: number
    avgElapsedMs: number
    avgWaitingMs: number
    avgTurnaroundMs: number
    avgCpuPct: number
    avgMemMb: number
    avgCtxVoluntary: number
    avgCtxInvoluntary: number
    avgIoReadBytes: number
    avgIoWriteBytes: number
    avgResidual: number
    totalElapsedMs: number
    throughputPerMinute: number
  }>
  byScenario: Record<string, {
    count: number
    avgElapsedMs: number
    avgWaitingMs: number
    avgTurnaroundMs: number
    avgCpuPct: number
    avgMemMb: number
    avgCtxVoluntary: number
    avgCtxInvoluntary: number
    avgIoReadBytes: number
    avgIoWriteBytes: number
    avgResidual: number
    totalElapsedMs: number
    throughputPerMinute: number
  }>
  byScheduler: Record<string, {
    count: number
    avgElapsedMs: number
    avgWaitingMs: number
    avgTurnaroundMs: number
    avgCpuPct: number
    avgMemMb: number
    avgCtxVoluntary: number
    avgCtxInvoluntary: number
    avgIoReadBytes: number
    avgIoWriteBytes: number
    avgResidual: number
    totalElapsedMs: number
    throughputPerMinute: number
  }>
}

export const solve = (sched: string, scenario: string) =>
  request<SolveResponse>(`/solve?sched=${encodeURIComponent(sched)}&scenario=${encodeURIComponent(scenario)}`, {
    method: 'POST'
  })

export const solveCustom = (payload: unknown) =>
  request<SolveResponse>('/solve_custom', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

export type PhysicalSolvePayload = {
  sched: string
  topology: string
  voltage: number
  resistances: number[]
  name?: string
  scenario?: string
}

export const solvePhysical = (payload: PhysicalSolvePayload) =>
  request<SolveResponse>('/solve_physical', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

export const fetchJobsCsv = () => request<string>('/api/logs/jobs')

export const fetchMetricsJson = async () => {
  const data = await request<MetricsResponse | string>('/api/metrics')
  return typeof data === 'string' ? null : data
}

export const clearJobsLog = () =>
  request<void>('/api/logs/jobs', {
    method: 'DELETE'
  })
