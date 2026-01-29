package com.schooldashboard.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.util.DSBMobile;
import java.lang.reflect.Method;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;

@ExtendWith(MockitoExtension.class)
public class DSBServiceTest {

	@Mock
	private DsbClient dsbClient;

	@Mock
	private ApiResponseCacheService cacheService;

	private DSBService service;

	@BeforeEach
	void setUp() {
		service = new DSBService(dsbClient, cacheService);
	}

	@Test
	public void annotationsPresent() throws Exception {
		Method getTT = DSBService.class.getDeclaredMethod("getTimeTables");
		assertNotNull(getTT.getAnnotation(Cacheable.class));
		Method getNews = DSBService.class.getDeclaredMethod("getNews");
		assertNotNull(getNews.getAnnotation(Cacheable.class));
		Method clear = DSBService.class.getDeclaredMethod("clearCache");
		assertNotNull(clear.getAnnotation(CacheEvict.class));
		assertNotNull(clear.getAnnotation(Scheduled.class));
	}

	@Test
	public void getTimeTablesCachesSuccessfulResponse() {
		DSBMobile.TimeTable table = new DSBMobile("u", "p").new TimeTable(
				UUID.fromString("a05eab4c-af64-49f8-b8e6-e608269ebc05"), "group", "2025-01-01", "title", "detail");
		when(dsbClient.getTimeTables()).thenReturn(List.of(table));

		List<DSBMobile.TimeTable> result = service.getTimeTables();

		assertEquals(1, result.size());
		verify(cacheService).store(ApiResponseCacheKeys.DSB_TIMETABLES, List.of(table));
	}

	@Test
  public void getTimeTablesFallsBackToCacheOnFailure() throws Exception {
    when(dsbClient.getTimeTables()).thenThrow(new RuntimeException("offline"));
    ObjectMapper mapper = new ObjectMapper();
    JsonNode cached =
        mapper.readTree(
            "[{\"uuid\":\"a05eab4c-af64-49f8-b8e6-e608269ebc05\",\"groupName\":\"g\",\"date\":\"d\",\"title\":\"t\",\"detail\":\"u\"}]");
    when(cacheService.getJson(ApiResponseCacheKeys.DSB_TIMETABLES)).thenReturn(Optional.of(cached));

    List<DSBMobile.TimeTable> result = service.getTimeTables();

    assertEquals(1, result.size());
    assertEquals("g", result.get(0).getGroupName());
  }

	@Test
  public void getTimeTablesReturnsEmptyWhenNoCache() {
    when(dsbClient.getTimeTables()).thenThrow(new RuntimeException("offline"));
    when(cacheService.getJson(ApiResponseCacheKeys.DSB_TIMETABLES)).thenReturn(Optional.empty());

    List<DSBMobile.TimeTable> result = service.getTimeTables();

    assertTrue(result.isEmpty());
  }
}
