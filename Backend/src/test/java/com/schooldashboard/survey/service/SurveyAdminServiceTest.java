package com.schooldashboard.survey.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
				"Der QR-Code ist zu klein.", "Mila", "hashed-ip");
		when(repository.findInboxItems(eq(SurveyCategory.PROBLEM), eq(display.getId()), eq("qr"), org.mockito.ArgumentMatchers.any(Pageable.class)))
				.thenReturn(List.of(entity));

		List<AdminSurveyListItemResponse> response = service.getInbox(SurveyCategory.PROBLEM, display.getId(), "qr", 50);

		assertEquals(1, response.size());
		assertEquals("Haupteingang", response.getFirst().displayName());
		assertEquals(SurveyCategory.PROBLEM, response.getFirst().category());
	}

	@Test
	public void capsLimitAtMaximum() {
		when(repository.findInboxItems(eq(null), eq(null), eq(null), org.mockito.ArgumentMatchers.any(Pageable.class)))
				.thenReturn(List.of());

		service.getInbox(null, null, null, 500);

		org.mockito.Mockito.verify(repository).findInboxItems(eq(null), eq(null), eq(null),
				org.mockito.ArgumentMatchers.argThat(pageable -> pageable.getPageSize() == 100));
	}
}
