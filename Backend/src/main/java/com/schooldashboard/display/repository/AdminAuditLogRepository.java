package com.schooldashboard.display.repository;

import com.schooldashboard.display.entity.AdminAuditLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLogEntity, String> {
}
