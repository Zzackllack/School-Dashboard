package com.schooldashboard.display.service;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class RequestRateLimiterTest {

	private RequestRateLimiter limiter;

	@BeforeEach
	public void setUp() {
		limiter = new RequestRateLimiter();
	}

	@AfterEach
	public void tearDown() {
		limiter.shutdown();
	}

	@Test
	public void rejectsInvalidInputs() {
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
		assertTrue(limiter.tryAcquire("bucket", "key", 2, Duration.ofSeconds(5)));
		assertTrue(limiter.tryAcquire("bucket", "key", 2, Duration.ofSeconds(5)));
		assertFalse(limiter.tryAcquire("bucket", "key", 2, Duration.ofSeconds(5)));
	}
}
