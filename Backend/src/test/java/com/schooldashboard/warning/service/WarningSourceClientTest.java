package com.schooldashboard.warning.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.warning.config.WarningProperties;
import com.schooldashboard.warning.model.WarningNotice;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

class WarningSourceClientTest {

	private static final String WARNING_ID = "mow.DE-BE-BE-W001-20260909-000";
	private static final String DETAIL_IDENTIFIER = WARNING_ID + "_20260909021500.json";

	private RestTemplate restTemplate;
	private MockRestServiceServer server;
	private WarningSourceClient client;

	@BeforeEach
	void setUp() {
		restTemplate = new RestTemplate();
		server = MockRestServiceServer.createServer(restTemplate);
		WarningProperties properties = new WarningProperties();
		properties.setEnabled(true);
		properties.setRegionCode("110000000000");
		properties.setApiBaseUrl("http://localhost/api31");
		client = new WarningSourceClient(properties, restTemplate, new ObjectMapper());
	}

	@Test
	void parsesRegionalSummaryAndResolvesOfficialDetail() {
		server.expect(requestTo("http://localhost/api31/dashboard/110000000000.json"))
				.andRespond(withSuccess(summaryJson(), MediaType.APPLICATION_JSON));
		server.expect(requestTo("http://localhost/api31/archive.mowas/" + WARNING_ID + "-mapping.json"))
				.andRespond(withSuccess(mappingJson(), MediaType.APPLICATION_JSON));
		server.expect(requestTo("http://localhost/api31/archive.mowas/" + DETAIL_IDENTIFIER))
				.andRespond(withSuccess(detailJson(), MediaType.APPLICATION_JSON));

		WarningSourceClient.SourceFetch response = client.fetchSummaries(null);
		assertEquals(1, response.warnings().size());
		WarningSourceClient.SourceWarning summary = response.warnings().get(0);
		assertEquals("Alert", summary.messageType());
		assertEquals("Severe", summary.severity());

		WarningNotice notice = client.fetchDetails(summary);
		assertEquals("Starke Rauchentwicklung", notice.headline());
		assertEquals("Bleiben Sie im Gebäude & schließen Sie die Fenster.", notice.description());
		assertEquals("Berlin-Lichterfelde", notice.affectedAreas().get(0));
		assertEquals("Fenster und Türen geschlossen halten & Ruhe bewahren.", notice.instruction());
		assertEquals("https://warnung.bund.de/meldung/" + WARNING_ID + "/Starke_Rauchentwicklung",
				notice.sourceUrl());
		server.verify();
	}

	@Test
	void rejectsMalformedRegionalPayload() {
		server.expect(requestTo("http://localhost/api31/dashboard/110000000000.json"))
				.andRespond(withSuccess("{\"warnings\":[]}", MediaType.APPLICATION_JSON));

		try {
			client.fetchSummaries(null);
			throw new AssertionError("Expected malformed payload to be rejected");
		} catch (IllegalStateException exception) {
			assertTrue(exception.getMessage().contains("non-array"));
		}
		server.verify();
	}

	private String summaryJson() {
		return """
				[
				  {
				    "id": "%s",
				    "payload": {
				      "type": "ALERT",
				      "id": "%s",
				      "hash": "hash-1",
				      "data": {
				        "headline": "Starke Rauchentwicklung",
				        "provider": "MOWAS",
				        "severity": "Severe",
				        "urgency": "Immediate",
				        "msgType": "Alert",
				        "transKeys": {"event": "BBK-EVC-001"}
				      }
				    },
				    "sent": "2026-09-09T02:15:00+02:00"
				  }
				]
				""".formatted(WARNING_ID, WARNING_ID);
	}

	private String mappingJson() {
		return """
				{"history":[{"identifier":"%s","msgType":"Alert","sent":"2026-09-09T02:15:00+02:00"}]}
				""".formatted(DETAIL_IDENTIFIER);
	}

	private String detailJson() {
		return """
				{
				  "identifier": "%s",
				  "sender": "Berliner Feuerwehr",
				  "sent": "2026-09-09T02:15:00+02:00",
				  "status": "Actual",
				  "msgType": "Alert",
				  "info": [{
				    "language": "de",
				    "event": "Brand",
				    "urgency": "Immediate",
				    "severity": "Severe",
				    "certainty": "Observed",
				    "headline": "Starke Rauchentwicklung",
				    "description": "Bleiben Sie im Gebäude &amp; schließen Sie die Fenster.",
				    "instruction": "Fenster und Türen geschlossen halten &amp; Ruhe bewahren.",
				    "area": [{"areaDesc": "Berlin-Lichterfelde"}]
				  }]
				}
				""".formatted(DETAIL_IDENTIFIER);
	}
}
