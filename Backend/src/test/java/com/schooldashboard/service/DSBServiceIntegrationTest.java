package com.schooldashboard.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

import com.schooldashboard.util.DSBMobile;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest(properties = "spring.task.scheduling.enabled=false")
public class DSBServiceIntegrationTest {

    @Autowired
    private DSBService dsbService;

    @Autowired
    private ApiResponseCacheService cacheService;

    @MockBean
    private DsbClient dsbClient;

    @Test
    public void returnsCachedTimeTablesWhenClientFails() {
        UUID uuid = UUID.fromString("a05eab4c-af64-49f8-b8e6-e608269ebc05");
        cacheService.store(ApiResponseCacheKeys.DSB_TIMETABLES, List.of(Map.of(
                "uuid", uuid.toString(),
                "groupName", "cached-group",
                "date", "2025-01-01",
                "title", "cached-title",
                "detail", "cached-detail")));
        when(dsbClient.getTimeTables()).thenThrow(new RuntimeException("offline"));

        List<DSBMobile.TimeTable> tables = dsbService.getTimeTables();

        assertEquals(1, tables.size());
        assertEquals("cached-group", tables.get(0).getGroupName());
    }
}
