package com.schooldashboard.persistence;

import static org.junit.jupiter.api.Assertions.*;

import com.schooldashboard.persistence.entity.SubstitutionPlanDocument;
import com.schooldashboard.persistence.repository.SubstitutionPlanDocumentRepository;
import java.time.Instant;
import java.util.UUID;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(properties = {"spring.task.scheduling.enabled=false", "dsb.username=foo", "dsb.password=bar"})
public class SubstitutionPlanDocumentIntegrationTest {

	private static final String DB_URL = "jdbc:h2:mem:substitution-doc-it-" + UUID.randomUUID() + ";DB_CLOSE_DELAY=-1";

	@Autowired
	private SubstitutionPlanDocumentRepository repository;

	@Autowired
	private EntityManager entityManager;

	@DynamicPropertySource
	static void registerProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", () -> DB_URL);
	}

	@Test
	public void persistsMetadataFields() {
		SubstitutionPlanDocument doc = new SubstitutionPlanDocument("uuid", "group", "2024-01-01", "title", "detail",
				"html", "hash", Instant.now());
		doc.setSourceDate("source-date");
		doc.setSourceTitle("source-title");
		doc.setPageNumber(2);
		doc.setPageCount(6);

		SubstitutionPlanDocument saved = repository.saveAndFlush(doc);
		entityManager.clear();

		SubstitutionPlanDocument loaded = repository.findById(saved.getId()).orElseThrow();
		assertEquals("source-date", loaded.getSourceDate());
		assertEquals("source-title", loaded.getSourceTitle());
		assertEquals(2, loaded.getPageNumber());
		assertEquals(6, loaded.getPageCount());
	}
}
