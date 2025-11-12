#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

mkdir -p data

if command -v top >/dev/null 2>&1; then
  nohup top -b -d 2 > data/metricas_rendimiento.txt &
  echo $! > data/metricas_pid.txt
else
  echo "top no disponible" > data/metricas_rendimiento.txt
fi

if command -v ps >/dev/null 2>&1; then
  ps aux --sort=-%cpu > data/procesos_cpu.txt
else
  echo "ps no disponible" > data/procesos_cpu.txt
fi

if command -v free >/dev/null 2>&1; then
  free -m > data/memoria_uso.txt
else
  echo "free no disponible" > data/memoria_uso.txt
fi

if command -v vmstat >/dev/null 2>&1; then
  vmstat 1 10 > data/context_switches.txt &
  echo $! >> data/metricas_pid.txt
else
  echo "vmstat no disponible" > data/context_switches.txt
fi

if command -v pidstat >/dev/null 2>&1; then
  pidstat -d 1 10 > data/io_stats.txt &
  echo $! >> data/metricas_pid.txt
else
  echo "pidstat no disponible" > data/io_stats.txt
fi
