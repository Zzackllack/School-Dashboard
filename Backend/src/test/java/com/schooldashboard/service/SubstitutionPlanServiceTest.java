package com.schooldashboard.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import com.schooldashboard.model.SubstitutionPlan;
import com.schooldashboard.util.DSBMobile;
import com.schooldashboard.util.DSBMobile.TimeTable;

public class SubstitutionPlanServiceTest {

    private DSBService dsbService;
    private SubstitutionPlanParserService parser;
    private SubstitutionPlanService service;

    @BeforeEach
    public void setup() {
        dsbService = mock(DSBService.class);
        parser = mock(SubstitutionPlanParserService.class);
        service = new SubstitutionPlanService(dsbService, parser);
    }

    private TimeTable tt(UUID uuid, String group, String detail) {
        return new DSBMobile(""," ").new TimeTable(uuid, group, "", "", detail);
    }

    @Test
    public void updateSubstitutionPlansCombinesAndSorts() {
        UUID u1 = UUID.randomUUID();
        UUID u2 = UUID.randomUUID();
        List<TimeTable> tables = Arrays.asList(
                tt(u1,"heute", "u1-1"),
                tt(u1,"heute", "u1-2"),
                tt(u2,"morgen", "u2")
        );
        when(dsbService.getTimeTables()).thenReturn(tables);

        SubstitutionPlan p1 = new SubstitutionPlan("d1","t1");
        p1.addEntry(new com.schooldashboard.model.SubstitutionEntry());
        p1.getNews().addNewsItem("n1");
        SubstitutionPlan p2 = new SubstitutionPlan("d1","t2");
        p2.addEntry(new com.schooldashboard.model.SubstitutionEntry());
        p2.getNews().addNewsItem("n1");
        p2.getNews().addNewsItem("n2");
        SubstitutionPlan p3 = new SubstitutionPlan("d2","t3");
        p3.addEntry(new com.schooldashboard.model.SubstitutionEntry());

        when(parser.parseSubstitutionPlanFromUrl("u1-1")).thenReturn(p1);
        when(parser.parseSubstitutionPlanFromUrl("u1-2")).thenReturn(p2);
        when(parser.parseSubstitutionPlanFromUrl("u2")).thenReturn(p3);

        service.updateSubstitutionPlans();

        List<SubstitutionPlan> result = service.getSubstitutionPlans();
        assertEquals(2, result.size());
        SubstitutionPlan first = result.get(0);
        assertEquals(1, first.getSortPriority());
        assertEquals(2, first.getEntries().size());
        assertEquals(2, first.getNews().getNewsItems().size());
        SubstitutionPlan second = result.get(1);
        assertEquals(2, second.getSortPriority());
    }

    @Test
    public void updateContinuesOnParserError() {
        UUID u1 = UUID.randomUUID();
        when(dsbService.getTimeTables()).thenReturn(List.of(tt(u1, "heute", "u")));
        when(parser.parseSubstitutionPlanFromUrl("u")).thenThrow(new RuntimeException("err"));
        service.updateSubstitutionPlans();
        assertTrue(service.getSubstitutionPlans().isEmpty());
    }
}
