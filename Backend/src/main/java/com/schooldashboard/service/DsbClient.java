package com.schooldashboard.service;

import com.schooldashboard.util.DSBMobile.TimeTable;
import java.util.List;

public interface DsbClient {
	List<TimeTable> getTimeTables();

	Object getNews();
}
