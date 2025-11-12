package com.example.dc.utils;

import com.example.dc.schedulers.Result;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Instant;

@Component
public class MetricsLogger {

    public synchronized void log(Result result, String scheduler, String scenario, double residual) {
        Path path = Config.JOB_LOG_PATH;
        try {
            Files.createDirectories(path.getParent());
            boolean writeHeader = Files.notExists(path) || Files.size(path) == 0;
            try (var writer = Files.newBufferedWriter(path, StandardOpenOption.CREATE, StandardOpenOption.APPEND)) {
                if (writeHeader) {
                    writer.write("ts,job_id,method,scheduler,scenario,elapsed_ms,waiting_ms,turnaround_ms,cpu_pct,mem_mb,ctx_voluntary,ctx_involuntary,io_read_bytes,io_write_bytes,residual\n");
                }
                SystemMetrics.Metrics metrics = SystemMetrics.snapshot();
                writer.write(String.format(
                        "%s,%s,%s,%s,%s,%.3f,%.3f,%.3f,%.3f,%.3f,%.3f,%.3f,%.3f,%.3f,%.6e%n",
                        Instant.now(),
                        result.getJobId(),
                        result.getMethodName(),
                        sanitizeScheduler(scheduler),
                        sanitizeScenario(scenario),
                        result.getElapsedMs(),
                        result.getWaitingMs(),
                        result.getTurnaroundMs(),
                        metrics.cpuPercent(),
                        metrics.usedMemoryMb(),
                        metrics.contextSwitchesVoluntary(),
                        metrics.contextSwitchesInvoluntary(),
                        metrics.ioReadBytes(),
                        metrics.ioWriteBytes(),
                        residual
                ));
            }
        } catch (IOException ex) {
            // ignoramos para no fallar la ejecución principal
        }
    }

    private String sanitizeScheduler(String scheduler) {
        if (scheduler == null || scheduler.isBlank()) {
            return "unknown";
        }
        return scheduler.replaceAll("[\\r\\n]", "").trim();
    }

    private String sanitizeScenario(String scenario) {
        if (scenario == null || scenario.isBlank()) {
            return "unknown";
        }
        return scenario.replaceAll("[\\r\\n]", "").trim();
    }
}
