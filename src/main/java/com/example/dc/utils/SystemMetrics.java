package com.example.dc.utils;

import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

public final class SystemMetrics {

    private SystemMetrics() {}

    private static final Path PROC_STATUS = Path.of("/proc/self/status");
    private static final Path PROC_IO = Path.of("/proc/self/io");

    private static final AtomicLong LAST_VOLUNTARY = new AtomicLong(-1);
    private static final AtomicLong LAST_INVOLUNTARY = new AtomicLong(-1);
    private static final AtomicLong LAST_READ_BYTES = new AtomicLong(-1);
    private static final AtomicLong LAST_WRITE_BYTES = new AtomicLong(-1);

    public static Metrics snapshot() {
        double cpu = readCpuPercent();
        double memory = readMemoryMb();
        double voluntary = readVoluntaryCtxtSwitches();
        double involuntary = readInvoluntaryCtxtSwitches();
        double readBytes = readIoMetric("read_bytes", LAST_READ_BYTES);
        double writeBytes = readIoMetric("write_bytes", LAST_WRITE_BYTES);
        return new Metrics(cpu, memory, voluntary, involuntary, readBytes, writeBytes);
    }

    private static double readCpuPercent() {
        try {
            var osBean = ManagementFactory.getOperatingSystemMXBean();
            if (osBean instanceof com.sun.management.OperatingSystemMXBean extended) {
                double load = extended.getSystemCpuLoad();
                if (load >= 0.0) {
                    return load * 100.0;
                }
            }
        } catch (Exception ignored) {
        }
        return Double.NaN;
    }

    private static double readMemoryMb() {
        Runtime runtime = Runtime.getRuntime();
        long used = runtime.totalMemory() - runtime.freeMemory();
        return used / (1024.0 * 1024.0);
    }

    private static double readVoluntaryCtxtSwitches() {
        return readStatusDelta("voluntary_ctxt_switches", LAST_VOLUNTARY);
    }

    private static double readInvoluntaryCtxtSwitches() {
        return readStatusDelta("nonvoluntary_ctxt_switches", LAST_INVOLUNTARY);
    }

    private static double readStatusDelta(String key, AtomicLong previous) {
        long current = readValueFromStatus(key);
        if (current < 0) {
            return Double.NaN;
        }
        long prev = previous.getAndSet(current);
        if (prev < 0) {
            return 0.0;
        }
        long delta = current - prev;
        if (delta < 0) {
            // likely counter reset
            previous.set(current);
            return Double.NaN;
        }
        return (double) delta;
    }

    private static long readValueFromStatus(String key) {
        if (!Files.isReadable(PROC_STATUS)) {
            return -1;
        }
        try {
            List<String> lines = Files.readAllLines(PROC_STATUS);
            String prefix = key + ":";
            for (String line : lines) {
                if (line.startsWith(prefix)) {
                    String[] parts = line.split(":");
                    if (parts.length >= 2) {
                        String number = parts[1].trim().split("\\s+")[0];
                        return Long.parseLong(number);
                    }
                }
            }
        } catch (IOException | NumberFormatException ignored) {
        }
        return -1;
    }

    private static double readIoMetric(String key, AtomicLong previous) {
        long current = readValueFromIo(key);
        if (current < 0) {
            return Double.NaN;
        }
        long prev = previous.getAndSet(current);
        if (prev < 0) {
            return 0.0;
        }
        long delta = current - prev;
        if (delta < 0) {
            previous.set(current);
            return Double.NaN;
        }
        return (double) delta;
    }

    private static long readValueFromIo(String key) {
        if (!Files.isReadable(PROC_IO)) {
            return -1;
        }
        try {
            List<String> lines = Files.readAllLines(PROC_IO);
            String prefix = key + ":";
            for (String line : lines) {
                if (line.startsWith(prefix)) {
                    String number = line.substring(prefix.length()).trim();
                    return Long.parseLong(number);
                }
            }
        } catch (IOException | NumberFormatException ignored) {
        }
        return -1;
    }

    public record Metrics(double cpuPercent,
                          double usedMemoryMb,
                          double contextSwitchesVoluntary,
                          double contextSwitchesInvoluntary,
                          double ioReadBytes,
                          double ioWriteBytes) {}
}
