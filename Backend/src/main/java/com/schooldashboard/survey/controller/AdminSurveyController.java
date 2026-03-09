package com.schooldashboard.survey.controller;

import com.schooldashboard.survey.dto.AdminSurveyListItemResponse;
import com.schooldashboard.survey.entity.SurveyCategory;
import com.schooldashboard.survey.service.SurveyAdminService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/surveys")
public class AdminSurveyController {

	private final SurveyAdminService surveyAdminService;

	public AdminSurveyController(SurveyAdminService surveyAdminService) {
		this.surveyAdminService = surveyAdminService;
	}

	@GetMapping
	public List<AdminSurveyListItemResponse> listInbox(@RequestParam(required = false) SurveyCategory category,
			@RequestParam(required = false) String displayId, @RequestParam(required = false) String query,
			@RequestParam(required = false) Integer limit) {
		return surveyAdminService.getInbox(category, displayId, query, limit);
	}
}
