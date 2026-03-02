package com.schooldashboard.display.service;

import com.schooldashboard.display.web.DisplayDomainException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class TokenHashService {

	public String hash(String value) {
		if (value == null || value.isBlank()) {
			throw new DisplayDomainException("DISPLAY_TOKEN_INVALID", HttpStatus.BAD_REQUEST,
					"Token must not be blank");
		}
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hashBytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
			StringBuilder builder = new StringBuilder(hashBytes.length * 2);
			for (byte hashByte : hashBytes) {
				builder.append(String.format("%02x", hashByte));
			}
			return builder.toString();
		} catch (NoSuchAlgorithmException exception) {
			throw new DisplayDomainException("DISPLAY_HASH_UNAVAILABLE", HttpStatus.INTERNAL_SERVER_ERROR,
					"Hash algorithm unavailable");
		}
	}
}
