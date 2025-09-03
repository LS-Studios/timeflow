
"use client";

/**
 * @fileOverview CryptoService provides a suite of cryptographic functions
 * based on the Web Crypto API to implement a hybrid encryption scheme.
 *
 * It supports:
 * - Deriving a key from a user's password (KEK).
 * - Generating a primary data encryption key (DEK).
 * - Wrapping (encrypting) and unwrapping (decrypting) the DEK with the KEK.
 * - Encrypting and decrypting arbitrary data with the DEK.
 * - Generating RSA key pairs for organizations.
 * - Encrypting the DEK with an organization's public key.
 * - Decrypting the DEK with an organization's private key.
 *
 * This service ensures that sensitive user data can be stored securely
 * in a database without the server ever having access to the unencrypted content.
 */
class CryptoService {
  private subtle = window.crypto.subtle;
  private textEncoder = new TextEncoder();
  private textDecoder = new TextDecoder();

  // --- Configuration ---
  private KEK_ALGORITHM = { name: "PBKDF2" };
  private KEK_PARAMS = {
    salt: new Uint8Array(16), // This should be unique per user and stored
    iterations: 250000,
    hash: "SHA-256",
  };
  private DEK_ALGORITHM = { name: "AES-GCM", length: 256 };
  private WRAP_ALGORITHM = { name: "AES-KW" };
  private ORG_KEY_ALGORITHM = {
    name: "RSA-OAEP",
    modulusLength: 4096,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
  };

  // --- Helper Methods ---

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // === PUBLIC API ===

  // --- Key Generation & Derivation ---

