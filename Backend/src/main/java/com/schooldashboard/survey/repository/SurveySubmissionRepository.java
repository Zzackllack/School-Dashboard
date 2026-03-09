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
			  and (:queryText is null
			    or lower(submission.message) like lower(concat('%', :queryText, '%'))
			    or lower(coalesce(submission.submitterName, '')) like lower(concat('%', :queryText, '%'))
			    or lower(display.name) like lower(concat('%', :queryText, '%'))
			    or lower(coalesce(display.locationLabel, '')) like lower(concat('%', :queryText, '%')))
			order by submission.createdAt desc
			""")
	List<SurveySubmissionEntity> findInboxItems(@Param("category") SurveyCategory category,
			@Param("displayId") String displayId, @Param("queryText") String queryText, Pageable pageable);
}
