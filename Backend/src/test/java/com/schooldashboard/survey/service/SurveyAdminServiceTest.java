package com.schooldashboard.survey.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.schooldashboard.display.entity.DisplayEntity;
import com.schooldashboard.survey.dto.AdminSurveyListItemResponse;
import com.schooldashboard.survey.entity.SurveyCategory;
import com.schooldashboard.survey.entity.SurveySubmissionEntity;
import com.schooldashboard.survey.repository.SurveySubmissionRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

public class SurveyAdminServiceTest {

	private final SurveySubmissionRepository repository = org.mockito.Mockito.mock(SurveySubmissionRepository.class);
	private final SurveyAdminService service = new SurveyAdminService(repository);

	@Test
	public void mapsAndFiltersInboxItems() {
		DisplayEntity display = new DisplayEntity("Haupteingang", "haupteingang", "Lobby", "default");
		SurveySubmissionEntity entity = new SurveySubmissionEntity(display, SurveyCategory.PROBLEM,
				"Der QR-Code ist zu klein.", "Mila", "10a", true, "hashed-ip");
		when(repository.findInboxItems(eq(SurveyCategory.PROBLEM), eq(display.getId()),
				org.mockito.ArgumentMatchers.any(Pageable.class))).thenReturn(List.of(entity));

		List<AdminSurveyListItemResponse> response = service.getInbox(SurveyCategory.PROBLEM, display.getId(), "qr",
				50);

		assertEquals(1, response.size());
		assertEquals("Haupteingang", response.getFirst().displayName());
		assertEquals(SurveyCategory.PROBLEM, response.getFirst().category());
		assertEquals("10a", response.getFirst().schoolClass());
		assertEquals(true, response.getFirst().contactAllowed());
	}

	@Test
	public void capsLimitAtMaximum() {
		when(repository.findInboxItems(eq(null), eq(null), org.mockito.ArgumentMatchers.any(Pageable.class)))
				.thenReturn(List.of());

		service.getInbox(null, null, null, 500);

		org.mockito.Mockito.verify(repository).findInboxItems(eq(null), eq(null),
				org.mockito.ArgumentMatchers.argThat(pageable -> pageable.getPageSize() == 100));
	}

	@Test
	public void filtersCaseInsensitivelyInMemoryWhenQueryIsPresent() {
		DisplayEntity firstDisplay = new DisplayEntity("Haupteingang", "haupteingang", "Lobby", "default");
		DisplayEntity secondDisplay = new DisplayEntity("Mensa", "mensa", "Nordfluegel", "default");
		SurveySubmissionEntity matchingEntity = new SurveySubmissionEntity(firstDisplay, SurveyCategory.PROBLEM,
				"Die Anzeige blendet zu schnell um.", "Mila", "10a", true, "hashed-ip");
		SurveySubmissionEntity nonMatchingEntity = new SurveySubmissionEntity(secondDisplay, SurveyCategory.PROBLEM,
				"Alles gut.", "Noah", "9b", false, "other-hash");
		when(repository.findInboxItems(eq(SurveyCategory.PROBLEM), eq(null),
				org.mockito.ArgumentMatchers.any(Pageable.class)))
				.thenReturn(List.of(matchingEntity, nonMatchingEntity));

		List<AdminSurveyListItemResponse> response = service.getInbox(SurveyCategory.PROBLEM, null, "MILA", 10);

		assertEquals(1, response.size());
		assertEquals("Mila", response.getFirst().submitterName());
		org.mockito.Mockito.verify(repository).findInboxItems(eq(SurveyCategory.PROBLEM), eq(null),
				org.mockito.ArgumentMatchers.argThat(Pageable::isUnpaged));
	}

	@Test
	public void appliesLimitAfterInMemoryFiltering() {
		DisplayEntity display = new DisplayEntity("Haupteingang", "haupteingang", "Lobby", "default");
		SurveySubmissionEntity firstEntity = new SurveySubmissionEntity(display, SurveyCategory.PROBLEM,
				"QR Code Problem eins", "Mila", "10a", true, "hash-1");
		SurveySubmissionEntity secondEntity = new SurveySubmissionEntity(display, SurveyCategory.PROBLEM,
				"QR Code Problem zwei", "Noah", "9b", false, "hash-2");
		when(repository.findInboxItems(eq(SurveyCategory.PROBLEM), eq(null),
				org.mockito.ArgumentMatchers.any(Pageable.class))).thenReturn(List.of(firstEntity, secondEntity));

		List<AdminSurveyListItemResponse> response = service.getInbox(SurveyCategory.PROBLEM, null, "qr code", 1);

		assertEquals(1, response.size());
		assertTrue(response.getFirst().message().contains("eins"));
	}
}
