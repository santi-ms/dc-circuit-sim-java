package com.example.dc.patterns.solver;

public interface Solver {
    String name();
    double[] solve(double[][] a, double[] b);
}
