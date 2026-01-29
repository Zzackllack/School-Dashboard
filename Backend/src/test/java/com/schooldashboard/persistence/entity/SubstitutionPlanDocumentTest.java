package com.schooldashboard.persistence.entity;

import static org.junit.jupiter.api.Assertions.*;

import java.time.Instant;
import org.junit.jupiter.api.Test;

public class SubstitutionPlanDocumentTest {

	@Test
	public void constructorSetsFields() {
		Instant now = Instant.now();
		SubstitutionPlanDocument doc = new SubstitutionPlanDocument("uuid", "group", "2024-01-01", "title", "detail",
				"html", "hash", now);

		assertEquals("uuid", doc.getPlanUuid());
		assertEquals("group", doc.getGroupName());
		assertEquals("2024-01-01", doc.getPlanDate());
		assertEquals("title", doc.getTitle());
		assertEquals("detail", doc.getDetailUrl());
		assertEquals("html", doc.getRawHtml());
		assertEquals("hash", doc.getContentHash());
		assertEquals(now, doc.getFetchedAt());
		assertEquals(now, doc.getUpdatedAt());
	}

	@Test
	public void onCreateSetsMissingTimestamps() {
		SubstitutionPlanDocument doc = new SubstitutionPlanDocument("uuid", "group", "2024-01-01", "title", "detail",
				"html", "hash", null);
		doc.setUpdatedAt(null);

		doc.onCreate();

		assertNotNull(doc.getFetchedAt());
		assertEquals(doc.getFetchedAt(), doc.getUpdatedAt());
	}

	@Test
	public void onUpdateRefreshesUpdatedAt() {
		Instant fetched = Instant.parse("2024-01-01T00:00:00Z");
		SubstitutionPlanDocument doc = new SubstitutionPlanDocument("uuid", "group", "2024-01-01", "title", "detail",
				"html", "hash", fetched);
		Instant before = doc.getUpdatedAt();
		doc.onUpdate();
		assertNotNull(doc.getUpdatedAt());
		assertTrue(doc.getUpdatedAt().isAfter(before) || doc.getUpdatedAt().equals(before));
	}

	@Test
	public void setsMetadataFields() {
		SubstitutionPlanDocument doc = new SubstitutionPlanDocument("uuid", "group", "2024-01-01", "title", "detail",
				"html", "hash", Instant.now());
		doc.setSourceDate("source-date");
		doc.setSourceTitle("source-title");
		doc.setPageNumber(2);
		doc.setPageCount(5);

		assertEquals("source-date", doc.getSourceDate());
		assertEquals("source-title", doc.getSourceTitle());
		assertEquals(2, doc.getPageNumber());
		assertEquals(5, doc.getPageCount());
	}
}
