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

import com.schooldashboard.service.DSBService;

@WebMvcTest(DSBController.class)
public class DSBControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DSBService dsbService;

    @Test
    public void getTimeTablesSuccess() throws Exception {
        when(dsbService.getTimeTables()).thenReturn(Collections.singletonList("ok"));
        mockMvc.perform(get("/api/dsb/timetables"))
                .andExpect(status().isOk())
                .andExpect(content().string("[\"ok\"]"));
    }

    @Test
    public void getTimeTablesFailure() throws Exception {
        when(dsbService.getTimeTables()).thenThrow(new RuntimeException("fail"));
        mockMvc.perform(get("/api/dsb/timetables"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("fail")));
    }

    @Test
    public void getNewsSuccess() throws Exception {
        when(dsbService.getNews()).thenReturn(Collections.singletonList("n"));
        mockMvc.perform(get("/api/dsb/news"))
                .andExpect(status().isOk())
                .andExpect(content().string("[\"n\"]"));
    }

    @Test
    public void getNewsFailure() throws Exception {
        when(dsbService.getNews()).thenThrow(new RuntimeException("no"));
        mockMvc.perform(get("/api/dsb/news"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("no")));
    }
}
