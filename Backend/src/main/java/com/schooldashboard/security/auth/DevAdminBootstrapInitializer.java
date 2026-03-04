package com.schooldashboard.security.auth;

import com.schooldashboard.security.config.SecurityProperties;
import com.schooldashboard.security.entity.AppRoleEntity;
import com.schooldashboard.security.entity.AppUserEntity;
import com.schooldashboard.security.repository.AppRoleRepository;
import com.schooldashboard.security.repository.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DevAdminBootstrapInitializer implements ApplicationRunner {

	private static final Logger logger = LoggerFactory.getLogger(DevAdminBootstrapInitializer.class);

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
		AppRoleEntity adminRole = appRoleRepository.findByName("ROLE_ADMIN")
				.orElseGet(() -> appRoleRepository.save(new AppRoleEntity("ROLE_ADMIN")));

		if (appUserRepository.count() > 0) {
			return;
		}

		SecurityProperties.Bootstrap bootstrap = securityProperties.getAdmin().getBootstrap();
		if (bootstrap.isEnabled()) {
			String username = trimToNull(bootstrap.getUsername());
			String password = trimToNull(bootstrap.getPassword());
			if (username == null || password == null) {
				handleBootstrapMissingCredentials();
				return;
			}
			createBootstrapAdmin(username, password, adminRole);
			return;
		}

		if (isProdProfile()) {
			throw new IllegalStateException(
					"No admin user exists while security.admin.bootstrap.enabled=false in prod profile");
		}

		logger.info("No admin user exists yet. Enable security.admin.bootstrap.* to create one for non-prod usage.");
	}

	private void handleBootstrapMissingCredentials() {
		if (isProdProfile()) {
			throw new IllegalStateException(
					"security.admin.bootstrap.enabled=true requires security.admin.bootstrap.username/password in prod profile");
		}
		logger.warn(
				"security.admin.bootstrap.enabled=true but username/password are missing. Admin bootstrap skipped in non-prod profile.");
	}

	private void createBootstrapAdmin(String username, String password, AppRoleEntity adminRole) {
		if (appUserRepository.findByUsername(username).isPresent()) {
			logger.info("Bootstrap admin '{}' already exists", username);
			return;
		}

		AppUserEntity adminUser = new AppUserEntity(username, passwordEncoder.encode(password));
		adminUser.addRole(adminRole);
		appUserRepository.save(adminUser);

		logger.warn("Bootstrapped initial admin account '{}'. Rotate credentials after first login.", username);
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
}
