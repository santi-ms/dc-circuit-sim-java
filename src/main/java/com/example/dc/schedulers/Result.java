package com.example.dc.schedulers;

import java.util.Arrays;

public class Result {
    private final String jobId;
    private final String methodName;
    private final double elapsedMs;
    private final double waitingMs;
    private final double turnaroundMs;
    private final double[] solution;

    public Result(String jobId, String methodName, double elapsedMs, double waitingMs, double turnaroundMs, double[] solution) {
        this.jobId = jobId;
        this.methodName = methodName;
        this.elapsedMs = elapsedMs;
        this.waitingMs = waitingMs;
        this.turnaroundMs = turnaroundMs;
        this.solution = solution != null ? solution.clone() : null;
    }

    public String getJobId() {
        return jobId;
    }

    public String getMethodName() {
        return methodName;
    }

    public double getElapsedMs() {
        return elapsedMs;
    }

    public double getWaitingMs() {
        return waitingMs;
    }

    public double getTurnaroundMs() {
        return turnaroundMs;
    }

    public double[] getSolution() {
        return solution != null ? solution.clone() : null;
    }

    @Override
    public String toString() {
        return "Result{" +
                "jobId='" + jobId + '\'' +
                ", methodName='" + methodName + '\'' +
                ", elapsedMs=" + elapsedMs +
                ", waitingMs=" + waitingMs +
                ", turnaroundMs=" + turnaroundMs +
                ", solution=" + Arrays.toString(solution) +
                '}';
    }
}
