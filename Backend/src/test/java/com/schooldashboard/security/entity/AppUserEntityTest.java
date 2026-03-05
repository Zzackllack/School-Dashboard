package com.schooldashboard.security.entity;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

public class AppUserEntityTest {

	@Test
	public void rejectsNegativeFailedLoginCount() {
		AppUserEntity user = new AppUserEntity("admin", "encoded");
		assertThrows(IllegalArgumentException.class, () -> user.setFailedLoginCount(-1));
	}
}
