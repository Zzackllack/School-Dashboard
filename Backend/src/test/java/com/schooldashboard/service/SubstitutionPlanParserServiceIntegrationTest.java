package com.schooldashboard.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.schooldashboard.model.SubstitutionPlan;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
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

	@Autowired
	private SubstitutionPlanParserService parserService;

	@BeforeAll
	public static void startServer() throws IOException {
		server = HttpServer.create(new InetSocketAddress(0), 0);
		server.createContext("/plan", e -> {
			e.sendResponseHeaders(200, HTML.getBytes().length);
			try (OutputStream os = e.getResponseBody()) {
				os.write(HTML.getBytes());
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
}
