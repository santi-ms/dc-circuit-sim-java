import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type Language = 'es' | 'pt'

type Dictionary = typeof translations.es
type TranslationKey = keyof Dictionary
type Replacements = Record<string, string | number>

const translations = {
  es: {
    'language.switch': 'Idioma',
    'language.es': 'Español',
    'language.pt': 'Portugués',
    'nav.simulation': 'Simulación',
    'nav.analysis': 'Análisis',
    'status.ready': 'Listo para simular',
    'status.running': 'Ejecutando simulación…',
    'status.completed': 'Simulación completada',
    'status.error': 'Error en simulación',
    'status.customReady': 'Resultado personalizado listo',
    'status.state': 'Estado: {state} ({scheduler})',
    'status.state.running': 'En ejecución',
    'status.state.done': 'Finalizado',
    'status.state.idle': 'En espera',
    'controls.title': 'Panel de control',
    'controls.subtitle': 'Selecciona planificador y escenario para ejecutar la simulación.',
    'controls.scheduler': 'Planificador',
    'controls.scenario': 'Escenario',
    'controls.run': 'Ejecutar simulación',
    'controls.running': 'Ejecutando…',
    'controls.custom': 'Carga personalizada',
    'controls.physical': 'Circuito físico',
    'scenario.simple': 'Simple (3x3)',
    'scenario.medio': 'Medio (20x20)',
    'scenario.complejo': 'Complejo (80x80)',
    'scenario.unknown': 'Desconocido',
    'home.diagram.title': 'Diagrama del circuito ({topology})',
    'topology.serie': 'serie',
    'topology.paralelo': 'paralelo',
    'result.resolution': 'Resolución Ax = b',
    'result.scenario': 'Escenario',
    'result.scheduler': 'Planificador',
    'result.residual': 'Residual',
    'result.wait': 'Espera',
    'result.turnaround': 'Retorno',
    'result.viewDetails': 'Ver detalles',
    'result.hideDetails': 'Ocultar detalles',
    'result.current.assumed': 'sentido asumido',
    'result.current.reverse': 'sentido inverso',
    'statusBadge.idle': 'Pendiente',
    'statusBadge.running': 'En progreso',
    'statusBadge.waiting': 'En cola',
    'statusBadge.done': 'Completado',
    'customSolve.title': 'Carga personalizada',
    'customSolve.subtitle': 'Ingresa la matriz A y el vector b en formato JSON.',
    'customSolve.matrix': 'Matriz A (JSON)',
    'customSolve.vector': 'Vector b (JSON)',
    'customSolve.scheduler': 'Planificador',
    'customSolve.close': 'Cerrar',
    'customSolve.cancel': 'Cancelar',
    'customSolve.submit': 'Resolver circuito personalizado',
    'customSolve.sending': 'Enviando…',
    'physicalSolve.title': 'Circuito físico (serie/paralelo)',
    'physicalSolve.subtitle': 'Define la topología, el voltaje y las resistencias para generar la matriz Ax = b automáticamente.',
    'physicalSolve.scheduler': 'Planificador',
    'physicalSolve.topology': 'Topología',
    'physicalSolve.name': 'Nombre (opcional)',
    'physicalSolve.voltage': 'Voltaje de la fuente (V)',
    'physicalSolve.resistances': 'Resistencias (Ω) separadas por coma',
    'physicalSolve.parallelHint': 'En paralelo, cada rama recibe el mismo voltaje y se calcula su corriente I = V / R.',
    'physicalSolve.cancel': 'Cancelar',
    'physicalSolve.submit': 'Resolver circuito físico',
    'physicalSolve.generating': 'Generando…',
    'analysis.title': 'Análisis de ejecución',
    'analysis.subtitle': 'Revisa históricos, tiempos promedio y consumo registrado.',
    'analysis.export': 'Exportar CSV',
    'analysis.clear': 'Limpiar historial',
    'analysis.clear.success': 'Historial eliminado.',
    'analysis.clear.error': 'No se pudo limpiar el historial.',
    'analysis.metrics.totalJobs': 'Total de jobs',
    'analysis.metrics.avgTime': 'Tiempo promedio (ms)',
    'analysis.metrics.avgWait': 'Espera promedio (ms)',
    'analysis.metrics.turnaroundNote': 'Turnaround: {value} ms',
    'analysis.metrics.avgCpu': 'CPU promedio (%)',
    'analysis.metrics.contextSwitches': 'Cambios de contexto',
    'analysis.metrics.contextNote': 'Voluntarios / Invol.',
    'analysis.metrics.throughput': 'Throughput (jobs/min)',
    'analysis.metrics.throughputNote': 'Tiempo total: {value} s',
    'analysis.metrics.residual': 'Residual promedio',
    'analysis.metrics.ioDelta': 'IO Δ',
    'analysis.metrics.ioDetail': '{read} KB / {write} KB',
    'analysis.chart.methodTitle': 'Promedio por método',
    'analysis.chart.methodSubtitle': 'Tiempos normalizados a milisegundos.',
    'analysis.filter.all': 'Todos los escenarios',
    'analysis.chart.evolutionTitle': 'Evolución temporal',
    'analysis.table.title': 'Historial de ejecuciones',
    'analysis.table.timestamp': 'Timestamp',
    'analysis.table.scheduler': 'Planificador',
    'analysis.table.method': 'Método',
    'analysis.table.scenario': 'Escenario',
    'analysis.table.elapsed': 'Elapsed ms',
    'analysis.table.cpu': 'CPU %',
    'analysis.table.mem': 'Mem MB',
    'analysis.table.wait': 'Espera ms',
    'analysis.table.turnaround': 'Retorno ms',
    'analysis.table.ctxVol': 'Ctx Vol',
    'analysis.table.ctxInvol': 'Ctx Invol',
    'analysis.table.ioRead': 'IO Read (KB)',
    'analysis.table.ioWrite': 'IO Write (KB)',
    'analysis.table.residual': 'Residual',
    'analysis.empty': 'Aún no hay ejecuciones registradas.',
    'analysis.scheduler.title': 'Planificador vs rendimiento',
    'analysis.scheduler.subtitle': 'Comparación de tiempo medio y throughput para cada algoritmo.',
    'analysis.scheduler.table.scheduler': 'Planificador',
    'analysis.scheduler.table.jobs': 'Jobs',
    'analysis.scheduler.table.avgTime': 'Tiempo promedio (ms)',
    'analysis.scheduler.table.avgWait': 'Espera promedio (ms)',
    'analysis.scheduler.table.avgTurnaround': 'Retorno promedio (ms)',
    'analysis.scheduler.table.avgResidual': 'Residual promedio',
    'analysis.scheduler.table.ctx': 'Ctx Vol / Invol',
    'analysis.scheduler.table.io': 'IO Read/Write (KB)',
    'analysis.scheduler.table.throughput': 'Throughput (jobs/min)',
    'analysis.toast.error': 'No se pudo cargar la información de análisis.',
    'analysis.button.filter': 'Filtro de escenarios',
    'analysis.clear.confirm': '¿Seguro que deseas limpiar el historial?',
    'circuit.series.source': 'Fuente DC: {voltage} V',
    'circuit.series.current': 'Corriente: {current}',
    'circuit.parallel.branches': 'Ramas: {count}',
    'circuit.parallel.current': '{current} ({direction})',
    'language.label': 'ES/PT',
    'analysis.clear.confirm.short': '¿Limpiar historial?',
    'analysis.clear.cancel': 'Cancelar',
    'analysis.clear.ok': 'Limpiar'
    ,
    'error.unexpected': 'Error inesperado',
    'physicalSolve.error.resistances': 'Ingrese resistencias válidas (positivas) separadas por coma',
    'physicalSolve.error.voltage': 'Ingrese un voltaje distinto de cero'
  },
  pt: {
    'language.switch': 'Idioma',
    'language.es': 'Espanhol',
    'language.pt': 'Português',
    'nav.simulation': 'Simulação',
    'nav.analysis': 'Análise',
    'status.ready': 'Pronto para simular',
    'status.running': 'Executando simulação…',
    'status.completed': 'Simulação concluída',
    'status.error': 'Erro na simulação',
    'status.customReady': 'Resultado personalizado pronto',
    'status.state': 'Estado: {state} ({scheduler})',
    'status.state.running': 'Em execução',
    'status.state.done': 'Finalizado',
    'status.state.idle': 'Em espera',
    'controls.title': 'Painel de controle',
    'controls.subtitle': 'Selecione o escalonador e o cenário para executar a simulação.',
    'controls.scheduler': 'Escalonador',
    'controls.scenario': 'Cenário',
    'controls.run': 'Executar simulação',
    'controls.running': 'Executando…',
    'controls.custom': 'Carga personalizada',
    'controls.physical': 'Circuito físico',
    'scenario.simple': 'Simples (3x3)',
    'scenario.medio': 'Médio (20x20)',
    'scenario.complejo': 'Complexo (80x80)',
    'scenario.unknown': 'Desconhecido',
    'home.diagram.title': 'Diagrama do circuito ({topology})',
    'topology.serie': 'série',
    'topology.paralelo': 'paralelo',
    'result.resolution': 'Resolução Ax = b',
    'result.scenario': 'Cenário',
    'result.scheduler': 'Escalonador',
    'result.residual': 'Residual',
    'result.wait': 'Espera',
    'result.turnaround': 'Retorno',
    'result.viewDetails': 'Ver detalhes',
    'result.hideDetails': 'Ocultar detalhes',
    'result.current.assumed': 'sentido assumido',
    'result.current.reverse': 'sentido inverso',
    'statusBadge.idle': 'Pendente',
    'statusBadge.running': 'Em progresso',
    'statusBadge.waiting': 'Na fila',
    'statusBadge.done': 'Concluído',
    'customSolve.title': 'Carga personalizada',
    'customSolve.subtitle': 'Informe a matriz A e o vetor b em formato JSON.',
    'customSolve.matrix': 'Matriz A (JSON)',
    'customSolve.vector': 'Vetor b (JSON)',
    'customSolve.scheduler': 'Escalonador',
    'customSolve.close': 'Fechar',
    'customSolve.cancel': 'Cancelar',
    'customSolve.submit': 'Resolver circuito personalizado',
    'customSolve.sending': 'Enviando…',
    'physicalSolve.title': 'Circuito físico (série/paralelo)',
    'physicalSolve.subtitle': 'Defina a topologia, a tensão e as resistências para gerar a matriz Ax = b automaticamente.',
    'physicalSolve.scheduler': 'Escalonador',
    'physicalSolve.topology': 'Topologia',
    'physicalSolve.name': 'Nome (opcional)',
    'physicalSolve.voltage': 'Tensão da fonte (V)',
    'physicalSolve.resistances': 'Resistências (Ω) separadas por vírgula',
    'physicalSolve.parallelHint': 'Em paralelo, cada ramo recebe a mesma tensão e a corrente é I = V / R.',
    'physicalSolve.cancel': 'Cancelar',
    'physicalSolve.submit': 'Resolver circuito físico',
    'physicalSolve.generating': 'Gerando…',
    'analysis.title': 'Análise de execução',
    'analysis.subtitle': 'Revise históricos, tempos médios e consumo registrado.',
    'analysis.export': 'Exportar CSV',
    'analysis.clear': 'Limpar histórico',
    'analysis.clear.success': 'Histórico removido.',
    'analysis.clear.error': 'Não foi possível limpar o histórico.',
    'analysis.metrics.totalJobs': 'Total de jobs',
    'analysis.metrics.avgTime': 'Tempo médio (ms)',
    'analysis.metrics.avgWait': 'Espera média (ms)',
    'analysis.metrics.turnaroundNote': 'Turnaround: {value} ms',
    'analysis.metrics.avgCpu': 'CPU média (%)',
    'analysis.metrics.contextSwitches': 'Trocas de contexto',
    'analysis.metrics.contextNote': 'Voluntárias / Invol.',
    'analysis.metrics.throughput': 'Throughput (jobs/min)',
    'analysis.metrics.throughputNote': 'Tempo total: {value} s',
    'analysis.metrics.residual': 'Residual médio',
    'analysis.metrics.ioDelta': 'IO Δ',
    'analysis.metrics.ioDetail': '{read} KB / {write} KB',
    'analysis.chart.methodTitle': 'Média por método',
    'analysis.chart.methodSubtitle': 'Tempos normalizados em milissegundos.',
    'analysis.filter.all': 'Todos os cenários',
    'analysis.chart.evolutionTitle': 'Evolução temporal',
    'analysis.table.title': 'Histórico de execuções',
    'analysis.table.timestamp': 'Timestamp',
    'analysis.table.scheduler': 'Escalonador',
    'analysis.table.method': 'Método',
    'analysis.table.scenario': 'Cenário',
    'analysis.table.elapsed': 'Elapsed ms',
    'analysis.table.cpu': 'CPU %',
    'analysis.table.mem': 'Mem MB',
    'analysis.table.wait': 'Espera ms',
    'analysis.table.turnaround': 'Retorno ms',
    'analysis.table.ctxVol': 'Ctx Vol',
    'analysis.table.ctxInvol': 'Ctx Invol',
    'analysis.table.ioRead': 'IO Read (KB)',
    'analysis.table.ioWrite': 'IO Write (KB)',
    'analysis.table.residual': 'Residual',
    'analysis.empty': 'Ainda não há execuções registradas.',
    'analysis.scheduler.title': 'Escalonador vs desempenho',
    'analysis.scheduler.subtitle': 'Comparação de tempo médio e throughput por algoritmo.',
    'analysis.scheduler.table.scheduler': 'Escalonador',
    'analysis.scheduler.table.jobs': 'Jobs',
    'analysis.scheduler.table.avgTime': 'Tempo médio (ms)',
    'analysis.scheduler.table.avgWait': 'Espera média (ms)',
    'analysis.scheduler.table.avgTurnaround': 'Retorno médio (ms)',
    'analysis.scheduler.table.avgResidual': 'Residual médio',
    'analysis.scheduler.table.ctx': 'Ctx Vol / Invol',
    'analysis.scheduler.table.io': 'IO Read/Write (KB)',
    'analysis.scheduler.table.throughput': 'Throughput (jobs/min)',
    'analysis.toast.error': 'Não foi possível carregar as informações de análise.',
    'analysis.button.filter': 'Filtro de cenários',
    'analysis.clear.confirm': 'Deseja realmente limpar o histórico?',
    'circuit.series.source': 'Fonte CC: {voltage} V',
    'circuit.series.current': 'Corrente: {current}',
    'circuit.parallel.branches': 'Ramos: {count}',
    'circuit.parallel.current': '{current} ({direction})',
    'language.label': 'ES/PT',
    'analysis.clear.confirm.short': 'Limpar histórico?',
    'analysis.clear.cancel': 'Cancelar',
    'analysis.clear.ok': 'Limpar'
    ,
    'error.unexpected': 'Erro inesperado',
    'physicalSolve.error.resistances': 'Informe resistências válidas (positivas) separadas por vírgula',
    'physicalSolve.error.voltage': 'Informe uma tensão diferente de zero'
  }
} as const

