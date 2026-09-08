package com.schooldashboard.service;

import com.schooldashboard.model.DailyNews;
import com.schooldashboard.model.ParsedPlanDocument;
import com.schooldashboard.model.PlanParseDiagnostics;
import com.schooldashboard.model.SubstitutionEntry;
import com.schooldashboard.model.SubstitutionPlan;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class SubstitutionPlanParserService {

	private static final Logger logger = LoggerFactory.getLogger(SubstitutionPlanParserService.class);
	private static final Pattern PAGE_PATTERN = Pattern.compile("(?i)seite\\s+(\\d+)\\s*/\\s*(\\d+)");

	public SubstitutionPlan parseSubstitutionPlanFromUrl(String url) {
		return parsePlanDocumentFromUrl(url).getPlan();
	}

	public ParsedPlanDocument parsePlanDocumentFromUrl(String url) {
		try {
			Document doc = Jsoup.connect(url).get();
			ParsedPlanDocument parsedDocument = parseDocumentResult(doc);
			logDiagnostics(parsedDocument.getDiagnostics());
			return new ParsedPlanDocument(parsedDocument.getPlan(), doc.outerHtml(), parsedDocument.getDiagnostics());
		} catch (IOException e) {
			throw new RuntimeException("Error fetching or parsing substitution plan", e);
		}
	}

	private ParsedPlanDocument parseDocumentResult(Document doc) {
		SubstitutionPlan plan = new SubstitutionPlan();
		extractPlanMetadata(doc, plan);
		extractDailyNews(doc, plan.getNews());

		Element tableElement = doc.selectFirst("table.mon_list");
		PageInfo pageInfo = extractPageInfo(doc);
		if (tableElement == null) {
			PlanParseDiagnostics.Status status = containsEmptyPlanMarker(doc)
					? PlanParseDiagnostics.Status.EMPTY
					: PlanParseDiagnostics.Status.UNSUPPORTED;
			PlanParseDiagnostics.Format format = status == PlanParseDiagnostics.Status.EMPTY
					? PlanParseDiagnostics.Format.EMPTY
					: PlanParseDiagnostics.Format.UNSUPPORTED;
			return new ParsedPlanDocument(plan, null,
					diagnostics(format, status, List.of(), List.of(), 0, 0, 0, 0, 0, pageInfo));
		}

		HeaderMapping headerMapping = buildColumnMap(tableElement);
		List<Element> rows = tableElement.select("tr.list.odd, tr.list.even");
		List<SubstitutionEntry> entries = new ArrayList<>();
		String activeClass = null;
		int groupRows = 0;
		int dataRows = 0;
		int skippedRows = 0;
		boolean structuralFailure = false;
		boolean sawGroupRow = false;
		List<String> classCandidates = extractClassCandidates(doc);

		for (Element row : rows) {
			List<Element> cells = directCells(row);
			if (cells.isEmpty()) {
				skippedRows++;
				continue;
			}

			Element groupCell = cells.stream().filter(this::isGroupContextCell).findFirst().orElse(null);
			if (groupCell != null) {
				groupRows++;
				sawGroupRow = true;
				activeClass = extractClassIdentifier(groupCell.text(), classCandidates);
				if (activeClass == null) {
					skippedRows++;
				}
				continue;
			}

			dataRows++;
			if (cells.size() < headerMapping.minimumCellCount()) {
				skippedRows++;
				structuralFailure = true;
				continue;
			}

			SubstitutionEntry entry = mapEntry(cells, headerMapping.columnMap(), activeClass, plan.getDate());
			if (!hasVisibleValue(entry.getClasses())) {
				// A grouped row without context is unsafe to publish.
				skippedRows++;
				structuralFailure = true;
				continue;
			}
			if (!isMeaningfulEntry(entry)) {
				// Class-only placeholders are safe to skip; the frontend applies
				// the same last-line defense.
				skippedRows++;
				continue;
			}
			entries.add(entry);
		}

		for (SubstitutionEntry entry : entries) {
			plan.addEntry(entry);
		}

		PlanParseDiagnostics.Format format = sawGroupRow
				? PlanParseDiagnostics.Format.GROUPED
				: headerMapping.hasClassColumn()
						? PlanParseDiagnostics.Format.EXPLICIT
						: PlanParseDiagnostics.Format.UNSUPPORTED;
		PlanParseDiagnostics.Status status;
		if (headerMapping.columnMap().isEmpty() || structuralFailure || !hasRequiredSubstitutionColumn(headerMapping)
				|| dataRows > 0 && entries.isEmpty() && !rows.isEmpty()) {
			status = PlanParseDiagnostics.Status.UNSUPPORTED;
			format = PlanParseDiagnostics.Format.UNSUPPORTED;
		} else if (dataRows == 0 && groupRows == 0) {
			status = PlanParseDiagnostics.Status.EMPTY;
			format = PlanParseDiagnostics.Format.EMPTY;
		} else if (dataRows == 0) {
			status = PlanParseDiagnostics.Status.UNSUPPORTED;
			format = PlanParseDiagnostics.Format.UNSUPPORTED;
		} else {
			status = PlanParseDiagnostics.Status.VALID;
		}

		return new ParsedPlanDocument(plan, null,
				diagnostics(format, status, headerMapping.normalizedHeaders(), headerMapping.unknownHeaders(),
						rows.size(), groupRows, dataRows, entries.size(), skippedRows, pageInfo));
	}

	private SubstitutionPlan parseDocument(Document doc) {
		return parseDocumentResult(doc).getPlan();
	}

	private void extractPlanMetadata(Document doc, SubstitutionPlan plan) {
		Element titleElement = doc.selectFirst("div.mon_title");
		if (titleElement != null) {
			String dateText = titleElement.text().trim();
			plan.setDate(dateText);
			plan.getNews().setDate(dateText);
		}

		Elements infoElements = doc.select("table.info tr.info");
		if (!infoElements.isEmpty()) {
			StringBuilder infoBuilder = new StringBuilder();
			for (Element infoElement : infoElements) {
				String infoText = infoElement.text().trim();
				if (!infoText.isEmpty()) {
					infoBuilder.append(infoText).append(" ");
				}
			}
			plan.setTitle(infoBuilder.toString().trim());
		}
	}

	private HeaderMapping buildColumnMap(Element tableElement) {
		Element headerRow = tableElement.selectFirst("tr.list:has(th)");
		if (headerRow == null) {
			return new HeaderMapping(Map.of(), List.of(), List.of(), 0, false);
		}

		List<Element> headerElements = directChildren(headerRow, "th");
		Map<Integer, PlanField> columnMap = new HashMap<>();
		List<String> normalizedHeaders = new ArrayList<>();
		Set<String> unknownHeaders = new LinkedHashSet<>();
		for (int i = 0; i < headerElements.size(); i++) {
			String normalizedHeader = normalizeHeader(headerElements.get(i).text());
			normalizedHeaders.add(normalizedHeader);
			PlanField field = fieldForHeader(normalizedHeader);
			if (field == null) {
				unknownHeaders.add(normalizedHeader);
			} else {
				columnMap.put(i, field);
			}
		}

		int minimumCellCount = columnMap.keySet().stream().mapToInt(Integer::intValue).max().orElse(-1) + 1;
		return new HeaderMapping(columnMap, normalizedHeaders, List.copyOf(unknownHeaders), minimumCellCount,
				columnMap.containsValue(PlanField.CLASSES));
	}

	private PlanField fieldForHeader(String header) {
		return switch (header) {
			case "klasse", "klasse(n)" -> PlanField.CLASSES;
			case "stunde" -> PlanField.PERIOD;
			case "abwesend" -> PlanField.ABSENT;
			case "vertreter" -> PlanField.SUBSTITUTE;
			case "(fach)" -> PlanField.ORIGINAL_SUBJECT;
			case "fach" -> PlanField.SUBJECT;
			case "raum", "neuer raum" -> PlanField.ROOM;
			case "art" -> PlanField.TYPE;
			case "text", "bemerkung", "bemerkungen" -> PlanField.COMMENT;
			default -> null;
		};
	}

	private List<Element> directCells(Element row) {
		return row.children().stream().filter(child -> child.normalName().equals("td")).toList();
	}

	private List<Element> directChildren(Element element, String name) {
		return element.children().stream().filter(child -> child.normalName().equals(name)).toList();
	}

	private boolean isGroupContextCell(Element cell) {
		return cell.classNames().contains("inline_header");
	}

	private SubstitutionEntry mapEntry(List<Element> cells, Map<Integer, PlanField> columnMap, String activeClass,
			String date) {
		SubstitutionEntry entry = new SubstitutionEntry();
		entry.setDate(date);
		boolean roomWasReplaced = false;
		for (int i = 0; i < cells.size(); i++) {
			PlanField field = columnMap.get(i);
			if (field == null) {
				continue;
			}
			CellValue cellValue = readCellValue(cells.get(i));
			setField(entry, field, cellValue);
			roomWasReplaced |= field == PlanField.ROOM && cellValue.hasStruckText();
		}
		if (!hasVisibleValue(entry.getClasses())) {
			entry.setClasses(activeClass);
		}
		if (roomWasReplaced && sameVisibleValue(entry.getNewRoom(), entry.getType())) {
			// Untis repeats markers such as "?EVA" in the room cell for some
			// activity types. The type column already carries that information.
			entry.setNewRoom("");
		}
		return entry;
	}

	private CellValue readCellValue(Element cell) {
		List<String> struckParts = cell.select("s, strike, del").stream().map(Element::text).map(String::trim)
				.filter(this::hasVisibleValue).toList();
		Element activeCell = cell.clone();
		activeCell.select("s, strike, del").remove();
		String activeText = normalizeActiveText(activeCell.text());
		String plainText = normalizeActiveText(cell.text());
		String struckText = String.join(" ", struckParts);
		return new CellValue(plainText, struckText, activeText, !struckParts.isEmpty());
	}

	private String normalizeActiveText(String value) {
		if (value == null) {
			return "";
		}
		return value.trim().replaceFirst("^\\s*\\?\\s*", "").trim();
	}

	private void setField(SubstitutionEntry entry, PlanField field, CellValue value) {
		switch (field) {
			case CLASSES -> entry.setClasses(value.plainText());
			case PERIOD -> entry.setPeriod(value.plainText());
			case ABSENT -> entry.setAbsent(value.hasStruckText() ? value.struckText() : value.plainText());
			case SUBSTITUTE -> {
				if (value.hasStruckText()) {
					if (!hasVisibleValue(entry.getAbsent())) {
						entry.setAbsent(value.struckText());
					}
					entry.setSubstitute(value.activeText());
				} else {
					entry.setSubstitute(value.plainText());
				}
			}
			case ORIGINAL_SUBJECT ->
				entry.setOriginalSubject(value.hasStruckText() ? value.struckText() : value.plainText());
			case SUBJECT -> {
				if (value.hasStruckText()) {
					entry.setOriginalSubject(value.struckText());
					entry.setSubject(value.activeText());
				} else {
					entry.setSubject(value.plainText());
				}
			}
			case ROOM -> entry.setNewRoom(value.activeText());
			case TYPE -> entry.setType(value.activeText());
			case COMMENT -> entry.setComment(value.activeText());
		}
	}

	private boolean sameVisibleValue(String first, String second) {
		return hasVisibleValue(first) && hasVisibleValue(second) && first.trim().equalsIgnoreCase(second.trim());
	}

	private boolean isMeaningfulEntry(SubstitutionEntry entry) {
		return Stream
				.of(entry.getPeriod(), entry.getAbsent(), entry.getSubstitute(), entry.getOriginalSubject(),
						entry.getSubject(), entry.getNewRoom(), entry.getType(), entry.getComment())
				.anyMatch(this::hasVisibleValue);
	}

	private boolean hasVisibleValue(String value) {
		return value != null && !value.isBlank() && !value.trim().equals("---");
	}

	private boolean hasRequiredSubstitutionColumn(HeaderMapping mapping) {
		return mapping.columnMap().values().stream().anyMatch(field -> field != PlanField.CLASSES);
	}

	private List<String> extractClassCandidates(Document doc) {
		List<String> candidates = new ArrayList<>();
		for (Element info : doc.select("table.info tr.info")) {
			String text = normalizeWhitespace(info.text());
			String lower = text.toLowerCase(Locale.ROOT);
			int marker = lower.indexOf("betroffene klassen");
			if (marker < 0) {
				continue;
			}
			String value = text.substring(marker + "betroffene klassen".length()).replaceFirst("^\\s*[:=-]\\s*", "");
			for (String candidate : value.split("[,;]")) {
				String normalized = normalizeWhitespace(candidate);
				if (!normalized.isEmpty()) {
					candidates.add(normalized);
				}
			}
		}
		candidates.sort(Comparator.comparingInt(String::length).reversed());
		return candidates;
	}

	private String extractClassIdentifier(String label, List<String> candidates) {
		String normalizedLabel = normalizeWhitespace(label);
		if (normalizedLabel.isEmpty() || normalizedLabel.equals("---")) {
			return null;
		}
		for (String candidate : candidates) {
			boolean startsWithCandidate = normalizedLabel.regionMatches(true, 0, candidate, 0, candidate.length());
			if (startsWithCandidate && (normalizedLabel.length() == candidate.length()
					|| Character.isWhitespace(normalizedLabel.charAt(candidate.length()))
					|| "([,/:-".indexOf(normalizedLabel.charAt(candidate.length())) >= 0)) {
				return normalizeClassIdentifier(candidate);
			}
		}

		String token = normalizedLabel.split("\\s+", 2)[0].replaceAll("^[\\[(]+|[\\],;:]+$", "");
		return normalizeClassIdentifier(token);
	}

	private String normalizeClassIdentifier(String candidate) {
		if (candidate == null || candidate.isBlank() || candidate.equals("---")) {
			return null;
		}
		String normalized = candidate.trim();
		if (normalized.matches("0\\d+[^\\s]*")) {
			normalized = normalized.substring(1);
		}
		return normalized.isBlank() ? null : normalized;
	}

	private String normalizeHeader(String value) {
		return normalizeWhitespace(value).toLowerCase(Locale.ROOT);
	}

	private String normalizeWhitespace(String value) {
		return value == null ? "" : value.trim().replaceAll("\\s+", " ");
	}

	private boolean containsEmptyPlanMarker(Document doc) {
		String text = doc.body() == null ? "" : doc.body().text().toLowerCase(Locale.ROOT);
		return text.contains("keine vertretungen") || text.contains("keine substitutionen");
	}

	private PageInfo extractPageInfo(Document doc) {
		Matcher matcher = PAGE_PATTERN.matcher(doc.text());
		if (!matcher.find()) {
			return new PageInfo(null, null);
		}
		return new PageInfo(parseInt(matcher.group(1)), parseInt(matcher.group(2)));
	}

	private Integer parseInt(String value) {
		try {
			return Integer.valueOf(value);
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private PlanParseDiagnostics diagnostics(PlanParseDiagnostics.Format format, PlanParseDiagnostics.Status status,
			List<String> headers, List<String> unknownHeaders, int sourceRows, int groupRows, int dataRows,
			int validEntries, int skippedRows, PageInfo pageInfo) {
		return new PlanParseDiagnostics(format, status, headers, unknownHeaders, sourceRows, groupRows, dataRows,
				validEntries, skippedRows, pageInfo.pageNumber(), pageInfo.pageCount());
	}

	private void logDiagnostics(PlanParseDiagnostics diagnostics) {
		if (!diagnostics.getUnknownHeaders().isEmpty()) {
			logger.warn("[SubstitutionPlanParserService] Unknown substitution headers: {}",
					diagnostics.getUnknownHeaders());
		}
		if (!diagnostics.isPublishable()) {
			logger.warn(
					"[SubstitutionPlanParserService] Unsupported substitution document: format={}, headers={}, "
							+ "sourceRows={}, groupRows={}, dataRows={}, validEntries={}, skippedRows={}",
					diagnostics.getFormat(), diagnostics.getNormalizedHeaders(), diagnostics.getSourceRows(),
					diagnostics.getGroupRows(), diagnostics.getDataRows(), diagnostics.getValidEntries(),
					diagnostics.getSkippedRows());
		}
		logger.info(
				"[SubstitutionPlanParserService] Parsed substitution document: format={}, headers={}, "
						+ "sourceRows={}, groupRows={}, dataRows={}, validEntries={}, skippedRows={}",
				diagnostics.getFormat(), diagnostics.getNormalizedHeaders().size(), diagnostics.getSourceRows(),
				diagnostics.getGroupRows(), diagnostics.getDataRows(), diagnostics.getValidEntries(),
				diagnostics.getSkippedRows());
	}

	private enum PlanField {
		CLASSES, PERIOD, ABSENT, SUBSTITUTE, ORIGINAL_SUBJECT, SUBJECT, ROOM, TYPE, COMMENT
	}

	private record HeaderMapping(Map<Integer, PlanField> columnMap, List<String> normalizedHeaders,
			List<String> unknownHeaders, int minimumCellCount, boolean hasClassColumn) {
	}

	private record CellValue(String plainText, String struckText, String activeText, boolean hasStruckText) {
	}

	private record PageInfo(Integer pageNumber, Integer pageCount) {
	}

	private void extractDailyNews(Document doc, DailyNews news) {
		Elements newsHeaders = doc.getElementsContainingOwnText("Nachrichten zum Tag");
		if (!newsHeaders.isEmpty()) {
			Element newsHeader = newsHeaders.first();
			Element parent = newsHeader == null ? null : newsHeader.parent();
			if (parent != null) {
				Elements newsElements = parent.nextElementSiblings();
				for (Element element : newsElements) {
					if (element.is("table.mon_list")) {
						break;
					}
					if (element.is("p, div, tr, td, font")) {
						addNewsItem(news, element.text());
					}
				}
			}

			if (news.getNewsItems().isEmpty()) {
				Element current = newsHeader == null ? null : newsHeader.nextElementSibling();
				while (current != null) {
					if (current.is("table.mon_list")) {
						break;
					}
					if (current.is("p, div")) {
						addNewsItem(news, current.text());
					}
					current = current.nextElementSibling();
				}
			}

			if (news.getNewsItems().isEmpty()) {
				for (Element font : doc.select("font[size=4]")) {
					addNewsItem(news, font.text());
				}
			}
		}
	}

	private void addNewsItem(DailyNews news, String text) {
		if (text == null) {
			return;
		}
		String trimmed = text.trim();
		if (!trimmed.isEmpty() && !trimmed.contains("Untis Stundenplan")) {
			news.addNewsItem(trimmed);
		}
	}
}
