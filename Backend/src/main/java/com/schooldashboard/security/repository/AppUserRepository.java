package com.schooldashboard.security.repository;

import com.schooldashboard.security.entity.AppUserEntity;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

public interface AppUserRepository extends JpaRepository<AppUserEntity, String> {

	Optional<AppUserEntity> findByUsername(String username);

	boolean existsByUsername(String username);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select user from AppUserEntity user where user.username = :username")
	Optional<AppUserEntity> findLockedByUsername(@Param("username") String username);

	boolean existsByRoles_Name(String roleName);
}
