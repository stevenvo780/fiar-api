import { Injectable, INestApplication } from '@nestjs/common';

@Injectable()
export class AppProvider {
  static closeConnection() {
    throw new Error('Method not implemented.');
  }
  private app: INestApplication;

  setApp(app: INestApplication) {
    this.app = app;
  }

  getApp(): INestApplication {
    return this.app;
  }
}

export default AppProvider;
