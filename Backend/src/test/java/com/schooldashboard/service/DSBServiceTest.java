package com.schooldashboard.service;

import static org.junit.jupiter.api.Assertions.*;

import java.lang.reflect.Method;

import org.junit.jupiter.api.Test;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;

public class DSBServiceTest {
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
}
