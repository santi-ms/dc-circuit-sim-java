package com.example.dc.schedulers;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.UUID;

public class Job {
    private final String id;
    private final String methodName;
    private final double[][] a;
    private final double[] b;
    private final StepRunner stepRunner;
    private final Long estimatedMs;

    private final Instant created;
    private Instant firstStart;
    private Instant finish;
    private double accumulatedElapsedMs;

    public Job(String methodName, double[][] a, double[] b, StepRunner stepRunner, Long estimatedMs) {
        this(UUID.randomUUID().toString(), methodName, a, b, stepRunner, estimatedMs);
    }

    public Job(String id, String methodName, double[][] a, double[] b, StepRunner stepRunner, Long estimatedMs) {
        this.id = id;
        this.methodName = methodName;
        this.a = deepCopy(a);
        this.b = b.clone();
        this.stepRunner = stepRunner;
        this.estimatedMs = estimatedMs;
        this.created = Instant.now();
        this.accumulatedElapsedMs = 0.0;
    }

    public String getId() {
        return id;
    }

    public String getMethodName() {
        return methodName;
    }

    public Long getEstimatedMs() {
        return estimatedMs;
    }

    public Instant getCreated() {
        return created;
    }

    public Instant getFirstStart() {
        return firstStart;
    }

    public Instant getFinish() {
        return finish;
    }

    public double[][] getA() {
        return deepCopy(a);
    }

    public double[] getB() {
        return b.clone();
    }

    public Result runToCompletion() {
        markFirstStart();
        long start = System.nanoTime();
        while (!stepRunner.isFinished()) {
            stepRunner.runNextStep();
        }
        long elapsedMs = (System.nanoTime() - start) / 1_000_000;
        accumulatedElapsedMs += elapsedMs;
        finish = Instant.now();
        return buildResult();
    }

    public QuantumOutcome runForQuantum(long quantumMs) {
        markFirstStart();
        long wallStart = System.nanoTime();
        long budget = quantumMs;
        while (!stepRunner.isFinished() && budget > 0) {
            long estimated = stepRunner.runNextStep();
            budget -= Math.max(1, estimated);
        }
        long elapsedMs = (System.nanoTime() - wallStart) / 1_000_000;
        accumulatedElapsedMs += elapsedMs;
        if (stepRunner.isFinished()) {
            finish = Instant.now();
            return new QuantumOutcome(true, elapsedMs, buildResult());
        }
        return new QuantumOutcome(false, elapsedMs, null);
    }

    public boolean isFinished() {
        return stepRunner.isFinished();
    }

    private void markFirstStart() {
        if (firstStart == null) {
            firstStart = Instant.now();
        }
    }

    private double[][] deepCopy(double[][] matrix) {
        return Arrays.stream(matrix)
                .map(double[]::clone)
                .toArray(double[][]::new);
    }

    public record QuantumOutcome(boolean finished, long elapsedMs, Result result) {}

    private Result buildResult() {
        finish = Instant.now();
        double waitingMs = millisBetween(created, firstStart != null ? firstStart : finish);
        double turnaroundMs = millisBetween(created, finish);
        return new Result(id, methodName, accumulatedElapsedMs, waitingMs, turnaroundMs, stepRunner.currentResult());
    }

    private static double millisBetween(Instant start, Instant end) {
        if (start == null || end == null) {
            return Double.NaN;
        }
        return Duration.between(start, end).toNanos() / 1_000_000.0;
    }
}
