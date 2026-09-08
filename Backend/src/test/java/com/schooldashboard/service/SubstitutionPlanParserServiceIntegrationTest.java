package com.schooldashboard.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.schooldashboard.model.SubstitutionPlan;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
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
}
