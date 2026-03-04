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
import com.schooldashboard.display.service.DisplayEnrollmentService;
import com.schooldashboard.display.web.DisplayDomainException;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/displays")
public class AdminDisplayController {

	private final DisplayEnrollmentService enrollmentService;

	public AdminDisplayController(DisplayEnrollmentService enrollmentService) {
		this.enrollmentService = enrollmentService;
	}

	@PostMapping("/enrollment-codes")
	public CreateEnrollmentCodeResponse createEnrollmentCode(
			@RequestBody(required = false) CreateEnrollmentCodeRequest request, Authentication authentication) {
		return enrollmentService.createEnrollmentCode(resolveAdminId(authentication), request);
	}

	@GetMapping("/enrollments")
	public List<PendingEnrollmentResponse> listEnrollments(
			@RequestParam(name = "status", required = false) String status) {
		EnrollmentRequestStatus resolvedStatus = enrollmentService.parseEnrollmentStatus(status);
		return enrollmentService.listEnrollments(resolvedStatus);
	}

	@PostMapping("/enrollments/{requestId}/approve")
	public EnrollmentStatusResponse approveEnrollment(@PathVariable String requestId,
			@RequestBody(required = false) ApproveEnrollmentRequest request, Authentication authentication) {
		return enrollmentService.approveEnrollment(requestId, request, resolveAdminId(authentication));
	}

	@PostMapping("/enrollments/{requestId}/reject")
	public EnrollmentStatusResponse rejectEnrollment(@PathVariable String requestId,
			@RequestBody(required = false) RejectEnrollmentRequest request, Authentication authentication) {
		return enrollmentService.rejectEnrollment(requestId, request, resolveAdminId(authentication));
	}

	@GetMapping
	public List<DisplaySummaryResponse> listDisplays() {
		return enrollmentService.listDisplays();
	}

	@GetMapping("/{displayId}")
	public DisplaySummaryResponse getDisplay(@PathVariable String displayId) {
		return enrollmentService.getDisplay(displayId);
	}

	@PostMapping("/{displayId}/revoke-session")
	public DisplaySummaryResponse revokeDisplaySession(@PathVariable String displayId, Authentication authentication) {
		return enrollmentService.revokeDisplaySession(displayId, resolveAdminId(authentication));
	}

	@PatchMapping("/{displayId}")
	public DisplaySummaryResponse updateDisplay(@PathVariable String displayId,
			@RequestBody UpdateDisplayRequest request, Authentication authentication) {
		return enrollmentService.updateDisplay(displayId, request, resolveAdminId(authentication));
	}

	@DeleteMapping("/{displayId}")
	public ResponseEntity<Void> deleteDisplay(@PathVariable String displayId, Authentication authentication) {
		enrollmentService.deleteDisplay(displayId, resolveAdminId(authentication));
		return ResponseEntity.noContent().build();
	}

	private String resolveAdminId(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()) {
			throw new DisplayDomainException("ADMIN_UNAUTHORIZED", HttpStatus.UNAUTHORIZED,
					"Authentication is required");
		}
		return authentication.getName();
	}
}
