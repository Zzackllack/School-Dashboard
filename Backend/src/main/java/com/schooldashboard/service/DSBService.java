package com.schooldashboard.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.schooldashboard.util.DSBMobile;

@Service
public class DSBService {

    private static final Logger logger = LoggerFactory.getLogger(DSBService.class);

    @Value("${dsb.username}")
    private String username;

    @Value("${dsb.password}")
    private String password;

    @Cacheable("timetables")
    public Object getTimeTables() {
        DSBMobile dsbMobile = new DSBMobile(username, password);
        return dsbMobile.getTimeTables();
    }

    @Cacheable("news")
    public Object getNews() {
        DSBMobile dsbMobile = new DSBMobile(username, password);
        return dsbMobile.getNews();
    }

    @CacheEvict(allEntries = true, value = {"timetables", "news"})
    @Scheduled(fixedRate = 300000) // Clear cache every 5 minutes (300000ms)
    public void clearCache() {
        logger.info("Clearing DSBMobile cache at {}", new java.util.Date());
    }
}
