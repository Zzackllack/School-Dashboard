package com.schooldashboard.display.repository;

import com.schooldashboard.display.entity.DisplayEnrollmentCodeEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisplayEnrollmentCodeRepository extends JpaRepository<DisplayEnrollmentCodeEntity, String> {

	Optional<DisplayEnrollmentCodeEntity> findByCodeHash(String codeHash);
}
