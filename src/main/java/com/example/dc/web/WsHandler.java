package com.example.dc.web;

import com.example.dc.patterns.observer.EventBus;
import com.example.dc.patterns.observer.Topics;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WsHandler extends TextWebSocketHandler {

    private final EventBus eventBus;
    private final ObjectMapper objectMapper;
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
    private final AutoCloseable statusSubscription;
    private final AutoCloseable resultSubscription;

    public WsHandler(EventBus eventBus, ObjectMapper objectMapper) {
        this.eventBus = eventBus;
        this.objectMapper = objectMapper;
        this.statusSubscription = eventBus.subscribe(Topics.STATUS, payload -> sendToSessions(payload));
        this.resultSubscription = eventBus.subscribe(Topics.RESULT, payload -> sendToSessions(payload));
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        sessions.remove(session);
    }

    @PreDestroy
    public void shutdown() {
        try {
            statusSubscription.close();
        } catch (Exception ignored) {
        }
        try {
            resultSubscription.close();
        } catch (Exception ignored) {
        }
    }

    private void sendToSessions(Object payload) {
        String json = toJson(payload);
        if (json == null) {
            return;
        }
        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(json));
                } catch (IOException ignored) {
                }
            }
        }
    }

    private String toJson(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
