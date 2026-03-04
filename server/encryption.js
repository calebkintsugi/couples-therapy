import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Get encryption key from environment
function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn('ENCRYPTION_KEY not set - data will not be encrypted');
    return null;
  }
  // Key should be 32 bytes (256 bits) - we'll hash it to ensure correct length
  return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a string
 * Returns format: iv:authTag:encryptedData (all base64)
 */
export function encrypt(text) {
  if (!text) return text;

  const key = getKey();
  if (!key) return text; // No encryption if key not set

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Return plaintext if encryption fails
  }
}

/**
 * Decrypt a string
 * Expects format: iv:authTag:encryptedData (all base64)
 */
export function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;

  const key = getKey();
  if (!key) return encryptedText; // No decryption if key not set

  // Check if this looks like encrypted data (has our format)
  if (!encryptedText.includes(':')) {
    return encryptedText; // Not encrypted, return as-is
  }

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      return encryptedText; // Not our format, return as-is
    }

    const iv = Buffer.from(parts[0], 'base64');
    const authTag = Buffer.from(parts[1], 'base64');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // Could be plaintext data from before encryption was enabled
    console.warn('Decryption failed, returning original:', error.message);
    return encryptedText;
  }
}

/**
 * Encrypt multiple fields in an object
 */
export function encryptFields(obj, fields) {
  if (!obj) return obj;
  const result = { ...obj };
  for (const field of fields) {
    if (result[field]) {
      result[field] = encrypt(result[field]);
    }
  }
  return result;
}

/**
 * Decrypt multiple fields in an object
 */
export function decryptFields(obj, fields) {
  if (!obj) return obj;
  const result = { ...obj };
  for (const field of fields) {
    if (result[field]) {
      result[field] = decrypt(result[field]);
    }
  }
  return result;
}

/**
 * Decrypt an array of objects
 */
export function decryptRows(rows, fields) {
  return rows.map(row => decryptFields(row, fields));
}
