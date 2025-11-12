# Informe Final · Simulación DC Multiplataforma

> Proyecto: `dc-circuit-sim-java`
> Fecha: $(Get-Date -Format "yyyy-MM-dd")
> Autores: Equipo de simulación (Paradigmas / SO)

## 1. Objetivo General
Implementar una plataforma multiplataforma que resuelva circuitos de corriente directa aplicando las Leyes de Kirchhoff, evaluando distintos métodos numéricos y algoritmos de planificación de procesos. La solución integra análisis físico, principios de POO/SOLID, patrones de diseño, métricas de rendimiento y una interfaz web interactiva.

## 2. Arquitectura General

| Módulo              | Descripción                                                                             |
|--------------------|-----------------------------------------------------------------------------------------|
| **Circuito (Dominio)** | `domain/` define `CircuitSpec`, `CircuitManager` (Singleton) y generación de escenarios. |
| **Motor Numérico**  | `patterns/solver/` (Strategy) + `schedulers/` (FCFS/SJF/RR con StepRunner cooperativo). |
| **Controlador**     | `controller.Controller` orquesta jobs, calcula residuales y registra métricas.        |
| **Vista UI**        | `/ui` (React + Vite + Tailwind) consume la API y WebSocket (Observer) en tiempo real.   |
| **Métricas**        | `utils/MetricsLogger` escribe CSV y `LogAnalyticsService` agrega datos para `/api/metrics`. |
| **Scripts**         | `/scripts` automatiza compilación, ejecución y monitoreo en Linux.                       |

### Patrones de Diseño
- **Strategy**: selección dinámica entre Cramer, Gauss-Jordan y Commons Math.
- **Observer**: `EventBus` + `WsHandler` => WebSocket `/ws` para actualizaciones.
- **Singleton**: `CircuitManager.INSTANCE` administra la instancia del circuito.

## 3. Modelado Físico
- Resolución de sistemas Ax = b generados a partir de circuitos bien condicionados.
- Métodos soportados: **Cramer**, **Gauss-Jordan**, **Librería (Commons Math)**.
- Se calcula automáticamente la norma residual `‖A·x − b‖` para validar la solución.
- En la UI cada corriente (`I1`, `I2`, …) muestra magnitud y sentido real (flechas → / ← según polaridad).

## 4. Planificadores de SO

| Algoritmo | Implementación                           | Detalles clave |
|-----------|-------------------------------------------|----------------|
| FCFS      | `schedulers/FCFSScheduler`                | Jobs resueltos en orden de llegada, ejecutados en un pool paralelo (`DC_PARALLELISM`). |
| SJF       | `schedulers/SJFScheduler`                 | Ordena por estimación `O(n³)` y despacha en paralelo. |
| Round Robin | `schedulers/RoundRobinScheduler` + `StepRunner` | Quantum cooperativo (10 ms) con reencolado incremental y ejecución concurrente por tandas. |

### Escenarios disponibles
- **Simple (3×3)**, **Medio (20×20)**, **Complejo (80×80)** generados por `CircuitManager.generateScenario(ScenarioType)`.
- `/solve?sched=fcfs&scenario=simple` ejecuta los tres métodos en paralelo lógico (jobs encolados). 
- `/solve_custom` permite matrices ingresadas por el usuario (UI modal "Carga personalizada").

## 5. Métricas y Monitoreo
- CSV `data/jobs_log.csv`: `ts,job_id,method,scheduler,scenario,...,ctx_voluntary,ctx_involuntary,io_read_bytes,io_write_bytes,residual`.
- Endpoint `/api/logs/jobs` (CSV) y `/api/metrics` (agregados JSON) para dashboards.
- Scripts Linux:
  - `scripts/compilar_ejecutar.sh` → `./gradlew clean bootRun`.
  - `scripts/monitoreo.sh` → `top`, `ps`, `free`, `vmstat`, `pidstat -d` (genera métricas de CPU, memoria, context switches, I/O).
  - `scripts/bench_run.sh` → Pruebas automatizadas combinando schedulers y escenarios.

## 6. Resultados (Ejemplo)
Tras ejecutar `scripts/bench_run.sh` y levantar la UI (`npm run dev`):

| Scheduler | Métodos | Avg tiempo (ms) | Throughput (jobs/min) | Residual medio |
|-----------|---------|-----------------|-----------------------|----------------|
| FCFS      | 3       | _(ver `/api/metrics`)_ | _(ver `/api/metrics`)_   | _(ver `/api/metrics`)_ |
| Round Robin | 3    | ...             | ...                   | ...            |
| SJF       | 3       | ...             | ...                   | ...            |

> **Cómo obtener los valores reales**
> 1. Ejecutar `scripts/bench_run.sh` (requiere backend en marcha `./gradlew bootRun`).
> 2. Consultar `curl -s http://127.0.0.1:8080/api/metrics | jq` o usar la pestaña **Analysis** en la UI.
> 3. Exportar el CSV desde la UI con “Exportar CSV”.

## 7. UI (React + Tailwind)
- **Vista principal**: tarjetas por método con estado, tiempo, residual, escenario, scheduler y sentido de corrientes.
- **Panel de análisis**: 
  - Barras por método, líneas de evolución temporal, tabla histórica.
  - Gráfico combinado (barras + línea) por planificador mostrando avg tiempo y throughput.
  - Recupera datos de `/api/metrics` y `jobs_log.csv`.
- **WebSocket** `/ws`: notifica `status` y `result` con actualizaciones en tiempo real (Observer).
- **Proxy Vite** con rutas relativas en desarrollo y variables `VITE_API_BASE`, `VITE_WS_URL` en producción.

## 8. Validación Física
- Residuales `‖A·x−b‖` se loguean y se muestran en la UI; si superan 1e-6 se imprime advertencia en consola.
- Cada tarjeta muestra la verificación fila a fila: `A_i*x = b_i` con lhs, rhs y error absoluto (`|lhs-rhs|`), destacando desviaciones.

## 9. Próximos pasos sugeridos
1. **Ejecución realmente paralela**: usar `ExecutorService` para threads concurrentes de StepRunner.
2. **Context switches y CPU avanzada**: integrar `vmstat`/`pidstat` y añadir parseo en el dashboard.
3. **Informe automático**: generar tabla resumen (por ejemplo un script que consuma `/api/metrics` y produzca Markdown/CSV).
4. **Análisis comparativo**: documentar conclusiones (round robin para escenarios mixtos, SJF en trabajos cortos, etc.).

## 10. Reproducibilidad
```bash
# Backend
./gradlew clean bootRun

# Frontend
cd ui
npm install
npm run dev

# Bench + métricas
cd ..
bash scripts/bench_run.sh
curl -s http://127.0.0.1:8080/api/metrics | jq
```

## 11. Conclusiones
- La planificación altera significativamente los tiempos de cada algoritmo de resolución (especialmente en matrices grandes).
- Round Robin equilibra la ejecución cuando los métodos tienen tiempos muy distintos, aunque introduce overhead si el quantum es muy corto.
- SJF minimiza el tiempo medio para cargas heterogéneas donde la estimación de coste es fiable.
- El residual permite verificar la corrección física de los resultados y detectar desvíos numéricos.
- La UI brinda feedback inmediato y facilita comparar métodos/schedulers en distintos escenarios.

---
**Repositorio**: [dc-circuit-sim-java](../)

Este informe se mantiene en sincronía con el código. Actualiza los datos de la tabla 6 tras cada campaña de benchmarks para documentar los hallazgos finales.
