package com.example.dc.domain;

public record PhysicalSolveRequest(
        String sched,
        String topology,
        double voltage,
        double[] resistances,
        String name,
        String scenario
) {}
