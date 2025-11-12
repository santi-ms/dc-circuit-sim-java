package com.example.dc.schedulers.runners;

import com.example.dc.patterns.solver.LibrarySolver;
import com.example.dc.schedulers.StepRunner;

import java.util.Arrays;

public class LibraryStepRunner implements StepRunner {

    private final double[][] a;
    private final double[] b;
    private final double[] solution;
    private final LibrarySolver solver = new LibrarySolver();
    private int phase = 0;
    private boolean finished = false;

    public LibraryStepRunner(double[][] a, double[] b) {
        this.a = deepCopy(a);
        this.b = b.clone();
        this.solution = new double[b.length];
    }

    @Override
    public boolean isFinished() {
        return finished;
    }

    @Override
    public long runNextStep() {
        if (isFinished()) {
            return 0L;
        }
        long start = System.nanoTime();
        switch (phase) {
            case 0 -> simulatePreparation();
            case 1 -> computeSolution();
            default -> finalizePhase();
        }
        phase++;
        long elapsed = (System.nanoTime() - start) / 1_000_000;
        return Math.max(1L, elapsed);
    }

    private void simulatePreparation() {
        double checksum = 0.0;
        for (double[] row : a) {
            for (double value : row) {
                checksum += value * 0.00001;
            }
        }
        if (Double.isNaN(checksum)) {
            throw new IllegalStateException("Error en simulación de preparación");
        }
    }

    private void computeSolution() {
        double[] solved = solver.solve(a, b);
        System.arraycopy(solved, 0, solution, 0, solved.length);
    }

    private void finalizePhase() {
        finished = true;
    }

    @Override
    public double[] currentResult() {
        return Arrays.copyOf(solution, solution.length);
    }

    private double[][] deepCopy(double[][] matrix) {
        return Arrays.stream(matrix)
                .map(double[]::clone)
                .toArray(double[][]::new);
    }
}
