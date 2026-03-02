package com.schooldashboard.display.service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class RequestRateLimiter {

	private final Map<String, Deque<Instant>> buckets = new ConcurrentHashMap<>();

	public boolean tryAcquire(String bucketName, String key, int maxRequests, Duration window) {
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
}
