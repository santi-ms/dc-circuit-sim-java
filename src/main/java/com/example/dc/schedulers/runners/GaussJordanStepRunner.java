package com.example.dc.schedulers.runners;

import com.example.dc.schedulers.StepRunner;

import java.util.Arrays;

public class GaussJordanStepRunner implements StepRunner {

    private static final double EPS = 1e-12;

    private final double[][] augmented;
    private final int n;
    private int pivotIndex = 0;
    private boolean finished;

    public GaussJordanStepRunner(double[][] a, double[] b) {
        this.n = a.length;
        this.augmented = buildAugmentedMatrix(a, b);
        this.finished = n == 0;
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
        int pivotRow = findPivot(augmented, pivotIndex, pivotIndex);
        if (Math.abs(augmented[pivotRow][pivotIndex]) < EPS) {
            throw new IllegalArgumentException("Sistema singular o mal condicionado");
        }
        swapRows(augmented, pivotRow, pivotIndex);
        normalizeRow(augmented, pivotIndex, pivotIndex);
        eliminateColumn(augmented, pivotIndex, pivotIndex);
        pivotIndex++;
        if (pivotIndex >= n) {
            finished = true;
        }
        long elapsed = (System.nanoTime() - start) / 1_000_000;
        return Math.max(1L, elapsed);
    }

    @Override
    public double[] currentResult() {
        if (n == 0) {
            return new double[0];
        }
        double[] current = new double[n];
        for (int i = 0; i < n; i++) {
            current[i] = augmented[i][n];
        }
        return Arrays.copyOf(current, current.length);
    }

    private double[][] buildAugmentedMatrix(double[][] a, double[] b) {
        double[][] augmented = new double[a.length][a.length + 1];
        for (int i = 0; i < a.length; i++) {
            if (a[i].length != a.length) {
                throw new IllegalArgumentException("La matriz A debe ser cuadrada");
            }
            System.arraycopy(a[i], 0, augmented[i], 0, a.length);
            augmented[i][a.length] = b[i];
        }
        return augmented;
    }

    private int findPivot(double[][] matrix, int startRow, int column) {
        int pivot = startRow;
        for (int row = startRow + 1; row < matrix.length; row++) {
            if (Math.abs(matrix[row][column]) > Math.abs(matrix[pivot][column])) {
                pivot = row;
            }
        }
        return pivot;
    }

    private void swapRows(double[][] matrix, int i, int j) {
        if (i == j) {
            return;
        }
        double[] tmp = matrix[i];
        matrix[i] = matrix[j];
        matrix[j] = tmp;
    }

    private void normalizeRow(double[][] matrix, int row, int pivotColumn) {
        double pivot = matrix[row][pivotColumn];
        int cols = matrix[row].length;
        for (int col = 0; col < cols; col++) {
            matrix[row][col] /= pivot;
        }
    }

    private void eliminateColumn(double[][] matrix, int pivotRow, int pivotColumn) {
        int rows = matrix.length;
        int cols = matrix[pivotRow].length;
        for (int row = 0; row < rows; row++) {
            if (row == pivotRow) {
                continue;
            }
            double factor = matrix[row][pivotColumn];
            if (Math.abs(factor) < EPS) {
                continue;
            }
            for (int col = 0; col < cols; col++) {
                matrix[row][col] -= factor * matrix[pivotRow][col];
            }
        }
    }
}
