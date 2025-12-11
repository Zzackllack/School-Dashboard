package com.schooldashboard.controller;

import com.schooldashboard.service.DSBService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dsb")
public class DSBController {

    private final DSBService dsbService;

    public DSBController(DSBService dsbService) {
        this.dsbService = dsbService;
    }

    @GetMapping("/timetables")
    public ResponseEntity<?> getTimeTables() {
        try {
            return ResponseEntity.ok(dsbService.getTimeTables());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching timetables: " + e.getMessage());
        }
    }

    @GetMapping("/news")
    public ResponseEntity<?> getNews() {
        try {
            return ResponseEntity.ok(dsbService.getNews());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching news: " + e.getMessage());
        }
    }
}
