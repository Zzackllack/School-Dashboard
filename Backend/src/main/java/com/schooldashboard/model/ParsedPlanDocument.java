package com.schooldashboard.model;

public class ParsedPlanDocument {

	private final SubstitutionPlan plan;
	private final String rawHtml;

	public ParsedPlanDocument(SubstitutionPlan plan, String rawHtml) {
		this.plan = plan;
		this.rawHtml = rawHtml;
	}

	public SubstitutionPlan getPlan() {
		return plan;
	}

	public String getRawHtml() {
		return rawHtml;
	}
}
