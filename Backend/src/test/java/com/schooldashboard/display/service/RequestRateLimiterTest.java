package com.schooldashboard.display.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import org.junit.jupiter.api.Test;

public class RequestRateLimiterTest {

	@Test
	public void rejectsInvalidInputs() {
		RequestRateLimiter limiter = new RequestRateLimiter();

		assertThrows(IllegalArgumentException.class, () -> limiter.tryAcquire(null, "key", 1, Duration.ofSeconds(1)));
		assertThrows(IllegalArgumentException.class, () -> limiter.tryAcquire("", "key", 1, Duration.ofSeconds(1)));
		assertThrows(IllegalArgumentException.class, () -> limiter.tryAcquire("bucket", " ", 1, Duration.ofSeconds(1)));
		assertThrows(IllegalArgumentException.class,
				() -> limiter.tryAcquire("bucket", "key", 0, Duration.ofSeconds(1)));
		assertThrows(IllegalArgumentException.class, () -> limiter.tryAcquire("bucket", "key", 1, null));
		assertThrows(IllegalArgumentException.class, () -> limiter.tryAcquire("bucket", "key", 1, Duration.ZERO));
	}

	@Test
	public void acquiresWithinLimit() {
		RequestRateLimiter limiter = new RequestRateLimiter();
		assertTrue(limiter.tryAcquire("bucket", "key", 2, Duration.ofSeconds(5)));
		assertTrue(limiter.tryAcquire("bucket", "key", 2, Duration.ofSeconds(5)));
	}
}
