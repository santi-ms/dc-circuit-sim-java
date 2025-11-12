package com.example.dc.patterns.solver;

public class GaussJordanSolver implements Solver {

    private static final double EPS = 1e-12;

    @Override
    public String name() {
        return "gauss-jordan";
    }

    @Override
    public double[] solve(double[][] a, double[] b) {
        if (a == null || b == null) {
            throw new IllegalArgumentException("A y b no pueden ser nulos");
        }
        int n = a.length;
        if (n == 0 || b.length != n) {
            throw new IllegalArgumentException("Dimensiones inválidas");
        }
        double[][] augmented = buildAugmentedMatrix(a, b);
        for (int col = 0; col < n; col++) {
            int pivotRow = findPivot(augmented, col, col);
            if (Math.abs(augmented[pivotRow][col]) < EPS) {
                throw new IllegalArgumentException("Sistema singular o mal condicionado");
            }
            swapRows(augmented, pivotRow, col);
            normalizeRow(augmented, col, col);
            eliminateColumn(augmented, col, col);
        }
        return extractSolution(augmented);
    }

    private double[][] buildAugmentedMatrix(double[][] a, double[] b) {
        int n = a.length;
        double[][] augmented = new double[n][n + 1];
        for (int i = 0; i < n; i++) {
            if (a[i].length != n) {
                throw new IllegalArgumentException("La matriz A debe ser cuadrada");
            }
            System.arraycopy(a[i], 0, augmented[i], 0, n);
            augmented[i][n] = b[i];
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
        int cols = matrix[row].length;
        double pivot = matrix[row][pivotColumn];
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

    private double[] extractSolution(double[][] augmented) {
        int n = augmented.length;
        double[] solution = new double[n];
        for (int i = 0; i < n; i++) {
            solution[i] = augmented[i][n];
        }
        return solution;
    }
}
