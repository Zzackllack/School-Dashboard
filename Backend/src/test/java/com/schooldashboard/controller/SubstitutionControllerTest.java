package com.schooldashboard.controller;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.Collections;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import com.schooldashboard.service.SubstitutionPlanService;
import com.schooldashboard.service.ApiResponseCacheService;

@WebMvcTest(SubstitutionController.class)
public class SubstitutionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SubstitutionPlanService service;

    @MockBean
    private ApiResponseCacheService cacheService;

    @Test
    public void getPlansSuccess() throws Exception {
        when(service.getSubstitutionPlans()).thenReturn(Collections.singletonList(new com.schooldashboard.model.SubstitutionPlan()));
        mockMvc.perform(get("/api/substitution/plans"))
                .andExpect(status().isOk());
    }

    @Test
    public void getPlansEmptyFallsBackToDb() throws Exception {
        when(service.getSubstitutionPlans()).thenReturn(Collections.emptyList());
        when(cacheService.getRawJson("api/substitution/plans")).thenReturn(java.util.Optional.of("[{\"date\":\"d\"}]"));
        mockMvc.perform(get("/api/substitution/plans"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(content().string("[{\"date\":\"d\"}]"));
    }

    @Test
    public void getPlansFailure() throws Exception {
        when(service.getSubstitutionPlans()).thenThrow(new RuntimeException("bad"));
        when(cacheService.getRawJson("api/substitution/plans")).thenReturn(java.util.Optional.empty());
        mockMvc.perform(get("/api/substitution/plans"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("bad")));
    }
}
