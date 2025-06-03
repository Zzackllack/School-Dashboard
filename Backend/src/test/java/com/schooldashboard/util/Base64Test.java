package com.schooldashboard.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class Base64Test {

    @Test
    void encodeDecodeRoundTrip() {
        String original = "Hello Test 123 äöüß";
        String encoded = Base64.encode(original.getBytes(StandardCharsets.UTF_8));
        byte[] decoded = Base64.decode(encoded);
        assertEquals(original, new String(decoded, StandardCharsets.UTF_8));
    }

    @Test
    void compressDecompressRoundTrip() throws IOException {
        String original = "Compress this text";
        byte[] compressed = Base64.compress(original);
        String decompressed = Base64.decompress(compressed);
        assertEquals(original, decompressed);
    }

    @Test
    void encodeStringAndDecompress() throws IOException {
        String original = "Another text to encode";
        String encoded = Base64.encode(original);
        String decoded = Base64.decompress(encoded);
        assertEquals(original, decoded);
    }
}
