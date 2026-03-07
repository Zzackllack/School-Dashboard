package com.schooldashboard.display.repository;

import com.schooldashboard.display.entity.DisplayEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisplayRepository extends JpaRepository<DisplayEntity, String> {

	Optional<DisplayEntity> findBySlug(String slug);
}
