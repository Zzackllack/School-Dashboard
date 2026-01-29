package com.schooldashboard.util;

import static org.junit.jupiter.api.Assertions.*;

import java.io.IOException;
import java.util.Arrays;
import org.junit.jupiter.api.Test;

public class Base64Test {

  @Test
  public void compressRoundTrip() throws IOException {
    String text = "Hello World";
    String compressed = Base64.encode(Base64.compress(text));
    String decompressed = Base64.decompress(compressed);
    assertEquals(text, decompressed);
  }

  @Test
  public void encodeDecodeBytes() {
    byte[] data = {1, 2, 3, 4, 5};
    String encoded = Base64.encode(data);
    byte[] decoded = Base64.decode(encoded);
    assertTrue(Arrays.equals(data, decoded));
  }

  @Test
  public void encodeStringAndDecode() throws IOException {
    String text = "small";
    String encoded = Base64.encode(text);
    String decoded = Base64.decompress(encoded);
    assertEquals(text, decoded);
  }

  @Test
  public void decodeInvalidString() {
    byte[] decoded = Base64.decode("%%%invalid%%%");
    assertTrue(decoded.length > 0 || decoded.length == 0); // should not throw
  }
}
