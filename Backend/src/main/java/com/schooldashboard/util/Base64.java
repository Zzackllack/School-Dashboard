package com.schooldashboard.util;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

public class Base64 {

	private static final char[] TABLE_ENCODE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
			.toCharArray();
	private static final int[] TABLE_DECODE = {-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1,
			-1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8,
			9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29,
			30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1,
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
			-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1};

	public static String encode(byte[] data) {
		StringBuilder builder = new StringBuilder();
		int padding = 0;
		for (int index = 0; index < data.length; index += 3) {

			int b = ((data[index] & 0xFF) << 16) & 0xFFFFFF;
			if (index + 1 < data.length) {
				b |= (data[index + 1] & 0xFF) << 8;
			} else {
				padding++;
			}

			if (index + 2 < data.length) {
				b |= (data[index + 2] & 0xFF);
			} else {
				padding++;
			}

			for (int k = 0; k < 4 - padding; k++) {
				int c = (b & 0xFC0000) >> 18;
				builder.append(TABLE_ENCODE[c]);
				b <<= 6;
			}
		}

		for (int i = 0; i < padding; i++) {
			builder.append("=");
		}

		return builder.toString();
	}

	public static byte[] decode(String data) {
		byte[] bytes;
		try {
			bytes = data.getBytes("UTF-8");
		} catch (UnsupportedEncodingException e) {
			throw new RuntimeException("UTF-8 is not supported!", e);
		}

		ByteArrayOutputStream buffer = new ByteArrayOutputStream();
		for (int i = 0; i < bytes.length;) {
			int k = 0;
			int index0 = bytes[i] & 0xFF;
			int value0 = index0 < TABLE_DECODE.length ? TABLE_DECODE[index0] : -1;
			if (value0 != -1) {
				k = (value0 & 0xFF) << 18;
			} else { // skip unknown characters
				i++;
				continue;
			}

			int num = 0;
			int index1 = (i + 1) < bytes.length ? (bytes[i + 1] & 0xFF) : -1;
			int value1 = (index1 >= 0 && index1 < TABLE_DECODE.length) ? TABLE_DECODE[index1] : -1;
			if (i + 1 < bytes.length && value1 != -1) {
				k = k | ((value1 & 0xFF) << 12);
				num++;
			}

			int index2 = (i + 2) < bytes.length ? (bytes[i + 2] & 0xFF) : -1;
			int value2 = (index2 >= 0 && index2 < TABLE_DECODE.length) ? TABLE_DECODE[index2] : -1;
			if (i + 2 < bytes.length && value2 != -1) {
				k = k | ((value2 & 0xFF) << 6);
				num++;
			}

			int index3 = (i + 3) < bytes.length ? (bytes[i + 3] & 0xFF) : -1;
			int value3 = (index3 >= 0 && index3 < TABLE_DECODE.length) ? TABLE_DECODE[index3] : -1;
			if (i + 3 < bytes.length && value3 != -1) {
				k = k | (value3 & 0xFF);
				num++;
			}

			while (num > 0) {
				int c = (k & 0xFF0000) >> 16;
				buffer.write((char) c);
				k <<= 8;
				num--;
			}

			i += 4;
		}

		return buffer.toByteArray();
	}

	public static String decompress(String data) throws IOException {
		return decompress(decode(data));
	}

	public static String decompress(byte[] data) throws IOException {
		GZIPInputStream inputStream = new GZIPInputStream(new ByteArrayInputStream(data));
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream(inputStream.available());
		byte[] buffer = new byte[1024];

		int len;
		while ((len = inputStream.read(buffer)) > 0) {
			outputStream.write(buffer, 0, len);
		}

		outputStream.close();
		byte[] bytes = outputStream.toByteArray();
		return new String(bytes, "UTF-8");
	}

	public static String encode(String data) throws IOException {
		return encode(compress(data));
	}

	public static byte[] compress(String data) throws IOException {
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream(data.length());

		GZIPOutputStream gzipOutputStream = new GZIPOutputStream(outputStream);
		gzipOutputStream.write(data.getBytes("UTF-8"));
		gzipOutputStream.close();

		return outputStream.toByteArray();
	}
}
