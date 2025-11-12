package com.example.dc;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ApiTests {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void solveEndpointReturnsThreeResultsForEachScheduler() throws Exception {
        for (String scheduler : List.of("fcfs", "sjf", "rr")) {
            mockMvc.perform(post("/solve")
                            .param("sched", scheduler)
                            .param("scenario", "simple"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.ok").value(true))
                    .andExpect(jsonPath("$.results", Matchers.hasSize(3)))
                    .andExpect(jsonPath("$.results[0].residual").isNumber())
                    .andExpect(jsonPath("$.results[0].waitingMs").isNumber())
                    .andExpect(jsonPath("$.results[0].turnaroundMs").isNumber())
                .andExpect(jsonPath("$.results[0].equations").isArray())
                    .andExpect(jsonPath("$.results[0].scenario").isString());
        }
    }

    @Test
    void solveCustomAcceptsMatrix() throws Exception {
        Map<String, Object> payload = Map.of(
                "sched", "fcfs",
                "name", "test-custom",
                "a", new double[][]{
                        {3, 2, -1},
                        {2, -2, 4},
                        {-1, 0.5, -1}
                },
                "b", new double[]{1, -2, 0}
        );

        mockMvc.perform(post("/solve_custom")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.results", Matchers.hasSize(3)))
                .andExpect(jsonPath("$.results[0].x").isArray())
                .andExpect(jsonPath("$.results[0].residual").isNumber())
                .andExpect(jsonPath("$.results[0].waitingMs").isNumber())
                .andExpect(jsonPath("$.results[0].turnaroundMs").isNumber())
                .andExpect(jsonPath("$.results[0].equations").isArray())
                .andExpect(jsonPath("$.results[0].scenario").isString());
    }

    @Test
    void solvePhysicalSeries() throws Exception {
        Map<String, Object> payload = Map.of(
                "sched", "fcfs",
                "topology", "serie",
                "voltage", 12.0,
                "resistances", new double[]{4.0, 2.0, 1.0},
                "name", "serie-test"
        );

        mockMvc.perform(post("/solve_physical")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true))
                .andExpect(jsonPath("$.results", Matchers.hasSize(3)))
                .andExpect(jsonPath("$.results[0].x").isArray())
                .andExpect(jsonPath("$.results[0].equations").isArray())
                .andExpect(jsonPath("$.results[0].scenario").isString());
    }
}
