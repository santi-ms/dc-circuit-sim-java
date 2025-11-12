package com.example.dc.patterns.factory;

import com.example.dc.patterns.solver.CramerSolver;
import com.example.dc.patterns.solver.GaussJordanSolver;
import com.example.dc.patterns.solver.LibrarySolver;
import com.example.dc.patterns.solver.Solver;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

@Component
public class SolverFactory {

    public Solver create(String name) {
        return switch (name.toLowerCase(Locale.ROOT)) {
            case "cramer" -> new CramerSolver();
            case "gauss", "gauss-jordan", "gauss_jordan" -> new GaussJordanSolver();
            case "library", "commons" -> new LibrarySolver();
            default -> throw new IllegalArgumentException("Solver desconocido: " + name);
        };
    }

    public List<Solver> defaults() {
        return List.of(
                new CramerSolver(),
                new GaussJordanSolver(),
                new LibrarySolver()
        );
    }
}
