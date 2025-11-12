package com.example.dc.domain.components;

import java.util.List;

public record Branch(String id, List<Resistor> resistors) {
    public double totalResistance() {
        return resistors.stream().mapToDouble(Resistor::resistanceOhm).sum();
    }
}

