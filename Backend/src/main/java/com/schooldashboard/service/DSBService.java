package com.schooldashboard.service;

import com.schooldashboard.util.DSBMobile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class DSBService {

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
    @Scheduled(fixedDelay = 900000) // Clear cache every 15 minutes
    public void clearCache() {
        System.out.println("Clearing DSBMobile cache");
    }
}
