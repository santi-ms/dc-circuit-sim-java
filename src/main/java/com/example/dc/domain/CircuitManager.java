package com.example.dc.domain;

import com.example.dc.utils.Config;

import java.util.concurrent.ThreadLocalRandom;

public enum CircuitManager {
    INSTANCE;

    public Circuit fromSpec(CircuitSpec spec) {
        return new Circuit(spec.a(), spec.b());
    }

    public CircuitSpec generateScenario(ScenarioType type) {
        return generateScenario(type.code());
    }

    public CircuitSpec generateScenario(String name) {
        int size = Config.scenarioSize(name);
        if (size <= 0) {
            throw new IllegalArgumentException("Escenario desconocido: " + name);
        }
        double[][] a = generateWellConditionedMatrix(size);
        double[] b = generateVector(size);
        return new CircuitSpec(a, b, name + "-" + System.currentTimeMillis());
    }

    public CircuitSpec custom(String name, double[][] a, double[] b) {
        validateDimensions(a, b);
        return new CircuitSpec(a, b, name);
    }

    public CircuitSpec custom(String name, CircuitPhysicalModel model) {
        double[][] a = model.buildMatrix();
        double[] b = model.buildVector();
        return new CircuitSpec(a, b, name);
    }

    public CircuitSpec custom(CircuitPhysicalModel model) {
        return custom(model.name() + "-" + System.currentTimeMillis(), model);
    }

    private void validateDimensions(double[][] a, double[] b) {
        if (a == null || b == null) {
            throw new IllegalArgumentException("Matriz y vector no pueden ser nulos");
        }
        if (a.length == 0 || a.length != b.length) {
            throw new IllegalArgumentException("Dimensiones inconsistentes entre A y b");
        }
        for (double[] row : a) {
            if (row.length != a.length) {
                throw new IllegalArgumentException("La matriz A debe ser cuadrada");
            }
        }
    }

    private double[][] generateWellConditionedMatrix(int n) {
        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        double[][] m = new double[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                m[i][j] = rnd.nextDouble(-5.0, 5.0);
            }
        }
        double[][] a = new double[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                double sum = 0.0;
                for (int k = 0; k < n; k++) {
                    sum += m[k][i] * m[k][j];
                }
                if (i == j) {
                    sum += 0.5;
                }
                a[i][j] = sum;
            }
        }
        return a;
    }

    private double[] generateVector(int n) {
        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        double[] b = new double[n];
        for (int i = 0; i < n; i++) {
            b[i] = rnd.nextDouble(-10.0, 10.0);
        }
        return b;
    }
}
