package com.schooldashboard.display.entity;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Instant;
import org.junit.jupiter.api.Test;

public class DisplaySessionEntityTest {

	@Test
	public void rejectsExpiresAtBeforeIssuedAt() {
		Instant issuedAt = Instant.now();
		Instant expiresAt = issuedAt.minusSeconds(1);

		assertThrows(IllegalArgumentException.class,
				() -> new DisplaySessionEntity("display-1", "hash-1", issuedAt, expiresAt));
	}

	@Test
	public void rejectsLastSeenOutsideSessionWindow() {
		Instant issuedAt = Instant.now();
		Instant expiresAt = issuedAt.plusSeconds(60);
		DisplaySessionEntity entity = new DisplaySessionEntity("display-1", "hash-1", issuedAt, expiresAt);

		assertDoesNotThrow(() -> entity.setLastSeenAt(issuedAt));
		assertEquals(issuedAt, entity.getLastSeenAt());
		assertDoesNotThrow(() -> entity.setLastSeenAt(expiresAt));
		assertEquals(expiresAt, entity.getLastSeenAt());
		assertThrows(IllegalArgumentException.class, () -> entity.setLastSeenAt(issuedAt.minusSeconds(1)));
		assertThrows(IllegalArgumentException.class, () -> entity.setLastSeenAt(expiresAt.plusSeconds(1)));
	}

	@Test
	public void rejectsZeroDurationSession() {
		Instant issuedAt = Instant.now();
		assertThrows(IllegalArgumentException.class,
				() -> new DisplaySessionEntity("display-1", "hash-1", issuedAt, issuedAt));
	}
}
