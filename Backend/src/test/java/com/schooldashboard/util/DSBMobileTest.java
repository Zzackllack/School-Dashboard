package com.schooldashboard.util;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.sun.net.httpserver.HttpServer;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.reflect.Method;
import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

public class DSBMobileTest {

	private static class ConnectionDSBMobile extends DSBMobile {
		private final HttpURLConnection connection;
		private final URL endpoint;

		ConnectionDSBMobile(HttpURLConnection connection, URL endpoint) {
			super("u", "p");
			this.connection = connection;
			this.endpoint = endpoint;
		}

		@Override
		HttpURLConnection openConnection(URL url) {
			return connection;
		}

		@Override
		URL getEndpointUrl() {
			return endpoint;
		}
	}

	private static class MockDSBMobile extends DSBMobile {
		private final JsonObject data;

		MockDSBMobile(JsonObject data) {
			super("u", "p");
			this.data = data;
		}

		@Override
		public JsonObject pullData() {
			return data;
		}
	}

	private JsonObject createData() {
		JsonObject childTable = new JsonObject();
		childTable.addProperty("Id", UUID.randomUUID().toString());
		childTable.addProperty("Title", "grp");
		childTable.addProperty("Date", "2024-01-01");
		JsonObject detailChild = new JsonObject();
		detailChild.addProperty("Title", "t1");
		detailChild.addProperty("Detail", "d1");
		JsonArray childArr = new JsonArray();
		childArr.add(detailChild);
		childTable.add("Childs", childArr);

		JsonObject root = new JsonObject();
		JsonArray rootChilds = new JsonArray();
		rootChilds.add(childTable);
		root.add("Childs", rootChilds);

		JsonObject planObj = new JsonObject();
		planObj.addProperty("Title", "Pläne");
		planObj.add("Root", root);
		JsonArray plansChild = new JsonArray();
		plansChild.add(planObj);

		JsonObject newsItem = new JsonObject();
		newsItem.addProperty("Id", UUID.randomUUID().toString());
		newsItem.addProperty("Date", "2024-01-01");
		newsItem.addProperty("Title", "n1");
		newsItem.addProperty("Detail", "d2");
		JsonObject newsRoot = new JsonObject();
		JsonArray newsChilds = new JsonArray();
		newsChilds.add(newsItem);
		newsRoot.add("Childs", newsChilds);
		JsonObject newsObj = new JsonObject();
		newsObj.addProperty("Title", "News");
		newsObj.add("Root", newsRoot);
		plansChild.add(newsObj);

		JsonObject content = new JsonObject();
		content.addProperty("Title", "Inhalte");
		content.add("Childs", plansChild);
		JsonArray menu = new JsonArray();
		menu.add(content);

		JsonObject main = new JsonObject();
		main.addProperty("Resultcode", 0);
		main.add("ResultMenuItems", menu);
		return main;
	}

	@Test
	public void getTimeTablesParsesData() {
		MockDSBMobile mobile = new MockDSBMobile(createData());
		List<DSBMobile.TimeTable> tables = mobile.getTimeTables();
		assertEquals(1, tables.size());
		assertEquals("t1", tables.get(0).getTitle());
	}

	@Test
	public void getNewsParsesData() {
		MockDSBMobile mobile = new MockDSBMobile(createData());
		List<DSBMobile.News> news = mobile.getNews();
		assertEquals(1, news.size());
		assertEquals("n1", news.get(0).getTitle());
	}

	@Test
	public void helpersViaReflection() throws Exception {
		DSBMobile mobile = new DSBMobile("u", "p");
		Method unescape = DSBMobile.class.getDeclaredMethod("unescapeString", String.class);
		unescape.setAccessible(true);
		String result = (String) unescape.invoke(mobile, "Line\\nTab\\tä");
		assertEquals("Line\nTab\tä", result);

		Method format = DSBMobile.class.getDeclaredMethod("getFormattedTime", java.util.Date.class);
		format.setAccessible(true);
		java.util.Date d = new java.util.Date(0);
		String formatted = (String) format.invoke(mobile, d);
		java.text.SimpleDateFormat f = new java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ",
				java.util.Locale.ENGLISH);
		assertEquals(f.format(d), formatted);

		Method find = DSBMobile.class.getDeclaredMethod("findJsonObjectByTitle", JsonArray.class, String.class);
		find.setAccessible(true);
		JsonArray arr = new JsonArray();
		JsonObject one = new JsonObject();
		one.addProperty("Title", "a");
		arr.add(one);
		assertEquals(one, find.invoke(mobile, arr, "a"));
	}

	@Test
	public void pullDataAppliesTimeoutsAndClosesResources() throws Exception {
		HttpURLConnection connection = mock(HttpURLConnection.class);
		ByteArrayOutputStream outputStream = spy(new ByteArrayOutputStream());
		String payload = "{\"d\":\"" + Base64.encode("{\\\"Result\\\":\\\"ok\\\"}") + "\"}";
		InputStream inputStream = spy(new ByteArrayInputStream(payload.getBytes(StandardCharsets.UTF_8)));

		when(connection.getOutputStream()).thenReturn(outputStream);
		when(connection.getInputStream()).thenReturn(inputStream);

		DSBMobile mobile = new ConnectionDSBMobile(connection, new URL("http://localhost/test"));
		JsonObject result = mobile.pullData();

		assertEquals("ok", result.get("Result").getAsString());
		verify(connection).setConnectTimeout(5000);
		verify(connection).setReadTimeout(10000);
		verify(outputStream).close();
		verify(inputStream).close();
		verify(connection).disconnect();
	}

	@Test
	public void pullDataParsesResponseFromServer() throws Exception {
		String payload = "{\"d\":\"" + Base64.encode("{\\\"Result\\\":\\\"ok\\\"}") + "\"}";
		HttpServer server = HttpServer.create(new InetSocketAddress(0), 0);
		server.createContext("/test", exchange -> {
			byte[] bytes = payload.getBytes(StandardCharsets.UTF_8);
			exchange.sendResponseHeaders(200, bytes.length);
			try (OutputStream out = exchange.getResponseBody()) {
				out.write(bytes);
			}
		});
		server.start();

		try {
			URL endpoint = new URL("http://localhost:" + server.getAddress().getPort() + "/test");
			DSBMobile mobile = new DSBMobile("u", "p") {
				@Override
				URL getEndpointUrl() {
					return endpoint;
				}
			};
			JsonObject result = mobile.pullData();
			assertEquals("ok", result.get("Result").getAsString());
		} finally {
			server.stop(0);
		}
	}
}
