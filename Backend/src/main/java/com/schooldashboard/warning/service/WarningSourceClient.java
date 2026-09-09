package com.schooldashboard.warning.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.warning.config.WarningProperties;
import com.schooldashboard.warning.model.WarningNotice;
import java.net.URI;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Component
public class WarningSourceClient {

	private static final Logger logger = LoggerFactory.getLogger(WarningSourceClient.class);
	private static final Pattern SAFE_IDENTIFIER = Pattern.compile("[A-Za-z0-9._-]+");

	private final WarningProperties properties;
	private final RestTemplate restTemplate;
	private final ObjectMapper objectMapper;

	public WarningSourceClient(WarningProperties properties, RestTemplate restTemplate, ObjectMapper objectMapper) {
		this.properties = properties;
		this.restTemplate = restTemplate;
		this.objectMapper = objectMapper;
	}

	public SourceFetch fetchSummaries(SourceCursor cursor) {
		HttpHeaders headers = new HttpHeaders();
		headers.setAccept(List.of(MediaType.APPLICATION_JSON));
		if (cursor != null && cursor.etag() != null && !cursor.etag().isBlank()) {
			headers.setIfNoneMatch(cursor.etag());
		}
		if (cursor != null && cursor.lastModified() > 0) {
			headers.setIfModifiedSince(cursor.lastModified());
		}

		ResponseEntity<String> response = exchange(
				properties.getApiBaseUrl() + "/dashboard/" + encodeRegionCode(properties.getRegionCode()) + ".json",
				headers);
		String nextEtag = response.getHeaders().getETag();
		long nextLastModified = response.getHeaders().getLastModified();
		SourceCursor nextCursor = new SourceCursor(nextEtag == null && cursor != null ? cursor.etag() : nextEtag,
				nextLastModified <= 0 && cursor != null ? cursor.lastModified() : nextLastModified);
		if (response.getStatusCode().value() == 304) {
			return new SourceFetch(true, List.of(), nextCursor);
		}
		if (!response.getStatusCode().is2xxSuccessful()) {
			throw new IllegalStateException("Warning source returned HTTP " + response.getStatusCode().value());
		}
		String body = requireBody(response.getBody());
		try {
			JsonNode root = objectMapper.readTree(body);
			if (!root.isArray()) {
				throw new IllegalStateException("Warning source returned a non-array payload");
			}
			List<SourceWarning> warnings = new ArrayList<>();
			for (JsonNode node : root) {
				SourceWarning warning = parseSummary(node);
				if (warning != null) {
					warnings.add(warning);
				}
			}
			return new SourceFetch(false, warnings, nextCursor);
		} catch (Exception exception) {
			if (exception instanceof IllegalStateException illegalStateException) {
				throw illegalStateException;
			}
			throw new IllegalStateException("Failed to parse warning source response", exception);
		}
	}

	public WarningNotice fetchDetails(SourceWarning summary) {
		if (summary == null || summary.id() == null || !SAFE_IDENTIFIER.matcher(summary.id()).matches()) {
			return summary == null ? null : summary.toNotice();
		}

		try {
			String mappingBody = getBody(
					properties.getApiBaseUrl() + "/archive.mowas/" + summary.id() + "-mapping.json",
					MediaType.APPLICATION_JSON);
			JsonNode history = objectMapper.readTree(mappingBody).path("history");
			if (!history.isArray() || history.isEmpty()) {
				return summary.toNotice();
			}
			JsonNode latest = history.findValues("identifier").stream().map(node -> node)
					.reduce((first, second) -> second).orElse(null);
			if (latest == null || !latest.isTextual()) {
				return summary.toNotice();
			}
			String identifier = latest.asText();
			if (!SAFE_IDENTIFIER.matcher(identifier.replace(".json", "")).matches()) {
				return summary.toNotice();
			}
			String detailBody = getBody(properties.getApiBaseUrl() + "/archive.mowas/" + identifier,
					MediaType.APPLICATION_JSON);
			return parseDetail(summary, objectMapper.readTree(detailBody));
		} catch (RestClientException | IllegalStateException exception) {
			logger.warn("Could not resolve full warning details for {}", summary.id(), exception);
			return summary.toNotice();
		} catch (Exception exception) {
			logger.warn("Could not parse full warning details for {}", summary.id(), exception);
			return summary.toNotice();
		}
	}

