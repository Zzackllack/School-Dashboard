package com.schooldashboard.security.repository;

import com.schooldashboard.security.entity.AppRoleEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppRoleRepository extends JpaRepository<AppRoleEntity, Long> {

	Optional<AppRoleEntity> findByName(String name);
}
