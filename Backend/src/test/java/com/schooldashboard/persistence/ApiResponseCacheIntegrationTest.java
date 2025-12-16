package com.schooldashboard.persistence;

import static org.junit.jupiter.api.Assertions.*;

import com.schooldashboard.service.ApiResponseCacheKeys;
import com.schooldashboard.service.ApiResponseCacheService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = "spring.task.scheduling.enabled=false")
public class ApiResponseCacheIntegrationTest {

    @Autowired
    private ApiResponseCacheService service;

    @Test
    public void storesAndReadsJsonBody() {
        service.store(ApiResponseCacheKeys.DSB_TIMETABLES, java.util.List.of("ok"));
        assertTrue(service.getRawJson(ApiResponseCacheKeys.DSB_TIMETABLES).isPresent());
        assertEquals("[\"ok\"]", service.getRawJson(ApiResponseCacheKeys.DSB_TIMETABLES).get());
    }
}
