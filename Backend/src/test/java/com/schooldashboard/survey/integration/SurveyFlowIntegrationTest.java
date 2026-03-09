package com.schooldashboard.survey.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.display.entity.DisplayEntity;
import com.schooldashboard.display.entity.DisplayStatus;
import com.schooldashboard.display.repository.DisplayRepository;
import com.schooldashboard.security.auth.dto.AdminLoginRequest;
import com.schooldashboard.survey.entity.SurveySubmissionEntity;
import com.schooldashboard.survey.repository.SurveySubmissionRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {"spring.task.scheduling.enabled=false", "dsb.username=test", "dsb.password=test",
		"calendar.ics-url=", "security.admin.bootstrap.enabled=true", "security.admin.bootstrap.username=test-admin",
		"security.admin.bootstrap.password=test-admin-password", "survey.rate-limit.submissions-per-minute=20"})
@AutoConfigureMockMvc
public class SurveyFlowIntegrationTest {

	private static final String ACTIVE_DISPLAY_ID = "11111111-1111-1111-1111-111111111111";
	private static final String INACTIVE_DISPLAY_ID = "22222222-2222-2222-2222-222222222222";

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private DisplayRepository displayRepository;

	@Autowired
	private SurveySubmissionRepository surveySubmissionRepository;

	@BeforeEach
	public void setUp() {
		surveySubmissionRepository.deleteAll();
		displayRepository.deleteAll();

		DisplayEntity activeDisplay = new DisplayEntity("Haupteingang", "haupteingang", "Lobby", "main-profile");
		activeDisplay.setSlug("haupteingang");
		activeDisplay.setThemeId("default");
		setId(activeDisplay, ACTIVE_DISPLAY_ID);
		displayRepository.save(activeDisplay);

		DisplayEntity inactiveDisplay = new DisplayEntity("Nebeneingang", "nebeneingang", "Westfluegel",
				"side-profile");
		inactiveDisplay.setStatus(DisplayStatus.INACTIVE);
		setId(inactiveDisplay, INACTIVE_DISPLAY_ID);
		displayRepository.save(inactiveDisplay);
	}

	@Test
	public void validSubmitIsPersistedAndInboxSupportsFiltering() throws Exception {
		mockMvc.perform(post("/api/surveys/submissions").contentType(MediaType.APPLICATION_JSON)
				.header("X-Forwarded-For", "203.0.113.42").content("""
						{
						  "displayId": "11111111-1111-1111-1111-111111111111",
						  "category": "PROBLEM",
						  "message": "Der QR-Code sollte groesser sein und deutlicher hervorgehoben werden.",
						  "name": "Mila",
						  "schoolClass": "10a",
						  "contactAllowed": true
						}
						""")).andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("RECORDED"));

		List<SurveySubmissionEntity> submissions = surveySubmissionRepository.findAll();
		assertEquals(1, submissions.size());
		SurveySubmissionEntity submission = submissions.getFirst();
		assertEquals("Mila", submission.getSubmitterName());
		assertEquals("10a", submission.getSchoolClass());
		assertEquals(true, submission.isContactAllowed());
		assertNotEquals("203.0.113.42", submission.getSourceIpHash());
		assertEquals(64, submission.getSourceIpHash().length());

		MockHttpSession adminSession = loginAsAdmin();

		mockMvc.perform(get("/api/admin/surveys").session(adminSession).queryParam("category", "PROBLEM")
				.queryParam("displayId", ACTIVE_DISPLAY_ID).queryParam("query", "groesser").queryParam("limit", "10"))
				.andExpect(status().isOk()).andExpect(jsonPath("$[0].displayId").value(ACTIVE_DISPLAY_ID))
				.andExpect(jsonPath("$[0].submitterName").value("Mila"))
				.andExpect(jsonPath("$[0].schoolClass").value("10a"))
				.andExpect(jsonPath("$[0].contactAllowed").value(true))
				.andExpect(jsonPath("$[0].message").value(org.hamcrest.Matchers.containsString("groesser")));
	}

	@Test
	public void unknownDisplayAndInactiveDisplayAreRejected() throws Exception {
		mockMvc.perform(post("/api/surveys/submissions").contentType(MediaType.APPLICATION_JSON).content("""
				{
				  "displayId": "33333333-3333-3333-3333-333333333333",
				  "category": "PROBLEM",
				  "message": "Dieses Display existiert nicht im Backend."
				}
				""")).andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("SURVEY_DISPLAY_NOT_FOUND"));

		mockMvc.perform(post("/api/surveys/submissions").contentType(MediaType.APPLICATION_JSON).content("""
				{
				  "displayId": "22222222-2222-2222-2222-222222222222",
				  "category": "WUNSCH",
				  "message": "Bitte dieses inaktive Display nicht fuer Feedback verwenden."
				}
				""")).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("SURVEY_DISPLAY_NOT_ACCEPTING"));
	}

	@Test
	public void displayContextReflectsWhetherFeedbackIsAccepted() throws Exception {
		mockMvc.perform(get("/api/surveys/displays/{displayId}", ACTIVE_DISPLAY_ID)).andExpect(status().isOk())
				.andExpect(jsonPath("$.acceptingFeedback").value(true))
				.andExpect(jsonPath("$.displayName").value("Haupteingang"));

		mockMvc.perform(get("/api/surveys/displays/{displayId}", INACTIVE_DISPLAY_ID)).andExpect(status().isOk())
				.andExpect(jsonPath("$.acceptingFeedback").value(false));
	}

	private MockHttpSession loginAsAdmin() throws Exception {
		MvcResult result = mockMvc
				.perform(post("/api/admin/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content(
						objectMapper.writeValueAsString(new AdminLoginRequest("test-admin", "test-admin-password"))))
				.andExpect(status().isOk()).andReturn();
		return (MockHttpSession) result.getRequest().getSession(false);
	}

	@SuppressWarnings("unchecked")
	private void setId(DisplayEntity display, String id) {
		try {
			var field = DisplayEntity.class.getDeclaredField("id");
			field.setAccessible(true);
			field.set(display, id);
		} catch (ReflectiveOperationException exception) {
			throw new IllegalStateException(exception);
		}
	}
}
