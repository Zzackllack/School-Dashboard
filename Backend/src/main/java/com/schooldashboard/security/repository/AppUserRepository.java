package com.schooldashboard.security.repository;

import com.schooldashboard.security.entity.AppUserEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppUserRepository extends JpaRepository<AppUserEntity, String> {

	Optional<AppUserEntity> findByUsername(String username);
}
