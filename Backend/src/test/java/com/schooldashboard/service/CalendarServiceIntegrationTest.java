package com.schooldashboard.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.schooldashboard.model.CalendarEvent;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(properties = "spring.task.scheduling.enabled=false")
public class CalendarServiceIntegrationTest {

  private static final String ICS_DATA =
      String.join(
              "\r\n",
              "BEGIN:VCALENDAR",
              "VERSION:2.0",
              "PRODID:-//GGL//Calendar//EN",
              "BEGIN:VEVENT",
              "UID:future-event",
              "DTSTART:20990105T120000Z",
              "DTEND:20990105T130000Z",
              "SUMMARY:Termin",
              "END:VEVENT",
              "END:VCALENDAR")
          + "\r\n";

  private static HttpServer server;
  private static int port;

  @Autowired private CalendarService calendarService;

  @DynamicPropertySource
  static void registerProperties(DynamicPropertyRegistry registry) throws IOException {
    startServer();
    registry.add("calendar.ics-url", () -> "http://localhost:" + port + "/calendar.ics");
  }

  @AfterAll
  static void stopServer() {
    if (server != null) {
      server.stop(0);
    }
  }

  @Test
  public void fetchesEventsFromIcsEndpoint() {
    List<CalendarEvent> events = calendarService.getUpcomingEvents(5);

    assertEquals(1, events.size());
    assertEquals("Termin", events.get(0).getSummary());
  }

  private static void startServer() throws IOException {
    if (server != null) {
      return;
    }
    server = HttpServer.create(new InetSocketAddress(0), 0);
    port = server.getAddress().getPort();
    server.createContext(
        "/calendar.ics",
        exchange -> {
          byte[] data = ICS_DATA.getBytes(StandardCharsets.UTF_8);
          exchange.getResponseHeaders().add("Content-Type", "text/calendar");
          exchange.sendResponseHeaders(200, data.length);
          java.io.OutputStream outputStream = exchange.getResponseBody();
          outputStream.write(data);
          outputStream.close();
          exchange.close();
        });
    server.start();
  }
}
