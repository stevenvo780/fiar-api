import crypto from 'crypto';

export function encrypt(data: string, secret: string | undefined): string {
  if (!data) {
    throw new Error('No data provided');
  }
  if (!secret) {
    throw new Error('No secret provided');
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    crypto.createHash('sha256').update(secret).digest(),
    iv,
  );
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(
  encryptedData: string,
  secret: string | undefined,
): string {
  if (!encryptedData) {
    throw new Error('No encrypted data provided');
  }
  if (!secret) {
    throw new Error('No secret provided');
  }
  const textParts = encryptedData.split(':');
  const iv = Buffer.from(textParts[0], 'hex');
  const encryptedText = Buffer.from(textParts.slice(1).join(':'), 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    crypto.createHash('sha256').update(secret).digest(),
    iv,
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
