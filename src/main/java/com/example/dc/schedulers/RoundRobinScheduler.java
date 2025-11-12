package com.example.dc.schedulers;

import com.example.dc.utils.Config;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class RoundRobinScheduler implements IScheduler {

    private final Deque<Job> queue = new ArrayDeque<>();
    private final long quantumMs;

    public RoundRobinScheduler() {
        this(Config.QUANTUM_MS);
    }

    public RoundRobinScheduler(long quantumMs) {
        this.quantumMs = quantumMs;
    }

    @Override
    public void submit(Job job) {
        queue.addLast(job);
    }

    @Override
    public List<Result> runAll() {
        Deque<Job> processingQueue = new ArrayDeque<>(queue);
        queue.clear();
        List<Result> results = new ArrayList<>();
        int parallelism = Math.max(1, Config.parallelism());
        ExecutorService executor = Executors.newFixedThreadPool(parallelism);
        try {
            while (!processingQueue.isEmpty()) {
                List<Job> batch = new ArrayList<>(parallelism);
                List<Future<Job.QuantumOutcome>> futures = new ArrayList<>(parallelism);
                for (int i = 0; i < parallelism && !processingQueue.isEmpty(); i++) {
                    Job job = processingQueue.removeFirst();
                    batch.add(job);
                    futures.add(executor.submit(() -> job.runForQuantum(quantumMs)));
                }
                for (int i = 0; i < futures.size(); i++) {
                    Job job = batch.get(i);
                    try {
                        Job.QuantumOutcome outcome = futures.get(i).get();
                        if (outcome.finished()) {
                            results.add(outcome.result());
                        } else {
                            processingQueue.addLast(job);
                        }
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new IllegalStateException("RoundRobin scheduler interrupted", e);
                    } catch (ExecutionException e) {
                        throw new IllegalStateException("RoundRobin job failed", e.getCause());
                    }
                }
            }
        } finally {
            executor.shutdown();
        }
        return results;
    }

    @Override
    public String name() {
        return "rr";
    }
}
