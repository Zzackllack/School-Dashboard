package com.schooldashboard.security.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.schooldashboard.security.entity.AppRoleEntity;
import com.schooldashboard.security.entity.AppUserEntity;
import com.schooldashboard.security.repository.AppUserRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

public class AppUserDetailsServiceTest {

	private final AppUserRepository appUserRepository = Mockito.mock(AppUserRepository.class);
	private final AppUserDetailsService appUserDetailsService = new AppUserDetailsService(appUserRepository);

	@Test
	public void loadUserByUsernameReturnsPrincipalWithAuthorities() {
		AppUserEntity userEntity = new AppUserEntity("admin", "encoded");
		userEntity.addRole(new AppRoleEntity("ROLE_ADMIN"));
		when(appUserRepository.findByUsername("admin")).thenReturn(Optional.of(userEntity));

		AppUserPrincipal principal = (AppUserPrincipal) appUserDetailsService.loadUserByUsername("admin");
		assertEquals("admin", principal.getUsername());
		assertEquals("encoded", principal.getPassword());
		assertEquals(1, principal.getAuthorities().size());
	}

	@Test
	public void loadUserByUsernameThrowsWhenUserMissing() {
		when(appUserRepository.findByUsername("missing")).thenReturn(Optional.empty());
		assertThrows(UsernameNotFoundException.class, () -> appUserDetailsService.loadUserByUsername("missing"));
	}

	@Test
	public void recordFailedLoginLocksUserAfterThreshold() {
		AppUserEntity userEntity = new AppUserEntity("admin", "encoded");
		when(appUserRepository.findLockedByUsername("admin")).thenReturn(Optional.of(userEntity));

		for (int i = 0; i < 5; i++) {
			appUserDetailsService.recordFailedLogin("admin");
		}

		ArgumentCaptor<AppUserEntity> captor = ArgumentCaptor.forClass(AppUserEntity.class);
		verify(appUserRepository, times(5)).save(captor.capture());
		AppUserEntity savedUser = captor.getValue();
		assertEquals(5, savedUser.getFailedLoginCount());
		assertNotNull(savedUser.getLockedUntil());
	}

	@Test
	public void recordSuccessfulLoginClearsFailedState() {
		AppUserEntity userEntity = new AppUserEntity("admin", "encoded");
		userEntity.setFailedLoginCount(3);
		userEntity.setLastFailedLoginAt(Instant.now());
		userEntity.setLockedUntil(Instant.now().plusSeconds(60));
		when(appUserRepository.findLockedByUsername("admin")).thenReturn(Optional.of(userEntity));

		appUserDetailsService.recordSuccessfulLogin("admin");

		verify(appUserRepository).save(userEntity);
		assertEquals(0, userEntity.getFailedLoginCount());
		assertNull(userEntity.getLockedUntil());
	}
}
