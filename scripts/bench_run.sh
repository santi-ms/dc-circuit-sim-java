#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

BASE_URL="http://127.0.0.1:8080"
SCHEDULES=(fcfs rr sjf)
SCENARIOS=(simple medio complejo)

for sched in "${SCHEDULES[@]}"; do
  for scenario in "${SCENARIOS[@]}"; do
    echo "Ejecutando ${sched} con ${scenario}"
    curl -s -X POST "${BASE_URL}/solve?sched=${sched}&scenario=${scenario}" -H 'Content-Type: application/json' -d '{}'
    echo
    sleep 1
  done
  echo "------------------------"
  sleep 1
 done
