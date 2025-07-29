import { encrypt, decrypt } from './encrypt';

describe('encrypt/decrypt utilities', () => {
  it('should encrypt and decrypt back to original string', () => {
    const secret = 'mysecret';
    const data = 'hello world';
    const encrypted = encrypt(data, secret);
    expect(encrypted).toBeDefined();
    const decrypted = decrypt(encrypted, secret);
    expect(decrypted).toBe(data);
  });

  it('should throw error when no secret provided', () => {
    expect(() => encrypt('data', undefined as any)).toThrow('No secret provided');
    expect(() => decrypt('abc', undefined as any)).toThrow('No secret provided');
  });

  it('should throw error when no data provided', () => {
    expect(() => encrypt('', 'secret')).toThrow('No data provided');
    expect(() => decrypt('', 'secret')).toThrow('No encrypted data provided');
  });
});
