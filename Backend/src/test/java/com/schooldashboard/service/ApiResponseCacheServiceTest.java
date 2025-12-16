package com.schooldashboard.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.schooldashboard.persistence.entity.ApiResponseCache;
import com.schooldashboard.persistence.repository.ApiResponseCacheRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

public class ApiResponseCacheServiceTest {

    @Test
    public void storeWritesNewEntry() {
        ApiResponseCacheRepository repo = mock(ApiResponseCacheRepository.class);
        when(repo.findById("k")).thenReturn(Optional.empty());
        ApiResponseCacheService service = new ApiResponseCacheService(repo, new ObjectMapper());

        service.store("k", List.of("a", "b"));

        verify(repo).save(any(ApiResponseCache.class));
    }

    @Test
    public void storeSkipsWhenUnchanged() {
        ApiResponseCacheRepository repo = mock(ApiResponseCacheRepository.class);
        when(repo.findById("k")).thenReturn(Optional.empty());
        ApiResponseCacheService service = new ApiResponseCacheService(repo, new ObjectMapper());

        service.store("k", List.of("x"));
        org.mockito.ArgumentCaptor<ApiResponseCache> captor = org.mockito.ArgumentCaptor.forClass(ApiResponseCache.class);
        verify(repo).save(captor.capture());
        ApiResponseCache saved = captor.getValue();

        reset(repo);
        when(repo.findById("k")).thenReturn(Optional.of(saved));

        service.store("k", List.of("x"));

        verify(repo, never()).save(any());
    }
}
