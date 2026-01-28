package com.schooldashboard.model;

public class CalendarEvent {

    private final String summary;
    private final String description;
    private final String location;
    private final long startDate;
    private final long endDate;
    private final boolean allDay;

    public CalendarEvent(String summary, String description, String location, long startDate, long endDate, boolean allDay) {
        this.summary = summary;
        this.description = description;
        this.location = location;
        this.startDate = startDate;
        this.endDate = endDate;
        this.allDay = allDay;
    }

    public String getSummary() {
        return summary;
    }

    public String getDescription() {
        return description;
    }

    public String getLocation() {
        return location;
    }

    public long getStartDate() {
        return startDate;
    }

    public long getEndDate() {
        return endDate;
    }

    public boolean isAllDay() {
        return allDay;
    }
}
