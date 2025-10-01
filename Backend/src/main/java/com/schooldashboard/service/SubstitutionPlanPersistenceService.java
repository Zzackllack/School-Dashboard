package com.schooldashboard.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.schooldashboard.model.SubstitutionPlan;
import com.schooldashboard.persistence.entity.SubstitutionPlanDocument;
import com.schooldashboard.persistence.repository.SubstitutionPlanDocumentRepository;
import com.schooldashboard.util.DSBMobile.TimeTable;

@Service
public class SubstitutionPlanPersistenceService {

    private static final Logger logger = LoggerFactory.getLogger(SubstitutionPlanPersistenceService.class);
    private static final char[] HEX_ARRAY = "0123456789abcdef".toCharArray();

    private final SubstitutionPlanDocumentRepository repository;

    public SubstitutionPlanPersistenceService(SubstitutionPlanDocumentRepository repository) {
        this.repository = repository;
    }

    private static final Pattern PAGE_PATTERN = Pattern.compile("(?i)seite\\s+(\\d+)\\s*/\\s*(\\d+)");

    public SubstitutionPlanDocument store(TimeTable table, SubstitutionPlan plan, String rawHtml) {
        if (table == null || rawHtml == null || rawHtml.isBlank()) {
            logger.warn("[SubstitutionPlanPersistenceService] Skipping storage due to missing data (table={}, hasHtml={})",
                    table, rawHtml != null && !rawHtml.isBlank());
            return null;
        }

        String detailUrl = table.getDetail();
        String planUuid = table.getUUID() != null ? table.getUUID().toString() : null;

        if (planUuid == null || detailUrl == null || detailUrl.isBlank()) {
            logger.warn("[SubstitutionPlanPersistenceService] Skipping storage due to missing identifiers (uuid={}, detail={})",
                    planUuid, detailUrl);
            return null;
        }

        String contentHash = hashContent(rawHtml);
        Optional<SubstitutionPlanDocument> existing = repository
                .findByPlanUuidAndDetailUrl(planUuid, detailUrl)
                .or(() -> repository.findByDetailUrl(detailUrl));

        if (existing.isPresent()) {
            SubstitutionPlanDocument document = existing.get();
            if (!contentHash.equals(document.getContentHash())) {
                logger.info("[SubstitutionPlanPersistenceService] Updating stored plan {} due to content change", document.getId());
                document.setRawHtml(rawHtml);
                document.setContentHash(contentHash);
                applyMetadata(document, table, plan);
                document.setUpdatedAt(Instant.now());
                return repository.save(document);
            }

            logger.debug("[SubstitutionPlanPersistenceService] Stored plan {} unchanged, skipping update", document.getId());
            return document;
        }

        SubstitutionPlanDocument document = new SubstitutionPlanDocument(
                planUuid,
                table.getGroupName(),
                plan != null ? plan.getDate() : table.getDate(),
                resolveFileName(detailUrl),
                detailUrl,
                rawHtml,
                contentHash,
                Instant.now());
        applyMetadata(document, table, plan);

        logger.info("[SubstitutionPlanPersistenceService] Persisting new substitution plan for UUID {}", table.getUUID());
        try {
            return repository.save(document);
        } catch (DataIntegrityViolationException ex) {
            logger.debug("[SubstitutionPlanPersistenceService] Concurrent insert detected for {} - reusing existing entry", detailUrl);
            return repository.findByPlanUuidAndDetailUrl(planUuid, detailUrl)
                    .or(() -> repository.findByDetailUrl(detailUrl))
                    .orElseThrow(() -> ex);
        }
    }

    private void applyMetadata(SubstitutionPlanDocument document, TimeTable table, SubstitutionPlan plan) {
        document.setGroupName(table.getGroupName());
        document.setSourceDate(table.getDate());
        document.setSourceTitle(table.getTitle());
        document.setTitle(resolveFileName(document.getDetailUrl()));

        String planDate = plan != null ? plan.getDate() : null;
        if (planDate != null && !planDate.isBlank()) {
            document.setPlanDate(planDate);
            Matcher matcher = PAGE_PATTERN.matcher(planDate);
            if (matcher.find()) {
                document.setPageNumber(parseIntSafe(matcher.group(1)));
                document.setPageCount(parseIntSafe(matcher.group(2)));
            } else {
                document.setPageNumber(null);
                document.setPageCount(null);
            }
        } else {
            document.setPageNumber(null);
            document.setPageCount(null);
        }

        if (document.getPageNumber() == null) {
            Integer fromFile = pageFromFileName(document.getTitle());
            if (fromFile != null) {
                document.setPageNumber(fromFile);
            }
        }
    }

    private Integer parseIntSafe(String value) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            logger.debug("[SubstitutionPlanPersistenceService] Unable to parse integer from '{}': {}", value, ex.getMessage());
            return null;
        }
    }

    private String resolveFileName(String detailUrl) {
        if (detailUrl == null || detailUrl.isBlank()) {
            return null;
        }
        int lastSlash = detailUrl.lastIndexOf('/') + 1;
        if (lastSlash <= 0 || lastSlash >= detailUrl.length()) {
            return detailUrl;
        }
        return detailUrl.substring(lastSlash);
    }

    private Integer pageFromFileName(String fileName) {
        if (fileName == null) {
            return null;
        }
        Matcher matcher = Pattern.compile(".*?(\\d+)(?=\\.html?|$)").matcher(fileName);
        if (matcher.find()) {
            return parseIntSafe(matcher.group(1));
        }
        return null;
    }

    private String hashContent(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            return toHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm is not available", e);
        }
    }

    private String toHex(byte[] bytes) {
        char[] hexChars = new char[bytes.length * 2];
        for (int j = 0; j < bytes.length; j++) {
            int v = bytes[j] & 0xFF;
            hexChars[j * 2] = HEX_ARRAY[v >>> 4];
            hexChars[j * 2 + 1] = HEX_ARRAY[v & 0x0F];
        }
        return new String(hexChars);
    }
}
