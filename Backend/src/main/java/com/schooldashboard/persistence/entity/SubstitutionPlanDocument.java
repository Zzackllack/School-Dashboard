package com.schooldashboard.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;

@Entity
@Table(
    name = "substitution_plan_documents",
    uniqueConstraints = @UniqueConstraint(columnNames = {"plan_uuid", "detail_url"}))
public class SubstitutionPlanDocument {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "plan_uuid", nullable = false, length = 36)
  private String planUuid;

  @Column(name = "group_name")
  private String groupName;

  @Column(name = "plan_date")
  private String planDate;

  @Column(name = "title")
  private String title;

  @Column(name = "source_date")
  private String sourceDate;

  @Column(name = "source_title")
  private String sourceTitle;

  @Column(name = "detail_url", nullable = false, length = 1024)
  private String detailUrl;

  @Lob
  @Column(name = "raw_html", nullable = false)
  private String rawHtml;

  @Column(name = "content_hash", nullable = false, length = 64)
  private String contentHash;

  @Column(name = "fetched_at", nullable = false)
  private Instant fetchedAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(name = "page_number")
  private Integer pageNumber;

  @Column(name = "page_count")
  private Integer pageCount;

  protected SubstitutionPlanDocument() {
    // JPA requires a no-args constructor
  }

  public SubstitutionPlanDocument(
      String planUuid,
      String groupName,
      String planDate,
      String title,
      String detailUrl,
      String rawHtml,
      String contentHash,
      Instant fetchedAt) {
    this.planUuid = planUuid;
    this.groupName = groupName;
    this.planDate = planDate;
    this.title = title;
    this.detailUrl = detailUrl;
    this.rawHtml = rawHtml;
    this.contentHash = contentHash;
    this.fetchedAt = fetchedAt;
    this.updatedAt = fetchedAt;
  }

  @PrePersist
  void onCreate() {
    Instant now = Instant.now();
    if (fetchedAt == null) {
      fetchedAt = now;
    }
    if (updatedAt == null) {
      updatedAt = fetchedAt;
    }
  }

  @PreUpdate
  void onUpdate() {
    updatedAt = Instant.now();
  }

  public Long getId() {
    return id;
  }

  public String getPlanUuid() {
    return planUuid;
  }

  public void setPlanUuid(String planUuid) {
    this.planUuid = planUuid;
  }

  public String getGroupName() {
    return groupName;
  }

  public void setGroupName(String groupName) {
    this.groupName = groupName;
  }

  public String getPlanDate() {
    return planDate;
  }

  public void setPlanDate(String planDate) {
    this.planDate = planDate;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getSourceDate() {
    return sourceDate;
  }

  public void setSourceDate(String sourceDate) {
    this.sourceDate = sourceDate;
  }

  public String getSourceTitle() {
    return sourceTitle;
  }

  public void setSourceTitle(String sourceTitle) {
    this.sourceTitle = sourceTitle;
  }

  public String getDetailUrl() {
    return detailUrl;
  }

  public void setDetailUrl(String detailUrl) {
    this.detailUrl = detailUrl;
  }

  public String getRawHtml() {
    return rawHtml;
  }

  public void setRawHtml(String rawHtml) {
    this.rawHtml = rawHtml;
  }

  public String getContentHash() {
    return contentHash;
  }

  public void setContentHash(String contentHash) {
    this.contentHash = contentHash;
  }

  public Instant getFetchedAt() {
    return fetchedAt;
  }

  public void setFetchedAt(Instant fetchedAt) {
    this.fetchedAt = fetchedAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  public Integer getPageNumber() {
    return pageNumber;
  }

  public void setPageNumber(Integer pageNumber) {
    this.pageNumber = pageNumber;
  }

  public Integer getPageCount() {
    return pageCount;
  }

  public void setPageCount(Integer pageCount) {
    this.pageCount = pageCount;
  }
}
