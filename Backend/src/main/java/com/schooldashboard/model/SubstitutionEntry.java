package com.schooldashboard.model;

import java.io.Serializable;

public class SubstitutionEntry implements Serializable {
	private static final long serialVersionUID = 1L;

	private String classes; // Klasse(n)
	private String period; // Stunde
	private String absent; // abwesend
	private String substitute; // Vertreter
	private String originalSubject; // (Fach) - original subject
	private String subject; // Fach - new subject
	private String newRoom; // neuer Raum
	private String type; // Art
	private String comment; // Bemerkung
	private String date; // Date from the plan

	public SubstitutionEntry() {
	}

	// Getters and setters
	public String getClasses() {
		return classes;
	}

	public void setClasses(String classes) {
		this.classes = classes;
	}

	public String getPeriod() {
		return period;
	}

	public void setPeriod(String period) {
		this.period = period;
	}

	public String getAbsent() {
		return absent;
	}

	public void setAbsent(String absent) {
		this.absent = absent;
	}

	public String getSubstitute() {
		return substitute;
	}

	public void setSubstitute(String substitute) {
		this.substitute = substitute;
	}

	public String getOriginalSubject() {
		return originalSubject;
	}

	public void setOriginalSubject(String originalSubject) {
		this.originalSubject = originalSubject;
	}

	public String getSubject() {
		return subject;
	}

	public void setSubject(String subject) {
		this.subject = subject;
	}

	public String getNewRoom() {
		return newRoom;
	}

	public void setNewRoom(String newRoom) {
		this.newRoom = newRoom;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getComment() {
		return comment;
	}

	public void setComment(String comment) {
		this.comment = comment;
	}

	public String getDate() {
		return date;
	}

	public void setDate(String date) {
		this.date = date;
	}
}
