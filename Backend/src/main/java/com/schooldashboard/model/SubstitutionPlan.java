package com.schooldashboard.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class SubstitutionPlan implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String date;
    private String title;
    private List<SubstitutionEntry> entries;
    private DailyNews news; // Added field for daily news
    private int sortPriority = Integer.MAX_VALUE; // For ordering plans (1=heute, 2=morgen, etc.)
    
    public SubstitutionPlan() {
        entries = new ArrayList<>();
        news = new DailyNews();
    }
    
    public SubstitutionPlan(String date, String title) {
        this();
        this.date = date;
        this.title = title;
        this.news.setDate(date);
    }

    // Getters and setters
    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public List<SubstitutionEntry> getEntries() {
        return entries;
    }

    public void setEntries(List<SubstitutionEntry> entries) {
        this.entries = entries;
    }
    
    public void addEntry(SubstitutionEntry entry) {
        this.entries.add(entry);
    }

    public DailyNews getNews() {
        return news;
    }

    public void setNews(DailyNews news) {
        this.news = news;
    }
    
    public int getSortPriority() {
        return sortPriority;
    }
    
    public void setSortPriority(int sortPriority) {
        this.sortPriority = sortPriority;
    }
}
