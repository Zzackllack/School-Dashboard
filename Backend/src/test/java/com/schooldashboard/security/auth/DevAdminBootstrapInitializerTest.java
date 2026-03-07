package com.schooldashboard.security.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.schooldashboard.security.config.SecurityProperties;
import com.schooldashboard.security.entity.AppRoleEntity;
import com.schooldashboard.security.entity.AppUserEntity;
import com.schooldashboard.security.repository.AppRoleRepository;
import com.schooldashboard.security.repository.AppUserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;

public class DevAdminBootstrapInitializerTest {

	@Test
	public void bootstrapSkipsCreatingDuplicateAdminWhenAnyAdminAlreadyExists() throws Exception {
		AppUserRepository appUserRepository = Mockito.mock(AppUserRepository.class);
		AppRoleRepository appRoleRepository = Mockito.mock(AppRoleRepository.class);
		PasswordEncoder passwordEncoder = Mockito.mock(PasswordEncoder.class);
		Environment environment = Mockito.mock(Environment.class);

		when(appRoleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(new AppRoleEntity("ROLE_ADMIN")));
		when(appUserRepository.existsByRoles_Name("ROLE_ADMIN")).thenReturn(true);
		when(appUserRepository.findByUsername("dev-admin")).thenReturn(Optional.empty());

		SecurityProperties securityProperties = new SecurityProperties();
		securityProperties.getAdmin().getBootstrap().setEnabled(true);
		securityProperties.getAdmin().getBootstrap().setUsername("dev-admin");
		securityProperties.getAdmin().getBootstrap().setPassword("secret");

		DevAdminBootstrapInitializer initializer = new DevAdminBootstrapInitializer(appUserRepository,
				appRoleRepository, passwordEncoder, securityProperties, environment);

		initializer.run(new DefaultApplicationArguments(new String[0]));

		verify(appUserRepository, never()).save(any(AppUserEntity.class));
	}

	@Test
	public void bootstrapCreatesAdminWhenNoAdminExists() throws Exception {
		AppUserRepository appUserRepository = Mockito.mock(AppUserRepository.class);
		AppRoleRepository appRoleRepository = Mockito.mock(AppRoleRepository.class);
		PasswordEncoder passwordEncoder = Mockito.mock(PasswordEncoder.class);
		Environment environment = Mockito.mock(Environment.class);

		when(appRoleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(new AppRoleEntity("ROLE_ADMIN")));
		when(appUserRepository.existsByRoles_Name("ROLE_ADMIN")).thenReturn(false);
		when(appUserRepository.findByUsername("dev-admin")).thenReturn(Optional.empty());
		when(passwordEncoder.encode("secret")).thenReturn("hashed-secret");
		when(passwordEncoder.matches("secret", "hashed-secret")).thenReturn(true);

		SecurityProperties securityProperties = new SecurityProperties();
		securityProperties.getAdmin().getBootstrap().setEnabled(true);
		securityProperties.getAdmin().getBootstrap().setUsername("dev-admin");
		securityProperties.getAdmin().getBootstrap().setPassword("secret");

		DevAdminBootstrapInitializer initializer = new DevAdminBootstrapInitializer(appUserRepository,
				appRoleRepository, passwordEncoder, securityProperties, environment);

		initializer.run(new DefaultApplicationArguments(new String[0]));

		ArgumentCaptor<AppUserEntity> userCaptor = ArgumentCaptor.forClass(AppUserEntity.class);
		verify(appUserRepository, times(1)).save(userCaptor.capture());
		AppUserEntity savedUser = userCaptor.getValue();
		assertEquals("dev-admin", savedUser.getUsername());
		assertEquals("hashed-secret", savedUser.getPasswordHash());
		assertNotEquals("secret", savedUser.getPasswordHash());
		assertTrue(savedUser.getRoles().stream().map(AppRoleEntity::getName).anyMatch("ROLE_ADMIN"::equals));
	}

	@Test
	public void prodWithoutUsersCreatesRandomInitialAdminWhenBootstrapDisabled() throws Exception {
		AppUserRepository appUserRepository = Mockito.mock(AppUserRepository.class);
		AppRoleRepository appRoleRepository = Mockito.mock(AppRoleRepository.class);
		PasswordEncoder passwordEncoder = Mockito.mock(PasswordEncoder.class);
		Environment environment = Mockito.mock(Environment.class);

		when(appRoleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(new AppRoleEntity("ROLE_ADMIN")));
		when(appUserRepository.existsByRoles_Name("ROLE_ADMIN")).thenReturn(false);
		when(appUserRepository.count()).thenReturn(0L);
		when(environment.acceptsProfiles(any(Profiles.class))).thenReturn(true);
		when(passwordEncoder.encode(any())).thenReturn("hashed-random-password");

		SecurityProperties securityProperties = new SecurityProperties();
		securityProperties.getAdmin().getBootstrap().setEnabled(false);

		DevAdminBootstrapInitializer initializer = new DevAdminBootstrapInitializer(appUserRepository,
				appRoleRepository, passwordEncoder, securityProperties, environment);

		initializer.run(new DefaultApplicationArguments(new String[0]));

		ArgumentCaptor<AppUserEntity> userCaptor = ArgumentCaptor.forClass(AppUserEntity.class);
		verify(appUserRepository, times(1)).save(userCaptor.capture());
		AppUserEntity savedUser = userCaptor.getValue();
		assertTrue(savedUser.getUsername().startsWith("admin-"));
		assertEquals("hashed-random-password", savedUser.getPasswordHash());
		assertTrue(savedUser.getRoles().stream().map(AppRoleEntity::getName).anyMatch("ROLE_ADMIN"::equals));
	}

	@Test
	public void prodWithExistingUsersAndNoAdminStillFailsWhenBootstrapDisabled() {
		AppUserRepository appUserRepository = Mockito.mock(AppUserRepository.class);
		AppRoleRepository appRoleRepository = Mockito.mock(AppRoleRepository.class);
		PasswordEncoder passwordEncoder = Mockito.mock(PasswordEncoder.class);
		Environment environment = Mockito.mock(Environment.class);

		when(appRoleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(new AppRoleEntity("ROLE_ADMIN")));
		when(appUserRepository.existsByRoles_Name("ROLE_ADMIN")).thenReturn(false);
		when(appUserRepository.count()).thenReturn(3L);
		when(environment.acceptsProfiles(any(Profiles.class))).thenReturn(true);

		SecurityProperties securityProperties = new SecurityProperties();
		securityProperties.getAdmin().getBootstrap().setEnabled(false);

		DevAdminBootstrapInitializer initializer = new DevAdminBootstrapInitializer(appUserRepository,
				appRoleRepository, passwordEncoder, securityProperties, environment);

		assertThrows(IllegalStateException.class, () -> initializer.run(new DefaultApplicationArguments(new String[0])));
		verify(appUserRepository, never()).save(any(AppUserEntity.class));
	}
}
