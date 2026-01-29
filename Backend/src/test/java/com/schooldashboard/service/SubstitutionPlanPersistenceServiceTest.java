package com.schooldashboard.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.schooldashboard.model.SubstitutionPlan;
import com.schooldashboard.persistence.entity.SubstitutionPlanDocument;
import com.schooldashboard.persistence.repository.SubstitutionPlanDocumentRepository;
import com.schooldashboard.util.DSBMobile;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

public class SubstitutionPlanPersistenceServiceTest {

	@Test
	public void storeReturnsExistingWhenUnchanged() {
		SubstitutionPlanDocumentRepository repository = mock(SubstitutionPlanDocumentRepository.class);
		SubstitutionPlanPersistenceService service = new SubstitutionPlanPersistenceService(repository);

		UUID uuid = UUID.randomUUID();
		DSBMobile.TimeTable table = new DSBMobile("u", "p").new TimeTable(uuid, "Group A", "2024-01-01", "Title A",
				"http://host/plan-2.html");
		SubstitutionPlan plan = new SubstitutionPlan("2024-01-01", "Plan Title");
		String rawHtml = "<html>same</html>";

		String hash = hash(rawHtml);
		SubstitutionPlanDocument existing = new SubstitutionPlanDocument(uuid.toString(), "Group A", "2024-01-01",
				"plan-2.html", table.getDetail(), rawHtml, hash, Instant.now());
		existing.setSourceDate("2024-01-01");
		existing.setSourceTitle("Title A");
		existing.setPageNumber(2);

		when(repository.findByPlanUuidAndDetailUrl(uuid.toString(), table.getDetail()))
				.thenReturn(Optional.of(existing));

		SubstitutionPlanDocument result = service.store(table, plan, rawHtml);

		assertSame(existing, result);
		verify(repository, never()).save(any());
	}

	@Test
	public void storeUpdatesWhenContentChanges() {
		SubstitutionPlanDocumentRepository repository = mock(SubstitutionPlanDocumentRepository.class);
		SubstitutionPlanPersistenceService service = new SubstitutionPlanPersistenceService(repository);

		UUID uuid = UUID.randomUUID();
		DSBMobile.TimeTable table = new DSBMobile("u", "p").new TimeTable(uuid, "Group A", "2024-01-01", "Title A",
				"http://host/plan-1.html");
		SubstitutionPlan plan = new SubstitutionPlan("2024-01-01", "Plan Title");
		String rawHtml = "<html>new</html>";

		SubstitutionPlanDocument existing = new SubstitutionPlanDocument(uuid.toString(), "Group A", "2024-01-01",
				"plan-1.html", table.getDetail(), "<html>old</html>", hash("<html>old</html>"), Instant.now());

		when(repository.findByPlanUuidAndDetailUrl(uuid.toString(), table.getDetail()))
				.thenReturn(Optional.of(existing));
		when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

		SubstitutionPlanDocument result = service.store(table, plan, rawHtml);

		assertEquals(hash(rawHtml), result.getContentHash());
		assertEquals(rawHtml, result.getRawHtml());
		verify(repository).save(existing);
	}

	@Test
	public void storeAppliesMetadataForNewDocument() {
		SubstitutionPlanDocumentRepository repository = mock(SubstitutionPlanDocumentRepository.class);
		SubstitutionPlanPersistenceService service = new SubstitutionPlanPersistenceService(repository);

		UUID uuid = UUID.randomUUID();
		DSBMobile.TimeTable table = new DSBMobile("u", "p").new TimeTable(uuid, "Group B", "2024-01-01", "Title B",
				"http://host/plan-3.html");
		SubstitutionPlan plan = new SubstitutionPlan("2024-01-01 Seite 3/7", "Plan Title");
		String rawHtml = "<html>plan</html>";

		when(repository.findByPlanUuidAndDetailUrl(uuid.toString(), table.getDetail())).thenReturn(Optional.empty());
		when(repository.findByDetailUrl(table.getDetail())).thenReturn(Optional.empty());
		when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

		SubstitutionPlanDocument result = service.store(table, plan, rawHtml);

		assertNotNull(result);
		assertEquals("Group B", result.getGroupName());
		assertEquals("Title B", result.getSourceTitle());
		assertEquals("2024-01-01", result.getSourceDate());
		assertEquals(Integer.valueOf(3), result.getPageNumber());
		assertEquals(Integer.valueOf(7), result.getPageCount());
	}

	@Test
	public void storeHandlesDuplicateInsert() {
		SubstitutionPlanDocumentRepository repository = mock(SubstitutionPlanDocumentRepository.class);
		SubstitutionPlanPersistenceService service = new SubstitutionPlanPersistenceService(repository);

		UUID uuid = UUID.randomUUID();
		DSBMobile.TimeTable table = new DSBMobile("u", "p").new TimeTable(uuid, "Group A", "2024-01-01", "Title A",
				"http://host/plan-1.html");
		SubstitutionPlan plan = new SubstitutionPlan("2024-01-01", "Plan Title");
		String rawHtml = "<html>plan</html>";

		SubstitutionPlanDocument existing = new SubstitutionPlanDocument(uuid.toString(), "Group A", "2024-01-01",
				"plan-1.html", table.getDetail(), rawHtml, hash(rawHtml), Instant.now());

		when(repository.findByPlanUuidAndDetailUrl(uuid.toString(), table.getDetail())).thenReturn(Optional.empty())
				.thenReturn(Optional.of(existing));
		when(repository.findByDetailUrl(table.getDetail())).thenReturn(Optional.empty());
		when(repository.save(any())).thenThrow(new DataIntegrityViolationException("dup"));

		SubstitutionPlanDocument result = service.store(table, plan, rawHtml);

		assertSame(existing, result);
	}

	private String hash(String content) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hashBytes = digest.digest(content.getBytes(StandardCharsets.UTF_8));
			StringBuilder builder = new StringBuilder();
			for (byte b : hashBytes) {
				builder.append(String.format("%02x", b));
			}
			return builder.toString();
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}
}
