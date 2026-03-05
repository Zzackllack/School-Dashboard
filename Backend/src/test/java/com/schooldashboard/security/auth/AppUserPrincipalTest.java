package com.schooldashboard.security.auth;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.schooldashboard.security.entity.AppUserEntity;
import java.time.Instant;
import org.junit.jupiter.api.Test;

public class AppUserPrincipalTest {

	@Test
	public void accountIsUnlockedWhenLockHasExpired() {
		AppUserEntity user = new AppUserEntity("admin", "encoded");
		user.setLocked(true);
		user.setLockedUntil(Instant.now().minusSeconds(60));

		AppUserPrincipal principal = AppUserPrincipal.fromEntity(user);

		assertTrue(principal.isAccountNonLocked());
	}

	@Test
	public void accountIsLockedWhenLockIsActive() {
		AppUserEntity user = new AppUserEntity("admin", "encoded");
		user.setLocked(true);
		user.setLockedUntil(Instant.now().plusSeconds(60));

		AppUserPrincipal principal = AppUserPrincipal.fromEntity(user);

		assertFalse(principal.isAccountNonLocked());
	}
}
