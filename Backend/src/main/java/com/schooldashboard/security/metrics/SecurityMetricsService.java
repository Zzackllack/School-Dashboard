package com.schooldashboard.security.metrics;

import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

@Service
public class SecurityMetricsService {

	private final MeterRegistry meterRegistry;

	public SecurityMetricsService(ObjectProvider<MeterRegistry> meterRegistryProvider) {
		this.meterRegistry = meterRegistryProvider.getIfAvailable();
	}

	public void incrementLoginSuccess() {
		increment("security.auth.login.success");
	}

	public void incrementLoginFailure() {
		increment("security.auth.login.failure");
	}

	public void incrementUnauthenticated() {
		increment("security.http.unauthenticated");
	}

	public void incrementAccessDenied() {
		increment("security.http.access_denied");
	}

	private void increment(String metricName) {
		if (meterRegistry != null) {
			meterRegistry.counter(metricName).increment();
		}
	}
}
