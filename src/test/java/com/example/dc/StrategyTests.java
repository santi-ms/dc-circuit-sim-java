package com.example.dc;

import com.example.dc.patterns.solver.CramerSolver;
import com.example.dc.patterns.solver.GaussJordanSolver;
import com.example.dc.patterns.solver.LibrarySolver;
import com.example.dc.patterns.solver.Solver;
import org.assertj.core.data.Offset;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StrategyTests {

    private static final double[][] A = {
            {3, 2, -1},
            {2, -2, 4},
            {-1, 0.5, -1}
    };

    private static final double[] B = {1, -2, 0};

    private static final double[] EXPECTED = {1.0, -2.0, -2.0};

    private static final Offset<Double> TOLERANCE = Offset.offset(1e-6);

    @Test
    void cramerSolverMatchesExpected() {
        Solver solver = new CramerSolver();
        double[] solution = solver.solve(A, B);
        assertClose(solution);
    }

    @Test
    void gaussJordanSolverMatchesExpected() {
        Solver solver = new GaussJordanSolver();
        double[] solution = solver.solve(A, B);
        assertClose(solution);
    }

    @Test
    void librarySolverMatchesExpected() {
        Solver solver = new LibrarySolver();
        double[] solution = solver.solve(A, B);
        assertClose(solution);
    }

    private void assertClose(double[] solution) {
        assertThat(solution).hasSize(EXPECTED.length);
        for (int i = 0; i < EXPECTED.length; i++) {
            assertThat(solution[i]).isCloseTo(EXPECTED[i], TOLERANCE);
        }
    }
}
