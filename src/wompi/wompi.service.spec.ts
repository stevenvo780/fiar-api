import { UnauthorizedException } from '@nestjs/common';
import crypto from 'crypto';
import { WompiService } from './wompi.service';

describe('WompiService validateSignature', () => {
  const service = new WompiService({} as any, {} as any);
  beforeEach(() => {
    process.env.WOMPI_EVENTS_SECRET = 'secret';
  });
  it('validates a correct signature', () => {
    const payload: any = {
      signature: { checksum: '', properties: ['transaction.id'] },
      timestamp: '1',
      data: { transaction: { id: 10 } },
    };
    const hmac = crypto.createHash('sha256');
    const checksum = hmac
      .update('10' + payload.timestamp + 'secret')
      .digest('hex')
      .toUpperCase();
    payload.signature.checksum = checksum;
    expect(() => (service as any).validateSignature(payload)).not.toThrow();
  });

  it('throws on invalid checksum', () => {
    const payload: any = {
      signature: { checksum: 'bad', properties: ['transaction.id'] },
      timestamp: '1',
      data: { transaction: { id: 10 } },
    };
    expect(() => (service as any).validateSignature(payload)).toThrow(
      UnauthorizedException,
    );
  });
});
