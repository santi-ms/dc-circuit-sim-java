#!/usr/bin/env bash

if [ -z "$1" ]; then
  echo "Uso: $0 <base_url>"
  exit 1
fi

BASE_URL="${1%/}"

echo "🔍 Probando producción en ${BASE_URL}..."

echo "✅ POST ${BASE_URL}/solve"
curl -s -X POST "${BASE_URL}/solve" \
  -H "Content-Type: application/json" \
  -d '{"A":[[1,2],[3,4]],"b":[5,6],"method":"GAUSS_JORDAN"}' | jq .

echo "✅ GET ${BASE_URL}/api/metrics"
curl -s "${BASE_URL}/api/metrics"

echo "✅ GET ${BASE_URL}/api/logs/jobs"
curl -s "${BASE_URL}/api/logs/jobs"

