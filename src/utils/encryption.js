const crypto = require("crypto");
const argon2 = require("argon2");

const ALGORITHM = "aes-256-gcm";

async function deriveKey(masterPassword, salt, params = {}) {
  const hash = await argon2.hash(masterPassword, {
    type: argon2.argon2id,
    memoryCost: params.memoryCost || 2 ** 16,
    timeCost: params.timeCost || 3,
    parallelism: params.parallelism || 1,
    hashLength: 32,
    raw: true,
    salt: Buffer.from(salt, "hex"),
  });
  return crypto.createHash("sha256").update(hash).digest();
}

exports.encrypt = async (plainText, masterPassword, params = {}, aad = null) => {
  const iv = crypto.randomBytes(12);       // GCM IV = 12 bytes
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await deriveKey(masterPassword, salt, params);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  if (aad) cipher.setAAD(Buffer.from(aad, "utf8"));

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    salt,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    data: encrypted.toString("hex"),
  };
};

exports.decrypt = async (encryptedObj, masterPassword, params = {}, aad = null) => {
  const { salt, iv, tag, data } = encryptedObj;
  const key = await deriveKey(masterPassword, salt, params);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "hex"));
  if (aad) decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(data, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};