type I18nContextValue = {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey, replacements?: Replacements) => string
}

const I18nContext = createContext<I18nContextValue>({
  lang: 'es',
  setLang: () => {},
  t: (key) => translations.es[key] ?? key
})

const STORAGE_KEY = 'dc-lang'

function format(template: string, replacements?: Replacements) {
  if (!replacements) {
    return template
  }
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = replacements[key]
    return value === undefined ? match : String(value)
  })
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window === 'undefined') {
      return 'es'
    }
    const stored = window.localStorage.getItem(STORAGE_KEY) as Language | null
    return stored === 'pt' ? 'pt' : 'es'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, lang)
    }
  }, [lang])

  const setLang = useCallback((value: Language) => {
    setLangState(value)
  }, [])

  const t = useCallback(
    (key: TranslationKey, replacements?: Replacements) => {
      const dictionary = translations[lang] ?? translations.es
      const template = dictionary[key] ?? translations.es[key] ?? key
      return format(template, replacements)
    },
    [lang]
  )

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t }), [lang, setLang, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}

export function translateTopology(topology: string, t: (key: TranslationKey, replacements?: Replacements) => string) {
  if (topology === 'serie') {
    return t('topology.serie')
  }
  if (topology === 'paralelo') {
    return t('topology.paralelo')
  }
  return topology
}

