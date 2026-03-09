package com.schooldashboard.survey.dto;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.schooldashboard.survey.entity.SurveyCategory;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.util.Set;
import org.junit.jupiter.api.Test;

public class CreateSurveySubmissionRequestTest {

	private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

	@Test
	public void validRequestPassesValidation() {
		CreateSurveySubmissionRequest request = new CreateSurveySubmissionRequest("display-1", SurveyCategory.PROBLEM,
				"Der QR-Code koennte groesser und besser sichtbar sein.", "Mila", "10a", true);

		assertTrue(validator.validate(request).isEmpty());
	}

	@Test
	public void emptyMessageFailsValidation() {
		CreateSurveySubmissionRequest request = new CreateSurveySubmissionRequest("display-1", SurveyCategory.WUNSCH,
				"   ", null, null, null);

		Set<String> messages = validator.validate(request).stream().map(violation -> violation.getMessage())
				.collect(java.util.stream.Collectors.toSet());

		assertEquals(Set.of("Nachricht ist erforderlich",
				"Nachricht muss zwischen 10 und 2000 Zeichen lang sein"), messages);
	}

	@Test
	public void nameLongerThanMaximumFailsValidation() {
		String longName = "a".repeat(161);
		CreateSurveySubmissionRequest request = new CreateSurveySubmissionRequest("display-1",
				SurveyCategory.ALLGEMEINES_FEEDBACK, "Die Seite funktioniert insgesamt gut und ist hilfreich.", longName,
				null, null);

		Set<String> messages = validator.validate(request).stream().map(violation -> violation.getMessage())
				.collect(java.util.stream.Collectors.toSet());

		assertEquals(Set.of("Name darf maximal 160 Zeichen lang sein"), messages);
	}

	@Test
	public void classLongerThanMaximumFailsValidation() {
		String longClass = "a".repeat(41);
		CreateSurveySubmissionRequest request = new CreateSurveySubmissionRequest("display-1", SurveyCategory.PROBLEM,
				"Die Rueckmeldung ist lang genug fuer die Validierung.", null, longClass, null);

		Set<String> messages = validator.validate(request).stream().map(violation -> violation.getMessage())
				.collect(java.util.stream.Collectors.toSet());

		assertEquals(Set.of("Klasse darf maximal 40 Zeichen lang sein"), messages);
	}
}
