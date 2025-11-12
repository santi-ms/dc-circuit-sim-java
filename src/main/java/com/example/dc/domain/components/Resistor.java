package com.example.dc.domain.components;

public record Resistor(String id, double resistanceOhm) implements Component {
    public Resistor {
        if (resistanceOhm <= 0) {
            throw new IllegalArgumentException("resistencia debe ser positiva" );
        }
    }
}

