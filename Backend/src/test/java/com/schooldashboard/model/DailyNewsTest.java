package com.schooldashboard.model;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

public class DailyNewsTest {
  @Test
  public void gettersAndAddNewsItem() {
    DailyNews news = new DailyNews();
    news.setDate("today");
    news.addNewsItem(" item1 ");
    news.addNewsItem(" ");
    news.addNewsItem(null);
    assertEquals("today", news.getDate());
    assertEquals(1, news.getNewsItems().size());
    assertEquals("item1", news.getNewsItems().get(0));
  }
}
