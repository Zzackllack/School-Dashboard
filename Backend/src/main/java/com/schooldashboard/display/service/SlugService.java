package com.schooldashboard.display.service;

import com.schooldashboard.display.repository.DisplayRepository;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class SlugService {

	private final DisplayRepository displayRepository;

	public SlugService(DisplayRepository displayRepository) {
		this.displayRepository = displayRepository;
	}

	public String createUniqueSlug(String rawValue) {
		String baseSlug = slugify(rawValue);
		if (baseSlug.isBlank()) {
			baseSlug = "display";
		}

		String candidate = baseSlug;
		int suffix = 2;
		while (displayRepository.findBySlug(candidate).isPresent()) {
			candidate = baseSlug + "-" + suffix;
			suffix++;
		}
		return candidate;
	}

	public String slugify(String rawValue) {
		if (rawValue == null) {
			return "";
		}
		String lower = rawValue.toLowerCase(Locale.ROOT).trim();
		String normalized = lower.replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
		return normalized;
	}
}
