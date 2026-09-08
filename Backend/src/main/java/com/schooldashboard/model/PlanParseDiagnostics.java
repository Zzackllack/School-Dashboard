package com.schooldashboard.model;

import java.util.List;

/**
 * Privacy-safe structural information about one parsed substitution document.
 *
 * <p>
 * The diagnostics deliberately contain no cell values or source URLs. They are
 * used by the refresh service to decide whether a document may replace the
 * current response and by logs to make source-contract drift visible.
 * </p>
 */
public final class PlanParseDiagnostics {

	public enum Format {
		EXPLICIT, GROUPED, EMPTY, UNSUPPORTED
	}

	public enum Status {
		VALID, EMPTY, UNSUPPORTED
	}

	private final Format format;
	private final Status status;
	private final List<String> normalizedHeaders;
	private final List<String> unknownHeaders;
	private final int sourceRows;
	private final int groupRows;
	private final int dataRows;
	private final int validEntries;
	private final int skippedRows;
	private final Integer pageNumber;
	private final Integer pageCount;

	public PlanParseDiagnostics(Format format, Status status, List<String> normalizedHeaders,
			List<String> unknownHeaders, int sourceRows, int groupRows, int dataRows, int validEntries, int skippedRows,
			Integer pageNumber, Integer pageCount) {
		this.format = format;
		this.status = status;
		this.normalizedHeaders = List.copyOf(normalizedHeaders);
		this.unknownHeaders = List.copyOf(unknownHeaders);
		this.sourceRows = sourceRows;
		this.groupRows = groupRows;
		this.dataRows = dataRows;
		this.validEntries = validEntries;
		this.skippedRows = skippedRows;
		this.pageNumber = pageNumber;
		this.pageCount = pageCount;
	}

	public static PlanParseDiagnostics legacy() {
		return new PlanParseDiagnostics(Format.EXPLICIT, Status.VALID, List.of(), List.of(), 0, 0, 0, 0, 0, null, null);
	}

	public Format getFormat() {
		return format;
	}

	public Status getStatus() {
		return status;
	}

	public boolean isPublishable() {
		return status == Status.VALID || status == Status.EMPTY;
	}

	public List<String> getNormalizedHeaders() {
		return normalizedHeaders;
	}

	public List<String> getUnknownHeaders() {
		return unknownHeaders;
	}

	public int getSourceRows() {
		return sourceRows;
	}

	public int getGroupRows() {
		return groupRows;
	}

	public int getDataRows() {
		return dataRows;
	}

	public int getValidEntries() {
		return validEntries;
	}

	public int getSkippedRows() {
		return skippedRows;
	}

	public Integer getPageNumber() {
		return pageNumber;
	}

	public Integer getPageCount() {
		return pageCount;
	}
}
