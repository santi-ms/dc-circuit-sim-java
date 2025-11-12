package com.example.dc.patterns.solver;

import java.util.Arrays;

public class CramerSolver implements Solver {

    private static final double EPS = 1e-12;

    @Override
    public String name() {
        return "cramer";
    }

    @Override
    public double[] solve(double[][] a, double[] b) {
        validate(a, b);
        double detA = determinant(a);
        if (Math.abs(detA) < EPS) {
            throw new IllegalArgumentException("Determinante demasiado pequeño para resolver con Cramer");
        }
        int n = b.length;
        double[] solution = new double[n];
        for (int i = 0; i < n; i++) {
            double[][] modified = replaceColumn(a, b, i);
            double detAi = determinant(modified);
            solution[i] = detAi / detA;
        }
        return solution;
    }

    private void validate(double[][] a, double[] b) {
        if (a == null || b == null) {
            throw new IllegalArgumentException("A y b no pueden ser nulos");
        }
        if (a.length != b.length) {
            throw new IllegalArgumentException("La matriz A debe ser cuadrada y del mismo tamaño que b");
        }
    }

    private double[][] replaceColumn(double[][] original, double[] b, int column) {
        int n = original.length;
        double[][] copy = deepCopy(original);
        for (int row = 0; row < n; row++) {
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
