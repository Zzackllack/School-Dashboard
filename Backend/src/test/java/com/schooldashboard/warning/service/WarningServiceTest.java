package com.schooldashboard.warning.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.service.ApiResponseCacheService;
import com.schooldashboard.warning.config.WarningProperties;
import com.schooldashboard.warning.model.WarningNotice;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WarningServiceTest {

	@Mock
	private WarningSourceClient sourceClient;

	@Mock
	private ApiResponseCacheService cacheService;

	private WarningService service;
	private WarningProperties properties;

	@BeforeEach
	void setUp() {
		properties = new WarningProperties();
		properties.setEnabled(true);
		properties.setRegionCode("110000000000");
		service = new WarningService(properties, sourceClient, cacheService, new ObjectMapper());
	}

	@Test
	void refreshesWarningOnlyOnceForAnUnchangedSourceHash() {
		WarningSourceClient.SourceWarning summary = summary("alert-1", "hash-1", "Alert");
		WarningNotice notice = notice("alert-1", "Starke Rauchentwicklung", "Severe", null);
		when(sourceClient.fetchSummaries(any())).thenReturn(
				new WarningSourceClient.SourceFetch(false, List.of(summary),
						new WarningSourceClient.SourceCursor("etag", 1L)),
				new WarningSourceClient.SourceFetch(false, List.of(summary),
						new WarningSourceClient.SourceCursor("etag", 1L)));
		when(sourceClient.fetchDetails(summary)).thenReturn(notice);

		service.poll();
		service.poll();

		assertEquals(1, service.getCurrentSnapshot().warnings().size());
		verify(sourceClient).fetchDetails(summary);
		verify(cacheService, org.mockito.Mockito.times(2)).store(any(), any());
	}

	@Test
	void cancellationRemovesPreviousWarning() {
		WarningSourceClient.SourceWarning alert = summary("alert-1-000", "hash-1", "Alert");
		WarningSourceClient.SourceWarning cancel = summary("alert-1-001", "hash-2", "Cancel");
		when(sourceClient.fetchSummaries(any())).thenReturn(
				new WarningSourceClient.SourceFetch(false, List.of(alert),
						new WarningSourceClient.SourceCursor(null, 0L)),
				new WarningSourceClient.SourceFetch(false, List.of(cancel),
						new WarningSourceClient.SourceCursor(null, 0L)));
		when(sourceClient.fetchDetails(alert)).thenReturn(notice("alert-1-000", "Warnung", "Severe", null));

		service.poll();
		assertEquals(1, service.getCurrentSnapshot().warnings().size());
		service.poll();
		assertEquals(0, service.getCurrentSnapshot().warnings().size());
		verify(sourceClient, never()).fetchDetails(cancel);
	}

	@Test
	void cancellationBeyondWarningLimitStillSuppressesAlert() {
		properties.setMaxWarnings(1);
		WarningSourceClient.SourceWarning alert = summary("alert-1-000", "hash-1", "Alert");
		WarningSourceClient.SourceWarning cancel = summary("alert-1-001", "hash-2", "Cancel");
		when(sourceClient.fetchSummaries(any())).thenReturn(new WarningSourceClient.SourceFetch(false,
				List.of(alert, cancel), new WarningSourceClient.SourceCursor(null, 0L)));

		service.poll();

		assertEquals(0, service.getCurrentSnapshot().warnings().size());
		verify(sourceClient, never()).fetchDetails(alert);
	}

	@Test
	void retainsLastKnownWarningWhenSourceFails() {
		WarningSourceClient.SourceWarning summary = summary("alert-1", "hash-1", "Alert");
		when(sourceClient.fetchSummaries(any())).thenReturn(new WarningSourceClient.SourceFetch(false, List.of(summary),
				new WarningSourceClient.SourceCursor(null, 0L)));
		when(sourceClient.fetchDetails(summary)).thenReturn(notice("alert-1", "Warnung", "Severe", null));
		service.poll();

		when(sourceClient.fetchSummaries(any())).thenThrow(new IllegalStateException("source down"));
		service.poll();

		assertEquals(1, service.getCurrentSnapshot().warnings().size());
		org.junit.jupiter.api.Assertions.assertEquals(false, service.getCurrentSnapshot().sourceAvailable());
	}

	private WarningSourceClient.SourceWarning summary(String id, String hash, String messageType) {
		return new WarningSourceClient.SourceWarning(id, hash, messageType, "Warnung", "MOWAS", "Severe", "Immediate",
				"Observed", "Brand", "Berlin", Instant.now(), null, false);
	}

	private WarningNotice notice(String id, String headline, String severity, Instant expiresAt) {
		return new WarningNotice(id, "Alert", headline, "Beschreibung", "Anweisung", "MOWAS", severity, "Immediate",
				"Observed", "Brand", List.of("Berlin"), Instant.now(), expiresAt, "https://warnung.bund.de/meldungen",
				false);
	}
}
