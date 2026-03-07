package com.schooldashboard.display.repository;

import com.schooldashboard.display.entity.AdminAuditLogEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLogEntity, String> {

	List<AdminAuditLogEntity> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
