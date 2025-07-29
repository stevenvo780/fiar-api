import { AppService } from './app.service';
import admin from './utils/firebase-admin.config';
import { Connection } from 'typeorm';

jest.mock('./utils/firebase-admin.config', () => ({
  __esModule: true,
  default: { auth: jest.fn() },
}));

describe('AppService', () => {
  let service: AppService;
  let connection: Partial<Connection>;

  beforeEach(() => {
    connection = { query: jest.fn().mockResolvedValue(1) } as any;
    service = new AppService(connection as Connection);
  });

  it('getHello should return greeting', () => {
    expect(service.getHello()).toBe('Hello World!');
  });

  it('getStatus should return connection statuses', async () => {
    const result = await service.getStatus();
    expect(result).toEqual({ database: 'Connected', firebase: 'Connected' });
  });
});
