package com.example.dc.web;

import com.example.dc.controller.Controller;
import com.example.dc.domain.CircuitManager;
import com.example.dc.domain.CircuitPhysicalModel;
import com.example.dc.domain.CircuitSpec;
import com.example.dc.domain.ParallelCircuitModel;
import com.example.dc.domain.PhysicalSolveRequest;
import com.example.dc.domain.SchedulerType;
import com.example.dc.domain.ScenarioType;
import com.example.dc.domain.SeriesCircuitModel;
import com.example.dc.domain.components.Resistor;
import com.example.dc.domain.components.VoltageSource;
import com.example.dc.dto.SolveRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@RestController
public class ApiController {

    private static final Logger log = LoggerFactory.getLogger(ApiController.class);

    private final Controller controller;

    public ApiController(Controller controller) {
        this.controller = controller;
    }

    @GetMapping("/")
    public Map<String, Object> root() {
        return Map.of(
                "ok", true,
                "message", "Simulador de circuito DC activo"
        );
    }

    @PostMapping("/solve")
    public ResponseEntity<Map<String, Object>> solveScenario(@RequestParam("sched") String scheduler,
                                                              @RequestParam("scenario") String scenario) {
        SchedulerType schedulerType = SchedulerType.from(scheduler);
        ScenarioType scenarioType = ScenarioType.from(scenario);
        log.info("/solve sched={} scenario={}", schedulerType.code(), scenarioType.code());
        List<Controller.ComputedResult> results = controller.runScenario(schedulerType, scenarioType);
        return ResponseEntity.ok(successPayload(results));
    }

    @PostMapping("/solve_custom")
    public ResponseEntity<Map<String, Object>> solveCustom(@RequestBody SolveRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("payload requerido");
        }
        SchedulerType schedulerType = SchedulerType.from(request.getSched());
        validateDimensions(request.getA(), request.getB());
        String name = request.getName() != null && !request.getName().isBlank() ? request.getName() : "custom";
        CircuitSpec spec = CircuitManager.INSTANCE.custom(name, request.getA(), request.getB());
        List<Controller.ComputedResult> results = controller.runCustom(schedulerType, spec);
        return ResponseEntity.ok(successPayload(results));
    }

    @PostMapping("/solve_physical")
    public ResponseEntity<Map<String, Object>> solvePhysical(@RequestBody PhysicalSolveRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("payload requerido");
        }
        SchedulerType schedulerType = SchedulerType.from(request.sched());
        CircuitPhysicalModel model = buildPhysicalModel(request);
        String baseName = request.name() != null && !request.name().isBlank() ? request.name() : model.name();
        CircuitSpec spec = CircuitManager.INSTANCE.custom(baseName + "-" + System.currentTimeMillis(), model);
        List<Controller.ComputedResult> results = controller.runCustom(schedulerType, spec);
        return ResponseEntity.ok(successPayload(results));
    }

    private Map<String, Object> successPayload(List<Controller.ComputedResult> results) {
        return Map.of(
                "ok", true,
                "results", mapResults(results)
        );
    }

    private void validateDimensions(double[][] a, double[] b) {
        if (a == null || b == null) {
            throw new IllegalArgumentException("A y b son obligatorios");
        }
        if (a.length == 0 || a.length != b.length) {
            throw new IllegalArgumentException("Dimensiones inconsistentes entre A y b");
        }
        for (double[] row : a) {
            if (row == null || row.length != a.length) {
                throw new IllegalArgumentException("La matriz A debe ser cuadrada");
            }
        }
    }

    private List<Map<String, Object>> mapResults(List<Controller.ComputedResult> results) {
        return results.stream()
                .map(result -> Map.of(
                        "jobId", result.result().getJobId(),
                        "method", result.result().getMethodName(),
                        "scheduler", result.schedulerCode(),
                        "elapsedMs", result.result().getElapsedMs(),
                        "waitingMs", result.result().getWaitingMs(),
                        "turnaroundMs", result.result().getTurnaroundMs(),
                        "residual", result.residual(),
                        "scenario", result.scenarioName(),
                        "equations", result.equations().stream()
                                .map(eq -> Map.of(
                                        "row", eq.row(),
                                        "lhs", eq.lhs(),
                                        "rhs", eq.rhs(),
                                        "error", eq.error()
                                ))
                                .collect(Collectors.toList()),
                        "x", result.result().getSolution() == null ? List.of() : Arrays.stream(result.result().getSolution()).boxed().collect(Collectors.toList())
                ))
                .collect(Collectors.toList());
    }

    private CircuitPhysicalModel buildPhysicalModel(PhysicalSolveRequest request) {
        if (request.resistances() == null || request.resistances().length == 0) {
            throw new IllegalArgumentException("Debe indicar resistencias");
        }
        List<Resistor> resistors = IntStream.range(0, request.resistances().length)
                .mapToObj(i -> {
                    double value = request.resistances()[i];
                    if (value <= 0) {
                        throw new IllegalArgumentException("Resistencia debe ser positiva");
                    }
                    return new Resistor("R" + (i + 1), value);
                })
                .toList();
        VoltageSource source = new VoltageSource("Vs", request.voltage());
        String topology = request.topology() != null ? request.topology().trim().toLowerCase() : "serie";
        String baseName = request.name() != null && !request.name().isBlank() ? request.name() : topology;
        return switch (topology) {
            case "serie", "series" -> new SeriesCircuitModel(baseName, resistors, source);
            case "paralelo", "parallel" -> new ParallelCircuitModel(baseName, resistors, source);
            default -> throw new IllegalArgumentException("topologia invalida: " + request.topology());
        };
    }
}
