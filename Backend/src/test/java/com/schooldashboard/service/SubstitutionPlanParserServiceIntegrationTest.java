package com.schooldashboard.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.schooldashboard.model.SubstitutionPlan;
import com.schooldashboard.util.DSBMobile;
import com.schooldashboard.util.DSBMobile.TimeTable;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {"spring.task.scheduling.enabled=false"})
public class SubstitutionPlanParserServiceIntegrationTest {

	private static HttpServer server;
	private static String baseUrl;

	private static final String HTML = "<html>" + "<table class='info'>"
			+ "<tr class='info'><td>Nachrichten zum Tag</td></tr>"
			+ "<tr class='info'><td>Unterrichtsfrei 4-12 Std.</td></tr>"
			+ "<tr class='info'><td>Die Sportflächen sind gesperrt.</td></tr>" + "</table>"
			+ "<table class='mon_list'><tr><td>Table</td></tr></table>" + "</html>";

	private static final String GROUPED_HTML = "<html><div class='mon_title'>16.09.2026 Mittwoch</div>"
			+ "<table class='mon_list'><tr class='list'><th>Stunde</th><th>Vertreter</th><th>Fach</th>"
			+ "<th>Raum</th><th>Art</th><th>Text</th></tr>"
			+ "<tr class='list odd'><td class='inline_header' colspan='6'>08b Oberstufe</td></tr>"
			+ "<tr class='list even'><td>4</td><td>Nguyen</td><td>Mathe</td><td>R-101</td><td>Vertr.</td>"
			+ "<td>Material</td></tr></table></html>";

	private static final String EXPLICIT_MIXED_HTML = "<html><div class='mon_title'>19.09.2026</div>"
			+ "<table class='mon_list'><tr class='list'><th>Klasse</th><th>Stunde</th><th>Text</th></tr>"
			+ "<tr class='list odd'><td></td><td>1</td><td>orphan</td></tr>"
			+ "<tr class='list even'><td>10a</td><td>2</td><td>valid</td></tr></table></html>";

	private static final String GROUPED_INVALID_HTML = "<html><div class='mon_title'>19.09.2026</div>"
			+ "<table class='mon_list'><tr class='list'><th>Stunde</th><th>Text</th></tr>"
			+ "<tr class='list odd'><td class='inline_header' colspan='2'>10a</td></tr>"
			+ "<tr class='list even'><td>1</td><td>valid</td></tr>"
			+ "<tr class='list odd'><td class='inline_header' colspan='2'> </td></tr>"
			+ "<tr class='list even'><td>2</td><td>orphan</td></tr></table></html>";

	@Autowired
	private SubstitutionPlanParserService parserService;

	@org.springframework.test.context.bean.override.mockito.MockitoBean
	private DsbClient dsbClient;

	@BeforeAll
	public static void startServer() throws IOException {
		server = HttpServer.create(new InetSocketAddress(0), 0);
		server.createContext("/plan", e -> {
			byte[] htmlBytes = HTML.getBytes(StandardCharsets.UTF_8);
			e.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
			e.sendResponseHeaders(200, htmlBytes.length);
			try (OutputStream os = e.getResponseBody()) {
				os.write(htmlBytes);
			}
		});
		server.createContext("/grouped", e -> {
			byte[] htmlBytes = GROUPED_HTML.getBytes(StandardCharsets.UTF_8);
			e.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
			e.sendResponseHeaders(200, htmlBytes.length);
			try (OutputStream os = e.getResponseBody()) {
				os.write(htmlBytes);
			}
		});
		server.createContext("/explicit-mixed", e -> {
			byte[] htmlBytes = EXPLICIT_MIXED_HTML.getBytes(StandardCharsets.UTF_8);
			e.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
			e.sendResponseHeaders(200, htmlBytes.length);
			try (OutputStream os = e.getResponseBody()) {
				os.write(htmlBytes);
			}
		});
		server.createContext("/grouped-invalid", e -> {
			byte[] htmlBytes = GROUPED_INVALID_HTML.getBytes(StandardCharsets.UTF_8);
			e.getResponseHeaders().set("Content-Type", "text/html; charset=utf-8");
			e.sendResponseHeaders(200, htmlBytes.length);
			try (OutputStream os = e.getResponseBody()) {
				os.write(htmlBytes);
			}
		});
		server.start();
		baseUrl = "http://localhost:" + server.getAddress().getPort() + "/plan";
	}

	@AfterAll
	public static void stopServer() {
		server.stop(0);
	}

	@Test
	public void parseFromUrlReadsNewsFromInfoTableRows() {
		SubstitutionPlan plan = parserService.parseSubstitutionPlanFromUrl(baseUrl);
		assertEquals(2, plan.getNews().getNewsItems().size());
		assertEquals("Unterrichtsfrei 4-12 Std.", plan.getNews().getNewsItems().get(0));
		assertEquals("Die Sportflächen sind gesperrt.", plan.getNews().getNewsItems().get(1));
	}

	@Test
	public void parseFromUrlReadsGroupedRowsOverHttp() {
		SubstitutionPlan plan = parserService
				.parseSubstitutionPlanFromUrl(baseUrl.substring(0, baseUrl.lastIndexOf('/')) + "/grouped");

		assertEquals(1, plan.getEntries().size());
		assertEquals("8b", plan.getEntries().get(0).getClasses());
		assertEquals("Material", plan.getEntries().get(0).getComment());
		assertTrue(plan.getEntries().get(0).getClasses() != null);
	}

	@Autowired
	private SubstitutionPlanService substitutionPlanService;

	@Autowired
	private DSBService dsbService;

	@Test
	public void publishPathKeepsValidExplicitRowsAfterGroupedStructuralFailure() {
		UUID explicitUuid = UUID.randomUUID();
		UUID groupedUuid = UUID.randomUUID();
		when(dsbClient.getTimeTables()).thenReturn(List.of(timeTable(explicitUuid, "/explicit-mixed")))
				.thenReturn(List.of(timeTable(groupedUuid, "/grouped-invalid")));

		dsbService.clearCache();
		substitutionPlanService.updateSubstitutionPlans();
		assertEquals(1, substitutionPlanService.getSubstitutionPlans().size());
		assertEquals("10a",
				substitutionPlanService.getSubstitutionPlans().getFirst().getEntries().getFirst().getClasses());

		dsbService.clearCache();
		substitutionPlanService.updateSubstitutionPlans();

		assertEquals(1, substitutionPlanService.getSubstitutionPlans().size());
		assertEquals("10a",
				substitutionPlanService.getSubstitutionPlans().getFirst().getEntries().getFirst().getClasses());
		assertEquals("2",
				substitutionPlanService.getSubstitutionPlans().getFirst().getEntries().getFirst().getPeriod());
	}

	private static TimeTable timeTable(UUID uuid, String path) {
		String detailUrl = baseUrl.substring(0, baseUrl.lastIndexOf('/')) + path;
		return new DSBMobile("", "").new TimeTable(uuid, "heute", "", "", detailUrl);
	}
}
