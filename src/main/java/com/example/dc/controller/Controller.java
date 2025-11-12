package com.example.dc.controller;

import com.example.dc.domain.CircuitManager;
import com.example.dc.domain.CircuitSpec;
import com.example.dc.domain.SchedulerType;
import com.example.dc.domain.ScenarioType;
import com.example.dc.patterns.factory.SolverFactory;
import com.example.dc.patterns.observer.EventBus;
import com.example.dc.patterns.observer.StatusEvent;
import com.example.dc.patterns.observer.Topics;
import com.example.dc.patterns.solver.Solver;
import com.example.dc.schedulers.FCFSScheduler;
import com.example.dc.schedulers.IScheduler;
import com.example.dc.schedulers.Job;
import com.example.dc.schedulers.Result;
import com.example.dc.schedulers.RoundRobinScheduler;
import com.example.dc.schedulers.SJFScheduler;
import com.example.dc.schedulers.StepRunner;
import com.example.dc.schedulers.runners.CramerStepRunner;
import com.example.dc.schedulers.runners.GaussJordanStepRunner;
import com.example.dc.schedulers.runners.LibraryStepRunner;
import com.example.dc.utils.MetricsLogger;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class Controller {

    private final SolverFactory solverFactory;
    private final EventBus eventBus;
    private final MetricsLogger metricsLogger;

    public Controller(SolverFactory solverFactory, EventBus eventBus, MetricsLogger metricsLogger) {
        this.solverFactory = solverFactory;
        this.eventBus = eventBus;
        this.metricsLogger = metricsLogger;
    }

    public List<ComputedResult> runScenario(SchedulerType schedulerType, ScenarioType scenarioType) {
        CircuitSpec spec = CircuitManager.INSTANCE.generateScenario(scenarioType);
        return runBatch(schedulerType, spec, solverFactory.defaults());
    }

    public List<ComputedResult> runCustom(SchedulerType schedulerType, CircuitSpec spec) {
        return runBatch(schedulerType, spec, solverFactory.defaults());
    }

    private List<ComputedResult> runBatch(SchedulerType schedulerType, CircuitSpec spec, List<Solver> solvers) {
        IScheduler scheduler = schedulerForType(schedulerType);
        List<Job> jobs = new ArrayList<>();
        for (Solver solver : solvers) {
            StepRunner runner = runnerForSolver(solver.name(), spec.a(), spec.b());
            Long estimated = estimateCost(solver.name(), spec.size());
            jobs.add(new Job(solver.name(), spec.a(), spec.b(), runner, estimated));
        }
        for (Job job : jobs) {
            scheduler.submit(job);
        }
        int jobCount = jobs.size();
        eventBus.publish(Topics.STATUS, new StatusEvent("running", schedulerType.code(), jobCount));
        List<Result> results = scheduler.runAll();
        List<ComputedResult> computedResults = new ArrayList<>(results.size());
        double[][] matrix = spec.a();
        double[] target = spec.b();
        for (Result result : results) {
            double residual = computeResidual(matrix, result.getSolution(), target);
            if (!Double.isNaN(residual) && residual > 1e-6) {
                System.err.printf("WARN residual alto method=%s residual=%e%n", result.getMethodName(), residual);
            }
            List<EquationCheck> verifications = verifyEquations(matrix, result.getSolution(), target);
            metricsLogger.log(result, schedulerType.code(), spec.name(), residual);
            eventBus.publish(Topics.RESULT, new ResultEvent(
                    "result",
                    result.getJobId(),
                    result.getMethodName(),
                    schedulerType.code(),
                    spec.name(),
                    result.getElapsedMs(),
                    result.getWaitingMs(),
                    result.getTurnaroundMs(),
                    residual,
                    result.getSolution(),
                    verifications));
            computedResults.add(new ComputedResult(result, residual, schedulerType.code(), spec.name(), verifications));
        }
        eventBus.publish(Topics.STATUS, new StatusEvent("done", schedulerType.code(), jobCount));
        return computedResults;
    }

    private StepRunner runnerForSolver(String solverName, double[][] a, double[] b) {
        String normalized = solverName.toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "cramer" -> new CramerStepRunner(a, b);
            case "gauss", "gauss-jordan", "gauss_jordan" -> new GaussJordanStepRunner(a, b);
            case "library", "commons" -> new LibraryStepRunner(a, b);
            default -> throw new IllegalArgumentException("Solver no soportado para Round Robin: " + solverName);
        };
    }

    private IScheduler schedulerForType(SchedulerType type) {
        return switch (type) {
            case FCFS -> new FCFSScheduler();
            case SJF -> new SJFScheduler();
            case RR -> new RoundRobinScheduler();
        };
    }

    private long estimateCost(String solverName, int size) {
        double base = Math.pow(Math.max(1, size), 3);
        double factor = switch (solverName.toLowerCase(Locale.ROOT)) {
            case "cramer" -> 2.5;
            case "gauss", "gauss-jordan", "gauss_jordan" -> 1.5;
            case "library", "commons" -> 0.8;
            default -> 1.0;
        };
        return Math.max(1L, Math.round(base * factor / 1_000));
    }

    private double computeResidual(double[][] a, double[] x, double[] b) {
        if (a == null || b == null || x == null || x.length == 0) {
            return Double.NaN;
        }
        double sum = 0.0;
        for (int i = 0; i < a.length; i++) {
            double ax = 0.0;
            for (int j = 0; j < a[i].length && j < x.length; j++) {
                ax += a[i][j] * x[j];
            }
            double diff = ax - (i < b.length ? b[i] : 0.0);
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }

    private List<EquationCheck> verifyEquations(double[][] a, double[] x, double[] b) {
        if (a == null || x == null || b == null || x.length == 0) {
            return List.of();
        }
        List<EquationCheck> checks = new ArrayList<>(a.length);
        for (int i = 0; i < a.length; i++) {
            double lhs = 0.0;
            for (int j = 0; j < a[i].length && j < x.length; j++) {
                lhs += a[i][j] * x[j];
            }
            double rhs = i < b.length ? b[i] : 0.0;
            double error = Math.abs(lhs - rhs);
            checks.add(new EquationCheck(i, lhs, rhs, error));
        }
        return checks;
    }

    public record ResultEvent(String type, String jobId, String method, String scheduler, String scenario,
                              double elapsedMs, double waitingMs, double turnaroundMs, double residual, double[] x,
                              List<EquationCheck> equations) {}

    public record ComputedResult(Result result, double residual, String schedulerCode, String scenarioName,
                                 List<EquationCheck> equations) {}

    public record EquationCheck(int row, double lhs, double rhs, double error) {}
}
