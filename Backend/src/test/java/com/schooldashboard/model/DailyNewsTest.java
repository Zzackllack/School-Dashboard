package com.schooldashboard.model;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import org.junit.jupiter.api.Test;

public class DailyNewsTest {

	@Test
	public void defaultConstructorInitializesList() {
		DailyNews news = new DailyNews();
		assertNotNull(news.getNewsItems());
		assertTrue(news.getNewsItems().isEmpty());
	}

	@Test
	public void setNewsItemsNullCreatesEmptyList() {
		DailyNews news = new DailyNews();
		news.setNewsItems(null);
		assertNotNull(news.getNewsItems());
		assertTrue(news.getNewsItems().isEmpty());
	}

	@Test
	public void addNewsItemTrimsAndRejectsEmpty() {
		DailyNews news = new DailyNews("2024-01-01");
		news.addNewsItem("  Announcement  ");
		news.addNewsItem("   ");
		assertEquals(List.of("Announcement"), news.getNewsItems());
	}

	@Test
	public void setDateUpdatesValue() {
		DailyNews news = new DailyNews();
		news.setDate("2024-01-02");
		assertEquals("2024-01-02", news.getDate());
	}
}
