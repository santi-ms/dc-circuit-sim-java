package com.example.dc.domain;

import java.util.Locale;

public enum SchedulerType {
    FCFS("fcfs"),
    RR("rr"),
    SJF("sjf");

    private final String code;

    SchedulerType(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }

    public static SchedulerType from(String value) {
        if (value == null) {
            throw new IllegalArgumentException("sched requerido");
        }
        return switch (value.trim().toLowerCase(Locale.ROOT)) {
            case "fcfs" -> FCFS;
            case "rr" -> RR;
            case "sjf" -> SJF;
            default -> throw new IllegalArgumentException("sched inválido: " + value);
        };
    }
}
