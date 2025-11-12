package com.example.dc.schedulers.runners;

import com.example.dc.schedulers.StepRunner;

import java.util.Arrays;

public class CramerStepRunner implements StepRunner {

    private static final double EPS = 1e-12;

    private final double[][] a;
    private final double[] b;
    private final double[] solution;
    private final double detA;
    private int nextColumn = 0;

    public CramerStepRunner(double[][] a, double[] b) {
        this.a = deepCopy(a);
        this.b = b.clone();
        this.solution = new double[b.length];
        this.detA = determinant(this.a);
        if (Math.abs(detA) < EPS) {
            throw new IllegalArgumentException("Determinante demasiado pequeño para resolver con Cramer");
        }
    }

    @Override
    public boolean isFinished() {
        return nextColumn >= b.length;
    }

    @Override
    public long runNextStep() {
        if (isFinished()) {
            return 0L;
        }
        long start = System.nanoTime();
        double[][] modified = replaceColumn(a, b, nextColumn);
        double detAi = determinant(modified);
        solution[nextColumn] = detAi / detA;
        nextColumn++;
        long elapsed = (System.nanoTime() - start) / 1_000_000;
        return Math.max(1L, elapsed);
    }

    @Override
    public double[] currentResult() {
        return Arrays.copyOf(solution, solution.length);
    }

    private double[][] replaceColumn(double[][] original, double[] b, int column) {
        double[][] copy = deepCopy(original);
        for (int row = 0; row < original.length; row++) {
            copy[row][column] = b[row];
        }
        return copy;
    }

    private double[][] deepCopy(double[][] matrix) {
        return Arrays.stream(matrix)
                .map(double[]::clone)
                .toArray(double[][]::new);
    }

    private double determinant(double[][] matrix) {
        int n = matrix.length;
        double[][] m = deepCopy(matrix);
        double det = 1.0;
        for (int i = 0; i < n; i++) {
            int pivot = i;
            for (int j = i + 1; j < n; j++) {
                if (Math.abs(m[j][i]) > Math.abs(m[pivot][i])) {
                    pivot = j;
                }
            }
            if (Math.abs(m[pivot][i]) < EPS) {
                return 0.0;
            }
            if (pivot != i) {
                double[] temp = m[i];
                m[i] = m[pivot];
                m[pivot] = temp;
                det *= -1;
            }
            det *= m[i][i];
            double pivotValue = m[i][i];
            for (int j = i + 1; j < n; j++) {
                double factor = m[j][i] / pivotValue;
                for (int k = i; k < n; k++) {
                    m[j][k] -= factor * m[i][k];
                }
            }
        }
        return det;
    }
}
