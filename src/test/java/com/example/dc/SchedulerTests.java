package com.example.dc;

import com.example.dc.schedulers.FCFSScheduler;
import com.example.dc.schedulers.IScheduler;
import com.example.dc.schedulers.Job;
import com.example.dc.schedulers.Result;
import com.example.dc.schedulers.RoundRobinScheduler;
import com.example.dc.schedulers.SJFScheduler;
import com.example.dc.schedulers.StepRunner;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class SchedulerTests {

    private static final double[][] MATRIX = {{1.0}};
    private static final double[] VECTOR = {1.0};

    @Test
    void fcfsRunsInSubmissionOrder() {
        List<String> order = new ArrayList<>();
        IScheduler scheduler = new FCFSScheduler();
        scheduler.submit(new Job("job1", "job1", MATRIX, VECTOR, new RecordingStepRunner("job1", order, 1), 30L));
        scheduler.submit(new Job("job2", "job2", MATRIX, VECTOR, new RecordingStepRunner("job2", order, 1), 30L));
        scheduler.submit(new Job("job3", "job3", MATRIX, VECTOR, new RecordingStepRunner("job3", order, 1), 30L));

        List<Result> results = scheduler.runAll();

        assertThat(order).containsExactly("job1", "job2", "job3");
        assertThat(results).hasSize(3);
    }

    @Test
    void sjfOrdersByEstimatedTime() {
        List<String> order = new ArrayList<>();
        IScheduler scheduler = new SJFScheduler();
        scheduler.submit(new Job("jobA", "jobA", MATRIX, VECTOR, new RecordingStepRunner("jobA", order, 1), 50L));
        scheduler.submit(new Job("jobB", "jobB", MATRIX, VECTOR, new RecordingStepRunner("jobB", order, 1), 10L));
        scheduler.submit(new Job("jobC", "jobC", MATRIX, VECTOR, new RecordingStepRunner("jobC", order, 1), 30L));

        scheduler.runAll();

        assertThat(order).containsExactly("jobB", "jobC", "jobA");
    }

    @Test
    void roundRobinRotatesBetweenJobs() {
        List<String> order = new ArrayList<>();
        RoundRobinScheduler scheduler = new RoundRobinScheduler(10L);
        scheduler.submit(new Job("jobX", "jobX", MATRIX, VECTOR, new RecordingStepRunner("jobX", order, 3), 40L));
        scheduler.submit(new Job("jobY", "jobY", MATRIX, VECTOR, new RecordingStepRunner("jobY", order, 1), 40L));

        List<Result> results = scheduler.runAll();

        assertThat(order).containsExactly("jobX", "jobX", "jobY", "jobX");
        assertThat(results).extracting(Result::getJobId).containsExactlyInAnyOrder("jobX", "jobY");
    }

    private static class RecordingStepRunner implements StepRunner {
        private final String id;
        private final List<String> order;
        private final double value;
        private int remainingSteps;

        private RecordingStepRunner(String id, List<String> order, int steps) {
            this.id = id;
            this.order = order;
            this.remainingSteps = steps;
            this.value = steps;
        }

        @Override
        public boolean isFinished() {
            return remainingSteps <= 0;
        }

        @Override
        public long runNextStep() {
            if (isFinished()) {
                return 0;
            }
            order.add(id);
            remainingSteps--;
            return 5L;
        }

        @Override
        public double[] currentResult() {
            return new double[]{value};
        }
    }
}
