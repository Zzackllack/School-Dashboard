package com.schooldashboard.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.schooldashboard.util.DSBMobile;
import com.schooldashboard.util.DSBMobile.TimeTable;

@Service
public class DsbMobileClient implements DsbClient {

    @Value("${dsb.username}")
    private String username;

    @Value("${dsb.password}")
    private String password;

    @Override
    public List<TimeTable> getTimeTables() {
        return new DSBMobile(username, password).getTimeTables();
    }

    @Override
    public Object getNews() {
        return new DSBMobile(username, password).getNews();
    }
}
