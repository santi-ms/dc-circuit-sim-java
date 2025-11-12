package com.example.dc.domain;

public interface CircuitPhysicalModel {
    double[][] buildMatrix();
    double[] buildVector();
    String name();
}

