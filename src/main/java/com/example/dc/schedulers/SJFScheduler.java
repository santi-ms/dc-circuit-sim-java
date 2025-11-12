package com.example.dc.schedulers;

import com.example.dc.utils.Config;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class SJFScheduler implements IScheduler {

    private final List<Job> jobs = new ArrayList<>();

    @Override
    public void submit(Job job) {
        jobs.add(job);
    }

    @Override
    public List<Result> runAll() {
        jobs.sort(Comparator.comparing(Job::getEstimatedMs, Comparator.nullsLast(Long::compareTo)));
        List<Job> ordered = new ArrayList<>(jobs);
        jobs.clear();
        int parallelism = Math.max(1, Config.parallelism());
        ExecutorService executor = Executors.newFixedThreadPool(parallelism);
        List<Future<Result>> futures = new ArrayList<>(ordered.size());
        for (Job job : ordered) {
            futures.add(executor.submit(job::runToCompletion));
        }
        List<Result> results = new ArrayList<>(ordered.size());
        try {
            for (Future<Result> future : futures) {
                try {
                    results.add(future.get());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("SJF scheduler interrupted", e);
                } catch (ExecutionException e) {
                    throw new IllegalStateException("SJF job failed", e.getCause());
                }
            }
        } finally {
            executor.shutdown();
        }
        return results;
    }

    @Override
    public String name() {
        return "sjf";
    }
}
