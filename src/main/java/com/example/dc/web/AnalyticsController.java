package com.example.dc.web;

import com.example.dc.utils.Config;
import com.example.dc.utils.LogAnalyticsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsController.class);

    private final LogAnalyticsService analyticsService;

    public AnalyticsController(LogAnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/logs/jobs")
    public ResponseEntity<?> jobsLog() {
        Path path = Config.JOB_LOG_PATH;
        try {
            Files.createDirectories(path.getParent());
            log.debug("/api/logs/jobs path={} exists={} size={} bytes",
                    path.toAbsolutePath(), Files.exists(path), Files.exists(path) ? Files.size(path) : 0);
            if (!Files.exists(path) || Files.size(path) == 0) {
                log.info("jobs_log.csv no disponible o vacío en {}", path.toAbsolutePath());
                return ResponseEntity.noContent().build();
            }
            Resource resource = new FileSystemResource(path);
            if (!resource.exists() || resource.contentLength() == 0) {
                log.info("jobs_log.csv vacío tras cargar recurso: {}", path.toAbsolutePath());
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=jobs_log.csv")
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(resource);
        } catch (Exception ex) {
            log.error("Error al leer jobs_log.csv", ex);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "ok", false,
                            "error", "jobs_log_unavailable",
                            "detail", ex.getMessage()
                    ));
        }
    }

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> metrics() {
        Map<String, Object> aggregates = analyticsService.aggregateMetrics();
        if (aggregates.isEmpty()) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(aggregates);
    }
}
