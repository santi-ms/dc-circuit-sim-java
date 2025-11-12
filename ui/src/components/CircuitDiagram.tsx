import React from 'react'

type CircuitDiagramProps = {
  topology: 'serie' | 'paralelo'
  voltage: number
  resistances: number[]
  currents: number[]
}

const colors = {
  wire: '#94a3b8',
  component: '#38bdf8',
  currentPos: '#22c55e',
  currentNeg: '#ef4444',
  background: '#0f172a',
  text: '#e2e8f0'
}

function formatCurrent(value: number) {
  if (!Number.isFinite(value)) return '—'
  const magnitude = Math.abs(value)
  if (magnitude >= 1) return `${magnitude.toFixed(2)} A`
  if (magnitude >= 0.001) return `${(magnitude * 1000).toFixed(1)} mA`
  return `${(magnitude * 1_000_000).toFixed(1)} uA`
}

function formatResistance(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(2)} kΩ`
  return `${value.toFixed(2)} Ω`
}

export function CircuitDiagram({ topology, voltage, resistances, currents }: CircuitDiagramProps) {
  if (!resistances || resistances.length === 0) {
    return null
  }

  const currentValues = currents && currents.length > 0 ? currents : [NaN]

  if (topology === 'serie') {
    const current = currentValues[0] ?? NaN
    const arrowColor = current >= 0 ? colors.currentPos : colors.currentNeg
    return (
      <svg viewBox="0 0 520 180" className="w-full max-w-3xl rounded-2xl bg-slate-900/70 p-4">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto">
            <path d="M0,0 L0,6 L9,3 z" fill={arrowColor} />
          </marker>
        </defs>
        <rect x="0" y="0" width="520" height="180" fill="transparent" stroke="rgba(148,163,184,0.2)" />
        <text x="20" y="30" fill={colors.text} fontSize="14">Fuente DC: {voltage.toFixed(2)} V</text>
        <text x="20" y="50" fill={colors.text} fontSize="12">Corriente: {formatCurrent(current)}</text>

        <line x1="60" y1="100" x2="480" y2="100" stroke={colors.wire} strokeWidth="4" markerEnd="url(#arrow)" />

        {resistances.map((res, index) => {
          const x = 100 + index * 100
          return (
            <g key={index}>
              <rect x={x} y="70" width="60" height="60" fill="rgba(56,189,248,0.2)" stroke={colors.component} strokeWidth="3" rx="8" />
              <text x={x + 30} y="100" fill={colors.text} fontSize="12" textAnchor="middle">R{index + 1}</text>
              <text x={x + 30} y="118" fill={colors.text} fontSize="11" textAnchor="middle">{formatResistance(res)}</text>
            </g>
          )
        })}
      </svg>
    )
  }

  // paralelo
  const branchCount = resistances.length
  const spacing = 360 / (branchCount + 1)

  return (
    <svg viewBox="0 0 520 260" className="w-full max-w-3xl rounded-2xl bg-slate-900/70 p-4">
      <defs>
        <marker id="arrowPos" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill={colors.currentPos} />
        </marker>
        <marker id="arrowNeg" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill={colors.currentNeg} />
        </marker>
      </defs>
      <rect x="0" y="0" width="520" height="260" fill="transparent" stroke="rgba(148,163,184,0.2)" />
      <text x="20" y="30" fill={colors.text} fontSize="14">Fuente DC: {voltage.toFixed(2)} V</text>
      <text x="20" y="50" fill={colors.text} fontSize="12">Ramas: {branchCount}</text>

      <line x1="60" y1="80" x2="60" y2="220" stroke={colors.wire} strokeWidth="4" />
      <line x1="480" y1="80" x2="480" y2="220" stroke={colors.wire} strokeWidth="4" />
      <line x1="60" y1="80" x2="480" y2="80" stroke={colors.wire} strokeWidth="4" />
      <line x1="60" y1="220" x2="480" y2="220" stroke={colors.wire} strokeWidth="4" />

      {resistances.map((res, index) => {
        const y = 80 + (index + 1) * spacing
        const current = currentValues[index] ?? NaN
        const arrow = current >= 0 ? 'url(#arrowPos)' : 'url(#arrowNeg)'
        const arrowColor = current >= 0 ? colors.currentPos : colors.currentNeg
        return (
          <g key={index}>
            <line
              x1="120"
              y1={y}
              x2="440"
              y2={y}
              stroke={arrowColor}
              strokeWidth="4"
              markerStart={arrow}
              markerEnd={arrow}
            />
            <rect x="250" y={y - 20} width="60" height="40" fill="rgba(56,189,248,0.2)" stroke={colors.component} strokeWidth="3" rx="8" />
            <text x="280" y={y - 2} fill={colors.text} fontSize="12" textAnchor="middle">R{index + 1}</text>
            <text x="280" y={y + 14} fill={colors.text} fontSize="11" textAnchor="middle">{formatResistance(res)}</text>
            <text x="460" y={y - 6} fill={colors.text} fontSize="11" textAnchor="end">{formatCurrent(current)}</text>
          </g>
        )
      })}
    </svg>
  )
}
