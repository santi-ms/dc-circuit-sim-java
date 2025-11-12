package com.example.dc.patterns.solver;

import org.apache.commons.math3.linear.Array2DRowRealMatrix;
import org.apache.commons.math3.linear.ArrayRealVector;
import org.apache.commons.math3.linear.DecompositionSolver;
import org.apache.commons.math3.linear.LUDecomposition;
import org.apache.commons.math3.linear.RealMatrix;

public class LibrarySolver implements Solver {
    @Override
    public String name() {
        return "library";
    }

    @Override
    public double[] solve(double[][] a, double[] b) {
        RealMatrix matrix = new Array2DRowRealMatrix(a, false);
        DecompositionSolver solver = new LUDecomposition(matrix).getSolver();
        return solver.solve(new ArrayRealVector(b, false)).toArray();
    }
}
