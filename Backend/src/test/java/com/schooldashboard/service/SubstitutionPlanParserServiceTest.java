package com.schooldashboard.service;

import static org.junit.jupiter.api.Assertions.*;

import com.schooldashboard.model.ParsedPlanDocument;
import com.schooldashboard.model.PlanParseDiagnostics;
import com.schooldashboard.model.SubstitutionPlan;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.lang.reflect.Method;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class SubstitutionPlanParserServiceTest {

	private static HttpServer server;
	private static String baseUrl;

	private static final String HTML = "<html><div class='mon_title'>01.01.2024</div>"
			+ "<table class='info'><tr class='info'>Info1</tr><tr class='info'>Info2</tr></table>"
			+ "<h2>Nachrichten zum Tag</h2><p>News1</p><p>News2</p>"
			+ "<table class='mon_list'><tr class='list'><th>Klasse</th><th>Stunde</th><th>Bemerkung</th></tr>"
			+ "<tr class='list odd'><td>10A</td><td>1</td><td>Bem</td></tr></table></html>";

	private static String fixture(String name) throws IOException {
		try (var stream = SubstitutionPlanParserServiceTest.class.getResourceAsStream("/substitution-plans/" + name)) {
			if (stream == null) {
				throw new IOException("Missing test fixture " + name);
			}
			return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
		}
	}

	private static void respond(com.sun.net.httpserver.HttpExchange exchange, String body) throws IOException {
		byte[] htmlBytes = body.getBytes(StandardCharsets.UTF_8);
		exchange.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
		exchange.sendResponseHeaders(200, htmlBytes.length);
		try (OutputStream os = exchange.getResponseBody()) {
			os.write(htmlBytes);
		}
	}

	@BeforeAll
	public static void startServer() throws IOException {
		server = HttpServer.create(new InetSocketAddress(0), 0);
		server.createContext("/plan", e -> respond(e, HTML));
		server.createContext("/explicit", e -> respond(e, fixture("untis-2026-explicit-columns.html")));
		server.createContext("/grouped", e -> respond(e, fixture("untis-2027-grouped-columns.html")));
		server.createContext("/empty", e -> respond(e, fixture("untis-empty-plan.html")));
		server.createContext("/unsupported", e -> respond(e, fixture("untis-unsupported-layout.html")));
		server.start();
		baseUrl = "http://localhost:" + server.getAddress().getPort() + "/plan";
	}

	@AfterAll
	public static void stopServer() {
		server.stop(0);
	}

	@Test
	public void parseFromUrl() {
		SubstitutionPlanParserService svc = new SubstitutionPlanParserService();
		SubstitutionPlan plan = svc.parseSubstitutionPlanFromUrl(baseUrl);
		assertEquals("01.01.2024", plan.getDate());
		assertEquals("Info1 Info2", plan.getTitle());
		assertEquals(1, plan.getEntries().size());
		assertEquals("10A", plan.getEntries().get(0).getClasses());
		assertEquals(2, plan.getNews().getNewsItems().size());
		assertEquals("News1", plan.getNews().getNewsItems().get(0));
		assertEquals("News2", plan.getNews().getNewsItems().get(1));
		assertFalse(plan.getNews().getNewsItems().stream().anyMatch(item -> item.contains("10A")));
	}

	@Test
	public void parseExplicitUntisLayout() {
		SubstitutionPlan plan = new SubstitutionPlanParserService().parseSubstitutionPlanFromUrl(url("/explicit"));
		var entry = plan.getEntries().get(0);
		assertEquals(1, plan.getEntries().size());
		assertEquals("10a", entry.getClasses());
		assertEquals("2", entry.getPeriod());
		assertEquals("Lehmann", entry.getAbsent());
		assertEquals("Nguyen", entry.getSubstitute());
		assertEquals("Bio", entry.getOriginalSubject());
		assertEquals("Ch", entry.getSubject());
		assertEquals("R-204", entry.getNewRoom());
		assertEquals("Vertr.", entry.getType());
		assertEquals("Raumtausch", entry.getComment());
	}

	@Test
	public void parseGroupedUntisLayoutAndInheritClassContext() {
		SubstitutionPlanParserService service = new SubstitutionPlanParserService();
		ParsedPlanDocument parsed = parseUrl(service, "/grouped");

		assertTrue(parsed.getDiagnostics().isPublishable());
		assertEquals(PlanParseDiagnostics.Format.GROUPED, parsed.getDiagnostics().getFormat());
		assertEquals(2, parsed.getDiagnostics().getGroupRows());
		assertEquals(3, parsed.getDiagnostics().getDataRows());
		assertEquals(3, parsed.getDiagnostics().getValidEntries());
		assertEquals(3, parsed.getPlan().getEntries().size());
		assertEquals(List.of("7c", "7c", "11"), parsed.getPlan().getEntries().stream()
				.map(com.schooldashboard.model.SubstitutionEntry::getClasses).toList());
		var repairedEvaEntry = parsed.getPlan().getEntries().get(0);
		assertEquals("Ahr", repairedEvaEntry.getAbsent());
		assertEquals("", valueOrEmpty(repairedEvaEntry.getSubstitute()));
		assertEquals("LEN12", repairedEvaEntry.getSubject());
		assertEquals("", valueOrEmpty(repairedEvaEntry.getNewRoom()));
		assertEquals("EVA", repairedEvaEntry.getType());
		assertEquals("Bitte Material mitbringen", repairedEvaEntry.getComment());

		var repairedMitbetreuungEntry = parsed.getPlan().getEntries().get(1);
		assertEquals("Ahr", repairedMitbetreuungEntry.getAbsent());
		assertEquals("Pat", repairedMitbetreuungEntry.getSubstitute());
		assertEquals("Gpsy15", repairedMitbetreuungEntry.getSubject());
		assertEquals("253", repairedMitbetreuungEntry.getNewRoom());
		assertEquals("Mitbetr.", repairedMitbetreuungEntry.getType());
		assertEquals("11", parsed.getPlan().getEntries().get(2).getClasses());
		assertFalse(parsed.getPlan().getEntries().stream().anyMatch(entry -> entry.getPeriod().contains("Unterstufe")));
	}

	@Test
	public void recognizesEmptyPlanSeparatelyFromUnsupportedDocument() {
		SubstitutionPlanParserService service = new SubstitutionPlanParserService();
		ParsedPlanDocument empty = parseUrl(service, "/empty");
		ParsedPlanDocument unsupported = parseUrl(service, "/unsupported");

		assertEquals(PlanParseDiagnostics.Status.EMPTY, empty.getDiagnostics().getStatus());
		assertEquals(PlanParseDiagnostics.Format.EMPTY, empty.getDiagnostics().getFormat());
		assertTrue(empty.getPlan().getEntries().isEmpty());
		assertEquals(PlanParseDiagnostics.Status.UNSUPPORTED, unsupported.getDiagnostics().getStatus());
		assertFalse(unsupported.getDiagnostics().isPublishable());
	}

	@Test
	public void unknownColumnDoesNotShiftKnownFields() throws Exception {
		String html = "<div class='mon_title'>20.09.2026</div><table class='mon_list'>"
				+ "<tr class='list'><th>Stunde</th><th>Zusatz</th><th>Text</th></tr>"
				+ "<tr class='list odd'><td class='inline_header' colspan='3'>10a</td></tr>"
				+ "<tr class='list odd'><td>3</td><td>ignored</td><td>Kommentar</td></tr></table>";
		ParsedPlanDocument parsed = parseDocument(html);

		assertEquals(PlanParseDiagnostics.Status.VALID, parsed.getDiagnostics().getStatus());
		assertEquals(List.of("zusatz"), parsed.getDiagnostics().getUnknownHeaders());
		assertEquals("3", parsed.getPlan().getEntries().get(0).getPeriod());
		assertEquals("Kommentar", parsed.getPlan().getEntries().get(0).getComment());
	}

	@Test
	public void rejectsGroupedDataBeforeClassContextAndClearsBlankContext() throws Exception {
		String html = "<div class='mon_title'>19.09.2026</div><table class='mon_list'>"
				+ "<tr class='list'><th>Stunde</th><th>Text</th></tr>"
				+ "<tr class='list odd'><td>1</td><td>orphan</td></tr>"
				+ "<tr class='list even'><td class='inline_header' colspan='2'> </td></tr>"
				+ "<tr class='list odd'><td>2</td><td>after blank</td></tr></table>";
		ParsedPlanDocument parsed = parseDocument(html);

		assertEquals(PlanParseDiagnostics.Status.UNSUPPORTED, parsed.getDiagnostics().getStatus());
		assertTrue(parsed.getPlan().getEntries().isEmpty());
	}

	private static String url(String path) {
		return baseUrl.substring(0, baseUrl.lastIndexOf('/')) + path;
	}

	private static ParsedPlanDocument parseUrl(SubstitutionPlanParserService service, String path) {
		return service.parsePlanDocumentFromUrl(url(path));
	}

	private static String valueOrEmpty(String value) {
		return value == null ? "" : value;
	}

	private static ParsedPlanDocument parseDocument(String html) throws Exception {
		Document doc = Jsoup.parse(html);
		SubstitutionPlanParserService service = new SubstitutionPlanParserService();
		Method method = SubstitutionPlanParserService.class.getDeclaredMethod("parseDocumentResult", Document.class);
		method.setAccessible(true);
		return (ParsedPlanDocument) method.invoke(service, doc);
	}

	@Test
	public void parseDocumentFiltersDailyNews() throws Exception {
		String html = "<html><h2>Nachrichten zum Tag</h2>" + "<p>First</p><span>Ignore</span><div>Second</div>"
				+ "<table class='mon_list'><tr><td>Table</td></tr></table>" + "<p>AfterTable</p></html>";
		Document doc = Jsoup.parse(html);
		SubstitutionPlanParserService svc = new SubstitutionPlanParserService();
		Method m = SubstitutionPlanParserService.class.getDeclaredMethod("parseDocument", Document.class);
		m.setAccessible(true);
		SubstitutionPlan plan = (SubstitutionPlan) m.invoke(svc, doc);
		assertEquals(2, plan.getNews().getNewsItems().size());
		assertEquals("First", plan.getNews().getNewsItems().get(0));
		assertEquals("Second", plan.getNews().getNewsItems().get(1));
		assertFalse(plan.getNews().getNewsItems().contains("AfterTable"));
	}

	@Test
	public void parseDocumentReadsNewsFromInfoTableRows() throws Exception {
		String html = "<html><table class='info'>" + "<tr class='info'><td>Nachrichten zum Tag</td></tr>"
				+ "<tr class='info'><td>Unterrichtsfrei 4-12 Std.</td></tr>"
				+ "<tr class='info'><td>Die Sportflächen sind gesperrt.</td></tr>" + "</table>"
				+ "<table class='mon_list'><tr><td>Table</td></tr></table>" + "</html>";
		Document doc = Jsoup.parse(html);
		SubstitutionPlanParserService svc = new SubstitutionPlanParserService();
		Method m = SubstitutionPlanParserService.class.getDeclaredMethod("parseDocument", Document.class);
		m.setAccessible(true);
		SubstitutionPlan plan = (SubstitutionPlan) m.invoke(svc, doc);
		assertEquals(2, plan.getNews().getNewsItems().size());
		assertEquals("Unterrichtsfrei 4-12 Std.", plan.getNews().getNewsItems().get(0));
		assertEquals("Die Sportflächen sind gesperrt.", plan.getNews().getNewsItems().get(1));
	}

	@Test
	public void parseDocumentWithoutNews() throws Exception {
		String html = "<html><div class='mon_title'>02.02.2024</div>"
				+ "<table class='mon_list'><tr class='list'><th>Klasse</th><th>Vertreter</th></tr>"
				+ "<tr class='list odd'><td>9B</td><td>MrX</td></tr></table></html>";
		Document doc = Jsoup.parse(html);
		SubstitutionPlanParserService svc = new SubstitutionPlanParserService();
		Method m = SubstitutionPlanParserService.class.getDeclaredMethod("parseDocument", Document.class);
		m.setAccessible(true);
		SubstitutionPlan plan = (SubstitutionPlan) m.invoke(svc, doc);
		assertEquals("02.02.2024", plan.getDate());
		assertTrue(plan.getNews().getNewsItems().isEmpty());
		assertEquals(1, plan.getEntries().size());
		assertEquals("MrX", plan.getEntries().get(0).getSubstitute());
	}
}
