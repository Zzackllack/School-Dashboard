package com.schooldashboard.security.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
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

		SecurityProperties securityProperties = new SecurityProperties();
		securityProperties.getAdmin().getBootstrap().setEnabled(true);
		securityProperties.getAdmin().getBootstrap().setUsername("dev-admin");
		securityProperties.getAdmin().getBootstrap().setPassword("secret");

		DevAdminBootstrapInitializer initializer = new DevAdminBootstrapInitializer(appUserRepository,
				appRoleRepository, passwordEncoder, securityProperties, environment);

		initializer.run(new DefaultApplicationArguments(new String[0]));

		ArgumentCaptor<AppUserEntity> userCaptor = ArgumentCaptor.forClass(AppUserEntity.class);
		verify(appUserRepository).save(userCaptor.capture());
		AppUserEntity savedUser = userCaptor.getValue();
		org.junit.jupiter.api.Assertions.assertEquals("dev-admin", savedUser.getUsername());
	}
}
