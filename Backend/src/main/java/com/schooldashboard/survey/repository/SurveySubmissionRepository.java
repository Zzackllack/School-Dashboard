package com.schooldashboard.survey.repository;

import com.schooldashboard.survey.entity.SurveyCategory;
import com.schooldashboard.survey.entity.SurveySubmissionEntity;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SurveySubmissionRepository extends JpaRepository<SurveySubmissionEntity, String> {

	@Query("""
			select submission
			from SurveySubmissionEntity submission
			join fetch submission.display display
			where (:category is null or submission.category = :category)
			  and (:displayId is null or display.id = :displayId)
			order by submission.createdAt desc
			""")
	List<SurveySubmissionEntity> findInboxItems(@Param("category") SurveyCategory category,
			@Param("displayId") String displayId, Pageable pageable);
}
