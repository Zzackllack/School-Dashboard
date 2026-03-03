package com.schooldashboard.display.repository;

import com.schooldashboard.display.entity.DisplaySessionEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisplaySessionRepository extends JpaRepository<DisplaySessionEntity, String> {

	Optional<DisplaySessionEntity> findByTokenHash(String tokenHash);

	List<DisplaySessionEntity> findByDisplayId(String displayId);

	void deleteByDisplayId(String displayId);
}
