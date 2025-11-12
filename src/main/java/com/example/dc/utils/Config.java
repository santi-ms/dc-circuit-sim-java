package com.example.dc.utils;

import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;

public final class Config {

    private Config() {}

    public static final long QUANTUM_MS = 10L;

    private static final Map<String, Integer> SCENARIO_SIZES = Map.of(
            "simple", 3,
            "medio", 20,
            "complejo", 80
    );

    public static final Path JOB_LOG_PATH = Path.of("data", "jobs_log.csv");

    private static final int PARALLELISM = computeParallelism();

    public static int scenarioSize(String name) {
        if (name == null) {
            return -1;
        }
        return SCENARIO_SIZES.getOrDefault(name.toLowerCase(Locale.ROOT), -1);
    }

    public static int parallelism() {
        return PARALLELISM;
    }

    private static int computeParallelism() {
        int available = Runtime.getRuntime().availableProcessors();
        int baseline = Math.max(1, available - 1);
        String override = System.getenv("DC_PARALLELISM");
        if (override != null && !override.isBlank()) {
            try {
                int value = Integer.parseInt(override.trim());
                if (value > 0) {
                    return Math.min(value, available);
                }
            } catch (NumberFormatException ignored) {
            }
        }
        return baseline;
    }
}
