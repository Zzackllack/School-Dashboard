package com.schooldashboard.service;

import java.util.List;

import com.schooldashboard.util.DSBMobile.TimeTable;

public interface DsbClient {
    List<TimeTable> getTimeTables();

    Object getNews();
}
