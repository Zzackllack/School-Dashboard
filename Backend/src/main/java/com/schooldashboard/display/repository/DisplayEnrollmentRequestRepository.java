package com.schooldashboard.display.repository;

import com.schooldashboard.display.entity.DisplayEnrollmentRequestEntity;
import com.schooldashboard.display.entity.EnrollmentRequestStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DisplayEnrollmentRequestRepository extends JpaRepository<DisplayEnrollmentRequestEntity, String> {

	List<DisplayEnrollmentRequestEntity> findByStatusOrderByCreatedAtAsc(EnrollmentRequestStatus status);

	List<DisplayEnrollmentRequestEntity> findByDisplayId(String displayId);
}
