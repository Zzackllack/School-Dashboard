package com.schooldashboard.controller;

import static org.junit.jupiter.api.Assertions.*;

import javax.servlet.RequestDispatcher;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.ui.ExtendedModelMap;
import org.springframework.ui.Model;
import org.springframework.mock.web.MockHttpServletRequest;

public class CustomErrorControllerTest {
    private CustomErrorController controller;

    @BeforeEach
    public void setup() {
        controller = new CustomErrorController();
    }

    private String call(int statusCode, String path, String message, Model model) {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setAttribute(RequestDispatcher.ERROR_STATUS_CODE, statusCode);
        req.setAttribute(RequestDispatcher.ERROR_REQUEST_URI, path);
        req.setAttribute(RequestDispatcher.ERROR_MESSAGE, message);
        return controller.handleError(req, model);
    }

    @Test
    public void returns404View() {
        Model model = new ExtendedModelMap();
        String view = call(404, "/missing", "not here", model);
        assertEquals("error/404", view);
        assertEquals("/missing", model.getAttribute("path"));
        assertEquals(404, model.getAttribute("statusCode"));
        assertEquals("Page Not Found", model.getAttribute("errorTitle"));
        assertTrue(model.getAttribute("errorMessage").toString().contains("not here"));
    }

    @Test
    public void returns500View() {
        Model model = new ExtendedModelMap();
        String view = call(500, "/boom", "kaboom", model);
        assertEquals("error/500", view);
        assertEquals(500, model.getAttribute("statusCode"));
        assertEquals("Internal Server Error", model.getAttribute("errorTitle"));
    }

    @Test
    public void returns403View() {
        Model model = new ExtendedModelMap();
        String view = call(403, "/denied", null, model);
        assertEquals("error/403", view);
        assertEquals("Access Denied", model.getAttribute("errorTitle"));
        assertEquals(403, model.getAttribute("statusCode"));
    }

    @Test
    public void returnsGeneralViewForOthers() {
        Model model = new ExtendedModelMap();
        String view = call(418, "/teapot", "short", model);
        assertEquals("error/general", view);
        assertEquals(418, model.getAttribute("statusCode"));
        assertEquals("Unexpected Error", model.getAttribute("errorTitle"));
    }
}
