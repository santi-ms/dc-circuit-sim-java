package com.example.dc.schedulers;

import com.example.dc.utils.Config;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public class FCFSScheduler implements IScheduler {

    private final Queue<Job> jobs = new LinkedList<>();

    @Override
    public void submit(Job job) {
        jobs.add(job);
    }

    @Override
    public List<Result> runAll() {
        List<Job> orderedJobs = new ArrayList<>();
        while (!jobs.isEmpty()) {
            orderedJobs.add(jobs.poll());
        }
        int parallelism = Math.max(1, Config.parallelism());
        ExecutorService executor = Executors.newFixedThreadPool(parallelism);
        List<Future<Result>> futures = new ArrayList<>(orderedJobs.size());
        for (Job job : orderedJobs) {
            futures.add(executor.submit(job::runToCompletion));
        }
        List<Result> results = new ArrayList<>(orderedJobs.size());
        try {
            for (Future<Result> future : futures) {
                try {
                    results.add(future.get());
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("FCFS scheduler interrupted", e);
                } catch (ExecutionException e) {
                    throw new IllegalStateException("FCFS job failed", e.getCause());
                }
            }
        } finally {
            executor.shutdown();
        }
        return results;
    }

    @Override
    public String name() {
        return "fcfs";
    }
}
