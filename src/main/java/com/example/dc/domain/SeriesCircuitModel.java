package com.example.dc.domain;

import com.example.dc.domain.components.Resistor;
import com.example.dc.domain.components.VoltageSource;

import java.util.List;

public class SeriesCircuitModel implements CircuitPhysicalModel {

    private final String name;
    private final List<Resistor> resistors;
    private final VoltageSource source;

    public SeriesCircuitModel(String name, List<Resistor> resistors, VoltageSource source) {
        if (resistors == null || resistors.isEmpty()) {
            throw new IllegalArgumentException("Debe haber al menos una resistencia en serie");
        }
        this.name = name;
        this.resistors = List.copyOf(resistors);
        this.source = source;
    }

    @Override
    public double[][] buildMatrix() {
        double total = resistors.stream().mapToDouble(Resistor::resistanceOhm).sum();
        return new double[][]{{total}};
    }

    @Override
    public double[] buildVector() {
        return new double[]{source.voltageVolt()};
    }

    @Override
    public String name() {
        return name != null ? name : "serie";
    }
}
