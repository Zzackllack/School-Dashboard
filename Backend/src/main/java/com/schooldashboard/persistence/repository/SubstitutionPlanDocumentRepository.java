package com.schooldashboard.persistence.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.schooldashboard.persistence.entity.SubstitutionPlanDocument;

public interface SubstitutionPlanDocumentRepository extends JpaRepository<SubstitutionPlanDocument, Long> {

    Optional<SubstitutionPlanDocument> findByPlanUuidAndDetailUrl(String planUuid, String detailUrl);

    Optional<SubstitutionPlanDocument> findByDetailUrl(String detailUrl);
}
