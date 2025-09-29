import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getWelcome(): string {
    return 'Welcome to EAMS API. To get started, please visit https://documentation.eams.com.';
  }
}