	private ResponseEntity<String> exchange(String url, HttpHeaders headers) {
		try {
			return restTemplate.exchange(URI.create(url), HttpMethod.GET, new HttpEntity<>(headers), String.class);
		} catch (RestClientException exception) {
			throw new IllegalStateException("Warning source request failed", exception);
		}
	}

	private String getBody(String url, MediaType mediaType) {
		HttpHeaders headers = new HttpHeaders();
		headers.setAccept(List.of(mediaType));
		ResponseEntity<String> response = exchange(url, headers);
		if (!response.getStatusCode().is2xxSuccessful()) {
			throw new IllegalStateException("Warning detail source returned HTTP " + response.getStatusCode().value());
		}
		return requireBody(response.getBody());
	}

	private String requireBody(String body) {
		if (body == null || body.isBlank()) {
			throw new IllegalStateException("Warning source returned an empty response");
		}
		if (body.length() > properties.getMaxResponseChars()) {
			throw new IllegalStateException("Warning source response exceeded configured size limit");
		}
		return body;
	}

	private SourceWarning parseSummary(JsonNode node) {
		String id = textAt(node, "id", "payload.id");
		if (id == null || id.isBlank()) {
			return null;
		}
		JsonNode data = firstNode(node, "payload.data", "data");
		String type = firstText(data, "msgType", "type");
		if (type == null) {
			type = textAt(node, "payload.type", "type");
		}
		return new SourceWarning(id, textAt(node, "payload.hash", "hash"), normalizeMessageType(type),
				firstText(data, "headline", "i18nTitle.de") != null
						? firstText(data, "headline", "i18nTitle.de")
						: textAt(node, "i18nTitle.de"),
				firstText(data, "provider"), firstText(data, "severity"), firstText(data, "urgency"),
				firstText(data, "certainty"), firstText(data, "transKeys.event"), firstText(data, "area.data"),
				firstInstant(node, "sent"), firstInstant(node, "expiresDate", "expires"), isTest(node, data));
	}

	private WarningNotice parseDetail(SourceWarning summary, JsonNode root) {
		JsonNode info = selectGermanInfo(root.path("info"));
		if (info.isMissingNode()) {
			return summary.toNotice();
		}
		List<String> areas = new ArrayList<>();
		JsonNode areaNodes = info.path("area");
		if (areaNodes.isArray()) {
			for (JsonNode area : areaNodes) {
				String areaDescription = textAt(area, "areaDesc");
				if (areaDescription != null && !areaDescription.isBlank()) {
					areas.add(areaDescription.trim());
				}
			}
		}
		String messageType = normalizeMessageType(textAt(root, "msgType"));
		if (messageType == null) {
			messageType = summary.messageType();
		}
		return new WarningNotice(summary.id(), messageType,
				firstText(info, "headline") != null ? firstText(info, "headline") : summary.headline(),
				cleanMarkup(firstText(info, "description")), cleanMarkup(firstText(info, "instruction")),
				firstText(root, "sender", "provider") != null
						? firstText(root, "sender", "provider")
						: summary.provider(),
				firstText(info, "severity") != null ? firstText(info, "severity") : summary.severity(),
				firstText(info, "urgency") != null ? firstText(info, "urgency") : summary.urgency(),
				firstText(info, "certainty") != null ? firstText(info, "certainty") : summary.certainty(),
				firstText(info, "event") != null ? firstText(info, "event") : summary.event(), areas,
				firstInstant(root, "sent") != null ? firstInstant(root, "sent") : summary.sentAt(),
				firstInstant(info, "expires") != null ? firstInstant(info, "expires") : summary.expiresAt(),
				"https://warnung.bund.de/meldungen", "Test".equalsIgnoreCase(textAt(root, "status")));
	}

