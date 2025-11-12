package com.example.dc.patterns.observer;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

@Component
public class EventBus {

    private final Map<String, CopyOnWriteArrayList<Consumer<Object>>> subscribers = new ConcurrentHashMap<>();

    public AutoCloseable subscribe(String topic, Consumer<Object> consumer) {
        Objects.requireNonNull(topic, "El tópico no puede ser nulo");
        Objects.requireNonNull(consumer, "El consumidor no puede ser nulo");
        subscribers.computeIfAbsent(topic, k -> new CopyOnWriteArrayList<>()).add(consumer);
        return () -> subscribers.getOrDefault(topic, new CopyOnWriteArrayList<>()).remove(consumer);
    }

    public void publish(String topic, Object payload) {
        CopyOnWriteArrayList<Consumer<Object>> consumers = subscribers.get(topic);
        if (consumers == null) {
            return;
        }
        for (Consumer<Object> consumer : consumers) {
            try {
                consumer.accept(payload);
            } catch (Exception ignored) {
            }
        }
    }
}
