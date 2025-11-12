package com.example.dc.utils;

import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;

@Component
public class LogAnalyticsService {

    public Map<String, Object> aggregateMetrics() {
        Path path = Config.JOB_LOG_PATH;
        if (!Files.exists(path)) {
            return Map.of();
        }
        try (Stream<String> lines = Files.lines(path)) {
            return parseLines(lines);
        } catch (IOException e) {
            return Map.of();
        }
    }

    private Map<String, Object> parseLines(Stream<String> lines) {
        var iterator = lines.iterator();
        if (!iterator.hasNext()) {
            return Map.of();
        }
        // saltar cabecera
        iterator.next();

        Aggregate total = new Aggregate();
        Map<String, Aggregate> byMethod = new HashMap<>();
        Map<String, Aggregate> byScenario = new HashMap<>();
        Map<String, Aggregate> byScheduler = new HashMap<>();

        while (iterator.hasNext()) {
            String line = iterator.next().trim();
            if (line.isEmpty()) {
                continue;
            }
            String[] parts = line.split(",");
            if (parts.length < 15) {
                continue;
            }
            String method;
            String scheduler;
            String scenario;
            double elapsed;
            double waiting;
            double turnaround;
            double cpu;
            double mem;
            double ctxVol;
            double ctxInvol;
            double ioRead;
            double ioWrite;
            double residual;
            method = parts[2];
            scheduler = parts[3];
            scenario = parts[4];
            elapsed = parseDouble(parts[5]);
            waiting = parseDouble(parts[6]);
            turnaround = parseDouble(parts[7]);
            cpu = parseDouble(parts[8]);
            mem = parseDouble(parts[9]);
            ctxVol = parseDouble(parts[10]);
            ctxInvol = parseDouble(parts[11]);
            ioRead = parseDouble(parts[12]);
            ioWrite = parseDouble(parts[13]);
            residual = parseDouble(parts[14]);

            if (Double.isNaN(elapsed) || Double.isNaN(cpu) || Double.isNaN(mem)) {
                continue;
            }
            total.add(elapsed, waiting, turnaround, cpu, mem, ctxVol, ctxInvol, ioRead, ioWrite, residual);
            byMethod.computeIfAbsent(method, k -> new Aggregate()).add(elapsed, waiting, turnaround, cpu, mem, ctxVol, ctxInvol, ioRead, ioWrite, residual);
            byScenario.computeIfAbsent(normalizeScenario(scenario), k -> new Aggregate()).add(elapsed, waiting, turnaround, cpu, mem, ctxVol, ctxInvol, ioRead, ioWrite, residual);
            byScheduler.computeIfAbsent(scheduler.toLowerCase(Locale.ROOT), k -> new Aggregate()).add(elapsed, waiting, turnaround, cpu, mem, ctxVol, ctxInvol, ioRead, ioWrite, residual);
        }

        if (total.getCount() == 0) {
            return Map.of();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("totalJobs", total.getCount());
        response.put("avgElapsedMs", total.avgElapsed());
        response.put("avgWaitingMs", total.avgWaiting());
        response.put("avgTurnaroundMs", total.avgTurnaround());
        response.put("avgCpuPct", total.avgCpu());
        response.put("avgMemMb", total.avgMem());
        response.put("avgCtxVoluntary", total.avgCtxVoluntary());
        response.put("avgCtxInvoluntary", total.avgCtxInvoluntary());
        response.put("avgIoReadBytes", total.avgIoRead());
        response.put("avgIoWriteBytes", total.avgIoWrite());
        response.put("avgResidual", total.avgResidual());
        response.put("totalElapsedMs", total.totalElapsed());
        response.put("throughputPerMinute", total.throughputPerMinute());
        response.put("byMethod", convertAggregates(byMethod));
        response.put("byScenario", convertAggregates(byScenario));
        response.put("byScheduler", convertAggregates(byScheduler));
        return response;
    }

    private Map<String, Map<String, Object>> convertAggregates(Map<String, Aggregate> aggregates) {
        Map<String, Map<String, Object>> result = new HashMap<>();
        aggregates.forEach((key, aggregate) -> {
            Map<String, Object> map = new HashMap<>();
            map.put("count", aggregate.getCount());
            map.put("avgElapsedMs", aggregate.avgElapsed());
            map.put("avgWaitingMs", aggregate.avgWaiting());
            map.put("avgTurnaroundMs", aggregate.avgTurnaround());
            map.put("avgCpuPct", aggregate.avgCpu());
            map.put("avgMemMb", aggregate.avgMem());
            map.put("avgCtxVoluntary", aggregate.avgCtxVoluntary());
            map.put("avgCtxInvoluntary", aggregate.avgCtxInvoluntary());
            map.put("avgIoReadBytes", aggregate.avgIoRead());
            map.put("avgIoWriteBytes", aggregate.avgIoWrite());
            map.put("avgResidual", aggregate.avgResidual());
            map.put("totalElapsedMs", aggregate.totalElapsed());
            map.put("throughputPerMinute", aggregate.throughputPerMinute());
            result.put(key, map);
        });
        return result;
    }

    public void clearLog() throws IOException {
        Path path = Config.JOB_LOG_PATH;
        Files.createDirectories(path.getParent());
        Files.deleteIfExists(path);
    }

    private String normalizeScenario(String scenario) {
        if (scenario == null || scenario.isBlank() || "unknown".equalsIgnoreCase(scenario)) {
            return "unknown";
        }
        String normalized = scenario.toLowerCase(Locale.ROOT);
        int idx = normalized.indexOf('-');
        if (idx > 0) {
            return normalized.substring(0, idx);
        }
        return normalized;
    }

    private double parseDouble(String value) {
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException ex) {
            return Double.NaN;
        }
    }

