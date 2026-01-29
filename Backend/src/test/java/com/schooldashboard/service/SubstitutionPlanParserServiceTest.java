package com.schooldashboard.service;

import static org.junit.jupiter.api.Assertions.*;

import com.schooldashboard.model.SubstitutionPlan;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.lang.reflect.Method;
import java.net.InetSocketAddress;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

public class SubstitutionPlanParserServiceTest {

  private static HttpServer server;
  private static String baseUrl;

  private static final String HTML =
      "<html><div class='mon_title'>01.01.2024</div>"
          + "<table class='info'><tr class='info'>Info1</tr><tr class='info'>Info2</tr></table>"
          + "<h2>Nachrichten zum Tag</h2><p>News1</p><p>News2</p>"
          + "<table class='mon_list'><tr class='list'><th>Klasse</th><th>Stunde</th><th>Bemerkung</th></tr>"
          + "<tr class='list odd'><td>10A</td><td>1</td><td>Bem</td></tr></table></html>";

  @BeforeAll
  public static void startServer() throws IOException {
    server = HttpServer.create(new InetSocketAddress(0), 0);
    server.createContext(
        "/plan",
        e -> {
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
  public void parseFromUrl() {
    SubstitutionPlanParserService svc = new SubstitutionPlanParserService();
    SubstitutionPlan plan = svc.parseSubstitutionPlanFromUrl(baseUrl);
    assertEquals("01.01.2024", plan.getDate());
    assertEquals("Info1 Info2", plan.getTitle());
    assertEquals(1, plan.getEntries().size());
    assertEquals("10A", plan.getEntries().get(0).getClasses());
  }

  @Test
  public void parseDocumentWithoutNews() throws Exception {
    String html =
        "<html><div class='mon_title'>02.02.2024</div>"
            + "<table class='mon_list'><tr class='list'><th>Klasse</th><th>Vertreter</th></tr>"
            + "<tr class='list odd'><td>9B</td><td>MrX</td></tr></table></html>";
    Document doc = Jsoup.parse(html);
    SubstitutionPlanParserService svc = new SubstitutionPlanParserService();
    Method m =
        SubstitutionPlanParserService.class.getDeclaredMethod("parseDocument", Document.class);
    m.setAccessible(true);
    SubstitutionPlan plan = (SubstitutionPlan) m.invoke(svc, doc);
    assertEquals("02.02.2024", plan.getDate());
    assertTrue(plan.getNews().getNewsItems().isEmpty());
    assertEquals(1, plan.getEntries().size());
    assertEquals("MrX", plan.getEntries().get(0).getSubstitute());
  }
}
