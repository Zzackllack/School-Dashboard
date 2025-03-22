package com.schooldashboard.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class DailyNews implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String date;
    private List<String> newsItems;
    
    public DailyNews() {
        newsItems = new ArrayList<>();
    }
    
    public DailyNews(String date) {
        this();
        this.date = date;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public List<String> getNewsItems() {
        return newsItems;
    }

    public void setNewsItems(List<String> newsItems) {
        this.newsItems = newsItems;
    }
    
    public void addNewsItem(String newsItem) {
        if (newsItem != null && !newsItem.trim().isEmpty()) {
            this.newsItems.add(newsItem.trim());
        }
    }
}
