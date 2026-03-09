package com.schooldashboard.survey.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.schooldashboard.display.entity.DisplayEntity;
import com.schooldashboard.display.entity.DisplayStatus;
import com.schooldashboard.display.repository.DisplayRepository;
import com.schooldashboard.display.service.TokenHashService;
import com.schooldashboard.survey.dto.CreateSurveySubmissionRequest;
import com.schooldashboard.survey.dto.CreateSurveySubmissionResponse;
import com.schooldashboard.survey.dto.SurveyDisplayContextResponse;
import com.schooldashboard.survey.entity.SurveyCategory;
import com.schooldashboard.survey.entity.SurveySubmissionEntity;
import com.schooldashboard.survey.repository.SurveySubmissionRepository;
import com.schooldashboard.survey.web.SurveyDomainException;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

public class SurveyPublicServiceTest {

	private final DisplayRepository displayRepository = org.mockito.Mockito.mock(DisplayRepository.class);
	private final SurveySubmissionRepository submissionRepository = org.mockito.Mockito
			.mock(SurveySubmissionRepository.class);
	private final TokenHashService tokenHashService = new TokenHashService();
	private final SurveyPublicService service = new SurveyPublicService(displayRepository, submissionRepository,
			tokenHashService);

	@Test
	public void returnsDisplayContextForActiveDisplay() {
		DisplayEntity display = new DisplayEntity("Haupteingang", "haupteingang", "Lobby", "default");
		when(displayRepository.findById(display.getId())).thenReturn(Optional.of(display));

		SurveyDisplayContextResponse response = service.getDisplayContext(display.getId());

		assertEquals(display.getId(), response.displayId());
		assertEquals("Haupteingang", response.displayName());
		assertEquals(true, response.acceptingFeedback());
	}

	@Test
	public void rejectsUnknownDisplayOnSubmit() {
		when(displayRepository.findById("missing")).thenReturn(Optional.empty());

		SurveyDomainException exception = assertThrows(SurveyDomainException.class,
				() -> service.createSubmission(
						new CreateSurveySubmissionRequest("missing", SurveyCategory.PROBLEM,
								"Der QR-Code ist zu klein.", null, null, null),
						"127.0.0.1"));

		assertEquals("SURVEY_DISPLAY_NOT_FOUND", exception.getCode());
	}

	@Test
	public void rejectsInactiveDisplayOnSubmit() {
		DisplayEntity display = new DisplayEntity("Haupteingang", "haupteingang", "Lobby", "default");
		display.setStatus(DisplayStatus.INACTIVE);
		when(displayRepository.findById(display.getId())).thenReturn(Optional.of(display));

		SurveyDomainException exception = assertThrows(SurveyDomainException.class,
				() -> service.createSubmission(new CreateSurveySubmissionRequest(display.getId(),
						SurveyCategory.PROBLEM, "Der QR-Code ist zu klein.", null, null, null), "127.0.0.1"));

		assertEquals("SURVEY_DISPLAY_NOT_ACCEPTING", exception.getCode());
	}

	@Test
	public void hashesSourceIpBeforePersisting() {
		DisplayEntity display = new DisplayEntity("Haupteingang", "haupteingang", "Lobby", "default");
		when(displayRepository.findById(display.getId())).thenReturn(Optional.of(display));
		when(submissionRepository.save(any(SurveySubmissionEntity.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

		CreateSurveySubmissionResponse response = service
				.createSubmission(new CreateSurveySubmissionRequest(display.getId(), SurveyCategory.PROBLEM,
						"Der QR-Code ist zu klein.", "Mila", "10a", true), "127.0.0.1");

		ArgumentCaptor<SurveySubmissionEntity> captor = ArgumentCaptor.forClass(SurveySubmissionEntity.class);
		org.mockito.Mockito.verify(submissionRepository).save(captor.capture());
		assertEquals(response.submissionId(), captor.getValue().getId());
		assertNotEquals("127.0.0.1", captor.getValue().getSourceIpHash());
		assertEquals(64, captor.getValue().getSourceIpHash().length());
		assertEquals("10a", captor.getValue().getSchoolClass());
		assertEquals(true, captor.getValue().isContactAllowed());
	}
}
