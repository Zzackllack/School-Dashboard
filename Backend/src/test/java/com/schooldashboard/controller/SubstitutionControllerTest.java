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

@WebMvcTest(SubstitutionController.class)
public class SubstitutionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SubstitutionPlanService service;

    @Test
    public void getPlansSuccess() throws Exception {
        when(service.getSubstitutionPlans()).thenReturn(Collections.singletonList(new com.schooldashboard.model.SubstitutionPlan()));
        mockMvc.perform(get("/api/substitution/plans"))
                .andExpect(status().isOk());
    }

    @Test
    public void getPlansFailure() throws Exception {
        when(service.getSubstitutionPlans()).thenThrow(new RuntimeException("bad"));
        mockMvc.perform(get("/api/substitution/plans"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("bad")));
    }
}
