package com.schooldashboard.model;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

public class SubstitutionEntryTest {
    @Test
    public void gettersAndSetters() {
        SubstitutionEntry e = new SubstitutionEntry();
        e.setClasses("A");
        e.setPeriod("1");
        e.setAbsent("ab");
        e.setSubstitute("sub");
        e.setOriginalSubject("orig");
        e.setSubject("subj");
        e.setNewRoom("R");
        e.setType("t");
        e.setComment("c");
        e.setDate("d");
        assertEquals("A", e.getClasses());
        assertEquals("1", e.getPeriod());
        assertEquals("ab", e.getAbsent());
        assertEquals("sub", e.getSubstitute());
        assertEquals("orig", e.getOriginalSubject());
        assertEquals("subj", e.getSubject());
        assertEquals("R", e.getNewRoom());
        assertEquals("t", e.getType());
        assertEquals("c", e.getComment());
        assertEquals("d", e.getDate());
    }
}
