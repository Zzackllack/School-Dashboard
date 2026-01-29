package com.schooldashboard.model;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

public class SubstitutionPlanTest {
	@Test
	public void planPropertiesAndAddEntry() {
		SubstitutionPlan plan = new SubstitutionPlan("d", "t");
		SubstitutionEntry entry = new SubstitutionEntry();
		plan.addEntry(entry);
		assertEquals("d", plan.getDate());
		assertEquals("t", plan.getTitle());
		assertEquals(1, plan.getEntries().size());
		assertSame(entry, plan.getEntries().get(0));
		plan.setSortPriority(2);
		assertEquals(2, plan.getSortPriority());
	}
}
