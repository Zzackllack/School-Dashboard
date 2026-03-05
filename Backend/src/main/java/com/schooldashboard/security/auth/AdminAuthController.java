package com.schooldashboard.security.auth;

import com.schooldashboard.security.auth.dto.AdminAuthStatusResponse;
import com.schooldashboard.security.auth.dto.AdminLoginRequest;
import com.schooldashboard.security.auth.dto.CsrfTokenResponse;
import com.schooldashboard.security.metrics.SecurityMetricsService;
import com.schooldashboard.security.web.SecurityErrorResponse;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

	private static final Logger logger = LoggerFactory.getLogger(AdminAuthController.class);

	private final AuthenticationManager authenticationManager;
	private final SecurityContextRepository securityContextRepository;
	private final AppUserDetailsService appUserDetailsService;
	private final SecurityMetricsService securityMetricsService;

	public AdminAuthController(AuthenticationManager authenticationManager,
			SecurityContextRepository securityContextRepository, AppUserDetailsService appUserDetailsService,
			SecurityMetricsService securityMetricsService) {
		this.authenticationManager = authenticationManager;
		this.securityContextRepository = securityContextRepository;
		this.appUserDetailsService = appUserDetailsService;
		this.securityMetricsService = securityMetricsService;
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@Valid @RequestBody AdminLoginRequest request,
			HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
		String username = normalize(request.username());
		String password = normalize(request.password());

		try {
			Authentication authentication = authenticationManager
					.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(username, password));
			servletRequest.getSession(true);
			servletRequest.changeSessionId();

			SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
			securityContext.setAuthentication(authentication);
			SecurityContextHolder.setContext(securityContext);
			securityContextRepository.saveContext(securityContext, servletRequest, servletResponse);

			appUserDetailsService.recordSuccessfulLogin(username);
			securityMetricsService.incrementLoginSuccess();
			logger.info("Admin login successful for principal='{}'", authentication.getName());
			return ResponseEntity.ok(toAuthStatusResponse(authentication));
		} catch (AuthenticationException exception) {
			appUserDetailsService.recordFailedLogin(username);
			securityMetricsService.incrementLoginFailure();
			SecurityContextHolder.clearContext();
			logger.warn("Admin login failed for username='{}'", username);
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(errorResponse("UNAUTHENTICATED", "Invalid credentials", servletRequest));
		}
	}

	@PostMapping("/logout")
	public ResponseEntity<AdminAuthStatusResponse> logout(Authentication authentication,
			HttpServletRequest servletRequest, HttpServletResponse servletResponse) {
		new SecurityContextLogoutHandler().logout(servletRequest, servletResponse, authentication);
		return ResponseEntity.ok(new AdminAuthStatusResponse(false, null, List.of()));
	}

	@GetMapping("/me")
	public ResponseEntity<AdminAuthStatusResponse> me(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()) {
			throw new BadCredentialsException("Authentication is required");
		}
		return ResponseEntity.ok(toAuthStatusResponse(authentication));
	}

	@GetMapping("/csrf")
	public CsrfTokenResponse csrf(CsrfToken csrfToken) {
		return new CsrfTokenResponse(csrfToken.getHeaderName(), csrfToken.getParameterName(), csrfToken.getToken());
	}

	private AdminAuthStatusResponse toAuthStatusResponse(Authentication authentication) {
		List<String> roles = authentication.getAuthorities().stream()
				.map(grantedAuthority -> grantedAuthority.getAuthority()).sorted().toList();
		return new AdminAuthStatusResponse(authentication.isAuthenticated(), authentication.getName(), roles);
	}

	private SecurityErrorResponse errorResponse(String code, String message, HttpServletRequest request) {
		return new SecurityErrorResponse(code, message, resolveRequestId(request), Instant.now().toString());
	}

	private String resolveRequestId(HttpServletRequest request) {
		String requestId = request.getHeader("X-Request-Id");
		if (requestId == null || requestId.isBlank()) {
			return UUID.randomUUID().toString();
		}
		return requestId;
	}

	private String normalize(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		if (trimmed.isEmpty()) {
			return null;
		}
		return trimmed;
	}
}