    private static class Aggregate {
        private long count;
        private double elapsedSum;
        private double waitingSum;
        private double turnaroundSum;
        private double cpuSum;
        private double memSum;
        private double ctxVolSum;
        private double ctxInvolSum;
        private double ioReadSum;
        private double ioWriteSum;
        private double residualSum;
        private long residualCount;

        void add(double elapsed, double waiting, double turnaround, double cpu, double mem,
                 double ctxVol, double ctxInvol, double ioRead, double ioWrite, double residual) {
            count++;
            elapsedSum += elapsed;
            waitingSum += Double.isNaN(waiting) ? 0 : waiting;
            turnaroundSum += Double.isNaN(turnaround) ? 0 : turnaround;
            cpuSum += cpu;
            memSum += mem;
            ctxVolSum += Double.isNaN(ctxVol) ? 0 : ctxVol;
            ctxInvolSum += Double.isNaN(ctxInvol) ? 0 : ctxInvol;
            ioReadSum += Double.isNaN(ioRead) ? 0 : ioRead;
            ioWriteSum += Double.isNaN(ioWrite) ? 0 : ioWrite;
            if (!Double.isNaN(residual)) {
                residualSum += residual;
                residualCount++;
            }
        }

        long getCount() {
            return count;
        }

        double avgElapsed() {
            return count == 0 ? Double.NaN : elapsedSum / count;
        }

        double avgWaiting() {
            return count == 0 ? Double.NaN : waitingSum / count;
        }

        double avgTurnaround() {
            return count == 0 ? Double.NaN : turnaroundSum / count;
        }

        double avgCpu() {
            return count == 0 ? Double.NaN : cpuSum / count;
        }

        double avgMem() {
            return count == 0 ? Double.NaN : memSum / count;
        }

        double avgCtxVoluntary() {
            return count == 0 ? Double.NaN : ctxVolSum / count;
        }

        double avgCtxInvoluntary() {
            return count == 0 ? Double.NaN : ctxInvolSum / count;
        }

        double avgIoRead() {
            return count == 0 ? Double.NaN : ioReadSum / count;
        }

        double avgIoWrite() {
            return count == 0 ? Double.NaN : ioWriteSum / count;
        }

        double avgResidual() {
            return residualCount == 0 ? Double.NaN : residualSum / residualCount;
        }

        double totalElapsed() {
            return elapsedSum;
        }

        double throughputPerMinute() {
            if (elapsedSum <= 0) {
                return Double.NaN;
            }
            return (count * 60_000.0) / elapsedSum;
        }
    }
}
