package com.example.dc.domain;

import com.example.dc.domain.components.Resistor;
import com.example.dc.domain.components.VoltageSource;

import java.util.List;

public class ParallelCircuitModel implements CircuitPhysicalModel {

    private final String name;
    private final List<Resistor> resistors;
    private final VoltageSource source;

    public ParallelCircuitModel(String name, List<Resistor> resistors, VoltageSource source) {
        if (resistors == null || resistors.isEmpty()) {
            throw new IllegalArgumentException("Debe haber al menos una resistencia en paralelo");
        }
        this.name = name;
        this.resistors = List.copyOf(resistors);
        this.source = source;
    }

    @Override
    public double[][] buildMatrix() {
        int n = resistors.size();
        double[][] matrix = new double[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                matrix[i][j] = (i == j) ? resistors.get(i).resistanceOhm() : 0.0;
            }
        }
        return matrix;
    }

    @Override
    public double[] buildVector() {
        double[] vector = new double[resistors.size()];
        for (int i = 0; i < vector.length; i++) {
            vector[i] = source.voltageVolt();
        }
        return vector;
    }

    @Override
    public String name() {
        return name != null ? name : "paralelo";
    }
}
