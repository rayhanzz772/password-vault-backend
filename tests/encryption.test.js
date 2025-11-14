/**
 * Encryption Utilities Test Suite
 *
 * Tests for src/utils/encryption.js
 * - Argon2id KDF with custom parameters
 * - AES-256-GCM encryption/decryption
 * - Salt generation and handling
 * - Error cases and edge cases
 */

const { encrypt, decrypt } = require('../src/utils/encryption')

describe('Encryption Utilities', () => {
  describe('Basic Encryption/Decryption', () => {
    test('should encrypt and decrypt a simple string', async () => {
      const plainText = 'Hello, World!'
      const masterPassword = 'myMasterPassword123'

      const encrypted = await encrypt(plainText, masterPassword)
      const decrypted = await decrypt(encrypted, masterPassword)

      expect(decrypted).toBe(plainText)
    })

    test('should encrypt and decrypt empty string', async () => {
      const plainText = ''
      const masterPassword = 'myMasterPassword123'

      const encrypted = await encrypt(plainText, masterPassword)
      const decrypted = await decrypt(encrypted, masterPassword)

      expect(decrypted).toBe(plainText)
    })

    test('should encrypt and decrypt long text', async () => {
      const plainText = 'A'.repeat(10000) // 10KB of text
      const masterPassword = 'myMasterPassword123'

      const encrypted = await encrypt(plainText, masterPassword)
      const decrypted = await decrypt(encrypted, masterPassword)

      expect(decrypted).toBe(plainText)
    })

    test('should encrypt and decrypt text with special characters', async () => {
      const plainText = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`\n\t\r'
      const masterPassword = 'myMasterPassword123'

      const encrypted = await encrypt(plainText, masterPassword)
      const decrypted = await decrypt(encrypted, masterPassword)

      expect(decrypted).toBe(plainText)
    })

    test('should encrypt and decrypt unicode text', async () => {
      const plainText = '你好世界 🔐 مرحبا بالعالم'
      const masterPassword = 'myMasterPassword123'

      const encrypted = await encrypt(plainText, masterPassword)
      const decrypted = await decrypt(encrypted, masterPassword)

      expect(decrypted).toBe(plainText)
    })

    test('should encrypt and decrypt JSON string', async () => {
      const jsonData = {
        username: 'admin',
        password: 'secret123',
        nested: { key: 'value' }
      }
      const plainText = JSON.stringify(jsonData)
      const masterPassword = 'myMasterPassword123'

      const encrypted = await encrypt(plainText, masterPassword)
      const decrypted = await decrypt(encrypted, masterPassword)

      expect(decrypted).toBe(plainText)
      expect(JSON.parse(decrypted)).toEqual(jsonData)
    })
  })

  describe('Encrypted Output Structure', () => {
    test('should return encrypted object with required fields', async () => {
      const plainText = 'test message'
      const masterPassword = 'password123'

      const encrypted = await encrypt(plainText, masterPassword)

      expect(encrypted).toHaveProperty('salt')
      expect(encrypted).toHaveProperty('iv')
      expect(encrypted).toHaveProperty('tag')
      expect(encrypted).toHaveProperty('data')

      expect(typeof encrypted.salt).toBe('string')
      expect(typeof encrypted.iv).toBe('string')
      expect(typeof encrypted.tag).toBe('string')
      expect(typeof encrypted.data).toBe('string')
    })

    test('should generate unique salt for each encryption', async () => {
      const plainText = 'test message'
      const masterPassword = 'password123'

      const encrypted1 = await encrypt(plainText, masterPassword)
      const encrypted2 = await encrypt(plainText, masterPassword)

      expect(encrypted1.salt).not.toBe(encrypted2.salt)
      expect(encrypted1.iv).not.toBe(encrypted2.iv)
      expect(encrypted1.data).not.toBe(encrypted2.data)
    })

    test('should generate valid hex strings for all fields', async () => {
      const plainText = 'test message'
      const masterPassword = 'password123'

      const encrypted = await encrypt(plainText, masterPassword)

      // Hex regex pattern
      const hexPattern = /^[0-9a-f]+$/i

      expect(encrypted.salt).toMatch(hexPattern)
      expect(encrypted.iv).toMatch(hexPattern)
      expect(encrypted.tag).toMatch(hexPattern)
      expect(encrypted.data).toMatch(hexPattern)
    })

    test('should generate salt of expected length (32 hex chars = 16 bytes)', async () => {
      const plainText = 'test'
      const masterPassword = 'password'

      const encrypted = await encrypt(plainText, masterPassword)

      expect(encrypted.salt.length).toBe(32) // 16 bytes * 2 (hex)
      expect(encrypted.iv.length).toBe(24) // 12 bytes * 2 (hex)
      expect(encrypted.tag.length).toBe(32) // 16 bytes * 2 (hex)
    })
  })

  describe('Custom KDF Parameters', () => {
    test('should accept custom Argon2 parameters', async () => {
      const plainText = 'test message'
      const masterPassword = 'password123'

      const customParams = {
        memoryCost: 2 ** 14, // 16 MB
        timeCost: 2,
        parallelism: 1
      }

      const encrypted = await encrypt(plainText, masterPassword, customParams)
      const decrypted = await decrypt(encrypted, masterPassword, customParams)

      expect(decrypted).toBe(plainText)
    })

    test('should work with higher security parameters', async () => {
      const plainText = 'sensitive data'
      const masterPassword = 'strongPassword123!'

      const highSecurityParams = {
        memoryCost: 2 ** 17, // 128 MB
        timeCost: 4,
        parallelism: 2
      }

      const encrypted = await encrypt(
        plainText,
        masterPassword,
        highSecurityParams
      )
      const decrypted = await decrypt(
        encrypted,
        masterPassword,
        highSecurityParams
      )

      expect(decrypted).toBe(plainText)
    }, 10000) // Increase timeout for slower KDF

    test('should work with minimal parameters', async () => {
      const plainText = 'test'
      const masterPassword = 'pass'

      const minimalParams = {
        memoryCost: 2 ** 12, // 4 MB
        timeCost: 1,
        parallelism: 1
      }

      const encrypted = await encrypt(plainText, masterPassword, minimalParams)
      const decrypted = await decrypt(encrypted, masterPassword, minimalParams)

      expect(decrypted).toBe(plainText)
    })
  })

  describe('Password Sensitivity', () => {
    test('should fail decryption with wrong password', async () => {
      const plainText = 'secret message'
      const correctPassword = 'correct123'
      const wrongPassword = 'wrong123'

      const encrypted = await encrypt(plainText, correctPassword)

      await expect(decrypt(encrypted, wrongPassword)).rejects.toThrow()
    })

    test('should be case-sensitive for passwords', async () => {
      const plainText = 'secret'
      const password1 = 'Password123'
      const password2 = 'password123'

      const encrypted = await encrypt(plainText, password1)

      await expect(decrypt(encrypted, password2)).rejects.toThrow()
    })

    test('should handle password with spaces', async () => {
      const plainText = 'secret message'
      const password = 'my password with spaces'

      const encrypted = await encrypt(plainText, password)
      const decrypted = await decrypt(encrypted, password)

      expect(decrypted).toBe(plainText)
    })

    test('should handle very long passwords', async () => {
      const plainText = 'secret'
      const longPassword = 'a'.repeat(1000)

      const encrypted = await encrypt(plainText, longPassword)
      const decrypted = await decrypt(encrypted, longPassword)

      expect(decrypted).toBe(plainText)
    })
  })

  describe('Error Handling', () => {
    test('should fail with corrupted encrypted data', async () => {
      const plainText = 'secret'
      const password = 'password123'

      const encrypted = await encrypt(plainText, password)

      // Corrupt the data
      encrypted.data =
        encrypted.data.substring(0, encrypted.data.length - 4) + 'ffff'

      await expect(decrypt(encrypted, password)).rejects.toThrow()
    })

    test('should fail with corrupted IV', async () => {
      const plainText = 'secret'
      const password = 'password123'

      const encrypted = await encrypt(plainText, password)

      // Corrupt the IV
      encrypted.iv = '000000000000000000000000'

      await expect(decrypt(encrypted, password)).rejects.toThrow()
    })

    test('should fail with corrupted tag', async () => {
      const plainText = 'secret'
      const password = 'password123'

      const encrypted = await encrypt(plainText, password)

      // Corrupt the auth tag
      encrypted.tag = '00000000000000000000000000000000'

      await expect(decrypt(encrypted, password)).rejects.toThrow()
    })

    test('should fail with corrupted salt', async () => {
      const plainText = 'secret'
      const password = 'password123'

      const encrypted = await encrypt(plainText, password)

      // Corrupt the salt
      encrypted.salt = '00000000000000000000000000000000'

      await expect(decrypt(encrypted, password)).rejects.toThrow()
    })

    test('should fail with mismatched KDF parameters', async () => {
      const plainText = 'secret'
      const password = 'password123'

      const params1 = { memoryCost: 2 ** 14, timeCost: 2, parallelism: 1 }
      const params2 = { memoryCost: 2 ** 15, timeCost: 3, parallelism: 1 }

      const encrypted = await encrypt(plainText, password, params1)

      await expect(decrypt(encrypted, password, params2)).rejects.toThrow()
    })
  })

  describe('Additional Authenticated Data (AAD)', () => {
    test('should encrypt and decrypt with AAD', async () => {
      const plainText = 'secret message'
      const password = 'password123'
      const aad = 'user_id_12345'

      const encrypted = await encrypt(plainText, password, {}, aad)
      const decrypted = await decrypt(encrypted, password, {}, aad)

      expect(decrypted).toBe(plainText)
    })

    test('should fail decryption with wrong AAD', async () => {
      const plainText = 'secret message'
      const password = 'password123'
      const correctAAD = 'user_id_12345'
      const wrongAAD = 'user_id_99999'

      const encrypted = await encrypt(plainText, password, {}, correctAAD)

      await expect(decrypt(encrypted, password, {}, wrongAAD)).rejects.toThrow()
    })

    test('should fail decryption when AAD is missing', async () => {
      const plainText = 'secret message'
      const password = 'password123'
      const aad = 'user_id_12345'

      const encrypted = await encrypt(plainText, password, {}, aad)

      await expect(decrypt(encrypted, password, {}, null)).rejects.toThrow()
    })

    test('should work without AAD (null)', async () => {
      const plainText = 'secret message'
      const password = 'password123'

      const encrypted = await encrypt(plainText, password, {}, null)
      const decrypted = await decrypt(encrypted, password, {}, null)

      expect(decrypted).toBe(plainText)
    })
  })

  describe('Performance and Security', () => {
    test('should complete encryption in reasonable time (default params)', async () => {
      const plainText = 'performance test'
      const password = 'password123'

      const startTime = Date.now()
      await encrypt(plainText, password)
      const duration = Date.now() - startTime

      // Default Argon2 params should complete in < 500ms on modern hardware
      expect(duration).toBeLessThan(500)
    })

    test('should produce different outputs for same input (randomness)', async () => {
      const plainText = 'test'
      const password = 'password'

      const results = await Promise.all([
        encrypt(plainText, password),
        encrypt(plainText, password),
        encrypt(plainText, password)
      ])

      // All salts should be unique
      const salts = results.map((r) => r.salt)
      const uniqueSalts = new Set(salts)
      expect(uniqueSalts.size).toBe(3)

      // All IVs should be unique
      const ivs = results.map((r) => r.iv)
      const uniqueIVs = new Set(ivs)
      expect(uniqueIVs.size).toBe(3)
    })

    test('should handle concurrent encryptions', async () => {
      const plainText = 'concurrent test'
      const password = 'password123'

      const promises = Array(10)
        .fill(null)
        .map(() => encrypt(plainText, password))

      const results = await Promise.all(promises)

      // All should succeed
      expect(results).toHaveLength(10)

      // All should be unique
      const salts = results.map((r) => r.salt)
      const uniqueSalts = new Set(salts)
      expect(uniqueSalts.size).toBe(10)
    })
  })

  describe('Real-world Scenarios', () => {
    test('should handle vault password storage scenario', async () => {
      const vaultData = {
        name: 'Gmail Account',
        username: 'user@gmail.com',
        password: 'SuperSecret123!',
        note: 'Personal email account'
      }

      const plainText = JSON.stringify(vaultData)
      const masterPassword = 'myMasterPassword123!'

      const kdfParams = {
        memoryCost: 2 ** 16, // 64 MB
        timeCost: 3,
        parallelism: 1
      }

      // Simulate storage
      const encrypted = await encrypt(plainText, masterPassword, kdfParams)

      // Store in "database" (simulate)
      const storedInDB = {
        id: 'vault_item_123',
        user_id: 'user_456',
        password_encrypted: encrypted.data,
        salt: encrypted.salt,
        iv: encrypted.iv,
        tag: encrypted.tag,
        kdf_type: 'argon2id',
        kdf_params: kdfParams
      }

      // Simulate retrieval and decryption
      const retrievedEncrypted = {
        data: storedInDB.password_encrypted,
        salt: storedInDB.salt,
        iv: storedInDB.iv,
        tag: storedInDB.tag
      }

      const decrypted = await decrypt(
        retrievedEncrypted,
        masterPassword,
        storedInDB.kdf_params
      )

      const recoveredData = JSON.parse(decrypted)
      expect(recoveredData).toEqual(vaultData)
    })

    test('should handle multiple vault items with same master password', async () => {
      const masterPassword = 'userMasterPassword'

      const items = [
        { name: 'Gmail', password: 'gmail_pass' },
        { name: 'Facebook', password: 'fb_pass' },
        { name: 'Twitter', password: 'tw_pass' }
      ]

      // Encrypt all items
      const encryptedItems = await Promise.all(
        items.map((item) => encrypt(item.password, masterPassword))
      )

      // Decrypt all items
      const decryptedPasswords = await Promise.all(
        encryptedItems.map((enc) => decrypt(enc, masterPassword))
      )

      // Verify
      expect(decryptedPasswords[0]).toBe('gmail_pass')
      expect(decryptedPasswords[1]).toBe('fb_pass')
      expect(decryptedPasswords[2]).toBe('tw_pass')
    })

    test('should handle key rotation scenario (re-encrypt with new password)', async () => {
      const plainText = 'sensitive data'
      const oldMasterPassword = 'oldPassword123'
      const newMasterPassword = 'newPassword456'

      // Encrypt with old password
      const encrypted1 = await encrypt(plainText, oldMasterPassword)

      // Decrypt with old password
      const decrypted1 = await decrypt(encrypted1, oldMasterPassword)

      // Re-encrypt with new password
      const encrypted2 = await encrypt(decrypted1, newMasterPassword)

      // Decrypt with new password
      const decrypted2 = await decrypt(encrypted2, newMasterPassword)

      expect(decrypted2).toBe(plainText)

      // Old password should not work on new encryption
      await expect(decrypt(encrypted2, oldMasterPassword)).rejects.toThrow()
    })
  })
})
