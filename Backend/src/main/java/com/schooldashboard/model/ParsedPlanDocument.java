package com.schooldashboard.model;

public class ParsedPlanDocument {

	private final SubstitutionPlan plan;
	private final String rawHtml;
	private final PlanParseDiagnostics diagnostics;

	public ParsedPlanDocument(SubstitutionPlan plan, String rawHtml) {
		this(plan, rawHtml, PlanParseDiagnostics.legacy());
	}

	public ParsedPlanDocument(SubstitutionPlan plan, String rawHtml, PlanParseDiagnostics diagnostics) {
		this.plan = plan;
		this.rawHtml = rawHtml;
		this.diagnostics = diagnostics;
	}

	public SubstitutionPlan getPlan() {
		return plan;
	}

	public String getRawHtml() {
		return rawHtml;
	}

	public PlanParseDiagnostics getDiagnostics() {
		return diagnostics;
	}
}
