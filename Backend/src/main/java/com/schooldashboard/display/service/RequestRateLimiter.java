package com.schooldashboard.display.service;

import jakarta.annotation.PreDestroy;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.springframework.stereotype.Service;

@Service
public class RequestRateLimiter {

	private static final Duration CLEANUP_INTERVAL = Duration.ofMinutes(5);
	private static final Duration INACTIVITY_WINDOW = Duration.ofHours(1);

	private final Map<String, Deque<Instant>> buckets = new ConcurrentHashMap<>();
	private final ScheduledExecutorService cleanupExecutor = Executors.newSingleThreadScheduledExecutor(runnable -> {
		Thread thread = new Thread(runnable, "request-rate-limiter-cleaner");
		thread.setDaemon(true);
		return thread;
	});

	public RequestRateLimiter() {
		cleanupExecutor.scheduleAtFixedRate(this::cleanupInactiveBuckets, CLEANUP_INTERVAL.toSeconds(),
				CLEANUP_INTERVAL.toSeconds(), TimeUnit.SECONDS);
	}

	public boolean tryAcquire(String bucketName, String key, int maxRequests, Duration window) {
		if (bucketName == null || bucketName.isBlank()) {
			throw new IllegalArgumentException("bucketName must be non-empty");
		}
		if (key == null || key.isBlank()) {
			throw new IllegalArgumentException("key must be non-empty");
		}
		if (maxRequests <= 0) {
			throw new IllegalArgumentException("maxRequests must be > 0");
		}
		if (window == null || window.isZero() || window.isNegative()) {
			throw new IllegalArgumentException("window must be non-null and positive");
		}

		String bucketKey = bucketName + ":" + key;
		Instant now = Instant.now();
		Instant threshold = now.minus(window);

		Deque<Instant> bucket = buckets.computeIfAbsent(bucketKey, unused -> new ArrayDeque<>());
		synchronized (bucket) {
			while (!bucket.isEmpty() && bucket.peekFirst().isBefore(threshold)) {
				bucket.removeFirst();
			}
			if (bucket.size() >= maxRequests) {
				return false;
			}
			bucket.addLast(now);
		}
		return true;
	}

	@PreDestroy
	void shutdown() {
		cleanupExecutor.shutdownNow();
	}

	private void cleanupInactiveBuckets() {
		Instant now = Instant.now();
		Instant threshold = now.minus(INACTIVITY_WINDOW);
		for (Map.Entry<String, Deque<Instant>> entry : buckets.entrySet()) {
			Deque<Instant> bucket = entry.getValue();
			synchronized (bucket) {
				while (!bucket.isEmpty() && bucket.peekFirst().isBefore(threshold)) {
					bucket.removeFirst();
				}
				Instant newest = bucket.peekLast();
				if (bucket.isEmpty() || (newest != null && newest.isBefore(threshold))) {
					buckets.remove(entry.getKey(), bucket);
				}
			}
		}
	}
}
