package com.schooldashboard.display.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.display.config.DisplayEnrollmentProperties;
import com.schooldashboard.display.dto.DisplaySummaryResponse;
import com.schooldashboard.display.dto.UpdateDisplayRequest;
import com.schooldashboard.display.entity.DisplayEntity;
import com.schooldashboard.display.entity.DisplayStatus;
import com.schooldashboard.display.repository.DisplayEnrollmentCodeRepository;
import com.schooldashboard.display.repository.DisplayEnrollmentRequestRepository;
import com.schooldashboard.display.repository.DisplayRepository;
import com.schooldashboard.display.repository.DisplaySessionRepository;
import com.schooldashboard.display.web.DisplayDomainException;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

public class DisplayEnrollmentServiceThemeValidationTest {

	private DisplayRepository displayRepository;
	private DisplayEnrollmentService service;

	@BeforeEach
	public void setUp() {
		displayRepository = mock(DisplayRepository.class);

		service = new DisplayEnrollmentService(mock(DisplayEnrollmentCodeRepository.class),
				mock(DisplayEnrollmentRequestRepository.class), displayRepository, mock(DisplaySessionRepository.class),
				new DisplayEnrollmentProperties(), mock(TokenHashService.class), mock(RandomTokenService.class),
				mock(SlugService.class), mock(AdminAuditLogService.class), new ObjectMapper());
	}

	@Test
	public void rejectsUnsupportedThemeIdOnUpdate() {
		DisplayEntity display = new DisplayEntity("Lobby", "lobby", "Main Hall", null);
		when(displayRepository.findById("display-1")).thenReturn(Optional.of(display));

		DisplayDomainException exception = assertThrows(DisplayDomainException.class,
				() -> service.updateDisplay("display-1",
						new UpdateDisplayRequest(null, null, null, null, null, "unknown-theme"), "admin-1"));

		assertEquals("DISPLAY_THEME_INVALID", exception.getCode());
	}

	@Test
	public void preservesExistingThemeWhenThemeNotProvided() {
		DisplayEntity display = new DisplayEntity("Lobby", "lobby", "Main Hall", null);
		display.setThemeId("brutalist-high-density");
		when(displayRepository.findById("display-1")).thenReturn(Optional.of(display));
		when(displayRepository.save(any(DisplayEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

		DisplaySummaryResponse response = service.updateDisplay("display-1",
				new UpdateDisplayRequest("Lobby", null, null, null, DisplayStatus.ACTIVE, null), "admin-1");

		assertEquals("brutalist-high-density", response.themeId());
	}
}
