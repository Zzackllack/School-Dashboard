package com.schooldashboard.persistence.repository;

import com.schooldashboard.persistence.entity.ApiResponseCache;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApiResponseCacheRepository extends JpaRepository<ApiResponseCache, String> {}
