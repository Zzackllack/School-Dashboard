package com.schooldashboard.security.auth;

import com.schooldashboard.security.entity.AppUserEntity;
import com.schooldashboard.security.repository.AppUserRepository;
import java.time.Duration;
import java.time.Instant;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppUserDetailsService implements UserDetailsService {

	private static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;
	private static final Duration FAILED_LOGIN_COOLDOWN = Duration.ofMinutes(15);

	private final AppUserRepository appUserRepository;

	public AppUserDetailsService(AppUserRepository appUserRepository) {
		this.appUserRepository = appUserRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		AppUserEntity userEntity = appUserRepository.findByUsername(normalizeUsername(username))
				.orElseThrow(() -> new UsernameNotFoundException("User not found"));
		return AppUserPrincipal.fromEntity(userEntity);
	}

	@Transactional
	public void recordSuccessfulLogin(String username) {
		appUserRepository.findByUsername(normalizeUsername(username)).ifPresent(userEntity -> {
			userEntity.setFailedLoginCount(0);
			userEntity.setLastFailedLoginAt(null);
			userEntity.setLockedUntil(null);
			appUserRepository.save(userEntity);
		});
	}

	@Transactional
	public void recordFailedLogin(String username) {
		appUserRepository.findByUsername(normalizeUsername(username)).ifPresent(userEntity -> {
			int failedLoginCount = userEntity.getFailedLoginCount() + 1;
			userEntity.setFailedLoginCount(failedLoginCount);
			userEntity.setLastFailedLoginAt(Instant.now());
			if (failedLoginCount >= MAX_FAILED_LOGIN_ATTEMPTS) {
				userEntity.setLockedUntil(Instant.now().plus(FAILED_LOGIN_COOLDOWN));
			}
			appUserRepository.save(userEntity);
		});
	}

	private String normalizeUsername(String username) {
		if (username == null) {
			return "";
		}
		return username.trim();
	}
}
