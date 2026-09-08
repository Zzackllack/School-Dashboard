package com.schooldashboard.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.schooldashboard.model.ParsedPlanDocument;
import com.schooldashboard.model.PlanParseDiagnostics;
import com.schooldashboard.model.SubstitutionEntry;
import com.schooldashboard.model.SubstitutionPlan;
import com.schooldashboard.util.DSBMobile;
import com.schooldashboard.util.DSBMobile.TimeTable;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class SubstitutionPlanServiceTest {

	private DSBService dsbService;
	private SubstitutionPlanParserService parser;
	private SubstitutionPlanPersistenceService persistence;
	private ApiResponseCacheService cacheService;
	private SubstitutionPlanService service;

	@BeforeEach
	public void setup() {
		dsbService = mock(DSBService.class);
		parser = mock(SubstitutionPlanParserService.class);
		persistence = mock(SubstitutionPlanPersistenceService.class);
		cacheService = mock(ApiResponseCacheService.class);
		service = new SubstitutionPlanService(dsbService, parser, persistence, cacheService);
	}

	private TimeTable tt(UUID uuid, String group, String detail) {
		return new DSBMobile("", " ").new TimeTable(uuid, group, "", "", detail);
	}

	@Test
	public void updateSubstitutionPlansCombinesAndSorts() {
		UUID u1 = UUID.randomUUID();
		UUID u2 = UUID.randomUUID();
		List<TimeTable> tables = Arrays.asList(tt(u1, "heute", "u1-1"), tt(u1, "heute", "u1-2"),
				tt(u2, "morgen", "u2"));
		when(dsbService.getTimeTables()).thenReturn(tables);

		SubstitutionPlan p1 = meaningfulPlan("d1", "1");
		p1.setTitle("t1");
		p1.getNews().addNewsItem("n1");
		SubstitutionPlan p2 = meaningfulPlan("d1", "2");
		p2.setTitle("t2");
		p2.getNews().addNewsItem("n1");
		p2.getNews().addNewsItem("n2");
		SubstitutionPlan p3 = meaningfulPlan("d2", "3");
		p3.setTitle("t3");

		when(parser.parsePlanDocumentFromUrl("u1-1")).thenReturn(parsed(p1));
		when(parser.parsePlanDocumentFromUrl("u1-2")).thenReturn(parsed(p2));
		when(parser.parsePlanDocumentFromUrl("u2")).thenReturn(parsed(p3));

		service.updateSubstitutionPlans();

		List<SubstitutionPlan> result = service.getSubstitutionPlans();
		assertEquals(2, result.size());
		SubstitutionPlan first = result.get(0);
		assertEquals(1, first.getSortPriority());
		assertEquals(2, first.getEntries().size());
		assertEquals(2, first.getNews().getNewsItems().size());
		SubstitutionPlan second = result.get(1);
		assertEquals(2, second.getSortPriority());

		verify(cacheService).store(eq(ApiResponseCacheKeys.SUBSTITUTION_PLANS), any());
	}

	@Test
	public void updateContinuesOnParserError() {
		UUID u1 = UUID.randomUUID();
		when(dsbService.getTimeTables()).thenReturn(List.of(tt(u1, "heute", "u")));
		when(parser.parsePlanDocumentFromUrl("u")).thenThrow(new RuntimeException("err"));
		service.updateSubstitutionPlans();
		assertTrue(service.getSubstitutionPlans().isEmpty());
		verify(cacheService, never()).store(eq(ApiResponseCacheKeys.SUBSTITUTION_PLANS), any());
	}

	@Test
	public void invalidRefreshKeepsPreviouslyPublishedPlansAndCache() {
		UUID validUuid = UUID.randomUUID();
		UUID invalidUuid = UUID.randomUUID();
		when(dsbService.getTimeTables()).thenReturn(List.of(tt(validUuid, "heute", "valid")))
				.thenReturn(List.of(tt(invalidUuid, "heute", "unsupported")));

		SubstitutionPlan validPlan = meaningfulPlan("valid-date", "1");
		when(parser.parsePlanDocumentFromUrl("valid")).thenReturn(parsed(validPlan));
		when(parser.parsePlanDocumentFromUrl("unsupported"))
				.thenReturn(new ParsedPlanDocument(new SubstitutionPlan(), "<html></html>", unsupportedDiagnostics()));

		service.updateSubstitutionPlans();
		service.updateSubstitutionPlans();

		assertEquals(List.of(validPlan), service.getSubstitutionPlans());
		verify(cacheService, times(1)).store(eq(ApiResponseCacheKeys.SUBSTITUTION_PLANS), any());
	}

	@Test
	public void mergesPagesInDeterministicPageOrder() {
		UUID uuid = UUID.randomUUID();
		when(dsbService.getTimeTables())
				.thenReturn(List.of(tt(uuid, "heute", "page-2.html"), tt(uuid, "heute", "page-1.html")));

		SubstitutionPlan pageOne = meaningfulPlan("date", "1");
		SubstitutionPlan pageTwo = meaningfulPlan("date", "2");
		when(parser.parsePlanDocumentFromUrl("page-1.html")).thenReturn(parsed(pageOne));
		when(parser.parsePlanDocumentFromUrl("page-2.html")).thenReturn(parsed(pageTwo));

		service.updateSubstitutionPlans();

		assertEquals(List.of("1", "2"),
				service.getSubstitutionPlans().get(0).getEntries().stream().map(entry -> entry.getPeriod()).toList());
		verify(parser).parsePlanDocumentFromUrl("page-1.html");
		verify(parser).parsePlanDocumentFromUrl("page-2.html");
	}

	@Test
	public void incompleteAdvertisedPageSetIsNotPublished() {
		UUID uuid = UUID.randomUUID();
		when(dsbService.getTimeTables()).thenReturn(List.of(tt(uuid, "heute", "page-1.html")));
		when(parser.parsePlanDocumentFromUrl("page-1.html")).thenReturn(
				new ParsedPlanDocument(meaningfulPlan("date", "1"), "<html></html>", validDiagnostics(1, 2)));

		service.updateSubstitutionPlans();

		assertTrue(service.getSubstitutionPlans().isEmpty());
		verify(cacheService, never()).store(eq(ApiResponseCacheKeys.SUBSTITUTION_PLANS), any());
	}

	private SubstitutionPlan meaningfulPlan(String date, String period) {
		SubstitutionPlan plan = new SubstitutionPlan(date, "title");
		SubstitutionEntry entry = new SubstitutionEntry();
		entry.setClasses("10a");
		entry.setPeriod(period);
		plan.addEntry(entry);
		return plan;
	}

	private PlanParseDiagnostics unsupportedDiagnostics() {
		return new PlanParseDiagnostics(PlanParseDiagnostics.Format.UNSUPPORTED,
				PlanParseDiagnostics.Status.UNSUPPORTED, List.of("unknown"), List.of("unknown"), 1, 0, 1, 0, 1, null,
				null);
	}

	private PlanParseDiagnostics validDiagnostics(int pageNumber, int pageCount) {
		return new PlanParseDiagnostics(PlanParseDiagnostics.Format.GROUPED, PlanParseDiagnostics.Status.VALID,
				List.of("stunde", "text"), List.of(), 2, 1, 1, 1, 0, pageNumber, pageCount);
	}

	private ParsedPlanDocument parsed(SubstitutionPlan plan) {
		return new ParsedPlanDocument(plan, "<html></html>");
	}
}
