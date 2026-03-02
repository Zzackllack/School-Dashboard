package com.schooldashboard.display.service;

import static org.junit.jupiter.api.Assertions.*;

import java.time.Duration;
import org.junit.jupiter.api.Test;

public class RequestRateLimiterTest {

	@Test
	public void tryAcquireAllowsUpToLimitAndThenRejects() {
		RequestRateLimiter limiter = new RequestRateLimiter();
		Duration window = Duration.ofMinutes(1);

		assertTrue(limiter.tryAcquire("bucket", "1.2.3.4", 2, window));
		assertTrue(limiter.tryAcquire("bucket", "1.2.3.4", 2, window));
		assertFalse(limiter.tryAcquire("bucket", "1.2.3.4", 2, window));
	}
}
