package com.example.dc.web;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    private final List<String> allowedOrigins;

    public CorsConfig(@Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}") String origins) {
        this.allowedOrigins = parseOrigins(origins);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        allowedOrigins.forEach(configuration::addAllowedOrigin);
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");
        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public CorsFilter corsFilter(@Qualifier("corsConfigurationSource") CorsConfigurationSource source) {
        return new CorsFilter(source);
    }

    private static List<String> parseOrigins(String origins) {
        return Arrays.stream(origins.split(","))
                .map(String::trim)
                .filter(o -> !o.isEmpty())
                .collect(Collectors.toList());
    }
}
