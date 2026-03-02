package com.schooldashboard.display.controller;

import com.schooldashboard.display.dto.ApproveEnrollmentRequest;
import com.schooldashboard.display.dto.CreateEnrollmentCodeRequest;
import com.schooldashboard.display.dto.CreateEnrollmentCodeResponse;
import com.schooldashboard.display.dto.DisplaySummaryResponse;
import com.schooldashboard.display.dto.EnrollmentStatusResponse;
import com.schooldashboard.display.dto.PendingEnrollmentResponse;
import com.schooldashboard.display.dto.RejectEnrollmentRequest;
import com.schooldashboard.display.dto.UpdateDisplayRequest;
import com.schooldashboard.display.entity.EnrollmentRequestStatus;
import com.schooldashboard.display.service.AdminAuthService;
import com.schooldashboard.display.service.DisplayEnrollmentService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/displays")
public class AdminDisplayController {

	private final DisplayEnrollmentService enrollmentService;
	private final AdminAuthService adminAuthService;

	public AdminDisplayController(DisplayEnrollmentService enrollmentService, AdminAuthService adminAuthService) {
		this.enrollmentService = enrollmentService;
		this.adminAuthService = adminAuthService;
	}

	@PostMapping("/enrollment-codes")
	public CreateEnrollmentCodeResponse createEnrollmentCode(
			@RequestHeader(name = "X-Admin-Token", required = false) String adminToken,
			@RequestHeader(name = "X-Admin-Id", required = false) String adminId,
			@RequestBody(required = false) CreateEnrollmentCodeRequest request) {
		return enrollmentService.createEnrollmentCode(requireAdmin(adminToken, adminId), request);
	}

	@GetMapping("/enrollments")
	public List<PendingEnrollmentResponse> listEnrollments(
			@RequestHeader(name = "X-Admin-Token", required = false) String adminToken,
			@RequestHeader(name = "X-Admin-Id", required = false) String adminId,
			@RequestParam(name = "status", required = false) String status) {
		requireAdmin(adminToken, adminId);
		EnrollmentRequestStatus resolvedStatus = enrollmentService.parseEnrollmentStatus(status);
		return enrollmentService.listEnrollments(resolvedStatus);
	}

	@PostMapping("/enrollments/{requestId}/approve")
	public EnrollmentStatusResponse approveEnrollment(@PathVariable String requestId,
			@RequestHeader(name = "X-Admin-Token", required = false) String adminToken,
			@RequestHeader(name = "X-Admin-Id", required = false) String adminId,
			@RequestBody(required = false) ApproveEnrollmentRequest request) {
		return enrollmentService.approveEnrollment(requestId, request, requireAdmin(adminToken, adminId));
	}

	@PostMapping("/enrollments/{requestId}/reject")
	public EnrollmentStatusResponse rejectEnrollment(@PathVariable String requestId,
			@RequestHeader(name = "X-Admin-Token", required = false) String adminToken,
			@RequestHeader(name = "X-Admin-Id", required = false) String adminId,
			@RequestBody(required = false) RejectEnrollmentRequest request) {
		return enrollmentService.rejectEnrollment(requestId, request, requireAdmin(adminToken, adminId));
	}

	@GetMapping
	public List<DisplaySummaryResponse> listDisplays(
			@RequestHeader(name = "X-Admin-Token", required = false) String adminToken,
			@RequestHeader(name = "X-Admin-Id", required = false) String adminId) {
		requireAdmin(adminToken, adminId);
		return enrollmentService.listDisplays();
	}

	@GetMapping("/{displayId}")
	public DisplaySummaryResponse getDisplay(@PathVariable String displayId,
			@RequestHeader(name = "X-Admin-Token", required = false) String adminToken,
			@RequestHeader(name = "X-Admin-Id", required = false) String adminId) {
		requireAdmin(adminToken, adminId);
		return enrollmentService.getDisplay(displayId);
	}

	@PostMapping("/{displayId}/revoke-session")
	public DisplaySummaryResponse revokeDisplaySession(@PathVariable String displayId,
			@RequestHeader(name = "X-Admin-Token", required = false) String adminToken,
			@RequestHeader(name = "X-Admin-Id", required = false) String adminId) {
		return enrollmentService.revokeDisplaySession(displayId, requireAdmin(adminToken, adminId));
	}

	@PatchMapping("/{displayId}")
	public DisplaySummaryResponse updateDisplay(@PathVariable String displayId,
			@RequestHeader(name = "X-Admin-Token", required = false) String adminToken,
			@RequestHeader(name = "X-Admin-Id", required = false) String adminId,
			@RequestBody UpdateDisplayRequest request) {
		return enrollmentService.updateDisplay(displayId, request, requireAdmin(adminToken, adminId));
	}

	private String requireAdmin(String token, String adminId) {
		return adminAuthService.requireAdmin(token, adminId);
	}
}
