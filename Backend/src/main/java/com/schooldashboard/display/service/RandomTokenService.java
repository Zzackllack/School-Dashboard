package com.schooldashboard.display.service;

import java.security.SecureRandom;
import org.springframework.stereotype.Service;

@Service
public class RandomTokenService {

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
		StringBuilder builder = new StringBuilder(length);
		for (int i = 0; i < length; i++) {
			builder.append(alphabet.charAt(random.nextInt(alphabet.length())));
		}
		return builder.toString();
	}
}
