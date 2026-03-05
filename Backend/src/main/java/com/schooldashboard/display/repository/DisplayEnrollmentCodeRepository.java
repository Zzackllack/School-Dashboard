package com.schooldashboard.display.repository;

import com.schooldashboard.display.entity.DisplayEnrollmentCodeEntity;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DisplayEnrollmentCodeRepository extends JpaRepository<DisplayEnrollmentCodeEntity, String> {

	Optional<DisplayEnrollmentCodeEntity> findByCodeHash(String codeHash);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select code from DisplayEnrollmentCodeEntity code where code.codeHash = :codeHash")
	Optional<DisplayEnrollmentCodeEntity> findLockedByCodeHash(@Param("codeHash") String codeHash);
}
