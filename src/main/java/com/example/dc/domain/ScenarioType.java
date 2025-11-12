package com.example.dc.domain;

import java.util.Locale;

public enum ScenarioType {
    SIMPLE("simple"),
    MEDIO("medio"),
    COMPLEJO("complejo");

    private final String code;

    ScenarioType(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }

    public static ScenarioType from(String value) {
        if (value == null) {
            throw new IllegalArgumentException("scenario requerido");
        }
        return switch (value.trim().toLowerCase(Locale.ROOT)) {
            case "simple" -> SIMPLE;
            case "medio" -> MEDIO;
            case "complejo" -> COMPLEJO;
            default -> throw new IllegalArgumentException("scenario inválido: " + value);
        };
    }
}

