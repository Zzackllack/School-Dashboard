package com.schooldashboard.support;

import com.schooldashboard.display.repository.DisplayEnrollmentCodeRepository;
import com.schooldashboard.display.repository.DisplayEnrollmentRequestRepository;
import com.schooldashboard.display.repository.DisplayRepository;
import com.schooldashboard.display.repository.DisplaySessionRepository;
import com.schooldashboard.survey.repository.SurveySubmissionRepository;
import org.springframework.stereotype.Component;

/**
 * Wipes the display aggregate so integration tests do not leak state into each
 * other.
 *
 * <p>
 * {@code @SpringBootTest} classes that share a configuration share a context,
 * and with it the in-memory database. Rows written by one test class are still
 * present when the next class starts, so a test that calls
 * {@code displayRepository.deleteAll()} trips
 * {@code fk_display_enrollment_request_display} or
 * {@code fk_display_session_display} because earlier classes created displays
 * that are still referenced.
 *
 * <p>
 * The order below is the foreign-key order. {@code display_enrollment_request}
 * references both {@code display} and {@code display_enrollment_code}, so
 * requests go before codes. Adding a table that references {@code display}
 * means adding its delete here too, before {@link DisplayRepository}.
 *
 * <p>
 * A component rather than something each test news up, so the repository wiring
 * lives in one place instead of being copied into every test that needs it.
 */
@Component
public class DisplayFixtureCleaner {

	private final SurveySubmissionRepository surveySubmissionRepository;
	private final DisplayEnrollmentRequestRepository enrollmentRequestRepository;
	private final DisplaySessionRepository displaySessionRepository;
	private final DisplayEnrollmentCodeRepository enrollmentCodeRepository;
	private final DisplayRepository displayRepository;

	public DisplayFixtureCleaner(SurveySubmissionRepository surveySubmissionRepository,
			DisplayEnrollmentRequestRepository enrollmentRequestRepository,
			DisplaySessionRepository displaySessionRepository, DisplayEnrollmentCodeRepository enrollmentCodeRepository,
			DisplayRepository displayRepository) {
		this.surveySubmissionRepository = surveySubmissionRepository;
		this.enrollmentRequestRepository = enrollmentRequestRepository;
		this.displaySessionRepository = displaySessionRepository;
		this.enrollmentCodeRepository = enrollmentCodeRepository;
		this.displayRepository = displayRepository;
	}

	public void clearAll() {
		surveySubmissionRepository.deleteAll();
		enrollmentRequestRepository.deleteAll();
		displaySessionRepository.deleteAll();
		enrollmentCodeRepository.deleteAll();
		displayRepository.deleteAll();
	}
}