  /**
   * Generates a new random salt for use in key derivation.
   * A unique salt should be created for each user upon registration.
   */
  public generateSalt(): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(16));
  }

  /**
   * Derives a key encryption key (KEK) from a user's password and a salt.
   * This key is used to wrap/unwrap the data encryption key (DEK).
   * @param password The user's password.
   * @param salt A unique salt for the user.
   * @returns A Promise that resolves to a CryptoKey (KEK).
   */
  public async deriveKeyFromPassword(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const keyMaterial = await this.subtle.importKey(
      "raw",
      this.textEncoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    return this.subtle.deriveKey(
      { ...this.KEK_PARAMS, salt },
      keyMaterial,
      this.WRAP_ALGORITHM,
      true,
      ["wrapKey", "unwrapKey"]
    );
  }

  /**
   * Generates a new random data encryption key (DEK).
   * This key is used for the actual encryption of user data.
   * @returns A Promise that resolves to a CryptoKey (DEK).
   */
  public async generateDataKey(): Promise<CryptoKey> {
    return this.subtle.generateKey(this.DEK_ALGORITHM, true, [
      "encrypt",
      "decrypt",
    ]);
  }
  
  /**
   * Generates a new RSA key pair for an organization.
   * @returns A Promise resolving to a CryptoKeyPair (public and private keys).
   */
  public async generateOrgKeyPair(): Promise<CryptoKeyPair> {
    return this.subtle.generateKey(this.ORG_KEY_ALGORITHM, true, [
      "encrypt",
      "decrypt",
      "wrapKey",
      "unwrapKey",
    ]);
  }


  // --- Data Encryption & Decryption ---

  /**
   * Encrypts a JSON-serializable object using the provided data key (DEK).
   * @param data The object to encrypt.
   * @param dataKey The DEK (AES-GCM key).
   * @returns A Promise resolving to a Base64 string of the encrypted data.
   */
  public async encryptData(data: object, dataKey: CryptoKey): Promise<string> {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const plaintext = this.textEncoder.encode(JSON.stringify(data));

    const ciphertext = await this.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      dataKey,
      plaintext
    );

    // Prepend IV to ciphertext and return as Base64
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return this.arrayBufferToBase64(combined.buffer);
  }

  /**
   * Decrypts a Base64 string back into an object.
   * @param encryptedData The Base64 encrypted string.
   * @param dataKey The DEK (AES-GCM key) to use for decryption.
   * @returns A Promise resolving to the original decrypted object.
   */
  public async decryptData<T>(
    encryptedData: string,
    dataKey: CryptoKey
  ): Promise<T> {
    const combined = this.base64ToArrayBuffer(encryptedData);
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const decrypted = await this.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      dataKey,
      ciphertext
    );

    return JSON.parse(this.textDecoder.decode(decrypted));
  }


  // --- Key Management (Wrapping & Unwrapping) ---

  /**
   * Encrypts (wraps) a data key (DEK) using a key encryption key (KEK).
   * @param dataKey The DEK to wrap.
   * @param keyEncryptionKey The KEK (derived from password) to use for wrapping.
   * @returns A Promise resolving to the wrapped key as a Base64 string.
   */
  public async wrapDataKey(
    dataKey: CryptoKey,
    keyEncryptionKey: CryptoKey
  ): Promise<string> {
    const wrappedKey = await this.subtle.wrapKey(
      "raw",
      dataKey,
      keyEncryptionKey,
      this.WRAP_ALGORITHM
    );
    return this.arrayBufferToBase64(wrappedKey);
  }

  /**
   * Decrypts (unwraps) a data key (DEK) using a key encryption key (KEK).
   * @param wrappedKeyB64 The Base64 string of the wrapped DEK.
   * @param keyEncryptionKey The KEK (derived from password) to use for unwrapping.
   * @returns A Promise resolving to the unwrapped CryptoKey (DEK).
   */
  public async unwrapDataKey(
    wrappedKeyB64: string,
    keyEncryptionKey: CryptoKey
  ): Promise<CryptoKey> {
    const wrappedKey = this.base64ToArrayBuffer(wrappedKeyB64);
    return this.subtle.unwrapKey(
      "raw",
      wrappedKey,
      keyEncryptionKey,
      this.WRAP_ALGORITHM,
      this.DEK_ALGORITHM,
      true,
      ["encrypt", "decrypt"]
    );
  }

  // --- Asymmetric Key Management (For Organization Admins) ---
  
  /**
   * Encrypts a user's data key (DEK) with the organization's public key.
   * @param dataKey The user's DEK.
   * @param orgPublicKey The organization's public key.
   * @returns A Promise resolving to the asymmetrically encrypted DEK as a Base64 string.
   */
  public async encryptDataKeyForOrg(
    dataKey: CryptoKey,
    orgPublicKey: CryptoKey
  ): Promise<string> {
    const exportedDek = await this.subtle.exportKey("raw", dataKey);
    const encryptedDek = await this.subtle.encrypt(
      this.ORG_KEY_ALGORITHM,
      orgPublicKey,
      exportedDek
    );
    return this.arrayBufferToBase64(encryptedDek);
  }

  /**
   * Decrypts a user's data key (DEK) with the organization's private key.
   * @param encryptedDekB64 The asymmetrically encrypted DEK (Base64).
   * @param orgPrivateKey The admin's decrypted private key.
   * @returns A Promise resolving to the user's CryptoKey (DEK).
   */
  public async decryptDataKeyForOrg(
    encryptedDekB64: string,
    orgPrivateKey: CryptoKey
  ): Promise<CryptoKey> {
    const encryptedDek = this.base64ToArrayBuffer(encryptedDekB64);
    const decryptedDekBuffer = await this.subtle.decrypt(
      this.ORG_KEY_ALGORITHM,
      orgPrivateKey,
      encryptedDek
    );
    // Re-import the raw key buffer as a usable AES-GCM key
    return this.subtle.importKey(
        "raw", 
        decryptedDekBuffer, 
        this.DEK_ALGORITHM, 
        true, 
        ["encrypt", "decrypt"]
    );
  }

  // --- Key Export/Import (for storage) ---

  /**
   * Exports a CryptoKey to a storable JSON Web Key (JWK) format.
   * @param key The key to export.
   * @returns A Promise resolving to the JWK object.
   */
  public async exportKeyToJwk(key: CryptoKey): Promise<JsonWebKey> {
      return this.subtle.exportKey("jwk", key);
  }

  /**
   * Imports a key from its JWK format.
   * @param jwk The JWK object.
   * @param algorithm The algorithm the key is for.
   * @param usages The allowed usages for the imported key.
   * @returns A Promise resolving to a CryptoKey.
   */
  public async importKeyFromJwk(jwk: JsonWebKey, algorithm: AlgorithmIdentifier, usages: KeyUsage[]): Promise<CryptoKey> {
      return this.subtle.importKey("jwk", jwk, algorithm, true, usages);
  }

}

// Export a singleton instance of the service.
export const cryptoService = new CryptoService();
