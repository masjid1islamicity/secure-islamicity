// Real cryptographic operations & Post-Quantum Simulation Utilities

export async function encryptAESGCM(
  plaintext: string,
  rawKeyHex?: string
): Promise<{
  ciphertextHex: string;
  ivHex: string;
  authTagHex: string;
  keyHex: string;
  durationUs: number;
  entropy: number;
}> {
  const start = performance.now();
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate 256-bit key or import
  let key: CryptoKey;
  let keyHex = rawKeyHex;

  if (rawKeyHex && rawKeyHex.length === 64) {
    const keyBytes = hexToUint8Array(rawKeyHex);
    key = await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
  } else {
    key = await window.crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
    const exported = await window.crypto.subtle.exportKey("raw", key);
    keyHex = uint8ArrayToHex(new Uint8Array(exported));
  }

  // 96-bit random IV (standard for AES-GCM)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ivHex = uint8ArrayToHex(iv);

  // Encrypt with 128-bit tag length
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    key,
    data
  );

  const encryptedArray = new Uint8Array(encryptedBuffer);
  // In WebCrypto SubtleCrypto AES-GCM, the last 16 bytes is the authentication tag
  const tagLengthBytes = 16;
  const ciphertextBytes = encryptedArray.slice(0, encryptedArray.length - tagLengthBytes);
  const tagBytes = encryptedArray.slice(encryptedArray.length - tagLengthBytes);

  const ciphertextHex = uint8ArrayToHex(ciphertextBytes);
  const authTagHex = uint8ArrayToHex(tagBytes);
  const durationUs = Math.round((performance.now() - start) * 1000);
  const entropy = calculateShannonEntropy(encryptedArray);

  return {
    ciphertextHex,
    ivHex,
    authTagHex,
    keyHex: keyHex || "",
    durationUs,
    entropy,
  };
}

export async function decryptAESGCM(
  ciphertextHex: string,
  ivHex: string,
  authTagHex: string,
  keyHex: string
): Promise<{ success: boolean; plaintext?: string; error?: string }> {
  try {
    const keyBytes = hexToUint8Array(keyHex);
    const iv = hexToUint8Array(ivHex);
    const cipherBytes = hexToUint8Array(ciphertextHex);
    const tagBytes = hexToUint8Array(authTagHex);

    // Concatenate ciphertext + tag for WebCrypto
    const combined = new Uint8Array(cipherBytes.length + tagBytes.length);
    combined.set(cipherBytes, 0);
    combined.set(tagBytes, cipherBytes.length);

    const key = await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv, tagLength: 128 },
      key,
      combined
    );

    const decoder = new TextDecoder();
    return {
      success: true,
      plaintext: decoder.decode(decrypted),
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Gagal Verifikasi Tag Autentikasi (Integritas Terganggu / Kunci Salah)",
    };
  }
}

// Calculate Shannon Entropy (bits per byte: 0.0 to 8.0)
export function calculateShannonEntropy(byteArray: Uint8Array): number {
  if (byteArray.length === 0) return 0;
  const frequencies = new Map<number, number>();
  for (const byte of byteArray) {
    frequencies.set(byte, (frequencies.get(byte) || 0) + 1);
  }

  let entropy = 0;
  const len = byteArray.length;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return Number(entropy.toFixed(4));
}

// Helpers
export function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.replace(/[^0-9a-fA-F]/g, "");
  const bytes = new Uint8Array(Math.floor(cleanHex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

export function generateRandomHex(byteCount: number): string {
  const bytes = window.crypto.getRandomValues(new Uint8Array(byteCount));
  return uint8ArrayToHex(bytes);
}

// Post-Quantum Kyber-768 (ML-KEM) Key Encapsulation Simulator
export function simulateKyber768Encapsulation(): {
  publicKeyHex: string;
  ciphertextHex: string;
  sharedSecretHex: string;
  algorithm: string;
  securityBits: number;
} {
  // Kyber-768 public key size ~ 1184 bytes, ciphertext ~ 1088 bytes, shared secret = 32 bytes (256 bits)
  const pk = generateRandomHex(64); // Represented as truncated preview
  const ct = generateRandomHex(64);
  const ss = generateRandomHex(32);

  return {
    publicKeyHex: `kyber768_pk_${pk}...[1184 bytes total]`,
    ciphertextHex: `kyber768_ct_${ct}...[1088 bytes total]`,
    sharedSecretHex: ss,
    algorithm: "NIST FIPS 203 ML-KEM-768 (Quantum-Resistant)",
    securityBits: 192,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
