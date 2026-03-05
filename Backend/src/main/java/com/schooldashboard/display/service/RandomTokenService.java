package com.schooldashboard.display.service;

import java.security.SecureRandom;
import org.springframework.stereotype.Service;

@Service
public class RandomTokenService {

	private static final int MAX_TOKEN_LENGTH = 1024;
	private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	private static final String TOKEN_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	private final SecureRandom random = new SecureRandom();

	public String nextEnrollmentCode(int length) {
		return nextToken(length, CODE_ALPHABET);
	}

	public String nextSessionToken(int length) {
		return nextToken(length, TOKEN_ALPHABET);
	}

	private String nextToken(int length, String alphabet) {
		if (length <= 0) {
			throw new IllegalArgumentException("length must be greater than 0");
		}
		if (length > MAX_TOKEN_LENGTH) {
			throw new IllegalArgumentException("length must be less than or equal to " + MAX_TOKEN_LENGTH);
		}
		if (alphabet == null || alphabet.isEmpty()) {
			throw new IllegalArgumentException("alphabet must not be null or empty");
		}
		StringBuilder builder = new StringBuilder(length);
		for (int i = 0; i < length; i++) {
			builder.append(alphabet.charAt(random.nextInt(alphabet.length())));
		}
		return builder.toString();
	}
}
