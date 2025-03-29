package com.schooldashboard.controller;

import javax.servlet.RequestDispatcher;
import javax.servlet.http.HttpServletRequest;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request, Model model) {
        // Get error status
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        String errorMessage = (String) request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
        String errorPath = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        
        // Add common error details to model
        model.addAttribute("path", errorPath != null ? errorPath : request.getRequestURI());
        model.addAttribute("timestamp", new java.util.Date());
        
        // Handle specific error codes
        if (status != null) {
            int statusCode = Integer.parseInt(status.toString());
            model.addAttribute("statusCode", statusCode);
            
            if (statusCode == HttpStatus.NOT_FOUND.value()) {
                model.addAttribute("errorTitle", "Page Not Found");
                model.addAttribute("errorMessage", errorMessage != null ? errorMessage : "The page you are looking for might have been removed or is temporarily unavailable");
                return "error/404";
            } else if (statusCode == HttpStatus.INTERNAL_SERVER_ERROR.value()) {
                model.addAttribute("errorTitle", "Internal Server Error");
                model.addAttribute("errorMessage", errorMessage != null ? errorMessage : "The server encountered an unexpected condition that prevented it from fulfilling the request");
                return "error/500";
            } else if (statusCode == HttpStatus.FORBIDDEN.value()) {
                model.addAttribute("errorTitle", "Access Denied");
                model.addAttribute("errorMessage", errorMessage != null ? errorMessage : "You do not have permission to access this resource");
                return "error/403";
            }
        }
        
        // Generic error
        model.addAttribute("errorTitle", "Unexpected Error");
        model.addAttribute("errorMessage", errorMessage != null ? errorMessage : "An unexpected error occurred");
        model.addAttribute("statusCode", status != null ? Integer.parseInt(status.toString()) : 500);
        
        return "error/general";
    }
}
