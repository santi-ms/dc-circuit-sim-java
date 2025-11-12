package com.example.dc.domain;

public class Circuit {
    private final double[][] a;
    private final double[] b;

    public Circuit(double[][] a, double[] b) {
        this.a = copyMatrix(a);
        this.b = b.clone();
    }

    public double[][] getA() {
        return copyMatrix(a);
    }

    public double[] getB() {
        return b.clone();
    }

    public int size() {
        return a.length;
    }

    private double[][] copyMatrix(double[][] matrix) {
        double[][] copy = new double[matrix.length][];
        for (int i = 0; i < matrix.length; i++) {
            copy[i] = matrix[i].clone();
        }
        return copy;
    }
}
