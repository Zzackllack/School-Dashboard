package com.schooldashboard.security.auth;

import com.schooldashboard.security.config.SecurityProperties;
import com.schooldashboard.security.entity.AppRoleEntity;
import com.schooldashboard.security.entity.AppUserEntity;
import com.schooldashboard.security.repository.AppRoleRepository;
import com.schooldashboard.security.repository.AppUserRepository;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DevAdminBootstrapInitializer implements ApplicationRunner {

	private static final Logger logger = LoggerFactory.getLogger(DevAdminBootstrapInitializer.class);
	private static final SecureRandom secureRandom = new SecureRandom();

	private final AppUserRepository appUserRepository;
	private final AppRoleRepository appRoleRepository;
	private final PasswordEncoder passwordEncoder;
	private final SecurityProperties securityProperties;
	private final Environment environment;

	public DevAdminBootstrapInitializer(AppUserRepository appUserRepository, AppRoleRepository appRoleRepository,
			PasswordEncoder passwordEncoder, SecurityProperties securityProperties, Environment environment) {
		this.appUserRepository = appUserRepository;
		this.appRoleRepository = appRoleRepository;
		this.passwordEncoder = passwordEncoder;
		this.securityProperties = securityProperties;
		this.environment = environment;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		AppRoleEntity adminRole = ensureAdminRole();

		SecurityProperties.Bootstrap bootstrap = securityProperties.getAdmin().getBootstrap();
		if (bootstrap.isEnabled()) {
			if (isProdProfile()) {
				logger.error("Refusing bootstrap admin creation in prod profile. configuredUsername='{}'",
						bootstrap.getUsername());
				throw new IllegalStateException("security.admin.bootstrap.enabled=true is not allowed in prod profile");
			}
			String username = trimToNull(bootstrap.getUsername());
			String password = trimToNull(bootstrap.getPassword());
			if (username == null || password == null) {
				handleBootstrapMissingCredentials();
				return;
			}
			if (appUserRepository.existsByRoles_Name("ROLE_ADMIN")
					&& appUserRepository.findByUsername(username).isEmpty()) {
				logger.warn(
						"Bootstrap admin is enabled, but an admin account already exists and bootstrap username '{}' was not found. Skipping bootstrap user creation to avoid duplicate admin accounts.",
						username);
				return;
			}
			ensureBootstrapAdmin(username, password, adminRole);
			return;
		}

		if (appUserRepository.existsByRoles_Name("ROLE_ADMIN")) {
			return;
		}

		if (isProdProfile()) {
			if (appUserRepository.count() > 0) {
				throw new IllegalStateException(
						"No admin user exists while security.admin.bootstrap.enabled=false in prod profile");
			}
			createRandomInitialAdmin(adminRole);
			return;
		}

		logger.info("No admin user exists yet. Enable security.admin.bootstrap.* to create one for non-prod usage.");
	}

	private void handleBootstrapMissingCredentials() {
		throw new IllegalStateException(
				"security.admin.bootstrap.enabled=true requires non-empty security.admin.bootstrap.username/password");
	}

	private void ensureBootstrapAdmin(String username, String password, AppRoleEntity adminRole) {
		AppUserEntity adminUser = appUserRepository.findByUsername(username).orElse(null);
		if (adminUser == null) {
			adminUser = new AppUserEntity(username, passwordEncoder.encode(password));
			adminUser.addRole(adminRole);
			try {
				appUserRepository.save(adminUser);
			} catch (DataIntegrityViolationException exception) {
				adminUser = appUserRepository.findByUsername(username).orElseThrow(() -> new IllegalStateException(
						"Concurrent bootstrap user creation detected but user reload failed", exception));
			}
			logger.warn("Bootstrapped initial admin account '{}'. Rotate credentials after first login.", username);
		}

		boolean changed = false;
		if (!passwordEncoder.matches(password, adminUser.getPasswordHash())) {
			adminUser.setPasswordHash(passwordEncoder.encode(password));
			changed = true;
		}
		if (!adminUser.getRoles().stream().map(AppRoleEntity::getName).anyMatch("ROLE_ADMIN"::equals)) {
			adminUser.addRole(adminRole);
			changed = true;
		}
		if (!adminUser.isEnabled()) {
			adminUser.setEnabled(true);
			changed = true;
		}
		if (adminUser.isLocked() || adminUser.getFailedLoginCount() > 0 || adminUser.getLockedUntil() != null
				|| adminUser.getLastFailedLoginAt() != null) {
			adminUser.setLocked(false);
			adminUser.setFailedLoginCount(0);
			adminUser.setLockedUntil(null);
			adminUser.setLastFailedLoginAt(null);
			changed = true;
		}

		if (changed) {
			appUserRepository.save(adminUser);
			logger.warn("Refreshed bootstrap admin account '{}' with ROLE_ADMIN and current bootstrap password.",
					username);
		} else {
			logger.info("Bootstrap admin '{}' already configured", username);
		}
	}

	private AppRoleEntity ensureAdminRole() {
		return appRoleRepository.findByName("ROLE_ADMIN").orElseGet(() -> {
			try {
				return appRoleRepository.save(new AppRoleEntity("ROLE_ADMIN"));
			} catch (DataIntegrityViolationException exception) {
				return appRoleRepository.findByName("ROLE_ADMIN").orElseThrow(
						() -> new IllegalStateException("Concurrent admin role creation detected", exception));
			}
		});
	}

	private boolean isProdProfile() {
		return environment.acceptsProfiles(Profiles.of("prod"));
	}

	private String trimToNull(String value) {
		if (value == null) {
			return null;
		}
		String trimmed = value.trim();
		if (trimmed.isEmpty()) {
			return null;
		}
		return trimmed;
	}

	private void createRandomInitialAdmin(AppRoleEntity adminRole) {
		String username = "admin-" + UUID.randomUUID().toString().substring(0, 8);
		byte[] passwordBytes = new byte[24];
		secureRandom.nextBytes(passwordBytes);
		String rawPassword = Base64.getUrlEncoder().withoutPadding().encodeToString(passwordBytes);

		AppUserEntity adminUser = new AppUserEntity(username, passwordEncoder.encode(rawPassword));
		adminUser.addRole(adminRole);
		adminUser.setEnabled(true);
		adminUser.setLocked(false);
		adminUser.setFailedLoginCount(0);
		adminUser.setLockedUntil(null);
		adminUser.setLastFailedLoginAt(null);
		appUserRepository.save(adminUser);

		logger.error(
				"Created one-time initial admin for fresh prod database. username='{}' password='{}'. Rotate immediately and disable this account after creating permanent admins.",
				username, rawPassword);
	}
}
