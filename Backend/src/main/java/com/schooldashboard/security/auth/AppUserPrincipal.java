package com.schooldashboard.security.auth;

import com.schooldashboard.security.entity.AppUserEntity;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

public class AppUserPrincipal implements UserDetails {

	private final String userId;
	private final String username;
	private final String password;
	private final boolean enabled;
	private final boolean accountNonLocked;
	private final List<GrantedAuthority> authorities;

	private AppUserPrincipal(String userId, String username, String password, boolean enabled, boolean accountNonLocked,
			List<GrantedAuthority> authorities) {
		this.userId = userId;
		this.username = username;
		this.password = password;
		this.enabled = enabled;
		this.accountNonLocked = accountNonLocked;
		this.authorities = authorities;
	}

	public static AppUserPrincipal fromEntity(AppUserEntity userEntity) {
		boolean lockExpired = userEntity.getLockedUntil() == null
				|| userEntity.getLockedUntil().isBefore(Instant.now());
		boolean accountNonLocked = !userEntity.isLocked() && lockExpired;
		List<GrantedAuthority> resolvedAuthorities = userEntity.getRoles().stream()
				.map(role -> new SimpleGrantedAuthority(role.getName())).map(GrantedAuthority.class::cast).toList();
		return new AppUserPrincipal(userEntity.getId(), userEntity.getUsername(), userEntity.getPasswordHash(),
				userEntity.isEnabled(), accountNonLocked, resolvedAuthorities);
	}

	public String getUserId() {
		return userId;
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return authorities;
	}

	@Override
	public String getPassword() {
		return password;
	}

	@Override
	public String getUsername() {
		return username;
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return accountNonLocked;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return enabled;
	}
}