	private JsonNode selectGermanInfo(JsonNode infos) {
		if (!infos.isArray()) {
			return infos;
		}
		for (JsonNode info : infos) {
			if ("de".equalsIgnoreCase(textAt(info, "language"))) {
				return info;
			}
		}
		return infos.isEmpty() ? objectMapper.createObjectNode() : infos.get(0);
	}

	private boolean isTest(JsonNode node, JsonNode data) {
		return "Test".equalsIgnoreCase(firstText(node, "status")) || "Test".equalsIgnoreCase(firstText(data, "status"));
	}

	private String cleanMarkup(String value) {
		if (value == null || value.isBlank()) {
			return "";
		}
		String withLineBreaks = value.replaceAll("(?i)<br\\s*/?>", "\n");
		return Jsoup.clean(withLineBreaks, Safelist.none()).trim();
	}

	private String encodeRegionCode(String value) {
		String trimmed = value == null ? "" : value.trim();
		if (!trimmed.matches("\\d{12}")) {
			throw new IllegalStateException("Warning region code must contain exactly 12 digits");
		}
		return trimmed;
	}

	private String normalizeMessageType(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		return switch (value.trim().toLowerCase(Locale.ROOT)) {
			case "alert" -> "Alert";
			case "update" -> "Update";
			case "cancel" -> "Cancel";
			default -> value.trim();
		};
	}

	private JsonNode firstNode(JsonNode node, String... paths) {
		for (String path : paths) {
			JsonNode candidate = node;
			for (String segment : path.split("\\.")) {
				candidate = candidate.path(segment);
			}
			if (!candidate.isMissingNode() && !candidate.isNull()) {
				return candidate;
			}
		}
		return objectMapper.createObjectNode();
	}

	private String firstText(JsonNode node, String... paths) {
		for (String path : paths) {
			String value = textAt(node, path);
			if (value != null && !value.isBlank()) {
				return value;
			}
		}
		return null;
	}

	private String textAt(JsonNode node, String... paths) {
		if (node == null || node.isMissingNode() || node.isNull()) {
			return null;
		}
		for (String path : paths) {
			JsonNode candidate = firstNode(node, path);
			if (candidate.isTextual() || candidate.isNumber() || candidate.isBoolean()) {
				return candidate.asText();
			}
		}
		return null;
	}

	private Instant firstInstant(JsonNode node, String... paths) {
		String value = firstText(node, paths);
		if (value == null) {
			return null;
		}
		try {
			return Instant.parse(value);
		} catch (DateTimeParseException ignored) {
			try {
				return OffsetDateTime.parse(value).toInstant();
			} catch (DateTimeParseException ignoredAgain) {
				return null;
			}
		}
	}

	public record SourceCursor(String etag, long lastModified) {
	}

	public record SourceFetch(boolean notModified, List<SourceWarning> warnings, SourceCursor cursor) {
		public SourceFetch {
			warnings = warnings == null ? List.of() : List.copyOf(warnings);
		}
	}

	public record SourceWarning(String id, String hash, String messageType, String headline, String provider,
			String severity, String urgency, String certainty, String event, String areaData, Instant sentAt,
			Instant expiresAt, boolean test) {

		public WarningNotice toNotice() {
			return new WarningNotice(id, messageType, headline == null ? "Amtliche Warnung" : headline, "", "",
					provider, severity, urgency, certainty, event,
					areaData == null || areaData.isBlank() ? List.of() : List.of(areaData), sentAt, expiresAt,
					"https://warnung.bund.de/meldungen", test);
		}
	}
}
