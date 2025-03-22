package com.schooldashboard.controller;

import com.schooldashboard.service.DSBService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dsb")
public class DSBController {

    private final DSBService dsbService;

    @Autowired
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
