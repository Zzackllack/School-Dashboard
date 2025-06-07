package com.schooldashboard.config;

import static org.junit.jupiter.api.Assertions.*;

import java.lang.reflect.Field;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.context.support.StaticApplicationContext;
import org.springframework.mock.web.MockServletContext;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistration;

public class WebConfigTest {

    @Test
    public void resourceHandlerConfigured() throws Exception {
        ResourceHandlerRegistry registry = new ResourceHandlerRegistry(new StaticApplicationContext(), new MockServletContext());
        WebConfig config = new WebConfig();
        config.addResourceHandlers(registry);

        assertTrue(registry.hasMappingForPattern("/css/**"));

        Field regField = ResourceHandlerRegistry.class.getDeclaredField("registrations");
        regField.setAccessible(true);
        @SuppressWarnings("unchecked")
        List<ResourceHandlerRegistration> registrations = (List<ResourceHandlerRegistration>) regField.get(registry);
        ResourceHandlerRegistration registration = registrations.get(0);
        Field locField = ResourceHandlerRegistration.class.getDeclaredField("locationValues");
        locField.setAccessible(true);
        @SuppressWarnings("unchecked")
        List<String> locations = (List<String>) locField.get(registration);
        assertTrue(locations.contains("classpath:/static/css/"));
    }
}
