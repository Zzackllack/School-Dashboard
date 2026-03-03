package com.schooldashboard.display.integration;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.display.dto.ApproveEnrollmentRequest;
import com.schooldashboard.display.dto.CreateEnrollmentCodeRequest;
import com.schooldashboard.display.dto.CreateEnrollmentRequest;
import com.schooldashboard.display.dto.RejectEnrollmentRequest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {"spring.task.scheduling.enabled=false", "display.admin-auth.api-token=test-admin-token", "display.admin-auth.api-password=test-admin-pin",
		"display.enrollment.code-ttl-seconds=900", "display.enrollment.request-ttl-seconds=900",
		"display.enrollment.session-ttl-seconds=3600", "dsb.username=test", "dsb.password=test", "calendar.ics-url="})
@AutoConfigureMockMvc
public class DisplayEnrollmentFlowIntegrationTest {

	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private ObjectMapper objectMapper;

	@Test
	public void enrollApproveValidateAndRevokeFlowWorks() throws Exception {
		Map<String, Object> createdCode = readMap(mockMvc
				.perform(post("/api/admin/displays/enrollment-codes").header("X-Admin-Token", "test-admin-token").header("X-Admin-Password", "test-admin-pin")
						.header("X-Admin-Id", "integration-admin").contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CreateEnrollmentCodeRequest(300, 3))))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString());

		Map<String, Object> createEnrollmentResponse = readMap(mockMvc
				.perform(post("/api/displays/enrollments").contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CreateEnrollmentRequest(
								asString(createdCode, "code"), "Main Hall Screen", Map.of("userAgent", "kiosk")))))
				.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
		assertEquals("PENDING", asString(createEnrollmentResponse, "status"));

		String requestId = asString(createEnrollmentResponse, "requestId");
		Map<String, Object> pendingStatusResponse = readMap(
				mockMvc.perform(get("/api/displays/enrollments/{requestId}", requestId)).andExpect(status().isOk())
						.andReturn().getResponse().getContentAsString());
		assertEquals("PENDING", asString(pendingStatusResponse, "status"));

		Map<String, Object> approveResponse = readMap(mockMvc
				.perform(post("/api/admin/displays/enrollments/{requestId}/approve", requestId)
						.header("X-Admin-Token", "test-admin-token").header("X-Admin-Password", "test-admin-pin").header("X-Admin-Id", "integration-admin")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(
								new ApproveEnrollmentRequest("main-profile", "Main Hall", null, null))))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
		assertEquals("APPROVED", asString(approveResponse, "status"));
		assertNotNull(asString(approveResponse, "displayId"));
		assertNotNull(asString(approveResponse, "displaySessionToken"));

		Map<String, Object> approvedStatusResponse = readMap(
				mockMvc.perform(get("/api/displays/enrollments/{requestId}", requestId)).andExpect(status().isOk())
						.andReturn().getResponse().getContentAsString());
		assertEquals("APPROVED", asString(approvedStatusResponse, "status"));
		assertNotNull(asString(approvedStatusResponse, "displaySessionToken"));

		Map<String, Object> validationResponse = readMap(mockMvc
				.perform(get("/api/displays/session").header("Authorization",
						"Bearer " + asString(approvedStatusResponse, "displaySessionToken")))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
		assertEquals(Boolean.TRUE, validationResponse.get("valid"));
		assertEquals(asString(approveResponse, "displayId"), asString(validationResponse, "displayId"));

		Map<String, Object> revokeResponse = readMap(mockMvc
				.perform(post("/api/admin/displays/{displayId}/revoke-session", asString(approveResponse, "displayId"))
						.header("X-Admin-Token", "test-admin-token").header("X-Admin-Password", "test-admin-pin").header("X-Admin-Id", "integration-admin"))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
		assertEquals("REVOKED", asString(revokeResponse, "status"));

		Map<String, Object> revokedValidationResponse = readMap(mockMvc
				.perform(get("/api/displays/session").header("Authorization",
						"Bearer " + asString(approvedStatusResponse, "displaySessionToken")))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
		assertEquals(Boolean.FALSE, revokedValidationResponse.get("valid"));

		Map<String, Object> reactivateResponse = readMap(mockMvc
				.perform(patch("/api/admin/displays/{displayId}", asString(approveResponse, "displayId"))
						.header("X-Admin-Token", "test-admin-token").header("X-Admin-Password", "test-admin-pin").header("X-Admin-Id", "integration-admin")
						.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"ACTIVE\"}"))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
		assertEquals("ACTIVE", asString(reactivateResponse, "status"));

		Map<String, Object> reactivatedValidationResponse = readMap(mockMvc
				.perform(get("/api/displays/session").header("Authorization",
						"Bearer " + asString(approvedStatusResponse, "displaySessionToken")))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
		assertEquals(Boolean.TRUE, reactivatedValidationResponse.get("valid"));
		assertEquals(asString(approveResponse, "displayId"), asString(reactivatedValidationResponse, "displayId"));

		mockMvc.perform(delete("/api/admin/displays/{displayId}", asString(approveResponse, "displayId"))
				.header("X-Admin-Token", "test-admin-token").header("X-Admin-Password", "test-admin-pin")
				.header("X-Admin-Id", "integration-admin")).andExpect(status().isNoContent());

		Map<String, Object> deletedValidationResponse = readMap(mockMvc
				.perform(get("/api/displays/session").header("Authorization",
						"Bearer " + asString(approvedStatusResponse, "displaySessionToken")))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
		assertEquals(Boolean.FALSE, deletedValidationResponse.get("valid"));
	}

	@Test
	public void rejectFlowReturnsRejectedStatus() throws Exception {
		Map<String, Object> codeResponse = readMap(mockMvc
				.perform(post("/api/admin/displays/enrollment-codes").header("X-Admin-Token", "test-admin-token").header("X-Admin-Password", "test-admin-pin")
						.header("X-Admin-Id", "integration-admin").contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CreateEnrollmentCodeRequest(300, 1))))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString());

		Map<String, Object> enrollmentResponse = readMap(mockMvc
				.perform(post("/api/displays/enrollments").contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(
								new CreateEnrollmentRequest(asString(codeResponse, "code"), "Lobby Screen", null))))
				.andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());

		Map<String, Object> rejectResponse = readMap(mockMvc.perform(
				post("/api/admin/displays/enrollments/{requestId}/reject", asString(enrollmentResponse, "requestId"))
						.header("X-Admin-Token", "test-admin-token").header("X-Admin-Password", "test-admin-pin").header("X-Admin-Id", "integration-admin")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new RejectEnrollmentRequest("Not needed"))))
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
		assertEquals("REJECTED", asString(rejectResponse, "status"));

		Map<String, Object> statusAfterReject = readMap(
				mockMvc.perform(get("/api/displays/enrollments/{requestId}", asString(enrollmentResponse, "requestId")))
						.andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
		assertEquals("REJECTED", asString(statusAfterReject, "status"));
	}

	@SuppressWarnings("unchecked")
	private Map<String, Object> readMap(String content) throws Exception {
		return objectMapper.readValue(content, Map.class);
	}

	private String asString(Map<String, Object> map, String key) {
		Object value = map.get(key);
		return value == null ? null : value.toString();
	}
}
